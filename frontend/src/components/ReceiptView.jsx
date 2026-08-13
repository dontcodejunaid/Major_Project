import React, { useState } from 'react';
import { createPortal } from 'react-dom';
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

  const renderReceiptBody = () => (
    <div className="w-full text-black font-serif px-1 py-1 flex flex-col justify-between min-h-[560px] h-full">
      <div className="flex-1 flex flex-col justify-between">
        <div>
          {/* Ghousia branded header with official crest */}
          <div className="flex items-center justify-center gap-3 pb-1 mb-2 border-b border-black text-center">
            <img src="/ghousia_logo.png" alt="Ghousia Emblem" className="w-11 h-11 object-contain rounded-full border border-black/30 flex-shrink-0" />
            <div>
              <h1 className="text-sm sm:text-base font-bold tracking-wide uppercase m-0 leading-tight">GHOUSIA COLLEGE OF ENGINEERING</h1>
              <p className="text-[9px] uppercase font-bold m-0 tracking-wider">RAMANAGARAM</p>
              <p className="text-[7.5px] italic m-0">(Owned & Managed by G.I.E.T., BANGALORE)</p>
              <h3 className="text-[9.5px] font-bold uppercase tracking-widest mt-0.5 mb-0.5 underline">COLLEGE RECEIPT</h3>
            </div>
          </div>

          {/* Metadata Fields layout */}
          <div className="border border-black rounded text-[9.5px] p-1.5 mb-2 leading-tight">
            <div className="grid grid-cols-3 gap-1.5">
              <div>
                <p className="my-0.5"><strong>No.</strong> <span className="font-sans font-bold">{payment.receiptNo}</span></p>
                <p className="my-0.5"><strong>Name:</strong> <span className="font-sans">{student.name}</span></p>
              </div>
              <div className="border-l border-r border-black/10 px-2">
                <p className="my-0.5"><strong>Date:</strong> <span className="font-sans">{dateFormatted}</span></p>
                <p className="my-0.5"><strong>Reg No.</strong> <span className="font-sans font-mono uppercase">{student.usn}</span></p>
              </div>
              <div className="pl-2">
                <p className="my-0.5"><strong>Branch:</strong> <span className="font-sans uppercase">{student.branch}</span></p>
                <p className="my-0.5"><strong>Sem:</strong> <span className="font-sans">{student.semester}</span></p>
              </div>
            </div>
          </div>

          {/* Main Particulars Table */}
          <div className="mb-2">
            {selectedLayout === 'staff' ? (
              /* Detailed Staff Bill Particulars Table */
              <table className="w-full text-[9px] text-left border-collapse border border-black">
                <thead>
                  <tr className="border-b border-black bg-gray-50 font-bold uppercase text-[7.5px] tracking-wider">
                    <th className="border-r border-black p-1 w-8 text-center">Sl. no</th>
                    <th className="border-r border-black p-1">Fee head components particulars</th>
                    <th className="p-1 text-right w-28">Configured quota fee (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {components.map((comp, idx) => (
                    <tr key={idx} className="border-b border-gray-300">
                      <td className="border-r border-black p-1 text-center font-sans">{idx + 1}</td>
                      <td className="border-r border-black p-1 px-1.5 font-sans">{comp.name}</td>
                      <td className="p-1 px-1.5 text-right font-sans">{(Number(comp.amount) || 0).toLocaleString('en-IN')}.00</td>
                    </tr>
                  ))}
                  
                  {/* Summary Totals inside Table */}
                  <tr className="font-bold border-t-2 border-black bg-gray-50/50">
                    <td className="border-r border-black"></td>
                    <td className="border-r border-black p-1 px-1.5 text-right uppercase text-[7.5px]">1. Total Annual Fee (Quota base):</td>
                    <td className="p-1 px-1.5 text-right font-sans">₹{(fees?.totalFee || 0).toLocaleString('en-IN')}.00</td>
                  </tr>
                  <tr className="font-bold border-t border-gray-200 text-green-700 bg-green-50/20">
                    <td className="border-r border-black"></td>
                    <td className="border-r border-black p-1 px-1.5 text-right uppercase text-[7.5px]">2. Cleared in this transaction:</td>
                    <td className="p-1 px-1.5 text-right font-sans">₹{(Number(payment.amount) || 0).toLocaleString('en-IN')}.00</td>
                  </tr>
                  <tr className="font-bold border-t border-gray-200 text-green-700 bg-green-50/10">
                    <td className="border-r border-black"></td>
                    <td className="border-r border-black p-1 px-1.5 text-right uppercase text-[7.5px]">3. Total Fees Paid to Date:</td>
                    <td className="p-1 px-1.5 text-right font-sans">₹{(fees?.amountPaid || 0).toLocaleString('en-IN')}.00</td>
                  </tr>
                  <tr className="font-bold border-t border-gray-200 text-red-600 bg-red-50/20">
                    <td className="border-r border-black"></td>
                    <td className="border-r border-black p-1 px-1.5 text-right uppercase text-[7.5px]">4. Outstanding Balance Dues:</td>
                    <td className="p-1 px-1.5 text-right font-sans">₹{(fees?.balanceDue || 0).toLocaleString('en-IN')}.00</td>
                  </tr>
                  {fees?.fine > 0 && (
                    <tr className="font-bold border-t border-gray-200 text-yellow-700 bg-yellow-50/20">
                      <td className="border-r border-black"></td>
                      <td className="border-r border-black p-1 px-1.5 text-right uppercase text-[7.5px]">5. Overdue Fines Accumulated:</td>
                      <td className="p-1 px-1.5 text-right font-sans">₹{(fees.fine).toLocaleString('en-IN')}.00</td>
                    </tr>
                  )}
                  <tr className="font-bold border-t-2 border-black bg-gray-100 text-violet-700">
                    <td className="border-r border-black"></td>
                    <td className="border-r border-black p-1 px-1.5 text-right uppercase text-[8px]">Net Dues Outstanding (Incl. Fine):</td>
                    <td className="p-1 px-1.5 text-right font-sans font-black">₹{(fees?.netPayableNow || 0).toLocaleString('en-IN')}.00</td>
                  </tr>
                </tbody>
              </table>
            ) : (
              /* Student Simplified Receipt Table with 7 Blank Rows to fill out full A5 sheet */
              <table className="w-full text-[9px] text-left border-collapse border border-black">
                <thead>
                  <tr className="border-b border-black bg-gray-50 font-bold uppercase text-[7.5px] tracking-wider">
                    <th className="border-r border-black p-1 w-8 text-center">Sl. no</th>
                    <th className="border-r border-black p-1">Particulars description</th>
                    <th className="p-1 text-right w-28">Amount (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-gray-400 h-9">
                    <td className="border-r border-black p-1 text-center font-sans font-bold">1</td>
                    <td className="border-r border-black p-1 font-sans align-top">
                      College Fees Payment (Installment Clearance)
                      {payment.remarks && <span className="text-[8px] text-gray-500 block italic font-serif">Remarks: {payment.remarks}</span>}
                    </td>
                    <td className="p-1 text-right font-sans font-bold align-top">{(Number(payment.amount) || 0).toLocaleString('en-IN')}.00</td>
                  </tr>
                  {/* 9 Blank rows (rows 2 to 10) for 10 total rows in particulars table */}
                  {[2, 3, 4, 5, 6, 7, 8, 9, 10].map((rowNum) => (
                    <tr key={rowNum} className="border-b border-gray-300 h-6">
                      <td className="border-r border-black p-0.5 text-center font-sans text-gray-300">{rowNum}</td>
                      <td className="border-r border-black p-0.5 font-sans">&nbsp;</td>
                      <td className="p-0.5 text-right font-sans">&nbsp;</td>
                    </tr>
                  ))}
                  <tr className="font-bold border-t-2 border-black bg-gray-50 text-green-700">
                    <td className="border-r border-black"></td>
                    <td className="border-r border-black p-1 text-right uppercase text-[7.5px]">TOTAL RECEIVED:</td>
                    <td className="p-1 text-right font-sans text-[10px]">{(Number(payment.amount) || 0).toLocaleString('en-IN')}.00</td>
                  </tr>
                </tbody>
              </table>
            )}
          </div>

          {/* Overall Balances Block for Student copy */}
          {selectedLayout === 'student' && (
            <div className="border border-black rounded p-1.5 mb-2 bg-gray-50/20 text-[9px]">
              <h4 className="font-bold border-b border-black pb-0.5 mb-1 uppercase text-[7.5px] tracking-wider">Balance Status</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-1.5 text-center">
                <div>
                  <span className="text-gray-500 block text-[7.5px] uppercase">Quota Base Fee</span>
                  <span className="font-sans font-bold">₹{(fees?.totalFee || 0).toLocaleString('en-IN')}</span>
                </div>
                <div>
                  <span className="text-green-600 block text-[7.5px] uppercase">Dues Cleared</span>
                  <span className="font-sans font-bold text-green-700">₹{(fees?.amountPaid || 0).toLocaleString('en-IN')}</span>
                </div>
                <div>
                  <span className="text-red-600 block text-[7.5px] uppercase">Balance Due</span>
                  <span className="font-sans font-bold text-red-600">₹{(fees?.balanceDue || 0).toLocaleString('en-IN')}</span>
                </div>
                <div>
                  <span className="text-violet-600 block text-[7.5px] uppercase">Net Dues Outstanding</span>
                  <span className="font-sans font-bold text-violet-700">₹{(fees?.netPayableNow || 0).toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>
          )}

          {/* Narration and currency verbal summary */}
          <div className="border border-black p-1.5 rounded mb-2 text-[8.5px] space-y-1 font-sans leading-tight">
            <p className="m-0">
              <strong>Narration:</strong> <span className="uppercase">{payment.mode} TRANSFER TO COLLEGE ACCOUNT ON {dateFormatted} RS.{payment.amount} UTR/REF NO: {payment.referenceNo}</span>
            </p>
            <div className="border-t border-gray-200 pt-1 flex justify-between font-serif text-[9px]">
              <span><strong>Received Rupees:</strong> <span className="italic font-bold">{wordsAmount} Rupees Only</span></span>
            </div>
          </div>
        </div>

        {/* Print Signatures & Verification QR code pinned to the bottom end of A5 sheet */}
        <div className="flex justify-between items-end pt-3 mt-auto border-t border-dashed border-gray-300">
          <div className="flex items-center gap-2">
            <div className="border border-black p-0.5 bg-white">
              <QRCodeSVG value={qrValue} size={40} level="M" />
            </div>
            <div className="text-[7.5px] text-gray-600 max-w-[170px] leading-tight font-sans">
              <p className="font-bold uppercase m-0">Receipt Token</p>
              <p className="m-0">Scan code to verify transaction validity on ERP server.</p>
            </div>
          </div>

          <div className="text-center w-44 border-t border-black pt-1 text-[8.5px]">
            <p className="font-bold uppercase tracking-wider font-sans m-0 leading-none">Cashier / Accountant</p>
            <p className="text-[7px] text-gray-500 mt-0.5 m-0 font-sans">Ghousia Accounts Signature</p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* On-Screen Modal View */}
      <div 
        onClick={onClose}
        className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-2 sm:p-4 backdrop-blur-sm no-print cursor-pointer"
      >
        <div 
          onClick={(e) => e.stopPropagation()}
          className="bg-[#16171d] border border-gray-800 rounded-2xl w-full max-w-2xl max-h-[94vh] flex flex-col p-2.5 sm:p-3.5 shadow-2xl animate-fade-in no-print cursor-default my-auto overflow-hidden"
        >
          
          {/* Modal Header controls */}
          <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-gray-800 flex-shrink-0 no-print">
            <div className="flex items-center gap-2">
              <ShieldCheck className="text-violet-500 w-4 h-4" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Receipt Preview <span className="bg-violet-500/20 text-violet-300 border border-violet-500/30 px-1.5 py-0.5 rounded text-[10px] font-normal normal-case ml-1">Standard A5 Paper Format</span>
              </h3>
            </div>

            <div className="flex items-center gap-2">
              {/* Toggle tabs for Staff & Admin only */}
              {isStaffOrAdmin && (
                <div className="bg-white/5 border border-white/5 p-0.5 rounded-lg flex gap-1 text-[10px] font-bold">
                  <button
                    onClick={() => setSelectedLayout('staff')}
                    className={`px-2.5 py-1 rounded-md transition cursor-pointer ${
                      selectedLayout === 'staff'
                        ? 'bg-violet-600 text-white'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    Staff Bill
                  </button>
                  <button
                    onClick={() => setSelectedLayout('student')}
                    className={`px-2.5 py-1 rounded-md transition cursor-pointer ${
                      selectedLayout === 'student'
                        ? 'bg-violet-600 text-white'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    Student Receipt
                  </button>
                </div>
              )}

              <button
                onClick={handlePrint}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-600 hover:bg-violet-500 text-white rounded-lg text-xs font-bold transition glow-btn cursor-pointer shadow-md shadow-violet-900/40"
                title="Print or Save receipt as PDF"
              >
                <Printer className="w-3.5 h-3.5" />
                Download / Print PDF
              </button>
              <button
                onClick={onClose}
                className="p-1.5 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/5 rounded-lg text-xs font-bold transition cursor-pointer"
                title="Close Preview"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* On-screen Printable Box */}
          <div className="bg-white text-black p-3 sm:p-4 rounded-xl flex-1 min-h-0 overflow-y-auto shadow-inner border border-gray-200 no-print">
            {renderReceiptBody()}
          </div>
        </div>
      </div>

      {/* Standalone Un-nested Print Container for browser print dialog */}
      {createPortal(
        <div id="print-area" className="print-area-standalone">
          {renderReceiptBody()}
        </div>,
        document.body
      )}
    </>
  );
};

export default ReceiptView;
