export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // CORS — allow your GitHub Pages URL and localhost for testing
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { system, messages, max_tokens } = req.body;

  if (!system || !messages) {
    return res.status(400).json({ error: 'Missing system or messages' });
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-5',
        max_tokens: Math.min(max_tokens || 1500, 4000),
        system,
        messages,
        // This proxy generates marketing copy — extended reasoning adds cost and
        // latency and, on a small max_tokens budget, can consume the whole budget
        // before any text is produced. Disable it so the full budget is output.
        thinking: { type: 'disabled' },
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ error: data });
    }

    // Safety net: if the model still returns a leading `thinking` block, keep only
    // the text blocks so clients that read content[0].text get the actual answer.
    if (data && Array.isArray(data.content)) {
      const textBlocks = data.content.filter((b) => b.type === 'text');
      if (textBlocks.length) data.content = textBlocks;
    }

    return res.status(200).json(data);
  } catch (err) {
    console.error('Proxy error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
