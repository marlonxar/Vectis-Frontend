// Vercel serverless function — returns Cal.com (API v2) available slots for a date range.
// Env vars (Vercel → Project → Settings → Environment Variables):
//   CAL_API_KEY        -> your Cal.com API key
//   CAL_EVENT_TYPE_ID  -> numeric event type id (defaults to the 30-min event)
//
// Response shape consumed by the Angular wizard:
//   { "2026-06-20": [ { "label": "09:00", "iso": "2026-06-20T15:00:00.000Z" }, ... ], ... }

const CAL_API = 'https://api.cal.com/v2';
const SLOTS_VERSION = '2024-09-04';

module.exports = async (req, res) => {
  const apiKey = process.env.CAL_API_KEY;
  const eventTypeId = process.env.CAL_EVENT_TYPE_ID || '6002107';

  // Safe diagnostic mode (?debug=1): never returns the key, only whether it's set
  // and what Cal.com replies, so we can verify connectivity.
  if (req.query.debug === '1') {
    const tz = req.query.timeZone || 'UTC';
    const start = req.query.start || new Date().toISOString();
    const end = req.query.end || new Date(Date.now() + 7 * 86400000).toISOString();
    const out = { configured: !!apiKey, eventTypeId, results: {} };
    if (apiKey) {
      try {
        const u = `${CAL_API}/slots?eventTypeId=${encodeURIComponent(eventTypeId)}`
          + `&start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}&timeZone=${encodeURIComponent(tz)}`;
        const r = await fetch(u, { headers: { Authorization: `Bearer ${apiKey}`, 'cal-api-version': SLOTS_VERSION } });
        out.results.v2 = { status: r.status, body: (await r.text()).slice(0, 500) };
      } catch (e) { out.results.v2 = { error: String(e) }; }
    }
    res.status(200).json(out);
    return;
  }

  if (!apiKey || !eventTypeId) {
    res.status(200).json({}); // not configured → UI shows placeholder calendar
    return;
  }

  const { start, end, timeZone } = req.query;
  const tz = timeZone || 'UTC';

  try {
    const url = `${CAL_API}/slots?eventTypeId=${encodeURIComponent(eventTypeId)}`
      + `&start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}&timeZone=${encodeURIComponent(tz)}`;
    const r = await fetch(url, { headers: { Authorization: `Bearer ${apiKey}`, 'cal-api-version': SLOTS_VERSION } });
    const data = await r.json();
    if (!r.ok) { res.status(200).json({}); return; }

    // v2 shape: { data: { "YYYY-MM-DD": [ { start: "ISO" }, ... ] } }
    const days = (data && data.data) || {};
    const out = {};
    for (const day of Object.keys(days)) {
      out[day] = (days[day] || [])
        .map((s) => s && s.start)
        .filter(Boolean)
        .map((iso) => ({
          label: new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: tz }),
          iso,
        }));
    }
    res.status(200).json(out);
  } catch (e) {
    res.status(200).json({});
  }
};
