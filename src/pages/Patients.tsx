import React, { useState, useEffect } from 'react';
import { Table, Button, Space, message, Upload, Modal, Tag, Spin } from 'antd';
import { UserOutlined, HistoryOutlined, UploadOutlined } from '@ant-design/icons';
import MedicalRecord from '../components/MedicalRecord';
import * as XLSX from 'xlsx';

interface Patient {
  id: number;
  nom: string;
  prenom: string;
  idNum: number;
  telephone: string;
  email: string;
  category?: string;
}

const Patients: React.FC = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [medicalRecordVisible, setMedicalRecordVisible] = useState(false);
  const [searchId, setSearchId] = useState('');
  const [nameSearch, setNameSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [patientCategories, setPatientCategories] = useState<Record<number, string>>({});
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [uploadResults, setUploadResults] = useState<{success: number; failed: number; errors: string[]}>({
    success: 0,
    failed: 0,
    errors: []
  });
  const [historyPatient, setHistoryPatient] = useState<Patient | null>(null);
  const [historyConsultations, setHistoryConsultations] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const getStaffPatients = (): Patient[] => {
    try {
      const raw = localStorage.getItem('staffPatients');
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  };

  useEffect(() => {
    const storedCategories = localStorage.getItem('patientCategories');
    if (storedCategories) {
      try {
        setPatientCategories(JSON.parse(storedCategories));
      } catch {
        setPatientCategories({});
      }
    }
    fetchPatients();
  }, []);

  const mapPatient = (r: any, defaultCategory?: string): Patient => ({
    id: r.id,
    nom: r.nom || '',
    prenom: r.prenom || '',
    idNum: r.idNum,
    telephone: r.telephone || '',
    email: r.email || '',
    // Manual override from localStorage takes priority; fall back to API-derived type
    category: patientCategories[r.idNum] || defaultCategory || '',
  });

  // No separate effect needed for searchId — filtered inline below

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const [studentsRes, facultyRes] = await Promise.all([
        fetch('https://hc.aui.ma/api/patients/by-type/students'),
        fetch('https://hc.aui.ma/api/patients/by-type/faculty'),
      ]);

      const isJson = (res: Response) => res.ok && res.headers.get('content-type')?.includes('application/json');

      const staff = getStaffPatients();
      // If both dedicated endpoints are available, use them for category tagging
      if (isJson(studentsRes) || isJson(facultyRes)) {
        const students: any[] = isJson(studentsRes) ? await studentsRes.json() : [];
        const faculty: any[] = isJson(facultyRes) ? await facultyRes.json() : [];
        setPatients([
          ...students.map(p => mapPatient(p, 'Student')),
          ...faculty.map(p => mapPatient(p, 'Faculty')),
          ...staff,
        ]);
      } else {
        // Fallback: original single endpoint (no category distinction)
        const res = await fetch('https://hc.aui.ma/api/patients');
        const data: any[] = res.ok ? await res.json() : [];
        setPatients([...data.map(p => mapPatient(p, 'Student')), ...staff]);
      }
    } catch (error) {
      console.error('Error fetching patients:', error);
      message.error('Erreur lors du chargement des patients');
    } finally {
      setLoading(false);
    }
  };

  const handleViewMedicalRecord = (patient: Patient) => {
    setSelectedPatient(patient);
    setMedicalRecordVisible(true);
  };

  const handleCloseMedicalRecord = () => {
    setMedicalRecordVisible(false);
    setSelectedPatient(null);
  };

  const handleViewHistory = async (patient: Patient) => {
    setHistoryPatient(patient);
    setHistoryConsultations([]);
    setHistoryLoading(true);
    try {
      const res = await fetch('https://hc.aui.ma/api/consultations');
      if (res.ok) {
        const all: any[] = await res.json();

        // Determine effective patient IDs to match against consultations.
        // Staff patients are stored with a negative ExternalPatient ID in the backend.
        const matchIds = new Set<number>([patient.idNum]);
        if (patient.category === 'Staff') {
          try {
            const idsRaw = localStorage.getItem('staffExternalIds');
            const idsMap: Record<string, number> = idsRaw ? JSON.parse(idsRaw) : {};
            const externalId = idsMap[String(patient.idNum)];
            if (externalId) matchIds.add(-externalId);
          } catch { /* ignore */ }
        }

        const patientConsultations = all.filter(c => {
          const cId: number = c.patient?.idNum ?? c.patientId;
          return matchIds.has(cId);
        });
        patientConsultations.sort((a, b) =>
          new Date(b.dateConsultation).getTime() - new Date(a.dateConsultation).getTime()
        );
        setHistoryConsultations(patientConsultations);
      }
    } catch {
      message.error('Erreur lors du chargement de l\'historique');
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleStaffCsvImport = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
        const header = lines[0].split(',').map(h => h.trim());
        const nameIdx = header.findIndex(h => h.toLowerCase() === 'name');
        const emailIdx = header.findIndex(h => h.toLowerCase() === 'email');
        const idIdx = header.findIndex(h => h.toLowerCase() === 'employee id');
        const deptIdx = header.findIndex(h => h.toLowerCase() === 'department');
        const jobIdx = header.findIndex(h => h.toLowerCase() === 'job title');

        const existing: Patient[] = getStaffPatients();
        const existingIds = new Set(existing.map(p => p.idNum));
        const added: Patient[] = [];

        for (let i = 1; i < lines.length; i++) {
          // Handle quoted fields with commas inside
          const cols = lines[i].match(/(".*?"|[^,]+)(?=,|$)/g)?.map(v => v.replace(/^"|"$/g, '').trim()) ?? lines[i].split(',').map(v => v.trim());
          const rawId = cols[idIdx] ?? '';
          const numId = parseInt(rawId, 10);
          if (!rawId || isNaN(numId)) continue; // skip non-numeric IDs

          if (existingIds.has(numId)) continue;
          existingIds.add(numId);

          const fullName = cols[nameIdx] ?? '';
          const parts = fullName.trim().split(' ');
          const prenom = parts[0] || '';
          const nom = parts.slice(1).join(' ') || '';

          added.push({
            id: numId,
            idNum: numId,
            nom,
            prenom,
            email: cols[emailIdx] ?? '',
            telephone: '',
            category: 'Staff',
          });
        }

        const merged = [...existing, ...added];
        localStorage.setItem('staffPatients', JSON.stringify(merged));
        message.success(`${added.length} membres du personnel importés.`);
        fetchPatients();
      } catch {
        message.error('Erreur lors de la lecture du CSV.');
      }
    };
    reader.readAsText(file);
    return false;
  };

  const parseExcelDate = (excelDate: any): string | null => {
    if (!excelDate) return null;
    
    // If already a string in format DD/MM/YY or similar
    if (typeof excelDate === 'string') {
      try {
        const parts = excelDate.split('/');
        if (parts.length === 3) {
          let day = parts[0];
          let month = parts[1];
          let year = parts[2];
          
          // Handle 2-digit year
          if (year.length === 2) {
            year = parseInt(year) > 50 ? '19' + year : '20' + year;
          }
          
          return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        }
      } catch (e) {
        console.error('Error parsing date string:', excelDate);
        return null;
      }
    }
    
    // If Excel serial number
    if (typeof excelDate === 'number') {
      const date = new Date((excelDate - 25569) * 86400 * 1000);
      return date.toISOString().split('T')[0];
    }
    
    return null;
  };

  const handleFileUpload = async (file: File) => {
    try {
      setLoading(true);
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

      let successCount = 0;
      let failedCount = 0;
      const errors: string[] = [];

      // Skip header row (index 0)
      for (let i = 1; i < jsonData.length; i++) {
        const row = jsonData[i];
        
        // Column 7 is ID N°
        const idNum = row[7];
        if (!idNum) {
          errors.push(`Row ${i + 1}: Missing ID N°`);
          failedCount++;
          continue;
        }

        try {
          // Find patient by idNum
          const patientResponse = await fetch(`https://hc.aui.ma/api/patients/${idNum}`);
          
          if (!patientResponse.ok) {
            errors.push(`Row ${i + 1}: Patient with ID ${idNum} not found`);
            failedCount++;
            continue;
          }

          const patient = await patientResponse.json();

          // Check if medical record already exists - Use patient.idNum
          const checkResponse = await fetch(
            `https://hc.aui.ma/api/consultations/medicalrecords/patient/${patient.idNum}`
          );
          
          if (checkResponse.ok) {
            errors.push(`Row ${i + 1}: Medical record already exists for ID ${idNum}`);
            failedCount++;
            continue;
          }

          // Map Excel data to medical record - Use patient.idNum for patientId
          const medicalRecord = {
            patientId: patient.idNum, // Use patient.idNum to match backend expectation
            role: row[8] || 'Staff',
            birthDate: parseExcelDate(row[9]),
            sex: row[10] || 'Male',
            phoneNumber: row[11] || '',
            emergencyContact1: row[12] || '',
            emergencyContact2: row[13] || '',
            
            // Medical conditions (columns 14-33)
            frequentHeadaches: row[14]?.toLowerCase() === 'yes',
            epilepsySeizures: row[15]?.toLowerCase() === 'yes',
            stroke: row[16]?.toLowerCase() === 'yes',
            hearingImpairment: row[17]?.toLowerCase() === 'yes',
            toothGumDisease: row[18]?.toLowerCase() === 'yes',
            asthmaLungConditions: row[19]?.toLowerCase() === 'yes',
            tuberculosis: row[20]?.toLowerCase() === 'yes',
            gynecologicalDisorder: row[21]?.toLowerCase() === 'yes',
            hormonalDisorders: row[22]?.toLowerCase() === 'yes',
            diabetesMellitus: row[23]?.toLowerCase() === 'yes',
            faintingSpells: row[24]?.toLowerCase() === 'yes',
            heartCondition: row[25]?.toLowerCase() === 'yes',
            eyeDisease: row[26]?.toLowerCase() === 'yes',
            severeAllergies: row[27]?.toLowerCase() === 'yes',
            tropicalDiseases: row[28]?.toLowerCase() === 'yes',
            mentalHealthConditions: row[29]?.toLowerCase() === 'yes',
            bloodDisorders: row[30]?.toLowerCase() === 'yes',
            cancer: row[31]?.toLowerCase() === 'yes',
            hivAids: row[32]?.toLowerCase() === 'yes',
            severeSkinDisorder: row[33]?.toLowerCase() === 'yes',
            
            conditionsExplanation: row[34] || '',
            currentMedications: row[35] || 'None',
            
            // COVID shots (columns 36-38)
            covidFirstShot: parseExcelDate(row[36]),
            covidSecondShot: parseExcelDate(row[37]),
            covidThirdShot: parseExcelDate(row[38]),
            
            surgicalHistory: row[39] || 'None',
            consentStatus: 'Read & Approved',
            recordCreatedDate: new Date().toISOString().split('T')[0],
            lastUpdatedDate: new Date().toISOString().split('T')[0]
          };

          // Create medical record
          const createResponse = await fetch(
            'https://hc.aui.ma/api/consultations/medicalrecords',
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(medicalRecord)
            }
          );

          if (createResponse.ok) {
            successCount++;
          } else {
            const errorText = await createResponse.text();
            errors.push(`Row ${i + 1} (ID ${idNum}): ${errorText}`);
            failedCount++;
          }
        } catch (error) {
          errors.push(`Row ${i + 1} (ID ${idNum}): ${error instanceof Error ? error.message : 'Unknown error'}`);
          failedCount++;
        }
      }

      setUploadResults({ success: successCount, failed: failedCount, errors });
      setUploadModalVisible(true);
      message.success(`Import terminé: ${successCount} succès, ${failedCount} échecs`);
    } catch (error) {
      console.error('Error uploading file:', error);
      message.error('Erreur lors du traitement du fichier');
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: 'Nom',
      dataIndex: 'nom',
      key: 'nom',
      render: (_: string, record: Patient) => `${record.prenom} ${record.nom}`,
    },
    {
      title: 'ID Number',
      dataIndex: 'idNum',
      key: 'idNum',
      defaultSortOrder: 'descend' as const,
      sorter: (a: Patient, b: Patient) => b.idNum - a.idNum,
    },
    {
      title: 'Téléphone',
      dataIndex: 'telephone',
      key: 'telephone',
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Catégorie',
      dataIndex: 'category',
      key: 'category',
      width: 120,
      render: (_: string, record: Patient) => {
        const cat = record.category || '';
        const color = cat === 'Student' ? 'blue' : cat === 'Faculty' ? 'purple' : cat === 'Staff' ? 'green' : 'default';
        return cat ? <Tag color={color}>{cat}</Tag> : <Tag>—</Tag>;
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 220,
      render: (_: string, record: Patient) => (
        <Space size="small">
          <Button
            type="primary"
            icon={<UserOutlined />}
            size="small"
            onClick={() => handleViewMedicalRecord(record)}
          >
            Dossier Médical
          </Button>
          <Button
            icon={<HistoryOutlined />}
            size="small"
            onClick={() => handleViewHistory(record)}
          >
            Historique
          </Button>
        </Space>
      ),
    },
  ];

  const filteredPatients = patients.filter((p) => {
    const term = searchId.trim();
    const matchesId = term ? p.idNum.toString().startsWith(term) : true;
    const matchesName = nameSearch
      ? (`${p.prenom} ${p.nom}`.toLowerCase().includes(nameSearch.toLowerCase()))
      : true;
    const matchesCategory = categoryFilter === 'ALL' || (p.category || '') === categoryFilter;
    return matchesId && matchesName && matchesCategory;
  });

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Gestion des Patients</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            value={searchId}
            onChange={(e) => setSearchId(e.target.value)}
            placeholder="Recherche par ID (idNum)"
            style={{ padding: 8, border: '1px solid #e5e7eb', borderRadius: 6 }}
          />
          <input
            value={nameSearch}
            onChange={(e) => setNameSearch(e.target.value)}
            placeholder="Recherche par nom"
            style={{ padding: 8, border: '1px solid #e5e7eb', borderRadius: 6 }}
          />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            style={{ padding: 8, border: '1px solid #e5e7eb', borderRadius: 6 }}
          >
            <option value="ALL">Toutes catégories</option>
            <option value="Student">Student</option>
            <option value="Faculty">Faculty</option>
            <option value="Staff">Staff</option>
            <option value="Guest">Guest</option>
          </select>
          <Upload
            accept=".csv"
            showUploadList={false}
            beforeUpload={handleStaffCsvImport}
          >
            <Button icon={<UploadOutlined />} style={{ backgroundColor: '#52c41a', color: 'white', borderColor: '#52c41a' }}>
              Importer Personnel CSV
            </Button>
          </Upload>
          <Upload
            accept=".xlsx,.xls,.csv"
            showUploadList={false}
            beforeUpload={(file) => {
              handleFileUpload(file);
              return false;
            }}
          >
            <Button icon={<UploadOutlined />} type="primary" style={{ backgroundColor: '#1890ff' }}>
              Importer Dossiers Médicaux
            </Button>
          </Upload>
        </div>
      </div>

      <Table
        columns={columns}
        dataSource={filteredPatients}
        loading={loading}
        rowKey="id"
        pagination={{ pageSize: 10 }}
        scroll={{ x: 1000 }}
      />

      {selectedPatient && (
        <MedicalRecord
          patient={selectedPatient}
          visible={medicalRecordVisible}
          onClose={handleCloseMedicalRecord}
        />
      )}

      <Modal
        title={historyPatient ? `Historique de ${historyPatient.prenom} ${historyPatient.nom} (#${historyPatient.idNum})` : 'Historique'}
        open={!!historyPatient}
        onCancel={() => setHistoryPatient(null)}
        footer={null}
        width={800}
      >
        {historyLoading ? (
          <div className="flex justify-center py-8"><Spin /></div>
        ) : historyConsultations.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#999', padding: 24 }}>Aucune consultation enregistrée pour ce patient.</p>
        ) : (
          <div style={{ maxHeight: 500, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {historyConsultations.map((c: any) => (
              <div key={c.id} style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontWeight: 600, fontSize: 14 }}>
                    {new Date(c.dateConsultation).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
                  </span>
                  <span style={{ fontSize: 12, color: '#6b7280' }}>
                    Dr. {c.personnel?.prenom} {c.personnel?.nom}
                  </span>
                  <Tag color={(c.traitement?.trim() || c.infirmierTraitement?.trim()) ? 'green' : 'orange'}>
                    {(c.traitement?.trim() || c.infirmierTraitement?.trim()) ? 'Terminée' : 'En attente'}
                  </Tag>
                </div>
                {c.motif && <p style={{ margin: '4px 0', fontSize: 13 }}><strong>Motif :</strong> {c.motif}</p>}
                {c.diagnostic && <p style={{ margin: '4px 0', fontSize: 13 }}><strong>Diagnostic :</strong> {c.diagnostic}</p>}
                {c.traitement && <p style={{ margin: '4px 0', fontSize: 13, color: '#059669' }}><strong>Traitement :</strong> {c.traitement}</p>}
                {c.infirmierTraitement && <p style={{ margin: '4px 0', fontSize: 13, color: '#d97706' }}><strong>Traitement infirmier :</strong> {c.infirmierTraitement}</p>}
                {(c.temperature || c.tension || c.pouls || c.saturation) && (
                  <p style={{ margin: '4px 0', fontSize: 12, color: '#6b7280' }}>
                    Constantes : {[c.temperature && `T° ${c.temperature}`, c.tension && `TA ${c.tension}`, c.pouls && `P ${c.pouls}bpm`, c.saturation && `Sat ${c.saturation}%`].filter(Boolean).join(' · ')}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </Modal>

      <Modal
        title="Résultats de l'Import"
        open={uploadModalVisible}
        onOk={() => setUploadModalVisible(false)}
        onCancel={() => setUploadModalVisible(false)}
        width={800}
      >
        <div style={{ marginBottom: 16 }}>
          <p><strong>Succès:</strong> {uploadResults.success}</p>
          <p><strong>Échecs:</strong> {uploadResults.failed}</p>
        </div>
        {uploadResults.errors.length > 0 && (
          <div>
            <h4>Erreurs:</h4>
            <div style={{ maxHeight: 400, overflow: 'auto', background: '#f5f5f5', padding: 12, borderRadius: 4 }}>
              {uploadResults.errors.map((error, idx) => (
                <p key={idx} style={{ margin: 4, fontSize: 12 }}>{error}</p>
              ))}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Patients;