import React, { useEffect, useMemo, useState } from 'react';
import { Search, Plus, Trash2, Package, X } from 'lucide-react';
import { ConsultationDTO } from '../types/consultation';
import { Patient } from '../types/patient';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types/roles';

interface Props {
  personnelId: number;
  initial?: ConsultationDTO | null;
  onSubmit: (payload: ConsultationDTO) => void;
  onCancel: () => void;
}

interface Materiel {
  id: number;
  name: string;
  quantity: number;
}

interface MaterialLine {
  id: number;
  materielId: number | '';
  quantite: number;
}

const ConsultationBackendForm: React.FC<Props> = ({ personnelId, initial, onSubmit, onCancel }) => {
  const { user } = useAuth();
  const isNurse = user?.role === UserRole.INFIRMIER;
  
  const [patients, setPatients] = useState<Patient[]>([]);
  const [patientSearch, setPatientSearch] = useState('');
  // Use idNum (the patient's ID number), not the internal database id
  const [selectedPatientId, setSelectedPatientId] = useState<number | null>(
    initial?.patient?.idNum || initial?.patient?.id || null
  );
  const [selectedPatientName, setSelectedPatientName] = useState<string>('');
  
  // When editing, set patient name from initial data
  useEffect(() => {
    if (initial?.patient) {
      const name = `${initial.patient.prenom || ''} ${initial.patient.nom || ''}`.trim();
      if (name) {
        setSelectedPatientName(name);
        setPatientSearch(name);
      }
    }
  }, [initial]);

  const [date, setDate] = useState<string>(() => initial?.dateConsultation?.slice(0, 10) || new Date().toISOString().slice(0, 10));
  const [time, setTime] = useState<string>(() => initial?.dateConsultation ? new Date(initial.dateConsultation).toTimeString().slice(0, 5) : new Date().toTimeString().slice(0, 5));
  const [motif, setMotif] = useState<string>(initial?.motif || '');
  const [diagnostic, setDiagnostic] = useState<string>(initial?.diagnostic || '');
  const [traitement, setTraitement] = useState<string>(initial?.traitement || '');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loadingPatients, setLoadingPatients] = useState(false);
  
  // Constantes for nurses
  const [temperature, setTemperature] = useState('');
  const [tension, setTension] = useState('');
  const [pouls, setPouls] = useState('');
  const [frequenceRespiratoire, setFrequenceRespiratoire] = useState('');
  const [poids, setPoids] = useState('');
  const [taille, setTaille] = useState('');
  
  // Materials
  const [materiels, setMateriels] = useState<Materiel[]>([]);
  const [materialLines, setMaterialLines] = useState<MaterialLine[]>([]);
  const [showMaterialSection, setShowMaterialSection] = useState(false);
  const [assignedMaterials, setAssignedMaterials] = useState<any[]>([]);

  // Fetch materials on mount
  useEffect(() => {
    const fetchMateriels = async () => {
      try {
        const res = await fetch('https://hc.aui.ma/api/consultations/materials');
        if (res.ok) {
          const data = await res.json();
          setMateriels(data);
        }
      } catch (e) {
        console.error('Error fetching materials:', e);
      }
    };
    fetchMateriels();
  }, []);

  // Fetch assigned materials when editing (using patient idNum)
  useEffect(() => {
    const fetchAssignedMaterials = async () => {
      if (initial?.patient?.idNum) {
        try {
          const res = await fetch(`https://hc.aui.ma/api/consultations/materials/patient/${initial.patient.idNum}`);
          
          if (res.ok) {
            const data = await res.json();
            
            // The API can return either:
            // 1. A single object (one material assigned)
            // 2. An array of objects (multiple materials)
            // 3. An object with a "materials" array
            let materialsArray = [];
            
            if (Array.isArray(data)) {
              materialsArray = data;
            } else if (data && typeof data === 'object') {
              // If it's a single object with an id, treat it as a single material
              if (data.id) {
                materialsArray = [data];
              } else if (data.materials && Array.isArray(data.materials)) {
                materialsArray = data.materials;
              }
            }
            
            setAssignedMaterials(materialsArray);
          }
        } catch (err) {
          console.error('Error fetching assigned materials:', err);
        }
      }
    };
    fetchAssignedMaterials();
  }, [initial?.patient?.idNum]);

  useEffect(() => {
    const controller = new AbortController();
    const term = patientSearch.trim();
    if (!term || !/^\d{3,}$/.test(term)) {
      setPatients([]);
      return () => controller.abort();
    }
    setLoadingPatients(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`https://hc.aui.ma/api/patients/${term}`, { signal: controller.signal });
        if (!res.ok) {
          setPatients([]);
          return;
        }
        const r = await res.json();
        // Map API shape to local Patient shape; map idNum -> id
        const mapped: Patient[] = [{
          id: (r.idNum ?? r.id) as number,
          nom: r.nom || '',
          prenom: r.prenom || '',
          cne: r.cne || '',
          dateNaissance: r.dateNaissance || '',
          sexe: r.sexe || '',
          telephone: r.telephone || '',
          email: r.email || ''
        }];
        setPatients(mapped);
      } catch (e) {
        setPatients([]);
      } finally {
        setLoadingPatients(false);
      }
    }, 200);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [patientSearch]);

  const filteredPatients = useMemo(() => patients, [patients]);

  const addMaterialLine = () => {
    setMaterialLines([...materialLines, { id: Date.now().toString(), materielId: '', quantite: 1 }]);
  };

  const removeMaterialLine = (id: string) => {
    setMaterialLines(materialLines.filter(line => line.id !== id));
  };

  const updateMaterialLine = (id: string, field: 'materielId' | 'quantite', value: number | '') => {
    setMaterialLines(materialLines.map(line => 
      line.id === id ? { ...line, [field]: value } : line
    ));
  };

  const handleUnassignMaterial = async (materialId: number, quantity: number) => {
    if (!selectedPatientId) return;
    
    try {
      const unassignPayload = {
        id: materialId,
        patientId: selectedPatientId,
        quantity: quantity
      };
      
      const res = await fetch('https://hc.aui.ma/api/consultations/materials/unassign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(unassignPayload)
      });
      
      if (res.ok) {
        // Refresh assigned materials
        const refreshRes = await fetch(`https://hc.aui.ma/api/consultations/materials/patient/${selectedPatientId}`);
        if (refreshRes.ok) {
          const refreshData = await refreshRes.json();
          let materialsArray = [];
          
          if (Array.isArray(refreshData)) {
            materialsArray = refreshData;
          } else if (refreshData && typeof refreshData === 'object') {
            if (refreshData.id) {
              materialsArray = [refreshData];
            } else if (refreshData.materials && Array.isArray(refreshData.materials)) {
              materialsArray = refreshData.materials;
            }
          }
          
          setAssignedMaterials(materialsArray);
        }
      } else {
        console.error('Failed to unassign material:', await res.text());
      }
    } catch (err) {
      console.error('Error unassigning material:', err);
    }
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!selectedPatientId) e.patient = 'Sélectionner un patient';
    if (!motif.trim()) e.motif = 'Motif requis';
    if (!diagnostic.trim() && !isNurse) e.diagnostic = 'Diagnostic requis';
    if (!traitement.trim()) e.traitement = 'Traitement requis';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    
    console.log('=== CONSULTATION SUBMIT ===');
    console.log('Selected Patient ID:', selectedPatientId);
    console.log('Is Editing:', !!initial);
    console.log('Initial Patient:', initial?.patient);
    
    // Build diagnostic with constantes for nurses
    let finalDiagnostic = diagnostic;
    if (isNurse) {
      const constantes = [];
      if (temperature) constantes.push(`Température: ${temperature}°C`);
      if (tension) constantes.push(`Tension: ${tension}`);
      if (pouls) constantes.push(`Pouls: ${pouls} bpm`);
      if (frequenceRespiratoire) constantes.push(`FR: ${frequenceRespiratoire}/min`);
      if (poids) constantes.push(`Poids: ${poids} kg`);
      if (taille) constantes.push(`Taille: ${taille} cm`);
      
      if (constantes.length > 0) {
        finalDiagnostic = `CONSTANTES:\n${constantes.join('\n')}${diagnostic ? '\n\nNOTES:\n' + diagnostic : ''}`;
      }
    }
    
    // Always use current date/time when saving
    // Format date for backend: "2025-10-10T17:30:00"
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const currentDateTime = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
    
    const consultationPayload = {
      patient: { id: selectedPatientId as number },
      personnel: { id: personnelId },
      dateConsultation: currentDateTime,
      motif,
      diagnostic: finalDiagnostic,
      traitement
    };
    
    // Submit consultation
    onSubmit(consultationPayload);
    
    // If there are materials to assign, use the new assign API
    if (materialLines.length > 0 && selectedPatientId) {
      const validLines = materialLines.filter(line => line.materielId && line.quantite > 0);
      
      for (const line of validLines) {
        try {
          const materialId = Number(line.materielId);
          const patientId = Number(selectedPatientId);
          
          // Validate IDs are not null/NaN
          if (!materialId || isNaN(materialId) || !patientId || isNaN(patientId)) {
            continue;
          }
          
          // Assign material to patient (backend now handles stock reduction automatically)
          const assignPayload = {
            id: materialId,
            patientId: patientId,
            quantity: line.quantite
          };
          
          const assignResponse = await fetch('https://hc.aui.ma/api/consultations/materials/assign', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(assignPayload)
          });
          
          if (assignResponse.ok) {
            // Refresh assigned materials after successful assignment
            const refreshRes = await fetch(`https://hc.aui.ma/api/consultations/materials/patient/${patientId}`);
            if (refreshRes.ok) {
              const refreshData = await refreshRes.json();
              let materialsArray = [];
              
              if (Array.isArray(refreshData)) {
                materialsArray = refreshData;
              } else if (refreshData && typeof refreshData === 'object') {
                if (refreshData.id) {
                  materialsArray = [refreshData];
                } else if (refreshData.materials && Array.isArray(refreshData.materials)) {
                  materialsArray = refreshData.materials;
                }
              }
              
              setAssignedMaterials(materialsArray);
            }
          }
          
        } catch (e) {
          console.error('Error processing material:', e);
        }
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 p-6">
      {/* Patient Selection */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-lg border border-green-200">
        <label className="block text-sm font-semibold text-gray-800 mb-2 flex items-center">
          <Search className="w-4 h-4 mr-2 text-green-600" />
          Patient *
        </label>
        <div className="relative">
          <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={patientSearch}
            onChange={(e) => setPatientSearch(e.target.value)}
            placeholder="Saisir l'ID (idNum) du patient"
            className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
            disabled={!!initial}
          />
        </div>
        {!initial && (
          <div className="mt-2 max-h-40 overflow-y-auto border-2 border-gray-200 rounded-lg shadow-sm bg-white">
            {loadingPatients ? (
              <div className="p-3 text-sm text-gray-500 text-center">Chargement...</div>
            ) : filteredPatients.length === 0 ? (
              <div className="p-3 text-sm text-gray-500 text-center">Aucun patient</div>
            ) : (
              filteredPatients.map(p => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => { setSelectedPatientId(p.id!); setPatientSearch(`${p.prenom} ${p.nom}`); }}
                  className={`w-full text-left px-4 py-3 hover:bg-green-50 transition-colors border-b border-gray-100 last:border-0 ${
                    selectedPatientId === p.id ? 'bg-green-100 border-l-4 border-l-green-600' : ''
                  }`}
                >
                  <div className="text-sm font-semibold text-gray-900">{p.prenom} {p.nom}</div>
                  <div className="text-xs text-gray-600 mt-1">{p.cne} • {p.email}</div>
                </button>
              ))
            )}
          </div>
        )}
        {errors.patient && <p className="text-red-600 text-sm mt-2 font-medium">{errors.patient}</p>}
      </div>

      {/* Date and Time - Hidden but kept for compatibility */}
      <div className="hidden">
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        <input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
      </div>

      {/* Motif */}
      <div className="bg-white p-4 rounded-lg border-2 border-gray-200 shadow-sm">
        <label className="block text-sm font-semibold text-gray-800 mb-2">Motif de consultation *</label>
        <input 
          type="text" 
          value={motif} 
          onChange={(e) => setMotif(e.target.value)} 
          placeholder="Ex: Fièvre, Douleur abdominale..."
          className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all disabled:bg-gray-100" 
          disabled={!!initial}
        />
        {errors.motif && <p className="text-red-600 text-sm mt-2 font-medium">{errors.motif}</p>}
      </div>

      {/* Constantes section for nurses */}
      {isNurse && (
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-lg border-2 border-purple-200 shadow-sm">
          <h3 className="text-sm font-bold text-purple-900 mb-3 flex items-center">
            <span className="bg-purple-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs mr-2">❤</span>
            Constantes vitales
          </h3>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Temp (°C)</label>
              <input 
                type="number" 
                step="0.1" 
                value={temperature} 
                onChange={(e) => setTemperature(e.target.value)} 
                placeholder="37.0"
                className="w-full px-3 py-2 text-sm border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500" 
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Tension</label>
              <input 
                type="text" 
                value={tension} 
                onChange={(e) => setTension(e.target.value)} 
                placeholder="120/80"
                className="w-full px-3 py-2 text-sm border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500" 
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Pouls</label>
              <input 
                type="number" 
                value={pouls} 
                onChange={(e) => setPouls(e.target.value)} 
                placeholder="70"
                className="w-full px-3 py-2 text-sm border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500" 
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">FR (/min)</label>
              <input 
                type="number" 
                value={frequenceRespiratoire} 
                onChange={(e) => setFrequenceRespiratoire(e.target.value)} 
                placeholder="16"
                className="w-full px-3 py-2 text-sm border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500" 
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Poids (kg)</label>
              <input 
                type="number" 
                step="0.1" 
                value={poids} 
                onChange={(e) => setPoids(e.target.value)} 
                placeholder="70"
                className="w-full px-3 py-2 text-sm border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500" 
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Taille (cm)</label>
              <input 
                type="number" 
                value={taille} 
                onChange={(e) => setTaille(e.target.value)} 
                placeholder="170"
                className="w-full px-3 py-2 text-sm border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500" 
              />
            </div>
          </div>
        </div>
      )}

      {/* Diagnostic/Notes */}
      <div className="bg-white p-4 rounded-lg border-2 border-gray-200 shadow-sm">
        <label className="block text-sm font-semibold text-gray-800 mb-2">
          {isNurse ? 'Notes / Observations' : 'Diagnostic *'}
        </label>
        <textarea 
          value={diagnostic} 
          onChange={(e) => setDiagnostic(e.target.value)} 
          rows={4} 
          placeholder={isNurse ? "Observations médicales..." : "Diagnostic médical..."}
          className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none" 
        />
        {errors.diagnostic && <p className="text-red-600 text-sm mt-2 font-medium">{errors.diagnostic}</p>}
      </div>

      {/* Traitement */}
      <div className="bg-white p-4 rounded-lg border-2 border-gray-200 shadow-sm">
        <label className="block text-sm font-semibold text-gray-800 mb-2">Traitement *</label>
        <textarea 
          value={traitement} 
          onChange={(e) => setTraitement(e.target.value)} 
          rows={4} 
          placeholder="Prescription et traitement recommandé..."
          className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none" 
        />
        {errors.traitement && <p className="text-red-600 text-sm mt-2 font-medium">{errors.traitement}</p>}
      </div>

      {/* Material assignment section */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border-2 border-blue-200 shadow-sm">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-sm font-bold text-blue-900 flex items-center">
            <Package className="w-4 h-4 mr-2" />
            Matériels
            {assignedMaterials.length > 0 && (
              <span className="ml-2 bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full">
                {assignedMaterials.length}
              </span>
            )}
          </h3>
          <button
            type="button"
            onClick={() => setShowMaterialSection(!showMaterialSection)}
            className="text-sm px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all shadow-sm font-medium"
          >
            {showMaterialSection ? 'Masquer' : '+ Ajouter matériel'}
          </button>
        </div>

        {/* Display assigned materials */}
        {assignedMaterials.length > 0 ? (
          <div className="mb-3 space-y-2">
            <h4 className="text-xs font-semibold text-gray-700 bg-green-100 p-2 rounded">
              Matériels assignés à ce patient:
            </h4>
            <div className="space-y-2">
              {assignedMaterials.map((material: any, index: number) => (
                <div key={material.id || index} className="flex justify-between items-center bg-white p-3 rounded-lg border-2 border-green-300 shadow-sm">
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-gray-900">
                      {material.name || material.nomMedicament || 'Nom inconnu'}
                    </div>
                    <div className="text-xs text-gray-600">
                      Quantité: {material.quantity || material.qteStock || 'N/A'}
                    </div>
                    <div className="text-xs text-gray-400">
                      ID: {material.id || 'N/A'}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleUnassignMaterial(material.id, material.quantity || 1)}
                    className="flex items-center gap-1 px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium border border-red-200"
                  >
                    <X className="w-4 h-4" />
                    Retourner
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="mb-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-700">
            Aucun matériel assigné pour le moment
          </div>
        )}
        
        {showMaterialSection && (
          <div className="space-y-3">
            {materialLines.map((line) => {
              const selectedMateriel = materiels.find(m => m.id === line.materielId);
              return (
                <div key={line.id} className="flex gap-3 items-center bg-white p-3 rounded-lg border-2 border-gray-200 shadow-sm">
                  <select
                    value={line.materielId}
                    onChange={(e) => updateMaterialLine(line.id, 'materielId', e.target.value ? Number(e.target.value) : '')}
                    className="flex-1 px-3 py-2 text-sm border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Sélectionner un matériel</option>
                    {materiels.map(m => (
                      <option key={m.id} value={m.id}>
                        {m.name} (Stock: {m.quantity})
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min="1"
                    max={selectedMateriel?.quantity || 999}
                    value={line.quantite}
                    onChange={(e) => updateMaterialLine(line.id, 'quantite', Number(e.target.value))}
                    className="w-24 px-3 py-2 text-sm border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Qté"
                  />
                  <button
                    type="button"
                    onClick={() => removeMaterialLine(line.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              );
            })}
            <button
              type="button"
              onClick={addMaterialLine}
              className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium px-3 py-2 hover:bg-blue-50 rounded-lg transition-all"
            >
              <Plus className="w-4 h-4" />
              Ajouter une ligne
            </button>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end space-x-3 pt-4 border-t-2 border-gray-200">
        <button 
          type="button" 
          onClick={onCancel} 
          className="px-6 py-3 border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-all font-medium text-gray-700 shadow-sm"
        >
          Annuler
        </button>
        <button 
          type="submit" 
          className="px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-all font-semibold shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
        >
          {initial ? '✓ Mettre à jour' : '✓ Enregistrer la consultation'}
        </button>
      </div>
    </form>
  );
};

export default ConsultationBackendForm;
