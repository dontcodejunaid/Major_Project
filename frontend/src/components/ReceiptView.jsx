import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Printer, X, ShieldCheck, FileText, Settings } from 'lucide-react';

// Number to Words Converter in Indian format (Lakhs/Crores)
const convertNumberToWords = (num) => {
  const a = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
    'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'
  ];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  if (num === 0) return 'Zero';

  const makeGroup = (n) => {
    let s = '';
    if (n >= 100) {
      s += a[Math.floor(n / 100)] + ' Hundred ';
      n %= 100;
    }
    if (n >= 20) {
      s += b[Math.floor(n / 10)] + ' ';
      n %= 10;
    }
    if (n > 0) {
      s += a[n] + ' ';
    }
    return s.trim();
  };

  let word = '';
  let temp = Math.floor(num);

  if (temp >= 10000000) {
    word += makeGroup(Math.floor(temp / 10000000)) + ' Crore ';
    temp %= 10000000;
  }
  if (temp >= 100000) {
    word += makeGroup(Math.floor(temp / 100000)) + ' Lakh ';
    temp %= 100000;
  }
  if (temp >= 1000) {
    word += makeGroup(Math.floor(temp / 1000)) + ' Thousand ';
    temp %= 1000;
  }
  if (temp > 0) {
    word += makeGroup(temp);
  }

  return word.trim();
};

