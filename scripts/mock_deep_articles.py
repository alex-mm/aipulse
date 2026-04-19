import urllib.request, json, sys

URL = 'https://vhhpuhjmsikrypbhotrp.supabase.co'
KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZoaHB1aGptc2lrcnlwYmhvdHJwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjU3MDE2MSwiZXhwIjoyMDkyMTQ2MTYxfQ.AsABDmuP9OhZIeQAJMNwUTTyTi8Uarbw2FSaSdfn7tc'
EID = 'bc312215-0f55-443c-a884-5f9548f92101'
HDRS = {'apikey': KEY, 'Authorization': 'Bearer ' + KEY, 'Content-Type': 'application/json', 'Prefer': 'return=representation'}

def sb(method, path, body=None):
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(URL + path, data=data, headers=HDRS, method=method)
    try:
        with urllib.request.urlopen(req) as resp:
            t = resp.read()
            return json.loads(t) if t else []
    except urllib.error.HTTPError as e:
        sys.stderr.write(f'HTTP {e.code}: {e.read().decode()}\n')
        return None

OVERSEAS = [
    {
        'title': 'Claude 4 Sonnet 深度解读：代码能力跨越与 300K 上下文',
        'summary': 'HumanEval 96.3%、SWE-bench 72.7%，Context 扩至 300K。Extended Thinking 机制让 Claude 4 在复杂工程任务上接近四分之三自动修复率。',
        'source_name': 'Anthropic Blog',
        'source_url': 'https://anthropic.com/blog',
        'tags': ['Anthropic', 'Claude4', '模型评测'],
        'content': '# Claude 4 Sonnet 深度解读：代码能力跨越与 300K 上下文\n\n**来源**：[Anthropic Blog](https://anthropic.com/blog) | **发布时间**：2026-04-18\n\n## 核心发布内容\n\n- **HumanEval**：96.3%（GPT-4o 为 90.2%，提升 6.1 个百分点）\n- **SWE-bench Verified**：72.7%（前代 Claude 3.7 为 62.3%）\n- **Context Window**：从 200K 扩至 **300K tokens**，约等于 230 万字中文\n- **响应延迟**：首 token 延迟降低 28%\n\n## 关键新特性\n\n**Extended Thinking（扩展思考）**：Claude 4 在回答前可进行「内部推理」，在数学证明、代码调试、逻辑分析场景中效果显著。\n\n**Projects（项目记忆）**：用户可创建「项目」，Claude 会记住项目背景、偏好设置和历史文件。\n\n## 定价\n\n| 模型 | 输入（/MTok） | 输出（/MTok） |\n|------|-------------|-------------|\n| Claude 4 Sonnet | $3 | $15 |\n| Claude 3.7 Sonnet | $3 | $15 |\n| Claude 3.5 Haiku | $0.8 | $4 |\n\n## 编辑解读\n\nSWE-bench 的突破值得重点关注——**72.7% 意味着接近四分之三的真实 GitHub 工程问题可以被 AI 自动解决**，这是一个质变阈值。',
    },
    {
        'title': 'MCP 2.0 深度解读：AI 工具生态进入标准化时代',
        'summary': 'OAuth 2.1 鉴权 + 流式工具结果 + 官方 Server Registry（1847 个社区服务器）。MCP 正在形成类似 REST API 的行业壁垒，国内厂商已全面跟进。',
        'source_name': 'Model Context Protocol',
        'source_url': 'https://modelcontextprotocol.io',
        'tags': ['MCP', 'Anthropic', '协议标准'],
        'content': '# MCP 2.0 深度解读：AI 工具生态进入标准化时代\n\n**来源**：[Model Context Protocol](https://modelcontextprotocol.io) | **发布时间**：2026-04-18\n\n## 什么是 MCP？\n\nMCP（Model Context Protocol）是由 Anthropic 主导的开放协议，目标是让 AI 模型能够以标准化方式调用外部工具和数据源。\n\n> 类比：MCP 之于 AI Agent，相当于 USB-C 之于数据线——统一接口，互联互通。\n\n## MCP 2.0 核心变化\n\n### 1. OAuth 2.1 鉴权标准\n\n旧版 MCP 缺乏统一权限管控，2.0 引入 OAuth 2.1，支持细粒度权限、Token 过期刷新、多租户隔离。\n\n### 2. Streaming Tool Results\n\n工具调用结果支持边计算边输出，大文件分析、数据库查询体验大幅提升。\n\n### 3. MCP Server Registry\n\n官方 MCP Server Hub 收录：官方服务器 156 个，社区服务器 1847 个。\n\n## 编辑解读\n\nMCP 生态正在形成壁垒。**国内厂商（阿里百炼、字节扣子）已宣布支持 MCP，这场协议战将深刻影响未来两年 AI Agent 生态格局**。',
    },
    {
        'title': 'A2A 协议 v1.0 深度解读：Agent 互联时代到来',
        'summary': 'Google 主导的 Agent-to-Agent 协议正式定稿。Agent Card + Task 标准 + OAuth 2.1，与 MCP 形成「工具层 + 编排层」完整 AI 基础设施栈。',
        'source_name': 'Google Developers Blog',
        'source_url': 'https://blog.google/technology/ai/',
        'tags': ['A2A', 'Google', 'Agent协议'],
        'content': '# A2A 协议 v1.0 深度解读：Agent 互联时代到来\n\n**来源**：[Google Developers Blog](https://blog.google/technology/ai/) | **发布时间**：2026-04-17\n\n## A2A 是什么？\n\nA2A（Agent-to-Agent）协议由 Google 主导，解决不同厂商的 AI Agent 之间如何通信的问题。\n\n## v1.0 核心规范\n\n**Agent Card（能力名片）**：每个 Agent 公开 `.well-known/agent.json`，说明能力、输入输出格式、定价。\n\n**Task（任务单元）**：标准化任务描述，支持异步执行 + 流式进度回调 + 内置超时/重试。\n\n## MCP vs A2A\n\n| 维度 | MCP | A2A |\n|------|-----|-----|\n| 定位 | 模型调用工具 | Agent 委托 Agent |\n| 主导方 | Anthropic | Google |\n| 层级 | 工具层 | 编排层 |\n\n## 编辑解读\n\n**未来的 AI 应用栈可能是：A2A（Agent 网络）→ MCP（工具接入）→ 具体 AI 模型**。这场标准战的走向值得持续关注。',
    },
    {
        'title': 'o3-mini 降价 60% 深度分析：推理模型价格战开始了',
        'summary': 'o3-mini 现比 GPT-4o 还便宜，推理能力却显著更强。DeepSeek R1 的冲击效应传导到 OpenAI 定价，预计 2026 底推理成本跌破 $0.5/MTok。',
        'source_name': 'OpenAI API Blog',
        'source_url': 'https://openai.com/blog',
        'tags': ['OpenAI', 'o3-mini', '定价策略'],
        'content': '# o3-mini 降价 60% 深度分析：推理模型价格战开始了\n\n**来源**：[OpenAI API Blog](https://openai.com/blog) | **发布时间**：2026-04-18\n\n## 定价变化\n\n| 模型 | 输入（/MTok） | 输出（/MTok） | 变化 |\n|------|-------------|-------------|------|\n| o3-mini | $1.1 | $4.4 | 较发布时降价 60% |\n| o1-mini | $3 | $12 | 不变 |\n| GPT-4o | $2.5 | $10 | 不变 |\n\n**o3-mini 现在比 GPT-4o 还便宜**，但推理能力显著超越 GPT-4o。\n\n## 适用场景\n\n**适合**：复杂数学题、代码调试与重构、多步推理分析\n\n**不适合**：创意写作、简单问答、实时对话\n\n## 编辑解读\n\nDeepSeek R1 的冲击效应已传导到 OpenAI 定价策略。**预计 2026 年底，1MTok 输入成本会跌破 $0.5，「凡事先跑一遍推理」将成为 AI 应用的默认模式**。',
    },
]

