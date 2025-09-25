import React, { useEffect, useMemo, useState } from 'react';
import { SortieStockDTO } from '../types/consultation';
import { Medicine } from '../types/medicine';

interface Props {
  consultationId: number;
  onSubmit: (payload: SortieStockDTO) => void;
  onCancel: () => void;
}

const SortieStockForm: React.FC<Props> = ({ consultationId, onSubmit, onCancel }) => {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [medicineId, setMedicineId] = useState<number | ''>('');
  const [parUnite, setParUnite] = useState<boolean>(true);
  const [quantite, setQuantite] = useState<number>(1);
  const [dateSortie, setDateSortie] = useState<string>(new Date().toISOString().slice(0, 10));
  const [error, setError] = useState<string>('');

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

  const selectedMed = useMemo(() => medicines.find(m => m.id === medicineId), [medicines, medicineId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!medicineId || quantite <= 0) return;
    onSubmit({
      consultation: { id: consultationId },
      medicament: { id: medicineId as number },
      parUnite,
      quantite,
      dateSortie
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <div className="text-red-600 text-sm">{error}</div>}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Médicament *</label>
        <select value={medicineId} onChange={(e) => setMedicineId(e.target.value ? Number(e.target.value) : '')} className="w-full px-3 py-2 border rounded-md">
          <option value="">Sélectionner un médicament</option>
          {medicines.map(m => (
            <option key={m.id} value={m.id}>{m.nomMedicament} — Stock: {m.qteStock}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Unité</label>
          <select value={parUnite ? 'unite' : 'paquet'} onChange={(e) => setParUnite(e.target.value === 'unite')} className="w-full px-3 py-2 border rounded-md">
            <option value="unite">Par unité</option>
            <option value="paquet">Par paquet</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Quantité *</label>
          <input type="number" min={1} value={quantite} onChange={(e) => setQuantite(Number(e.target.value))} className="w-full px-3 py-2 border rounded-md" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Date de sortie</label>
          <input type="date" value={dateSortie} onChange={(e) => setDateSortie(e.target.value)} className="w-full px-3 py-2 border rounded-md" />
        </div>
      </div>

      {selectedMed && !parUnite && (
        <p className="text-xs text-gray-500">Taille du paquet par défaut: {selectedMed.defaultSize}</p>
      )}

      <div className="flex justify-end space-x-2 pt-2">
        <button type="button" onClick={onCancel} className="px-4 py-2 border rounded-md">Annuler</button>
        <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded-md">Valider</button>
      </div>
    </form>
  );
};

export default SortieStockForm;
