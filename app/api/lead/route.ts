import { NextResponse } from 'next/server';

// Every form on the site posts here. The destination inbox is resolved
// server-side only and is never sent to the browser.
//
// Delivery chain (first one configured wins, all are attempted in order until one succeeds):
//   1. FORMSPREE_FORM_ID   -> https://formspree.io/f/<id>
//   2. LEAD_WEBHOOK_URL    -> any JSON webhook (Zapier, Make, Google Apps Script, Slack)
//   3. FormSubmit fallback -> https://formsubmit.co/ajax/<inbox>  (zero setup; first
//                             submission sends a one-time "Activate" email to the inbox)
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Fallback inbox is stored encoded so it never appears as plain text in the public repo or any page.
const INBOX = process.env.CONTACT_EMAIL || Buffer.from('d2Vid29ya3NhMUBnbWFpbC5jb20=', 'base64').toString('utf8');
const FORMSPREE = process.env.FORMSPREE_FORM_ID || '';
const WEBHOOK = process.env.LEAD_WEBHOOK_URL || '';
const SITE = 'https://daily.sale';

const ALLOWED = [
  'kind', 'source', 'name', 'email', 'phone', 'org', 'company', 'website', 'postal', 'city',
  'inquiry_type', 'budget', 'message', 'note', 'amount', 'frequency', 'purpose',
  'product', 'store', 'price', 'store_id', 'product_slug', 'corrected_price',
  'role', 'portfolio', 'contest', 'entry', 'referral', 'interests', 'consent'
];

const RATE = new Map<string, { n: number; t: number }>();
function limited(ip: string) {
  const now = Date.now();
  const r = RATE.get(ip);
  if (!r || now - r.t > 60_000) { RATE.set(ip, { n: 1, t: now }); return false; }
  r.n += 1;
  return r.n > 8;
}

async function post(url: string, payload: unknown, extra: Record<string, string> = {}) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json', ...extra },
    body: JSON.stringify(payload),
    cache: 'no-store'
  });
  return res.ok;
}

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false }, { status: 400 }); }

  // Honeypot: real users never fill the hidden "website_url" field.
  if (body.website_url) return NextResponse.json({ ok: true });

  const ip = (req.headers.get('x-forwarded-for') || '').split(',')[0].trim() || 'anon';
  if (limited(ip)) return NextResponse.json({ ok: false, error: 'rate' }, { status: 429 });

  const clean: Record<string, string> = {};
  for (const k of ALLOWED) {
    const v = body[k];
    if (v === undefined || v === null || v === '') continue;
    clean[k] = String(Array.isArray(v) ? v.join(', ') : v).replace(/[\u0000-\u001f]/g, ' ').slice(0, k === 'message' || k === 'note' ? 4000 : 300);
  }
  const email = clean.email || '';
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ ok: false, error: 'email' }, { status: 400 });
  }
  const kind = clean.kind || 'lead';
  const subject = `[daily.sale] ${kind}${clean.inquiry_type ? ' · ' + clean.inquiry_type : ''}${email ? ' · ' + email : ''}`;
  const payload = {
    ...clean,
    submitted_at: new Date().toISOString(),
    user_agent: (req.headers.get('user-agent') || '').slice(0, 200),
    _subject: subject,
    ...(email ? { _replyto: email } : {})
  };

  let delivered = false;
  if (FORMSPREE) {
    try { delivered = await post(`https://formspree.io/f/${FORMSPREE}`, payload); } catch {}
  }
  if (!delivered && WEBHOOK) {
    try { delivered = await post(WEBHOOK, payload); } catch {}
  }
  if (!delivered) {
    try {
      delivered = await post(`https://formsubmit.co/ajax/${INBOX}`, { ...payload, _template: 'table', _captcha: 'false' },
        { Origin: SITE, Referer: `${SITE}/contact` });
    } catch {}
  }
  if (!delivered) console.error('[lead] delivery failed', { kind, source: clean.source });

  // Always succeed for the visitor; failures are logged server-side.
  return NextResponse.json({ ok: true });
}
