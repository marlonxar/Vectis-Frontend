// Vercel serverless function — handles the "Send message" form.
// 1) checks the honeypot, 2) validates the Cloudflare Turnstile token server-side
// (free — no Web3Forms Pro needed), 3) delivers the email via Web3Forms.
// Env vars:
//   CF_TURNSTILE_SECRET -> your Cloudflare Turnstile *Secret* key (server-side only)
//   WEB3FORMS_KEY       -> (optional) your Web3Forms access key; falls back to the public one

const WEB3FORMS_FALLBACK = '50609c80-9145-4d34-915c-d80845350532';

module.exports = async (req, res) => {
  if (req.method !== 'POST') { res.status(405).json({ error: 'method_not_allowed' }); return; }

  const secret = process.env.CF_TURNSTILE_SECRET;
  const accessKey = process.env.WEB3FORMS_KEY || WEB3FORMS_FALLBACK;

  try {
    const body = typeof req.body === 'object' && req.body !== null ? req.body : JSON.parse(req.body || '{}');
    const { name, email, company, service, budget, subject, message, token, hp } = body;

    // Honeypot: bots fill it → pretend success, send nothing.
    if (hp && String(hp).trim()) { res.status(200).json({ ok: true }); return; }

    if (!name || !email || !subject || !message) { res.status(400).json({ error: 'missing_fields' }); return; }

    // Verify Turnstile against Cloudflare (server-side, free).
    if (secret) {
      const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
      const params = new URLSearchParams();
      params.append('secret', secret);
      params.append('response', token || '');
      if (ip) params.append('remoteip', ip);
      const v = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body: params });
      const vd = await v.json();
      if (!vd.success) { res.status(400).json({ error: 'captcha_failed' }); return; }
    }

    // Deliver via Web3Forms (free tier).
    const w = await fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        access_key: accessKey,
        subject: `Nuevo mensaje de ${name} — Vectis`,
        from_name: 'Vectis · Formulario web',
        Nombre: name,
        Email: email,
        Empresa: company || '—',
        Servicio: service || '—',
        Presupuesto: budget || '—',
        Asunto: subject,
        Mensaje: message,
      }),
    });
    const wd = await w.json();
    if (!wd || !wd.success) { res.status(502).json({ error: 'delivery_failed' }); return; }

    res.status(200).json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: 'server_error' });
  }
};
