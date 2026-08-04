import React, { useEffect, useState } from 'react';
import { api } from '../utils/api';
import confetti from 'canvas-confetti';
import { 
  CreditCard, Search, CheckCircle, RefreshCw, X, ArrowLeft,
  IndianRupee, Receipt, Printer, FileText, Check, AlertTriangle
} from 'lucide-react';
import ReceiptView from '../components/ReceiptView';

const Payments = ({ user, initialStudentId, navigateTo }) => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Selection state
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [studentDetails, setStudentDetails] = useState(null);

  // Form payment inputs
  const [amount, setAmount] = useState('');
  const [mode, setMode] = useState('Online');
  const [referenceNo, setReferenceNo] = useState('');
  const [remarks, setRemarks] = useState('');

  // Payment processing states
  const [processing, setProcessing] = useState(false);
  const [successPayment, setSuccessPayment] = useState(null);
  
  // Receipt overlay preview states
  const [activeReceipt, setActiveReceipt] = useState(null);
  const [receiptType, setReceiptType] = useState('staff');

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const data = await api.get('/students');
      setStudents(data);
      
      // If we received an initial studentId (e.g. clicked collect from dashboard)
      if (initialStudentId) {
        const student = data.find(s => s._id === initialStudentId);
        if (student) {
          handleSelectStudent(student);
        }
      }
    } catch (err) {
      console.error(err);
      setError('Failed to fetch student list.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [initialStudentId]);

  const handleSelectStudent = async (student) => {
    setSelectedStudent(student);
    setSearchQuery(`${student.name} (${student.usn})`);
    
    // Fetch detailed fee details
    try {
      const details = await api.get(`/students/${student._id}`);
      setStudentDetails(details);
      
      // Pre-fill amount with outstanding dues (convenient feature!)
      setAmount(details.fees.netPayableNow.toString());
    } catch (err) {
      console.error(err);
      setError('Failed to fetch detailed fee balance for student.');
    }
  };

  const handleClearSelection = () => {
    setSelectedStudent(null);
    setStudentDetails(null);
    setSearchQuery('');
    setAmount('');
    setReferenceNo('');
    setRemarks('');
    setError('');
  };

  const handleCollect = async (e) => {
    e.preventDefault();
    if (!selectedStudent || !amount || Number(amount) <= 0) {
      setError('Please select a student and enter a valid payment amount.');
      return;
    }

    setError('');
    setProcessing(true);

    try {
      const result = await api.post('/payments', {
        studentId: selectedStudent._id,
        amount: Number(amount),
        mode,
        referenceNo,
        remarks
      });

      // Fire celebratory confetti!
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#a78bfa', '#f472b6', '#22d3ee', '#34d399']
      });

      setSuccessPayment(result);
      
      // Clear form
      setReferenceNo('');
      setRemarks('');
      
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to process payment collection.');
    } finally {
      setProcessing(false);
    }
  };

  // Filter list of students based on search query
  const filteredStudents = searchQuery && !selectedStudent
    ? students.filter(s => 
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        s.usn.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 5)
    : [];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Title block */}
      <div className="flex items-center gap-3">
        <button 
          onClick={() => navigateTo('dashboard')} 
          className="p-2 hover:bg-white/5 border border-white/5 hover:border-white/10 text-gray-400 hover:text-white rounded-xl transition"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h2 className="text-2xl font-black text-white glow-text">Fee Payment Registrar</h2>
          <p className="text-gray-400 text-xs mt-1">Record college tuition and miscellaneous receipts for registered student accounts.</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-300 px-4 py-3.5 rounded-xl text-xs font-semibold flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" /> {error}
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <RefreshCw className="w-8 h-8 text-violet-500 animate-spin" />
          <p className="text-gray-400 text-xs font-medium">Syncing register variables...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form inputs panel */}
          <div className="lg:col-span-2 space-y-4">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Transaction Form</h3>
            
            <form onSubmit={handleCollect} className="glass-panel rounded-2xl p-6 space-y-5">
              {/* Student Search and select input */}
              <div className="relative">
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                  Search student to pay
                </label>
                <div className="relative">
                  <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-500" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      if (selectedStudent) handleClearSelection();
                    }}
                    className="w-full pl-10 pr-10 py-3 rounded-xl glass-input text-xs"
                    placeholder="Enter student Name or USN (e.g. RAHUL)..."
                  />
                  {selectedStudent && (
                    <button
                      type="button"
                      onClick={handleClearSelection}
                      className="absolute right-3.5 top-3.5 p-0.5 hover:bg-gray-800 rounded text-gray-400 hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Dropdown Suggestions */}
                {filteredStudents.length > 0 && (
                  <div className="absolute z-10 w-full mt-2 bg-[#121216] border border-gray-800 rounded-xl overflow-hidden shadow-2xl">
                    {filteredStudents.map(student => (
                      <button
                        key={student._id}
                        type="button"
                        onClick={() => handleSelectStudent(student)}
                        className="w-full px-4 py-3 text-left hover:bg-violet-600/10 hover:text-violet-300 border-b border-gray-900/50 flex justify-between items-center text-xs text-gray-300 transition"
                      >
                        <div>
                          <p className="font-bold text-white">{student.name}</p>
                          <p className="text-[10px] text-gray-500 uppercase mt-0.5 font-mono">{student.usn} | {student.branch}</p>
                        </div>
                        <span className="text-[10px] font-bold bg-white/5 border border-white/10 px-2 py-0.5 rounded text-gray-400">
                          {student.quota}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Payment Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                    Amount to Collect (₹)
                  </label>
                  <div className="relative">
                    <IndianRupee className="absolute left-3.5 top-3 w-4 h-4 text-gray-500" />
                    <input
                      type="number"
                      required
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 rounded-xl glass-input text-xs font-mono font-bold"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                    Payment Method
                  </label>
                  <select
                    value={mode}
                    onChange={(e) => setMode(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs cursor-pointer"
                  >
                    <option value="Online">Online Transfer / UPI</option>
                    <option value="Cash">Cash Settlement</option>
                    <option value="DD">Demand Draft (DD)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                    Reference / Check / TXN ID
                  </label>
                  <input
                    type="text"
                    value={referenceNo}
                    onChange={(e) => setReferenceNo(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs font-mono"
                    placeholder="e.g. TXN92019379 or DD-48210"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                    Internal Collector Remarks
                  </label>
                  <input
                    type="text"
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs"
                    placeholder="e.g. Partial pay installment"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={processing || !selectedStudent}
                className="w-full py-3.5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-bold transition glow-btn flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {processing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Authorizing payment transfer log...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    <span>Process Payment Receipt</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Student Dues Info Panel */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Balances Overview</h3>
            
            {studentDetails ? (
              <div className="glass-panel rounded-2xl p-5 space-y-4 animate-fade-in">
                <div className="border-b border-gray-800 pb-3">
                  <span className="text-[9px] uppercase font-bold text-gray-500">Student Profile</span>
                  <h4 className="text-sm font-bold text-white mt-0.5">{studentDetails.student.name}</h4>
                  <p className="text-[10px] text-gray-400 font-mono mt-0.5 uppercase">{studentDetails.student.usn} | {studentDetails.student.branch}</p>
                </div>

                <div className="space-y-2.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Total Quota Fees:</span>
                    <span className="text-white font-semibold">₹{studentDetails.fees.totalFee.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Cleared To Date:</span>
                    <span className="text-green-400 font-semibold">₹{studentDetails.fees.amountPaid.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Outstanding Balance:</span>
                    <span className="text-red-400 font-bold">₹{studentDetails.fees.balanceDue.toLocaleString('en-IN')}</span>
                  </div>
                  {studentDetails.fees.fine > 0 && (
                    <div className="flex justify-between text-yellow-400 font-medium">
                      <span>Accumulated Fine:</span>
                      <span>₹{studentDetails.fees.fine.toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t border-gray-800 pt-2.5 font-bold text-sm">
                    <span className="text-white">Net Dues:</span>
                    <span className="text-violet-400 glow-text font-mono">₹{studentDetails.fees.netPayableNow.toLocaleString('en-IN')}</span>
                  </div>
                </div>

                {studentDetails.fees.netPayableNow === 0 && (
                  <div className="bg-green-500/10 border border-green-500/20 text-green-300 text-[10px] p-3 rounded-lg flex items-center gap-1.5">
                    <Check className="w-4 h-4 flex-shrink-0" />
                    Student has fully cleared their dues.
                  </div>
                )}

                {/* Payment History Logs */}
                {studentDetails.fees.payments && studentDetails.fees.payments.length > 0 && (
                  <div className="border-t border-gray-800 pt-4 mt-4 space-y-2">
                    <span className="text-[10px] uppercase font-bold text-gray-500 block mb-1">Receipts History Log</span>
                    <div className="space-y-2 max-h-[220px] overflow-y-auto no-scrollbar pr-1">
                      {studentDetails.fees.payments.map((payment) => (
                        <div key={payment._id} className="p-2.5 bg-white/[0.02] border border-white/5 hover:border-white/10 rounded-xl flex items-center justify-between gap-3 text-xs transition">
                          <div>
                            <span className="font-mono text-violet-400 font-bold block">{payment.receiptNo}</span>
                            <span className="text-[10px] text-gray-400 block">{new Date(payment.date).toLocaleDateString('en-IN')} via {payment.mode}</span>
                            <span className="text-[11px] text-white font-bold block mt-0.5">₹{payment.amount.toLocaleString('en-IN')}</span>
                          </div>
                          <div className="flex flex-col gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => {
                                setReceiptType('staff');
                                setActiveReceipt({
                                  payment,
                                  student: studentDetails.student,
                                  fees: studentDetails.fees
                                });
                              }}
                              className="px-2 py-1 bg-violet-600/10 hover:bg-violet-600/20 text-violet-400 hover:text-violet-300 border border-violet-500/10 rounded-lg font-bold text-[9px] text-center transition cursor-pointer"
                            >
                              Detailed
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setReceiptType('student');
                                setActiveReceipt({
                                  payment,
                                  student: studentDetails.student,
                                  fees: studentDetails.fees
                                });
                              }}
                              className="px-2 py-1 bg-cyan-600/10 hover:bg-cyan-600/20 text-cyan-400 hover:text-cyan-300 border border-cyan-500/10 rounded-lg font-bold text-[9px] text-center transition cursor-pointer"
                            >
                              Simple
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="glass-panel rounded-2xl p-6 text-center text-gray-500 text-xs py-14">
                Please search and select a student to review their active balance, overdue fines, and payments ledger.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Success Modal with direct print layout actions */}
      {successPayment && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-[#141419] border border-gray-800 rounded-3xl w-full max-w-md p-6 shadow-2xl animate-fade-in text-center">
            <div className="inline-flex p-3.5 bg-green-500/10 border border-green-500/20 rounded-full text-green-400 mb-4 animate-bounce">
              <Check className="w-6 h-6" />
            </div>
            
            <h3 className="text-lg font-bold text-white glow-text">Payment Settled Successfully!</h3>
            <p className="text-gray-400 text-xs mt-1.5">
              Collected ₹{successPayment.payment.amount.toLocaleString('en-IN')} from {successPayment.student.name}. 
              Receipt no: <span className="font-mono text-violet-400 font-bold">{successPayment.payment.receiptNo}</span>
            </p>

            <div className="mt-6 flex flex-col gap-2">
              <button
                onClick={() => {
                  setReceiptType('staff');
                  setActiveReceipt({
                    payment: successPayment.payment,
                    student: successPayment.student,
                    fees: {
                      totalFee: studentDetails?.fees.totalFee || 0,
                      amountPaid: (studentDetails?.fees.amountPaid || 0) + Number(amount),
                      balanceDue: Math.max(0, (studentDetails?.fees.balanceDue || 0) - Number(amount)),
                      fine: studentDetails?.fees.fine || 0,
                      netPayableNow: Math.max(0, (studentDetails?.fees.netPayableNow || 0) - Number(amount))
                    }
                  });
                }}
                className="w-full py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-bold transition glow-btn flex items-center justify-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" /> Print Detailed Staff Bill
              </button>
              
              <button
                onClick={() => {
                  setReceiptType('student');
                  setActiveReceipt({
                    payment: successPayment.payment,
                    student: successPayment.student,
                    fees: {
                      totalFee: studentDetails?.fees.totalFee || 0,
                      amountPaid: (studentDetails?.fees.amountPaid || 0) + Number(amount),
                      balanceDue: Math.max(0, (studentDetails?.fees.balanceDue || 0) - Number(amount)),
                      fine: studentDetails?.fees.fine || 0,
                      netPayableNow: Math.max(0, (studentDetails?.fees.netPayableNow || 0) - Number(amount))
                    }
                  });
                }}
                className="w-full py-2.5 bg-white/5 hover:bg-white/10 text-white border border-white/5 hover:border-white/10 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
              >
                <FileText className="w-3.5 h-3.5" /> Print Student Receipt
              </button>
              
              <button
                onClick={() => {
                  setSuccessPayment(null);
                  handleClearSelection();
                  fetchStudents();
                }}
                className="w-full py-2.5 mt-2 text-gray-400 hover:text-white rounded-xl text-xs font-bold transition"
              >
                Collect Another Payment
              </button>
            </div>
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
          onClose={() => {
            setActiveReceipt(null);
            if (successPayment) {
              setSuccessPayment(null);
              handleClearSelection();
              fetchStudents();
            }
          }}
        />
      )}
    </div>
  );
};

export default Payments;
