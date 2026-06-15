// Vercel serverless function — subscribes an email to the Mailchimp audience.
// The API key stays server-side; the frontend only sends the email.
// Env vars (Vercel → Settings → Environment Variables, Production):
//   MAILCHIMP_API_KEY -> your Mailchimp API key (secret; ends with -usXX = data center)
//   MAILCHIMP_LIST_ID -> your Audience (List) ID

module.exports = async (req, res) => {
  if (req.method !== 'POST') { res.status(405).json({ error: 'method_not_allowed' }); return; }

  const apiKey = process.env.MAILCHIMP_API_KEY;
  const listId = process.env.MAILCHIMP_LIST_ID;
  if (!apiKey || !listId) { res.status(503).json({ error: 'not_configured' }); return; }

  try {
    const body = typeof req.body === 'object' && req.body !== null ? req.body : JSON.parse(req.body || '{}');
    const { email, hp } = body;

    // Honeypot: bots fill it → pretend success, subscribe nothing.
    if (hp && String(hp).trim()) { res.status(200).json({ ok: true }); return; }

    const clean = String(email || '').trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)) { res.status(400).json({ error: 'invalid_email' }); return; }

    const dc = apiKey.split('-')[1];
    if (!dc) { res.status(500).json({ error: 'bad_api_key' }); return; }

    const url = `https://${dc}.api.mailchimp.com/3.0/lists/${listId}/members`;
    const auth = Buffer.from('vectis:' + apiKey).toString('base64');
    const r = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Basic ' + auth },
      body: JSON.stringify({ email_address: clean, status: 'pending' }), // 'pending' = double opt-in (confirmation email)
    });
    const data = await r.json().catch(() => ({}));

    if (r.ok) { res.status(200).json({ ok: true }); return; }
    // Already subscribed → treat as success.
    if (data && (data.title === 'Member Exists' || /already a list member/i.test(data.detail || ''))) {
      res.status(200).json({ ok: true, already: true }); return;
    }
    res.status(502).json({ error: 'mailchimp_error', detail: (data && data.title) || null });
  } catch (e) {
    res.status(500).json({ error: 'server_error', message: String((e && e.message) || e) });
  }
};
