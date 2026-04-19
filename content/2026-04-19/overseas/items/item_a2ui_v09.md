---
title: Google A2UI v0.9 发布 | 2026-04-13 ~ 2026-04-19
date: 2026-04-19
region: overseas
tier: item
tags: [Google, A2UI, 协议, 生成式UI, Agent, 框架无关]
sync_version: 1
---

# 📄 Google A2UI v0.9 发布 | 单条深度解读

> [← 返回海外速报](../briefing/overseas_briefing_20260419.md) ｜ [← 返回 Google 分类解读](../category/category_google.md)

---

**来源**：[A2UI 官网](https://a2ui.org)
**事件日期**：04-17
**可靠性**：✅ 官方发布

---

### 事实摘要

- Google 于 **04-17** 发布 A2UI（Agent-to-UI Protocol）v0.9
- A2UI 是一个可移植、框架无关的生成式 UI 协议，标准化 Agent 与前端应用的交互
- v0.9 核心变更：**schema 从 response body 迁移至 system prompt**，Agent 无需结构化输出即可生成 UI
- 新增**双向消息（bidirectional messaging）**支持，AG-UI 5 步接入路径

### 关键细节

**v0.9 核心变更（相比 v0.8）：**

| 变更 | 说明 |
|------|------|
| Schema 迁移 | 从 response body → system prompt，Agent 无需结构化输出即可生成 UI |
| 双向消息 | 支持 bidirectional messaging，UI 可向 Agent 发送事件 |
| 模块化 Schema | Schema 拆分为可组合的模块，降低接入复杂度 |
| AG-UI 集成路径 | 新增 5 步接入任意 Agent 框架的标准路径 |

**协议定位对比：**

| 协议 | 发起方 | 解决的问题 | 类比 |
|------|--------|----------|------|
| MCP | Anthropic | LLM ↔ 工具/服务（垂直连接） | HTTP |
| A2A | Google | Agent ↔ Agent（水平连接） | gRPC |
| **A2UI** | **Google** | **Agent → UI 渲染（界面生成）** | **HTML** |
| AG-UI | CopilotKit | Agent ↔ 前端框架（竞品） | - |

**AWS AgentCore 整合：**
- AWS AgentCore 宣布内置 AG-UI 专属 endpoint
- FAST 全栈模板支持 Generative UI + 共享状态 + Human-in-the-Loop 开箱即用

### 解读：这意味着什么

> 以下为编辑分析，非原文内容

- **解读**：Schema 迁移到 system prompt 是 v0.9 最重要的技术变化——之前 Agent 需要输出结构化 JSON 才能触发 UI 渲染，现在 Agent 只需正常输出文本，UI 渲染逻辑由 system prompt 中的 schema 驱动。这大幅降低了接入门槛
- **解读**：A2UI 是 Agentic Engineering 的重要基础设施——Agent 不仅要能调用工具（MCP），还要能生成可交互的界面（A2UI）。MCP + A2UI 组合，构成了 Agent 与外部世界交互的完整协议栈
- **解读**：A2UI vs AG-UI 的竞争格局值得关注——Google 背书的 A2UI 和 CopilotKit 社区驱动的 AG-UI 在功能上高度重叠，但 AWS AgentCore 已选择内置 AG-UI，说明两者可能走向共存而非一方胜出
- **解读**：v0.9 → v1.0 的节奏说明协议已趋于稳定，开发者可以开始基于 A2UI 构建生产级应用，而不必担心 breaking change

### 原文关键引述

> "In A2UI v0.9, the schema has moved from the response body to the system prompt, meaning agents no longer need to produce structured output to reliably generate UI."

> "A2UI v0.9 introduces bidirectional messaging, allowing the UI to send events back to the agent, enabling truly interactive generative interfaces."
