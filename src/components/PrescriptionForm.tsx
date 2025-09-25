import React, { useState } from 'react';
import { Upload, X, AlertCircle } from 'lucide-react';

interface PrescriptionRequest {
  studentId: string;
  studentName: string;
  email: string;
  phone: string;
  allergies: string;
  conditions: string;
  requestedMedicine: string;
  symptoms: string;
  doctorNote?: File;
  urgency: 'LOW' | 'MEDIUM' | 'HIGH';
}

interface PrescriptionFormProps {
  onSubmit: (data: PrescriptionRequest) => void;
  onCancel: () => void;
}

const PrescriptionForm: React.FC<PrescriptionFormProps> = ({ onSubmit, onCancel }) => {
  const [formData, setFormData] = useState<PrescriptionRequest>({
    studentId: '',
    studentName: '',
    email: '',
    phone: '',
    allergies: '',
    conditions: '',
    requestedMedicine: '',
    symptoms: '',
    urgency: 'MEDIUM'
  });

  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const submitData = { ...formData };
    if (uploadedFile) {
      submitData.doctorNote = uploadedFile;
    }
    onSubmit(submitData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFile(file);
    }
  };

  const removeFile = () => {
    setUploadedFile(null);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Student ID *
          </label>
          <input
            type="text"
            name="studentId"
            value={formData.studentId}
            onChange={handleChange}
            placeholder="e.g., STU001"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Full Name *
          </label>
          <input
            type="text"
            name="studentName"
            value={formData.studentName}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email *
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="student@aui.ma"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Phone Number *
          </label>
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            placeholder="+212 6 12 34 56 78"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Requested Medicine *
        </label>
        <input
          type="text"
          name="requestedMedicine"
          value={formData.requestedMedicine}
          onChange={handleChange}
          placeholder="e.g., Paracetamol 500mg"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          required
        />
        <p className="text-xs text-gray-500 mt-1">
          Please specify the exact medicine name and dosage if known
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Urgency Level *
        </label>
        <select
          name="urgency"
          value={formData.urgency}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          required
        >
          <option value="LOW">Low - Routine medication</option>
          <option value="MEDIUM">Medium - Needed within 24-48 hours</option>
          <option value="HIGH">High - Urgent medical need</option>
        </select>
        <p className="text-xs text-gray-500 mt-1">
          High urgency requests are prioritized for faster review
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Symptoms *
        </label>
        <textarea
          name="symptoms"
          value={formData.symptoms}
          onChange={handleChange}
          rows={3}
          placeholder="Describe your symptoms..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Known Allergies
        </label>
        <input
          type="text"
          name="allergies"
          value={formData.allergies}
          onChange={handleChange}
          placeholder="e.g., Penicillin, Aspirin (or 'None')"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
        />
        <div className="flex items-start space-x-2 mt-2 p-2 bg-yellow-50 rounded-lg">
          <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-yellow-700">
            Please list all known allergies. This information is critical for your safety.
          </p>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Medical Conditions
        </label>
        <input
          type="text"
          name="conditions"
          value={formData.conditions}
          onChange={handleChange}
          placeholder="e.g., Diabetes, Hypertension (or 'None')"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
        />
        <p className="text-xs text-gray-500 mt-1">
          Include any chronic conditions or ongoing treatments
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Doctor's Prescription/Note (Recommended)
        </label>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
          {uploadedFile ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-green-100 rounded flex items-center justify-center">
                  <Upload className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{uploadedFile.name}</p>
                  <p className="text-xs text-gray-500">{(uploadedFile.size / 1024).toFixed(1)} KB</p>
                </div>
              </div>
              <button
                type="button"
                onClick={removeFile}
                className="text-red-500 hover:text-red-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="text-center">
              <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <label className="cursor-pointer">
                <span className="text-sm text-green-600 hover:text-green-700 font-medium">
                  Click to upload
                </span>
                <span className="text-sm text-gray-500"> or drag and drop</span>
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
              <p className="text-xs text-gray-500 mt-1">PDF, JPG, PNG up to 10MB</p>
            </div>
          )}
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Uploading a doctor's prescription significantly speeds up the approval process
        </p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-2">
          <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-blue-700">
            <p className="font-medium mb-1">Before submitting:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Ensure all information is accurate and complete</li>
              <li>Double-check your contact information</li>
              <li>For urgent needs, consider visiting the health center directly</li>
              <li>You will receive email notifications about your request status</li>
            </ul>
          </div>
        </div>
      </div>

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
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          Submit Request
        </button>
      </div>
    </form>
  );
};

export default PrescriptionForm;