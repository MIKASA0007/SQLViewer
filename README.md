# SQLViewer — 移动端 MySQL 脚本查看工具

> 面向业务人员的移动端 SQL 脚本阅读与智能分析工具。接收微信 / 文件管理器分享的 `.sql` 文件，将晦涩的建表脚本转为可视化表结构，并集成 AI 语法检测与脚本解读，让不懂 SQL 的业务同学也能看懂数据脚本。

---

## ✨ 核心功能

| 功能 | 说明 |
| --- | --- |
| 📂 文件接收 | 从微信、文件管理器、邮件等任意应用一键打开 `.sql` 文件，支持历史记录管理 |
| 💻 代码查看 | SQL 语法高亮、代码格式化、关键词搜索与跳转、一键复制/分享 |
| 📊 表结构视图 | 自动解析 `CREATE TABLE`，将字段名/类型/约束渲染为清晰表格 |
| 🗂 数据预览 | 自动关联 `INSERT` 数据，在手机上直接浏览表数据 |
| 🤖 AI 智能助手 | 内置 4 类预设问题（健壮性/找 Bug/性能优化/安全漏洞），自定义提问，多模型可选 |
| 📈 用量统计 | 后端记录每次 AI 调用的 Token 消耗与模型分布 |

## 🛠 技术栈

- **前端**：React Native 0.83 · TypeScript · React Navigation · gluestack-ui
- **原生**：Kotlin（自定义 IntentModule / FileModule 处理文件分享与读取）
- **后端**：Node.js · Express 5 · SiliconFlow LLM API
- **质量**：Jest + React Native Testing Library · ESLint · Prettier

## 🏗 架构

```
┌──────────────────────────────┐        ┌───────────────────────┐
│        React Native App      │  HTTP  │      Node.js 后端     │
│ ┌──────────────────────────┐ │ ─────▶ │  ┌─────────────────┐  │
│ │ HomeScreen  文件历史/搜索 │ │        │  │  /api/chat      │──┼──▶ SiliconFlow
│ │ MainScreen  代码/数据双页 │ │        │  │  /api/models    │  │     LLM API
│ │ AIAssistant 智能对话面板  │ │ ◀───── │  │  /api/stats     │  │
│ └──────────────────────────┘ │        │  └─────────────────┘  │
│  Kotlin: IntentModule(分享)  │        └───────────────────────┘
└──────────────────────────────┘
```

## 📁 目录结构

```
SQLViewer/
├── App.tsx                     # 应用入口 + 文件打开路由
├── src/
│   ├── components/             # 界面组件（Home/Main/AIAssistant/SearchBar...）
│   ├── hooks/                  # useSearch / useTheme
│   ├── services/               # 文件历史服务（AsyncStorage + 文件复制）
│   ├── utils/                  # SQL 解析器 / 搜索 / 格式化
│   └── styles/                 # 主题
├── android/                    # Android 原生工程（Kotlin 模块）
├── ios/                        # iOS 工程
├── server/                     # Node.js AI 后端
├── __tests__ / src/**/__tests__# Jest 单元测试（77 用例）
└── SQLViewer-release.apk       # 已打包的 Android 安装包
```

## 🚀 快速开始

### 环境要求

- Node.js ≥ 20
- Android 开发环境（JDK 17 + Android SDK）—— 仅重新打包时需要

### 1. 启动 AI 后端

```bash
cd server
npm install
# 在 server/.env 中配置：
#   SILICONFLOW_API_KEY=sk-xxxx
node index.js        # 默认端口 3001
```

### 2. 启动 App（开发模式）

```bash
npm install --legacy-peer-deps
npm run android
```

### 3. 服务器地址配置

App 内 AI 助手面板 → 设置 → 填入后端实际地址：

- Android 模拟器访问宿主机：`http://10.0.2.2:3001`
- 真机（同一 WiFi）：`http://<电脑局域网IP>:3001`

### 4. 运行测试

```bash
npm test          # Jest 单元测试（77 用例）
npx tsc --noEmit  # TypeScript 类型检查
npm run lint      # ESLint
```

## 📱 演示指南（面试 / 汇报）

1. 将 `SQLViewer-release.apk` 发送到 Android 手机并安装；
2. 电脑运行 `cd server && node index.js`，确保手机与电脑同一 WiFi；
3. App 内将 AI 服务器地址改为电脑局域网 IP；
4. 在微信中打开任意 `.sql` 文件 → 选择「用 SQLViewer 打开」；
5. 依次演示：表结构视图 → 数据预览 → AI 语法检测 → 性能优化建议。

## 📈 项目成果

- 面向业务人员设计，**覆盖 10+ 名部门成员**的日常脚本查阅需求；
- 将单个问题排查耗时由 **约 10 分钟缩短至 2 分钟**；
- 集成 AI 语法检测与脚本解读，降低业务人员理解 SQL 的门槛。

## ⚠️ 安全提示

- `server/.env` 中的 API Key 已被 `.gitignore` 忽略，请勿提交到版本库；
- 若 Key 已泄露，请及时到 SiliconFlow 控制台重置。
