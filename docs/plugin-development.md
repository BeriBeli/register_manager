# Import Plugin Development Guide

This document describes how to develop import plugins for Register Manager. Plugins parse Excel/CSV files and convert them to the standard `ImportData` format.

## Plugin Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                  Register Manager                        │
├─────────────────────────────────────────────────────────┤
│  Frontend (Browser)                                      │
│    │                                                     │
│    ├─ Loads plugin list from: GET /api/import/plugins   │
│    ├─ User selects file + plugin                        │
│    └─ Calls plugin to parse file                        │
├─────────────────────────────────────────────────────────┤
│  Plugin (WASM/JavaScript)                                │
│    │                                                     │
│    ├─ Input: Excel/CSV binary data                      │
│    └─ Output: ImportData JSON                           │
├─────────────────────────────────────────────────────────┤
│  Backend                                                 │
│    └─ POST /api/import/execute → Creates project        │
└─────────────────────────────────────────────────────────┘
```

## ImportData Interface Specification

All import plugins **MUST** output JSON conforming to this TypeScript interface:

```typescript
interface ImportData {
  project: {
    name: string;         // Project identifier (e.g., "uart_controller")
    vendor: string;       // VLNV vendor (e.g., "mycompany")
    library: string;      // VLNV library (e.g., "ip")
    version: string;      // VLNV version (e.g., "1.0")
    displayName?: string; // Human-readable name
    description?: string; // Project description
  };
  
  memoryMaps: Array<{
    name: string;
    displayName?: string;
    description?: string;
    addressUnitBits?: number;  // Default: 8
    
    addressBlocks: Array<{
      name: string;
      baseAddress: string;     // Hex string, e.g., "0x1000"
      range: string;           // Size in bytes, e.g., "0x100"
      width?: number;          // Default: 32
      displayName?: string;
      description?: string;
      
      registers: Array<{
        name: string;
        addressOffset: string; // Hex string, e.g., "0x00"
        size?: number;         // Bits, default: 32
        displayName?: string;
        description?: string;
        
        fields: Array<{
          name: string;
          bitOffset: number;   // 0-based bit position
          bitWidth: number;    // Number of bits
          access?: string;     // "read-write", "read-only", "write-only", etc.
          resetValue?: string; // Hex string, e.g., "0x0"
          displayName?: string;
          description?: string;
        }>;
      }>;
    }>;
  }>;
}
```

## Plugin Registration

Plugins are registered in the backend file:
`packages/backend/src/routes/import.ts`

```typescript
const availablePlugins: ImportPlugin[] = [
  {
    id: "my-plugin",              // Unique identifier
    name: "My Excel Format",      // Display name
    description: "Description",   // Brief description
    type: "wasm",                 // "wasm" or "builtin"
    wasmUrl: "/plugins/my.wasm",  // URL to WASM file
    supportedExtensions: [".xlsx", ".xls"],
  },
];
```

## WASM Plugin Development (Rust)

### Project Setup

```toml
# Cargo.toml
[package]
name = "my-import-plugin"
version = "0.1.0"
edition = "2021"

[lib]
crate-type = ["cdylib"]

[dependencies]
wasm-bindgen = "0.2"
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
calamine = "0.26"  # For Excel parsing
```

### Implementation Example

```rust
use wasm_bindgen::prelude::*;
use serde::{Serialize, Deserialize};

#[derive(Serialize)]
struct ImportData {
    project: ImportProject,
    #[serde(rename = "memoryMaps")]
    memory_maps: Vec<ImportMemoryMap>,
}

#[derive(Serialize)]
struct ImportProject {
    name: String,
    vendor: String,
    library: String,
    version: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    #[serde(rename = "displayName")]
    display_name: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    description: Option<String>,
}

// ... define other structs (ImportMemoryMap, ImportAddressBlock, etc.)

#[wasm_bindgen]
pub fn parse_excel(data: &[u8]) -> Result<JsValue, JsError> {
    // 1. Parse Excel file using calamine or similar
    let workbook = calamine::open_workbook_auto_from_rs(std::io::Cursor::new(data))
        .map_err(|e| JsError::new(&format!("Failed to open workbook: {}", e)))?;
    
    // 2. Extract data from sheets
    let import_data = parse_workbook(&workbook)?;
    
    // 3. Return as JSON
    Ok(serde_wasm_bindgen::to_value(&import_data)?)
}
```

### Building

```bash
# Add WASM target
rustup target add wasm32-unknown-unknown

# Install wasm-bindgen CLI
cargo install wasm-bindgen-cli --locked

# Build the WASM binary
cargo build --release --target wasm32-unknown-unknown

# Generate JS glue + .wasm for web
wasm-bindgen --target web --out-dir pkg --out-name my_import_plugin --typescript \
  target/wasm32-unknown-unknown/release/my_import_plugin.wasm

# Output files:
# pkg/my_import_plugin.js
# pkg/my_import_plugin_bg.wasm
```

### Deployment

1. Copy `.wasm` file to: `packages/frontend/public/plugins/`
2. Register plugin in backend `availablePlugins` array
3. Restart the application

## JavaScript Plugin Development

For simpler plugins, you can use JavaScript:

```javascript
// my-plugin.js
export async function parseExcel(arrayBuffer) {
  // Use SheetJS or similar library
  const XLSX = await import('xlsx');
  const workbook = XLSX.read(arrayBuffer, { type: 'array' });
  
  // Parse sheets and return ImportData
  return {
    project: {
      name: "example",
      vendor: "mycompany",
      library: "ip",
      version: "1.0"
    },
    memoryMaps: [
      // ... parsed data
    ]
  };
}
```

## Validation Rules

The backend validates imported data against these rules:

1. **Required fields**: `project.name`, `project.vendor`, `project.library`, `project.version`
2. **Name format**: Should be valid identifier (letters, numbers, underscores)
3. **Address format**: Hex strings should start with "0x"
4. **Field ranges**: `bitOffset + bitWidth` should not exceed register size
5. **No overlapping fields**: Fields within a register should not overlap

## Access Type Values

Supported values for `field.access`:
- `"read-write"` (default)
- `"read-only"`
- `"write-only"`
- `"read-writeOnce"`
- `"writeOnce"`

## Example: irgen Format

The irgen plugin expects Excel files with:

1. **version sheet** - Contains VLNV info (VENDOR, LIBRARY, NAME, VERSION)
2. **address map sheet** - Lists address blocks (BLOCK, OFFSET, RANGE)
3. **Per-block sheets** - Named after blocks, containing registers and fields

See [irgen documentation](https://github.com/BeriBeli/irgen) for details.

## Testing Your Plugin

1. Start Register Manager: `bun run dev`
2. Navigate to Projects page
3. Click "Import Excel" button
4. Select your plugin from the list
5. Upload a test file
6. Verify the preview shows correct data
7. Complete import and verify project structure

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Plugin not showing | Check backend `availablePlugins` array |
| WASM loading fails | Verify file path and CORS settings |
| Parse error | Check browser console for error details |
| Invalid data | Validate against ImportData schema |
