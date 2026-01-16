# Parser Plugin (Python/WASM)

A Python-based WebAssembly plugin for Register Manager that parses Excel files into IP-XACT compatible JSON format using Pyodide.

## Features
- Parses `Version`, `Address Map`, and Block sheets from Excel files
- Extracts Registers, Fields, Access attributes, and Reset values
- Runs Python code in the browser via Pyodide (CPython in WASM)
- Easy to customize for different Excel formats

## Why Python WASM?

While the Rust version offers excellent performance, Python provides:
- **Easier customization** for teams familiar with Python
- **Rich ecosystem** of data processing libraries (openpyxl, pandas)
- **Rapid prototyping** for custom Excel formats
- **Lower barrier to entry** for non-systems programmers

## Prerequisites

- [uv](https://github.com/astral-sh/uv) - Fast Python package installer and resolver
- Python 3.11+ (managed by uv)

## Setup

### Install uv (if not already installed)

```bash
# macOS/Linux
curl -LsSf https://astral.sh/uv/install.sh | sh

# Windows
powershell -c "irm https://astral.sh/uv/install.ps1 | iex"
```

### Install Dependencies

```bash
# Install all dependencies including dev tools
uv sync
```

## Development

### Testing Locally

```bash
# Test with the example Excel file
uv run python -m tests.test_parser

# Or with a custom file
uv run python -m tests.test_parser path/to/your/file.xlsx
```

### Code Quality

```bash
# Format code
uv run ruff format .

# Lint code
uv run ruff check .

# Type check
uv run mypy src/
```

## Build & Deploy

This is a **pure Python plugin** - no compilation needed! Just copy the files:

```bash
# Create dist directory
mkdir -p dist

# Copy the Python parser
cp src/parser_plugin_python/parser.py dist/

# Copy the JavaScript wrapper
cp wrapper.js dist/parser_plugin_python.js
```

That's it! No build tools, no compilation, just copy the source files.

## Deployment

Upload these files to the Register Manager admin interface:
- `dist/parser_plugin_python.js` - JavaScript entry point
- `dist/parser.py` - Python parser module

**Note**: The Pyodide runtime (~10MB) is loaded from CDN on first use and cached by the browser.

## How It Works

1. **Browser loads** `parser_plugin_python.js`
2. **JavaScript wrapper** loads Pyodide runtime from CDN (first time only)
3. **Pyodide installs** required packages (`openpyxl`)
4. **Python code** (`parser.py`) is loaded into Pyodide
5. **Excel parsing** happens in the browser using Python!

## Project Structure

```
parser_plugin_python/
├── src/
│   └── parser_plugin_python/
│       ├── __init__.py        # Package initialization
│       ├── parser.py          # Core parsing logic
│       └── py.typed           # Type checking marker
├── tests/
│   ├── __init__.py
│   └── test_parser.py         # Test script
├── wrapper.js                 # JavaScript/Pyodide wrapper
├── pyproject.toml             # Project metadata (uv/pip)
├── .gitignore
└── README.md
```

## Customization

Edit `src/parser_plugin_python/parser.py` to customize the parsing logic for your specific Excel format. The main function to modify is `parse_excel(file_bytes)`.

Key functions:
- `parse_excel()` - Main entry point
- `parse_version_sheet()` - Parse version metadata
- `parse_address_map_sheet()` - Parse memory blocks
- `parse_block_sheet()` - Parse registers and fields

## Excel Format

See `../EXCEL_FORMAT.md` for detailed Excel format requirements. The format is identical to the Rust parser.

## Performance Considerations

- **Initial Load**: Pyodide runtime (~10MB) is loaded on first use and cached
- **Parsing Speed**: Slower than Rust but acceptable for typical Excel files (<1000 registers)
- **Memory**: Higher memory usage due to Python runtime overhead

For maximum performance, use the Rust parser. For ease of customization, use this Python parser.

## Why uv?

This project uses [uv](https://github.com/astral-sh/uv) for dependency management:
- ⚡ **10-100x faster** than pip
- 🔒 **Deterministic** dependency resolution
- 🎯 **Simple** - one tool for everything
- 🚀 **Modern** - follows latest Python packaging standards
- 📦 **Compatible** with pip and standard pyproject.toml

## Comparison: Python vs Rust

| Aspect | Python (Pyodide) | Rust |
|--------|------------------|------|
| Performance | Good | Excellent |
| Bundle Size | ~10MB (runtime) | ~200KB |
| Customization | Very Easy | Moderate |
| Build Process | Copy files | Compile to WASM |
| Ecosystem | Rich (openpyxl, pandas) | Growing |
| Learning Curve | Low | Moderate-High |
| Best For | Custom formats, rapid iteration | Production, performance-critical |

## FAQ

**Q: Do I need to compile anything?**  
A: No! This is pure Python code. Just copy the files.

**Q: Why is the bundle so large?**  
A: The Pyodide runtime includes a full Python interpreter. But it's loaded from CDN and cached, so users only download it once.

**Q: Can I use other Python libraries?**  
A: Yes! Pyodide supports many popular packages. Just add them to the wrapper.js `loadPackage()` call.

**Q: Is this slower than Rust?**  
A: Yes, but for typical Excel files (<1000 registers), the difference is negligible for end users.

## License

MIT
