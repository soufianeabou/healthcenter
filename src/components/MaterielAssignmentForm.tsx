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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchMateriels = async () => {
      try {
        setLoading(true);
        console.log('Fetching materials from API...');
        const res = await fetch('https://196.12.203.182/api/consultations/medicaments');
        console.log('API response status:', res.status);
        console.log('API response headers:', res.headers);
        
        if (!res.ok) {
          const errorText = await res.text();
          console.error('API error response:', errorText);
          throw new Error(`Failed to load materials: ${res.status}`);
        }
        
        const data = await res.json();
        console.log('Materials loaded successfully:', data.length, 'items');
        console.log('First material:', data[0]);
        setMateriels(data);
        setError('');
      } catch (e) {
        console.error('Error fetching materials:', e);
        setError(`Erreur lors du chargement des matériels. Veuillez réessayer.`);
      } finally {
        setLoading(false);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des matériels...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 space-y-4">
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded">
          <p className="font-medium">Erreur</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
        <div className="flex justify-end space-x-2">
          <button 
            type="button" 
            onClick={onCancel} 
            className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Fermer
          </button>
        </div>
      </div>
    );
  }

  if (materiels.length === 0) {
    return (
      <div className="p-6 space-y-4">
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 p-4 rounded">
          <p className="font-medium">Aucun matériel disponible</p>
          <p className="text-sm mt-1">Il n'y a pas de matériels dans le système pour le moment.</p>
        </div>
        <div className="flex justify-end space-x-2">
          <button 
            type="button" 
            onClick={onCancel} 
            className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Fermer
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded text-sm font-medium">{error}</div>}

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
