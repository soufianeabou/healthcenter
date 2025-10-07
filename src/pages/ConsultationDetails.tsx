import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Package, ArrowLeft, Plus, RefreshCcw } from 'lucide-react';
import Modal from '../components/Modal';
import MaterielAssignmentForm from '../components/MaterielAssignmentForm';

interface SortieItem {
  id: number;
  medicament: { id: number; nomMedicament?: string; codeBarre39?: string };
  parUnite: boolean;
  quantite: number;
  dateSortie: string;
  returned?: boolean; // Track if material has been returned
}

const ConsultationDetails: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [consultation, setConsultation] = useState<any>(null);
  const [sorties, setSorties] = useState<SortieItem[]>([]);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isReturning, setIsReturning] = useState(false);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      const [cRes, sRes] = await Promise.all([
        fetch(`https://196.12.203.182/api/consultations/${id}`),
        fetch(`https://196.12.203.182/sortie-stock?consultationId=${id}`)
      ]);
      if (!cRes.ok) throw new Error(`Consultation ${cRes.status}`);
      if (!sRes.ok) throw new Error(`Sorties ${sRes.status}`);
      const cData = await cRes.json();
      const sData = await sRes.json();
      
      // Initialize returned status for each item
      const sortiesWithReturnStatus = sData.map((item: SortieItem) => ({
        ...item,
        returned: false // Default to not returned
      }));
      
      setConsultation(cData);
      setSorties(sortiesWithReturnStatus);
    } catch (e) {
      console.error(e);
      setError('Erreur lors du chargement des détails');
    } finally {
      setLoading(false);
    }
  };
  
  const handleMaterialAssignment = () => {
    setIsAssignModalOpen(true);
  };
  
  const handleMaterialReturn = async (sortieId: number) => {
    try {
      setIsReturning(true);
      const sortieItem = sorties.find(s => s.id === sortieId);
      if (!sortieItem) return;
      
      // Create a return entry (using the same API but with negative quantity)
      const returnPayload = {
        consultation: { id: Number(id) },
        medicament: { id: sortieItem.medicament.id },
        parUnite: true, // Always true for materials
        quantite: -sortieItem.quantite, // Negative quantity to indicate return
        dateSortie: new Date().toISOString().slice(0, 10)
      };
      
      const res = await fetch('https://196.12.203.182/sortie-stock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(returnPayload)
      });
      
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`Return failed: ${res.status} ${txt}`);
      }
      
      // Mark the item as returned in the UI
      setSorties(prev => 
        prev.map(s => s.id === sortieId ? { ...s, returned: true } : s)
      );
      
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : 'Erreur lors du retour du matériel');
    } finally {
      setIsReturning(false);
    }
  };

  if (loading) return <div className="p-6">Chargement...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;

  return (
    <div className="p-6 space-y-6">
      <button onClick={() => navigate(-1)} className="flex items-center space-x-2 text-gray-700 hover:text-gray-900">
        <ArrowLeft className="w-4 h-4" />
        <span>Retour</span>
      </button>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Consultation</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div><span className="text-gray-600">Patient:</span> <span className="text-gray-900">{`${consultation?.patient?.prenom || ''} ${consultation?.patient?.nom || ''}`.trim()}</span></div>
          <div><span className="text-gray-600">Personnel:</span> <span className="text-gray-900">{`${consultation?.personnel?.prenom || ''} ${consultation?.personnel?.nom || ''}`.trim()}</span></div>
          <div><span className="text-gray-600">Date:</span> <span className="text-gray-900">{new Date(consultation?.dateConsultation).toLocaleString()}</span></div>
          <div><span className="text-gray-600">Motif:</span> <span className="text-gray-900">{consultation?.motif}</span></div>
          <div className="md:col-span-2"><span className="text-gray-600">Diagnostic:</span> <span className="text-gray-900">{consultation?.diagnostic}</span></div>
          <div className="md:col-span-2"><span className="text-gray-600">Traitement:</span> <span className="text-gray-900">{consultation?.traitement}</span></div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800 flex items-center">
            <Package className="w-5 h-5 mr-2 text-blue-600" /> Matériels assignés
          </h2>
          <button 
            onClick={handleMaterialAssignment}
            className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Assigner matériel</span>
          </button>
        </div>
        
        {sorties.length === 0 ? (
          <div className="text-gray-500">Aucun matériel assigné pour cette consultation.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Matériel</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantité</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sorties.map(s => (
                  <tr key={s.id} className={s.returned ? 'bg-gray-50' : ''}>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{s.medicament?.nomMedicament || `#${s.medicament?.id}`}</div>
                      <div className="text-xs text-gray-500">{s.medicament?.codeBarre39}</div>
                    </td>
                    <td className="px-6 py-4">{s.quantite}</td>
                    <td className="px-6 py-4">{new Date(s.dateSortie).toLocaleDateString()}</td>
                    <td className="px-6 py-4">
                      {s.returned ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Retourné
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          Assigné
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {!s.returned && (
                        <button
                          onClick={() => handleMaterialReturn(s.id)}
                          disabled={isReturning}
                          className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-green-600 hover:bg-green-700 focus:outline-none disabled:opacity-50"
                        >
                          <RefreshCcw className="w-3 h-3 mr-1" />
                          Retourner
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      {/* Material Assignment Modal */}
      <Modal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        title="Assigner des Matériels"
      >
        {id && (
          <MaterielAssignmentForm
            consultationId={Number(id)}
            onSubmitted={() => {
              setIsAssignModalOpen(false);
              loadData(); // Refresh data after assignment
            }}
            onCancel={() => setIsAssignModalOpen(false)}
          />
        )}
      </Modal>
    </div>
  );
};

export default ConsultationDetails;