use serde::{Serialize, Deserialize};

#[derive(Serialize, Deserialize, Debug)]
pub struct ImportData {
    pub project: ImportProject,
    #[serde(rename = "memoryMaps")]
    pub memory_maps: Vec<ImportMemoryMap>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct ImportProject {
    pub name: String,
    pub description: Option<String>,
    pub vendor: String,
    pub library: String,
    pub version: String,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct VLNV {
    pub vendor: String,
    pub library: String,
    pub name: String,
    pub version: String,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct ImportMemoryMap {
    pub name: String,
    #[serde(rename = "addressBlocks")]
    pub address_blocks: Vec<ImportAddressBlock>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct ImportAddressBlock {
    pub name: String,
    #[serde(rename = "baseAddress")]
    pub base_address: String,
    pub range: String,
    pub width: u32,
    pub registers: Vec<ImportRegister>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct ImportRegister {
    pub name: String,
    #[serde(rename = "addressOffset")]
    pub address_offset: String,
    pub size: u32,
    pub description: Option<String>,
    pub fields: Vec<ImportField>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct ImportField {
    pub name: String,
    pub description: Option<String>,
    #[serde(rename = "bitOffset")]
    pub bit_offset: u32,
    #[serde(rename = "bitWidth")]
    pub bit_width: u32,
    pub access: String, // "read-write", "read-only", etc.
    #[serde(rename = "resetValue")]
    pub reset_value: String, // IP-XACT usually uses string for values (e.g. "0x0")
}
