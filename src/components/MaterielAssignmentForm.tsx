import React, { useEffect, useMemo, useState } from 'react';
import { Plus, Trash2, ArrowLeft } from 'lucide-react';
import { Materiel, getCategorieDisplayName } from '../types/materiel';
import { SortieStockDTO } from '../types/consultation';

interface Props {
  consultationId: number;
  onSubmitted: () => void;
  onCancel: () => void;
}

interface Line {
  id: string;
  medicamentId: number | ''; // Keep field name for API compatibility
  quantite: number;
}

const MaterielAssignmentForm: React.FC<Props> = ({ consultationId, onSubmitted, onCancel }) => {
  const [materiels, setMateriels] = useState<Materiel[]>([]);
  const [lines, setLines] = useState<Line[]>([{ id: crypto.randomUUID(), medicamentId: '', quantite: 1 }]);
  const [dateSortie, setDateSortie] = useState<string>(new Date().toISOString().slice(0, 10));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchMateriels = async () => {
      try {
        const res = await fetch('https://196.12.203.182/api/consultations/medicaments');
        if (!res.ok) throw new Error('Failed to load materials');
        const data = await res.json();
        setMateriels(data);
      } catch (e) {
        console.error(e);
        setError('Erreur lors du chargement des matériels');
      }
    };
    fetchMateriels();
  }, []);

  const canSubmit = useMemo(() => {
    return !submitting;
  }, [submitting]);

  const addLine = () => {
    setLines(prev => [...prev, { id: crypto.randomUUID(), medicamentId: '', quantite: 1 }]);
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
          parUnite: true, // Always true for materials
          quantite: l.quantite,
          dateSortie
        }));

      if (payloads.length === 0) {
        setError('Veuillez ajouter au moins un matériel');
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
          throw new Error(`Erreur lors de l'assignation du matériel: ${res.status} ${txt}`);
        }
      }

      onSubmitted();
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : 'Erreur lors de l\'assignation des matériels');
    } finally {
      setSubmitting(false);
    }
  };

  const getMaterielInfo = (medicamentId: number | '') => {
    if (!medicamentId) return null;
    return materiels.find(m => m.id === medicamentId);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <div className="bg-red-50 border border-red-200 text-red-700 p-2 rounded text-sm">{error}</div>}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Date d'assignation</label>
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
          const materielInfo = getMaterielInfo(line.medicamentId);
          return (
            <div key={line.id} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end border border-gray-200 rounded-md p-3 bg-gray-50">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Matériel</label>
                <select
                  value={line.medicamentId}
                  onChange={(e) => updateLine(line.id, { medicamentId: e.target.value ? Number(e.target.value) : '' })}
                  className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-green-500"
                  required
                >
                  <option value="">Sélectionner un matériel</option>
                  {materiels.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.nomMedicament} — Stock: {m.qteStock} — {getCategorieDisplayName(m.categorie)}
                    </option>
                  ))}
                </select>
                {materielInfo && (
                  <div className="text-xs text-gray-500 mt-1">
                    Stock disponible: {materielInfo.qteStock} unités
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quantité</label>
                <input
                  type="number"
                  min={1}
                  max={materielInfo ? materielInfo.qteStock : undefined}
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
          <span>Ajouter un matériel</span>
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
          {submitting ? 'En cours...' : 'Assigner'}
        </button>
      </div>
    </form>
  );
};

export default MaterielAssignmentForm;
