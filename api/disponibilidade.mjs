import { readInventory } from '../lib/inventory.mjs';

const endpoint = 'https://vuvbayweephubuxinttc.supabase.co/rest/v1/rpc/st_public_overview';
// Public anon key used by the EMCCAMP public sales page.
const publicKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1dmJheXdlZXBodWJ1eGludHRjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc0NTcxNzEsImV4cCI6MjA5MzAzMzE3MX0.lypsPR3UPDvC_AiHyAeivTflQjwCmeMmif1r6kr5Lq8';
const defaultTableToken = 'afda4280e88e49f6a019c2d95a6b4f375e758e22ea8ff495';

export async function GET() {
  try {
    const upstream = await fetch(endpoint, {
      method: 'POST',
      headers: { apikey: publicKey, Authorization: `Bearer ${publicKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ p_token: process.env.EMCCAMP_TABLE_TOKEN || defaultTableToken }),
      signal: AbortSignal.timeout(6000)
    });
    if (!upstream.ok) throw new Error(`EMCCAMP HTTP ${upstream.status}`);
    const inventory = readInventory(await upstream.json());

    return Response.json({ inventory }, {
      headers: {
        'Cache-Control': 'no-cache',
        'Vercel-CDN-Cache-Control': 'public, max-age=60'
      }
    });
  } catch (error) {
    console.warn('EMCCAMP inventory unavailable:', error.message);
    return Response.json({ error: 'Disponibilidade temporariamente indisponível.' }, {
      status: 503,
      headers: { 'Cache-Control': 'no-store' }
    });
  }
}