DOMESTIC = [
    {
        'title': 'DeepSeek R2 传闻深度分析：32B 打 o3 是真的吗？',
        'summary': 'NSA 稀疏注意力 + MoE 精简架构，若属实则 2 张 A100 即可私有化部署 o3 级推理能力，将彻底重塑国内 API 定价格局。',
        'source_name': '量子位 · 即刻社区',
        'source_url': 'https://www.qbitai.com',
        'tags': ['DeepSeek', 'R2', '推理模型'],
        'content': '# DeepSeek R2 传闻深度分析：32B 打 o3 是真的吗？\n\n**来源**：量子位、即刻社区 | **整理时间**：2026-04-18\n\n## 传闻可信度\n\n消息来自多个独立渠道：即刻匿名内部人士、量子位知情人士（「推理速度是 R1 的 3-5 倍」）、Reddit r/LocalLLaMA 内测邀请。**可信度评估**：中等，但此前 V3 和 R1 发布前都有类似传言，且最终准确。\n\n## 技术路径推测\n\n**Native Sparse Attention（NSA）**：传统注意力 O(n²) → NSA 近似 O(n log n)，长文本速度提升 40%，内存降低 35%。\n\n**MoE 架构升级**：V3 为 671B 总参数激活 37B，推测 R2 总参数缩减至 200-300B，但激活参数更集中。\n\n## 影响推演\n\n| 场景 | 影响 |\n|------|------|\n| 国内 API 定价 | 进一步下探，倒逼阿里/字节降价 |\n| 本地部署 | 32B 可在 2 张 A100 上运行 |\n| 对 OpenAI 的压力 | o3 定价护城河进一步缩小 |\n\n## 编辑解读\n\n**如果 R2 真能以 32B 参数实现 o3 级别推理，这将是一次彻底的效率革命，意义堪比 2023 年 LLaMA 开源对闭源大模型生态的冲击**。',
    },
    {
        'title': 'Qwen3-Max 与百炼 MCP 支持深度解读：阿里的双轮驱动策略',
        'summary': 'CMMLU 92.7% 中文基准领先 + 百炼平台 MCP 一键接入。「模型+平台」双轮驱动策略下，MCP 标准化反而提高了阿里生态的黏性。',
        'source_name': '阿里云官方博客',
        'source_url': 'https://developer.aliyun.com',
        'tags': ['Qwen3', '阿里', 'MCP'],
        'content': '# Qwen3-Max 与百炼 MCP 支持深度解读：阿里的双轮驱动策略\n\n**来源**：[阿里云官方博客](https://developer.aliyun.com) | **发布时间**：2026-04-17\n\n## Qwen3-Max 基准对比\n\n| 基准 | Qwen3-Max | GPT-4o | Claude 3.7 |\n|------|-----------|--------|------------|\n| MMLU | 89.2% | 87.8% | 88.1% |\n| CMMLU（中文） | **92.7%** | 83.1% | 81.5% |\n| HumanEval | 91.3% | 90.2% | 93.6% |\n| MATH | 87.6% | 76.6% | 78.3% |\n\n中文理解方向有明显优势，得益于阿里在中文语料上的长期积累。\n\n## 百炼平台 MCP 支持\n\n1. **一键接入**：输入 Server URL，自动解析工具定义\n2. **自定义 Server**：通过 SDK 封装业务 API\n3. **权限管控**：基于 ACL 控制调用权限\n\n**实际示例**：企业 Agent 同时调用钉钉日历 + OSS + 自定义 ERP 的 MCP Server。\n\n## 编辑解读\n\n阿里的策略是「模型 + 平台」双轮驱动。**MCP 支持是关键一步——在工具接入标准化之后，反而更有利于阿里这样的「大而全」平台**，开发者在一处接入所有工具，迁移成本反而更高。',
    },
    {
        'title': '扣子 Agent Flow 深度解读：国内最接近 LangGraph 的产品',
        'summary': '6 种节点覆盖 LLM/插件/条件/循环/子Agent/代码，无代码拖拽编排。对 AI 研发工程师的真实影响：低代码工具解决 70% 需求，复杂场景仍需工程能力。',
        'source_name': '字节扣子官方文档',
        'source_url': 'https://www.coze.cn',
        'tags': ['字节', 'Coze', 'Agent编排'],
        'content': '# 扣子 Agent Flow 深度解读：国内最接近 LangGraph 的产品\n\n**来源**：[字节扣子官方文档](https://www.coze.cn) | **整理时间**：2026-04-18\n\n## 核心节点类型\n\n| 节点类型 | 功能 |\n|----------|------|\n| LLM 节点 | 调用大模型进行推理 |\n| 插件节点 | 调用扣子插件市场中的工具 |\n| 条件节点 | 根据结果走不同分支 |\n| 循环节点 | 重复执行直到满足条件 |\n| 子 Agent 节点 | 调用另一个已定义的 Agent |\n| 代码节点 | 执行自定义 JavaScript 逻辑 |\n\n## 与 LangGraph 对比\n\n| 维度 | 扣子 Agent Flow | LangGraph |\n|------|----------------|----------|\n| 上手难度 | 无代码拖拽 | 需要 Python |\n| 灵活性 | 有限预定义节点 | 完全灵活 |\n| 适合人群 | 产品/运营 | 工程师 |\n\n## 编辑解读\n\n对于 AI 研发工程师而言，这是个好消息——**越多人能「搭」Agent，就越需要懂底层的工程师来「优化」和「扩展」**。低代码工具解决了 70% 的常见需求，复杂场景仍然需要代码。',
    },
    {
        'title': 'Kimi 1.5 的 200 万 Token 深度解读：长文本的边界在哪里？',
        'summary': '200 万 token ≈ 1500 页 PDF。Lost in the Middle 问题降低 60%，首次响应压缩至 45 秒。胜负不在窗口大小，在真实任务准确率。',
        'source_name': '月之暗面技术博客',
        'source_url': 'https://kimi.moonshot.cn',
        'tags': ['Kimi', '月之暗面', '长文本'],
        'content': '# Kimi 1.5 的 200 万 Token 深度解读：长文本的边界在哪里？\n\n**来源**：[月之暗面技术博客](https://kimi.moonshot.cn) | **发布时间**：2026-04-18\n\n## 200 万 Token 意味着什么？\n\n- 150 万字中文文本 / 约 1500 页 PDF / 约 10 万行代码\n- 可以把整部《红楼梦》（73 万字）塞进去\n\n## 核心技术挑战\n\n**Lost in the Middle 问题**：LLM 对文档中间部分的信息回忆显著弱于开头/结尾。Kimi 1.5 通过训练数据增强和位置编码改进，将这一问题降低了 60%。\n\n**推理延迟**：通过分布式推理和 KV Cache 优化，将首次响应时间压缩至约 45 秒。\n\n## 实际测试结论\n\n| 场景 | 表现 |\n|------|------|\n| 合同审查 | 优秀，能精准定位风险条款 |\n| 学术论文批量阅读 | 良好，摘要准确率约 88% |\n| 代码库全局理解 | 一般，对深层依赖关系有误差 |\n| 多文档交叉分析 | 良好，能对比不同文档差异 |\n\n## 编辑解读\n\nKimi 押注长文本方向是对的，**但最终胜负取决于「真实任务的准确率」，而不是 Context 窗口的绝对大小**。',
    },
]

