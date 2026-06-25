import { User, Mail, Phone, Briefcase, Shield, Info, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserRole, getRoleBadgeColors } from '../types/roles';

const roleLabel: Record<string, string> = {
  [UserRole.ADMIN]:       'Administrateur',
  [UserRole.SUPER_ADMIN]: 'Super Administrateur',
  [UserRole.MEDECIN]:     'Médecin',
  [UserRole.INFIRMIER]:   'Infirmier(e)',
  [UserRole.STUDENT]:     'Étudiant(e)',
  [UserRole.DSA]:         'Dean of Student Affairs',
};

const Field = ({ label, value }: { label: string; value?: string }) => (
  <div>
    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">{label}</p>
    <p className="text-sm text-gray-900 font-medium">{value || <span className="text-gray-400 font-normal">—</span>}</p>
  </div>
);

const Profile = () => {
  const { user, effectiveRole } = useAuth();
  const navigate = useNavigate();

  if (!user) {
    return (
      <div className="flex items-center justify-center py-16 text-gray-500 text-sm">
        Veuillez vous connecter pour accéder à votre profil.
      </div>
    );
  }

  const isAdminRole = effectiveRole === UserRole.ADMIN || user.role === UserRole.SUPER_ADMIN;

  return (
    <div className="max-w-3xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Mon profil</h1>
        <p className="text-sm text-gray-500 mt-0.5">Informations du compte AUI Health Center</p>
      </div>

      {/* SSO notice */}
      <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3.5">
        <Info className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-blue-800">
          <p className="font-medium">Profil géré via Azure AD / Outlook AUI</p>
          <p className="text-blue-700 mt-0.5">
            Ces informations proviennent de votre compte institutionnel. Pour les modifier, contactez le service IT AUI.
            {isAdminRole && (
              <> Pour gérer le personnel du Health Center, utilisez la page <button onClick={() => navigate('/personnel')} className="underline font-medium hover:text-blue-900">Personnel</button>.</>
            )}
          </p>
        </div>
      </div>

      {/* Profile card */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Top strip */}
        <div className="h-20 bg-gradient-to-r from-teal-600 to-teal-700" />

        {/* Avatar + name */}
        <div className="px-6 pb-6">
          <div className="-mt-10 mb-4 flex items-end gap-4">
            <div className="w-20 h-20 rounded-full bg-white border-4 border-white shadow-md flex items-center justify-center flex-shrink-0">
              <User className="w-9 h-9 text-teal-600" />
            </div>
            <div className="mb-1">
              <h2 className="text-xl font-bold text-gray-900">
                {user.prenom} {user.nom}
              </h2>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${getRoleBadgeColors(user.role)}`}>
                {roleLabel[user.role] || user.role}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2 border-t border-gray-100">
            <Field label="Prénom" value={user.prenom} />
            <Field label="Nom" value={user.nom} />

            <div className="flex items-start gap-2.5 sm:col-span-2">
              <Mail className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-0.5">Email</p>
                <p className="text-sm text-gray-900 font-medium">{user.email}</p>
              </div>
            </div>

            {user.telephone && (
              <div className="flex items-start gap-2.5">
                <Phone className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-0.5">Téléphone</p>
                  <p className="text-sm text-gray-900 font-medium">{user.telephone}</p>
                </div>
              </div>
            )}

            {user.specialite && (
              <div className="flex items-start gap-2.5">
                <Briefcase className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-0.5">Spécialité</p>
                  <p className="text-sm text-gray-900 font-medium">{user.specialite}</p>
                </div>
              </div>
            )}

            <div className="flex items-start gap-2.5">
              <Shield className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-0.5">Rôle système</p>
                <p className="text-sm text-gray-900 font-medium">{roleLabel[user.role] || user.role}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Admin shortcut */}
      {isAdminRole && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-800 mb-3">Administration</h3>
          <p className="text-sm text-gray-500 mb-4">
            En tant qu'administrateur, vous pouvez gérer les comptes du personnel via la page dédiée.
          </p>
          <button
            onClick={() => navigate('/personnel')}
            className="inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            <ExternalLink className="w-4 h-4" /> Gérer le personnel
          </button>
        </div>
      )}
    </div>
  );
};

export default Profile;