const ReceiptView = ({ payment, student, fees, type = 'student', onClose }) => {
  const [selectedLayout, setSelectedLayout] = useState(type);

  if (!payment || !student) return null;

  // Retrieve current active user to see if role allows toggling layouts
  const storedUser = localStorage.getItem('user');
  const currentUser = storedUser ? JSON.parse(storedUser) : null;
  const isStaffOrAdmin = currentUser && (currentUser.role === 'Admin' || currentUser.role === 'Staff');

  const dateObj = new Date(payment.date);
  const dateFormatted = dateObj.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }).replace(/ /g, '-'); // e.g. 23-Jun-2026

  const handlePrint = () => {
    window.print();
  };

  const qrValue = `RECEIPT:${payment.receiptNo}|REG_NO:${student.usn}|AMT:${payment.amount}|DATE:${payment.date}`;

  // Generate words from amount
  const wordsAmount = convertNumberToWords(payment.amount);

  // Components mapping for the "feestruct" box
  const components = fees?.components || [
    { name: 'Tuition Fee', amount: Number(fees?.totalFee || 0) }
  ];

  return (
    <div 
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4 backdrop-blur-sm no-print cursor-pointer"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="bg-[#16171d] border border-gray-800 rounded-3xl w-full max-w-4xl h-[90vh] max-h-[90vh] flex flex-col p-6 shadow-2xl animate-fade-in no-print cursor-default"
      >
        
        {/* Modal Header controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-gray-800 flex-shrink-0">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="text-violet-500 w-4 h-4" />
              Receipt Generator & Preview
            </h3>
            <p className="text-[11px] text-gray-400 mt-0.5">
              Select layout configuration to print. Students are locked to simplified views.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Toggle tabs for Staff & Admin only */}
            {isStaffOrAdmin && (
              <div className="bg-white/5 border border-white/5 p-1 rounded-xl flex gap-1 text-[11px] font-bold">
                <button
                  onClick={() => setSelectedLayout('staff')}
                  className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                    selectedLayout === 'staff'
                      ? 'bg-violet-600 text-white'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Staff Detailed Bill
                </button>
                <button
                  onClick={() => setSelectedLayout('student')}
                  className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                    selectedLayout === 'student'
                      ? 'bg-violet-600 text-white'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Student Simplified Receipt
                </button>
              </div>
            )}

            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-bold transition glow-btn cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              Print / Save PDF
            </button>
            <button
              onClick={onClose}
              className="flex items-center gap-1.5 px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/5 hover:border-white/10 rounded-xl text-xs font-bold transition cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              Close Preview
            </button>
          </div>
        </div>

        {/* Printable Invoice Container */}
        <div className="bg-white text-black p-8 rounded-2xl flex-grow overflow-y-auto no-scrollbar shadow-inner min-h-0">
          <div id="print-area" className="w-full text-black font-serif px-2 py-4">
            
            {/* Ghousia branded header */}
            <div className="text-center pb-2 mb-4 border-b border-black">
              <h1 className="text-xl font-bold tracking-wide uppercase m-0 leading-none">GHOUSIA COLLEGE OF ENGINEERING</h1>
              <p className="text-[11px] uppercase font-bold m-1 tracking-wider">RAMANAGARAM</p>
              <p className="text-[9px] italic m-0">(Owned & Managed by G.I.E.T., BANGALORE)</p>
              <h3 className="text-xs font-bold uppercase tracking-widest mt-2 mb-1 underline">COLLEGE RECEIPT</h3>
            </div>

            {/* Metadata Fields layout */}
            <div className="border border-black rounded text-[11px] p-2 mb-4">
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <p className="my-1"><strong>No.</strong> <span className="font-sans font-bold">{payment.receiptNo}</span></p>
                  <p className="my-1"><strong>Name:</strong> <span className="font-sans">{student.name}</span></p>
                </div>
                <div className="border-l border-r border-black/10 px-4">
                  <p className="my-1"><strong>Date:</strong> <span className="font-sans">{dateFormatted}</span></p>
                  <p className="my-1"><strong>Reg No.</strong> <span className="font-sans font-mono uppercase">{student.usn}</span></p>
                </div>
                <div className="pl-4">
                  <p className="my-1"><strong>Branch:</strong> <span className="font-sans uppercase">{student.branch}</span></p>
                  <p className="my-1"><strong>Sem:</strong> <span className="font-sans">{student.semester}</span></p>
                </div>
              </div>
            </div>

            {/* Main Particulars Table */}
            <div className="mb-4">
              {selectedLayout === 'staff' ? (
                /* Detailed Staff Bill Particulars Table */
                <table className="w-full text-[11px] text-left border-collapse border border-black">
                  <thead>
                    <tr className="border-b border-black bg-gray-50 font-bold uppercase text-[9px] tracking-wider">
                      <th className="border-r border-black p-2 w-12 text-center">Sl. no</th>
                      <th className="border-r border-black p-2">Fee head components particulars</th>
                      <th className="p-2 text-right w-36">Configured quota fee (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {components.map((comp, idx) => (
                      <tr key={idx} className="border-b border-gray-300">
                        <td className="border-r border-black p-2 text-center font-sans">{idx + 1}</td>
                        <td className="border-r border-black p-2 font-sans">{comp.name}</td>
                        <td className="p-2 text-right font-sans">{(Number(comp.amount) || 0).toLocaleString('en-IN')}.00</td>
                      </tr>
                    ))}
                    
                    {/* Summary Totals inside Table */}
                    <tr className="font-bold border-t-2 border-black bg-gray-50/50">
                      <td className="border-r border-black"></td>
                      <td className="border-r border-black p-2 text-right uppercase text-[9px]">1. Total Annual Fee (Quota base):</td>
                      <td className="p-2 text-right font-sans">₹{(fees?.totalFee || 0).toLocaleString('en-IN')}.00</td>
                    </tr>
                    <tr className="font-bold border-t border-gray-200 text-green-700 bg-green-50/20">
                      <td className="border-r border-black"></td>
                      <td className="border-r border-black p-2 text-right uppercase text-[9px]">2. Cleared in this transaction:</td>
                      <td className="p-2 text-right font-sans">₹{(Number(payment.amount) || 0).toLocaleString('en-IN')}.00</td>
                    </tr>
                    <tr className="font-bold border-t border-gray-200 text-green-700 bg-green-50/10">
                      <td className="border-r border-black"></td>
                      <td className="border-r border-black p-2 text-right uppercase text-[9px]">3. Total Fees Paid to Date:</td>
                      <td className="p-2 text-right font-sans">₹{(fees?.amountPaid || 0).toLocaleString('en-IN')}.00</td>
                    </tr>
                    <tr className="font-bold border-t border-gray-200 text-red-600 bg-red-50/20">
                      <td className="border-r border-black"></td>
                      <td className="border-r border-black p-2 text-right uppercase text-[9px]">4. Outstanding Balance Dues:</td>
                      <td className="p-2 text-right font-sans">₹{(fees?.balanceDue || 0).toLocaleString('en-IN')}.00</td>
                    </tr>
                    {fees?.fine > 0 && (
                      <tr className="font-bold border-t border-gray-200 text-yellow-700 bg-yellow-50/20">
                        <td className="border-r border-black"></td>
                        <td className="border-r border-black p-2 text-right uppercase text-[9px]">5. Overdue Fines Accumulated:</td>
                        <td className="p-2 text-right font-sans">₹{(fees.fine).toLocaleString('en-IN')}.00</td>
                      </tr>
                    )}
                    <tr className="font-bold border-t-2 border-black bg-gray-100 text-violet-700">
                      <td className="border-r border-black"></td>
                      <td className="border-r border-black p-2 text-right uppercase text-[10px]">Net Dues Outstanding (Incl. Fine):</td>
                      <td className="p-2 text-right font-sans font-black">₹{(fees?.netPayableNow || 0).toLocaleString('en-IN')}.00</td>
                    </tr>
                  </tbody>
                </table>
              ) : (
                /* Student Simplified Receipt Table */
                <table className="w-full text-[11px] text-left border-collapse border border-black">
                  <thead>
                    <tr className="border-b border-black bg-gray-50 font-bold uppercase text-[9px] tracking-wider">
                      <th className="border-r border-black p-2 w-12 text-center">Sl. no</th>
                      <th className="border-r border-black p-2">Particulars description</th>
                      <th className="p-2 text-right w-36">Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-black">
                      <td className="border-r border-black p-3.5 text-center font-sans">1</td>
                      <td className="border-r border-black p-3.5 font-sans">
                        College Fees Payment (Installment Clearance)
                        {payment.remarks && <span className="text-[10px] text-gray-500 block italic font-serif">Remarks: {payment.remarks}</span>}
                      </td>
                      <td className="p-3.5 text-right font-sans">{(Number(payment.amount) || 0).toLocaleString('en-IN')}.00</td>
                    </tr>
                    <tr className="font-bold border-t border-black bg-gray-50 text-green-700">
                      <td className="border-r border-black"></td>
                      <td className="border-r border-black p-2 text-right uppercase text-[9px]">TOTAL RECEIVED:</td>
                      <td className="p-2 text-right font-sans">{(Number(payment.amount) || 0).toLocaleString('en-IN')}.00</td>
                    </tr>
                  </tbody>
                </table>
              )}
            </div>

            {/* Overall Balances Block for Student copy (Tally-style summary card at bottom of simple layout) */}
            {selectedLayout === 'student' && (
              <div className="border border-black rounded p-3 mb-4 bg-gray-50/20 text-xs">
                <h4 className="font-bold border-b border-black pb-1 mb-2 uppercase text-[9px] tracking-wider">Balance Status</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div>
                    <span className="text-gray-500 block text-[9px] uppercase">Quota Base Fee</span>
                    <span className="font-sans font-bold">₹{(fees?.totalFee || 0).toLocaleString('en-IN')}</span>
                  </div>
                  <div>
                    <span className="text-green-600 block text-[9px] uppercase">Dues Cleared</span>
                    <span className="font-sans font-bold text-green-700">₹{(fees?.amountPaid || 0).toLocaleString('en-IN')}</span>
                  </div>
                  <div>
                    <span className="text-red-600 block text-[9px] uppercase">Balance Due</span>
                    <span className="font-sans font-bold text-red-600">₹{(fees?.balanceDue || 0).toLocaleString('en-IN')}</span>
                  </div>
                  <div>
                    <span className="text-violet-600 block text-[9px] uppercase">Net Dues Outstanding</span>
                    <span className="font-sans font-bold text-violet-700">₹{(fees?.netPayableNow || 0).toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>
            )}


            {/* Narration and currency verbal summary */}
            <div className="border border-black p-3 rounded mb-4 text-[10px] space-y-1.5 font-sans leading-relaxed">
              <p className="m-0">
                <strong>Narration:</strong> <span className="uppercase">{payment.mode} TRANSFER TO COLLEGE ACCOUNT ON {dateFormatted} RS.{payment.amount} UTR/REF NO: {payment.referenceNo}</span>
              </p>
              <div className="border-t border-gray-200 pt-1.5 flex justify-between font-serif text-[11px]">
                <span><strong>Received Rupees:</strong> <span className="italic font-bold">{wordsAmount} Rupees Only</span></span>
              </div>
            </div>

            {/* Print Signatures & Verification QR code */}
            <div className="flex justify-between items-end mt-12">
              <div className="flex items-center gap-3">
                <div className="border border-black p-1 bg-white">
                  <QRCodeSVG value={qrValue} size={50} level="M" />
                </div>
                <div className="text-[8px] text-gray-600 max-w-[200px] leading-tight font-sans">
                  <p className="font-bold uppercase m-0">Receipt Token</p>
                  <p className="m-0">Scan code to verify transaction logs validity on the campus ERP server.</p>
                </div>
              </div>

              <div className="text-center w-48 border-t border-black pt-2 text-[10px]">
                <p className="font-bold uppercase tracking-wider font-sans m-0 leading-none">Cashier/Accountant</p>
                <p className="text-[8px] text-gray-500 mt-1 m-0 font-sans">Ghousia Accounts Signature</p>
              </div>
            </div>

          </div>
        </div>

        {/* Modal Footer Controls (visible only on screen) */}
        <div className="flex justify-end mt-4 pt-4 border-t border-gray-800 no-print">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/5 hover:border-white/10 rounded-xl text-xs font-bold transition cursor-pointer"
          >
            Close Preview
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReceiptView;
