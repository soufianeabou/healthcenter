export interface StaffPatient {
  id: number;
  idNum: number;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  category: 'Staff';
  eligible: boolean;
}

const CSV_FILES = [
  { url: '/data/employees-eligible.csv', eligible: true },
  { url: '/data/employees-not-eligible.csv', eligible: false },
];

let cache: StaffPatient[] | null = null;

function parseStaffCsv(text: string, eligible: boolean): StaffPatient[] {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  if (lines.length < 2) return [];

  const header = lines[0].split(',').map(h => h.trim().toLowerCase());
  const nameIdx = header.findIndex(h => h === 'name');
  const emailIdx = header.findIndex(h => h === 'email');
  const idIdx = header.findIndex(h => h === 'employee id');

  const result: StaffPatient[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].match(/(".*?"|[^,]+)(?=,|$)/g)
      ?.map(v => v.replace(/^"|"$/g, '').trim()) ?? lines[i].split(',').map(v => v.trim());

    const rawId = cols[idIdx] ?? '';
    const numId = parseInt(rawId, 10);
    if (!rawId || isNaN(numId)) continue;

    const fullName = (cols[nameIdx] ?? '').trim();
    const parts = fullName.split(' ');
    const prenom = parts[0] || '';
    const nom = parts.slice(1).join(' ') || '';

    result.push({
      id: numId,
      idNum: numId,
      nom,
      prenom,
      email: cols[emailIdx] ?? '',
      telephone: '',
      category: 'Staff',
      eligible,
    });
  }
  return result;
}

export async function loadStaffPatients(): Promise<StaffPatient[]> {
  if (cache) return cache;

  const results = await Promise.all(
    CSV_FILES.map(async ({ url, eligible }) => {
      try {
        const res = await fetch(url);
        if (!res.ok) return [];
        return parseStaffCsv(await res.text(), eligible);
      } catch {
        return [];
      }
    })
  );

  const seen = new Set<number>();
  cache = results.flat().filter(s => {
    if (seen.has(s.idNum)) return false;
    seen.add(s.idNum);
    return true;
  });

  return cache;
}
