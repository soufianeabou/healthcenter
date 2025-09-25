import React, { useEffect, useMemo, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Medicine } from '../types/medicine';
import { SortieStockDTO } from '../types/consultation';

interface Props {
  consultationId: number;
  onSubmitted: () => void;
  onCancel: () => void;
}

interface Line {
  id: string;
  medicamentId: number | '';
  parUnite: boolean;
  quantite: number;
}

const MultiSortieStockForm: React.FC<Props> = ({ consultationId, onSubmitted, onCancel }) => {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [lines, setLines] = useState<Line[]>([{ id: crypto.randomUUID(), medicamentId: '', parUnite: true, quantite: 1 }]);
  const [dateSortie, setDateSortie] = useState<string>(new Date().toISOString().slice(0, 10));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchMedicines = async () => {
      try {
        const res = await fetch('/api/medicaments');
        if (!res.ok) throw new Error('Failed to load medicines');
        const data = await res.json();
        setMedicines(data);
      } catch (e) {
        console.error(e);
        setError('Erreur lors du chargement des médicaments');
      }
    };
    fetchMedicines();
  }, []);

  const canSubmit = useMemo(() => {
    // Allow zero lines (none needed) OR all selected lines valid
    const nonEmpty = lines.filter(l => l.medicamentId && l.quantite > 0);
    return submitting ? false : true;
  }, [lines, submitting]);

  const addLine = () => {
    setLines(prev => [...prev, { id: crypto.randomUUID(), medicamentId: '', parUnite: true, quantite: 1 }]);
  };

  const removeLine = (id: string) => {
    setLines(prev => prev.filter(l => l.id !== id));
  };

  const updateLine = (id: string, patch: Partial<Line>) => {
    setLines(prev => prev.map(l => (l.id === id ? { ...l, ...patch } : l)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const payloads: SortieStockDTO[] = lines
        .filter(l => l.medicamentId && l.quantite > 0)
        .map(l => ({
          consultation: { id: consultationId },
          medicament: { id: l.medicamentId as number },
          parUnite: l.parUnite,
          quantite: l.quantite,
          dateSortie
        }));

      for (const p of payloads) {
        const res = await fetch('/api/sortie-stock', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(p)
        });
        if (!res.ok) {
          const txt = await res.text();
          throw new Error(`Erreur lors de la création de la sortie: ${res.status} ${txt}`);
        }
      }

      onSubmitted();
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : 'Erreur lors de la création des sorties');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <div className="bg-red-50 border border-red-200 text-red-700 p-2 rounded text-sm">{error}</div>}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Date de sortie</label>
        <input type="date" value={dateSortie} onChange={(e) => setDateSortie(e.target.value)} className="w-full px-3 py-2 border rounded-md" />
      </div>

      <div className="space-y-3">
        {lines.map(line => (
          <div key={line.id} className="grid grid-cols-1 md:grid-cols-6 gap-3 items-end border border-gray-200 rounded-md p-3">
            <div className="md:col-span-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">Médicament</label>
              <select
                value={line.medicamentId}
                onChange={(e) => updateLine(line.id, { medicamentId: e.target.value ? Number(e.target.value) : '' })}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="">Sélectionner un médicament</option>
                {medicines.map(m => (
                  <option key={m.id} value={m.id}>{m.nomMedicament} — Stock: {m.qteStock}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Unité</label>
              <select
                value={line.parUnite ? 'unite' : 'paquet'}
                onChange={(e) => updateLine(line.id, { parUnite: e.target.value === 'unite' })}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="unite">Par unité</option>
                <option value="paquet">Par paquet</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quantité</label>
              <input
                type="number"
                min={1}
                value={line.quantite}
                onChange={(e) => updateLine(line.id, { quantite: Number(e.target.value) })}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
            <div className="flex justify-end">
              <button type="button" onClick={() => removeLine(line.id)} className="px-3 py-2 border rounded-md text-red-600 hover:bg-red-50">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
        <button type="button" onClick={addLine} className="flex items-center space-x-2 px-3 py-2 border rounded-md hover:bg-gray-50">
          <Plus className="w-4 h-4" />
          <span>Ajouter un médicament</span>
        </button>
      </div>

      <div className="flex justify-end space-x-2 pt-2">
        <button type="button" onClick={onCancel} className="px-4 py-2 border rounded-md">Annuler</button>
        <button type="submit" disabled={submitting || !canSubmit} className="px-4 py-2 bg-green-600 text-white rounded-md disabled:opacity-50">
          Valider
        </button>
      </div>
    </form>
  );
};

export default MultiSortieStockForm;
