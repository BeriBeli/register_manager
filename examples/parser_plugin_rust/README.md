# Parser Plugin (Rust/WASM)

This is a Rust-based WebAssembly plugin for the Register Manager, designed to parse Excel files into the IP-XACT compatible JSON format.

## Features
- Parses `Version`, `Address Map`, and Block sheets.
- Extracts Registers, Fields, Access attributes, and Reset values.
- Compiles to WASM for browser-side execution.

## Excel Format Requirements

### Sheet: "Version"
| Row | Column A | Column B | Column C | Column D | Column E |
|-----|----------|----------|----------|----------|----------|
| 1   | Header   | Vendor   | Library  | Name     | Version  |
| 2   | Data     | MyCorp   | MyLib    | MyChip   | 1.0.0    |

### Sheet: "Address Map"
A list of memory blocks.
| Block Name | Offset | Range |
|------------|--------|-------|
| MainBlock  | 0x0    | 0x100 |

### Sheet: [Block Name] (e.g., "MainBlock")
Defines registers within the block.
| address | register_name | field_name | bit_offset | access | reset_value | description |
|---------|---------------|------------|------------|--------|-------------|-------------|
| 0x0     | CTRL          | EN         | [0]        | RW     | 0           | Enable bit  |
|         |               | MODE       | [2:1]      | RW     | 0           | Operation Mode|
| 0x4     | STATUS        | READY      | [0]        | RO     | 0           | Ready flag  |

- **Merged Cells**: You can leave `address` and `register_name` empty for subsequent fields of the same register.
- **Bit Format**: Supports `[MSB:LSB]`, `MSB:LSB`, `[BIT]`, or `BIT`.

## Build Instructions

### Prerequisites
- Rust (latest stable)
- `wasm-bindgen-cli`: `cargo install wasm-bindgen-cli --locked`
- WASM target: `rustup target add wasm32-unknown-unknown`

### Build
Run the following command to build the `.wasm` file:

```bash
cargo build --release --target wasm32-unknown-unknown
wasm-bindgen --target web --out-dir pkg --out-name parser_plugin_rust --typescript \
  target/wasm32-unknown-unknown/release/parser_plugin_rust.wasm
```

The output will be in `pkg/`. You can upload the `parser_plugin_rust_bg.wasm` and `parser_plugin_rust.js` files to the Register Manager.

Note: You may need to rename the generated `.wasm` file to something more descriptive if desired.
