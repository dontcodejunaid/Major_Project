import React, { useEffect, useState } from 'react';
import { api } from '../utils/api';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie
} from 'recharts';
import { 
  TrendingUp, AlertTriangle, Users, Wallet, Search, ArrowUpRight, 
  Calendar, CheckCircle, Clock, Receipt, CreditCard, ChevronRight, RefreshCw
} from 'lucide-react';
import ReceiptView from '../components/ReceiptView';

const Dashboard = ({ user, navigateTo }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Staff student search states
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState('');
  const [branchFilter, setBranchFilter] = useState('');
  const [semesterFilter, setSemesterFilter] = useState('');
  const [quotaFilter, setQuotaFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [allPayments, setAllPayments] = useState([]);
  const [ledgerTab, setLedgerTab] = useState('students');
  
  // Student dashboard states
  const [studentDetails, setStudentDetails] = useState(null);

  // Active receipt preview
  const [activeReceipt, setActiveReceipt] = useState(null);
  const [receiptType, setReceiptType] = useState('student');

  const fetchDashboardData = async () => {
    setLoading(true);
    setError('');
    try {
      if (user.role === 'Admin') {
        const stats = await api.get('/reports/analytics');
        setData(stats);
        
        const payments = await api.get('/payments');
        setAllPayments(payments);
      } else if (user.role === 'Staff') {
        // Fetch students and recent payments
        const queryParams = new URLSearchParams();
        if (search) queryParams.append('search', search);
        if (branchFilter) queryParams.append('branch', branchFilter);
        if (semesterFilter) queryParams.append('semester', semesterFilter);
        if (quotaFilter) queryParams.append('quota', quotaFilter);

        const studentsList = await api.get(`/students?${queryParams.toString()}`);
        setStudents(studentsList);
        
        const recentPay = await api.get('/payments');
        setAllPayments(recentPay);
        setData({ recentActivity: recentPay.slice(0, 5) });
      } else if (user.role === 'Student') {
        const studData = await api.get(`/students/${user.studentId}`);
        setStudentDetails(studData);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [user, search, branchFilter, semesterFilter, quotaFilter]);

  const COLORS = ['#8b5cf6', '#ec4899', '#06b6d4', '#f59e0b', '#10b981'];


  // Render Admin View
  if (user.role === 'Admin' && data) {
    const { summary, branchData, quotaData, modeData, recentActivity } = data;
    
    const adminDaySum = allPayments
      .filter(p => !dateFilter || p.date.startsWith(dateFilter))
      .reduce((sum, p) => sum + Number(p.amount), 0);

    const displayActivity = dateFilter
      ? allPayments.filter(p => p.date.startsWith(dateFilter))
      : recentActivity;

    return (
      <div className="space-y-6 animate-fade-in">
        {/* Title and Date Filter */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black text-white glow-text">Admin Analytics Hub</h2>
            <p className="text-gray-400 text-xs mt-1">Real-time summaries of college collection matrices and fee audits.</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Analysis Date:</span>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              onClick={(e) => e.target.showPicker && e.target.showPicker()}
              className="px-3.5 py-2 rounded-xl glass-input text-xs font-semibold cursor-pointer"
            />
            {dateFilter && (
              <button
                onClick={() => setDateFilter('')}
                className="px-2.5 py-2 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-xl text-xs font-bold transition"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Date Filter Summary Card */}
        {dateFilter && (
          <div className="bg-violet-600/10 border border-violet-500/30 rounded-2xl p-4 flex items-center justify-between text-white animate-fade-in">
            <div>
              <p className="text-[10px] text-violet-400 font-bold uppercase tracking-wider">Filtered Date Collection Summary</p>
              <h4 className="text-xs font-semibold mt-0.5">Total Sum Collected on {new Date(dateFilter).toLocaleDateString('en-IN')}:</h4>
            </div>
            <div className="text-right">
              <span className="text-xl font-black text-violet-400 glow-text font-mono">
                ₹{adminDaySum.toLocaleString('en-IN')}.00
              </span>
            </div>
          </div>
        )}

        {/* Upper stats grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
          <div className="glass-card rounded-2xl p-5 flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Total Collection</p>
              <h3 className="text-2xl font-black text-white mt-1">₹{summary.totalCollected.toLocaleString('en-IN')}</h3>
              <p className="text-xs text-green-400 font-semibold mt-1 flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5" /> +12.4% this month
              </p>
            </div>
            <div className="p-3.5 bg-violet-500/10 border border-violet-500/20 rounded-xl text-violet-400">
              <Wallet className="w-6 h-6" />
            </div>
          </div>

          <div className="glass-card rounded-2xl p-5 flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Pending Dues</p>
              <h3 className="text-2xl font-black text-white mt-1">₹{summary.totalDues.toLocaleString('en-IN')}</h3>
              <p className="text-xs text-red-400 font-semibold mt-1 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" /> Overdue fine active
              </p>
            </div>
            <div className="p-3.5 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400">
              <AlertTriangle className="w-6 h-6" />
            </div>
          </div>

          <div className="glass-card rounded-2xl p-5 flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Accumulated Fines</p>
              <h3 className="text-2xl font-black text-white mt-1">₹{summary.totalFines.toLocaleString('en-IN')}</h3>
              <p className="text-xs text-gray-400 mt-1">From late payment fees</p>
            </div>
            <div className="p-3.5 bg-yellow-500/10 border border-yellow-500/20 rounded-xl text-yellow-400">
              <Clock className="w-6 h-6" />
            </div>
          </div>

          <div className="glass-card rounded-2xl p-5 flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Active Students</p>
              <h3 className="text-2xl font-black text-white mt-1">{summary.activeStudents}</h3>
              <p className="text-xs text-gray-400 mt-1">Registered accounts</p>
            </div>
            <div className="p-3.5 bg-cyan-500/10 border border-cyan-500/20 rounded-xl text-cyan-400">
              <Users className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Branch-wise collections chart */}
          <div className="glass-panel rounded-2xl p-5 lg:col-span-2">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Collections by Branch</h4>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={branchData} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                  <XAxis dataKey="name" stroke="#666" tick={{ fill: '#888', fontSize: 10 }} />
                  <YAxis stroke="#666" tick={{ fill: '#888', fontSize: 10 }} />
                  <Tooltip contentStyle={{ backgroundColor: '#18181f', borderColor: '#333', color: '#fff' }} />
                  <Bar dataKey="amount" radius={[8, 8, 0, 0]}>
                    {branchData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Quota Distribution (Pie Chart) */}
          <div className="glass-panel rounded-2xl p-5">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Quota Collection Split</h4>
            <div className="h-64 flex justify-center items-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={quotaData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="amount"
                  >
                    {quotaData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#18181f', borderColor: '#333', color: '#fff' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute flex flex-col items-center">
                <span className="text-[10px] uppercase font-bold text-gray-400">Total Quotas</span>
                <span className="text-sm font-bold text-white">{quotaData.length} active</span>
              </div>
            </div>
            {/* Legend */}
            <div className="grid grid-cols-3 gap-2 mt-4 text-center">
              {quotaData.map((item, idx) => (
                <div key={idx} className="flex flex-col items-center">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></div>
                    <span className="text-xs text-white font-semibold">{item.name}</span>
                  </div>
                  <span className="text-[10px] text-gray-400 font-medium">₹{item.amount.toLocaleString('en-IN')}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Transactions ledger and Daily Tally Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Recent Transactions Table (Takes 3 columns on desktop) */}
          <div className="glass-panel rounded-2xl p-5 lg:col-span-3">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                {dateFilter ? `Payments Received on ${new Date(dateFilter).toLocaleDateString('en-IN')}` : 'Recent Transactions Activity'}
              </h4>
              <button 
                onClick={() => navigateTo('reports')} 
                className="text-violet-400 hover:text-violet-300 text-xs font-bold flex items-center gap-1 transition"
              >
                All Audit Logs <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="overflow-x-auto">
              {displayActivity.length > 0 ? (
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-white/[0.05] text-gray-400">
                      <th className="pb-3 font-semibold uppercase tracking-wider">Receipt No</th>
                      <th className="pb-3 font-semibold uppercase tracking-wider">Student Name</th>
                      <th className="pb-3 font-semibold uppercase tracking-wider">USN</th>
                      <th className="pb-3 font-semibold uppercase tracking-wider">Payment Mode</th>
                      <th className="pb-3 font-semibold uppercase tracking-wider">Collector</th>
                      <th className="pb-3 font-semibold uppercase tracking-wider">Date</th>
                      <th className="pb-3 text-right font-semibold uppercase tracking-wider">Amount</th>
                      <th className="pb-3 text-center font-semibold uppercase tracking-wider">Bills Options</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayActivity.map((payment) => (
                      <tr key={payment._id} className="border-b border-white/[0.03] hover:bg-white/[0.02] text-gray-300 font-medium">
                        <td className="py-3.5 text-violet-400 font-bold">{payment.receiptNo}</td>
                        <td className="py-3.5 text-white">{payment.studentName}</td>
                        <td className="py-3.5 uppercase font-mono">{payment.studentUsn}</td>
                        <td className="py-3.5">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            payment.mode === 'Online' ? 'bg-cyan-500/10 text-cyan-400' :
                            payment.mode === 'Cash' ? 'bg-green-500/10 text-green-400' :
                            'bg-yellow-500/10 text-yellow-400'
                          }`}>
                            {payment.mode}
                          </span>
                        </td>
                        <td className="py-3.5">{payment.collectedBy}</td>
                        <td className="py-3.5">{new Date(payment.date).toLocaleDateString('en-IN')}</td>
                        <td className="py-3.5 text-right font-bold text-white">₹{payment.amount.toLocaleString('en-IN')}</td>
                        <td className="py-3.5 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => {
                                setReceiptType('staff');
                                api.get(`/students/${payment.studentId}`).then(studData => {
                                  setActiveReceipt({
                                    payment,
                                    student: studData.student,
                                    fees: studData.fees
                                  });
                                });
                              }}
                              className="px-2 py-1 bg-violet-600/10 hover:bg-violet-600/20 text-violet-400 hover:text-violet-300 border border-violet-500/10 rounded-lg font-bold transition text-[10px]"
                            >
                              Detailed
                            </button>
                            <button
                              onClick={() => {
                                setReceiptType('student');
                                api.get(`/students/${payment.studentId}`).then(studData => {
                                  setActiveReceipt({
                                    payment,
                                    student: studData.student,
                                    fees: studData.fees
                                  });
                                });
                              }}
                              className="px-2 py-1 bg-cyan-600/10 hover:bg-cyan-600/20 text-cyan-400 hover:text-cyan-300 border border-cyan-500/10 rounded-lg font-bold transition text-[10px]"
                            >
                              Simple
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="text-center py-8 text-gray-500 font-medium">
                  No transaction logs recorded on this date.
                </div>
              )}
            </div>
          </div>

          {/* Daily Collections Tally Ledger sidebar */}
          <div className="glass-panel rounded-2xl p-5">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-violet-400" />
              Daily Tally Ledger
            </h4>
            <div className="space-y-2 max-h-[350px] overflow-y-auto no-scrollbar">
              {(() => {
                const tally = {};
                allPayments.forEach(p => {
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
                        <p className="text-[9px] text-gray-500 mt-0.5 font-medium">Click to filter ledger</p>
                      </div>
                      <span className="font-bold text-violet-400 font-mono text-xs">₹{item.amount.toLocaleString('en-IN')}</span>
                    </button>
                  );
                });
              })()}
            </div>
          </div>
        </div>

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
  }

  // Render Staff View
  if (user.role === 'Staff') {
    const staffDaySum = allPayments
      .filter(p => !dateFilter || p.date.startsWith(dateFilter))
      .reduce((sum, p) => sum + Number(p.amount), 0);

    const filteredPayments = allPayments.filter(payment => {
      const matchesSearch = !search || 
        payment.studentName.toLowerCase().includes(search.toLowerCase()) ||
        payment.studentUsn.toLowerCase().includes(search.toLowerCase()) ||
        payment.receiptNo.toLowerCase().includes(search.toLowerCase());
        
      const matchesBranch = !branchFilter || payment.studentBranch === branchFilter;
      const matchesQuota = !quotaFilter || payment.studentQuota === quotaFilter;
      const matchesDate = !dateFilter || payment.date.startsWith(dateFilter);
      
      return matchesSearch && matchesBranch && matchesQuota && matchesDate;
    });

    return (
      <div className="space-y-6 animate-fade-in">
        {/* Page title and search */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black text-white glow-text">Accounts Office Directory</h2>
            <p className="text-gray-400 text-xs mt-1">Manage payment collections, verify student status, and issue bills.</p>
          </div>
          <button 
            onClick={() => navigateTo('payments')} 
            className="px-4 py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-bold transition glow-btn flex items-center gap-2"
          >
            <CreditCard className="w-4 h-4" /> Collect Student Dues
          </button>
        </div>

        {/* Advanced Filter Panel */}
        <div className="glass-panel rounded-2xl p-5 grid grid-cols-1 md:grid-cols-6 gap-3.5">
          <div className="md:col-span-2 relative">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search student by Name or USN..."
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
          <div className="flex gap-1.5">
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              onClick={(e) => e.target.showPicker && e.target.showPicker()}
              className="w-full px-3 py-2 rounded-xl glass-input text-[11px] cursor-pointer"
              title="Filter collections by Date"
            />
            {dateFilter && (
              <button
                onClick={() => setDateFilter('')}
                className="px-2 py-2 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-xl text-xs font-bold transition"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Date Filter Summary Card */}
        {dateFilter && (
          <div className="bg-violet-600/10 border border-violet-500/30 rounded-2xl p-4 flex items-center justify-between text-white animate-fade-in">
            <div>
              <p className="text-[10px] text-violet-400 font-bold uppercase tracking-wider">Filtered Date Collection Summary</p>
              <h4 className="text-xs font-semibold mt-0.5">Total Fees Collected on {new Date(dateFilter).toLocaleDateString('en-IN')}:</h4>
            </div>
            <div className="text-right">
              <span className="text-xl font-black text-violet-400 glow-text font-mono">
                ₹{staffDaySum.toLocaleString('en-IN')}.00
              </span>
            </div>
          </div>
        )}


        {/* Student ledger and Daily Tally Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Student / Payments Ledger toggle card (Takes 3 columns on desktop) */}
          <div className="glass-panel rounded-2xl p-5 lg:col-span-3">
            
            {/* Ledger Switch Tabs */}
            <div className="flex items-center gap-6 mb-5 border-b border-white/[0.04] pb-2.5">
              <button
                type="button"
                onClick={() => setLedgerTab('students')}
                className={`text-xs font-bold uppercase tracking-wider pb-2 border-b-2 transition cursor-pointer ${
                  ledgerTab === 'students'
                    ? 'border-violet-500 text-white'
                    : 'border-transparent text-gray-500 hover:text-gray-300'
                }`}
              >
                Student Dues Ledger
              </button>
              <button
                type="button"
                onClick={() => setLedgerTab('payments')}
                className={`text-xs font-bold uppercase tracking-wider pb-2 border-b-2 transition cursor-pointer ${
                  ledgerTab === 'payments'
                    ? 'border-violet-500 text-white'
                    : 'border-transparent text-gray-500 hover:text-gray-300'
                }`}
              >
                Recent Transactions
              </button>
            </div>

            {ledgerTab === 'students' ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-white/[0.05] text-gray-400">
                      <th className="pb-3 font-semibold uppercase tracking-wider">USN</th>
                      <th className="pb-3 font-semibold uppercase tracking-wider">Name</th>
                      <th className="pb-3 font-semibold uppercase tracking-wider">Branch/Sem</th>
                      <th className="pb-3 font-semibold uppercase tracking-wider">Quota</th>
                      <th className="pb-3 font-semibold uppercase tracking-wider">Fee Payable</th>
                      <th className="pb-3 font-semibold uppercase tracking-wider">Amount Paid</th>
                      <th className="pb-3 font-semibold uppercase tracking-wider">Balance Due</th>
                      <th className="pb-3 font-semibold uppercase tracking-wider">Status</th>
                      <th className="pb-3 text-center font-semibold uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((student) => {
                      const fees = student.fees || { totalFee: 0, amountPaid: 0, balanceDue: 0, netPayableNow: 0 };
                      
                      let status = 'Unpaid';
                      let statusColor = 'bg-red-500/10 text-red-400 border border-red-500/20';
                      
                      if (fees.amountPaid >= fees.totalFee && fees.totalFee > 0) {
                        status = 'Paid';
                        statusColor = 'bg-green-500/10 text-green-400 border border-green-500/20';
                      } else if (fees.amountPaid > 0) {
                        status = 'Partially Paid';
                        statusColor = 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20';
                      }

                      return (
                        <tr key={student._id} className="border-b border-white/[0.03] hover:bg-white/[0.02] text-gray-300 font-medium">
                          <td className="py-3.5 uppercase font-mono font-bold text-white">{student.usn}</td>
                          <td className="py-3.5 text-white">{student.name}</td>
                          <td className="py-3.5 text-gray-400">{student.branch} / {student.semester}</td>
                          <td className="py-3.5 font-bold text-gray-400">{student.quota}</td>
                          <td className="py-3.5 text-white">₹{fees.totalFee.toLocaleString('en-IN')}</td>
                          <td className="py-3.5 text-green-400 font-bold">₹{fees.amountPaid.toLocaleString('en-IN')}</td>
                          <td className="py-3.5 text-red-400 font-bold">₹{fees.balanceDue.toLocaleString('en-IN')}</td>
                          <td className="py-3.5">
                            <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold ${statusColor}`}>
                              {status}
                            </span>
                          </td>
                          <td className="py-3.5 text-center">
                            <div className="flex items-center justify-center gap-2">
                              {fees.amountPaid > 0 ? (
                                <>
                                  <button
                                    onClick={() => {
                                      api.get(`/payments/student/${student._id}`).then(payList => {
                                        if (payList && payList.length > 0) {
                                          setReceiptType('staff');
                                          Promise.all([
                                            api.get(`/payments/receipt/${payList[0].receiptNo}`),
                                            api.get(`/students/${student._id}`)
                                          ]).then(([receiptData, studentData]) => {
                                            setActiveReceipt({
                                              payment: receiptData.payment,
                                              student: receiptData.student,
                                              fees: studentData.fees
                                            });
                                          });
                                        }
                                      });
                                    }}
                                    className="px-2 py-1 bg-violet-600/10 hover:bg-violet-600/20 text-violet-400 hover:text-violet-300 border border-violet-500/10 rounded-lg font-bold transition text-[10px] flex items-center gap-1 cursor-pointer"
                                  >
                                    Detailed
                                  </button>
                                  <button
                                    onClick={() => {
                                      api.get(`/payments/student/${student._id}`).then(payList => {
                                        if (payList && payList.length > 0) {
                                          setReceiptType('student');
                                          Promise.all([
                                            api.get(`/payments/receipt/${payList[0].receiptNo}`),
                                            api.get(`/students/${student._id}`)
                                          ]).then(([receiptData, studentData]) => {
                                            setActiveReceipt({
                                              payment: receiptData.payment,
                                              student: receiptData.student,
                                              fees: studentData.fees
                                            });
                                          });
                                        }
                                      });
                                    }}
                                    className="px-2 py-1 bg-cyan-600/10 hover:bg-cyan-600/20 text-cyan-400 hover:text-cyan-300 border border-cyan-500/10 rounded-lg font-bold transition text-[10px] flex items-center gap-1 cursor-pointer"
                                  >
                                    Simple
                                  </button>
                                </>
                              ) : (
                                <span className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider italic">No payments</span>
                              )}
                              {fees.balanceDue > 0 && (
                                <button
                                  onClick={() => navigateTo('payments', { studentId: student._id })}
                                  className="px-2.5 py-1 bg-green-600 hover:bg-green-500 rounded-lg text-white font-bold transition text-[10px] cursor-pointer"
                                >
                                  Collect
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="overflow-x-auto">
                {filteredPayments.length > 0 ? (
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-white/[0.05] text-gray-400">
                        <th className="pb-3 font-semibold uppercase tracking-wider">Receipt No</th>
                        <th className="pb-3 font-semibold uppercase tracking-wider">Student Name</th>
                        <th className="pb-3 font-semibold uppercase tracking-wider">USN</th>
                        <th className="pb-3 font-semibold uppercase tracking-wider">Payment Mode</th>
                        <th className="pb-3 font-semibold uppercase tracking-wider">Collector</th>
                        <th className="pb-3 font-semibold uppercase tracking-wider">Date</th>
                        <th className="pb-3 text-right font-semibold uppercase tracking-wider">Amount</th>
                        <th className="pb-3 text-center font-semibold uppercase tracking-wider">Bills Options</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPayments.map((payment) => (
                        <tr key={payment._id} className="border-b border-white/[0.03] hover:bg-white/[0.02] text-gray-300 font-medium">
                          <td className="py-3.5 text-violet-400 font-bold">{payment.receiptNo}</td>
                          <td className="py-3.5 text-white">{payment.studentName}</td>
                          <td className="py-3.5 uppercase font-mono">{payment.studentUsn}</td>
                          <td className="py-3.5">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              payment.mode === 'Online' ? 'bg-cyan-500/10 text-cyan-400' :
                              payment.mode === 'Cash' ? 'bg-green-500/10 text-green-400' :
                              'bg-yellow-500/10 text-yellow-400'
                            }`}>
                              {payment.mode}
                            </span>
                          </td>
                          <td className="py-3.5">{payment.collectedBy}</td>
                          <td className="py-3.5">{new Date(payment.date).toLocaleDateString('en-IN')}</td>
                          <td className="py-3.5 text-right font-bold text-white">₹{payment.amount.toLocaleString('en-IN')}</td>
                          <td className="py-3.5 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => {
                                  setReceiptType('staff');
                                  api.get(`/students/${payment.studentId}`).then(studData => {
                                    setActiveReceipt({
                                      payment,
                                      student: studData.student,
                                      fees: studData.fees
                                    });
                                  });
                                }}
                                className="px-2 py-1 bg-violet-600/10 hover:bg-violet-600/20 text-violet-400 hover:text-violet-300 border border-violet-500/10 rounded-lg font-bold transition text-[10px] cursor-pointer"
                              >
                                Detailed
                              </button>
                              <button
                                onClick={() => {
                                  setReceiptType('student');
                                  api.get(`/students/${payment.studentId}`).then(studData => {
                                    setActiveReceipt({
                                      payment,
                                      student: studData.student,
                                      fees: studData.fees
                                    });
                                  });
                                }}
                                className="px-2 py-1 bg-cyan-600/10 hover:bg-cyan-600/20 text-cyan-400 hover:text-cyan-300 border border-cyan-500/10 rounded-lg font-bold transition text-[10px] cursor-pointer"
                              >
                                Simple
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="text-center py-8 text-gray-500 font-medium">
                    No transactions recorded matching your filter criteria.
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Daily Collections Tally Ledger sidebar */}
          <div className="glass-panel rounded-2xl p-5">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-violet-400" />
              Daily Tally Ledger
            </h4>
            <div className="space-y-2 max-h-[350px] overflow-y-auto no-scrollbar">
              {(() => {
                const tally = {};
                allPayments.forEach(p => {
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
                        <p className="text-[9px] text-gray-500 mt-0.5 font-medium">Click to filter directory</p>
                      </div>
                      <span className="font-bold text-violet-400 font-mono text-xs">₹{item.amount.toLocaleString('en-IN')}</span>
                    </button>
                  );
                });
              })()}
            </div>
          </div>
        </div>


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
  }

  // Render Student View
  if (user.role === 'Student' && studentDetails) {
    const { student, fees } = studentDetails;
    const isOverdue = fees.daysOverdue > 0;
    
    return (
      <div className="space-y-6 animate-fade-in">
        {/* Welcome greeting */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black text-white glow-text">Welcome back, {student.name}</h2>
            <p className="text-gray-400 text-xs mt-1">Here is the snapshot of your academic year college fee details.</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[10px] uppercase font-bold text-gray-500">Year batch</span>
            <span className="px-3 py-1 bg-violet-500/10 border border-violet-500/20 text-violet-400 text-xs font-bold rounded-lg uppercase">
              {student.batch}
            </span>
          </div>
        </div>

        {/* Student summary cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
          <div className="glass-card rounded-2xl p-5 flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Total Quota Fees</p>
              <h3 className="text-2xl font-black text-white mt-1">₹{fees.totalFee.toLocaleString('en-IN')}</h3>
              <p className="text-xs text-gray-400 mt-1">Admission Category: {student.quota}</p>
            </div>
            <div className="p-3.5 bg-violet-500/10 border border-violet-500/20 rounded-xl text-violet-400">
              <Receipt className="w-6 h-6" />
            </div>
          </div>

          <div className="glass-card rounded-2xl p-5 flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Cleared To Date</p>
              <h3 className="text-2xl font-black text-green-400 mt-1">₹{fees.amountPaid.toLocaleString('en-IN')}</h3>
              <p className="text-xs text-green-400 font-semibold mt-1 flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5" /> {(fees.totalFee > 0 ? (fees.amountPaid / fees.totalFee * 100) : 0).toFixed(0)}% paid
              </p>
            </div>
            <div className="p-3.5 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400">
              <CheckCircle className="w-6 h-6" />
            </div>
          </div>

          <div className="glass-card rounded-2xl p-5 flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Unpaid Dues</p>
              <h3 className="text-2xl font-black text-red-400 mt-1">₹{fees.balanceDue.toLocaleString('en-IN')}</h3>
              <p className="text-xs text-red-400 font-semibold mt-1">Net outstanding balance</p>
            </div>
            <div className="p-3.5 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400">
              <AlertTriangle className="w-6 h-6" />
            </div>
          </div>

          <div className="glass-card rounded-2xl p-5 flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Late Fine Dues</p>
              <h3 className="text-2xl font-black text-yellow-400 mt-1">₹{fees.fine.toLocaleString('en-IN')}</h3>
              {isOverdue ? (
                <p className="text-xs text-red-400 font-semibold mt-1 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> {fees.daysOverdue} days overdue
                </p>
              ) : (
                <p className="text-xs text-green-400 font-semibold mt-1">No active fines</p>
              )}
            </div>
            <div className="p-3.5 bg-yellow-500/10 border border-yellow-500/20 rounded-xl text-yellow-400">
              <Clock className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Transaction History and Receipts Download */}
        <div className="glass-panel rounded-2xl p-5">
          <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Payment History Ledger</h4>
          {fees.payments && fees.payments.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-white/[0.05] text-gray-400">
                    <th className="pb-3 font-semibold uppercase tracking-wider">Receipt No</th>
                    <th className="pb-3 font-semibold uppercase tracking-wider">Payment Mode</th>
                    <th className="pb-3 font-semibold uppercase tracking-wider">Reference No</th>
                    <th className="pb-3 font-semibold uppercase tracking-wider">Collected By</th>
                    <th className="pb-3 font-semibold uppercase tracking-wider">Date</th>
                    <th className="pb-3 font-semibold uppercase tracking-wider">Remarks</th>
                    <th className="pb-3 text-right font-semibold uppercase tracking-wider">Amount</th>
                    <th className="pb-3 text-center font-semibold uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {fees.payments.map((payment) => (
                    <tr key={payment._id} className="border-b border-white/[0.03] hover:bg-white/[0.02] text-gray-300 font-medium">
                      <td className="py-3.5 text-violet-400 font-bold">{payment.receiptNo}</td>
                      <td className="py-3.5">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/10 text-cyan-400">
                          {payment.mode}
                        </span>
                      </td>
                      <td className="py-3.5 font-mono text-gray-400">{payment.referenceNo}</td>
                      <td className="py-3.5">{payment.collectedBy}</td>
                      <td className="py-3.5">{new Date(payment.date).toLocaleDateString('en-IN')}</td>
                      <td className="py-3.5 italic text-gray-400">{payment.remarks || 'N/A'}</td>
                      <td className="py-3.5 text-right font-bold text-white">₹{payment.amount.toLocaleString('en-IN')}</td>
                      <td className="py-3.5 text-center">
                        <button
                          onClick={() => {
                            setReceiptType('student'); // Simplified Student bill
                            setActiveReceipt({
                              payment,
                              student,
                              fees
                            });
                          }}
                          className="px-2.5 py-1.5 bg-violet-600 hover:bg-violet-500 rounded-lg text-white font-bold transition flex items-center gap-1.5 justify-center mx-auto"
                        >
                          <Receipt className="w-3.5 h-3.5" /> Download Receipt
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 font-medium">
              No payments have been recorded for your account yet. 
              Please proceed to the accounts desk for fee settlements.
            </div>
          )}
        </div>

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
  }

  // Loading state
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <RefreshCw className="w-8 h-8 text-violet-500 animate-spin" />
      <p className="text-gray-400 text-sm font-medium">Fetching secure metrics ledger...</p>
    </div>
  );
};

export default Dashboard;
