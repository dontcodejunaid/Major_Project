import React, { useEffect, useState } from 'react';
import { api } from '../utils/api';
import { 
  ShieldCheck, Search, Filter, RefreshCw, FileSpreadsheet, 
  Calendar, Check, User, Clock, AlertCircle
} from 'lucide-react';

const Reports = ({ user }) => {
  const [logs, setLogs] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Search and filter states
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  const fetchAuditLogs = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.get('/reports/audit-logs');
      setLogs(data);
      
      const paymentsData = await api.get('/payments');
      setPayments(paymentsData);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch system audit logs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
  }, []);

  // Filter logs locally
  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.details.toLowerCase().includes(search.toLowerCase()) ||
      log.performedBy.toLowerCase().includes(search.toLowerCase());
      
    const matchesAction = actionFilter ? log.action === actionFilter : true;
    const matchesDate = dateFilter ? log.timestamp.startsWith(dateFilter) : true;
    
    return matchesSearch && matchesAction && matchesDate;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white glow-text">System Audit Trail</h2>
          <p className="text-gray-400 text-xs mt-1">Review system activity, transaction triggers, and staff modifications logs.</p>
        </div>
        <div className="flex items-center gap-2">
          {dateFilter && (
            <button
              onClick={() => setDateFilter('')}
              className="px-3 py-2 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-xl text-xs font-bold transition"
            >
              Reset Date Filter
            </button>
          )}
          <button
            onClick={fetchAuditLogs}
            className="px-3.5 py-2 bg-white/5 hover:bg-white/10 text-white border border-white/5 hover:border-white/10 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh Logs
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-300 px-4 py-3.5 rounded-xl text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4" /> {error}
        </div>
      )}

      {/* Local Filter Panel */}
      <div className="glass-panel rounded-2xl p-5 grid grid-cols-1 md:grid-cols-4 gap-3.5">
        <div className="relative md:col-span-2">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search by details message or performer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl glass-input text-xs"
          />
        </div>
        <div>
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs cursor-pointer"
          >
            <option value="">All Action Types</option>
            <option value="COLLECT_FEE">COLLECT_FEE</option>
            <option value="CREATE_STUDENT">CREATE_STUDENT</option>
            <option value="UPDATE_STUDENT">UPDATE_STUDENT</option>
            <option value="DELETE_STUDENT">DELETE_STUDENT</option>
            <option value="CREATE_FEE_STRUCTURE">CREATE_FEE_STRUCTURE</option>
            <option value="UPDATE_FEE_STRUCTURE">UPDATE_FEE_STRUCTURE</option>
            <option value="CREATE_DEADLINE">CREATE_DEADLINE</option>
            <option value="UPDATE_DEADLINE">UPDATE_DEADLINE</option>
            <option value="SYSTEM_STARTUP">SYSTEM_STARTUP</option>
          </select>
        </div>
        <div>
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            onClick={(e) => e.target.showPicker && e.target.showPicker()}
            className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs cursor-pointer"
            title="Filter by action date"
          />
        </div>
      </div>

      {/* Audit ledger and Daily Tally Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Operations Ledger Table (Takes 3 columns on desktop) */}
        <div className="glass-panel rounded-2xl p-5 lg:col-span-3">
          <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Operations Ledger</h4>
          
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <RefreshCw className="w-8 h-8 text-violet-500 animate-spin" />
              <p className="text-gray-400 text-xs font-semibold">Syncing audit logs registry...</p>
            </div>
          ) : filteredLogs.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-white/[0.05] text-gray-400">
                    <th className="pb-3 font-semibold uppercase tracking-wider w-36">Timestamp</th>
                    <th className="pb-3 font-semibold uppercase tracking-wider w-40">Action</th>
                    <th className="pb-3 font-semibold uppercase tracking-wider">Details description</th>
                    <th className="pb-3 font-semibold uppercase tracking-wider w-44">Performed By</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.map((log) => {
                    let badgeColor = 'bg-white/5 text-gray-300 border-white/10';
                    
                    if (log.action.includes('CREATE')) badgeColor = 'bg-green-500/10 text-green-400 border-green-500/20';
                    if (log.action.includes('UPDATE')) badgeColor = 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
                    if (log.action.includes('DELETE')) badgeColor = 'bg-red-500/10 text-red-400 border-red-500/20';
                    if (log.action.includes('COLLECT')) badgeColor = 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20';
                    
                    return (
                      <tr key={log._id} className="border-b border-white/[0.03] hover:bg-white/[0.02] text-gray-300 font-medium">
                        <td className="py-3.5 text-gray-400 font-mono flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-gray-500" />
                          {new Date(log.timestamp).toLocaleString('en-IN', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </td>
                        <td className="py-3.5">
                          <span className={`px-2.5 py-0.5 rounded text-[9px] font-bold border uppercase tracking-wider ${badgeColor}`}>
                            {log.action}
                          </span>
                        </td>
                        <td className="py-3.5 text-white">{log.details}</td>
                        <td className="py-3.5 font-bold flex items-center gap-1.5 text-gray-300">
                          <User className="w-3.5 h-3.5 text-violet-400" />
                          {log.performedBy}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500 font-bold">
              No audit records found matching your filters.
            </div>
          )}
        </div>

        {/* Daily Tally Ledger Sidebar (Takes 1 column) */}
        <div className="glass-panel rounded-2xl p-5">
          <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-violet-400" />
            Daily Collections Tally
          </h4>
          <div className="space-y-2 max-h-[350px] overflow-y-auto no-scrollbar">
            {(() => {
              const tally = {};
              payments.forEach(p => {
                if (!p.date) return;
                const d = p.date.split('T')[0];
                tally[d] = (tally[d] || 0) + Number(p.amount);
              });
              const dailyTally = Object.keys(tally)
                .map(date => ({ date, amount: tally[date] }))
                .sort((a, b) => new Date(b.date) - new Date(a.date));

              return dailyTally.map((item, idx) => {
                const isActive = dateFilter === item.date;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setDateFilter(isActive ? '' : item.date)}
                    className={`w-full p-3 rounded-xl border text-left text-xs transition flex justify-between items-center ${
                      isActive 
                        ? 'bg-violet-600/10 border-violet-500/40 text-white' 
                        : 'bg-white/[0.01] hover:bg-white/[0.03] border-white/5 text-gray-300 hover:border-white/10'
                    }`}
                  >
                    <div>
                      <span className="font-bold text-white">{new Date(item.date).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      })}</span>
                      <p className="text-[9px] text-gray-500 mt-0.5 font-medium">Click to filter audits</p>
                    </div>
                    <span className="font-bold text-violet-400 font-mono text-xs">₹{item.amount.toLocaleString('en-IN')}</span>
                  </button>
                );
              });
            })()}
          </div>
        </div>
      </div>

    </div>
  );
};

export default Reports;
