# Register Manager

基于 IEEE 1685-2022 IP-XACT TGI API 规范的寄存器管理工具。

## 功能特性

- 🎨 可视化寄存器编辑
- 📊 实时位域渲染
- 📤 多格式导出 (IP-XACT XML, C Header, UVM RAL, HTML)
- 👥 多用户支持

## 技术栈

- **运行时**: Bun
- **后端**: Hono + Drizzle ORM + PostgreSQL
- **前端**: React + TypeScript + Tailwind CSS
- **认证**: Better Auth

## 快速开始

### 前置条件

- [Bun](https://bun.sh/) >= 1.0
- [PostgreSQL](https://www.postgresql.org/) >= 14

### 安装

```bash
# 安装依赖
bun install

# 配置环境变量
cp .env.example packages/backend/.env
# 编辑 packages/backend/.env 文件设置数据库连接

# 运行数据库迁移
bun run db:migrate

# 添加测试用户（开发环境）
bun run db:seed

# 启动开发服务器
bun run dev
```

### 开发命令

```bash
# 仅启动后端
bun run dev:backend

# 仅启动前端
bun run dev:frontend

# 运行测试
bun run test

# 构建生产版本
bun run build
```

## 项目结构

```
register_manager/
├── packages/
│   ├── shared/      # 共享类型和工具
│   ├── backend/     # 后端服务 (Hono)
│   └── frontend/    # 前端应用 (React)
├── TGI.yaml         # IP-XACT TGI API 规范
└── package.json     # 根配置
```

## 许可证

MIT
