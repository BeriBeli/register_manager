"""
Excel Parser for Register Manager (Python/WASM Version)

This module parses Excel files containing register definitions and converts
them to IP-XACT compatible JSON format.
"""

import json
from io import BytesIO
from typing import Any, Dict, List, Optional
import pandas as pd


def parse_bit_range(bit_str: str) -> tuple[int, int]:
    """
    Parse bit range string like '[7:0]', '7:0', '[3]', or '3'.
    Returns (msb, lsb) tuple.
    """
    bit_str = str(bit_str).strip()
    # Remove brackets if present
    bit_str = bit_str.strip('[]')
    
    if ':' in bit_str:
        parts = bit_str.split(':')
        try:
            msb = int(parts[0].strip())
            lsb = int(parts[1].strip())
            return (msb, lsb)
        except ValueError:
            return (0, 0)
    else:
        # Single bit
        try:
            bit = int(bit_str.strip())
            return (bit, bit)
        except ValueError:
            return (0, 0)


def parse_int_safe(val: Any) -> int:
    """Parse integer from string or number, supporting hex 0x prefix."""
    if pd.isna(val):
        return 0
    s = str(val).strip()
    if not s or s.lower() == 'none' or s == '':
        return 0
    try:
        if s.lower().startswith('0x'):
            return int(s, 16)
        # Handle cases like "10.0" coming from Excel
        return int(float(s))
    except (ValueError, TypeError):
        return 0


def get_actual_sheet_name(xls: pd.ExcelFile, target_name: str) -> str | None:
    """Find sheet name case-insensitive."""
    if target_name in xls.sheet_names:
        return target_name
    
    # Try case-insensitive match
    target_lower = target_name.lower()
    for name in xls.sheet_names:
        if name.lower() == target_lower:
            return name
        # Try finding "Address Map" as "address_map"
        if target_lower.replace(" ", "_") == name.lower():
            return name
    return None


def parse_version_sheet(xls: pd.ExcelFile) -> Dict[str, str]:
    """Parse the Version sheet."""
    version_info = {
        'vendor': '',
        'library': '',
        'name': '',
        'version': ''
    }
    
    sheet_name = get_actual_sheet_name(xls, "Version")
    if not sheet_name:
        return version_info

    try:
        # Read header=None to access by index
        df = pd.read_excel(xls, sheet_name=sheet_name, header=None)
        
        # Expecting data in row 2 (index 1)
        if len(df) >= 2:
            row = df.iloc[1]
            # Safe access to indices
            version_info['vendor'] = str(row[1]) if len(row) > 1 and not pd.isna(row[1]) else ''
            version_info['library'] = str(row[2]) if len(row) > 2 and not pd.isna(row[2]) else ''
            version_info['name'] = str(row[3]) if len(row) > 3 and not pd.isna(row[3]) else ''
            version_info['version'] = str(row[4]) if len(row) > 4 and not pd.isna(row[4]) else ''
            
    except Exception:
        pass
    
    return version_info


def parse_address_map_sheet(xls: pd.ExcelFile) -> List[Dict[str, Any]]:
    """Parse the Address Map sheet."""
    blocks = []
    
    sheet_name = get_actual_sheet_name(xls, "Address Map")
    if not sheet_name:
        return blocks

    try:
        df = pd.read_excel(xls, sheet_name=sheet_name, header=None)
        
        # Skip header row (0), start from row 1
        if len(df) > 1:
            data_df = df.iloc[1:].copy()
            
            # Identify columns by position: 0=BlockName, 1=Offset, 2=Range
            # Drop empty rows where block name is null
            data_df = data_df[data_df.iloc[:, 0].notna()]
            
            for _, row in data_df.iterrows():
                block_name = str(row.iloc[0]).strip()
                offset = parse_int_safe(row.iloc[1]) if len(row) > 1 else 0
                range_val = parse_int_safe(row.iloc[2]) if len(row) > 2 else 0
                
                blocks.append({
                    'name': block_name,
                    'baseAddress': offset,
                    'range': range_val
                })
                
    except Exception:
        pass
            
    return blocks



