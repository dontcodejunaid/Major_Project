import React, { useEffect, useState } from 'react';
import { api } from '../utils/api';
import { 
  Check, X, RefreshCw, Save, IndianRupee, Layout, 
  HelpCircle, Settings, FileText, ChevronRight, Plus, Trash2, 
  Building2, BookOpen, Layers, Sparkles, ChevronDown, ChevronUp, Download
} from 'lucide-react';
import * as XLSX from 'xlsx';

// 14 Official University Particulars
export const UNIV_FEE_HEADS = [
  'University Registration Fee',
  'Renewal of Registration Fee',
  'Eligibility Fee-(Karnataka Students)',
  'E-Resource Consortium Fee',
  'E-Learning Fee',
  'University Sports fee',
  'University sports development fee',
  'University career guidance',
  'University students / teachers Devt.',
  'University development fund',
  'University cultural activities fee',
  'Red Cross Membership Fee',
  'Women Cell Fee',
  'NSS Fee'
];

// 28 Official College Miscellaneous Particulars from Ghousia 2026-2027 Schedule
export const MISC_FEE_HEADS = [
  'College Admission Regn. Fee',
  'Admission Application Fee',
  'Internal Examination Fee',
  'College Maintenance Fee',
  'ERP Software fee',
  'College Sports Fee',
  'Department Association Fee',
  'Reading Room Fee',
  'Medical Fee',
  'Magazine Fee',
  'Identity Card Fee',
  'Library Fee',
  'College Day Fee',
  'Laboratory Equipment Maintenance Fee',
  'Computer Facilities Fee',
  'Internet Facility Fee',
  'Students Group Insurance Fee',
  'H.R. Fee',
  'Innovation Centre Fee',
  'Hand Book',
  'Bank & University processing fee',
  'Co-operative Society Shares',
  'ISTE Students Chapter Fee',
  'AICTE Activity Fee',
  'Teachers Day Flag',
  'Alumni Association Fee',
  'Course Completion Certificate',
  'Gruaduation Day Fee'
];

