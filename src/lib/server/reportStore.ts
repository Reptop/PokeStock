// src/lib/server/reportStore.ts
//
// Tiny JSON-backed store for Reports (good for local dev).
// If/when you move to Firebase or a DB, you can keep this file’s API
// surface and swap the internals.
//
// File layout:
//   .data/reports.json
//   {
//     "reports": [ { id, machineId, inStock, comment, photoURL?, createdAt } ]
//   }

import { readFile, writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import type { Report } from '$lib/types';

const DATA_DIR = '.data';
const FILE = join(DATA_DIR, 'reports.json');

type StoreShape = { reports: Report[] };

// ---------- helpers ----------

async function ensureFile(): Promise<void> {
  if (!existsSync(DATA_DIR)) await mkdir(DATA_DIR);
  if (!existsSync(FILE)) {
    const initial: StoreShape = { reports: [] };
    await writeFile(FILE, JSON.stringify(initial, null, 2));
  }
}

async function readAll(): Promise<StoreShape> {
  await ensureFile();
  const raw = await readFile(FILE, 'utf8');
  try {
    const parsed = JSON.parse(raw) as StoreShape;
    if (!parsed || !Array.isArray(parsed.reports)) return { reports: [] };
    return parsed;
  } catch {
    // Corrupt file? Reset to empty but do not overwrite immediately.
    return { reports: [] };
  }
}

async function writeAll(data: StoreShape): Promise<void> {
  await writeFile(FILE, JSON.stringify(data, null, 2));
}

// Shallow validation / normalization to avoid bad writes during dev.
function normalizeReport(input: Partial<Report>): Report {
  if (!input.id) throw new Error('Report missing id');
  if (!input.machineId) throw new Error('Report missing machineId');

  return {
    id: String(input.id),
    machineId: String(input.machineId),
    inStock: Boolean(input.inStock),
    comment: String(input.comment ?? ''),
    photoURL: input.photoURL ? String(input.photoURL) : undefined,
    createdAt: input.createdAt ? String(input.createdAt) : new Date().toISOString()
  };
}

// ---------- public API ----------

/**
 * Add a report. Caller is responsible for generating a unique `id`.
 * Returns the written report.
 */
export async function addReport(r: Report): Promise<Report> {
  const next = normalizeReport(r);
  const store = await readAll();

  // Replace if the same id already exists (idempotent upsert for dev ergonomics)
  const idx = store.reports.findIndex(x => x.id === next.id);
  if (idx >= 0) store.reports[idx] = next;
  else store.reports.push(next);

  await writeAll(store);
  return next;
}

/**
 * Get a single report by its id, or null if not found.
 */
export async function getReportById(id: string): Promise<Report | null> {
  const store = await readAll();
  return store.reports.find(r => r.id === id) ?? null;
}

/**
 * Get most recent reports for a machine (newest first).
 */
export async function getReportsByMachine(machineId: string, limit = 50): Promise<Report[]> {
  const store = await readAll();
  return store.reports
    .filter(r => r.machineId === machineId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, limit);
}

/**
 * List recent reports across all machines (newest first).
 */
export async function listRecentReports(limit = 50): Promise<Report[]> {
  const store = await readAll();
  return store.reports
    .slice()
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, limit);
}

/**
 * Update only the photoURL for a report (no-op if not found).
 */
export async function updateReportPhoto(id: string, photoURL: string): Promise<Report | null> {
  const store = await readAll();
  const idx = store.reports.findIndex(r => r.id === id);
  if (idx < 0) return null;
  store.reports[idx] = { ...store.reports[idx], photoURL };
  await writeAll(store);
  return store.reports[idx];
}

/**
 * (Optional) Delete a report by id. Returns true if deleted.
 */
export async function deleteReport(id: string): Promise<boolean> {
  const store = await readAll();
  const before = store.reports.length;
  store.reports = store.reports.filter(r => r.id !== id);
  const changed = store.reports.length !== before;
  if (changed) await writeAll(store);
  return changed;
}
