import { redirect } from 'next/navigation';

// Legacy URL — permanently redirected in next.config.js; this is a fallback.
export default function Legacy() {
  redirect('/deals');
}
