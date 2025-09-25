import React, { useState, useEffect } from 'react';
import { Search, Plus, Trash2, User, Pill, Calendar, Clock, FileText } from 'lucide-react';

interface Patient {
  id: string;
  studentId: string;
  name: string;
  email: string;
  phone: string;
  allergies: string;
  conditions: string;
}

interface Medicine {
  id: string;
  name: string;
  dosage: string;
  form: string;
  stockLevel: number;
}

interface PrescriptionItem {
  medicineId: string;
  medicineName: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
}

interface Consultation {
  patientId: string;
  patientName: string;
  patientStudentId: string;
  doctorName: string;
  consultationDate: string;
  consultationTime: string;
  notes: string;
  prescriptionItems: PrescriptionItem[];
  status: 'COMPLETED' | 'PENDING' | 'FOLLOW_UP';
}

interface ConsultationFormProps {
  initialData?: any;
  patients: Patient[];
  medicines: Medicine[];
  currentUser: any;
  onSubmit: (data: Consultation) => void;
  onCancel: () => void;
}

const ConsultationForm: React.FC<ConsultationFormProps> = ({
  initialData,
  patients,
  medicines,
  currentUser,
  onSubmit,
  onCancel
}) => {
  const [formData, setFormData] = useState<Consultation>({
    patientId: '',
    patientName: '',
    patientStudentId: '',
    doctorName: currentUser?.name || 'Dr. Current User',
    consultationDate: new Date().toISOString().split('T')[0],
    consultationTime: new Date().toTimeString().slice(0, 5),
    notes: '',
    prescriptionItems: [],
    status: 'COMPLETED'
  });

  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [patientSearchTerm, setPatientSearchTerm] = useState('');
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);
  const [newPrescriptionItem, setNewPrescriptionItem] = useState<PrescriptionItem>({
    medicineId: '',
    medicineName: '',
    dosage: '',
    frequency: '',
    duration: '',
    instructions: ''
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        patientId: initialData.patientId,
        patientName: initialData.patientName,
        patientStudentId: initialData.patientStudentId,
        doctorName: initialData.doctorName,
        consultationDate: initialData.consultationDate,
        consultationTime: initialData.consultationTime,
        notes: initialData.notes,
        prescriptionItems: initialData.prescriptionItems,
        status: initialData.status
      });
      
      const patient = patients.find(p => p.id === initialData.patientId);
      if (patient) {
        setSelectedPatient(patient);
        setPatientSearchTerm(patient.name);
      }
    }
  }, [initialData, patients]);

  const filteredPatients = patients.filter(patient =>
    patient.name.toLowerCase().includes(patientSearchTerm.toLowerCase()) ||
    patient.studentId.toLowerCase().includes(patientSearchTerm.toLowerCase())
  );

  const handlePatientSelect = (patient: Patient) => {
    setSelectedPatient(patient);
    setPatientSearchTerm(patient.name);
    setFormData(prev => ({
      ...prev,
      patientId: patient.id,
      patientName: patient.name,
      patientStudentId: patient.studentId
    }));
    setShowPatientDropdown(false);
  };

  const handleMedicineSelect = (medicineId: string) => {
    const medicine = medicines.find(m => m.id === medicineId);
    if (medicine) {
      setNewPrescriptionItem(prev => ({
        ...prev,
        medicineId: medicine.id,
        medicineName: medicine.name,
        dosage: medicine.dosage
      }));
    }
  };

  const addPrescriptionItem = () => {
    if (newPrescriptionItem.medicineId && newPrescriptionItem.frequency && newPrescriptionItem.duration) {
      setFormData(prev => ({
        ...prev,
        prescriptionItems: [...prev.prescriptionItems, newPrescriptionItem]
      }));
      setNewPrescriptionItem({
        medicineId: '',
        medicineName: '',
        dosage: '',
        frequency: '',
        duration: '',
        instructions: ''
      });
    }
  };

  const removePrescriptionItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      prescriptionItems: prev.prescriptionItems.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.patientId && formData.notes) {
      onSubmit(formData);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const frequencyOptions = [
    'Once daily',
    'Twice daily',
    '3 times daily',
    '4 times daily',
    'Every 4 hours',
    'Every 6 hours',
    'Every 8 hours',
    'Every 12 hours',
    'As needed',
    'Before meals',
    'After meals',
    'At bedtime'
  ];

  const durationOptions = [
    '3 days',
    '5 days',
    '7 days',
    '10 days',
    '14 days',
    '21 days',
    '30 days',
    'Until finished',
    'As needed'
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-h-[80vh] overflow-y-auto">
      {/* Patient Selection */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
          <User className="w-5 h-5 mr-2" />
          Patient Selection
        </h3>
        <div className="relative">
          <div className="relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={patientSearchTerm}
              onChange={(e) => {
                setPatientSearchTerm(e.target.value);
                setShowPatientDropdown(true);
              }}
              onFocus={() => setShowPatientDropdown(true)}
              placeholder="Search patient by name or student ID..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              required
            />
          </div>
          
          {showPatientDropdown && filteredPatients.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
              {filteredPatients.map((patient) => (
                <button
                  key={patient.id}
                  type="button"
                  onClick={() => handlePatientSelect(patient)}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                >
                  <div className="font-medium text-gray-900">{patient.name}</div>
                  <div className="text-sm text-gray-500">{patient.studentId} • {patient.email}</div>
                  {patient.allergies !== 'None' && (
                    <div className="text-xs text-red-600 mt-1">⚠️ Allergies: {patient.allergies}</div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {selectedPatient && (
          <div className="mt-4 p-3 bg-white rounded-lg border border-gray-200">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-700">Student ID:</span>
                <span className="ml-2 text-gray-900">{selectedPatient.studentId}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Phone:</span>
                <span className="ml-2 text-gray-900">{selectedPatient.phone}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Allergies:</span>
                <span className={`ml-2 ${selectedPatient.allergies !== 'None' ? 'text-red-600 font-medium' : 'text-gray-900'}`}>
                  {selectedPatient.allergies}
                </span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Conditions:</span>
                <span className="ml-2 text-gray-900">{selectedPatient.conditions}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Consultation Details */}
      <div className="bg-blue-50 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
          <Calendar className="w-5 h-5 mr-2" />
          Consultation Details
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Doctor Name
            </label>
            <input
              type="text"
              name="doctorName"
              value={formData.doctorName}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-gray-100"
              readOnly
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date *
            </label>
            <input
              type="date"
              name="consultationDate"
              value={formData.consultationDate}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Time *
            </label>
            <input
              type="time"
              name="consultationTime"
              value={formData.consultationTime}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              required
            />
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Consultation Notes *
          </label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            rows={4}
            placeholder="Enter detailed consultation notes, symptoms, diagnosis, and treatment plan..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            required
          />
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Status
          </label>
          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="COMPLETED">Completed</option>
            <option value="PENDING">Pending</option>
            <option value="FOLLOW_UP">Follow-up Required</option>
          </select>
        </div>
      </div>

      {/* Prescription Items */}
      <div className="bg-green-50 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
          <Pill className="w-5 h-5 mr-2" />
          Prescription Items
        </h3>

        {/* Add New Prescription Item */}
        <div className="bg-white rounded-lg p-4 border border-green-200 mb-4">
          <h4 className="font-medium text-gray-700 mb-3">Add Prescription Item</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Medicine
              </label>
              <select
                value={newPrescriptionItem.medicineId}
                onChange={(e) => handleMedicineSelect(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="">Select medicine</option>
                {medicines.map((medicine) => (
                  <option key={medicine.id} value={medicine.id}>
                    {medicine.name} (Stock: {medicine.stockLevel})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Dosage
              </label>
              <input
                type="text"
                value={newPrescriptionItem.dosage}
                onChange={(e) => setNewPrescriptionItem(prev => ({ ...prev, dosage: e.target.value }))}
                placeholder="e.g., 500mg"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Frequency
              </label>
              <select
                value={newPrescriptionItem.frequency}
                onChange={(e) => setNewPrescriptionItem(prev => ({ ...prev, frequency: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="">Select frequency</option>
                {frequencyOptions.map((freq) => (
                  <option key={freq} value={freq}>{freq}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Duration
              </label>
              <select
                value={newPrescriptionItem.duration}
                onChange={(e) => setNewPrescriptionItem(prev => ({ ...prev, duration: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="">Select duration</option>
                {durationOptions.map((duration) => (
                  <option key={duration} value={duration}>{duration}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Instructions
            </label>
            <textarea
              value={newPrescriptionItem.instructions}
              onChange={(e) => setNewPrescriptionItem(prev => ({ ...prev, instructions: e.target.value }))}
              rows={2}
              placeholder="Special instructions for the patient..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
          <div className="mt-4 flex justify-end">
            <button
              type="button"
              onClick={addPrescriptionItem}
              disabled={!newPrescriptionItem.medicineId || !newPrescriptionItem.frequency || !newPrescriptionItem.duration}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="w-4 h-4" />
              <span>Add Item</span>
            </button>
          </div>
        </div>

        {/* Current Prescription Items */}
        {formData.prescriptionItems.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium text-gray-700">Current Prescription Items</h4>
            {formData.prescriptionItems.map((item, index) => (
              <div key={index} className="bg-white rounded-lg p-4 border border-green-200">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <Pill className="w-4 h-4 text-green-600" />
                      <span className="font-medium text-gray-900">{item.medicineName}</span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Dosage:</span>
                        <span className="ml-2 text-gray-900">{item.dosage}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Frequency:</span>
                        <span className="ml-2 text-gray-900">{item.frequency}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Duration:</span>
                        <span className="ml-2 text-gray-900">{item.duration}</span>
                      </div>
                    </div>
                    {item.instructions && (
                      <div className="mt-2 text-sm">
                        <span className="text-gray-600">Instructions:</span>
                        <p className="text-gray-900 mt-1">{item.instructions}</p>
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => removePrescriptionItem(index)}
                    className="text-red-600 hover:text-red-800 transition-colors ml-4"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Form Actions */}
      <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!formData.patientId || !formData.notes}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {initialData ? 'Update Consultation' : 'Save Consultation'}
        </button>
      </div>
    </form>
  );
};

export default ConsultationForm;