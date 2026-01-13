# Register Manager

A register management tool based on the IEEE 1685-2022 IP-XACT TGI API specification.

## Features

### Implemented ✅

- 🎨 **Visual Register Editor** - Interactive UI for creating and editing registers with bit fields
- 📊 **Real-time Bit Field Rendering** - Interactive bit field visualization with drag-to-select range creation
- �️ **Hierarchical Structure** - Support for Memory Maps → Address Blocks → Registers → Fields hierarchy
- �📤 **Multi-format Export**
  - IP-XACT XML - IEEE 1685-2022 compliant format
  - C Header Files - with configurable endianness and access macros
  - UVM RAL - SystemVerilog register abstraction layer
  - HTML Documentation - standalone documentation export
- 🎯 **Field Properties** - Full support for field access types, reset values, enumerated values
- 🌐 **Internationalization (i18n)** - Multi-language support infrastructure

### In Progress 🚧

- � **Authentication** - Basic auth routes defined (Better Auth integration planned)

## Tech Stack

- **Runtime**: Bun
- **Backend**: Hono + Drizzle ORM + PostgreSQL
- **Frontend**: React + TypeScript + Tailwind CSS + Vite
- **Shared**: Zod schemas for type-safe validation

## Quick Start

### Prerequisites

- [Bun](https://bun.sh/) >= 1.0
- [PostgreSQL](https://www.postgresql.org/) >= 14

### Installation

```bash
# Install dependencies
bun install

# Configure environment variables
cp .env.example packages/backend/.env
# Edit packages/backend/.env to set database connection

# Run database migrations
bun run db:migrate

# Add test user (development)
bun run db:seed

# Start development server
bun run dev
```

### Development Commands

```bash
# Start backend only
bun run dev:backend

# Start frontend only
bun run dev:frontend

# Run tests
bun run test

# Build for production
bun run build

# Open Drizzle Studio (database GUI)
bun run db:studio
```

## Project Structure

```
register_manager/
├── packages/
│   ├── shared/              # Shared types, schemas, and utilities
│   │   └── src/
│   │       ├── types/       # TypeScript type definitions
│   │       ├── schemas/     # Zod validation schemas
│   │       └── utils/       # Shared utility functions
│   ├── backend/             # Backend service (Hono)
│   │   └── src/
│   │       ├── db/          # Database schema and migrations
│   │       ├── routes/      # API route handlers
│   │       └── services/    # Business logic and generators
│   └── frontend/            # Frontend application (React)
│       └── src/
│           ├── components/  # Reusable UI components
│           ├── pages/       # Page components
│           ├── stores/      # State management
│           └── i18n/        # Internationalization
├── docs/                    # Documentation
│   └── api_compliance_analysis.md
├── TGI.yaml                 # IP-XACT TGI API specification
└── package.json             # Root monorepo configuration
```

## Database Schema

The application uses a hierarchical data model:

- **Users** - User accounts (authentication pending)
- **Projects** - Top-level container for register designs
- **Memory Maps** - Memory region definitions within a project
- **Address Blocks** - Contiguous memory ranges within a memory map
- **Registers** - Individual registers within an address block
- **Fields** - Bit fields within a register
- **Enumerated Values** - Named constants for field values

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | `/api/projects` | List/Create projects |
| GET/PUT/DELETE | `/api/projects/:id` | Get/Update/Delete project |
| GET/POST | `/api/addressBlocks` | List/Create address blocks |
| GET/POST/PUT/DELETE | `/api/registers` | CRUD operations for registers |
| POST | `/api/export/:projectId` | Export project in specified format |
| GET | `/api/export/formats` | List available export formats |

## Roadmap

### Highest Priority

- [ ] **TGI API Compliance** - Implement IEEE 1685-2022 IP-XACT TGI (Tool Generator Interface) compatible API layer at `/tgi/*` for external EDA tool integration. See [API Compliance Analysis](docs/api_compliance_analysis.md) for details.

### High Priority

- [ ] **Multi-user Authentication** - Complete Better Auth integration with login/register/logout
- [ ] **Project Version Control** - Git-like versioning for register designs with history tracking
- [ ] **Import from Excel** - Plugin-based import from spreadsheet formats

### Medium Priority

- [ ] **Export to Excel** - Plugin-based export to spreadsheet formats
- [ ] **IP-XACT Import** - Import existing IP-XACT XML files
- [ ] **Register Templates** - Predefined register templates for common peripherals
- [ ] **Diff/Compare** - Compare register maps between versions or projects

### Future Enhancements

- [ ] **Collaboration** - Real-time collaborative editing
- [ ] **Access Control** - Role-based permissions for teams
- [ ] **Register Validation** - Address overlap detection and constraint checking
- [ ] **Documentation Generation** - Extended document formats (PDF, Markdown)
- [ ] **CI/CD Integration** - API for automated register file generation

## License

MIT
