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
        const res = await fetch('https://196.12.203.182/api/consultations/medicaments');
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
    return !submitting;
  }, [submitting]);

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

      if (payloads.length === 0) {
        setError('Veuillez ajouter au moins un médicament');
        setSubmitting(false);
        return;
      }

      for (const p of payloads) {
        const res = await fetch('https://196.12.203.182/sortie-stock', {
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

  const getMedicineInfo = (medicamentId: number | '') => {
    if (!medicamentId) return null;
    return medicines.find(m => m.id === medicamentId);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <div className="bg-red-50 border border-red-200 text-red-700 p-2 rounded text-sm">{error}</div>}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Date de sortie</label>
        <input 
          type="date" 
          value={dateSortie} 
          onChange={(e) => setDateSortie(e.target.value)} 
          className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-green-500"
          required
        />
      </div>

      <div className="space-y-3">
        {lines.map(line => {
          const medicineInfo = getMedicineInfo(line.medicamentId);
          return (
            <div key={line.id} className="grid grid-cols-1 md:grid-cols-6 gap-3 items-end border border-gray-200 rounded-md p-3 bg-gray-50">
              <div className="md:col-span-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">Médicament</label>
                <select
                  value={line.medicamentId}
                  onChange={(e) => updateLine(line.id, { medicamentId: e.target.value ? Number(e.target.value) : '' })}
                  className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-green-500"
                  required
                >
                  <option value="">Sélectionner un médicament</option>
                  {medicines.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.nomMedicament} — Stock: {m.qteStock} {m.perPile ? '(unités)' : '(paquets)'}
                    </option>
                  ))}
                </select>
                {medicineInfo && (
                  <div className="text-xs text-gray-500 mt-1">
                    Stock disponible: {medicineInfo.qteStock} {medicineInfo.perPile ? 'unités' : 'paquets'}
                    {!medicineInfo.perPile && ` (${medicineInfo.defaultSize} unités/paquet)`}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mode</label>
                <select
                  value={line.parUnite ? 'unite' : 'paquet'}
                  onChange={(e) => updateLine(line.id, { parUnite: e.target.value === 'unite' })}
                  className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-green-500"
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
                  max={medicineInfo ? medicineInfo.qteStock : undefined}
                  value={line.quantite}
                  onChange={(e) => updateLine(line.id, { quantite: Number(e.target.value) })}
                  className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>
              <div className="flex justify-end">
                <button 
                  type="button" 
                  onClick={() => removeLine(line.id)} 
                  className="px-3 py-2 border border-red-300 rounded-md text-red-600 hover:bg-red-50 transition-colors"
                  disabled={lines.length === 1}
                  title="Supprimer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
        
        <button 
          type="button" 
          onClick={addLine} 
          className="flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors text-gray-700"
        >
          <Plus className="w-4 h-4" />
          <span>Ajouter un médicament</span>
        </button>
      </div>

      <div className="flex justify-end space-x-2 pt-4 border-t">
        <button 
          type="button" 
          onClick={onCancel} 
          className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
        >
          Annuler
        </button>
        <button 
          type="submit" 
          disabled={submitting || !canSubmit} 
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {submitting ? 'En cours...' : 'Valider'}
        </button>
      </div>
    </form>
  );
};

export default MultiSortieStockForm;