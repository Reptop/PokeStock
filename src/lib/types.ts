// src/lib/types.ts
export interface Report {
  id?: string;          // present for real reports
  machineId?: string;
  inStock: boolean;
  comment?: string;
  createdAt?: string;   // ISO
  time?: string;        // legacy placeholder for fake data
}

export interface Machine {
  retailer: string;
  machineId: string;
  address: string;
  city: string;
  state: string;
  latitude: number | null;
  longitude: number | null;
  reports?: Report[];
}
