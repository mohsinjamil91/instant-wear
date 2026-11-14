// Sends a Telegram message to the owner when a logged-in customer places an order.
// Needs two environment variables in Vercel: TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID.
const PROJECT = process.env.FIREBASE_PROJECT_ID || 'instantwear-bdb35';
const API_KEY = process.env.FIREBASE_API_KEY || 'AIzaSyB9BTu8dnbt9E8_QWrIbnedPvLT4BkVjPo';

function val(v) {
  if (!v) return null;
  if ('stringValue' in v) return v.stringValue;
  if ('integerValue' in v) return Number(v.integerValue);
  if ('doubleValue' in v) return v.doubleValue;
  if ('booleanValue' in v) return v.booleanValue;
  if ('arrayValue' in v) return (v.arrayValue.values || []).map(val);
  if ('mapValue' in v) {
    const o = {};
    for (const k in (v.mapValue.fields || {})) o[k] = val(v.mapValue.fields[k]);
    return o;
  }
  return null;
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ ok: false });
  const token = process.env.TELEGRAM_BOT_TOKEN, chat = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chat) return res.status(200).json({ ok: false, reason: 'not configured' });
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const { orderId, idToken } = body;
    if (typeof orderId !== 'string' || !/^[a-z0-9]{20}$/.test(orderId) || typeof idToken !== 'string') {
      return res.status(400).json({ ok: false });
    }
    // 1. the caller must be a real logged-in user
    const who = await fetch('https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=' + API_KEY, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ idToken })
    });
    if (!who.ok) return res.status(401).json({ ok: false });
    // 2. read the order as that user (database rules only allow their own order)
    const r = await fetch('https://firestore.googleapis.com/v1/projects/' + PROJECT + '/databases/(default)/documents/orders/' + orderId, {
      headers: { Authorization: 'Bearer ' + idToken }
    });
    if (!r.ok) return res.status(404).json({ ok: false });
    const doc = await r.json();
    const o = {};
    for (const k in (doc.fields || {})) o[k] = val(doc.fields[k]);
    // only recent orders, so old orders cannot be replayed
    if (!o.at || Date.now() - new Date(o.at).getTime() > 10 * 60 * 1000) return res.status(410).json({ ok: false });
    const lines = (o.items || []).map(i => '- ' + i.qty + ' x ' + i.name + ' (' + i.size + ') Rs ' + i.price * i.qty);
    const text = [
      'New order ' + o.code,
      o.name + ' | ' + o.phone,
      o.addr + ', ' + o.pin,
      '',
      ...lines,
      '',
      'Total: Rs ' + o.total + ' (cash or UPI on delivery)'
    ].join('\n');
    const t = await fetch('https://api.telegram.org/bot' + token + '/sendMessage', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ chat_id: chat, text })
    });
    return res.status(t.ok ? 200 : 502).json({ ok: t.ok });
  } catch (e) {
    return res.status(500).json({ ok: false });
  }
};
