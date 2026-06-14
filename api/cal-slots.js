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
