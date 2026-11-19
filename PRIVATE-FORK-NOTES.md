# 私人改版说明（Private Fork）

上游：arcsin1/oh-my-ppt，版本 2.11.0（2026-11-16 发布），Apache-2.0。
本仓是私人改版，不公开、不向上游提 PR。

## 改了什么

1. 更新检查已关（`src/main/app/lifecycle.ts`）
   - 删掉作者版本清单拉取、版本号比较、`app:update-available` 通知。
   - `scheduleUpdateNotification` 留作空函数，只为兼容旧调用点。
   - `src/main/app/application.ts` 已删掉对它的调用。
2. 自动更新通道已删（`electron-builder.yml`、`dev-app-update.yml`）
   - 删掉 `publish: provider: generic` 占位配置，删掉 `dev-app-update.yml`。
   - `electron-updater` 依赖仍在 `package.json` 里，但全仓无任何代码引用它，属于死依赖，留着不动是为了不破坏 `pnpm-lock.yaml`。
3. 图表 CDN 已关（`src/renderer/src/components/html-editor/HtmlEditorCanvas.tsx`）
   - `ensureChartJs` 不再从 CDN 拉 Chart.js，只用页面里已有的本地 Chart，没有就返回 false。
4. 回归测试（`tests/unit/app/private-fork-no-update.test.ts`）
   - 文件级守卫：上面 3 点再被上游合并回来时，测试会失败提醒。

## 没改的

- 模型那边按要求没动：文本模型、生图 Provider 的请求只在用户自己配好 key、点验证/拉模型列表时才发给用户选的服务商。
- 两个帮助链接没动：侧栏帮助、模型设置里的文档链接只是 `href`，点才会打开浏览器，不会自动联网。
- 本地数据库、密钥加密（`safeStorage`）、本地日志都没动。

## 构建

项目自带规则：不要跑 `npm run lint`、`npm run build`，验证跑 `pnpm test`，本次只跑单文件：`pnpm test -- tests/unit/app/private-fork-no-update.test.ts`。VM 上无 node_modules、未跑完整 vitest，11 项文件守卫已用 Node 直验通过，见提交说明。
