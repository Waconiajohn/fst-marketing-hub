export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  if (!process.env.BLOTATO_API_KEY) {
    return res.status(500).json({ error: 'BLOTATO_API_KEY is not configured in Vercel environment variables' });
  }

  const { payload } = req.body;
  if (!payload || !payload.post) {
    return res.status(400).json({ error: 'Missing payload.post' });
  }

  try {
    const response = await fetch('https://backend.blotato.com/v2/posts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'blotato-api-key': process.env.BLOTATO_API_KEY,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return res.status(response.status).json({ error: data });
    }

    return res.status(200).json(data);
  } catch (err) {
    console.error('Blotato proxy error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
