# IP-XACT Import Script

This script imports IP-XACT XML files into the PostgreSQL database for testing and development.

## Usage

### Import the default example.xml file

```bash
bun run db:import
```

### Import a custom IP-XACT XML file

```bash
bun run db:import path/to/your/file.xml
```

Or from the backend package:

```bash
cd packages/backend
bun run db:import /absolute/path/to/file.xml
```

## What it does

The import script:

1. **Parses the IP-XACT XML file** using the IEEE 1685-2014 standard format
2. **Extracts component metadata** (VLNV: Vendor, Library, Name, Version)
3. **Creates a new project** in the database with the component information
4. **Imports the complete hierarchy**:
   - Memory Maps
   - Address Blocks
   - Registers
   - Fields
   - Reset Values

## Example Output

```
📥 Importing IP-XACT file: D:\Codes\register_manager\example.xml
📦 Component VLNV: example.com:IP:example:1.0
📁 Creating project...
✅ Project created: example (e4e6bd21-d93d-4cde-acd2-63ffa101a1f0)
  🗺️  Processing memory map: example
    📦 Processing address block: block0
      📝 Processing register: reg0
        🔧 Processing field: field0
      📝 Processing register: reg1
        🔧 Processing field: field1
        🔧 Processing field: field0
      ...
✅ Import completed successfully!

🎉 Successfully imported project: example (ID: e4e6bd21-d93d-4cde-acd2-63ffa101a1f0)
```

## Supported IP-XACT Elements

### Component Level
- ✅ vendor
- ✅ library
- ✅ name
- ✅ version

### Memory Map Level
- ✅ name
- ✅ displayName
- ✅ description
- ✅ addressUnitBits

### Address Block Level
- ✅ name
- ✅ displayName
- ✅ description
- ✅ baseAddress
- ✅ range
- ✅ width
- ✅ usage
- ✅ volatile

### Register Level
- ✅ name
- ✅ displayName
- ✅ description
- ✅ addressOffset
- ✅ size
- ✅ volatile

### Field Level
- ✅ name
- ✅ displayName
- ✅ description
- ✅ bitOffset
- ✅ bitWidth
- ✅ access (read-write, read-only, write-only, etc.)
- ✅ modifiedWriteValue (oneToClear, oneToSet, etc.)
- ✅ readAction (clear, set, modify, etc.)

### Reset Values
- ✅ value
- ✅ resetTypeRef

## Database User

The script will use or create a default test user:
- Email: `test@example.com`
- Name: `Test User`

All imported projects will be associated with this user.

## Viewing Imported Data

After importing, you can view the data using:

1. **Drizzle Studio** (Database GUI):
   ```bash
   bun run db:studio
   ```
   Then open https://local.drizzle.studio

2. **Frontend Application**:
   ```bash
   bun run dev
   ```
   Then open http://localhost:5173

3. **API**:
   ```bash
   curl http://localhost:3000/api/projects
   ```

## Troubleshooting

### File not found error

Make sure the XML file path is correct. You can use:
- Relative paths: `bun run db:import ./my-file.xml`
- Absolute paths: `bun run db:import /full/path/to/file.xml`

### Database connection error

Ensure PostgreSQL is running and the `DATABASE_URL` in `packages/backend/.env` is correct.

### XML parsing error

The script expects IEEE 1685-2014 (IP-XACT 2014) format. Make sure your XML file follows this standard.

## Implementation Details

The import script is located at:
```
packages/backend/src/db/import-ipxact.ts
```

It uses:
- **xml2js** for XML parsing
- **Drizzle ORM** for database operations
- **Bun** runtime for execution

## Future Enhancements

- [ ] Support for IEEE 1685-2022 (IP-XACT 2022) format
- [ ] Import validation and error reporting
- [ ] Duplicate detection and merge options
- [ ] Import progress bar for large files
- [ ] Batch import multiple files
- [ ] Import via API endpoint