print('=== 开始处理 ===', flush=True)

# Step 1: 查询并删除现有 deep 文章
print('Step1: 查询现有 deep 文章...', flush=True)
existing = sb('GET', f'/rest/v1/articles?edition_id=eq.{EID}&tier=eq.deep&select=id,title')
print(f'  找到 {len(existing) if existing else 0} 条', flush=True)
if existing:
    for a in existing:
        sb('DELETE', f'/rest/v1/article_tags?article_id=eq.{a["id"]}')
    sb('DELETE', f'/rest/v1/articles?edition_id=eq.{EID}&tier=eq.deep')
    print('  删除完成', flush=True)

# Step 2: 写入海外深读
print('\nStep2: 写入海外深读...', flush=True)
for a in OVERSEAS:
    tags = a.pop('tags')
    a.update({'edition_id': EID, 'region': 'overseas', 'tier': 'deep', 'published_at': '2026-04-19T00:00:00+00:00'})
    d = sb('POST', '/rest/v1/articles', a)
    art = d[0] if isinstance(d, list) else d
    if art and art.get('id'):
        if tags: sb('POST', '/rest/v1/article_tags', [{'article_id': art['id'], 'tag': t} for t in tags])
        print(f'  + {art["id"][:8]} | {a["title"][:45]}', flush=True)
    else:
        print(f'  ERROR: {d}', flush=True)

# Step 3: 写入国内深读
print('\nStep3: 写入国内深读...', flush=True)
for a in DOMESTIC:
    tags = a.pop('tags')
    a.update({'edition_id': EID, 'region': 'domestic', 'tier': 'deep', 'published_at': '2026-04-19T00:00:00+00:00'})
    d = sb('POST', '/rest/v1/articles', a)
    art = d[0] if isinstance(d, list) else d
    if art and art.get('id'):
        if tags: sb('POST', '/rest/v1/article_tags', [{'article_id': art['id'], 'tag': t} for t in tags])
        print(f'  + {art["id"][:8]} | {a["title"][:45]}', flush=True)
    else:
        print(f'  ERROR: {d}', flush=True)

# Step 4: 验证
print('\nStep4: 验证结果...', flush=True)
all_deep = sb('GET', f'/rest/v1/articles?edition_id=eq.{EID}&tier=eq.deep&select=id,region,title')
print(f'deep 文章总数: {len(all_deep) if all_deep else 0} 条', flush=True)
for a in (all_deep or []):
    print(f'  [{a["region"]}] {a["title"][:50]}', flush=True)
print('\n=== 完成 ===', flush=True)
