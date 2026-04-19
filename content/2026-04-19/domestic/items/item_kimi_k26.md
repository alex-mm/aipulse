---
title: Kimi K2.6-code-preview：SWE-bench Verified 77.2% 登顶 | 2026-04-13 ~ 2026-04-19
date: 2026-04-19
region: domestic
tier: item
tags: [月之暗面, Kimi, 编码能力, SWE-bench, 国产编程模型]
sync_version: 1
---

# 📄 Kimi K2.6-code-preview：SWE-bench Verified 77.2% | 单条深度解读

> [← 返回国内速报](../briefing/domestic_briefing_20260419.md) ｜ [← 返回月之暗面/Kimi 分类解读](../category/category_kimi.md)

---

**来源**：[ZOL](https://ai.zol.com.cn/1165/11653449.html)
**事件日期**：04-14
**可靠性**：✅ 官方发布

---

### 事实摘要

- 月之暗面于 **04-14** 发布 Kimi K2.6-code-preview，万亿参数编程专项模型
- **SWE-bench Verified 77.2%**，超越 Claude Sonnet 4.5（75.0%）和 Qwen3.6-35B-A3B（73.4%）
- 256K 上下文，Kimi Code 控制台标注为旗舰模型（Flagship model）
- 目前仅 Kimi 会员开放（39 元/月），通过 Kimi API 开放调用

### 关键细节

**SWE-bench Verified 77.2% 的历史背景：**

| 时间 | 最高分 | 模型 |
|------|--------|------|
| 2025 年初 | ~30% | 最佳模型 |
| 2025 年中 | ~50% | GPT-4o / Claude 3.5 |
| 2025 年底 | ~65% | Claude 3.7 Sonnet |
| 2026-04-14 | **77.2%** | Kimi K2.6-code-preview |

**与其他模型的公平对比：**

> ⚠️ 重要：以下对比需注意测试集差异

| 模型 | 基准 | 分数 | 可比性 |
|------|------|------|--------|
| Kimi K2.6-code-preview | SWE-bench **Verified** | **77.2%** | 基准A |
| Claude Sonnet 4.5 | SWE-bench **Verified** | 75.0% | 基准A（可比）|
| Qwen3.6-35B-A3B | SWE-bench **Verified** | 73.4% | 基准A（可比）|
| Claude Opus 4.7 | SWE-bench **Pro** | 64.3% | 基准B（不可直比）|

- **SWE-bench Verified**：~500 个真实 GitHub Issue 修复任务（人工验证）
- **SWE-bench Pro**：更难的扩展版本，包含更复杂的多文件修改任务
- 两者不直接可比，Kimi 77.2% vs Opus 4.7 64.3% 是不同测试集

**77.2% 的实际含义：**

SWE-bench Verified 包含约 500 个真实 GitHub Issue（Django/Flask/Sympy/Scikit-learn 等知名项目）。77.2% 意味着在 500 个真实 Bug 修复任务中，Kimi K2.6 能独立解决约 **386 个**，无需人工介入。

**API 信息：**
- 可用性：Kimi API（platform.moonshot.cn）
- 状态：preview（预览版），功能持续迭代
- 定价：与 K2.5 相同

### 解读：这意味着什么

> 以下为编辑分析，非原文内容

- **解读**："code-preview"命名说明月之暗面采用"分能力维度发布"策略——编程能力已达发布标准，但整体模型仍在优化。正式版（K2.6）可能在非编程能力上还有提升空间
- **解读**：77.2% 不等于"替代程序员"。SWE-bench 测试的是特定类型任务（真实 GitHub Issue 修复），软件工程还涉及需求理解、架构设计、代码审查、团队协作等 SWE-bench 测试范围之外的能力
- **解读**：Kimi K2.6 vs Qwen Code（基于 Qwen3.6）vs Claude Code（基于 Opus 4.7）的三方竞争正在形成。国内开发者面临真实选择：高性能国产模型（数据留境）vs 顶级海外 API（更成熟工具链）
- **解读**：对于处理国内代码库（中文注释/国内框架/内网 Git）的场景，Kimi K2.6 有语言和部署优势，值得用同一批代码任务与 Claude Code 做横向对比测试

### 原文关键引述

> "Kimi K2.6-code-preview 在 SWE-bench Verified 上达到 77.2%，超越了上一代 K2.5 的 74.5%，展示了显著的编程能力提升。"
