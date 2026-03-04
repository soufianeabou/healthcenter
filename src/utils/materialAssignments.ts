/** Frontend-only: track material assignment dates for overdue (3+ weeks) alerts. Backend does not expose assignDate. */
const STORAGE_KEY = 'materialAssignments';

export interface StoredAssignment {
  assignDate: string; // ISO
  materialName?: string;
  patientId?: number;
}

function loadAll(): Record<string, StoredAssignment> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveAll(data: Record<string, StoredAssignment>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function saveAssignment(patientId: number, materialId: number, materialName?: string) {
  const key = `${patientId}-${materialId}`;
  const all = loadAll();
  all[key] = { assignDate: new Date().toISOString(), materialName, patientId };
  saveAll(all);
}

export function removeAssignment(patientId: number, materialId: number) {
  const key = `${patientId}-${materialId}`;
  const all = loadAll();
  delete all[key];
  saveAll(all);
}

export function getAssignment(patientId: number, materialId: number): StoredAssignment | null {
  return loadAll()[`${patientId}-${materialId}`] ?? null;
}

const WEEKS_OVERDUE = 3;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function isOverdue(assignDateIso: string): boolean {
  const assign = new Date(assignDateIso).getTime();
  const now = Date.now();
  return (now - assign) / MS_PER_DAY > WEEKS_OVERDUE * 7;
}

export function getOverdueAssignments(): Array<{ key: string; assignDate: string; materialName?: string; patientId?: number }> {
  const all = loadAll();
  return Object.entries(all)
    .filter(([, v]) => v.assignDate && isOverdue(v.assignDate))
    .map(([key, v]) => ({ key, assignDate: v.assignDate, materialName: v.materialName, patientId: v.patientId }));
}
