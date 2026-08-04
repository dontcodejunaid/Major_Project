import React, { useEffect, useState } from 'react';
import { api } from '../utils/api';
import { 
  UserPlus, Shield, UserCheck, Trash2, Mail, Lock, 
  Check, X, AlertTriangle, RefreshCw
} from 'lucide-react';

const Users = ({ user, navigateTo }) => {
  const [usersList, setUsersList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formRole, setFormRole] = useState('Staff');
  const [formPassword, setFormPassword] = useState('');

  const fetchUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.get('/auth');
      setUsersList(data);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch system user database logs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleOpenModal = () => {
    setFormName('');
    setFormEmail('');
    setFormRole('Staff');
    setFormPassword('');
    setIsModalOpen(true);
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formName || !formEmail || !formRole || !formPassword) {
      setError('All fields are required.');
      return;
    }

    try {
      await api.post('/auth/register', {
        name: formName,
        email: formEmail,
        role: formRole,
        password: formPassword
      });

      setSuccess(`Account for ${formName} (${formRole}) successfully created!`);
      setIsModalOpen(false);
      fetchUsers();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to create user account. Email might already be taken.');
    }
  };

  const handleDeleteUser = async (id, name, role) => {
    const selfId = user.id || user._id;
    if (selfId === id) {
      setError('Access denied. You cannot delete your own logged-in admin account.');
      setTimeout(() => setError(''), 4000);
      return;
    }

    if (!window.confirm(`Are you sure you want to permanently delete the login credentials for ${name} (${role})?`)) {
      return;
    }

    try {
      await api.delete(`/auth/${id}`);
      setSuccess(`User account ${name} deleted successfully.`);
      fetchUsers();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to delete user account.');
      setTimeout(() => setError(''), 4000);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Title Block */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white glow-text">Credentials & Access Directory</h2>
          <p className="text-gray-400 text-xs mt-1">Manage system administrators (co-admins) and accounts office staff accounts.</p>
        </div>
        <button
          onClick={handleOpenModal}
          className="px-4 py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-bold transition glow-btn flex items-center gap-2 cursor-pointer animate-fade-in"
        >
          <UserPlus className="w-4 h-4" /> Add Office User Account
        </button>
      </div>

      {/* Warning and alert banners */}
      <div className="bg-yellow-500/10 border border-yellow-500/20 text-yellow-300 px-4 py-3.5 rounded-xl text-xs font-semibold flex items-center gap-2">
        <AlertTriangle className="w-4 h-4 text-yellow-400 flex-shrink-0" />
        <div>
          <p className="m-0">
            <strong>Registering Students Note:</strong> Student accounts must be registered via the <button type="button" onClick={() => navigateTo('students')} className="text-violet-400 underline font-bold cursor-pointer hover:text-violet-300 bg-transparent border-0 p-0">Student Directory</button>. This ensures their university data, quota configurations, and payment profiles are created in sync.
          </p>
        </div>
      </div>

      {success && (
        <div className="bg-green-500/10 border border-green-500/20 text-green-300 px-4 py-3.5 rounded-xl text-xs font-semibold flex items-center gap-2">
          <Check className="w-4 h-4" /> {success}
        </div>
      )}

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-300 px-4 py-3.5 rounded-xl text-xs font-semibold flex items-center gap-2">
          <X className="w-4 h-4" /> {error}
        </div>
      )}

      {/* User listing table */}
      <div className="glass-panel rounded-2xl p-5">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-4">
            <RefreshCw className="w-7 h-7 text-violet-500 animate-spin" />
            <p className="text-gray-400 text-xs font-semibold">Syncing system authorization files...</p>
          </div>
        ) : usersList.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-white/[0.05] text-gray-400">
                  <th className="pb-3 font-semibold uppercase tracking-wider">Account Holder Name</th>
                  <th className="pb-3 font-semibold uppercase tracking-wider">Email Address</th>
                  <th className="pb-3 font-semibold uppercase tracking-wider">Security Access Level</th>
                  <th className="pb-3 text-center font-semibold uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {usersList.map((userObj) => {
                  const selfId = user.id || user._id;
                  const isSelf = selfId === userObj._id;
                  let badgeColor = 'bg-gray-500/10 text-gray-400 border border-gray-500/20';
                  
                  if (userObj.role === 'Admin') {
                    badgeColor = 'bg-red-500/10 text-red-400 border border-red-500/20';
                  } else if (userObj.role === 'Staff') {
                    badgeColor = 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20';
                  } else if (userObj.role === 'Student') {
                    badgeColor = 'bg-violet-500/10 text-violet-400 border border-violet-500/20';
                  }

                  return (
                    <tr key={userObj._id} className="border-b border-white/[0.03] hover:bg-white/[0.02] text-gray-300 font-medium">
                      <td className="py-3.5 text-white font-bold flex items-center gap-2">
                        {userObj.role === 'Admin' ? <Shield className="w-3.5 h-3.5 text-red-400" /> : <UserCheck className="w-3.5 h-3.5 text-cyan-400" />}
                        {userObj.name}
                        {isSelf && <span className="text-[9px] uppercase font-bold bg-white/5 border border-white/10 text-gray-400 px-1.5 py-0.5 rounded">You</span>}
                      </td>
                      <td className="py-3.5 text-gray-400">{userObj.email}</td>
                      <td className="py-3.5">
                        <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold ${badgeColor}`}>
                          {userObj.role === 'Admin' ? 'Administrator' : userObj.role === 'Staff' ? 'Accounts Staff' : 'Student Login'}
                        </span>
                      </td>
                      <td className="py-3.5 text-center">
                        {!isSelf && userObj.role !== 'Student' && (
                          <button
                            onClick={() => handleDeleteUser(userObj._id, userObj.name, userObj.role)}
                            className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 border border-red-500/10 hover:border-red-500/20 rounded-lg transition cursor-pointer"
                            title="Delete User Credentials"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {userObj.role === 'Student' && (
                          <span className="text-[10px] text-gray-500 font-medium italic">Manage in Student Directory</span>
                        )}
                        {isSelf && (
                          <span className="text-[10px] text-gray-500 font-medium italic">Locked</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500 font-bold">
            No system credentials found.
          </div>
        )}
      </div>

      {/* Register user account modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-[#141419] border border-gray-800 rounded-2xl w-full max-w-md p-6 shadow-2xl animate-fade-in">
            <div className="flex justify-between items-center pb-4 border-b border-gray-800 mb-5">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <UserPlus className="text-violet-400 w-5 h-5" />
                Add System User Account
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                  User Full Name
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl glass-input text-xs"
                  placeholder="e.g. John Doe"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
                  <input
                    type="email"
                    required
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-xl glass-input text-xs"
                    placeholder="e.g. johndoe@college.edu"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                  Security Access Role
                </label>
                <select
                  value={formRole}
                  onChange={(e) => setFormRole(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl glass-input text-xs cursor-pointer appearance-none"
                >
                  <option value="Staff">Accounts Office Staff</option>
                  <option value="Admin">Administrator (Co-Admin)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                  Default Login Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
                  <input
                    type="password"
                    required
                    value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-xl glass-input text-xs"
                    placeholder="Enter account password"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-gray-800 flex justify-end gap-2 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-gray-800 text-gray-400 hover:text-white rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl transition glow-btn cursor-pointer"
                >
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;
