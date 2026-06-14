// Vercel serverless function — creates a real Cal.com booking via API v2.
// The booking syncs to the Google Calendar connected in Cal.com. The API key
// stays server-side; the frontend never sees it.
// Env vars:
//   CAL_API_KEY        -> your Cal.com API key
//   CAL_EVENT_TYPE_ID  -> numeric event type id (defaults to the 30-min event)

const CAL_API = 'https://api.cal.com/v2';
const BOOKINGS_VERSION = '2024-08-13';

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

    // Goes into the booking's "Additional notes" field → syncs to the calendar event description.
    const description = [
      service ? `Servicio de interés: ${service}` : '',
      company ? `Empresa: ${company}` : '',
      notes ? `Mensaje: ${notes}` : '',
    ].filter(Boolean).join('\n');

    const payload = {
      start,
      eventTypeId: Number(eventTypeId),
      attendee: {
        name,
        email,
        timeZone: timeZone || 'UTC',
        language: language || 'es',
      },
      ...(description ? { bookingFieldsResponses: { notes: description } } : {}),
      metadata: service ? { service: String(service).slice(0, 480) } : {},
    };

    const r = await fetch(`${CAL_API}/bookings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        'cal-api-version': BOOKINGS_VERSION,
      },
      body: JSON.stringify(payload),
    });
    const data = await r.json();

    if (!r.ok) {
      res.status(r.status).json({ error: 'cal_error', detail: data });
      return;
    }

    const booking = (data && data.data) || data;
    res.status(200).json({ ok: true, id: (booking && (booking.uid || booking.id)) || null });
  } catch (e) {
    res.status(500).json({ error: 'server_error' });
  }
};
