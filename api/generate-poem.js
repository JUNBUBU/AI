export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { role, task, requirements } = req.body;

  const blocked = ['暴力', '恐怖', '死亡', '政治'];
  const hasBad = (text) => blocked.some(w => text.includes(w));

  let prompt = `你是一个${role}，请帮我${task}。要求：`;
  if (requirements.includes('阳光')) prompt += '使用“阳光”“拥抱”“微笑”；';
  if (requirements.includes('不要辛苦')) prompt += '不要出现负面词汇；';
  if (requirements.includes('可爱')) prompt += '风格可爱；';
  else if (requirements.includes('古风')) prompt += '风格古风；';
  prompt += '只输出4行诗，不要解释，不要标题。';

  if (hasBad(prompt)) {
    return res.json({ error: '内容不符合儿童安全规范' });
  }

  try {
    const response = await fetch(
      'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.DASHSCOPE_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'qwen-max',
          input: { messages: [{ role: 'user', content: prompt }] },
          parameters: { max_tokens: 200 }
        })
      }
    );

    const result = await response.json();
    if (!response.ok) throw new Error(result.message || 'API error');

    const poem = result.output.text.trim();
    if (hasBad(poem)) {
      return res.json({ error: 'AI生成内容存在风险，已拦截' });
    }

    res.json({ poem });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'AI服务暂时不可用，请重试' });
  }
}
