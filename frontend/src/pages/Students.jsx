import React, { useEffect, useState } from 'react';
import { api } from '../utils/api';
import { 
  UserPlus, Search, Edit2, Trash2, ArrowLeft, RefreshCw,
  Plus, Check, X, GraduationCap, Mail, Tag, BookOpen, Layers
} from 'lucide-react';
import ReceiptView from '../components/ReceiptView';

const Students = ({ user }) => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Active receipt preview
  const [activeReceipt, setActiveReceipt] = useState(null);
  const [receiptType, setReceiptType] = useState('student');

  // Search/Filter states
  const [search, setSearch] = useState('');
  const [branchFilter, setBranchFilter] = useState('');
  const [semesterFilter, setSemesterFilter] = useState('');
  const [quotaFilter, setQuotaFilter] = useState('');

  // Form states (Modal)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentStudentId, setCurrentStudentId] = useState('');
  
  const [formName, setFormName] = useState('');
  const [formUsn, setFormUsn] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formBranch, setFormBranch] = useState('');
  const [formSemester, setFormSemester] = useState('');
  const [formQuota, setFormQuota] = useState('');
  const [formBatch, setFormBatch] = useState('2025-26');

  const fetchStudents = async () => {
    setLoading(true);
    setError('');
    try {
      const queryParams = new URLSearchParams();
      if (search) queryParams.append('search', search);
      if (branchFilter) queryParams.append('branch', branchFilter);
      if (semesterFilter) queryParams.append('semester', semesterFilter);
      if (quotaFilter) queryParams.append('quota', quotaFilter);

      const data = await api.get(`/students?${queryParams.toString()}`);
      setStudents(data);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch students database.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [search, branchFilter, semesterFilter, quotaFilter]);

  const handleOpenCreateModal = () => {
    setIsEditMode(false);
    setFormName('');
    setFormUsn('');
    setFormEmail('');
    setFormBranch('Computer Science');
    setFormSemester('1st');
    setFormQuota('KCET');
    setFormBatch('2025-26');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (student) => {
    setIsEditMode(true);
    setCurrentStudentId(student._id);
    setFormName(student.name);
    setFormUsn(student.usn);
    setFormEmail(''); // Reset email, we don't change email during edit for mock db safety
    setFormBranch(student.branch);
    setFormSemester(student.semester);
    setFormQuota(student.quota);
    setFormBatch(student.batch);
    setIsModalOpen(true);
  };

  const handleDeleteStudent = async (id, name, usn) => {
    if (!window.confirm(`Are you absolutely sure you want to delete ${name} (${usn})? This action will permanently remove their fee statements and login credentials.`)) {
      return;
    }

    try {
      await api.delete(`/students/${id}`);
      setSuccess(`Student ${name} deleted successfully.`);
      fetchStudents();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to delete student.');
      setTimeout(() => setError(''), 4000);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const payload = {
      name: formName,
      branch: formBranch,
      semester: formSemester,
      quota: formQuota,
      batch: formBatch
    };

    try {
      if (isEditMode) {
        await api.put(`/students/${currentStudentId}`, payload);
        setSuccess('Student profile updated successfully.');
      } else {
        // Create student requires USN and Email
        await api.post('/students', {
          ...payload,
          usn: formUsn,
          email: formEmail
        });
        setSuccess(`Student ${formName} registered successfully! Login password set to their lowercase USN.`);
      }
      
      setIsModalOpen(false);
      fetchStudents();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Operation failed. Check input constraints.');
    }
  };

  const isAdmin = user.role === 'Admin';

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Title block */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white glow-text">Student Directory Registry</h2>
          <p className="text-gray-400 text-xs mt-1">
            {isAdmin ? 'Perform student registrations, modify metadata, or delete profiles.' : 'View current student profiles and admission details.'}
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={handleOpenCreateModal}
            className="px-4 py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-bold transition glow-btn flex items-center gap-2"
          >
            <UserPlus className="w-4 h-4" /> Add Student Account
          </button>
        )}
      </div>

      {/* Alert banners */}
      {success && (
        <div className="bg-green-500/10 border border-green-500/20 text-green-300 px-4 py-3.5 rounded-xl text-xs font-semibold flex items-center gap-2 animate-pulse">
          <Check className="w-4 h-4" /> {success}
        </div>
      )}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-300 px-4 py-3.5 rounded-xl text-xs font-semibold flex items-center gap-2">
          <X className="w-4 h-4" /> {error}
        </div>
      )}

      {/* Advanced Filters */}
      <div className="glass-panel rounded-2xl p-5 grid grid-cols-1 md:grid-cols-5 gap-3.5">
        <div className="md:col-span-2 relative">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search by student Name or USN..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl glass-input text-xs"
          />
        </div>
        <div>
          <select
            value={branchFilter}
            onChange={(e) => setBranchFilter(e.target.value)}
            className="w-full px-3 py-2 rounded-xl glass-input text-xs cursor-pointer"
          >
            <option value="">All Branches</option>
            <option value="Computer Science">Computer Science</option>
            <option value="Information Science">Information Science</option>
            <option value="Electronics & Communication">Electronics & Communication</option>
            <option value="Mechanical Engineering">Mechanical Engineering</option>
          </select>
        </div>
        <div>
          <select
            value={semesterFilter}
            onChange={(e) => setSemesterFilter(e.target.value)}
            className="w-full px-3 py-2 rounded-xl glass-input text-xs cursor-pointer"
          >
            <option value="">All Semesters</option>
            <option value="1st">1st Sem</option>
            <option value="3rd">3rd Sem</option>
            <option value="5th">5th Sem</option>
            <option value="7th">7th Sem</option>
          </select>
        </div>
        <div>
          <select
            value={quotaFilter}
            onChange={(e) => setQuotaFilter(e.target.value)}
            className="w-full px-3 py-2 rounded-xl glass-input text-xs cursor-pointer"
          >
            <option value="">All Quotas</option>
            <option value="KCET">KCET</option>
            <option value="Management">Management</option>
            <option value="SNQ">SNQ</option>
          </select>
        </div>
      </div>

      {/* Student List Table */}
      <div className="glass-panel rounded-2xl p-5">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-4">
            <RefreshCw className="w-7 h-7 text-violet-500 animate-spin" />
            <p className="text-gray-400 text-xs font-semibold">Syncing student database records...</p>
          </div>
        ) : students.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-white/[0.05] text-gray-400">
                  <th className="pb-3 font-semibold uppercase tracking-wider">USN</th>
                  <th className="pb-3 font-semibold uppercase tracking-wider">Name</th>
                  <th className="pb-3 font-semibold uppercase tracking-wider">Branch</th>
                  <th className="pb-3 font-semibold uppercase tracking-wider">Semester</th>
                  <th className="pb-3 font-semibold uppercase tracking-wider">Quota</th>
                  <th className="pb-3 font-semibold uppercase tracking-wider">Batch</th>
                  <th className="pb-3 text-center font-semibold uppercase tracking-wider">Bills Options</th>
                  {isAdmin && <th className="pb-3 text-center font-semibold uppercase tracking-wider">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {students.map((student) => (
                  <tr key={student._id} className="border-b border-white/[0.03] hover:bg-white/[0.02] text-gray-300 font-medium">
                    <td className="py-3.5 uppercase font-mono font-bold text-white">{student.usn}</td>
                    <td className="py-3.5 text-white font-bold">{student.name}</td>
                    <td className="py-3.5">{student.branch}</td>
                    <td className="py-3.5">{student.semester} Sem</td>
                    <td className="py-3.5">
                      <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-white/5 text-gray-300 border border-white/10">
                        {student.quota}
                      </span>
                    </td>
                    <td className="py-3.5 font-mono text-gray-400">{student.batch}</td>
                    <td className="py-3.5 text-center">
                      {student.fees && student.fees.amountPaid > 0 ? (
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setReceiptType('staff');
                              Promise.all([
                                api.get(`/payments/student/${student._id}`),
                                api.get(`/students/${student._id}`)
                              ]).then(([payList, studData]) => {
                                if (payList && payList.length > 0) {
                                  setActiveReceipt({
                                    payment: payList[0],
                                    student: studData.student,
                                    fees: studData.fees
                                  });
                                }
                              });
                            }}
                            className="px-2 py-1 bg-violet-600/10 hover:bg-violet-600/20 text-violet-400 hover:text-violet-300 border border-violet-500/10 rounded-lg font-bold transition text-[10px] cursor-pointer"
                          >
                            Detailed
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setReceiptType('student');
                              Promise.all([
                                api.get(`/payments/student/${student._id}`),
                                api.get(`/students/${student._id}`)
                              ]).then(([payList, studData]) => {
                                if (payList && payList.length > 0) {
                                  setActiveReceipt({
                                    payment: payList[0],
                                    student: studData.student,
                                    fees: studData.fees
                                  });
                                }
                              });
                            }}
                            className="px-2 py-1 bg-cyan-600/10 hover:bg-cyan-600/20 text-cyan-400 hover:text-cyan-300 border border-cyan-500/10 rounded-lg font-bold transition text-[10px] cursor-pointer"
                          >
                            Simple
                          </button>
                        </div>
                      ) : (
                        <span className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider italic">No payments</span>
                      )}
                    </td>
                    {isAdmin && (
                      <td className="py-3.5 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleOpenEditModal(student)}
                            className="p-1.5 bg-violet-500/10 hover:bg-violet-500/20 text-violet-400 hover:text-violet-300 border border-violet-500/10 hover:border-violet-500/20 rounded-lg transition cursor-pointer"
                            title="Edit Student Profile"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteStudent(student._id, student.name, student.usn)}
                            className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 border border-red-500/10 hover:border-red-500/20 rounded-lg transition cursor-pointer"
                            title="Delete Student"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500 font-bold">
            No students found matching your filters.
          </div>
        )}
      </div>

      {/* CRUD Modal for Add/Edit student */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-[#141419] border border-gray-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl animate-fade-in">
            <div className="flex justify-between items-center pb-4 border-b border-gray-800 mb-5">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <GraduationCap className="text-violet-400 w-5 h-5" />
                {isEditMode ? 'Modify Student Credentials' : 'Register New Student Profile'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-white transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                    Student Full Name
                  </label>
                  <div className="relative">
                    <Plus className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
                    <input
                      type="text"
                      required
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 rounded-xl glass-input text-xs"
                      placeholder="e.g. John Doe"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                    University USN
                  </label>
                  <div className="relative">
                    <BookOpen className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
                    <input
                      type="text"
                      required
                      disabled={isEditMode}
                      value={formUsn}
                      onChange={(e) => setFormUsn(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 rounded-xl glass-input text-xs uppercase font-mono disabled:opacity-50"
                      placeholder="e.g. 1GC22CS001"
                    />
                  </div>
                </div>
              </div>

              {!isEditMode && (
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
                      placeholder="john@student.edu"
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                    Academic Branch
                  </label>
                  <div className="relative">
                    <Layers className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
                    <select
                      value={formBranch}
                      onChange={(e) => setFormBranch(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 rounded-xl glass-input text-xs cursor-pointer appearance-none"
                    >
                      <option value="Computer Science">Computer Science</option>
                      <option value="Information Science">Information Science</option>
                      <option value="Electronics & Communication">Electronics & Communication</option>
                      <option value="Mechanical Engineering">Mechanical Engineering</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                    Current Semester
                  </label>
                  <div className="relative">
                    <Layers className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
                    <select
                      value={formSemester}
                      onChange={(e) => setFormSemester(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 rounded-xl glass-input text-xs cursor-pointer appearance-none"
                    >
                      <option value="1st">1st Semester</option>
                      <option value="2nd">2nd Semester</option>
                      <option value="3rd">3rd Semester</option>
                      <option value="4th">4th Semester</option>
                      <option value="5th">5th Semester</option>
                      <option value="6th">6th Semester</option>
                      <option value="7th">7th Semester</option>
                      <option value="8th">8th Semester</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                    Admission Quota Category
                  </label>
                  <div className="relative">
                    <Tag className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
                    <select
                      value={formQuota}
                      onChange={(e) => setFormQuota(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 rounded-xl glass-input text-xs cursor-pointer appearance-none"
                    >
                      <option value="KCET">KCET (Merit)</option>
                      <option value="Management">Management</option>
                      <option value="SNQ">SNQ (NRI)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                    Academic Year Batch
                  </label>
                  <div className="relative">
                    <Tag className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
                    <select
                      value={formBatch}
                      onChange={(e) => setFormBatch(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 rounded-xl glass-input text-xs cursor-pointer appearance-none"
                    >
                      <option value="2025-26">2025-26</option>
                      <option value="2024-25">2024-25</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-800 flex justify-end gap-2 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-gray-800 text-gray-400 hover:text-white rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl transition glow-btn"
                >
                  {isEditMode ? 'Update Profile' : 'Register Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Active receipt renderer */}
      {activeReceipt && (
        <ReceiptView
          payment={activeReceipt.payment}
          student={activeReceipt.student}
          fees={activeReceipt.fees}
          type={receiptType}
          onClose={() => setActiveReceipt(null)}
        />
      )}
    </div>
  );
};

export default Students;
