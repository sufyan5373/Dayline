// Vercel serverless function: stores one JSON document per sync code.
// Needs a Redis database from the Vercel Marketplace (Upstash Redis / Vercel KV).
// It reads these env vars, which Vercel adds when you connect the database:
//   KV_REST_API_URL + KV_REST_API_TOKEN   (or)   UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN

const URL_ = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
const MAX_BYTES = 900 * 1024;

async function redis(cmd) {
  const r = await fetch(URL_, {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + TOKEN, 'Content-Type': 'application/json' },
    body: JSON.stringify(cmd),
  });
  if (!r.ok) throw new Error('redis ' + r.status);
  return (await r.json()).result;
}

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  if (!URL_ || !TOKEN) return res.status(500).json({ error: 'Database not connected' });

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch (e) { body = null; } }
  if (!body || typeof body.id !== 'string' || !/^[A-Za-z0-9_-]{16,128}$/.test(body.id)) {
    return res.status(400).json({ error: 'Bad id' });
  }
  const key = 'dayline:' + body.id;
  const incomingTs = Number(body.updatedAt) || 0;

  try {
    const raw = await redis(['GET', key]);
    const stored = raw ? JSON.parse(raw) : null;
    const storedTs = stored ? Number(stored.updatedAt) || 0 : 0;

    // Incoming copy is newer (or nothing stored yet): save it.
    if (body.data && typeof body.data === 'object' && (!stored || incomingTs > storedTs)) {
      const doc = JSON.stringify({ updatedAt: incomingTs, data: body.data });
      if (doc.length > MAX_BYTES) return res.status(413).json({ error: 'Too large' });
      await redis(['SET', key, doc]);
      return res.status(200).json({ ok: true, updatedAt: incomingTs });
    }
    // Stored copy is newer than what the device has: send it back.
    if (stored && storedTs > incomingTs) {
      return res.status(200).json({ ok: true, updatedAt: storedTs, data: stored.data });
    }
    return res.status(200).json({ ok: true, updatedAt: storedTs });
  } catch (e) {
    return res.status(500).json({ error: 'Server error' });
  }
};
