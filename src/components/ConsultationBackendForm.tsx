import React, { useEffect, useMemo, useState } from 'react';
import { Search, Plus, Trash2 } from 'lucide-react';
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
    
    const dateTimeLocal = `${date}T${time}:00`;
    const consultationPayload = {
      patient: { id: selectedPatientId as number },
      personnel: { id: personnelId },
      dateConsultation: dateTimeLocal,
      motif,
      diagnostic: finalDiagnostic,
      traitement
    };
    
    console.log('Consultation Payload:', consultationPayload);
    
    // Submit consultation
    onSubmit(consultationPayload);
    
    // If there are materials to assign, use the new assign API
    if (materialLines.length > 0 && selectedPatientId) {
      console.log('=== MATERIAL ASSIGNMENT ===');
      console.log('Material Lines:', materialLines);
      console.log('Selected Patient ID for materials:', selectedPatientId);
      
      const validLines = materialLines.filter(line => line.materielId && line.quantite > 0);
      console.log('Valid Material Lines:', validLines);
      
      for (const line of validLines) {
        try {
          const materialId = Number(line.materielId);
          const patientId = Number(selectedPatientId);
          
          console.log('Processing line:', { 
            rawMaterielId: line.materielId, 
            rawPatientId: selectedPatientId,
            convertedMaterialId: materialId,
            convertedPatientId: patientId,
            quantity: line.quantite
          });
          
          // Validate IDs are not null/NaN
          if (!materialId || isNaN(materialId)) {
            console.error('❌ Invalid materialId:', line.materielId);
            continue;
          }
          if (!patientId || isNaN(patientId)) {
            console.error('❌ Invalid patientId:', selectedPatientId);
            continue;
          }
          
          // Step 1: Assign material to patient
          const assignPayload = {
            materialId: materialId,
            patientId: patientId
          };
          
          console.log('📤 Step 1: Assigning material to patient:', assignPayload);
          
          const assignResponse = await fetch('https://hc.aui.ma/api/consultations/materials/assign', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(assignPayload)
          });
          
          console.log('📥 Assignment response:', assignResponse.status, assignResponse.statusText);
          
          if (!assignResponse.ok) {
            const errorText = await assignResponse.text();
            console.error('❌ Material assignment failed:', errorText);
            continue; // Skip to next material
          }
          
          console.log('✅ Material assigned successfully');
          
          // Step 2: Get the current material to update its quantity
          console.log('📤 Step 2: Fetching material details to update stock');
          
          const getMaterialResponse = await fetch(`https://hc.aui.ma/api/consultations/materials/${materialId}`);
          
          if (!getMaterialResponse.ok) {
            console.error('❌ Failed to fetch material details');
            continue;
          }
          
          const currentMaterial = await getMaterialResponse.json();
          console.log('Current material:', currentMaterial);
          
          // Step 3: Update material quantity (subtract assigned quantity)
          const newQuantity = currentMaterial.quantity - line.quantite;
          
          if (newQuantity < 0) {
            console.error('❌ Not enough stock! Current:', currentMaterial.quantity, 'Requested:', line.quantite);
            continue;
          }
          
          const updatedMaterial = {
            ...currentMaterial,
            quantity: newQuantity
          };
          
          console.log('📤 Step 3: Updating material stock:', updatedMaterial);
          
          const updateResponse = await fetch('https://hc.aui.ma/api/consultations/materials', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedMaterial)
          });
          
          console.log('📥 Update response:', updateResponse.status, updateResponse.statusText);
          
          if (!updateResponse.ok) {
            const errorText = await updateResponse.text();
            console.error('❌ Failed to update material stock:', errorText);
          } else {
            console.log('✅ Material stock updated successfully. New quantity:', newQuantity);
          }
          
        } catch (e) {
          console.error('❌ Error processing material:', e);
        }
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Patient *</label>
        <div className="relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={patientSearch}
            onChange={(e) => setPatientSearch(e.target.value)}
            placeholder="Saisir l'ID (idNum) du patient"
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
            disabled={!!initial}
          />
        </div>
        <div className="mt-2 max-h-40 overflow-y-auto border border-gray-200 rounded-md">
          {loadingPatients ? (
            <div className="p-3 text-sm text-gray-500">Chargement...</div>
          ) : filteredPatients.length === 0 ? (
            <div className="p-3 text-sm text-gray-500">Aucun patient</div>
          ) : (
            filteredPatients.map(p => (
              <button
                key={p.id}
                type="button"
                onClick={() => { setSelectedPatientId(p.id!); setPatientSearch(`${p.prenom} ${p.nom}`); }}
                className={`w-full text-left px-3 py-2 hover:bg-gray-50 ${selectedPatientId === p.id ? 'bg-green-50' : ''}`}
              >
                <div className="text-sm font-medium text-gray-800">{p.prenom} {p.nom}</div>
                <div className="text-xs text-gray-500">{p.cne} • {p.email}</div>
              </button>
            ))
          )}
        </div>
        {errors.patient && <p className="text-red-600 text-sm mt-1">{errors.patient}</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full px-3 py-2 border rounded-md" disabled={!!initial} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Heure *</label>
          <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="w-full px-3 py-2 border rounded-md" disabled={!!initial} />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Motif *</label>
        <input type="text" value={motif} onChange={(e) => setMotif(e.target.value)} className="w-full px-3 py-2 border rounded-md" disabled={!!initial} />
        {errors.motif && <p className="text-red-600 text-sm mt-1">{errors.motif}</p>}
      </div>

      {/* Constantes section for nurses */}
      {isNurse && (
        <div className="border border-gray-200 rounded-md p-3 bg-gray-50">
          <h3 className="text-xs font-semibold text-gray-700 mb-2">Constantes vitales</h3>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-[10px] font-medium text-gray-600 mb-0.5">Temp (°C)</label>
              <input 
                type="number" 
                step="0.1" 
                value={temperature} 
                onChange={(e) => setTemperature(e.target.value)} 
                placeholder="37.0"
                className="w-full px-2 py-1 text-xs border rounded" 
              />
            </div>
            <div>
              <label className="block text-[10px] font-medium text-gray-600 mb-0.5">Tension</label>
              <input 
                type="text" 
                value={tension} 
                onChange={(e) => setTension(e.target.value)} 
                placeholder="120/80"
                className="w-full px-2 py-1 text-xs border rounded" 
              />
            </div>
            <div>
              <label className="block text-[10px] font-medium text-gray-600 mb-0.5">Pouls</label>
              <input 
                type="number" 
                value={pouls} 
                onChange={(e) => setPouls(e.target.value)} 
                placeholder="70"
                className="w-full px-2 py-1 text-xs border rounded" 
              />
            </div>
            <div>
              <label className="block text-[10px] font-medium text-gray-600 mb-0.5">FR</label>
              <input 
                type="number" 
                value={frequenceRespiratoire} 
                onChange={(e) => setFrequenceRespiratoire(e.target.value)} 
                placeholder="16"
                className="w-full px-2 py-1 text-xs border rounded" 
              />
            </div>
            <div>
              <label className="block text-[10px] font-medium text-gray-600 mb-0.5">Poids (kg)</label>
              <input 
                type="number" 
                step="0.1" 
                value={poids} 
                onChange={(e) => setPoids(e.target.value)} 
                placeholder="70"
                className="w-full px-2 py-1 text-xs border rounded" 
              />
            </div>
            <div>
              <label className="block text-[10px] font-medium text-gray-600 mb-0.5">Taille (cm)</label>
              <input 
                type="number" 
                value={taille} 
                onChange={(e) => setTaille(e.target.value)} 
                placeholder="170"
                className="w-full px-2 py-1 text-xs border rounded" 
              />
            </div>
          </div>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {isNurse ? 'Notes / Observations' : 'Diagnostic *'}
        </label>
        <textarea value={diagnostic} onChange={(e) => setDiagnostic(e.target.value)} rows={3} className="w-full px-3 py-2 border rounded-md" />
        {errors.diagnostic && <p className="text-red-600 text-sm mt-1">{errors.diagnostic}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Traitement *</label>
        <textarea value={traitement} onChange={(e) => setTraitement(e.target.value)} rows={3} className="w-full px-3 py-2 border rounded-md" />
        {errors.traitement && <p className="text-red-600 text-sm mt-1">{errors.traitement}</p>}
      </div>

      {/* Material assignment section */}
      <div className="border border-blue-200 rounded-md p-2 bg-blue-50">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-xs font-semibold text-gray-700">Matériels</h3>
          <button
            type="button"
            onClick={() => setShowMaterialSection(!showMaterialSection)}
            className="text-[10px] px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            {showMaterialSection ? 'Masquer' : 'Ajouter matériel'}
          </button>
        </div>
        
        {showMaterialSection && (
          <div className="space-y-1.5">
            {materialLines.map((line) => {
              const selectedMateriel = materiels.find(m => m.id === line.materielId);
              return (
                <div key={line.id} className="flex gap-1.5 items-center bg-white p-1.5 rounded">
                  <select
                    value={line.materielId}
                    onChange={(e) => updateMaterialLine(line.id, 'materielId', e.target.value ? Number(e.target.value) : '')}
                    className="flex-1 px-1.5 py-1 text-xs border rounded"
                  >
                    <option value="">Sélectionner</option>
                    {materiels.map(m => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.quantity})
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min="1"
                    max={selectedMateriel?.quantity || 999}
                    value={line.quantite}
                    onChange={(e) => updateMaterialLine(line.id, 'quantite', Number(e.target.value))}
                    className="w-16 px-1.5 py-1 text-xs border rounded"
                    placeholder="Qté"
                  />
                  <button
                    type="button"
                    onClick={() => removeMaterialLine(line.id)}
                    className="p-1 text-red-600 hover:bg-red-50 rounded"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              );
            })}
            <button
              type="button"
              onClick={addMaterialLine}
              className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700"
            >
              <Plus className="w-3 h-3" />
              Ajouter
            </button>
          </div>
        )}
      </div>

      <div className="flex justify-end space-x-2 pt-2">
        <button type="button" onClick={onCancel} className="px-4 py-2 border rounded-md">Annuler</button>
        <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded-md">{initial ? 'Mettre à jour' : 'Enregistrer'}</button>
      </div>
    </form>
  );
};

export default ConsultationBackendForm;
