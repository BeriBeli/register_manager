# Register Manager

符合 IEEE 1685-2022 IP-XACT 标准的高性能 Web 寄存器管理工具。采用现代技术栈（Bun, Hono, React, Rust/WASM）构建，旨在提供极致的用户体验。

[English Documentation](./README.md)

## 功能特性

### 核心功能 ✅
- 🎨 **可视化寄存器编辑器** - 交互式 UI，支持拖拽选择位域，轻松管理寄存器。
- 📊 **实时可视化** - 动态位域图渲染和内存映射层次结构展示。
- 🗂️ **项目管理** - 支持多项目管理及版本控制。
- 🔒 **安全认证** - 基于 Email/Password 的安全登录 (集成 Better Auth)。
- ⚙️ **插件系统** - 支持 WASM 插件扩展架构，可自定义导入/导出逻辑。
- ⚡ **动态加载** - 支持热加载插件（WASM + JS），无需重新编译应用。

### 数据处理 ✅
- 📥 **Excel 导入** - **由 Rust & Polars 驱动**，提供高性能的 Excel 解析能力（支持 irgen 格式）。
- 📤 **多格式导出**
  - IP-XACT XML (IEEE 1685-2022)
  - C 语言头文件 (支持宏定义及大小端控制)
  - UVM RAL (SystemVerilog)
  - HTML 文档

### 架构设计 🏗️
- **Monorepo**: 使用 Bun Workspaces 高效管理多包项目。
- **前端**: React + Vite + TailwindCSS (打造高级 UI/UX)。
- **后端**: Hono + Drizzle ORM + PostgreSQL。
- **性能**: 繁重的数据处理任务通过 **WASM** (Rust) 卸载执行。

## 功能展示 📸

### 可视化寄存器编辑器
直观的寄存器和位域管理界面。
![Visual Editor](docs/images/vistual_editor.png)

### 强大的插件系统
通过 WASM 插件扩展功能（如 Excel 解析器）。
![Plugin System](docs/images/plugin_system.png)

### 可靠的导入系统
支持从 Excel 导入历史数据，并提供预览功能。
![Import Dialog](docs/images/import_dialog.png)

### 多格式导出
支持导出 IP-XACT, C Header, UVM RAL, 和 HTML 文档。
![Export Options](docs/images/project_export.png)

### 版本控制
项目版本管理与快照功能。
![Version Control](docs/images/version_control.png)

### 用户管理
基于角色的多用户安全管理系统。
![User Management](docs/images/multi_user.png)

## 快速开始

### 前置要求
- [Bun](https://bun.sh/) >= 1.0 (运行时 & 包管理器)
- [PostgreSQL](https://www.postgresql.org/) >= 14
- [Rust](https://www.rust-lang.org/) (用于构建 WASM 插件)
- `wasm-bindgen-cli` (`cargo install wasm-bindgen-cli --locked`)

### 安装步骤

```bash
# 1. 安装依赖
bun install

# 2. 环境配置
cp .env.example packages/backend/.env
# 编辑 packages/backend/.env 配置您的 DATABASE_URL

#（可选）生成 BETTER_AUTH_SECRET（本地开发用）
# 只打印：BETTER_AUTH_SECRET=...
bun run auth:secret
# 或追加写入到 packages/backend/.env（若已存在则不会覆盖）
bun run auth:secret -- --write

# 3. 数据库迁移
bun run db:generate
bun run db:migrate
bun run db:seed  # 可选：填充初始数据

# 4. 构建插件 (可选，通用 WASM 解析器)
bun run plugin:build

# 5. 启动开发服务器 (前端 + 后端)
bun run dev
```

### 插件开发

构建 Excel 解析器插件 (Rust/WASM)：
```bash
# 构建 WASM 并生成 JS 胶水代码
bun run plugin:build
```
输出文件位于 `pkg/` 目录。
- **动态模式**: 通过管理后台上传 `pkg/register_excel_parser_bg.wasm` (二进制) 和 `pkg/register_excel_parser.js` (JS 胶水代码)，即可立即启用插件。

## 项目结构

```
register_manager/
├── packages/
├── backend/             # Hono API 服务器
├── frontend/            # React 应用程序
└── shared/              # 共享类型定义 & Schema
├── register_excel_parser/   # Rust 项目 (WASM 插件)
└── package.json
```

## 许可证

MIT
