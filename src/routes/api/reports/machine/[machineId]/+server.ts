// src/routes/api/reports/machine/[machineId]/+server.ts
import type { RequestHandler } from './$types';
import { getReportsByMachine } from '$lib/server/reportStore';

export const GET: RequestHandler = async ({ params, url }) => {
  const lim = Number(url.searchParams.get('limit') ?? 50);
  const rows = await getReportsByMachine(params.machineId, lim);
  return new Response(JSON.stringify(rows), { status: 200 });
};
