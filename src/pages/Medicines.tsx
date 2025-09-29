import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, AlertTriangle, Package, Upload, Download, X } from 'lucide-react';

interface Medicine {
  id?: number;
  nomMedicament: string;
  description: string;
  codeBarre39: string;
  perPile: boolean;
  categorie: string;
  dosage: number;
  uniteDosage: string;
  defaultSize: number;
  qteStock: number;
  compteurPiles?: number;
  qteMinimum: number;
}

const Medicines = () => {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [filteredMedicines, setFilteredMedicines] = useState<Medicine[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editingMedicine, setEditingMedicine] = useState<Medicine | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showImportModal, setShowImportModal] = useState(false);
  
  const [formData, setFormData] = useState<Medicine>({
    nomMedicament: '',
    description: '',
    codeBarre39: '',
    perPile: true,
    categorie: 'ANTALGIQUE',
    dosage: 0,
    uniteDosage: 'MG',
    defaultSize: 1,
    qteStock: 0,
    qteMinimum: 10
  });

  const fetchMedicines = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('https://196.12.203.182/api/consultations/medicaments');
      if (!response.ok) throw new Error('Failed to fetch medicines');
      const data = await response.json();
      setMedicines(data);
      setFilteredMedicines(data);
    } catch (error) {
      console.error('Error:', error);
      setError('Erreur lors du chargement des médicaments');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMedicines();
  }, []);

  useEffect(() => {
    let filtered = medicines;
    if (searchTerm) {
      filtered = filtered.filter(m =>
        m.nomMedicament.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.codeBarre39.includes(searchTerm)
      );
    }
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(m => m.categorie === selectedCategory);
    }
    setFilteredMedicines(filtered);
  }, [medicines, searchTerm, selectedCategory]);

  const resetForm = () => {
    setFormData({
      nomMedicament: '',
      description: '',
      codeBarre39: '',
      perPile: true,
      categorie: 'ANTALGIQUE',
      dosage: 0,
      uniteDosage: 'MG',
      defaultSize: 1,
      qteStock: 0,
      qteMinimum: 10
    });
  };

  const openAddForm = () => {
    resetForm();
    setEditingMedicine(null);
    setShowForm(true);
  };

  const openEditForm = (med: Medicine) => {
    setFormData(med);
    setEditingMedicine(med);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingMedicine(null);
    resetForm();
  };

  const handleSubmit = async () => {
    try {
      const url = editingMedicine 
        ? `https://196.12.203.182/api/consultations/medicaments/${editingMedicine.id}`
        : 'https://196.12.203.182/api/consultations/medicaments';
      
      const response = await fetch(url, {
        method: editingMedicine ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      if (!response.ok) throw new Error('Failed to save');
      
      closeForm();
      await fetchMedicines();
    } catch (error) {
      console.error('Error:', error);
      setError('Erreur lors de l\'enregistrement du médicament');
    }
  };

  const handleDeleteMedicine = async (id: number) => {
    if (!confirm('Supprimer ce médicament ?')) return;
    try {
      const response = await fetch(`https://196.12.203.182/api/consultations/medicaments/${id}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Failed to delete');
      await fetchMedicines();
    } catch (error) {
      console.error('Error:', error);
      setError('Erreur lors de la suppression');
    }
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const lines = text.split('\n').filter(l => l.trim());
      
      const medicamentsToImport: Omit<Medicine, 'id'>[] = [];
      
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        if (values.length < 10) continue;
        
        medicamentsToImport.push({
          nomMedicament: values[0],
          description: values[1],
          codeBarre39: values[2],
          perPile: values[3].toLowerCase() === 'true',
          categorie: values[4],
          dosage: parseFloat(values[5]),
          uniteDosage: values[6],
          defaultSize: parseInt(values[7]),
          qteStock: parseInt(values[8]),
          qteMinimum: parseInt(values[9])
        });
      }

      for (const med of medicamentsToImport) {
        await fetch('https://196.12.203.182/api/consultations/medicaments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(med)
        });
      }
      
      setShowImportModal(false);
      await fetchMedicines();
      alert(`${medicamentsToImport.length} médicaments importés`);
    } catch (error) {
      console.error('Error:', error);
      setError('Erreur lors de l\'importation');
    }
  };

  const downloadTemplate = () => {
    const template = 'nomMedicament,description,codeBarre39,perPile,categorie,dosage,uniteDosage,defaultSize,qteStock,qteMinimum\n' +
      'Paracétamol,Analgésique et antipyrétique,123456789,true,ANTALGIQUE,500,MG,20,100,20\n' +
      'Ibuprofène,Anti-inflammatoire,987654321,false,ANTI_INFLAMMATOIRE,400,MG,30,50,15';
    const blob = new Blob([template], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'template_medicaments.csv';
    a.click();
  };

  const isLowStock = (m: Medicine) => m.qteStock <= m.qteMinimum;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Gestion des Médicaments</h1>
          <p className="text-gray-600">Gérez votre inventaire de médicaments</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowImportModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Upload className="w-5 h-5" />
            <span>Importer</span>
          </button>
          <button
            onClick={openAddForm}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            <span>Ajouter</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">{error}</p>
          <button onClick={() => setError('')} className="text-red-600 underline text-sm mt-2">Fermer</button>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Rechercher</label>
            <div className="relative">
              <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Nom, description ou code-barres..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Catégorie</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
            >
              <option value="all">Toutes</option>
              <option value="ANTIBIOTIQUE">Antibiotique</option>
              <option value="ANTI_INFLAMMATOIRE">Anti-inflammatoire</option>
              <option value="ANTALGIQUE">Antalgique</option>
              <option value="ANTIPYRETIQUE">Antipyrétique</option>
              <option value="ANTIVIRAL">Antiviral</option>
              <option value="VITAMINE">Vitamine</option>
              <option value="VACCIN">Vaccin</option>
              <option value="AUTRE">Autre</option>
            </select>
          </div>
          <div className="flex items-end">
            <div className="text-sm text-gray-600">
              <span className="font-medium">{filteredMedicines.length}</span> médicament(s)
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredMedicines.map((med) => (
          <div key={med.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">{med.nomMedicament}</h3>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {med.categorie}
                    </span>
                    <span className="text-sm text-gray-500">{med.dosage} {med.uniteDosage}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => openEditForm(med)}
                    className="p-2 text-gray-400 hover:text-blue-600"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteMedicine(med.id!)}
                    className="p-2 text-gray-400 hover:text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
            <div className="p-4">
              <p className="text-sm text-gray-600 mb-3">{med.description}</p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Code-barres:</span>
                  <span className="font-mono">{med.codeBarre39}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Vente:</span>
                  <span>{med.perPile ? 'À l\'unité' : 'En paquet'}</span>
                </div>
                {!med.perPile && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Taille paquet:</span>
                    <span>{med.defaultSize}</span>
                  </div>
                )}
              </div>
              <div className="mt-4 pt-4 border-t">
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">Stock</span>
                  <span className={`text-sm font-semibold ${isLowStock(med) ? 'text-red-600' : 'text-green-600'}`}>
                    {med.qteStock}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-gray-500">
                    {med.qteStock === 0 ? 'Rupture' : isLowStock(med) ? 'Stock faible' : 'En stock'}
                  </span>
                  {isLowStock(med) && <AlertTriangle className="w-4 h-4 text-yellow-500" />}
                </div>
                {med.compteurPiles !== undefined && med.compteurPiles > 0 && (
                  <div className="mt-2 text-xs text-blue-600">
                    Compteur: {med.compteurPiles}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredMedicines.length === 0 && (
        <div className="text-center py-12">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun médicament trouvé</h3>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-screen overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">{editingMedicine ? 'Modifier' : 'Ajouter'} un médicament</h2>
              <button onClick={closeForm} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">Nom du médicament *</label>
                  <input 
                    value={formData.nomMedicament} 
                    onChange={(e) => setFormData({...formData, nomMedicament: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg" 
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">Description *</label>
                  <textarea 
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg" 
                    rows={3} 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Code-barres *</label>
                  <input 
                    value={formData.codeBarre39}
                    onChange={(e) => setFormData({...formData, codeBarre39: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Catégorie *</label>
                  <select 
                    value={formData.categorie}
                    onChange={(e) => setFormData({...formData, categorie: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="ANTIBIOTIQUE">Antibiotique</option>
                    <option value="ANTI_INFLAMMATOIRE">Anti-inflammatoire</option>
                    <option value="ANTALGIQUE">Antalgique</option>
                    <option value="ANTIPYRETIQUE">Antipyrétique</option>
                    <option value="ANTIVIRAL">Antiviral</option>
                    <option value="VITAMINE">Vitamine</option>
                    <option value="VACCIN">Vaccin</option>
                    <option value="AUTRE">Autre</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Dosage *</label>
                  <input 
                    type="number" 
                    step="0.01"
                    value={formData.dosage}
                    onChange={(e) => setFormData({...formData, dosage: parseFloat(e.target.value)})}
                    className="w-full px-3 py-2 border rounded-lg" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Unité *</label>
                  <select 
                    value={formData.uniteDosage}
                    onChange={(e) => setFormData({...formData, uniteDosage: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="MG">mg</option>
                    <option value="ML">ml</option>
                    <option value="G">g</option>
                    <option value="UI">UI</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Vente *</label>
                  <select 
                    value={formData.perPile ? 'true' : 'false'}
                    onChange={(e) => setFormData({...formData, perPile: e.target.value === 'true'})}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="true">À l'unité</option>
                    <option value="false">En paquet</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Taille paquet *</label>
                  <input 
                    type="number"
                    value={formData.defaultSize}
                    onChange={(e) => setFormData({...formData, defaultSize: parseInt(e.target.value)})}
                    className="w-full px-3 py-2 border rounded-lg" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Quantité stock *</label>
                  <input 
                    type="number"
                    value={formData.qteStock}
                    onChange={(e) => setFormData({...formData, qteStock: parseInt(e.target.value)})}
                    className="w-full px-3 py-2 border rounded-lg" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Stock minimum *</label>
                  <input 
                    type="number"
                    value={formData.qteMinimum}
                    onChange={(e) => setFormData({...formData, qteMinimum: parseInt(e.target.value)})}
                    className="w-full px-3 py-2 border rounded-lg" 
                  />
                </div>
              </div>
              <div className="flex gap-2 justify-end pt-4">
                <button onClick={closeForm} className="px-4 py-2 border rounded-lg hover:bg-gray-50">
                  Annuler
                </button>
                <button onClick={handleSubmit} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                  {editingMedicine ? 'Modifier' : 'Ajouter'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Importer des médicaments</h2>
              <button onClick={() => setShowImportModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            <p className="text-sm text-gray-600 mb-4">Importez un fichier CSV avec les colonnes :</p>
            <div className="bg-gray-50 p-3 rounded mb-4 text-xs font-mono overflow-x-auto">
              nomMedicament, description, codeBarre39, perPile, categorie, dosage, uniteDosage, defaultSize, qteStock, qteMinimum
            </div>
            <button
              onClick={downloadTemplate}
              className="w-full mb-4 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              <span>Télécharger le modèle CSV</span>
            </button>
            <input
              type="file"
              accept=".csv,.xlsx"
              onChange={handleImportFile}
              className="w-full mb-4 px-3 py-2 border rounded-lg"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Medicines;