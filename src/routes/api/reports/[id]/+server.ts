import type { RequestHandler } from './$types';
import { getReportById } from '$lib/server/reportStore';

export const GET: RequestHandler = async ({ params }) => {
  const rep = await getReportById(params.id);
  if (!rep) return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 });
  return new Response(JSON.stringify(rep), { status: 200 });
};
