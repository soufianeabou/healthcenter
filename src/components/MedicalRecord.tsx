import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Input, Select, Row, Col, Card, DatePicker, Spin, Divider, Checkbox, Space } from 'antd';
import { UserOutlined, SaveOutlined, EditOutlined, FileTextOutlined, FilePdfOutlined } from '@ant-design/icons';
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
  recordCreatedDate?: string;
  lastUpdatedDate?: string;
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
      const response = await fetch(`https://196.12.203.182/api/consultations/medicalrecords/patient/${patient.idNum}`);
      
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

  const exportToPDF = async () => {
    if (!medicalRecord) return;

    try {
      setLoading(true);
      
      // Create a new window for PDF generation
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        alert('Please allow popups to export PDF');
        return;
      }

      const currentDate = new Date().toLocaleDateString('fr-FR');
      
      // Professional PDF HTML structure
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>Dossier Médical - ${patient.prenom} ${patient.nom}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: 'Arial', sans-serif; 
              line-height: 1.4; 
              color: #333; 
              background: white;
              font-size: 11px;
            }
            .container { 
              max-width: 210mm; 
              margin: 0 auto; 
              padding: 20mm;
              min-height: 297mm;
            }
            .header {
              display: flex;
              align-items: center;
              justify-content: space-between;
              margin-bottom: 30px;
              padding-bottom: 20px;
              border-bottom: 3px solid #2c5f2d;
            }
            .header-text {
              flex: 1;
            }
            .university-name {
              font-size: 24px;
              font-weight: bold;
              color: #2c5f2d;
              margin-bottom: 5px;
              letter-spacing: 1px;
              text-transform: uppercase;
            }
            .health-center {
              font-size: 16px;
              color: #444;
              margin-bottom: 4px;
              font-weight: 600;
            }
            .address {
              font-size: 10px;
              color: #888;
            }
            .document-info {
              text-align: right;
              font-size: 10px;
              color: #666;
            }
            .title {
              text-align: center;
              font-size: 20px;
              font-weight: bold;
              margin: 30px 0;
              color: #2c5f2d;
              text-transform: uppercase;
              letter-spacing: 1px;
            }
            .patient-header {
              background: #f8f9fa;
              padding: 15px;
              border-radius: 8px;
              margin-bottom: 25px;
              border-left: 4px solid #2c5f2d;
            }
            .patient-name {
              font-size: 16px;
              font-weight: bold;
              color: #2c5f2d;
              margin-bottom: 5px;
            }
            .patient-details {
              display: grid;
              grid-template-columns: 1fr 1fr 1fr;
              gap: 10px;
              font-size: 10px;
              color: #666;
            }
            .section {
              margin-bottom: 25px;
              break-inside: avoid;
            }
            .section-title {
              font-size: 14px;
              font-weight: bold;
              color: #2c5f2d;
              margin-bottom: 12px;
              padding-bottom: 5px;
              border-bottom: 2px solid #e9ecef;
              text-transform: uppercase;
            }
            .info-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 15px;
              margin-bottom: 15px;
            }
            .info-item {
              margin-bottom: 8px;
            }
            .info-label {
              font-weight: bold;
              color: #555;
              margin-bottom: 2px;
            }
            .info-value {
              color: #333;
              padding-left: 10px;
            }
            .conditions-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 10px;
              margin-bottom: 15px;
            }
            .condition-item {
              display: flex;
              align-items: center;
              margin-bottom: 5px;
              font-size: 10px;
            }
            .condition-check {
              color: #28a745;
              font-weight: bold;
              margin-right: 8px;
            }
            .explanation-box {
              background: #f8f9fa;
              padding: 10px;
              border-radius: 4px;
              margin-top: 10px;
              border-left: 3px solid #ffc107;
            }
            .footer {
              margin-top: 40px;
              padding-top: 20px;
              border-top: 1px solid #dee2e6;
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 30px;
              font-size: 10px;
            }
            .signature-section {
              text-align: center;
            }
            .signature-line {
              border-bottom: 1px solid #333;
              margin: 30px 0 5px 0;
              height: 40px;
            }
            @media print {
              body { margin: 0; }
              .container { margin: 0; padding: 15mm; }
              .section { page-break-inside: avoid; }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <!-- Header -->
            <div class="header">
              <div class="header-text">
                <div class="university-name">Al Akhawayn University</div>
                <div class="health-center">Health Center</div>
                <div class="address">Avenue Hassan II, Ifrane 53000, Morocco</div>
              </div>
              <div class="document-info">
                <div><strong>Date d'émission:</strong> ${currentDate}</div>
                <div><strong>Document N°:</strong> MR-${patient.idNum}-${new Date().getFullYear()}</div>
              </div>
            </div>

            <!-- Title -->
            <div class="title">Dossier Médical Confidentiel</div>

            <!-- Patient Information -->
            <div class="patient-header">
              <div class="patient-name">${patient.prenom} ${patient.nom}</div>
              <div class="patient-details">
                <div><strong>ID Patient:</strong> ${patient.idNum}</div>
                <div><strong>Téléphone:</strong> ${patient.telephone || 'N/A'}</div>
                <div><strong>Email:</strong> ${patient.email || 'N/A'}</div>
              </div>
            </div>

            <!-- Personal Information Section -->
            <div class="section">
              <div class="section-title">Informations Personnelles</div>
              <div class="info-grid">
                <div>
                  <div class="info-item">
                    <div class="info-label">Rôle:</div>
                    <div class="info-value">${medicalRecord.role}</div>
                  </div>
                  <div class="info-item">
                    <div class="info-label">Date de naissance:</div>
                    <div class="info-value">${medicalRecord.birthDate || 'N/A'}</div>
                  </div>
                  <div class="info-item">
                    <div class="info-label">Sexe:</div>
                    <div class="info-value">${medicalRecord.sex}</div>
                  </div>
                </div>
                <div>
                  <div class="info-item">
                    <div class="info-label">Téléphone:</div>
                    <div class="info-value">${medicalRecord.phoneNumber}</div>
                  </div>
                  <div class="info-item">
                    <div class="info-label">Contact d'urgence 1:</div>
                    <div class="info-value">${medicalRecord.emergencyContact1}</div>
                  </div>
                  <div class="info-item">
                    <div class="info-label">Contact d'urgence 2:</div>
                    <div class="info-value">${medicalRecord.emergencyContact2 || 'N/A'}</div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Medical Conditions Section -->
            <div class="section">
              <div class="section-title">Conditions Médicales</div>
              <div class="conditions-grid">
                <div>
                  ${medicalRecord.frequentHeadaches ? '<div class="condition-item"><span class="condition-check">✓</span>Maux de tête fréquents</div>' : ''}
                  ${medicalRecord.epilepsySeizures ? '<div class="condition-item"><span class="condition-check">✓</span>Épilepsie ou convulsions</div>' : ''}
                  ${medicalRecord.stroke ? '<div class="condition-item"><span class="condition-check">✓</span>AVC</div>' : ''}
                  ${medicalRecord.hearingImpairment ? '<div class="condition-item"><span class="condition-check">✓</span>Déficience auditive</div>' : ''}
                  ${medicalRecord.toothGumDisease ? '<div class="condition-item"><span class="condition-check">✓</span>Maladie dentaire/gingivale</div>' : ''}
                  ${medicalRecord.asthmaLungConditions ? '<div class="condition-item"><span class="condition-check">✓</span>Asthme ou conditions pulmonaires</div>' : ''}
                  ${medicalRecord.tuberculosis ? '<div class="condition-item"><span class="condition-check">✓</span>Tuberculose</div>' : ''}
                  ${medicalRecord.gynecologicalDisorder ? '<div class="condition-item"><span class="condition-check">✓</span>Trouble gynécologique</div>' : ''}
                  ${medicalRecord.hormonalDisorders ? '<div class="condition-item"><span class="condition-check">✓</span>Troubles hormonaux</div>' : ''}
                  ${medicalRecord.diabetesMellitus ? '<div class="condition-item"><span class="condition-check">✓</span>Diabète</div>' : ''}
                </div>
                <div>
                  ${medicalRecord.faintingSpells ? '<div class="condition-item"><span class="condition-check">✓</span>Évanouissements</div>' : ''}
                  ${medicalRecord.heartCondition ? '<div class="condition-item"><span class="condition-check">✓</span>Problèmes cardiaques</div>' : ''}
                  ${medicalRecord.eyeDisease ? '<div class="condition-item"><span class="condition-check">✓</span>Maladie oculaire</div>' : ''}
                  ${medicalRecord.severeAllergies ? '<div class="condition-item"><span class="condition-check">✓</span>Allergies sévères</div>' : ''}
                  ${medicalRecord.tropicalDiseases ? '<div class="condition-item"><span class="condition-check">✓</span>Maladies tropicales</div>' : ''}
                  ${medicalRecord.mentalHealthConditions ? '<div class="condition-item"><span class="condition-check">✓</span>Conditions de santé mentale</div>' : ''}
                  ${medicalRecord.bloodDisorders ? '<div class="condition-item"><span class="condition-check">✓</span>Troubles sanguins</div>' : ''}
                  ${medicalRecord.cancer ? '<div class="condition-item"><span class="condition-check">✓</span>Cancer</div>' : ''}
                  ${medicalRecord.hivAids ? '<div class="condition-item"><span class="condition-check">✓</span>VIH/SIDA</div>' : ''}
                  ${medicalRecord.severeSkinDisorder ? '<div class="condition-item"><span class="condition-check">✓</span>Trouble cutané sévère</div>' : ''}
                </div>
              </div>
              ${medicalRecord.conditionsExplanation ? `
                <div class="explanation-box">
                  <div class="info-label">Explications des conditions:</div>
                  <div style="margin-top: 5px;">${medicalRecord.conditionsExplanation}</div>
                </div>
              ` : ''}
            </div>

            <!-- Medications and Vaccinations Section -->
            <div class="section">
              <div class="section-title">Médicaments et Vaccinations</div>
              <div class="info-item">
                <div class="info-label">Médicaments actuels:</div>
                <div class="info-value">${medicalRecord.currentMedications || 'Aucun'}</div>
              </div>
              <div class="info-grid" style="margin-top: 15px;">
                <div>
                  <div class="info-item">
                    <div class="info-label">COVID-19 - 1ère dose:</div>
                    <div class="info-value">${medicalRecord.covidFirstShot || 'Non administrée'}</div>
                  </div>
                  <div class="info-item">
                    <div class="info-label">COVID-19 - 2ème dose:</div>
                    <div class="info-value">${medicalRecord.covidSecondShot || 'Non administrée'}</div>
                  </div>
                </div>
                <div>
                  <div class="info-item">
                    <div class="info-label">COVID-19 - 3ème dose:</div>
                    <div class="info-value">${medicalRecord.covidThirdShot || 'Non administrée'}</div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Surgical History Section -->
            <div class="section">
              <div class="section-title">Historique Chirurgical</div>
              <div class="info-item">
                <div class="info-value">${medicalRecord.surgicalHistory || 'Aucune intervention chirurgicale'}</div>
              </div>
            </div>

            <!-- Footer -->
            <div class="footer">
              <div>
                <div style="font-weight: bold; margin-bottom: 10px;">Informations Importantes:</div>
                <div style="margin-bottom: 5px;">• Document confidentiel médical</div>
                <div style="margin-bottom: 5px;">• Statut de consentement: ${medicalRecord.consentStatus}</div>
                <div style="margin-bottom: 5px;">• Date de création: ${medicalRecord.recordCreatedDate || 'N/A'}</div>
                <div>• Dernière mise à jour: ${medicalRecord.lastUpdatedDate || 'N/A'}</div>
              </div>
              <div class="signature-section">
                <div style="font-weight: bold; margin-bottom: 10px;">Signature du Médecin</div>
                <div class="signature-line"></div>
                <div>Dr. ___________________</div>
                <div style="margin-top: 10px; font-size: 9px;">Centre de Santé - Al Akhawayn University</div>
              </div>
            </div>
          </div>
        </body>
        </html>
      `;

      printWindow.document.write(htmlContent);
      printWindow.document.close();
      
      // Wait for content to load then print
      setTimeout(() => {
        printWindow.focus();
        printWindow.print();
        printWindow.close();
      }, 250);
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Erreur lors de la génération du PDF');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      setLoading(true);
      
      const payload = {
        // Only include id for PUT requests
        ...(medicalRecord?.id && { id: medicalRecord.id }),
        patientId: patient.idNum, // Use patient.idNum to match backend expectation
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
          <Space>
            <Button 
              type="default" 
              icon={<FilePdfOutlined />} 
              onClick={exportToPDF}
              style={{ backgroundColor: '#dc3545', color: 'white', borderColor: '#dc3545' }}
            >
              Exporter PDF
            </Button>
            <Button type="primary" icon={<EditOutlined />} onClick={() => setIsEditing(true)}>
              Modifier
            </Button>
          </Space>
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