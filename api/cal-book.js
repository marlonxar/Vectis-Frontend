// Vercel serverless function — creates a real Cal.com booking (which syncs to your
// connected Google Calendar). Keeps the API key server-side; the frontend never sees it.
// Env vars:
//   CAL_API_KEY        -> your Cal.com API key
//   CAL_EVENT_TYPE_ID  -> numeric event type id to book

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method_not_allowed' });
    return;
  }

  const apiKey = process.env.CAL_API_KEY;
  const eventTypeId = process.env.CAL_EVENT_TYPE_ID || '6002107';
  if (!apiKey || !eventTypeId) {
    res.status(503).json({ error: 'not_configured' });
    return;
  }

  try {
    const body = typeof req.body === 'object' && req.body !== null
      ? req.body
      : JSON.parse(req.body || '{}');

    const { start, name, email, company, notes, service, timeZone, language } = body;
    if (!start || !name || !email) {
      res.status(400).json({ error: 'missing_fields' });
      return;
    }

    const notesParts = [
      service ? `Servicio: ${service}` : '',
      company ? `Empresa: ${company}` : '',
      notes || '',
    ].filter(Boolean);

    const payload = {
      eventTypeId: Number(eventTypeId),
      start,
      responses: {
        name,
        email,
        notes: notesParts.join(' · '),
      },
      timeZone: timeZone || 'UTC',
      language: language || 'es',
      metadata: {},
    };

    const r = await fetch(`https://api.cal.com/v1/bookings?apiKey=${encodeURIComponent(apiKey)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await r.json();

    if (!r.ok) {
      res.status(r.status).json({ error: 'cal_error', detail: data });
      return;
    }

    res.status(200).json({ ok: true, id: (data && (data.id || (data.booking && data.booking.id))) || null });
  } catch (e) {
    res.status(500).json({ error: 'server_error' });
  }
};
