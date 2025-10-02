import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Input, Select, Row, Col, Card, DatePicker, Spin, Divider, Checkbox, Space } from 'antd';
import { UserOutlined, SaveOutlined, EditOutlined, FileTextOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

interface Patient {
  id: number;
  nom: string;
  prenom: string;
  idNum: number;
  telephone: string;
  email: string;
}

interface MedicalRecordData {
  id?: number;
  patientId?: number; // Changed from patient?.id to patientId
  role: string;
  birthDate: string;
  sex: string;
  phoneNumber: string;
  emergencyContact1: string;
  emergencyContact2: string;
  frequentHeadaches: boolean;
  epilepsySeizures: boolean;
  stroke: boolean;
  hearingImpairment: boolean;
  toothGumDisease: boolean;
  asthmaLungConditions: boolean;
  tuberculosis: boolean;
  gynecologicalDisorder: boolean;
  hormonalDisorders: boolean;
  diabetesMellitus: boolean;
  faintingSpells: boolean;
  heartCondition: boolean;
  eyeDisease: boolean;
  severeAllergies: boolean;
  tropicalDiseases: boolean;
  mentalHealthConditions: boolean;
  bloodDisorders: boolean;
  cancer: boolean;
  hivAids: boolean;
  severeSkinDisorder: boolean;
  conditionsExplanation: string;
  currentMedications: string;
  covidFirstShot: string | null;
  covidSecondShot: string | null;
  covidThirdShot: string | null;
  surgicalHistory: string;
  consentStatus: string;
}

interface MedicalRecordProps {
  patient: Patient;
  visible: boolean;
  onClose: () => void;
}

const MedicalRecord: React.FC<MedicalRecordProps> = ({ patient, visible, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [medicalRecord, setMedicalRecord] = useState<MedicalRecordData | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    if (visible && patient) {
      fetchMedicalRecord();
    }
  }, [visible, patient]);

  const fetchMedicalRecord = async () => {
    try {
      setLoading(true);
      const response = await fetch(`https://196.12.203.182/api/consultations/medicalrecords/patient/${patient.id}`);
      
      if (response.ok) {
        const data = await response.json();
        setMedicalRecord(data);
        setIsEditing(false);
        populateForm(data);
      } else if (response.status === 404) {
        // No medical record exists - show form
        setMedicalRecord(null);
        setIsEditing(true);
        form.resetFields();
      } else {
        console.error('Error fetching medical record');
      }
    } catch (error) {
      console.error('Error fetching medical record:', error);
      setMedicalRecord(null);
      setIsEditing(true);
    } finally {
      setLoading(false);
    }
  };

  const populateForm = (data: MedicalRecordData) => {
    form.setFieldsValue({
      ...data,
      birthDate: data.birthDate ? dayjs(data.birthDate) : null,
      covidFirstShot: data.covidFirstShot ? dayjs(data.covidFirstShot) : null,
      covidSecondShot: data.covidSecondShot ? dayjs(data.covidSecondShot) : null,
      covidThirdShot: data.covidThirdShot ? dayjs(data.covidThirdShot) : null,
    });
  };

  const handleSubmit = async (values: any) => {
    try {
      setLoading(true);
      
      const payload = {
        // Only include id for PUT requests
        ...(medicalRecord?.id && { id: medicalRecord.id }),
        patientId: patient.id, // Changed from patient: { id: patient.id } to patientId
        role: values.role,
        birthDate: values.birthDate ? values.birthDate.format('YYYY-MM-DD') : null,
        sex: values.sex,
        phoneNumber: values.phoneNumber,
        emergencyContact1: values.emergencyContact1,
        emergencyContact2: values.emergencyContact2,
        frequentHeadaches: values.frequentHeadaches || false,
        epilepsySeizures: values.epilepsySeizures || false,
        stroke: values.stroke || false,
        hearingImpairment: values.hearingImpairment || false,
        toothGumDisease: values.toothGumDisease || false,
        asthmaLungConditions: values.asthmaLungConditions || false,
        tuberculosis: values.tuberculosis || false,
        gynecologicalDisorder: values.gynecologicalDisorder || false,
        hormonalDisorders: values.hormonalDisorders || false,
        diabetesMellitus: values.diabetesMellitus || false,
        faintingSpells: values.faintingSpells || false,
        heartCondition: values.heartCondition || false,
        eyeDisease: values.eyeDisease || false,
        severeAllergies: values.severeAllergies || false,
        tropicalDiseases: values.tropicalDiseases || false,
        mentalHealthConditions: values.mentalHealthConditions || false,
        bloodDisorders: values.bloodDisorders || false,
        cancer: values.cancer || false,
        hivAids: values.hivAids || false,
        severeSkinDisorder: values.severeSkinDisorder || false,
        conditionsExplanation: values.conditionsExplanation || '',
        currentMedications: values.currentMedications || '',
        covidFirstShot: values.covidFirstShot ? values.covidFirstShot.format('YYYY-MM-DD') : null,
        covidSecondShot: values.covidSecondShot ? values.covidSecondShot.format('YYYY-MM-DD') : null,
        covidThirdShot: values.covidThirdShot ? values.covidThirdShot.format('YYYY-MM-DD') : null,
        surgicalHistory: values.surgicalHistory || '',
        consentStatus: values.consentStatus || 'Read & Approved',
        recordCreatedDate: medicalRecord?.id ? undefined : new Date().toISOString().split('T')[0],
        lastUpdatedDate: new Date().toISOString().split('T')[0]
      };

      const url = medicalRecord?.id 
        ? `https://196.12.203.182/api/consultations/medicalrecords/${medicalRecord.id}`
        : 'https://196.12.203.182/api/consultations/medicalrecords';
      
      const method = medicalRecord?.id ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        await fetchMedicalRecord();
      } else {
        const errorText = await response.text();
        console.error('Error saving medical record:', errorText);
        alert(`Erreur: ${errorText}`);
      }
    } catch (error) {
      console.error('Error saving medical record:', error);
      alert('Erreur lors de l\'enregistrement');
    } finally {
      setLoading(false);
    }
  };

  const renderViewMode = () => {
    if (!medicalRecord) return null;

    return (
      <div>
        <Card title="Informations Personnelles" style={{ marginBottom: 16 }}>
          <Row gutter={16}>
            <Col span={8}>
              <p><strong>Rôle:</strong> {medicalRecord.role}</p>
              <p><strong>Date de naissance:</strong> {medicalRecord.birthDate}</p>
              <p><strong>Sexe:</strong> {medicalRecord.sex}</p>
            </Col>
            <Col span={8}>
              <p><strong>Téléphone:</strong> {medicalRecord.phoneNumber}</p>
              <p><strong>Contact urgence 1:</strong> {medicalRecord.emergencyContact1}</p>
              <p><strong>Contact urgence 2:</strong> {medicalRecord.emergencyContact2}</p>
            </Col>
          </Row>
        </Card>

        <Card title="Conditions Médicales" style={{ marginBottom: 16 }}>
          <Row gutter={16}>
            <Col span={12}>
              {medicalRecord.frequentHeadaches && <p>✓ Maux de tête fréquents</p>}
              {medicalRecord.epilepsySeizures && <p>✓ Épilepsie ou convulsions</p>}
              {medicalRecord.stroke && <p>✓ AVC</p>}
              {medicalRecord.hearingImpairment && <p>✓ Déficience auditive</p>}
              {medicalRecord.toothGumDisease && <p>✓ Maladie dentaire/gingivale</p>}
              {medicalRecord.asthmaLungConditions && <p>✓ Asthme ou conditions pulmonaires</p>}
              {medicalRecord.tuberculosis && <p>✓ Tuberculose</p>}
              {medicalRecord.gynecologicalDisorder && <p>✓ Trouble gynécologique</p>}
              {medicalRecord.hormonalDisorders && <p>✓ Troubles hormonaux</p>}
              {medicalRecord.diabetesMellitus && <p>✓ Diabète</p>}
            </Col>
            <Col span={12}>
              {medicalRecord.faintingSpells && <p>✓ Évanouissements</p>}
              {medicalRecord.heartCondition && <p>✓ Problèmes cardiaques</p>}
              {medicalRecord.eyeDisease && <p>✓ Maladie oculaire</p>}
              {medicalRecord.severeAllergies && <p>✓ Allergies sévères</p>}
              {medicalRecord.tropicalDiseases && <p>✓ Maladies tropicales</p>}
              {medicalRecord.mentalHealthConditions && <p>✓ Conditions de santé mentale</p>}
              {medicalRecord.bloodDisorders && <p>✓ Troubles sanguins</p>}
              {medicalRecord.cancer && <p>✓ Cancer</p>}
              {medicalRecord.hivAids && <p>✓ VIH/SIDA</p>}
              {medicalRecord.severeSkinDisorder && <p>✓ Trouble cutané sévère</p>}
            </Col>
          </Row>
          {medicalRecord.conditionsExplanation && (
            <>
              <Divider />
              <p><strong>Explications:</strong> {medicalRecord.conditionsExplanation}</p>
            </>
          )}
        </Card>

        <Card title="Médicaments et Vaccinations" style={{ marginBottom: 16 }}>
          <p><strong>Médicaments actuels:</strong> {medicalRecord.currentMedications || 'Aucun'}</p>
          <Divider />
          <Row gutter={16}>
            <Col span={8}>
              <p><strong>COVID 1ère dose:</strong> {medicalRecord.covidFirstShot || 'N/A'}</p>
            </Col>
            <Col span={8}>
              <p><strong>2ème dose:</strong> {medicalRecord.covidSecondShot || 'N/A'}</p>
            </Col>
            <Col span={8}>
              <p><strong>3ème dose:</strong> {medicalRecord.covidThirdShot || 'N/A'}</p>
            </Col>
          </Row>
        </Card>

        <Card title="Historique Chirurgical">
          <p>{medicalRecord.surgicalHistory || 'Aucune intervention'}</p>
        </Card>

        <div style={{ marginTop: 16, textAlign: 'right' }}>
          <Button type="primary" icon={<EditOutlined />} onClick={() => setIsEditing(true)}>
            Modifier
          </Button>
        </div>
      </div>
    );
  };

  const renderEditMode = () => (
    <Form form={form} layout="vertical" onFinish={handleSubmit}>
      <Card title="Informations Personnelles" style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item name="role" label="Rôle" rules={[{ required: true }]}>
              <Select>
                <Select.Option value="Staff">Staff</Select.Option>
                <Select.Option value="Faculty">Faculty</Select.Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="birthDate" label="Date de naissance" rules={[{ required: true }]}>
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="sex" label="Sexe" rules={[{ required: true }]}>
              <Select>
                <Select.Option value="Male">Male</Select.Option>
                <Select.Option value="Female">Female</Select.Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item name="phoneNumber" label="Téléphone" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="emergencyContact1" label="Contact urgence 1" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="emergencyContact2" label="Contact urgence 2">
              <Input />
            </Form.Item>
          </Col>
        </Row>
      </Card>

      <Card title="Conditions Médicales (Cochez si Oui)" style={{ marginBottom: 16 }}>
        <Row gutter={[16, 8]}>
          <Col span={12}>
            <Form.Item name="frequentHeadaches" valuePropName="checked">
              <Checkbox>Maux de tête fréquents</Checkbox>
            </Form.Item>
            <Form.Item name="epilepsySeizures" valuePropName="checked">
              <Checkbox>Épilepsie ou convulsions</Checkbox>
            </Form.Item>
            <Form.Item name="stroke" valuePropName="checked">
              <Checkbox>AVC</Checkbox>
            </Form.Item>
            <Form.Item name="hearingImpairment" valuePropName="checked">
              <Checkbox>Déficience auditive</Checkbox>
            </Form.Item>
            <Form.Item name="toothGumDisease" valuePropName="checked">
              <Checkbox>Maladie dentaire/gingivale</Checkbox>
            </Form.Item>
            <Form.Item name="asthmaLungConditions" valuePropName="checked">
              <Checkbox>Asthme ou conditions pulmonaires</Checkbox>
            </Form.Item>
            <Form.Item name="tuberculosis" valuePropName="checked">
              <Checkbox>Tuberculose</Checkbox>
            </Form.Item>
            <Form.Item name="gynecologicalDisorder" valuePropName="checked">
              <Checkbox>Trouble gynécologique</Checkbox>
            </Form.Item>
            <Form.Item name="hormonalDisorders" valuePropName="checked">
              <Checkbox>Troubles hormonaux</Checkbox>
            </Form.Item>
            <Form.Item name="diabetesMellitus" valuePropName="checked">
              <Checkbox>Diabète</Checkbox>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="faintingSpells" valuePropName="checked">
              <Checkbox>Évanouissements</Checkbox>
            </Form.Item>
            <Form.Item name="heartCondition" valuePropName="checked">
              <Checkbox>Problèmes cardiaques</Checkbox>
            </Form.Item>
            <Form.Item name="eyeDisease" valuePropName="checked">
              <Checkbox>Maladie oculaire</Checkbox>
            </Form.Item>
            <Form.Item name="severeAllergies" valuePropName="checked">
              <Checkbox>Allergies sévères</Checkbox>
            </Form.Item>
            <Form.Item name="tropicalDiseases" valuePropName="checked">
              <Checkbox>Maladies tropicales</Checkbox>
            </Form.Item>
            <Form.Item name="mentalHealthConditions" valuePropName="checked">
              <Checkbox>Dépression, anxiété, etc.</Checkbox>
            </Form.Item>
            <Form.Item name="bloodDisorders" valuePropName="checked">
              <Checkbox>Troubles sanguins</Checkbox>
            </Form.Item>
            <Form.Item name="cancer" valuePropName="checked">
              <Checkbox>Cancer</Checkbox>
            </Form.Item>
            <Form.Item name="hivAids" valuePropName="checked">
              <Checkbox>VIH/SIDA</Checkbox>
            </Form.Item>
            <Form.Item name="severeSkinDisorder" valuePropName="checked">
              <Checkbox>Trouble cutané sévère</Checkbox>
            </Form.Item>
          </Col>
        </Row>
        <Form.Item name="conditionsExplanation" label="Explications (si 'Oui' à une condition)">
          <Input.TextArea rows={3} />
        </Form.Item>
      </Card>

      <Card title="Médicaments et Vaccinations" style={{ marginBottom: 16 }}>
        <Form.Item name="currentMedications" label="Médicaments actuels">
          <Input.TextArea rows={2} placeholder="Liste des médicaments actuels (ou 'None')" />
        </Form.Item>
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item name="covidFirstShot" label="COVID 1ère dose">
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="covidSecondShot" label="2ème dose">
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="covidThirdShot" label="3ème dose">
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
          </Col>
        </Row>
      </Card>

      <Card title="Historique Chirurgical" style={{ marginBottom: 16 }}>
        <Form.Item name="surgicalHistory" label="Interventions chirurgicales">
          <Input.TextArea rows={3} placeholder="Décrivez les interventions (ou 'None')" />
        </Form.Item>
      </Card>

      <Form.Item>
        <Space>
          <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={loading}>
            Enregistrer
          </Button>
          {medicalRecord && (
            <Button onClick={() => setIsEditing(false)}>
              Annuler
            </Button>
          )}
        </Space>
      </Form.Item>
    </Form>
  );

  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FileTextOutlined />
          <span>Dossier Médical - {patient?.prenom} {patient?.nom}</span>
        </div>
      }
      open={visible}
      onCancel={onClose}
      width={1200}
      footer={null}
    >
      <Spin spinning={loading}>
        {!medicalRecord && !loading && (
          <div style={{ marginBottom: 16, padding: 16, background: '#f0f2f5', borderRadius: 8 }}>
            <p style={{ margin: 0 }}>
              <strong>Aucun dossier médical trouvé.</strong> Veuillez remplir le formulaire ci-dessous.
            </p>
          </div>
        )}
        
        {!isEditing && medicalRecord ? renderViewMode() : renderEditMode()}
      </Spin>
    </Modal>
  );
};

export default MedicalRecord;