module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  return res.status(200).json({
    app: 'Astra Companion',
    pluginApiVersion: 1,
    integrations: {
      github: { configured: Boolean(process.env.GITHUB_TOKEN && process.env.ASTRA_PLUGIN_SECRET), endpoint: '/api/github?path=/user' },
      vercel: { configured: Boolean(process.env.VERCEL_TOKEN && process.env.ASTRA_PLUGIN_SECRET), endpoint: '/api/vercel?path=/v2/user' },
      fishAudio: { configured: Boolean(process.env.FISH_AUDIO_API_KEY), endpoint: '/api/fish-tts' }
    },
    note: 'Never expose provider tokens in frontend code or public logs.'
  });
};