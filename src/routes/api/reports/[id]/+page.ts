import type { PageLoad } from './$types';
import { oregonMachines } from '$lib/data/oregonMachines';

export const load: PageLoad = async ({ fetch, params }) => {
  const res = await fetch(`/api/reports/${encodeURIComponent(params.id)}`);
  if (!res.ok) {
    return { report: null, machine: null, notFound: true };
  }
  const report = await res.json();
  const machine = oregonMachines.find(m => m.machineId === report.machineId) ?? null;
  return { report, machine, notFound: false };
};
