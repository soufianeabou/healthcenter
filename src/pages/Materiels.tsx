import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, AlertTriangle, Package, Upload, Download, X } from 'lucide-react';
import { Materiel, CategorieMateriels, Unite } from '../types/materiel';

const Materiels = () => {
  const [materiels, setMateriels] = useState<Materiel[]>([]);
  const [filteredMateriels, setFilteredMateriels] = useState<Materiel[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editingMateriel, setEditingMateriel] = useState<Materiel | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showImportModal, setShowImportModal] = useState(false);
  
  const [formData, setFormData] = useState<Materiel>({
    nomMedicament: '',
    description: '',
    codeBarre39: '',
    perPile: true,
    categorie: CategorieMateriels.AUTRE,
    dosage: 0,
    uniteDosage: Unite.MG,
    defaultSize: 1,
    qteStock: 0,
    qteMinimum: 10
  });

  const fetchMateriels = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('https://196.12.203.182/api/consultations/medicaments');
      if (!response.ok) throw new Error('Failed to fetch materiels');
      const data = await response.json();
      setMateriels(data);
      setFilteredMateriels(data);
    } catch (error) {
      console.error('Error:', error);
      setError('Erreur lors du chargement des matériels');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMateriels();
  }, []);

  useEffect(() => {
    let filtered = materiels;
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
    setFilteredMateriels(filtered);
  }, [materiels, searchTerm, selectedCategory]);

  const resetForm = () => {
    setFormData({
      nomMedicament: '',
      description: '',
      codeBarre39: '',
      perPile: true,
      categorie: CategorieMateriels.AUTRE,
      dosage: 0,
      uniteDosage: Unite.MG,
      defaultSize: 1,
      qteStock: 0,
      qteMinimum: 10
    });
  };

  const openAddForm = () => {
    resetForm();
    setEditingMateriel(null);
    setShowForm(true);
  };

  const openEditForm = (mat: Materiel) => {
    setFormData(mat);
    setEditingMateriel(mat);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingMateriel(null);
    resetForm();
  };

  const handleSubmit = async () => {
    try {
      const url = editingMateriel 
        ? `https://196.12.203.182/api/consultations/medicaments/${editingMateriel.id}`
        : 'https://196.12.203.182/api/consultations/medicaments';
      
      console.log('Submitting data:', formData);
      
      const response = await fetch(url, {
        method: editingMateriel ? 'PUT' : 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(formData)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Server error:', errorText);
        throw new Error(`Failed to save: ${response.status} ${errorText}`);
      }
      
      closeForm();
      await fetchMateriels();
    } catch (error) {
      console.error('Error:', error);
      setError(`Erreur lors de l'enregistrement du matériel: ${error.message}`);
    }
  };

  const handleDeleteMateriel = async (id: number) => {
    if (!confirm('Supprimer ce matériel ?')) return;
    try {
      const response = await fetch(`https://196.12.203.182/api/consultations/medicaments/${id}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Failed to delete');
      await fetchMateriels();
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
      
      const materielsToImport: Omit<Materiel, 'id'>[] = [];
      
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        if (values.length < 10) continue;
        
        materielsToImport.push({
          nomMedicament: values[0],
          description: values[1],
          codeBarre39: values[2],
          perPile: values[3].toLowerCase() === 'true',
          categorie: values[4] as CategorieMateriels,
          dosage: parseFloat(values[5]),
          uniteDosage: values[6] as Unite,
          defaultSize: parseInt(values[7]),
          qteStock: parseInt(values[8]),
          qteMinimum: parseInt(values[9])
        });
      }

      for (const mat of materielsToImport) {
        await fetch('https://196.12.203.182/api/consultations/medicaments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(mat)
        });
      }
      
      setShowImportModal(false);
      await fetchMateriels();
      alert(`${materielsToImport.length} matériels importés`);
    } catch (error) {
      console.error('Error:', error);
      setError('Erreur lors de l\'importation');
    }
  };

  const downloadTemplate = () => {
    const template = 'nomMedicament,description,codeBarre39,perPile,categorie,dosage,uniteDosage,defaultSize,qteStock,qteMinimum\n' +
      'Gants d\'examen,Gants jetables en latex,123456789,true,MATERIEL_JETABLE,100,UNITE,20,100,20\n' +
      'Compresses stériles,Compresses stériles 10x10cm,987654321,false,MATERIEL_HYGIENE,50,BOITE,30,50,15';
    const blob = new Blob([template], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'template_materiels.csv';
    a.click();
  };

  const isLowStock = (m: Materiel) => m.qteStock <= m.qteMinimum;

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
          <h1 className="text-2xl font-bold text-gray-800">Gestion des Matériels</h1>
          <p className="text-gray-600">Gérez votre inventaire de matériels</p>
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
              <option value={CategorieMateriels.ANTIBIOTIQUE}>Antibiotique</option>
              <option value={CategorieMateriels.ANTI_INFLAMMATOIRE}>Anti-inflammatoire</option>
              <option value={CategorieMateriels.ANTALGIQUE}>Antalgique</option>
              <option value={CategorieMateriels.ANTIPYRETIQUE}>Antipyrétique</option>
              <option value={CategorieMateriels.ANTIVIRAL}>Antiviral</option>
              <option value={CategorieMateriels.VITAMINE}>Vitamine</option>
              <option value={CategorieMateriels.VACCIN}>Vaccin</option>
              <option value={CategorieMateriels.AUTRE}>Autre</option>
            </select>
          </div>
          <div className="flex items-end">
            <div className="text-sm text-gray-600">
              <span className="font-medium">{filteredMateriels.length}</span> matériel(s)
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredMateriels.map((mat) => (
          <div key={mat.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">{mat.nomMedicament}</h3>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {mat.categorie}
                    </span>
                    <span className="text-sm text-gray-500">{mat.dosage} {mat.uniteDosage}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => openEditForm(mat)}
                    className="p-2 text-gray-400 hover:text-blue-600"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteMateriel(mat.id!)}
                    className="p-2 text-gray-400 hover:text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
            <div className="p-4">
              <p className="text-sm text-gray-600 mb-3">{mat.description}</p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Code-barres:</span>
                  <span className="font-mono">{mat.codeBarre39}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Vente:</span>
                  <span>{mat.perPile ? 'À l\'unité' : 'En lot'}</span>
                </div>
                {!mat.perPile && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Taille lot:</span>
                    <span>{mat.defaultSize}</span>
                  </div>
                )}
              </div>
              <div className="mt-4 pt-4 border-t">
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">Stock</span>
                  <span className={`text-sm font-semibold ${isLowStock(mat) ? 'text-red-600' : 'text-green-600'}`}>
                    {mat.qteStock}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-gray-500">
                    {mat.qteStock === 0 ? 'Rupture' : isLowStock(mat) ? 'Stock faible' : 'En stock'}
                  </span>
                  {isLowStock(mat) && <AlertTriangle className="w-4 h-4 text-yellow-500" />}
                </div>
                {mat.compteurPiles !== undefined && mat.compteurPiles > 0 && (
                  <div className="mt-2 text-xs text-blue-600">
                    Compteur: {mat.compteurPiles}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredMateriels.length === 0 && (
        <div className="text-center py-12">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun matériel trouvé</h3>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-screen overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">{editingMateriel ? 'Modifier' : 'Ajouter'} un matériel</h2>
              <button onClick={closeForm} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">Nom du matériel *</label>
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
                    onChange={(e) => setFormData({...formData, categorie: e.target.value as CategorieMateriels})}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value={CategorieMateriels.ANTIBIOTIQUE}>Antibiotique</option>
                    <option value={CategorieMateriels.ANTI_INFLAMMATOIRE}>Anti-inflammatoire</option>
                    <option value={CategorieMateriels.ANTALGIQUE}>Antalgique</option>
                    <option value={CategorieMateriels.ANTIPYRETIQUE}>Antipyrétique</option>
                    <option value={CategorieMateriels.ANTIVIRAL}>Antiviral</option>
                    <option value={CategorieMateriels.VITAMINE}>Vitamine</option>
                    <option value={CategorieMateriels.VACCIN}>Vaccin</option>
                    <option value={CategorieMateriels.AUTRE}>Autre</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Quantité *</label>
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
                    onChange={(e) => setFormData({...formData, uniteDosage: e.target.value as Unite})}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value={Unite.MG}>mg</option>
                    <option value={Unite.G}>g</option>
                    <option value={Unite.ML}>ml</option>
                    <option value={Unite.L}>L</option>
                    <option value={Unite.UI}>UI</option>
                    <option value={Unite.TABLETTE}>Tablette</option>
                    <option value={Unite.AUTRE}>Autre</option>
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
                    <option value="false">En lot</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Taille lot *</label>
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
                  {editingMateriel ? 'Modifier' : 'Ajouter'}
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
              <h2 className="text-xl font-bold">Importer des matériels</h2>
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

export default Materiels;
