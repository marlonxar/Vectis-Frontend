// Vercel serverless function — validates the "Send message" form server-side.
// It ONLY verifies the honeypot + the Cloudflare Turnstile token (free, secret stays
// server-side). Email delivery is done by the browser (Web3Forms blocks datacenter
// IPs with a Cloudflare challenge, but accepts normal browser submissions).
// Env vars:
//   CF_TURNSTILE_SECRET -> your Cloudflare Turnstile *Secret* key (server-side only)

module.exports = async (req, res) => {
  const secret = process.env.CF_TURNSTILE_SECRET;

  // Safe diagnostic (GET ?debug=1) — never exposes the key, only whether it exists.
  if (req.method === 'GET' && req.query && req.query.debug === '1') {
    res.status(200).json({ turnstileSecretConfigured: !!secret, node: process.version });
    return;
  }

  if (req.method !== 'POST') { res.status(405).json({ error: 'method_not_allowed' }); return; }

  try {
    const body = typeof req.body === 'object' && req.body !== null ? req.body : JSON.parse(req.body || '{}');
    const { token, hp } = body;

    // Honeypot: bots fill it.
    if (hp && String(hp).trim()) { res.status(200).json({ ok: false, error: 'spam' }); return; }

    // Verify Turnstile against Cloudflare.
    if (secret) {
      const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
      const params = new URLSearchParams();
      params.append('secret', secret);
      params.append('response', token || '');
      if (ip) params.append('remoteip', ip);
      const v = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString(),
      });
      const vtext = await v.text();
      let vd;
      try { vd = JSON.parse(vtext); } catch (_) {
        res.status(502).json({ error: 'turnstile_bad_response', status: v.status }); return;
      }
      if (!vd.success) { res.status(400).json({ error: 'captcha_failed', detail: vd['error-codes'] || null }); return; }
    }

    res.status(200).json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: 'server_error', message: String((e && e.message) || e) });
  }
};
