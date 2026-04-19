const https = require('https');

const URL_BASE = process.env.VITE_SUPABASE_URL || '';
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const EID = 'bc312215-0f55-443c-a884-5f9548f92101';
const BRIEF_OVERSEAS_ID = '6b184841-fdc9-46ad-ba8d-cba277b25355';
const BRIEF_DOMESTIC_ID = '15857bbe-c595-4888-a884-f77be12315a1';

const HDRS = {
  'apikey': KEY,
  'Authorization': 'Bearer ' + KEY,
  'Content-Type': 'application/json',
  'Prefer': 'return=representation'
};

function sb(method, path, body) {
  return new Promise((resolve) => {
    const url = new URL(URL_BASE + path);
    const data = body ? JSON.stringify(body) : undefined;
    const options = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method: method,
      headers: { ...HDRS, ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}) }
    };
    const req = https.request(options, (res) => {
      let chunks = '';
      res.on('data', d => chunks += d);
      res.on('end', () => {
        if (res.statusCode >= 400) {
          console.error('HTTP ' + res.statusCode + ': ' + chunks.slice(0, 200));
          resolve(null);
        } else {
          try { resolve(chunks ? JSON.parse(chunks) : []); } catch(e) { resolve(null); }
        }
      });
    });
    req.on('error', (e) => { console.error(e.message); resolve(null); });
    if (data) req.write(data);
    req.end();
  });
}

