"""Parser Plugin Python - WASM-based Excel parser for Register Manager."""

from .parser import parse_excel, parse_excel_json

__version__ = "0.1.0"
__all__ = ["parse_excel", "parse_excel_json"]
