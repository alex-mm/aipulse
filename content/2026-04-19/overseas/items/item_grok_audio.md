---
title: xAI Grok STT/TTS 音频 API 正式发布 | 2026-04-13 ~ 2026-04-19
date: 2026-04-19
region: overseas
tier: item
tags: [xAI, Grok, STT, TTS, 语音API, 多语言]
sync_version: 1
---

# 📄 xAI Grok STT/TTS 音频 API 正式发布 | 单条深度解读

> [← 返回海外速报](../briefing/overseas_briefing_20260419.md) ｜ [← 返回 xAI 分类解读](../category/category_xai.md)

---

**来源**：[xAI 官方博客](https://x.ai/blog)
**事件日期**：04-17
**可靠性**：✅ 官方发布

---

### 事实摘要

- xAI 于 **04-17** 正式发布 Grok STT（语音转文字）和 TTS（文字转语音）音频 API
- TTS 定价 **$4.20/M 字符**，STT 批处理 **$0.10/小时**、流式 **$0.20/小时**
- 支持 **25 种语言**，5 种固定音色，兼容 OpenAI REST endpoint 格式

### 关键细节

**定价对比：**

| 产品 | TTS 定价 | STT 定价 | 对比 |
|------|---------|---------|------|
| **xAI Grok TTS** | **$4.20/M 字符** | **$0.10/小时（批处理）** | 基准 |
| OpenAI TTS | $15/M 字符 | - | TTS 贵 3.6x |
| ElevenLabs | $11/M 字符 | - | TTS 贵 2.6x |
| Deepgram STT | - | ~$0.25/小时 | STT 贵 2.5x |

**TTS 特有功能：**
- **5 种固定音色**：Ara / Eve / Leo / Rex / Sal
- **内联语音标签**：`[pause]` / `[whisper]` / `[laugh]` 等情感控制
- **G.711 电话格式**：支持电话系统集成
- **兼容 OpenAI REST**：可直接替换 OpenAI TTS 调用，无需大改代码

**STT 特有数据：**
- **实体识别错误率 5.0%**：官方声称行业最低
- 支持批处理（$0.10/小时）和流式（$0.20/小时）两种模式

### 解读：这意味着什么

> 以下为编辑分析，非原文内容

- **解读**：TTS $4.20/M 字符 vs OpenAI $15/M 字符，价格差距达 3.6 倍，若质量达标，将对 OpenAI TTS 和 ElevenLabs 形成显著价格压力。兼容 OpenAI REST 格式降低了迁移成本
- **解读**：内联语音标签（`[pause]`/`[whisper]`/`[laugh]`）是差异化功能，允许开发者在文本中直接控制语音情感，比纯粹的 TTS 更适合对话式 AI 应用
- **解读**：25 种语言支持是重要的国际化信号，xAI 正在将 Grok 从英语市场向全球市场扩展，语音 API 的发布完善了 xAI 的 API 产品矩阵（文本 → 图像 → 语音）
- **解读**：对国内开发者而言，xAI API 目前在国内访问存在限制，实际可用性需验证；但其低价策略值得关注，可能推动整个语音 API 市场降价

### 原文关键引述

> "Grok TTS+STT API 正式上线：TTS $4.20/M 字符（OpenAI 同类 $15/M，低 72%），STT 批处理 $0.10/小时、流式 $0.20/小时；5 种固定音色；支持内联语音标签；STT 实体识别错误率 5.0%（行业最低）；兼容 OpenAI REST endpoint 格式。"
