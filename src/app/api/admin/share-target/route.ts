import { NextResponse } from 'next/server';
import { isAdmin } from '@/lib/session';

/** PWA share target entry — files cannot survive a login redirect. */
export async function POST(req: Request) {
  const url = new URL(req.url);
  if (!(await isAdmin())) {
    return NextResponse.redirect(new URL('/admin/login?from=share', url.origin));
  }
  return NextResponse.redirect(new URL('/admin/share?received=1', url.origin));
}
