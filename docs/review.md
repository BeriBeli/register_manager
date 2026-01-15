# Review

## 审查要点
1. API 与 `TGI.yaml` 一致性
2. 密码是否可能泄漏、加密策略
3. 多人同时访问的并发问题
4. 冗余或失效代码
5. Source map 泄漏风险
6. 历史记录设计合理性
7. i18n JSON 冗余/缺失
8. 项目中写死的部分

## 发现的问题与修复建议
1. 高：`TGI.yaml` 与后端实际路由不一致，`/tgi/*` 未实现，接口文档可能误导对接方。  
   修复建议：明确 `TGI.yaml` 作用；若为对外接口则实现 `/tgi` 路由并与文档对齐，否则移动到 `docs/` 并注明“规范参考/未实现”或移除。

2. 高：部分业务路由缺少项目级权限校验，可能越权读写。  
   影响位置：`packages/backend/src/routes/registers.ts`、`packages/backend/src/routes/addressBlocks.ts`、`packages/backend/src/routes/versions.ts`。  
   修复建议：新增统一的“项目成员/管理员校验”中间件，针对寄存器、地址块、版本等路由验证用户对 `projectId` 的访问权限。

3. 高：默认管理员账号在未配置环境变量时会使用固定邮箱/弱口令。  
   影响位置：`packages/backend/src/index.ts`。  
   修复建议：生产环境要求显式设置 `ADMIN_EMAIL`/`ADMIN_PASSWORD`，若缺失则启动失败；避免日志输出密码来源；支持一次性初始化流程。

4. 中：`db:seed` 脚本使用了不存在的表/字段（`users`、`passwordHash`），可能误导或失败。  
   影响位置：`packages/backend/src/db/seed.ts`。  
   修复建议：同步为当前 `schema.ts` 中的 `user` 表结构；或移除旧脚本并在 README 中说明。

5. 中：历史版本恢复为“全量删除 + 重建”，并生成新 ID，可能破坏外部引用且缺少并发保护。  
   影响位置：`packages/backend/src/routes/versions.ts`。  
   修复建议：引入乐观锁（`updatedAt`/版本号校验），在恢复前检查最新修改；保留原 ID 或提供映射；定义版本保留/容量上限策略。

6. 低：全局 `tsconfig.json` 启用 `sourceMap`/`declarationMap`，生产环境可能泄漏源码。  
   修复建议：为生产构建单独配置（如 `tsconfig.prod.json` 或 Vite/Bun 构建参数）禁用 `.map` 输出，或确保产物不对外暴露。

7. 低：i18n 中文文件存在英文没有的键（`sidebar.version`），可能为冗余或漏翻。  
   修复建议：补充 `en.json` 对应键，或删除无用键并统一 lint 规则。

8. 低：存在硬编码默认值（如 `resetTypeRef: "HARD"`、默认内存映射名称、默认管理员邮箱）。  
   修复建议：迁移为配置项或常量文件；对业务默认值加注释并集中管理。

## 额外建议
- 为核心路由补充鉴权与权限单元测试，覆盖“非成员访问”与“并发更新”场景。  
- 为对外接口生成版本化 API 文档，避免规范文档与实现脱节。
