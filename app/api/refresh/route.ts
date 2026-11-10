import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';

// Daily revalidation endpoint. Triggered by GitHub Actions after scrapers push
// new data OR by Vercel Cron Jobs (configured in vercel.json). Secret header
// optional — if REFRESH_SECRET env var is set, caller must send it.
export const runtime = 'nodejs';

export async function GET(req: Request) {
  const secret = process.env.REFRESH_SECRET;
  if (secret) {
    const got = new URL(req.url).searchParams.get('token') || req.headers.get('x-refresh-token');
    if (got !== secret) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }
  try {
    revalidatePath('/', 'layout');
    revalidatePath('/deals');
    revalidatePath('/flyers');
    revalidatePath('/stores');
    revalidatePath('/categories');
    return NextResponse.json({ ok: true, revalidated_at: new Date().toISOString() });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e?.message || e) }, { status: 500 });
  }
}
