import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Pill, ArrowLeft } from 'lucide-react';

interface SortieItem {
  id: number;
  medicament: { id: number; nomMedicament?: string; codeBarre39?: string };
  parUnite: boolean;
  quantite: number;
  dateSortie: string;
}

const ConsultationDetails: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [consultation, setConsultation] = useState<any>(null);
  const [sorties, setSorties] = useState<SortieItem[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError('');
        const [cRes, sRes] = await Promise.all([
          fetch(`/api/consultations/${id}`),
          fetch(`/api/sortie-stock?consultationId=${id}`)
        ]);
        if (!cRes.ok) throw new Error(`Consultation ${cRes.status}`);
        if (!sRes.ok) throw new Error(`Sorties ${sRes.status}`);
        const cData = await cRes.json();
        const sData = await sRes.json();
        setConsultation(cData);
        setSorties(sData);
      } catch (e) {
        console.error(e);
        setError('Erreur lors du chargement des détails');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

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
        <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
          <Pill className="w-5 h-5 mr-2 text-purple-600" /> Médicaments sortis
        </h2>
        {sorties.length === 0 ? (
          <div className="text-gray-500">Aucune sortie de stock pour cette consultation.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Médicament</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantité</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unité</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sorties.map(s => (
                  <tr key={s.id}>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{s.medicament?.nomMedicament || `#${s.medicament?.id}`}</div>
                      <div className="text-xs text-gray-500">{s.medicament?.codeBarre39}</div>
                    </td>
                    <td className="px-6 py-4">{s.quantite}</td>
                    <td className="px-6 py-4">{s.parUnite ? 'Unité' : 'Paquet'}</td>
                    <td className="px-6 py-4">{new Date(s.dateSortie).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConsultationDetails;
