const crypto = require('crypto');

const API = 'https://api.github.com';
const ALLOWED_METHODS = new Set(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']);
const DESTRUCTIVE = new Set(['DELETE']);

function safeEqual(a, b) {
  const aa = Buffer.from(String(a || ''));
  const bb = Buffer.from(String(b || ''));
  return aa.length === bb.length && aa.length > 0 && crypto.timingSafeEqual(aa, bb);
}
function send(res, status, payload) {
  res.status(status).setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  return res.end(JSON.stringify(payload));
}
function cleanPath(value) {
  if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//')) return null;
  if (value.includes('..') || value.includes('\\') || /[\r\n]/.test(value)) return null;
  const p = value.split('?')[0];
  if (!p.startsWith('/user/') && !p.startsWith('/users/') && !p.startsWith('/repos/') && !p.startsWith('/orgs/') && !p.startsWith('/search/') && !p.startsWith('/installation/')) return null;
  return value;
}
module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', process.env.ASTRA_ALLOWED_ORIGIN || '');
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Astra-Plugin-Secret, X-Astra-Confirm');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (!ALLOWED_METHODS.has(req.method)) return send(res, 405, { error: 'Method not allowed' });
  if (!process.env.GITHUB_TOKEN) return send(res, 503, { error: 'GITHUB_TOKEN is not configured on the server.' });
  if (!process.env.ASTRA_PLUGIN_SECRET) return send(res, 503, { error: 'ASTRA_PLUGIN_SECRET is not configured on the server.' });
  if (!safeEqual(req.headers['x-astra-plugin-secret'], process.env.ASTRA_PLUGIN_SECRET)) return send(res, 401, { error: 'Invalid plugin access secret.' });

  const path = cleanPath(req.query.path);
  if (!path) return send(res, 400, { error: 'Invalid or unsupported GitHub API path.' });
  if (DESTRUCTIVE.has(req.method) && req.headers['x-astra-confirm'] !== 'CONFIRM') return send(res, 428, { error: 'Destructive action blocked. Send X-Astra-Confirm: CONFIRM after explicit user confirmation.' });

  let body;
  if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
    body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch { return send(res, 400, { error: 'Request body must be valid JSON.' }); }
    }
    if (body == null || typeof body !== 'object' || Array.isArray(body)) body = {};
  }
  try {
    const upstream = await fetch(API + path, {
      method: req.method,
      headers: {
        Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        ...(body ? { 'Content-Type': 'application/json' } : {})
      },
      ...(body ? { body: JSON.stringify(body) } : {})
    });
    const raw = await upstream.text();
    let data;
    try { data = raw ? JSON.parse(raw) : null; } catch { data = { message: raw.slice(0, 2000) }; }
    res.setHeader('X-Astra-GitHub-Status', String(upstream.status));
    return send(res, upstream.status, data);
  } catch (error) {
    return send(res, 502, { error: 'GitHub API request failed.', detail: error.message });
  }
};