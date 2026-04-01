# VS Code Extension Insights

**Extension Insights** 是一个强大的 VS Code 插件分析工具，旨在通过可视化手段帮助用户深入了解已安装插件的生态现状。它可以帮助你识别高能耗插件、发现快捷键冲突，并提供直观的依赖关系图谱。

## 核心功能 (Features)

### 🔍 核心分析 (Core Analysis)
- **启动项审计**：自动识别配置了 `activationEvents: ["*"]` 的插件（即随编辑器启动的插件），标记为“高能耗预警” (Eager)。
- **贡献点统计**：量化分析每个插件注册的命令 (Commands)、菜单 (Menus) 和视图 (Views) 数量，帮助你评估插件的“重量”。
- **分类统计**：按插件类别（如编程语言、工具、主题等）进行汇总分析。

### 📊 可视化看板 (Visualization)
- **数据大屏 (Dashboard)**：通过饼图直观展示插件类型的分布占比。
- **依赖拓扑图 (Dependency Graph)**：使用交互式关系图展示插件之间的层级依赖关系，节点大小反映依赖复杂度。
- **性能列表 (Performance List)**：按启动方式和贡献点数量排序的详细插件清单，助你快速定位影响性能的元凶。

### 🛠️ 管理辅助 (Management)
- **冲突检测 (Conflict Detection)**：自动扫描并列出所有重复的快捷键绑定 (Keybindings)，解决按键冲突烦恼。
- **配置导出 (Export Config)**：一键生成当前插件环境的推荐配置，便于备份或分享给团队。

## 使用方法 (Usage)

1.  打开 VS Code 命令面板 (Cmd+Shift+P 或 Ctrl+Shift+P)。
2.  输入并执行命令：`Extension Insights: Show Dashboard`。
3.  在打开的 Webview 面板中查看分析报告。

## 开发与构建 (Development)


本项目采用 TypeScript + React + Webpack 构建。

### 环境要求
- Node.js
- VS Code

### 安装依赖
```bash
npm install
```

### 编译项目
```bash
npm run compile
```

### 运行调试
1.  在 VS Code 中打开项目文件夹。
2.  按 `F5` 启动调试窗口（Extension Development Host）。
3.  在调试窗口中运行 `Extension Insights: Show Dashboard` 命令。

## 技术栈
- **Extension Host**: TypeScript
- **Webview UI**: React, ECharts, @vscode/webview-ui-toolkit
- **Bundler**: Webpack

## License
MIT

## 正在进行的内容
1.  学会官网上学习如何写一个插件（已完成）
2.  熟悉项目的代码结构
3.  完善项目的README.md
4.  熟悉文件并且进行代码的优化
5.  优化饼状图并且更精细一些
6.  表格要具有排序的功能
7.  表格中的字段要更有意义一点
8.  添加禁用和卸载功能