import re

def expand_register_pattern(df: pd.DataFrame) -> pd.DataFrame:
    """
    Expand rows with patterns like 'reg{n}, n=range(3)' into multiple registers.
    Replicates logic from Rust plugin.
    
    Args:
        df: DataFrame with standardized columns ['address_raw', 'reg_name', 'field_name', ...]
        
    Returns:
        Expanded DataFrame
    """
    # Helper to parse range string "3" -> [0,1,2], "1,3" -> [1,2] etc.
    # Matches simple Python range(start, stop, step) or just numbers
    def parse_range(range_str: str) -> List[int]:
        if not range_str:
            return []
        try:
            # Clean string
            range_str = range_str.strip()
            parts = [int(p.strip()) for p in range_str.split(',')]
            
            if len(parts) == 1:
                return list(range(parts[0]))
            elif len(parts) == 2:
                return list(range(parts[0], parts[1]))
            elif len(parts) == 3:
                return list(range(parts[0], parts[1], parts[2]))
            return []
        except Exception:
            return []

    rows = []
    
    # Identify groups by original register definition lines (where reg_name is present in original file)
    # We essentially need to group by the "block of lines" belonging to one register definition.
    # Since we already did ffill, we group by 'reg_name'.
    # BUT, if we have multiple registers with same name (not expanded yet), groupby handles them together.
    # We must treat contiguous blocks.
    
    # Assign a group ID to each contiguous block of the same register name
    df['group'] = (df['reg_name'] != df['reg_name'].shift()).cumsum()
    
    grouped = df.groupby('group')
    
    for _, group_df in grouped:
        first_row = group_df.iloc[0]
        reg_name_full = str(first_row['reg_name'])
        
        # Check for pattern "name{n}, n=range(...)"
        # Regex: (.*)\{n\},\s*n\s*=\s*range\(([^)]+)\)
        match = re.search(r"(.*?)\{n\},\s*n\s*=\s*range\(([^)]+)\)", reg_name_full)
        
        if match:
            base_name = match.group(1).strip()
            range_args = match.group(2)
            indices = parse_range(range_args)
            
            # Calculate total width of one register instance in bytes
            # Sum bit widths of fields -> divide by 8 -> ceil?
            # Rust logic: sum(width) over addr.
            # Here we just iterate fields.
            # Assuming fields are unique to the register definition block.
            
            # We need to calculate bit width of each field to sum up total size
            reg_size_bits = 0
            for _, row in group_df.iterrows():
                if not pd.isna(row['bit_offset']):
                    bit_str = str(row['bit_offset'])
                    msb, lsb = parse_bit_range(bit_str)
                    reg_size_bits += (msb - lsb + 1)
            
            # Default to 32 bits if no fields or calculated 0?
            # Or use explicit size if available (not in standard columns)
            # Rust logic divides sum by 8 to get bytes.
            # Let's align to 4 bytes (32-bit) if unsure, or calculate.
            # Usually registers are 32-bit aligned.
            # Let's calculate offset stride.
            # If reg_size_bits is 0 (e.g. no fields yet), default to 32.
            stride_bytes = (reg_size_bits + 7) // 8
            if stride_bytes == 0:
                stride_bytes = 4 # Default 32-bit
            
            base_addr_int = parse_int_safe(first_row['address_raw'])
            
            # Expand!
            for idx_step, idx_val in enumerate(indices):
                # New Register Name: basename_0, basename_1 ... (Rust seems to append index)
                # Rust logic: base_reg + "_" + rank
                # rank is dense rank (0-based index of the expansion)
                
                new_reg_name = f"{base_name}_{idx_step}"
                
                # New Address: base + (index * stride)
                # Rust logic: base_addr + n_series * bytes
                new_addr = base_addr_int + (idx_step * stride_bytes)
                
                # Copy fields for this instance
                for _, row in group_df.iterrows():
                    new_row = row.copy()
                    new_row['reg_name'] = new_reg_name
                    new_row['address_raw'] = f"0x{new_addr:X}"
                    # Description replacement? logic doesn't specify, we keep as is.
                    rows.append(new_row)
                    
        else:
            # No expansion, just keep rows
            for _, row in group_df.iterrows():
                rows.append(row)
                
    return pd.DataFrame(rows).drop(columns=['group'])

