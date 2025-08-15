// src/lib/postIds.ts
export const machinePostId = (machineId: string) => `machine:${machineId}`;
export const reportPostId  = (reportKey: string)  => `report:${reportKey}`;
// later: use your real report.id instead of a synthetic key
