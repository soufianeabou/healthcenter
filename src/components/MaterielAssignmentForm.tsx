import React, { useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';

interface Materiel {
  id: number;
  nomMedicament: string;
  qteStock: number;
  categorie: string;
}

interface Props {
  consultationId: number;
  onSubmitted: () => void;
  onCancel: () => void;
}

interface MaterialLine {
  id: string;
  materielId: number | '';
  quantite: number;
}

const MaterielAssignmentForm: React.FC<Props> = ({ consultationId, onSubmitted, onCancel }) => {
  const [materiels, setMateriels] = useState<Materiel[]>([]);
  const [lines, setLines] = useState<MaterialLine[]>([
    { id: Date.now().toString(), materielId: '', quantite: 1 }
  ]);
  const [dateSortie, setDateSortie] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Fetch materials on mount
  useEffect(() => {
    fetchMateriels();
  }, []);

  const fetchMateriels = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await fetch('https://196.12.203.182/api/consultations/medicaments');
      
      if (!response.ok) {
        throw new Error(`Erreur ${response.status}: Impossible de charger les matériels`);
      }
      
      const data = await response.json();
      console.log('Matériels chargés:', data);
      setMateriels(data);
    } catch (err) {
      console.error('Erreur lors du chargement des matériels:', err);
      setError(err instanceof Error ? err.message : 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  const addLine = () => {
    setLines([...lines, { id: Date.now().toString(), materielId: '', quantite: 1 }]);
  };

  const removeLine = (id: string) => {
    if (lines.length > 1) {
      setLines(lines.filter(line => line.id !== id));
    }
  };

  const updateLine = (id: string, field: 'materielId' | 'quantite', value: number | '') => {
    setLines(lines.map(line => 
      line.id === id ? { ...line, [field]: value } : line
    ));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate
    const validLines = lines.filter(line => line.materielId && line.quantite > 0);
    if (validLines.length === 0) {
      setError('Veuillez sélectionner au moins un matériel avec une quantité valide');
      return;
    }

    try {
      setSubmitting(true);
      setError('');

      // Submit each line
      for (const line of validLines) {
        const payload = {
          consultation: { id: consultationId },
          medicament: { id: line.materielId },
          parUnite: true,
          quantite: line.quantite,
          dateSortie: dateSortie
        };

        console.log('Envoi du payload:', payload);

        const response = await fetch('https://196.12.203.182/sortie-stock', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Erreur ${response.status}: ${errorText}`);
        }
      }

      // Success
      onSubmitted();
    } catch (err) {
      console.error('Erreur lors de l\'assignation:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'assignation');
    } finally {
      setSubmitting(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-gray-600">Chargement des matériels...</p>
      </div>
    );
  }

  // Error state
  if (error && materiels.length === 0) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg mb-4">
          <p className="font-semibold">Erreur</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Fermer
          </button>
          <button
            type="button"
            onClick={fetchMateriels}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  // Empty state
  if (materiels.length === 0) {
    return (
      <div className="p-6">
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 p-4 rounded-lg mb-4">
          <p className="font-semibold">Aucun matériel disponible</p>
          <p className="text-sm mt-1">Il n'y a pas de matériels dans le système.</p>
        </div>
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Fermer
          </button>
        </div>
      </div>
    );
  }

  // Main form
  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Date field */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Date d'assignation
        </label>
        <input
          type="date"
          value={dateSortie}
          onChange={(e) => setDateSortie(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          required
        />
      </div>

      {/* Material lines */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-700">
          Matériels à assigner
        </label>
        
        {lines.map((line, index) => {
          const selectedMateriel = materiels.find(m => m.id === line.materielId);
          
          return (
            <div key={line.id} className="flex gap-3 items-start p-4 bg-gray-50 rounded-lg">
              <div className="flex-1">
                <select
                  value={line.materielId}
                  onChange={(e) => updateLine(line.id, 'materielId', e.target.value ? Number(e.target.value) : '')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Sélectionner un matériel</option>
                  {materiels.map(materiel => (
                    <option key={materiel.id} value={materiel.id}>
                      {materiel.nomMedicament} (Stock: {materiel.qteStock})
                    </option>
                  ))}
                </select>
                {selectedMateriel && (
                  <p className="text-xs text-gray-500 mt-1">
                    Stock disponible: {selectedMateriel.qteStock} unités
                  </p>
                )}
              </div>
              
              <div className="w-32">
                <input
                  type="number"
                  min="1"
                  max={selectedMateriel?.qteStock || 999}
                  value={line.quantite}
                  onChange={(e) => updateLine(line.id, 'quantite', Number(e.target.value))}
                  placeholder="Qté"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              
              <button
                type="button"
                onClick={() => removeLine(line.id)}
                disabled={lines.length === 1}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                title="Supprimer"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          );
        })}
        
        <button
          type="button"
          onClick={addLine}
          className="flex items-center gap-2 px-4 py-2 text-blue-600 border border-blue-300 rounded-lg hover:bg-blue-50"
        >
          <Plus className="w-4 h-4" />
          Ajouter un matériel
        </button>
      </div>

      {/* Action buttons */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <button
          type="button"
          onClick={onCancel}
          disabled={submitting}
          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
        >
          Annuler
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? 'Assignation en cours...' : 'Assigner'}
        </button>
      </div>
    </form>
  );
};

export default MaterielAssignmentForm;