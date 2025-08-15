// src/lib/reportClient.ts
export type CreateReportInput = {
  machineId: string;
  inStock: boolean;
  comment?: string;
  userId?: string;
  photoURL?: string;
};

export type ReportRow = {
  id: string;
  machineId: string;
  inStock: boolean;
  comment: string;
  photoURL?: string;
  createdAt: string;
  status: 'visible' | 'flagged' | 'removed';
};

const BASE = import.meta.env.VITE_REPORTS_BASE ?? 'http://localhost:5003';

export async function getReportsForMachine(machineId: string, limit = 25): Promise<ReportRow[]> {
  const res = await fetch(`${BASE}/api/reports/machine/${encodeURIComponent(machineId)}?limit=${limit}`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function uploadPhoto(file: File): Promise<{ mediaId: string; publicUrl: string }> {
  const fd = new FormData();
  fd.append('photo', file);
  const res = await fetch(`${BASE}/api/media/upload`, {
    method: 'POST',
    body: fd
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function createReport(input: CreateReportInput): Promise<ReportRow> {
  const res = await fetch(`${BASE}/api/reports`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
