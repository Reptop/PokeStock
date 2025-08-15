const BASE = import.meta.env.VITE_STATUS_BASE || 'http://localhost:5005';

export type MachineStatus = {
  machineId: string;
  in_stock_likelihood: number;  // 0..1
  confidence: 'low'|'medium'|'high';
  sample_size: number;
  last_seen_in_stock_at: string | null;
  last_report_at: string | null;
};

export async function getMachineStatus(machineId: string): Promise<MachineStatus> {
  const r = await fetch(`${BASE}/api/status/machine/${encodeURIComponent(machineId)}`);
  if (!r.ok) throw new Error(`status fetch failed: ${r.status}`);
  return r.json();
}