const Fees = ({ user }) => {
  const [structures, setStructures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Selected structure for editing
  const [selectedStructure, setSelectedStructure] = useState(null);
  const [components, setComponents] = useState([]);
  const [miscBreakdown, setMiscBreakdown] = useState([]);
  const [activeTab, setActiveTab] = useState('summary'); // 'summary' | 'misc' | 'university'

  const fetchFeeStructures = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.get('/fees');
      setStructures(data);
      if (data.length > 0) {
        handleSelectStructure(data[0]);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to fetch fee structures.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeeStructures();
  }, []);

  const handleSelectStructure = (struct) => {
    setSelectedStructure(struct);
    
    // Components
    const comps = struct.components ? struct.components.map(c => ({ ...c })) : [];
    setComponents(comps);

    // Misc breakdown 28 heads
    let misc = struct.miscBreakdown && Array.isArray(struct.miscBreakdown) && struct.miscBreakdown.length > 0
      ? struct.miscBreakdown.map(c => ({ ...c }))
      : MISC_FEE_HEADS.map(name => ({ name, amount: 0 }));
    
    // Ensure all 28 heads exist in miscBreakdown
    const existingMiscMap = {};
    misc.forEach(m => { existingMiscMap[m.name] = m.amount; });
    const fullMisc = MISC_FEE_HEADS.map(name => ({
      name,
      amount: Number(existingMiscMap[name] || 0)
    }));

    setMiscBreakdown(fullMisc);
  };

  const handleComponentChange = (index, value) => {
    const updated = [...components];
    updated[index].amount = Number(value) || 0;
    setComponents(updated);
  };

  const handleMiscHeadChange = (index, value) => {
    const updated = [...miscBreakdown];
    updated[index].amount = Number(value) || 0;
    setMiscBreakdown(updated);

    // Automatically recalculate and sync "Total Miscelleneous Fee" component in main breakdown!
    const newMiscTotal = updated.reduce((sum, c) => sum + Number(c.amount || 0), 0);
    const updatedComponents = [...components];
    const miscCompIdx = updatedComponents.findIndex(c => c.name.toLowerCase().includes('miscellen') || c.name.toLowerCase().includes('misc'));
    if (miscCompIdx >= 0) {
      updatedComponents[miscCompIdx].amount = newMiscTotal;
      setComponents(updatedComponents);
    }
  };

  const calculateTotal = () => {
    return components.reduce((sum, c) => sum + Number(c.amount || 0), 0);
  };

  const calculateUniversityFeeTotal = () => {
    return components
      .filter(c => UNIV_FEE_HEADS.includes(c.name))
      .reduce((sum, c) => sum + Number(c.amount || 0), 0);
  };

  const calculateMiscFeeTotal = () => {
    return miscBreakdown.reduce((sum, c) => sum + Number(c.amount || 0), 0);
  };

  const handleSave = async () => {
    if (!selectedStructure) return;
    
    setError('');
    setSuccess('');

    // Ensure Total Miscelleneous Fee matches miscBreakdown sum
    const totalMisc = calculateMiscFeeTotal();
    const updatedComponents = [...components];
    const miscIdx = updatedComponents.findIndex(c => c.name.toLowerCase().includes('miscellen') || c.name.toLowerCase().includes('misc'));
    if (miscIdx >= 0) {
      updatedComponents[miscIdx].amount = totalMisc;
    } else {
      updatedComponents.push({ name: 'Total Miscelleneous Fee', amount: totalMisc });
    }
    
    try {
      await api.put(`/fees/${selectedStructure._id}`, { 
        components: updatedComponents,
        miscBreakdown 
      });
      setSuccess(`Fee structure & 28 Misc particulars for ${selectedStructure.quota} (${selectedStructure.academicYear}) saved successfully.`);
      
      // Refresh list
      const data = await api.get('/fees');
      setStructures(data);
      const updatedStruct = data.find(s => s._id === selectedStructure._id);
      if (updatedStruct) {
        handleSelectStructure(updatedStruct);
      }
      
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to update fee structure.');
    }
  };

  // Export Fee Schedule Matrix to Excel Sheet (Fully itemized with all 28 Misc Particulars)
  const handleExportScheduleExcel = () => {
    if (!selectedStructure) return;

    const wb = XLSX.utils.book_new();

    // 1. Fully itemized complete schedule rows
    const fullScheduleRows = [];
    let slNo = 1;

    // Add Tuition Fee
    const tuitionComp = components.find(c => c.name === 'Tuition Fee');
    fullScheduleRows.push({
      'Sl No.': slNo++,
      'Particulars of Fee': 'Tuition Fee',
      'Category': 'Tuition Base',
      'Amount (₹)': tuitionComp ? Number(tuitionComp.amount || 0) : 0
    });

    // Add 14 University Particulars
    components
      .filter(c => UNIV_FEE_HEADS.includes(c.name))
      .forEach(c => {
        fullScheduleRows.push({
          'Sl No.': slNo++,
          'Particulars of Fee': c.name,
          'Category': 'University Fee',
          'Amount (₹)': Number(c.amount || 0)
        });
      });

    // University Subtotal
    fullScheduleRows.push({
      'Sl No.': '',
      'Particulars of Fee': 'Total University Fee',
      'Category': 'SUBTOTAL',
      'Amount (₹)': calculateUniversityFeeTotal()
    });

    // Add all 28 College Miscellaneous Particulars
    miscBreakdown.forEach((m, idx) => {
      fullScheduleRows.push({
        'Sl No.': slNo++,
        'Particulars of Fee': m.name,
        'Category': 'College Miscellaneous Fee',
        'Amount (₹)': Number(m.amount || 0)
      });
    });

    // Miscellaneous Subtotal
    fullScheduleRows.push({
      'Sl No.': '',
      'Particulars of Fee': 'Total College Misc. Fee',
      'Category': 'SUBTOTAL',
      'Amount (₹)': calculateMiscFeeTotal()
    });

    // Grand Total Annual Fee
    fullScheduleRows.push({
      'Sl No.': '',
      'Particulars of Fee': 'TOTAL ANNUAL FEE (University + Tuition + Misc)',
      'Category': 'GRAND TOTAL',
      'Amount (₹)': calculateTotal()
    });

    const wsFull = XLSX.utils.json_to_sheet(fullScheduleRows);

    // Set column widths so text is not cut off in Excel
    wsFull['!cols'] = [
      { wch: 8 },  // Sl No.
      { wch: 44 }, // Particulars of Fee
      { wch: 28 }, // Category
      { wch: 16 }  // Amount (₹)
    ];

    XLSX.utils.book_append_sheet(wb, wsFull, `${selectedStructure.quota} Complete Breakdown`);

    // Sheet 2: 28 College Miscellaneous Fee Heads (Stand-alone schedule matching official sheet)
    const miscData = miscBreakdown.map((m, i) => ({
      'Sl.': i + 1,
      'Particulars of Fee': m.name,
      'I Year B.E': Number(m.amount || 0),
      'II Year (D.L.E)': Number(m.amount || 0),
      'II Year B.E': Number(m.amount || 0),
      'III Year B.E': Number(m.amount || 0),
      'IV Year B.E': Number(m.amount || 0),
      'I Year M.Tech': Number(m.amount || 0),
      'II Year M.Tech': Number(m.amount || 0)
    }));
    miscData.push({
      'Sl.': '',
      'Particulars of Fee': 'Total College Misc. Fee',
      'I Year B.E': calculateMiscFeeTotal(),
      'II Year (D.L.E)': calculateMiscFeeTotal(),
      'II Year B.E': calculateMiscFeeTotal(),
      'III Year B.E': calculateMiscFeeTotal(),
      'IV Year B.E': calculateMiscFeeTotal(),
      'I Year M.Tech': calculateMiscFeeTotal(),
      'II Year M.Tech': calculateMiscFeeTotal()
    });
    const ws2 = XLSX.utils.json_to_sheet(miscData);
    ws2['!cols'] = [
      { wch: 6 },
      { wch: 42 },
      { wch: 14 },
      { wch: 14 },
      { wch: 14 },
      { wch: 14 },
      { wch: 14 },
      { wch: 14 },
      { wch: 14 }
    ];
    XLSX.utils.book_append_sheet(wb, ws2, 'College Misc Fee (28 Heads)');

    XLSX.writeFile(wb, `Ghousia_Fee_Breakdown_${selectedStructure.quota}_${selectedStructure.academicYear}.xlsx`);
  };

  const totalFeeAmount = calculateTotal();
  const totalUniversityFee = calculateUniversityFeeTotal();
  const totalMiscFee = calculateMiscFeeTotal();

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white glow-text">Fee Structure Matrix</h2>
          <p className="text-gray-400 text-xs mt-1">
            Ghousia College of Engineering (2026-2027 Schedule) • 14 University Heads + 28 College Misc. Particulars
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportScheduleExcel}
            className="px-3.5 py-2 bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-400 border border-emerald-500/20 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" /> Export Excel Sheet
          </button>
          <button
            onClick={fetchFeeStructures}
            className="px-3 py-2 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
        </div>
      </div>

      {/* Message banners */}
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
          <p className="text-gray-400 text-xs font-medium">Syncing fee structures matrices...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Quotas selector panel */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Admission Quotas & Batches</h3>
            <div className="space-y-2.5">
              {structures.map((struct) => {
                const isActive = selectedStructure?._id === struct._id;
                return (
                  <button
                    key={struct._id}
                    onClick={() => handleSelectStructure(struct)}
                    className={`w-full p-4 rounded-2xl border text-left transition flex items-center justify-between cursor-pointer ${
                      isActive 
                        ? 'bg-violet-600/10 border-violet-500/40 text-white' 
                        : 'glass-card border-white/5 text-gray-300 hover:border-white/10'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black">{struct.quota} Quota</span>
                        <span className="text-[10px] uppercase font-bold text-violet-400 bg-violet-500/10 border border-violet-500/20 px-2 py-0.5 rounded">
                          {struct.academicYear}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 mt-1 font-mono">
                        Annual Fee: ₹{struct.totalAmount.toLocaleString('en-IN')}
                      </p>
                    </div>
                    <ChevronRight className={`w-4 h-4 transition ${isActive ? 'text-violet-400 transform translate-x-1' : 'text-gray-600'}`} />
                  </button>
                );
              })}
            </div>

            {/* Quick summary badges */}
            <div className="glass-panel rounded-2xl p-4 text-xs text-gray-400 space-y-3">
              <p className="font-bold text-white flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-violet-400" />
                Ghousia Fee Breakdown Summary
              </p>
              <div className="space-y-1.5">
                <div className="flex justify-between items-center p-2 rounded-lg bg-white/[0.02]">
                  <span className="text-[11px] text-gray-300">University Fee (14 Heads):</span>
                  <span className="font-mono font-bold text-cyan-400">₹{totalUniversityFee.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between items-center p-2 rounded-lg bg-white/[0.02]">
                  <span className="text-[11px] text-gray-300">Miscellaneous Fee (28 Heads):</span>
                  <span className="font-mono font-bold text-amber-400">₹{totalMiscFee.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between items-center p-2 rounded-lg bg-violet-600/10 border border-violet-500/20">
                  <span className="text-[11px] font-bold text-white">Grand Annual Total:</span>
                  <span className="font-mono font-bold text-violet-300">₹{totalFeeAmount.toLocaleString('en-IN')}</span>
                </div>
              </div>
              <p className="text-[10px] text-gray-500 italic mt-2">
                All 28 miscellaneous particulars sum automatically into "Total Miscelleneous Fee" and are recorded in the connected DAY BOOK Excel sheet.
              </p>
            </div>
          </div>

          {/* Detailed Component Editor Panel with Sub-tabs */}
          {selectedStructure && (
            <div className="lg:col-span-2 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                {/* Tabs */}
                <div className="flex items-center gap-1 p-1 bg-white/5 border border-white/5 rounded-xl text-xs font-bold">
                  <button
                    onClick={() => setActiveTab('summary')}
                    className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                      activeTab === 'summary' 
                        ? 'bg-violet-600 text-white shadow-md' 
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    Main Matrix Summary
                  </button>
                  <button
                    onClick={() => setActiveTab('misc')}
                    className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                      activeTab === 'misc' 
                        ? 'bg-amber-600 text-white shadow-md' 
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    <span>28 Misc Particulars</span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-black/30 font-mono">
                      ₹{totalMiscFee.toLocaleString('en-IN')}
                    </span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSave}
                    className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-bold transition glow-btn flex items-center gap-1.5 shadow-lg shadow-violet-900/40 cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" /> Save Fee Matrix
                  </button>
                </div>
              </div>

              <div className="glass-panel rounded-2xl p-5 space-y-4">
                {activeTab === 'summary' ? (
                  <>
                    {/* Summary Totals Banner */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-xl bg-white/[0.02] border border-white/5">
                      <div>
                        <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider block">University Total</span>
                        <span className="text-base font-bold text-cyan-400 font-mono">₹{totalUniversityFee.toLocaleString('en-IN')}.00</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider block">Miscelleneous Total (28 Heads)</span>
                        <span className="text-base font-bold text-amber-400 font-mono">₹{totalMiscFee.toLocaleString('en-IN')}.00</span>
                      </div>
                      <div className="sm:text-right">
                        <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider block">Aggregated Annual Total</span>
                        <span className="text-lg font-black text-violet-400 glow-text font-mono">₹{totalFeeAmount.toLocaleString('en-IN')}.00</span>
                      </div>
                    </div>

                    {/* Main Components list */}
                    <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
                      {components.map((comp, idx) => {
                        const isMisc = comp.name.toLowerCase().includes('miscellen') || comp.name.toLowerCase().includes('misc');
                        return (
                          <div 
                            key={idx} 
                            className={`flex items-center gap-2 p-2 rounded-xl border transition ${
                              isMisc 
                                ? 'bg-amber-500/5 border-amber-500/20' 
                                : 'bg-white/[0.02] border-white/5 hover:border-white/10'
                            }`}
                          >
                            <span className="w-6 text-center text-xs font-mono font-bold text-gray-500">
                              {idx + 1}
                            </span>
                            
                            <div className="flex-1">
                              <span className={`text-xs font-semibold ${isMisc ? 'text-amber-300 font-bold' : 'text-white'}`}>
                                {comp.name}
                              </span>
                              {isMisc && (
                                <button
                                  type="button"
                                  onClick={() => setActiveTab('misc')}
                                  className="text-[10px] text-amber-400 hover:underline block cursor-pointer"
                                >
                                  ↳ Click to view/edit all 28 itemized particulars
                                </button>
                              )}
                            </div>

                            <div className="relative w-36 sm:w-44 flex-shrink-0">
                              <IndianRupee className="absolute left-2.5 top-2 w-3.5 h-3.5 text-gray-500" />
                              <input
                                type="number"
                                value={comp.amount}
                                disabled={isMisc}
                                onWheel={(e) => e.currentTarget.blur()}
                                onChange={(e) => handleComponentChange(idx, e.target.value)}
                                className={`w-full pl-7 pr-3 py-1.5 rounded-lg text-xs font-mono font-bold text-right ${
                                  isMisc ? 'bg-amber-500/10 text-amber-300 cursor-not-allowed border border-amber-500/30' : 'glass-input'
                                }`}
                                placeholder="0.00"
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                ) : (
                  /* 28 Miscellaneous Fee Breakdown Sub-Tab */
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                      <div>
                        <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wide">College Miscellaneous Fee Breakdown (28 Heads)</h4>
                        <p className="text-[10px] text-amber-200/70 mt-0.5">
                          As per official Ghousia College schedule. The sum automatically syncs to Total Miscelleneous Fee.
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-gray-400 uppercase block font-bold">Sum Total</span>
                        <span className="text-lg font-bold text-amber-400 font-mono">₹{totalMiscFee.toLocaleString('en-IN')}.00</span>
                      </div>
                    </div>

                    <div className="space-y-2 max-h-[440px] overflow-y-auto pr-1">
                      {miscBreakdown.map((head, idx) => (
                        <div key={idx} className="flex items-center gap-2 p-2 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition">
                          <span className="w-6 text-center text-xs font-mono font-bold text-gray-500">
                            {idx + 1}
                          </span>
                          <span className="flex-1 text-xs font-medium text-gray-200">
                            {head.name}
                          </span>
                          <div className="relative w-32 sm:w-40 flex-shrink-0">
                            <IndianRupee className="absolute left-2.5 top-2 w-3.5 h-3.5 text-gray-500" />
                            <input
                              type="number"
                              value={head.amount}
                              onWheel={(e) => e.currentTarget.blur()}
                              onChange={(e) => handleMiscHeadChange(idx, e.target.value)}
                              className="w-full pl-7 pr-3 py-1.5 rounded-lg glass-input text-xs font-mono font-bold text-right"
                              placeholder="0.00"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Fees;