const DEEP_OVERSEAS = [
  {
    title: 'Anthropic 阵营深读：Claude 4 + MCP 2.0 + 开发者生态三线并进',
    summary: 'Claude 4 代码能力跨越、MCP 协议标准化、开发者平台扩张——Anthropic 本期以「模型 + 协议 + 生态」三驾马车构建护城河。',
    source_name: 'AI Pulse 编辑部',
    source_url: '',
    tags: ['Anthropic', 'Claude4', 'MCP'],
    content: '# Anthropic 阵营深读：Claude 4 + MCP 2.0 + 开发者生态三线并进\n\n> 本期覆盖时间：2026-04-18 ~ 2026-04-19 · 预计阅读 12 分钟\n\n## 本期核心事件\n\n本期 Anthropic 阵营发布了三件相互关联的大事，理解它们之间的逻辑关系，是理解 Anthropic 战略的关键。\n\n---\n\n## 第一线：Claude 4 Sonnet 发布\n\n**数据亮点**\n\n- HumanEval 96.3%（行业领先）\n- SWE-bench Verified 72.7%（实际工程问题自动修复率）\n- Context Window 扩至 300K tokens\n\n**编辑解读**\n\nSWE-bench 72.7% 是这次发布最值得关注的数据。它意味着**接近四分之三的真实 GitHub 工程问题可以被 AI 自动解决**，这已经是一个质变阈值，而不只是渐进改进。\n\n---\n\n## 第二线：MCP 2.0 正式发布\n\nMCP 2.0 的核心升级：OAuth 2.1 鉴权 + 流式结果 + 官方 Server Registry（1847 个社区服务器）。\n\n**与 Claude 4 的战略关联**：MCP 是 Claude 4 的「乘数」。更多工具接入 = Claude 可处理更多真实任务 = SWE-bench 之类的评测持续提升。\n\n---\n\n## 第三线：开发者生态扩张\n\nClaude.ai Pro 新增 Projects 功能（项目记忆），API 开放 Extended Thinking 参数。\n\n---\n\n## 编辑总结：三线并进的护城河逻辑\n\n| 层级 | 内容 | 战略意图 |\n|------|------|----------|\n| 模型层 | Claude 4 Sonnet | 代码能力第一 |\n| 协议层 | MCP 2.0 | 锁定工具生态 |\n| 平台层 | Projects + Extended Thinking | 提高用户粘性 |\n\n**Anthropic 并不只是在做模型，它在布局一套完整的「AI 基础设施」**。MCP 协议若成为行业标准，就像 HTTP 之于互联网——主导方将获得极强的生态溢价。',
  },
  {
    title: 'Google 阵营深读：A2A 协议定稿 + Gemini 2.5 双线布局',
    summary: 'A2A v1.0 协议正式定稿（与 MCP 形成「工具层+编排层」互补），Gemini 2.5 Flash 推出低价版本抢占中低端市场。',
    source_name: 'AI Pulse 编辑部',
    source_url: '',
    tags: ['Google', 'A2A', 'Gemini'],
    content: '# Google 阵营深读：A2A 协议定稿 + Gemini 2.5 双线布局\n\n> 本期覆盖时间：2026-04-17 ~ 2026-04-19 · 预计阅读 10 分钟\n\n## 本期核心事件\n\nGoogle 本期的两个动作——A2A 协议定稿和 Gemini 2.5 Flash 新版本——看似独立，实则有深层战略逻辑。\n\n---\n\n## A2A 协议 v1.0 定稿\n\n**核心规范**\n\n- Agent Card：每个 Agent 公开 `.well-known/agent.json`，声明能力\n- Task 标准：异步执行 + 流式进度回调 + 内置超时/重试\n- OAuth 2.1：与 MCP 2.0 共享鉴权标准\n\n**MCP vs A2A 的互补关系**\n\n| 层级 | 协议 | 主导方 | 解决的问题 |\n|------|------|--------|----------|\n| 工具层 | MCP | Anthropic | 模型如何调用外部工具 |\n| 编排层 | A2A | Google | Agent 如何委托另一个 Agent |\n\n**编辑解读**：这两个协议并非竞争关系，而是互补的两层。未来 AI 应用栈可能是：**A2A（Agent 网络）→ MCP（工具调用）→ 具体模型**。\n\n---\n\n## Gemini 2.5 Flash 新定价\n\n新的 Gemini 2.5 Flash 版本将输入价格降至 $0.075/MTok，对标 DeepSeek V3。\n\n**战略意图**：高端市场用 Gemini 2.5 Pro 竞争，中低端市场用 Flash 价格战，两头堵截。\n\n---\n\n## 编辑总结\n\nGoogle 是目前唯一有能力同时主导「协议标准」和「模型性能」两条线的公司。**A2A 若成功推广，Google 将在 Agent 编排层获得类似 Android 在移动端的地位**。',
  },
  {
    title: 'OpenAI 阵营深读：o3-mini 降价背后的推理民主化战略',
    summary: 'o3-mini 降价 60%，比 GPT-4o 还便宜但推理更强。DeepSeek 压力传导，推理成本正在走向「免费」的临界点。',
    source_name: 'AI Pulse 编辑部',
    source_url: '',
    tags: ['OpenAI', 'o3-mini', '推理模型'],
    content: '# OpenAI 阵营深读：o3-mini 降价背后的推理民主化战略\n\n> 本期覆盖时间：2026-04-18 ~ 2026-04-19 · 预计阅读 8 分钟\n\n## 核心事件\n\no3-mini 降价 60%，现在比 GPT-4o 还便宜。\n\n| 模型 | 输入（/MTok） | 输出（/MTok） | 与 GPT-4o 比较 |\n|------|-------------|-------------|---------------|\n| o3-mini（新） | $1.1 | $4.4 | 便宜 56% |\n| GPT-4o | $2.5 | $10 | 基准 |\n| o1-mini | $3 | $12 | 贵 20% |\n\n---\n\n## 降价的真实原因\n\n**直接原因**：DeepSeek R1 价格冲击（o1 级能力但价格不到 1/10）。\n\n**深层原因**：OpenAI 需要在「推理模型普及」这个叙事上占据主导地位，而不是被 DeepSeek 抢走推理民主化的旗帜。\n\n---\n\n## 推理成本曲线预测\n\n基于过去 18 个月的降价轨迹：\n\n- 2025 年初：推理级模型 $15/MTok 输入\n- 2026 年初：$3/MTok\n- **预测 2026 年底：跌破 $0.5/MTok**\n\n---\n\n## 编辑总结\n\n**「凡事先跑一遍推理」即将成为 AI 应用的默认模式**。当推理成本接近零时，产品竞争将从「谁的推理更便宜」转向「谁的推理结果更可信、更可控」。',
  },
];

