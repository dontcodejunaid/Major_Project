import React, { useEffect, useState } from 'react';
import { api } from '../utils/api';
import { 
  ShieldCheck, Search, Filter, RefreshCw, FileSpreadsheet, 
  Calendar, Check, User, Clock, AlertCircle, Download, Table,
  Layers, ExternalLink, IndianRupee
} from 'lucide-react';
import CustomDatePicker from '../components/CustomDatePicker';
import * as XLSX from 'xlsx';
import { MISC_FEE_HEADS, UNIV_FEE_HEADS } from './Fees';

const Reports = ({ user }) => {
  const [logs, setLogs] = useState([]);
  const [payments, setPayments] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [syncingExcel, setSyncingExcel] = useState(false);
  
  // Tab switch: 'audit' | 'daybook'
  const [activeTab, setActiveTab] = useState('daybook');

  // Search and filter states
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  const fetchReportsData = async () => {
    setLoading(true);
    setError('');
    try {
      const [logsData, paymentsData, studentsData] = await Promise.all([
        api.get('/reports/audit-logs'),
        api.get('/payments'),
        api.get('/students')
      ]);
      setLogs(logsData);
      setPayments(paymentsData);
      setStudents(studentsData);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch system audit logs and report records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportsData();
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

  // Filter payments for Day Book
  const filteredPayments = payments.filter(p => {
    const student = students.find(s => s._id === p.studentId) || {};
    const matchesSearch = 
      (p.receiptNo && p.receiptNo.toLowerCase().includes(search.toLowerCase())) ||
      (student.name && student.name.toLowerCase().includes(search.toLowerCase())) ||
      (student.usn && student.usn.toLowerCase().includes(search.toLowerCase())) ||
      (p.referenceNo && p.referenceNo.toLowerCase().includes(search.toLowerCase()));

    const matchesDate = dateFilter ? (p.date && p.date.startsWith(dateFilter)) : true;
    return matchesSearch && matchesDate;
  });

  // Export Day Book to Excel using XLSX
  const handleExportDayBookExcel = () => {
    const studentMap = {};
    students.forEach(s => { studentMap[s._id] = s; });

    const rows = filteredPayments.map((p, idx) => {
      const student = studentMap[p.studentId] || {};
      const row = {
        'SL': idx + 1,
        'DATE': p.date ? p.date.split('T')[0] : '',
        'NAME OF THE STUDENTS': `${student.name || 'Unknown'} (${student.quota || ''} ${student.branch || ''})`,
        'REG NO': student.usn || 'N/A',
        'Sem': student.semester || 'N/A',
        'Receipt No': p.receiptNo || `REC-${idx + 1}`,
        'Total Amount': Number(p.amount) || 0,
        'Payment Mode': p.mode || 'Cash',
        'Ref / UTR No': p.referenceNo || 'N/A'
      };

      // 28 Misc Particulars
      MISC_FEE_HEADS.forEach(head => {
        row[head] = Number(p.breakdown?.[head] || 0);
      });

      // 14 University particulars
      UNIV_FEE_HEADS.forEach(head => {
        row[head] = Number(p.breakdown?.[head] || 0);
      });

      row['Collector Remarks'] = p.remarks || '';
      row['Collected By'] = p.collectedBy || 'Accounts Staff';

      return row;
    });

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, 'DAY BOOK 2026-27');

    XLSX.writeFile(wb, `DAY_BOOK_2026-27_${dateFilter || 'All_Dates'}.xlsx`);
    setSuccess('DAY BOOK Excel spreadsheet exported successfully.');
    setTimeout(() => setSuccess(''), 4000);
  };

  // Sync to backend DAY_BOOK_2026-27.xlsx file
  const handleSyncBackendExcel = async () => {
    setSyncingExcel(true);
    setError('');
    setSuccess('');
    try {
      const res = await api.post('/reports/daybook/sync');
      setSuccess(res.message || 'Connected DAY BOOK Excel file synced on server!');
      fetchReportsData();
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to sync Day Book Excel file on server.');
    } finally {
      setSyncingExcel(false);
    }
  };

  const dayBookTotalAmount = filteredPayments.reduce((sum, p) => sum + Number(p.amount || 0), 0);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white glow-text">Reports & Day Book Ledger</h2>
          <p className="text-gray-400 text-xs mt-1">
            Connected DAY BOOK Excel Sheet (2026-2027) with all 28 Misc Particulars & Daily System Audit Trail.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleSyncBackendExcel}
            disabled={syncingExcel}
            className="px-3.5 py-2 bg-violet-600/10 hover:bg-violet-600/20 text-violet-400 border border-violet-500/20 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            title="Sync all transactions to server DAY_BOOK_2026-27.xlsx file"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncingExcel ? 'animate-spin' : ''}`} />
            Sync Server Excel
          </button>
          <button
            onClick={handleExportDayBookExcel}
            className="px-3.5 py-2 bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-400 border border-emerald-500/20 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" /> Download DAY BOOK Excel
          </button>
          <button
            onClick={fetchReportsData}
            className="px-3.5 py-2 bg-white/5 hover:bg-white/10 text-white border border-white/5 hover:border-white/10 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
        </div>
      </div>

      {success && (
        <div className="bg-green-500/10 border border-green-500/20 text-green-300 px-4 py-3.5 rounded-xl text-xs font-semibold flex items-center gap-2">
          <Check className="w-4 h-4" /> {success}
        </div>
      )}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-300 px-4 py-3.5 rounded-xl text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4" /> {error}
        </div>
      )}

      {/* Tabs navigation */}
      <div className="flex items-center gap-2 border-b border-white/5 pb-2">
        <button
          onClick={() => setActiveTab('daybook')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
            activeTab === 'daybook'
              ? 'bg-violet-600 text-white shadow-lg shadow-violet-900/30'
              : 'text-gray-400 hover:text-white bg-white/5'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          DAY BOOK 2026-27 (Excel Connected)
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
            activeTab === 'audit'
              ? 'bg-violet-600 text-white shadow-lg shadow-violet-900/30'
              : 'text-gray-400 hover:text-white bg-white/5'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          System Audit Trail
        </button>
      </div>

      {/* Local Filter Panel */}
      <div className="glass-panel rounded-2xl p-5 grid grid-cols-1 md:grid-cols-4 gap-3.5">
        <div className="relative md:col-span-2">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder={activeTab === 'daybook' ? "Search student name, USN, Receipt No, TXN ref..." : "Search by details message or performer..."}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl glass-input text-xs"
          />
        </div>
        {activeTab === 'audit' && (
          <div>
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs cursor-pointer"
            >
              <option value="">All Action Types</option>
              <option value="COLLECT_FEE">COLLECT_FEE</option>
              <option value="EXCEL_SYNC">EXCEL_SYNC</option>
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
        )}
        <div className={activeTab === 'daybook' ? 'md:col-span-2 flex items-center gap-2' : 'flex items-center gap-2'}>
          <div className="flex-1">
            <CustomDatePicker
              value={dateFilter}
              onChange={setDateFilter}
              placeholder="Filter by Date (e.g. 2026-07-20)..."
            />
          </div>
          {dateFilter && (
            <button
              onClick={() => setDateFilter('')}
              className="px-3 py-2 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-xl text-xs font-bold transition"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {activeTab === 'daybook' ? (
        /* DAY BOOK Live Excel Ledger view */
        <div className="space-y-4">
          <div className="glass-panel rounded-2xl p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-white/5">
              <div>
                <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                  DAY BOOK 2026-27 Live Register
                </h4>
                <p className="text-xs text-gray-400 mt-0.5">
                  Synchronized with accounts Excel format with all 28 miscellaneous particulars columns.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="px-3.5 py-1.5 rounded-xl bg-violet-600/10 border border-violet-500/20 text-right">
                  <span className="text-[10px] text-gray-400 uppercase font-bold block">Tally Total</span>
                  <span className="text-sm font-bold text-violet-400 font-mono">₹{dayBookTotalAmount.toLocaleString('en-IN')}.00</span>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <RefreshCw className="w-8 h-8 text-violet-500 animate-spin" />
                <p className="text-gray-400 text-xs font-semibold">Syncing Day Book transactions...</p>
              </div>
            ) : filteredPayments.length > 0 ? (
              <div className="overflow-x-auto max-h-[500px] border border-white/5 rounded-xl">
                <table className="w-full text-left text-xs border-collapse font-sans min-w-[900px]">
                  <thead>
                    <tr className="border-b border-white/10 bg-white/[0.03] text-gray-300 uppercase text-[10px] tracking-wider sticky top-0 backdrop-blur-md">
                      <th className="p-3 w-10 text-center">SL</th>
                      <th className="p-3 w-28">DATE</th>
                      <th className="p-3">NAME OF THE STUDENTS</th>
                      <th className="p-3 w-28">REG NO</th>
                      <th className="p-3 w-16 text-center">Sem</th>
                      <th className="p-3 w-24">Receipt No</th>
                      <th className="p-3 w-24 text-right">Total (₹)</th>
                      <th className="p-3 w-20 text-center">Mode</th>
                      <th className="p-3 w-32">Ref No</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPayments.map((payment, idx) => {
                      const student = students.find(s => s._id === payment.studentId) || {};
                      const dateStr = payment.date ? payment.date.split('T')[0] : '';
                      return (
                        <tr key={payment._id} className="border-b border-white/[0.03] hover:bg-white/[0.02] text-gray-300 font-medium">
                          <td className="p-3 text-center text-gray-500 font-mono">{idx + 1}</td>
                          <td className="p-3 text-gray-400 font-mono">{dateStr}</td>
                          <td className="p-3 font-bold text-white">
                            {student.name || 'Unknown Student'}
                            <span className="text-[10px] text-gray-500 block font-normal">
                              ({student.quota || 'KCET'} {student.branch || ''})
                            </span>
                          </td>
                          <td className="p-3 font-mono uppercase text-violet-300 font-bold">{student.usn || 'N/A'}</td>
                          <td className="p-3 text-center">{student.semester || '5th'}</td>
                          <td className="p-3 font-mono font-bold text-cyan-400">{payment.receiptNo}</td>
                          <td className="p-3 text-right font-mono font-bold text-emerald-400">
                            ₹{(Number(payment.amount) || 0).toLocaleString('en-IN')}
                          </td>
                          <td className="p-3 text-center">
                            <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-white/5 border border-white/10 text-gray-300">
                              {payment.mode}
                            </span>
                          </td>
                          <td className="p-3 font-mono text-gray-400 text-[10px]">{payment.referenceNo}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500 font-bold">
                No payment transactions found matching your date or search filters.
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Audit ledger and Daily Tally Grid */
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
                      if (log.action.includes('EXCEL')) badgeColor = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
                      
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

          {/* Daily Tally Ledger Sidebar */}
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
                      className={`w-full p-3 rounded-xl border text-left text-xs transition flex justify-between items-center cursor-pointer ${
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
                        <p className="text-[9px] text-gray-500 mt-0.5 font-medium">Click to filter Day Book</p>
                      </div>
                      <span className="font-bold text-violet-400 font-mono text-xs">₹{item.amount.toLocaleString('en-IN')}</span>
                    </button>
                  );
                });
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;
