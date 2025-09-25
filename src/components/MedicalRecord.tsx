import React, { useState, useEffect } from 'react';
import { Modal, Button, Table, Form, Input, Select, Row, Col, Card, Tag, Divider } from 'antd';
import { UserOutlined, MedicineBoxOutlined, HeartOutlined, FireOutlined } from '@ant-design/icons';

interface Patient {
  id: number;
  nom: string;
  prenom: string;
  cne: string;
  dateNaissance: string;
  sexe: string;
  telephone: string;
  email: string;
  departement: string;
  typePatient: string;
}

interface Consultation {
  id: number;
  motif: string;
  symptomes?: string;
  examenPhysique?: string;
  tensionArterielle?: string;
  temperature?: string;
  poids?: string;
  taille?: string;
  diagnostic: string;
  diagnosticSecondaire?: string;
  traitement: string;
  posologie?: string;
  dureeTraitement?: string;
  recommandations?: string;
  prochaineVisite?: string;
  urgence?: string;
  statut?: string;
  observations?: string;
  dateConsultation: string;
  personnel: {
    nom: string;
    prenom: string;
    specialite: string;
  };
}

interface MedicalRecordProps {
  patient: Patient;
  visible: boolean;
  onClose: () => void;
}

const MedicalRecord: React.FC<MedicalRecordProps> = ({ patient, visible, onClose }) => {
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    if (visible && patient) {
      fetchConsultations();
    }
  }, [visible, patient]);

  const fetchConsultations = async () => {
    try {
      setLoading(true);
      const response = await fetch(`https://196.12.203.182/api/consultations/patient/${patient.id}`);
      if (response.ok) {
        const data = await response.json();
        setConsultations(data);
      } else {
        console.error('Error fetching consultations');
      }
    } catch (error) {
      console.error('Error fetching consultations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddConsultation = async (values: any) => {
    try {
      const response = await fetch(`https://196.12.203.182/api/consultations/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          idPatient: patient.id,
          idPersonnel: 2,
          motif: values.motif,
          symptomes: values.symptomes,
          examenPhysique: values.examenPhysique,
          tensionArterielle: values.tensionArterielle,
          temperature: values.temperature,
          poids: values.poids,
          taille: values.taille,
          diagnostic: values.diagnostic,
          diagnosticSecondaire: values.diagnosticSecondaire,
          traitement: values.traitement,
          posologie: values.posologie,
          dureeTraitement: values.dureeTraitement,
          recommandations: values.recommandations,
          urgence: values.urgence,
          statut: 'En cours',
          observations: values.observations,
          dateConsultation: new Date().toISOString()
        }),
      });

      if (response.ok) {
        form.resetFields();
        fetchConsultations();
      }
    } catch (error) {
      console.error('Error adding consultation:', error);
    }
  };

  const getUrgencyColor = (urgence: string) => {
    switch (urgence) {
      case 'Faible': return 'green';
      case 'Moyen': return 'orange';
      case 'Élevé': return 'red';
      default: return 'blue';
    }
  };

  const getStatusColor = (statut: string) => {
    switch (statut) {
      case 'Terminée': return 'green';
      case 'En cours': return 'blue';
      case 'Annulée': return 'red';
      default: return 'gray';
    }
  };

  const columns = [
    {
      title: 'Date',
      dataIndex: 'dateConsultation',
      key: 'dateConsultation',
      width: 100,
      render: (date: string) => new Date(date).toLocaleDateString('fr-FR'),
    },
    {
      title: 'Motif',
      dataIndex: 'motif',
      key: 'motif',
      width: 150,
    },
    {
      title: 'Diagnostic',
      dataIndex: 'diagnostic',
      key: 'diagnostic',
      width: 150,
    },
    {
      title: 'Urgence',
      dataIndex: 'urgence',
      key: 'urgence',
      width: 80,
      render: (urgence: string) => (
        <Tag color={getUrgencyColor(urgence)}>{urgence}</Tag>
      ),
    },
    {
      title: 'Statut',
      dataIndex: 'statut',
      key: 'statut',
      width: 80,
      render: (statut: string) => (
        <Tag color={getStatusColor(statut)}>{statut}</Tag>
      ),
    },
    {
      title: 'Médecin',
      key: 'personnel',
      width: 120,
      render: (record: Consultation) => `${record.personnel?.prenom} ${record.personnel?.nom}`,
    },
  ];

  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <UserOutlined />
          <span>Dossier Médical - {patient?.prenom} {patient?.nom}</span>
        </div>
      }
      open={visible}
      onCancel={onClose}
      width={1400}
      footer={null}
    >
      {/* Patient Information */}
      <Card title="Informations Patient" style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col span={8}>
            <p><strong>Nom:</strong> {patient?.prenom} {patient?.nom}</p>
            <p><strong>CNE:</strong> {patient?.cne}</p>
            <p><strong>Date de naissance:</strong> {new Date(patient?.dateNaissance).toLocaleDateString('fr-FR')}</p>
          </Col>
          <Col span={8}>
            <p><strong>Sexe:</strong> {patient?.sexe}</p>
            <p><strong>Téléphone:</strong> {patient?.telephone}</p>
            <p><strong>Email:</strong> {patient?.email}</p>
          </Col>
          <Col span={8}>
            <p><strong>Département:</strong> {patient?.departement}</p>
            <p><strong>Type:</strong> {patient?.typePatient === 'STUDENT' ? 'Étudiant' : 'Personnel'}</p>
          </Col>
        </Row>
      </Card>

      {/* Consultation History */}
      <Card title="Historique des Consultations" style={{ marginBottom: 16 }}>
        <Table
          columns={columns}
          dataSource={consultations}
          loading={loading}
          rowKey="id"
          pagination={{ pageSize: 5 }}
          expandable={{
            expandedRowRender: (record) => (
              <div style={{ margin: 0 }}>
                <Row gutter={16}>
                  <Col span={12}>
                    <h4>Symptômes:</h4>
                    <p>{record.symptomes || 'Non spécifié'}</p>
                    <h4>Examen Physique:</h4>
                    <p>{record.examenPhysique || 'Non spécifié'}</p>
                    <h4>Signes Vitaux:</h4>
                    <p><HeartOutlined /> Tension: {record.tensionArterielle || 'Non mesurée'}</p>
                    <p><FireOutlined /> Température: {record.temperature || 'Non mesurée'}</p>
                    <p>Poids: {record.poids || 'Non mesuré'} kg</p>
                    <p>Taille: {record.taille || 'Non mesurée'} cm</p>
                  </Col>
                  <Col span={12}>
                    <h4>Diagnostic Secondaire:</h4>
                    <p>{record.diagnosticSecondaire || 'Aucun'}</p>
                    <h4>Traitement:</h4>
                    <p>{record.traitement}</p>
                    <h4>Posologie:</h4>
                    <p>{record.posologie || 'Non spécifiée'}</p>
                    <h4>Durée:</h4>
                    <p>{record.dureeTraitement || 'Non spécifiée'}</p>
                    <h4>Recommandations:</h4>
                    <p>{record.recommandations || 'Aucune'}</p>
                  </Col>
                </Row>
                {record.observations && (
                  <>
                    <Divider />
                    <h4>Observations:</h4>
                    <p>{record.observations}</p>
                  </>
                )}
              </div>
            ),
          }}
        />
      </Card>

      {/* Add New Consultation */}
      <Card title="Nouvelle Consultation">
        <Form
          form={form}
          layout="vertical"
          onFinish={handleAddConsultation}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="motif"
                label="Motif de consultation"
                rules={[{ required: true, message: 'Veuillez saisir le motif' }]}
              >
                <Input placeholder="Motif de la consultation" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="urgence"
                label="Niveau d'urgence"
                rules={[{ required: true, message: 'Veuillez sélectionner le niveau d\'urgence' }]}
              >
                <Select placeholder="Sélectionner le niveau d'urgence">
                  <Select.Option value="Faible">Faible</Select.Option>
                  <Select.Option value="Moyen">Moyen</Select.Option>
                  <Select.Option value="Élevé">Élevé</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="symptomes"
            label="Symptômes"
          >
            <Input.TextArea rows={2} placeholder="Symptômes décrits par le patient" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="tensionArterielle"
                label="Tension artérielle"
              >
                <Input placeholder="Ex: 120/80" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="temperature"
                label="Température (°C)"
              >
                <Input placeholder="Ex: 37.2" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="poids"
                label="Poids (kg)"
              >
                <Input placeholder="Ex: 70" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="examenPhysique"
            label="Examen physique"
          >
            <Input.TextArea rows={2} placeholder="Résultats de l'examen physique" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="diagnostic"
                label="Diagnostic principal"
                rules={[{ required: true, message: 'Veuillez saisir le diagnostic' }]}
              >
                <Input placeholder="Diagnostic principal" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="diagnosticSecondaire"
                label="Diagnostic secondaire"
              >
                <Input placeholder="Diagnostics secondaires" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="traitement"
            label="Traitement prescrit"
            rules={[{ required: true, message: 'Veuillez saisir le traitement' }]}
          >
            <Input.TextArea rows={2} placeholder="Traitement prescrit" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="posologie"
                label="Posologie"
              >
                <Input placeholder="Ex: 1 comprimé 3 fois par jour" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="dureeTraitement"
                label="Durée du traitement"
              >
                <Input placeholder="Ex: 7 jours" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="recommandations"
            label="Recommandations"
          >
            <Input.TextArea rows={2} placeholder="Recommandations générales" />
          </Form.Item>

          <Form.Item
            name="observations"
            label="Observations"
          >
            <Input.TextArea rows={2} placeholder="Observations supplémentaires" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" icon={<MedicineBoxOutlined />}>
              Ajouter Consultation
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </Modal>
  );
};

export default MedicalRecord;