const DEEP_DOMESTIC = [
  {
    title: 'DeepSeek 阵营深读：R2 传闻背后的技术路径与行业影响',
    summary: 'NSA 稀疏注意力 + MoE 精简，若传闻属实则 2 张 A100 可私有化部署 o3 级推理能力，国内 API 定价格局将彻底重塑。',
    source_name: 'AI Pulse 编辑部',
    source_url: '',
    tags: ['DeepSeek', 'R2', '推理模型'],
    content: '# DeepSeek 阵营深读：R2 传闻背后的技术路径与行业影响\n\n> 本期覆盖时间：2026-04-18 ~ 2026-04-19 · 预计阅读 10 分钟\n\n## 传闻可信度评估\n\n| 信息来源 | 可信度 |\n|---------|--------|\n| 即刻匿名内部人士 | 中 |\n| 量子位知情人士 | 中高 |\n| Reddit r/LocalLLaMA 内测邀请 | 中 |\n\n历史参考：V3 和 R1 发布前均有类似传言，最终准确。**综合评估：R2 真实性较高，但参数细节可能有出入**。\n\n---\n\n## 技术路径分析\n\n**Native Sparse Attention（NSA）**\n\n传统 Self-Attention 复杂度 O(n²)，NSA 降至 O(n log n)：\n- 长文本推理速度提升约 40%\n- 内存占用降低约 35%\n\n**MoE 架构升级**\n\n- V3：671B 总参数，激活 37B\n- R2（传闻）：200-300B 总参数，激活参数更集中\n\n---\n\n## 如果 R2 属实，影响链条\n\n| 场景 | 影响 |\n|------|------|\n| 国内 API 定价 | 进一步下探，倒逼阿里/字节降价 |\n| 本地部署 | 32B 可在 2 张 A100 上运行 |\n| 对 OpenAI 的压力 | o3 定价护城河进一步缩小 |\n\n---\n\n## 编辑总结\n\n**DeepSeek 的真正威胁不是某一款模型，而是它反复证明了「用更少资源做更好性能」的可行性**。这种能力迫使整个行业重新思考算力投入的边界报酬。',
  },
  {
    title: '阿里+字节阵营深读：MCP 标准化下的平台黏性博弈',
    summary: 'Qwen3-Max 中文基准领先 + 百炼 MCP 一键接入；扣子 Agent Flow 无代码编排。两家巨头在 MCP 标准化浪潮中选择了相似但细节不同的策略。',
    source_name: 'AI Pulse 编辑部',
    source_url: '',
    tags: ['阿里', '字节', 'MCP', 'Agent编排'],
    content: '# 阿里+字节阵营深读：MCP 标准化下的平台黏性博弈\n\n> 本期覆盖时间：2026-04-17 ~ 2026-04-19 · 预计阅读 12 分钟\n\n## 为什么把阿里和字节放在一起分析？\n\n两家公司本期都推出了与 MCP 相关的重要更新，但策略路径截然不同，放在一起对比更有洞察价值。\n\n---\n\n## 阿里：Qwen3-Max + 百炼 MCP\n\n| 基准 | Qwen3-Max | GPT-4o |\n|------|-----------|--------|\n| CMMLU（中文）| **92.7%** | 83.1% |\n| MMLU | 89.2% | 87.8% |\n\n中文方向优势明显，这是阿里的护城河。\n\n**战略逻辑**：MCP 标准化看似「开放」，实则提高了迁移成本。接入越多工具，离开百炼越难。\n\n---\n\n## 字节：扣子 Agent Flow\n\n6 种节点类型：LLM / 插件 / 条件 / 循环 / 子 Agent / 代码\n\n**战略逻辑**：把产品和运营人员变成「能做 Agent」的用户，扩大字节平台的用户基数。\n\n---\n\n## 两家策略对比\n\n| 维度 | 阿里百炼 | 字节扣子 |\n|------|---------|----------|\n| 核心卖点 | 模型能力 + MCP 生态 | 低门槛 Agent 编排 |\n| 目标客户 | 企业开发者 | 产品/运营+开发者 |\n| 黏性来源 | 工具接入成本 | 工作流迁移成本 |\n\n---\n\n## 编辑总结\n\n**MCP 标准化对中小开发者是福音，对大平台是新的机会窗口**——谁先在标准化环境下积累最多工具生态，谁就获得新一轮的平台护城河。',
  },
];

