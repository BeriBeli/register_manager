"""Test the parser with an example Excel file."""

import json
import sys
from pathlib import Path

from parser_plugin_python.parser import parse_excel


def main() -> None:
    """Test the parser with an example Excel file."""
    # Default example file
    example_file = Path(__file__).parent.parent.parent / "example.xlsx"

    # Allow custom file path
    if len(sys.argv) > 1:
        example_file = Path(sys.argv[1])

    if not example_file.exists():
        print(f"❌ Example file not found: {example_file}")
        print("\nUsage:")
        print(f"  uv run python -m tests.test_parser [path-to-excel-file]")
        sys.exit(1)

    print(f"Testing parser with: {example_file}")
    print("-" * 60)

    try:
        # Read file
        with open(example_file, "rb") as f:
            file_bytes = f.read()

        # Parse
        result = parse_excel(file_bytes)

        # Pretty print result
        print("\n✅ Parse successful!")
        print("\nParsed data:")
        print(json.dumps(result, indent=2))

        # Summary
        print("\n" + "=" * 60)
        print("Summary:")
        version = result.get("version", {})
        print(f"  Vendor: {version.get('vendor', 'N/A')}")
        print(f"  Library: {version.get('library', 'N/A')}")
        print(f"  Name: {version.get('name', 'N/A')}")
        print(f"  Version: {version.get('version', 'N/A')}")
        print(f"  Address Blocks: {len(result.get('addressBlocks', []))}")

        for block in result.get("addressBlocks", []):
            print(f"\n  Block: {block['name']}")
            print(f"    Base Address: 0x{block['baseAddress']:X}")
            print(f"    Registers: {len(block.get('registers', []))}")

            for reg in block.get("registers", [])[:3]:  # Show first 3 registers
                field_count = len(reg.get("fields", []))
                addr = reg["addressOffset"]
                print(f"      - {reg['name']} @ 0x{addr:X} ({field_count} fields)")

        print("\n✅ Test passed!")

    except Exception as e:
        print(f"\n❌ Parse failed: {e}")
        import traceback

        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
