import React, { useState, useEffect } from 'react';
import { Table, Button, Space, message } from 'antd';
import { UserOutlined, PlusOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import MedicalRecord from '../components/MedicalRecord';

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

  useEffect(() => {
    fetchPatients();
  }, []);

  // External API lookup by idNum (numeric); minimal change to preserve table/columns
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
    // Navigate to consultations page with patient pre-selected
    navigate('/consultations', { state: { selectedPatient: patient } });
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
    </div>
  );
};

export default Patients;