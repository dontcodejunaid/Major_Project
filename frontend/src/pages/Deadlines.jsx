import React, { useEffect, useState } from 'react';
import { api } from '../utils/api';
import { 
  Calendar, Clock, IndianRupee, Save, Check, X, RefreshCw, AlertCircle
} from 'lucide-react';
import CustomDatePicker from '../components/CustomDatePicker';

const Deadlines = ({ user }) => {
  const [deadlines, setDeadlines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form states
  const [academicYear, setAcademicYear] = useState('2025-26');
  const [dueDate, setDueDate] = useState('');
  const [finePerDay, setFinePerDay] = useState('50');

  const fetchDeadlines = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.get('/deadlines');
      setDeadlines(data);
      if (data.length > 0) {
        // Pre-fill fields with first deadline
        setAcademicYear(data[0].academicYear);
        setDueDate(data[0].dueDate);
        setFinePerDay(data[0].finePerDay.toString());
      }
    } catch (err) {
      console.error(err);
      setError('Failed to fetch deadlines configuration.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeadlines();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!academicYear || !dueDate || finePerDay === '') {
      setError('All fields are required.');
      return;
    }

    try {
      await api.post('/deadlines', {
        academicYear,
        dueDate,
        finePerDay: Number(finePerDay)
      });

      setSuccess(`Deadline rules for ${academicYear} saved successfully.`);
      fetchDeadlines();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to save academic deadline.');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Title */}
      <div>
        <h2 className="text-2xl font-black text-white glow-text">Academic Deadlines & Late Fines</h2>
        <p className="text-gray-400 text-xs mt-1">Configure payment deadlines and daily overdue late fee rates per academic batch year.</p>
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

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <RefreshCw className="w-8 h-8 text-violet-500 animate-spin" />
          <p className="text-gray-400 text-xs font-medium">Syncing deadline schedules...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Rules Editor Form */}
          <div className="lg:col-span-2 space-y-4">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Configure Overdue Rules</h3>
            
            <form onSubmit={handleSubmit} className="glass-panel rounded-2xl p-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                    Academic Year Batch
                  </label>
                  <select
                    value={academicYear}
                    onChange={(e) => setAcademicYear(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs cursor-pointer"
                  >
                    <option value="2025-26">2025-26</option>
                    <option value="2024-25">2024-25</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                    Payment Due Date
                  </label>
                  <CustomDatePicker
                    value={dueDate}
                    onChange={setDueDate}
                    placeholder="Select due date..."
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                    Late Fine / Day (₹)
                  </label>
                  <div className="relative">
                    <IndianRupee className="absolute left-3.5 top-3 w-4 h-4 text-gray-500" />
                    <input
                      type="number"
                      required
                      value={finePerDay}
                      onChange={(e) => setFinePerDay(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 rounded-xl glass-input text-xs font-mono"
                      placeholder="e.g. 50"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-gray-800 flex justify-end">
                <button
                  type="submit"
                  className="px-4 py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-bold transition glow-btn flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" /> Save Overdue Policy
                </button>
              </div>
            </form>
          </div>

          {/* Active deadlines overview panel */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Active Schedules</h3>
            
            <div className="space-y-3">
              {deadlines.map((dl) => {
                const isPassed = new Date() > new Date(dl.dueDate);
                return (
                  <div key={dl._id} className="glass-panel rounded-2xl p-4 flex flex-col gap-2 relative overflow-hidden">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-white uppercase tracking-wide">Batch {dl.academicYear}</span>
                      <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider border ${
                        isPassed 
                          ? 'bg-red-500/10 text-red-400 border-red-500/20' 
                          : 'bg-green-500/10 text-green-400 border-green-500/20'
                      }`}>
                        {isPassed ? 'Passed' : 'Active'}
                      </span>
                    </div>

                    <div className="space-y-1 text-xs">
                      <p className="text-gray-400">
                        <strong>Due Date:</strong> <span className="text-white font-mono">{dl.dueDate}</span>
                      </p>
                      <p className="text-gray-400">
                        <strong>Daily Fine Rate:</strong> <span className="text-yellow-400 font-bold font-mono">₹{dl.finePerDay}/day</span>
                      </p>
                    </div>

                    {isPassed && (
                      <div className="mt-2 text-[10px] text-red-300 bg-red-500/5 p-2 rounded-lg border border-red-500/10 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                        Fine accumulation active on remaining balances.
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Deadlines;
