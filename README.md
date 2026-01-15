# Register Manager

A high-performance, web-based register management tool compliant with IEEE 1685-2022 IP-XACT standards. Built with a modern tech stack (Bun, Hono, React, Rust/WASM) to deliver a premium user experience.

[中文文档](./README_zh.md)

## Features

### Core Functionality ✅
- 🎨 **Visual Register Editor** - Interactive UI for editing registers, bit fields with drag-to-select.
- 📊 **Real-time Visualization** - Dynamic bit field rendering and memory map hierarchy.
- 🗂️ **Project Management** - Organize designs into projects with versions.
- 🔒 **Authentication** - Secure login via Email/Password (Better Auth).
- ⚙️ **Plugin System** - Extensible architecture supporting WASM-based plugins for custom import/export logic.
- ⚡ **Dynamic Loading** - Support for hot-loading plugins (WASM + JS) without recompilation.

### Data Processing ✅
- 📥 **Excel Import** - **Powered by Rust & Polars**, offering high-performance parsing of complex Excel formats (e.g., irgen format).
- 📤 **Multi-format Export**
  - IP-XACT XML (IEEE 1685-2022)
  - C Headers (with macros & endianness control)
  - UVM RAL (SystemVerilog)
  - HTML Documentation

### Architecture 🏗️
- **Monorepo**: Efficiently managed via Bun Workspaces.
- **Frontend**: React + Vite + TailwindCSS (Premium UI/UX).
- **Backend**: Hono + Drizzle ORM + PostgreSQL.
- **Performance**: Heavy data processing offloaded to **WASM** (Rust).

## Showcase 📸

### Visual Register Editor
Intuitive interface for managing registers and bit fields.
![Visual Editor](docs/images/vistual_editor.png)

### Powerful Plugin System
Extend functionality with WASM plugins (e.g., Excel parsers).
![Plugin System](docs/images/plugin_system.png)

### Reliable Import System
Import legacy data from Excel with preview.
![Import Dialog](docs/images/import_dialog.png)

### Multi-Format Export
Export to IP-XACT, C Header, UVM RAL, and HTML documentation.
![Export Options](docs/images/project_export.png)

### Version Control
Track changes with project versioning and snapshots.
![Version Control](docs/images/version_control.png)

### User Management
Secure multi-user system with role-based access.
![User Management](docs/images/multi_user.png)

## Quick Start

### Prerequisites
- [Bun](https://bun.sh/) >= 1.0 (Runtime & Package Manager)
- [PostgreSQL](https://www.postgresql.org/) >= 14
- [Rust](https://www.rust-lang.org/) (for building WASM plugins)
- `wasm-bindgen-cli` (`cargo install wasm-bindgen-cli --locked`)

### Installation

```bash
# 1. Install dependencies
bun install

# 2. Environment Setup
cp .env.example packages/backend/.env
# Edit packages/backend/.env to configure DATABASE_URL

# (Optional) Generate BETTER_AUTH_SECRET for local dev
# Prints: BETTER_AUTH_SECRET=...
bun run auth:secret
# Or append it to packages/backend/.env (won't overwrite if already set)
bun run auth:secret -- --write

# 3. Database Migration
bun run db:generate
bun run db:migrate
bun run db:seed  # Optional: Seed initial data

# 4. Build Plugins (Optional, generic WASM parser)
bun run plugin:build

# 5. Start Development Server (Frontend + Backend)
bun run dev
```

### Plugin Development

To build the Excel Parser plugin (Rust/WASM):
```bash
# Build WASM and generate JS glue code
bun run plugin:build
```
The output is in `pkg/` directory.
- **Dynamic Mode**: Upload `pkg/register_excel_parser_bg.wasm` (Binary) and `pkg/register_excel_parser.js` (JS Glue) via the Admin UI to enable the plugin instantly.

## Project Structure

```
register_manager/
├── packages/
│   ├── backend/             # Hono API Server
│   ├── frontend/            # React Application
│   └── shared/              # Shared Types & Schemas
├── register_excel_parser/   # Rust Project (WASM Plugin)
└── package.json
```

## License

MIT