const ANALYSIS_ARTICLES = [
  {
    source_article_id: BRIEF_OVERSEAS_ID,
    region: 'overseas',
    title: 'Claude 4 Sonnet 深析：SWE-bench 72.7% 的真实含义',
    summary: 'SWE-bench 不是普通的代码评测，它代表「真实工程任务的自动化程度」。72.7% 意味着什么？又意味着什么不可能发生？',
    source_name: 'AI Pulse 编辑部',
    source_url: '',
    tags: ['Claude4', 'SWE-bench', '代码能力'],
    content: '# Claude 4 Sonnet 深析：SWE-bench 72.7% 的真实含义\n\n> 单条深析 · 预计阅读 5 分钟\n\n## SWE-bench 是什么？\n\nSWE-bench 收录来自 GitHub 的真实 Issue，要求 AI 自动修改代码使 PR 通过 CI 测试。\n\n**关键特点**：\n- 任务来自真实开源项目（Django、requests、scikit-learn 等）\n- 验证方式是运行实际测试用例，无法刷题\n- 解题需要理解整个代码库上下文\n\n## 72.7% 意味着什么？\n\n| 百分位 | 模型 | 得分 |\n|--------|------|------|\n| SOTA | Claude 4 Sonnet | 72.7% |\n| 对比 | Claude 3.7 Sonnet | 62.3% |\n| 对比 | GPT-4o | 38.2% |\n\n**一个形象的比喻**：100 个初级程序员能独立解决的 GitHub Issue 中，Claude 4 可以自动处理约 73 个。\n\n## 72.7% 意味着什么「不可能」发生？\n\n1. **不是「替代程序员」**：剩下的 27.3% 往往是最需要架构判断、产品理解的问题\n2. **不是「无监督部署」**：自动修复的代码仍需 Code Review\n3. **不是「解决所有编程语言」**：评测集以 Python 为主\n\n## 编辑观点\n\n**最合理的使用场景是「AI 先跑，人来审」**——把 AI 的自动化率从 72% 提到 90% 可能需要 5 年，但把人类审核效率提升 3 倍只需要改变工作流。',
  },
  {
    source_article_id: BRIEF_OVERSEAS_ID,
    region: 'overseas',
    title: 'MCP 2.0 深析：OAuth 2.1 为什么是最重要的升级？',
    summary: 'MCP 1.0 最大的问题不是功能少，而是没有权限管控。OAuth 2.1 的引入意味着 MCP 终于可以进入企业级场景。',
    source_name: 'AI Pulse 编辑部',
    source_url: '',
    tags: ['MCP', 'OAuth', '企业级'],
    content: '# MCP 2.0 深析：OAuth 2.1 为什么是最重要的升级？\n\n> 单条深析 · 预计阅读 4 分钟\n\n## MCP 1.0 的权限问题\n\nMCP 1.0 的工具调用没有统一鉴权机制。每个 Server 自己实现权限，导致：\n\n- 无法跨 Server 统一管理权限\n- Token 没有过期机制，安全风险高\n- 企业无法做到细粒度访问控制\n\n**结果**：MCP 1.0 基本只能在个人开发者场景用，企业拒绝接入。\n\n## OAuth 2.1 带来了什么？\n\n| 功能 | MCP 1.0 | MCP 2.0 |\n|------|---------|----------|\n| 权限粒度 | Server 自定义 | 标准 Scope 机制 |\n| Token 管理 | 无过期 | 自动刷新 + 撤销 |\n| 多租户 | 不支持 | 原生支持 |\n\n## 这对企业意味着什么？\n\n**以前**：企业 IT 部门因「权限不透明」拒绝 MCP 集成。\n\n**现在**：基于 OAuth 2.1，IT 可以统一管理 AI Agent 有权访问哪些工具，审计每次工具调用，用户离职后一键撤销授权。\n\n## 编辑观点\n\n**MCP 2.0 是 MCP 从「玩具」变「基础设施」的分水岭**。OAuth 2.1 的加入是在说：「我们做好了进入企业级场景的准备。」',
  },
  {
    source_article_id: BRIEF_DOMESTIC_ID,
    region: 'domestic',
    title: 'DeepSeek R2 传闻深析：NSA 技术的可行性评估',
    summary: 'Native Sparse Attention 不是新概念，但工程化落地难度极高。从技术角度评估 R2 传闻的可信度与潜在局限。',
    source_name: 'AI Pulse 编辑部',
    source_url: '',
    tags: ['DeepSeek', 'NSA', '稀疏注意力'],
    content: '# DeepSeek R2 传闻深析：NSA 技术的可行性评估\n\n> 单条深析 · 预计阅读 5 分钟\n\n## Native Sparse Attention 是什么？\n\n标准 Transformer 的注意力机制：每个 token 都要与序列中所有其他 token 计算相关性，复杂度 O(n²)。\n\n**NSA 的核心思路**：大多数 token 对之间的注意力权重接近零，可以跳过计算。\n\n## NSA 的工程挑战\n\n**1. 稀疏模式不规则**\n\nGPU 最擅长密集矩阵运算，稀疏矩阵计算在 GPU 上效率反而可能更低，需要专门的 Kernel 优化。\n\n**2. 动态稀疏的代价**\n\n哪些 token 对需要计算是输入相关的，无法提前确定，增加调度开销。\n\n**3. 训练稳定性**\n\n稀疏注意力在训练初期容易导致梯度不稳定。\n\n## DeepSeek 的优势\n\nDeepSeek 是少数有能力解决上述工程问题的团队：\n- V3 的 MoE 训练就曾解决类似的计算效率难题\n- 在自研 GPU Kernel 优化上有深厚积累\n\n## 可信度评估\n\n**支持 R2 使用 NSA 的证据**：多个独立渠道 + DeepSeek 有技术能力 + 推理速度「3-5 倍」提升与 NSA 理论增益吻合\n\n**综合判断：NSA 方向可信，但完整落地可能需要妥协（如只在长文本场景启用）**。',
  },
];

