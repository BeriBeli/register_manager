use calamine::{open_workbook_from_rs, Reader, Xlsx};
use std::collections::HashMap;
use std::io::Cursor;

mod error;
mod excel;
mod parser;
mod schema;
mod types;

use crate::error::Error;
use excel::ToDataFrame;
use parser::parse_register;
use schema::{df_to_blks, df_to_compo, df_to_regs, Component};
use types::*;

pub fn parse_excel_to_import_data(data: &[u8]) -> Result<ImportData, Error> {
    let cursor = Cursor::new(data);
    let mut wb: Xlsx<_> = open_workbook_from_rs(cursor)?;

    // Load all sheets into DataFrames
    let sheets = wb.worksheets();
    let mut df_map: HashMap<String, polars::prelude::DataFrame> = sheets
        .iter()
        .map(|(sheet_name, range_data)| {
            // Normalize key to lowercase for case-insensitivity
            range_data
                .to_data_frame()
                .map(|df| (sheet_name.trim().to_lowercase(), df))
        })
        .collect::<Result<HashMap<_, _>, _>>()
        .map_err(Error::from)?;

    // Closure to find sheet by name (already lowercased keys)
    let mut get_df = |name: &str| -> Result<polars::prelude::DataFrame, Error> {
        df_map
            .remove(&name.to_lowercase())
            .ok_or_else(|| Error::NotFound(name.into()))
    };

    let compo = {
        let compo_df = get_df("version")?;

        df_to_compo(compo_df, || {
            let blks_df = get_df("address_map")?;

            df_to_blks(blks_df, |s| {
                // If sheet not found directly, try case insensitive lookup (already done by map keys)
                // But `s` comes from "BLOCK" column in address_map.
                let regs_df = get_df(s)?;
                let parsered_df = parse_register(regs_df)?;
                df_to_regs(parsered_df)
            })
        })
        .map_err(Error::from)?
    };

    // Convert internal Component to ImportData logic
    let import_data = convert_component_to_import_data(compo);

    Ok(import_data)
}

#[cfg(target_arch = "wasm32")]
mod wasm_exports {
    use super::*;
    use serde_wasm_bindgen::to_value;
    use wasm_bindgen::prelude::*;

    #[wasm_bindgen]
    pub fn parse_excel(data: &[u8]) -> Result<JsValue, JsError> {
        let import_data = parse_excel_to_import_data(data)
            .map_err(|e| JsError::new(&format!("Parsing error: {}", e)))?;
        to_value(&import_data).map_err(|e| JsError::new(&format!("Serialization error: {}", e)))
    }
}

fn ensure_hex(s: String) -> String {
    let s = s.trim();
    if s.to_lowercase().starts_with("0x") {
        s.to_string()
    } else {
        // Try parse as Int
        if let Ok(i) = s.parse::<u64>() {
            format!("0x{:X}", i)
        } else {
            s.to_string() // Fallback
        }
    }
}

fn convert_component_to_import_data(compo: Component) -> ImportData {
    // ...
    let address_blocks: Vec<ImportAddressBlock> = compo
        .blks
        .into_iter()
        .map(|blk| {
            ImportAddressBlock {
                name: blk.name,
                base_address: ensure_hex(blk.offset),
                range: ensure_hex(blk.range),
                width: blk.size.parse().unwrap_or(32),
                // ...
                registers: blk
                    .regs
                    .into_iter()
                    .map(|reg| {
                        ImportRegister {
                            name: reg.name,
                            address_offset: reg.offset, // Parser ensures hex string
                            size: reg.size.parse().unwrap_or(32),
                            description: None, // schema::Register doesn't capture description?
                            // schema::Register def in base.rs: name, offset, size, fields.
                            // FIELDS capture description.
                            // Register description??
                            // parser.rs agg includes "DESCRIPTION".
                            // But `df_to_regs` DOES NOT extract Register Description!
                            // checking base.rs df_to_regs:
                            // let name = extract_str("REG")?; ...
                            // It DOES NOT extract DESCRIPTION for the register itself.
                            // irgen seems to miss register description or I missed it in base.rs?
                            // base.rs lines 115-186: no generic description extraction.
                            // But fields have description.
                            fields: reg
                                .fields
                                .into_iter()
                                .map(|f| {
                                    ImportField {
                                        name: f.name,
                                        description: Some(f.desc),
                                        bit_offset: f.offset.parse().unwrap_or(0),
                                        bit_width: f.width.parse().unwrap_or(1),
                                        access: match f.attr.to_uppercase().as_str() {
                                            "RW" | "READ-WRITE" => "read-write".to_string(),
                                            "RO" | "READ-ONLY" => "read-only".to_string(),
                                            "WO" | "WRITE-ONLY" => "write-only".to_string(),
                                            "W1C" | "WRITE-1-TO-CLEAR" => {
                                                "access-unused".to_string()
                                            } // Or handle appropriately if schema supports
                                            _ => "read-write".to_string(), // Default fallback better than "WO" via frontend logic
                                        },
                                        reset_value: f.reset,
                                    }
                                })
                                .collect(),
                        }
                    })
                    .collect(),
            }
        })
        .collect();

    ImportData {
        project: ImportProject {
            name: compo.name,
            description: None,
            vendor: compo.vendor,
            library: compo.library,
            version: if compo.version.trim().is_empty() {
                "0.1.0".to_string()
            } else {
                compo.version
            },
        },
        memory_maps: vec![ImportMemoryMap {
            name: "default_map".to_string(),
            address_blocks,
        }],
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn ensure_hex_handles_hex_decimal_and_fallback() {
        assert_eq!(ensure_hex("0x10".to_string()), "0x10");
        assert_eq!(ensure_hex("0X10".to_string()), "0X10");
        assert_eq!(ensure_hex(" 255 ".to_string()), "0xFF");
        assert_eq!(ensure_hex("not-a-number".to_string()), "not-a-number");
    }
}
