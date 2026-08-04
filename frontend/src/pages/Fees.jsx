import React, { useEffect, useState } from 'react';
import { api } from '../utils/api';
import { 
  Check, X, RefreshCw, Save, IndianRupee, Layout, 
  HelpCircle, Settings, FileText, ChevronRight
} from 'lucide-react';

const Fees = ({ user }) => {
  const [structures, setStructures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Selected structure for editing
  const [selectedStructure, setSelectedStructure] = useState(null);
  const [components, setComponents] = useState([]);

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
    // Clone components array to avoid editing direct state
    setComponents(struct.components.map(c => ({ ...c })));
  };

  const handleComponentChange = (index, value) => {
    const updated = [...components];
    updated[index].amount = Number(value) || 0;
    setComponents(updated);
  };

  const calculateTotal = () => {
    return components.reduce((sum, c) => sum + Number(c.amount || 0), 0);
  };

  const handleSave = async () => {
    if (!selectedStructure) return;
    
    setError('');
    setSuccess('');
    
    try {
      await api.put(`/fees/${selectedStructure._id}`, { components });
      setSuccess(`Fee structure for ${selectedStructure.quota} (${selectedStructure.academicYear}) updated successfully.`);
      
      // Refresh list
      const data = await api.get('/fees');
      setStructures(data);
      const updatedStruct = data.find(s => s._id === selectedStructure._id);
      if (updatedStruct) {
        setSelectedStructure(updatedStruct);
        setComponents(updatedStruct.components.map(c => ({ ...c })));
      }
      
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to update fee structure.');
    }
  };

  const totalFeeAmount = calculateTotal();

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Title */}
      <div>
        <h2 className="text-2xl font-black text-white glow-text">Fee Structure Matrix</h2>
        <p className="text-gray-400 text-xs mt-1">Configure admission base quotas, detail components breakdown, or update annual fee structures.</p>
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
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Admission Quotas</h3>
            <div className="space-y-2.5">
              {structures.map((struct) => {
                const isActive = selectedStructure?._id === struct._id;
                return (
                  <button
                    key={struct._id}
                    onClick={() => handleSelectStructure(struct)}
                    className={`w-full p-4 rounded-2xl border text-left transition flex items-center justify-between ${
                      isActive 
                        ? 'bg-violet-600/10 border-violet-500/40 text-white' 
                        : 'glass-card border-white/5 text-gray-300 hover:border-white/10'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black">{struct.quota} Quota</span>
                        <span className="text-[10px] uppercase font-bold text-gray-400 bg-white/5 border border-white/10 px-1.5 py-0.5 rounded">
                          {struct.academicYear}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">Annual Fee: ₹{struct.totalAmount.toLocaleString('en-IN')}</p>
                    </div>
                    <ChevronRight className={`w-4 h-4 transition ${isActive ? 'text-violet-400 transform translate-x-1' : 'text-gray-600'}`} />
                  </button>
                );
              })}
            </div>

            <div className="glass-panel rounded-2xl p-4 text-xs text-gray-400 space-y-2">
              <p className="font-bold text-white flex items-center gap-1.5">
                <Settings className="w-4 h-4 text-violet-400" />
                Administrative Policy Note:
              </p>
              <p>Changing these values will instantly update real-time fee balances, pending balances, and overdue calculations for all registered students belonging to the selected quota.</p>
            </div>
          </div>

          {/* Detailed Component Editor Panel */}
          {selectedStructure && (
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Detailed Breakdowns: {selectedStructure.quota} ({selectedStructure.academicYear})
                </h3>
                <button
                  onClick={handleSave}
                  className="px-3.5 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-bold transition glow-btn flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" /> Save Fee Matrix
                </button>
              </div>

              <div className="glass-panel rounded-2xl p-6 space-y-5">
                {/* Inputs list */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {components.map((comp, idx) => (
                    <div key={idx} className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                        {comp.name}
                      </label>
                      <div className="relative">
                        <IndianRupee className="absolute left-3.5 top-3 w-4 h-4 text-gray-500" />
                        <input
                          type="number"
                          value={comp.amount}
                          onChange={(e) => handleComponentChange(idx, e.target.value)}
                          className="w-full pl-9 pr-4 py-2.5 rounded-xl glass-input text-xs font-mono"
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Sum Total Summary Banner */}
                <div className="border-t border-gray-800 pt-5 flex justify-between items-center">
                  <div>
                    <h4 className="text-sm font-bold text-white">Aggregated Annual Fee Sum</h4>
                    <p className="text-xs text-gray-400 mt-0.5">Sum of itemized values above</p>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-black text-violet-400 glow-text font-mono">
                      ₹{totalFeeAmount.toLocaleString('en-IN')}.00
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Fees;
