use wasm_bindgen::prelude::*;
use calamine::{Reader, Xlsx, open_workbook_from_rs};
use std::io::Cursor;
use std::collections::HashMap;
use serde_wasm_bindgen::to_value;

mod error;
mod excel;
mod parser;
mod schema;
mod types;

use excel::ToDataFrame;
use parser::parse_register;
use schema::{df_to_compo, df_to_blks, df_to_regs, Component};
use types::*;
use crate::error::Error;

#[wasm_bindgen]
pub fn parse_excel(data: &[u8]) -> Result<JsValue, JsError> {
    let cursor = Cursor::new(data);
    let mut wb: Xlsx<_> = open_workbook_from_rs(cursor)
        .map_err(|e| JsError::new(&format!("Failed to open Excel: {}", e)))?;

    // Load all sheets into DataFrames
    let sheets = wb.worksheets();
    let mut df_map: HashMap<String, polars::prelude::DataFrame> = sheets
        .iter()
        .map(|(sheet_name, range_data)| {
            // Normalize key to lowercase for case-insensitivity
             range_data.to_data_frame()
                .map(|df| (sheet_name.trim().to_lowercase(), df))
        })
        .collect::<Result<HashMap<_, _>, _>>()
        .map_err(|e| JsError::new(&format!("DataFrame conversion error: {}", e)))?;

    // Closure to find sheet by name (already lowercased keys)
    let mut get_df = |name: &str| -> Result<polars::prelude::DataFrame, Error> {
        df_map.remove(&name.to_lowercase())
            .ok_or_else(|| Error::NotFound(name.into()))
    };

    let compo = {
        let compo_df = get_df("version").map_err(|e| JsError::new(&format!("{}", e)))?;

        df_to_compo(compo_df, || {
            let blks_df = get_df("address_map")?;

            df_to_blks(blks_df, |s| {
                // If sheet not found directly, try case insensitive lookup (already done by map keys)
                // But `s` comes from "BLOCK" column in address_map.
                let regs_df = get_df(s)?;
                let parsered_df = parse_register(regs_df)?;
                df_to_regs(parsered_df)
            })
        }).map_err(|e| JsError::new(&format!("Parsing error: {}", e)))?
    };

    // Convert internal Component to ImportData logic
    let import_data = convert_component_to_import_data(compo);

    to_value(&import_data).map_err(|e| JsError::new(&format!("Serialization error: {}", e)))
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
    let address_blocks: Vec<ImportAddressBlock> = compo.blks.into_iter().map(|blk| {
        ImportAddressBlock {
            name: blk.name,
            base_address: ensure_hex(blk.offset),
            range: ensure_hex(blk.range),
            width: blk.size.parse().unwrap_or(32),
            // ...
            registers: blk.regs.into_iter().map(|reg| {
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
                    fields: reg.fields.into_iter().map(|f| {
                        ImportField {
                            name: f.name,
                            description: Some(f.desc),
                            bit_offset: f.offset.parse().unwrap_or(0),
                            bit_width: f.width.parse().unwrap_or(1),
                            access: f.attr,
                            reset_value: f.reset,
                        }
                    }).collect(),
                }
            }).collect(),
        }
    }).collect();

    ImportData {
        project: ImportProject {
            name: compo.name,
            description: None,
            vendor: compo.vendor,
            library: compo.library,
            version: if compo.version.trim().is_empty() { "0.1.0".to_string() } else { compo.version },
        },
        memory_maps: vec![ImportMemoryMap {
            name: "default_map".to_string(),
            address_blocks,
        }],
    }
}
