# VS Code 插件分析器 (Extension Insights) 开发计划

本计划旨在从零开始构建 VS Code 插件分析器，实现插件生态的可视化与管理。

## 1. 项目初始化与架构搭建

* **创建项目骨架**：配置 `package.json`，`tsconfig.json`。

* **技术栈配置**：

  * 核心逻辑：TypeScript

  * Webview 前端：React + Webpack/Vite

  * UI 组件：`@vscode/webview-ui-toolkit`

  * 图表：`echarts`

* **目录结构规划**：分离 Extension Host（后端）与 Webview（前端）代码。

## 2. 核心分析模块 (Extension Host)

* **数据采集服务 (`Analyzer`)**：

  * 基于 `vscode.extensions.all` 获取插件列表。

  * 解析 `packageJSON` 提取元数据。

* **业务逻辑实现**：

  * **启动项审计**：筛选 `activationEvents` 包含 `*` 的插件。

  * **贡献点统计**：计算 Commands, Menus, Views 数量。

  * **依赖分析**：构建插件依赖关系图数据。

  * **冲突检测**：扫描并识别重复的 `keybindings`。

## 3. 可视化前端开发 (Webview)

* **通信机制**：建立 `acquireVsCodeApi()` 消息通道，实现前后端数据同步。

* **界面模块开发**：

  * **Dashboard**：集成 ECharts 饼图展示插件分类占比。

  * **依赖拓扑图**：使用 ECharts Graph 渲染插件依赖关系。

  * **性能列表**：使用 Webview UI Toolkit 表格展示高耗能插件。

  * **管理面板**：展示快捷键冲突列表及导出配置功能。

## 4. 功能整合与验证

* **命令注册**：实现 `extensionInsights.start` 命令唤起 Webview。

* **数据联调**：确保 Webview 能正确接收并渲染真实插件数据。

* **验证**：检查启动速度影响分析准确性及快捷键冲突检测的有效性。

