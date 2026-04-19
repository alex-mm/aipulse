---
title: Claude Haiku 3 今日正式退役 | 2026-04-13 ~ 2026-04-19
date: 2026-04-19
region: overseas
tier: item
tags: [Anthropic, Claude, Haiku, 模型退役, 迁移]
sync_version: 1
---

# 📄 Claude Haiku 3 今日正式退役 | 单条深度解读

> [← 返回海外速报](../briefing/overseas_briefing_20260419.md) ｜ [← 返回 Anthropic 分类解读](../category/category_anthropic.md)

---

**来源**：[Anthropic 官方](https://www.anthropic.com/news/claude-haiku-3-eol)
**事件日期**：04-19（今日生效）
**可靠性**：✅ 官方公告

---

### 事实摘要

- Claude Haiku 3（模型 ID：`claude-haiku-3-20240307`）于 **2026-04-19** 正式退役
- API 即日起对该模型 ID 的调用将返回错误，无法继续使用
- 官方推荐迁移目标：`claude-haiku-3-5`（Haiku 3.5）

### 关键细节

- **退役模型 ID**：`claude-haiku-3-20240307`
- **迁移目标**：`claude-haiku-3-5`
- **影响**：所有硬编码旧模型 ID 的应用即日起报错
- **退役流程**：Legacy（遗留）→ Retired（退役），API 直接返回错误

### 解读：这意味着什么

> 以下为编辑分析，非原文内容

- **解读**：Haiku 3 退役是 Anthropic 清理模型版本的常规操作，但"即日报错"的硬截止方式对未及时迁移的开发者影响较大，需立即检查代码中的模型 ID 硬编码
- **解读**：迁移到 Haiku 3.5 通常是无缝的，但需注意 Haiku 3.5 的定价和能力与 Haiku 3 存在差异，建议迁移后重新评估成本
- **解读**：对国内开发者而言，如果通过第三方 API 中转服务使用 Claude，需确认中转服务是否已同步更新模型 ID 映射

### 迁移操作

将代码中的模型 ID 从 `claude-haiku-3-20240307` 替换为 `claude-haiku-3-5`
