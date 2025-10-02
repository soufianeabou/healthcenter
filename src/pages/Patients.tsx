import React, { useState, useEffect } from 'react';
import { Table, Button, Space, message, Upload, Modal } from 'antd';
import { UserOutlined, PlusOutlined, UploadOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import MedicalRecord from '../components/MedicalRecord';
import * as XLSX from 'xlsx';

interface Patient {
  id: number;
  nom: string;
  prenom: string;
  idNum: number;
  telephone: string;
  email: string;
}

const Patients: React.FC = () => {
  const navigate = useNavigate();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [medicalRecordVisible, setMedicalRecordVisible] = useState(false);
  const [searchId, setSearchId] = useState('');
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [uploadResults, setUploadResults] = useState<{success: number; failed: number; errors: string[]}>({
    success: 0,
    failed: 0,
    errors: []
  });

  useEffect(() => {
    fetchPatients();
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const term = searchId.trim();
    if (!term) return () => controller.abort();
    if (!/^\d{3,}$/.test(term)) return () => controller.abort();
    const timer = setTimeout(async () => {
      try {
        setLoading(true);
        const res = await fetch(`https://196.12.203.182/api/patients/${term}`, { signal: controller.signal });
        if (!res.ok) {
          setPatients([]);
          return;
        }
        const r = await res.json();
        const mapped: Patient = {
          id: r.id,
          nom: r.nom || '',
          prenom: r.prenom || '',
          idNum: r.idNum,
          telephone: r.telephone || '',
          email: r.email || ''
        };
        setPatients([mapped]);
      } catch (e) {
        setPatients([]);
      } finally {
        setLoading(false);
      }
    }, 200);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [searchId]);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const response = await fetch('https://196.12.203.182/api/patients');
      if (response.ok) {
        const data = await response.json();
        setPatients(data);
      } else {
        message.error('Erreur lors du chargement des patients');
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

  const handleAddConsultation = (patient: Patient) => {
    navigate('/consultations', { state: { selectedPatient: patient } });
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
          const patientResponse = await fetch(`https://196.12.203.182/api/patients/${idNum}`);
          
          if (!patientResponse.ok) {
            errors.push(`Row ${i + 1}: Patient with ID ${idNum} not found`);
            failedCount++;
            continue;
          }

          const patient = await patientResponse.json();

          // Check if medical record already exists
          const checkResponse = await fetch(
            `https://196.12.203.182/api/consultations/medicalrecords/patient/${patient.id}`
          );
          
          if (checkResponse.ok) {
            errors.push(`Row ${i + 1}: Medical record already exists for ID ${idNum}`);
            failedCount++;
            continue;
          }

          // Map Excel data to medical record
          const medicalRecord = {
            patient: { id: patient.id },
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
            'https://196.12.203.182/api/consultations/medicalrecords',
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
      render: (text: string, record: Patient) => `${record.prenom} ${record.nom}`,
    },
    {
      title: 'ID Number',
      dataIndex: 'idNum',
      key: 'idNum',
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
      title: 'Actions',
      key: 'actions',
      width: 300,
      render: (text: string, record: Patient) => (
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
            type="default"
            icon={<PlusOutlined />}
            size="small"
            style={{ backgroundColor: '#52c41a', color: 'white', borderColor: '#52c41a' }}
            onClick={() => handleAddConsultation(record)}
          >
            Ajouter Consultation
          </Button>
        </Space>
      ),
    },
  ];

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
        dataSource={patients}
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