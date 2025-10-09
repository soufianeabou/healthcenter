import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Package, ArrowLeft, Plus, X } from 'lucide-react';
import { Materiel } from '../types/materiel';
import Modal from '../components/Modal';

const ConsultationDetails: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [consultation, setConsultation] = useState<any>(null);
  const [assignedMaterials, setAssignedMaterials] = useState<Materiel[]>([]);
  const [availableMaterials, setAvailableMaterials] = useState<Materiel[]>([]);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedMaterialId, setSelectedMaterialId] = useState<number | ''>('');

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Fetch consultation details
      const cRes = await fetch(`https://hc.aui.ma/api/consultations/${id}`);
      if (!cRes.ok) throw new Error(`Consultation ${cRes.status}`);
      const cData = await cRes.json();
      setConsultation(cData);
      
      // Fetch materials assigned to this patient
      const patientIdNum = cData.patient?.idNum || cData.patient?.id;
      if (patientIdNum) {
        const mRes = await fetch(`https://hc.aui.ma/api/consultations/materials/patient/${patientIdNum}`);
        if (mRes.ok) {
          const mData = await mRes.json();
          setAssignedMaterials(mData);
        }
      }
      
      // Fetch all available materials
      const allRes = await fetch('https://hc.aui.ma/api/consultations/materials');
      if (allRes.ok) {
        const allData = await allRes.json();
        setAvailableMaterials(allData);
      }
    } catch (e) {
      console.error(e);
      setError('Erreur lors du chargement des détails');
    } finally {
      setLoading(false);
    }
  };
  
  const handleAssignMaterial = async () => {
    if (!selectedMaterialId || !consultation?.patient?.idNum) return;
    
    try {
      const res = await fetch('https://hc.aui.ma/api/consultations/materials/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          materialId: selectedMaterialId,
          patientId: consultation.patient.idNum
        })
      });
      
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`Assignment failed: ${res.status} ${txt}`);
      }
      
      // Refresh data
      await loadData();
      setIsAssignModalOpen(false);
      setSelectedMaterialId('');
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : 'Erreur lors de l\'assignation');
    }
  };
  
  const handleUnassignMaterial = async (materialId: number) => {
    if (!consultation?.patient?.idNum) return;
    if (!confirm('Retourner ce matériel au stock ?')) return;
    
    try {
      const res = await fetch('https://hc.aui.ma/api/consultations/materials/unassign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          materialId: materialId,
          patientId: consultation.patient.idNum
        })
      });
      
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`Unassignment failed: ${res.status} ${txt}`);
      }
      
      // Refresh data
      await loadData();
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : 'Erreur lors du retour');
    }
  };

  if (loading) return <div className="p-6">Chargement...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <button onClick={() => navigate(-1)} className="flex items-center space-x-2 text-gray-700 hover:text-gray-900">
        <ArrowLeft className="w-4 h-4" />
        <span>Retour</span>
      </button>

      {/* Consultation Details */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Consultation</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div><span className="text-gray-600">Patient:</span> <span className="text-gray-900">{`${consultation?.patient?.prenom || ''} ${consultation?.patient?.nom || ''}`.trim()}</span></div>
          <div><span className="text-gray-600">Personnel:</span> <span className="text-gray-900">{`${consultation?.personnel?.prenom || ''} ${consultation?.personnel?.nom || ''}`.trim()}</span></div>
          <div><span className="text-gray-600">Date:</span> <span className="text-gray-900">{new Date(consultation?.dateConsultation).toLocaleString()}</span></div>
          <div><span className="text-gray-600">Motif:</span> <span className="text-gray-900">{consultation?.motif}</span></div>
          <div className="md:col-span-2"><span className="text-gray-600">Diagnostic:</span> <span className="text-gray-900 whitespace-pre-wrap">{consultation?.diagnostic}</span></div>
          <div className="md:col-span-2"><span className="text-gray-600">Traitement:</span> <span className="text-gray-900">{consultation?.traitement}</span></div>
        </div>
      </div>

      {/* Assigned Materials */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800 flex items-center">
            <Package className="w-5 h-5 mr-2 text-blue-600" /> Matériels assignés
          </h2>
          <button
            onClick={() => setIsAssignModalOpen(true)}
            className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Assigner matériel</span>
          </button>
        </div>
        
        {assignedMaterials.length === 0 ? (
          <div className="text-gray-500">Aucun matériel assigné pour ce patient.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Matériel</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Catégorie</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {assignedMaterials.map(material => (
                  <tr key={material.id}>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{material.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{material.category}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{material.description}</td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => material.id && handleUnassignMaterial(material.id)}
                        className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-red-600 hover:bg-red-700"
                      >
                        <X className="w-3 h-3 mr-1" />
                        Retourner
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Assign Material Modal */}
      <Modal
        isOpen={isAssignModalOpen}
        onClose={() => {
          setIsAssignModalOpen(false);
          setSelectedMaterialId('');
        }}
        title="Assigner un Matériel"
      >
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sélectionner un matériel
            </label>
            <select
              value={selectedMaterialId}
              onChange={(e) => setSelectedMaterialId(e.target.value ? Number(e.target.value) : '')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Choisir un matériel</option>
              {availableMaterials
                .filter(m => m.quantity > 0) // Only show materials with stock
                .map(material => (
                  <option key={material.id} value={material.id}>
                    {material.name} - Stock: {material.quantity} {material.unit}
                  </option>
                ))}
            </select>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={() => {
                setIsAssignModalOpen(false);
                setSelectedMaterialId('');
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={handleAssignMaterial}
              disabled={!selectedMaterialId}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Assigner
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ConsultationDetails;
