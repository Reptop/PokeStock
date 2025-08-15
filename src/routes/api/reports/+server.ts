// src/routes/api/reports/+server.ts
import type { RequestHandler } from './$types';
import { addReport } from '$lib/server/reportStore';
import { randomUUID } from 'crypto';



export const POST: RequestHandler = async ({ request }) => {
  const fd = await request.formData();
  const machineId = String(fd.get('machineId') ?? '');
  const inStock   = String(fd.get('inStock') ?? 'true') === 'true';
  const comment   = String(fd.get('comment') ?? '');
  // Skipping file storage here; you can add later. Use name as placeholder:
  const photoName = (fd.get('photo') as File | null)?.name ?? undefined;

  if (!machineId) {
    return new Response(JSON.stringify({ error: 'machineId required' }), { status: 400 });
  }

  const report = await addReport({
    id: randomUUID(),
    machineId,
    inStock,
    comment,
    // photoURL: photoName, // or undefined
    createdAt: new Date().toISOString()
  });

  return new Response(JSON.stringify(report), { status: 201 });
};
