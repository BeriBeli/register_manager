# Register Manager

一个基于 IEEE 1685-2022 IP-XACT 标准的高性能寄存器管理工具。采用现代技术栈（Bun, Hono, React, Rust/WASM）构建，旨在提供极致的用户体验。

##核心特性

### 已实现 ✅
- 🎨 **可视化编辑器** - 交互式 UI，支持拖拽创建位域，实时渲染寄存器结构。
- 📊 **实时可视化** - 动态展示位域布局与内存映射层级。
- 🗂️ **项目管理** - 支持多项目管理及版本控制基础。
- 🔒 **用户认证** - 基于 Better Auth 的安全认证（邮箱/密码登录）。
- ⚙️ **插件系统** - 强大的可扩展架构，支持通过 **WASM** 编写自定义导入/导出插件。
- ⚡ **动态加载** - 支持动态加载插件（WASM + JS 胶水代码），无需重新编译前端即可热更新解析逻辑。

### 数据处理 ✅
- 📥 **Excel 导入** - **由 Rust & Polars 驱动**，利用 WASM 在浏览器端实现高性能、复杂的 Excel 解析（完美兼容 irgen 格式）。
- 📤 **多格式导出**
  - IP-XACT XML (IEEE 1685-2022 标准)
  - C Header Files (支持宏定义与字节序配置)
  - UVM RAL (SystemVerilog 寄存器模型)
  - HTML 文档

### 架构设计 🏗️
- **Monorepo**: 使用 Bun Workspaces 高效管理多包项目。
- **Frontend**: React + Vite + TailwindCSS (打造 Premium 级 UI/UX)。
- **Backend**: Hono + Drizzle ORM + PostgreSQL。
- **Performance**: 计算密集型任务（如 Excel 解析）下放至 **Rust WASM** 处理。

## 快速开始

### 环境要求
- [Bun](https://bun.sh/) >= 1.0 (运行时与包管理器)
- [PostgreSQL](https://www.postgresql.org/) >= 14
- [Rust](https://www.rust-lang.org/) (用于编译 WASM 插件)
- `wasm-bindgen-cli`（`cargo install wasm-bindgen-cli --locked`）

### 安装与运行

```bash
# 1. 安装依赖
bun install

# 2. 环境配置
cp .env.example packages/backend/.env
# 编辑 packages/backend/.env 配置 DATABASE_URL 等信息

# 3. 数据库迁移
bun run db:generate
bun run db:migrate
bun run db:seed  # 可选：填充初始测试数据

# 4. 编译插件 (编译 Rust parser)
bun run plugin:build

# 5. 启动开发服务器 (同时启动前后端)
bun run dev
```

### 插件开发

本项目的 Excel 解析器作为一个独立的 Rust crate 存在于 `register_excel_parser/` 目录。
编译方法：
```bash
bun run plugin:build
```
编译产物位于 `pkg/` 目录。
- **动态加载模式**：在管理后台上传 `pkg/register_excel_parser_bg.wasm` (二进制) 和 `pkg/register_excel_parser.js` (JS 胶水代码) 即可即时生效。

## 项目结构

```
register_manager/
├── packages/
│   ├── backend/             # Hono API 后端服务
│   ├── frontend/            # React 前端应用
│   └── shared/              # 共享类型定义与 Schema
├── register_excel_parser/   # Rust 项目 (WASM 插件源码)
└── package.json             # Monorepo 根配置
```

## 许可证

MIT