async function main() {
  console.log('=== Step 1: 删除旧的 deep 文章 ===');
  const existingDeep = await sb('GET', '/rest/v1/articles?edition_id=eq.' + EID + '&tier=eq.deep&select=id,title');
  if (existingDeep && existingDeep.length > 0) {
    for (const a of existingDeep) {
      await sb('DELETE', '/rest/v1/article_tags?article_id=eq.' + a.id);
    }
    await sb('DELETE', '/rest/v1/articles?edition_id=eq.' + EID + '&tier=eq.deep');
    console.log('  删除旧 deep 文章完成，共', existingDeep.length, '篇');
  } else {
    console.log('  无旧 deep 文章');
  }

  console.log('\n=== Step 2: 删除旧的 analysis 文章 ===');
  const existingAnalysis = await sb('GET', '/rest/v1/articles?edition_id=eq.' + EID + '&tier=eq.analysis&select=id,title');
  if (existingAnalysis && existingAnalysis.length > 0) {
    for (const a of existingAnalysis) {
      await sb('DELETE', '/rest/v1/article_tags?article_id=eq.' + a.id);
    }
    await sb('DELETE', '/rest/v1/articles?edition_id=eq.' + EID + '&tier=eq.analysis');
    console.log('  删除旧 analysis 文章完成，共', existingAnalysis.length, '篇');
  } else {
    console.log('  无旧 analysis 文章');
  }

  console.log('\n=== Step 3: 写入海外阵营深读 ===');
  for (const a of DEEP_OVERSEAS) {
    const { tags, ...art } = a;
    art.edition_id = EID;
    art.region = 'overseas';
    art.tier = 'deep';
    art.published_at = '2026-04-19T00:00:00+00:00';
    const d = await sb('POST', '/rest/v1/articles', art);
    const created = Array.isArray(d) ? d[0] : d;
    if (created && created.id) {
      if (tags && tags.length) await sb('POST', '/rest/v1/article_tags', tags.map(t => ({ article_id: created.id, tag: t })));
      console.log('  + [overseas/deep]', created.id.slice(0, 8), art.title.slice(0, 50));
    } else {
      console.error('  ERROR:', JSON.stringify(d));
    }
  }

  console.log('\n=== Step 4: 写入国内阵营深读 ===');
  for (const a of DEEP_DOMESTIC) {
    const { tags, ...art } = a;
    art.edition_id = EID;
    art.region = 'domestic';
    art.tier = 'deep';
    art.published_at = '2026-04-19T00:00:00+00:00';
    const d = await sb('POST', '/rest/v1/articles', art);
    const created = Array.isArray(d) ? d[0] : d;
    if (created && created.id) {
      if (tags && tags.length) await sb('POST', '/rest/v1/article_tags', tags.map(t => ({ article_id: created.id, tag: t })));
      console.log('  + [domestic/deep]', created.id.slice(0, 8), art.title.slice(0, 50));
    } else {
      console.error('  ERROR:', JSON.stringify(d));
    }
  }

  console.log('\n=== Step 5: 写入单条深析文章 ===');
  for (const a of ANALYSIS_ARTICLES) {
    const { tags, region, ...art } = a;
    art.edition_id = EID;
    art.region = region;
    art.tier = 'analysis';
    art.published_at = '2026-04-19T00:00:00+00:00';
    const d = await sb('POST', '/rest/v1/articles', art);
    const created = Array.isArray(d) ? d[0] : d;
    if (created && created.id) {
      if (tags && tags.length) await sb('POST', '/rest/v1/article_tags', tags.map(t => ({ article_id: created.id, tag: t })));
      console.log('  + [analysis/' + region + ']', created.id.slice(0, 8), art.title.slice(0, 45));
    } else {
      console.error('  ERROR:', JSON.stringify(d));
    }
  }

  console.log('\n=== Step 6: 验证结果 ===');
  const all = await sb('GET', '/rest/v1/articles?edition_id=eq.' + EID + '&select=id,tier,region,title&order=tier.asc,region.asc');
  if (all) {
    for (const a of all) {
      console.log('  [' + a.tier + '/' + a.region + '] ' + a.title.slice(0, 55));
    }
    console.log('\n总计:', all.length, '篇文章');
  }
  console.log('\n=== 完成 ===');
}

main().catch(console.error);
