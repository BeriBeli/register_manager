# Example Excel Format

Both parser plugins expect the same Excel format. This document describes the required structure.

## Required Sheets

### 1. Version Sheet

**Sheet Name**: `Version`

| Column A | Column B | Column C | Column D | Column E |
|----------|----------|----------|----------|----------|
| Header   | Vendor   | Library  | Name     | Version  |
| Data     | YourCorp | YourLib  | YourChip | 1.0.0    |

**Purpose**: Metadata about the register set

### 2. Address Map Sheet

**Sheet Name**: `Address Map`

| Block Name | Offset | Range |
|------------|--------|-------|
| MainBlock  | 0x0    | 0x100 |
| AuxBlock   | 0x100  | 0x80  |

**Purpose**: Defines memory blocks and their address ranges

### 3. Block Sheets (one per block)

**Sheet Name**: Same as block name (e.g., `MainBlock`)

| address | register_name | field_name | bit_offset | access | reset_value | description |
|---------|---------------|------------|------------|--------|-------------|-------------|
| 0x0     | CTRL          | EN         | [0]        | RW     | 0           | Enable bit  |
|         |               | MODE       | [2:1]      | RW     | 0           | Mode select |
| 0x4     | STATUS        | READY      | [0]        | RO     | 0           | Ready flag  |
|         |               | ERROR      | [1]        | RO     | 0           | Error flag  |

**Column Descriptions**:
- **address**: Register address (hex with 0x prefix or decimal). Can be merged for multi-field registers.
- **register_name**: Register name. Can be merged for multi-field registers.
- **field_name**: Bit field name within the register.
- **bit_offset**: Bit position(s). Formats: `[7:0]`, `7:0`, `[3]`, or `3`
- **access**: Access mode (`RW`, `RO`, `WO`, `W1C`, etc.)
- **reset_value**: Default value on reset (hex with 0x prefix or decimal)
- **description**: Human-readable description

## Merged Cells

For registers with multiple fields, you can merge the `address` and `register_name` cells:

```
| address | register_name | field_name | bit_offset | ... |
|---------|---------------|------------|------------|-----|
| 0x0     | CTRL          | EN         | [0]        | ... |
|         |               | MODE       | [2:1]      | ... |  ← address and register_name are empty
|         |               | RST        | [3]        | ... |  ← they inherit from above
```

Both parsers handle this automatically.

## Bit Offset Formats

All of these are valid:

- `[7:0]` - Bits 7 down to 0 (8 bits)
- `7:0` - Same as above (brackets optional)
- `[3]` - Single bit 3
- `3` - Same as above (brackets optional)
- `[15:8]` - Bits 15 down to 8 (8 bits)

## Access Modes

Common access modes:
- `RW` - Read/Write
- `RO` - Read Only
- `WO` - Write Only
- `W1C` - Write 1 to Clear
- `W1S` - Write 1 to Set
- `RC` - Read to Clear

## Tips

1. **Use consistent formatting**: Stick to either hex (0x) or decimal throughout
2. **Merge cells for clarity**: Makes multi-field registers easier to read
3. **Add descriptions**: They'll appear in generated documentation
4. **Test with small files first**: Validate your format before processing large files
5. **Check the example**: See `examples/example.xlsx` for a working example

## Customization

If your Excel format is different, you can:
- **Python Plugin**: Modify `parser.py` to match your format
- **Rust Plugin**: Modify the Rust source code

The plugin architecture is designed to be flexible!
