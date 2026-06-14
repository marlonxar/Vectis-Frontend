// Vercel serverless function — returns Cal.com available slots for a date range.
// Env vars (set in Vercel → Project → Settings → Environment Variables):
//   CAL_API_KEY        -> your Cal.com API key
//   CAL_EVENT_TYPE_ID  -> the numeric id of the event type to book (e.g. your 30-min meeting)
//
// Response shape (consumed by the Angular wizard):
//   { "2026-06-20": [ { "label": "09:00", "iso": "2026-06-20T15:00:00.000Z" }, ... ], ... }

module.exports = async (req, res) => {
  const apiKey = process.env.CAL_API_KEY;
  const eventTypeId = process.env.CAL_EVENT_TYPE_ID || '6002107';

  // Safe diagnostic mode (?debug=1): never returns the key, only whether it's set
  // and what Cal.com's v1/v2 slots endpoints reply, so we can pick the right one.
  if (req.query.debug === '1') {
    const tz = req.query.timeZone || 'UTC';
    const start = req.query.start || new Date().toISOString();
    const end = req.query.end || new Date(Date.now() + 7 * 86400000).toISOString();
    const out = { configured: !!apiKey, eventTypeId, results: {} };
    if (apiKey) {
      try {
        const u1 = `https://api.cal.com/v1/slots?apiKey=${encodeURIComponent(apiKey)}`
          + `&eventTypeId=${encodeURIComponent(eventTypeId)}`
          + `&startTime=${encodeURIComponent(start)}&endTime=${encodeURIComponent(end)}`
          + `&timeZone=${encodeURIComponent(tz)}`;
        const r1 = await fetch(u1);
        out.results.v1 = { status: r1.status, body: (await r1.text()).slice(0, 500) };
      } catch (e) { out.results.v1 = { error: String(e) }; }
      try {
        const u2 = `https://api.cal.com/v2/slots?eventTypeId=${encodeURIComponent(eventTypeId)}`
          + `&start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`
          + `&timeZone=${encodeURIComponent(tz)}`;
        const r2 = await fetch(u2, { headers: { Authorization: `Bearer ${apiKey}`, 'cal-api-version': '2024-09-04' } });
        out.results.v2 = { status: r2.status, body: (await r2.text()).slice(0, 500) };
      } catch (e) { out.results.v2 = { error: String(e) }; }
    }
    res.status(200).json(out);
    return;
  }

  // Not configured yet → empty object so the UI shows its placeholder calendar.
  if (!apiKey || !eventTypeId) {
    res.status(200).json({});
    return;
  }

  const { start, end, timeZone } = req.query;
  const tz = timeZone || 'UTC';

  try {
    const url = `https://api.cal.com/v1/slots?apiKey=${encodeURIComponent(apiKey)}`
      + `&eventTypeId=${encodeURIComponent(eventTypeId)}`
      + `&startTime=${encodeURIComponent(start)}`
      + `&endTime=${encodeURIComponent(end)}`
      + `&timeZone=${encodeURIComponent(tz)}`;

    const r = await fetch(url);
    const data = await r.json();
    if (!r.ok) {
      res.status(200).json({});
      return;
    }

    // Cal.com v1 returns: { slots: { "YYYY-MM-DD": [ { time: "ISO" }, ... ] } }
    const slots = (data && data.slots) || {};
    const out = {};
    for (const day of Object.keys(slots)) {
      out[day] = (slots[day] || [])
        .map((s) => s && s.time)
        .filter(Boolean)
        .map((iso) => ({
          label: new Date(iso).toLocaleTimeString('en-GB', {
            hour: '2-digit', minute: '2-digit', timeZone: tz,
          }),
          iso,
        }));
    }
    res.status(200).json(out);
  } catch (e) {
    res.status(200).json({});
  }
};