def parse_block_sheet(xls: pd.ExcelFile, block_name: str) -> List[Dict[str, Any]]:
    """
    Parse a block sheet containing register definitions.
    """
    registers_map = {}
    
    sheet_name = get_actual_sheet_name(xls, block_name)
    if not sheet_name:
        return []

    try:
        # Use header=None to get raw grid
        df = pd.read_excel(xls, sheet_name=sheet_name, header=None)
        
        if len(df) <= 1:
            return []
            
        # Slice to skip header
        df = df.iloc[1:].copy()
        
        # Rename columns to standardized names for easier processing
        col_names = [
            "address_raw", "reg_name", "field_name", "bit_offset", 
            "access", "reset", "desc"
        ]
        # Ensure df has enough columns
        while len(df.columns) < len(col_names):
            df[len(df.columns)] = None
            
        df = df.iloc[:, :len(col_names)]
        df.columns = col_names
        
        # Filter: need reg_name or field_name
        df = df[df["reg_name"].notna() | df["field_name"].notna()]
        
        # Forward fill Address and Register Name
        df["address_raw"] = df["address_raw"].ffill()
        df["reg_name"] = df["reg_name"].ffill()
        
        # Drop leading empties
        df = df[df["reg_name"].notna()]
        
        # Apply Expansion Logic
        df = expand_register_pattern(df)
        
        # Iterate and build structure
        for _, row in df.iterrows():
            reg_name = str(row["reg_name"]).strip()
            
            if reg_name not in registers_map:
                addr_val = parse_int_safe(row["address_raw"])
                registers_map[reg_name] = {
                    'name': reg_name,
                    'addressOffset': addr_val,
                    'size': 32,
                    'fields': []
                }
            
            # Process field
            f_name_raw = row["field_name"]
            if not pd.isna(f_name_raw):
                f_name = str(f_name_raw).strip()
                bit_offset_val = row["bit_offset"] if not pd.isna(row["bit_offset"]) else "0"
                msb, lsb = parse_bit_range(str(bit_offset_val))
                
                access_val = row["access"]
                access = str(access_val).strip().upper() if not pd.isna(access_val) else "RW"
                
                reset_val = parse_int_safe(row["reset"])
                
                desc_val = row["desc"]
                desc = str(desc_val).strip() if not pd.isna(desc_val) else ""
                
                field = {
                    'name': f_name,
                    'bitOffset': lsb,
                    'bitWidth': msb - lsb + 1,
                    'access': access,
                    'resetValue': reset_val,
                    'description': desc
                }
                registers_map[reg_name]['fields'].append(field)
                
    except Exception:
        # Block sheet might not exist or be unreadable
        pass
        
    return list(registers_map.values())


def parse_excel(file_bytes: bytes) -> Dict[str, Any]:
    """
    Main entry point for parsing Excel file.
    """
    try:
        # Load workbook using pandas (wraps openpyxl)
        xls = pd.ExcelFile(BytesIO(file_bytes), engine='openpyxl')
        
        result = {
            'version': parse_version_sheet(xls),
            'addressBlocks': parse_address_map_sheet(xls)
        }
        
        # Parse each block sheet
        for block in result['addressBlocks']:
            block_name = block['name']
            block['registers'] = parse_block_sheet(xls, block_name)
        
        return result
        
    except Exception as e:
        raise Exception(f"Failed to parse Excel file: {str(e)}")


def parse_excel_json(file_bytes: bytes) -> str:
    """
    Parse Excel and return JSON string.
    """
    result = parse_excel(file_bytes)
    return json.dumps(result)
