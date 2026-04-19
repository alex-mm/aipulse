---
title: OpenAI Agents SDK 重大升级（三层架构）| 2026-04-13 ~ 2026-04-19
date: 2026-04-19
region: overseas
tier: item
tags: [OpenAI, Agents SDK, harness, 沙盒, Manifest, Long Horizon Task]
sync_version: 1
---

# 📄 OpenAI Agents SDK 重大升级（三层架构）| 单条深度解读

> [← 返回海外速报](../briefing/overseas_briefing_20260419.md) ｜ [← 返回 OpenAI 分类解读](../category/category_openai.md)

---

**来源**：[OpenAI GitHub](https://github.com/openai/openai-agents-python)
**事件日期**：04-15
**可靠性**：✅ 官方发布

---

### 事实摘要

- OpenAI Agents SDK（`openai-agents-python`）于 **04-15** 发布重大升级，引入 **Harness + 沙盒 + Manifest 三层架构**
- 支持 E2B、Modal、Docker、Daytona 等多个沙盒供应商
- 专为 Long Horizon Task（长程任务）设计，实现 Agent 的可靠持续执行
- GitHub 仓库已获约 **21,800 Stars**（截至 04-18），MIT 许可证
- 与 Swarm（实验性）不同，Agents SDK 是**生产就绪**的官方产品，有完整文档和 SLA 支持

### 关键细节

**三层架构：**

| 层级 | 作用 | 解决的问题 |
|------|------|----------|
| **Harness 层** | Agent 执行框架，管理 Loop/Tools/Context/Persistence/Verification/Constraints | Agent 怎么跑 |
| **沙盒层** | 隔离执行环境，支持 E2B/Modal/Docker/Daytona | Agent 在哪跑 |
| **Manifest 层** | 声明式配置，定义 Agent 的能力边界、工具权限、执行约束 | Agent 能做什么 |

**核心功能模块：**

| 模块 | 功能 |
|------|------|
| Agent 定义 | 声明式 Agent 配置（工具/指令/模型/上下文） |
| 工具注册 | Python 函数 → MCP 工具的自动转换 |
| 多 Agent 编排 | Handoff（移交）/ Orchestrator-Worker 模式 |
| Guardrails | 输入/输出的安全检查，可自定义规则 |
| Tracing | 内置 OpenTelemetry 兼容的追踪，可视化 Agent 执行流程 |
| MCP 原生支持 | Agent 可直接连接 MCP Server 作为工具来源 |

**与 Swarm 的区别：**

| 维度 | Swarm（旧） | Agents SDK（新） |
|------|------------|----------------|
| 状态 | 实验性，不建议生产使用 | 官方产品，生产就绪 |
| MCP 支持 | 无 | 原生支持 |
| Tracing | 无 | 内置 OpenTelemetry |
| Guardrails | 无 | 内置 |

**沙盒供应商：**
- **E2B**：云端代码执行沙盒
- **Modal**：无服务器 GPU 计算
- **Docker**：本地容器隔离
- **Daytona**：开发环境管理

### 解读：这意味着什么

> 以下为编辑分析，非原文内容

- **解读**：三层架构是 Agentic Engineering 的系统化实践——Harness 解决"Agent 怎么跑"，沙盒解决"Agent 在哪跑"，Manifest 解决"Agent 能做什么"，三者缺一不可。与本周 Harness Engineering 方法论文章高度呼应
- **解读**：Agents SDK 的发布标志着 OpenAI 策略转变——从"提供 API，让生态自己建框架"转向直接进入 Agent 框架市场，对 LangChain/LlamaIndex 形成直接冲击
- **解读**：MCP 原生支持是 OpenAI 对 MCP 生态的重要背书。在此之前，MCP 主要是 Anthropic 生态的标准。OpenAI 官方 SDK 支持 MCP，意味着 MCP 正在成为跨厂商的 Agent 工具标准
- **解读**：支持多个沙盒供应商（E2B/Modal/Docker/Daytona）是重要的生态开放信号，与 MiniMax MaxHermes 的云端沙箱方向高度一致，说明"沙盒化 Agent 执行"已成为行业共识
- **解读**：对国内 AI 工程师而言，这套三层架构是构建生产级 Agent 系统的重要参考，即使不使用 OpenAI 的 SDK，其架构思路也值得借鉴

### 原文关键引述

> "The OpenAI Agents SDK is our production-ready framework for building agentic applications with OpenAI models. Unlike Swarm, which was an experimental prototype, the Agents SDK is designed for real-world deployment."

> "Native MCP support means your agent can connect to any MCP server as a tool source, giving you access to the growing ecosystem of 10,000+ MCP tools."
