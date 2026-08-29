import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import {
  Sparkles, TrendingUp, AlertTriangle, ShieldAlert,
  Bot, Send, RefreshCw, BarChart2, CheckCircle2,
  HelpCircle, ArrowRight, Activity, DollarSign,
  PieChart as PieIcon, ChevronRight, Zap, Target, Layers
} from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
  Tooltip, CartesianGrid, Legend, AreaChart, Area
} from 'recharts';

const AiAnalytics = ({ user }) => {
  const [activeTab, setActiveTab] = useState('insights'); // 'insights' | 'forecast' | 'risk' | 'anomalies' | 'assistant'
  
  // State for AI endpoints
  const [insights, setInsights] = useState(null);
  const [forecast, setForecast] = useState(null);
  const [riskData, setRiskData] = useState(null);
  const [anomalies, setAnomalies] = useState(null);
  
  // Loading states
  const [loading, setLoading] = useState(false);
  const [tabLoading, setTabLoading] = useState({});

  // Assistant states
  const [messages, setMessages] = useState([
    {
      sender: 'assistant',
      text: `Hello ${user.name}! I am your **Ghousia College AI Financial Analytics Assistant** powered by Google Gemini. How can I help you analyze fee collections, branch metrics, or overdue trends today?`
    }
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [assistantLoading, setAssistantLoading] = useState(false);

  // Quick prompt suggestions
  const promptSuggestions = [
    "How much total fee did we collect so far?",
    "Which branch has the highest outstanding dues?",
    "Show me payment mode distribution",
    "What is the late-payment default risk across students?",
    "Summarize recent high-value transactions"
  ];

  // Fetch data per tab
  const fetchTabData = async (tab) => {
    setTabLoading(prev => ({ ...prev, [tab]: true }));
    try {
      if (tab === 'insights') {
        const res = await api.get('/ai/insights');
        setInsights(res);
      } else if (tab === 'forecast') {
        const res = await api.get('/ai/forecast');
        setForecast(res);
      } else if (tab === 'risk') {
        const res = await api.get('/ai/risk-prediction');
        setRiskData(res);
      } else if (tab === 'anomalies') {
        const res = await api.get('/ai/anomalies');
        setAnomalies(res);
      }
    } catch (err) {
      console.error(`Error loading AI data for ${tab}:`, err);
    } finally {
      setTabLoading(prev => ({ ...prev, [tab]: false }));
    }
  };

  useEffect(() => {
    fetchTabData(activeTab);
  }, [activeTab]);

  const handleSendQuery = async (queryText = null) => {
    const textToSend = queryText || inputQuery;
    if (!textToSend.trim() || assistantLoading) return;

    const userMessage = { sender: 'user', text: textToSend };
    setMessages(prev => [...prev, userMessage]);
    setInputQuery('');
    setAssistantLoading(true);

    try {
      const response = await api.post('/ai/assistant', { question: textToSend });
      setMessages(prev => [...prev, {
        sender: 'assistant',
        text: response.answer
      }]);
    } catch (err) {
      setMessages(prev => [...prev, {
        sender: 'assistant',
        text: "⚠️ Sorry, I encountered an issue contacting the Gemini model. Please ensure the backend is running properly."
      }]);
    } finally {
      setAssistantLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header Banner */}
      <div className="glass-panel p-6 rounded-2xl border border-violet-500/20 relative overflow-hidden bg-gradient-to-r from-violet-950/40 via-purple-950/20 to-transparent">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-xl shadow-lg shadow-violet-600/30 text-white animate-pulse">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black text-white tracking-wide">Gemini AI Analytics & Intelligence Hub</h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-violet-500/20 text-violet-300 border border-violet-500/30 uppercase tracking-widest">
                  Google Gemini Powered
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Institutional predictive intelligence, machine-learning risk modeling, and controlled financial reasoning for Ghousia College of Engineering.
              </p>
            </div>
          </div>

          <button
            onClick={() => fetchTabData(activeTab)}
            disabled={tabLoading[activeTab]}
            className="flex items-center gap-2 px-4 py-2 bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 rounded-xl text-xs font-semibold text-gray-300 hover:text-white transition cursor-pointer self-start md:self-auto"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${tabLoading[activeTab] ? 'animate-spin text-violet-400' : ''}`} />
            <span>Regenerate AI Analysis</span>
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-2 border-b border-white/[0.06] pb-3">
        {[
          { id: 'insights', label: 'Management Insights (2.29.7)', icon: Sparkles, badge: 'Executive' },
          { id: 'forecast', label: 'Fee Collection Forecasting (2.29.3)', icon: TrendingUp, badge: 'Forecasting' },
          { id: 'risk', label: 'Late-Payment Risk (2.29.4)', icon: AlertTriangle, badge: 'ML Scoring' },
          { id: 'anomalies', label: 'Transaction Anomalies (2.29.5)', icon: ShieldAlert, badge: 'Auditing' },
          { id: 'assistant', label: 'Financial Assistant (2.29.6)', icon: Bot, badge: 'Interactive' }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                isActive
                  ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/25 border border-violet-400/30'
                  : 'bg-white/[0.02] text-gray-400 hover:text-white hover:bg-white/[0.05] border border-white/[0.04]'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-gray-400'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content Area */}
      <div>
        {/* ========================================================================= */}
        {/* 1. MANAGEMENT INSIGHTS TAB (Feature E) */}
        {/* ========================================================================= */}
        {activeTab === 'insights' && (
          <div className="space-y-6">
            {tabLoading.insights && !insights ? (
              <div className="glass-panel p-12 text-center rounded-2xl flex flex-col items-center justify-center space-y-3">
                <Sparkles className="w-8 h-8 text-violet-400 animate-spin" />
                <p className="text-xs font-medium text-gray-400">Synthesizing executive management report with Gemini...</p>
              </div>
            ) : insights ? (
              <>
                {/* Executive Highlight Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div className="glass-panel p-5 rounded-2xl border border-violet-500/20 relative overflow-hidden">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Top Performing Branch</span>
                        <h3 className="text-xl font-black text-white mt-1">{insights.topPerformingBranch?.name}</h3>
                        <p className="text-xs text-violet-400 font-semibold mt-1">
                          ₹{insights.topPerformingBranch?.collected?.toLocaleString('en-IN')} collected ({insights.topPerformingBranch?.percentage})
                        </p>
                      </div>
                      <div className="p-3 bg-violet-500/10 text-violet-400 rounded-xl">
                        <TrendingUp className="w-5 h-5" />
                      </div>
                    </div>
                  </div>

                  <div className="glass-panel p-5 rounded-2xl border border-pink-500/20 relative overflow-hidden">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Highest Dues Concentration</span>
                        <h3 className="text-xl font-black text-white mt-1">{insights.highestDuesBranch?.name}</h3>
                        <p className="text-xs text-pink-400 font-semibold mt-1">
                          ₹{insights.highestDuesBranch?.dues?.toLocaleString('en-IN')} pending recovery
                        </p>
                      </div>
                      <div className="p-3 bg-pink-500/10 text-pink-400 rounded-xl">
                        <AlertTriangle className="w-5 h-5" />
                      </div>
                    </div>
                  </div>

                  <div className="glass-panel p-5 rounded-2xl border border-emerald-500/20 relative overflow-hidden">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Digital Collection Adoption</span>
                        <h3 className="text-xl font-black text-white mt-1">{insights.digitalCollectionRatio}</h3>
                        <p className="text-xs text-emerald-400 font-semibold mt-1">Online gateway and direct transfer ratio</p>
                      </div>
                      <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl">
                        <Zap className="w-5 h-5" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Main Executive Summary & Recommendations */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 glass-panel p-6 rounded-2xl border border-white/[0.06] space-y-4">
                    <div className="flex items-center gap-2 text-violet-400 font-bold text-sm">
                      <Sparkles className="w-4 h-4" />
                      <span>Executive Narrative & Analytical Commentary</span>
                    </div>
                    <div className="text-xs text-gray-300 leading-relaxed whitespace-pre-line bg-black/20 p-4 rounded-xl border border-white/[0.04]">
                      {insights.narrative}
                    </div>

                    <div className="pt-2">
                      <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Key Analytical Findings</h4>
                      <div className="space-y-2">
                        {insights.keyHighlights?.map((item, idx) => (
                          <div key={idx} className="flex items-start gap-3 p-3 bg-white/[0.02] rounded-xl border border-white/[0.03] text-xs text-gray-300">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                            <span>{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Strategic Action Plan */}
                  <div className="glass-panel p-6 rounded-2xl border border-white/[0.06] space-y-4">
                    <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm">
                      <Target className="w-4 h-4" />
                      <span>Strategic Management Actions</span>
                    </div>

                    <div className="space-y-3">
                      {insights.strategicRecommendations?.map((rec, i) => (
                        <div key={i} className="p-3.5 bg-white/[0.02] rounded-xl border border-white/[0.04] space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-white">{rec.title}</span>
                            <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase ${
                              rec.priority === 'High' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            }`}>
                              {rec.priority} Priority
                            </span>
                          </div>
                          <p className="text-[11px] text-gray-400 leading-relaxed">{rec.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            ) : null}
          </div>
        )}

        {/* ========================================================================= */}
        {/* 2. FEE COLLECTION FORECASTING TAB (Feature A) */}
        {/* ========================================================================= */}
        {activeTab === 'forecast' && (
          <div className="space-y-6">
            {tabLoading.forecast && !forecast ? (
              <div className="glass-panel p-12 text-center rounded-2xl flex flex-col items-center justify-center space-y-3">
                <TrendingUp className="w-8 h-8 text-violet-400 animate-spin" />
                <p className="text-xs font-medium text-gray-400">Running Ensemble Forecasting Models (Linear Regression & Gradient Boosting)...</p>
              </div>
            ) : forecast ? (
              <>
                {/* Metric Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="glass-panel p-4 rounded-xl border border-white/[0.06]">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Historical Total Collected</span>
                    <h3 className="text-lg font-black text-emerald-400 mt-1">₹{forecast.summary?.totalCollected?.toLocaleString('en-IN')}</h3>
                    <p className="text-[10px] text-gray-500 mt-0.5">Realized cash flow</p>
                  </div>
                  <div className="glass-panel p-4 rounded-xl border border-white/[0.06]">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total Outstanding Pipeline</span>
                    <h3 className="text-lg font-black text-amber-400 mt-1">₹{forecast.summary?.totalDues?.toLocaleString('en-IN')}</h3>
                    <p className="text-[10px] text-gray-500 mt-0.5">Target potential</p>
                  </div>
                  <div className="glass-panel p-4 rounded-xl border border-violet-500/30">
                    <span className="text-[10px] font-bold text-violet-400 uppercase tracking-wider">AI Projected 90-Day Inflow</span>
                    <h3 className="text-lg font-black text-white mt-1">₹{forecast.forecast?.projectedTotal?.toLocaleString('en-IN')}</h3>
                    <p className="text-[10px] text-violet-300/80 mt-0.5">Confidence: {forecast.forecast?.confidenceScore}%</p>
                  </div>
                  <div className="glass-panel p-4 rounded-xl border border-white/[0.06]">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Evaluation Metrics</span>
                    <div className="text-[11px] text-gray-300 mt-1 space-y-0.5 font-mono">
                      <div>MAE: <span className="text-violet-400">{forecast.forecast?.modelMetrics?.mae}</span></div>
                      <div>RMSE: <span className="text-violet-400">{forecast.forecast?.modelMetrics?.rmse}</span> | MAPE: <span className="text-emerald-400">{forecast.forecast?.modelMetrics?.mape}</span></div>
                    </div>
                  </div>
                </div>

                {/* Projections Chart */}
                <div className="glass-panel p-6 rounded-2xl border border-white/[0.06] space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-white">Projected Fee Collection Forecast (Quarterly Timeline)</h3>
                      <p className="text-xs text-gray-400 mt-0.5">Statistical forecast with Conservative, Expected, and Optimistic boundaries.</p>
                    </div>
                    <span className="px-2.5 py-1 rounded-md text-[10px] font-mono bg-violet-500/10 text-violet-400 border border-violet-500/20">
                      {forecast.forecast?.modelMetrics?.algorithm}
                    </span>
                  </div>

                  <div className="h-72 w-full pt-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={forecast.forecast?.quarterlyProjections || []}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                        <XAxis dataKey="period" stroke="#888" fontSize={11} />
                        <YAxis stroke="#888" fontSize={11} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#18181b', borderColor: '#3f3f46', borderRadius: '8px', fontSize: '12px' }}
                          formatter={(value) => [`₹${Number(value).toLocaleString('en-IN')}`, '']}
                        />
                        <Legend />
                        <Bar dataKey="conservative" name="Conservative Bound" fill="#64748b" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="projected" name="Projected Baseline" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="optimistic" name="Optimistic Target" fill="#10b981" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="p-4 bg-violet-950/20 border border-violet-500/20 rounded-xl text-xs text-gray-300 leading-relaxed">
                    <span className="font-bold text-violet-400">Forecasting Synthesis: </span>
                    {forecast.forecast?.narrativeSummary}
                  </div>
                </div>
              </>
            ) : null}
          </div>
        )}

        {/* ========================================================================= */}
        {/* 3. LATE-PAYMENT RISK PREDICTION TAB (Feature B) */}
        {/* ========================================================================= */}
        {activeTab === 'risk' && (
          <div className="space-y-6">
            {tabLoading.risk && !riskData ? (
              <div className="glass-panel p-12 text-center rounded-2xl flex flex-col items-center justify-center space-y-3">
                <AlertTriangle className="w-8 h-8 text-amber-400 animate-spin" />
                <p className="text-xs font-medium text-gray-400">Estimating default and late payment probabilities...</p>
              </div>
            ) : riskData ? (
              <>
                {/* Model Scorecards */}
                <div className="flex flex-wrap items-center justify-between gap-4 p-4 glass-panel rounded-xl border border-white/[0.06]">
                  <div>
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider">Classification Model Metrics</h3>
                    <p className="text-[11px] text-gray-400 mt-0.5">{riskData.overallSummary}</p>
                  </div>
                  <div className="flex items-center gap-4 text-xs font-mono">
                    <div className="px-3 py-1.5 bg-white/[0.02] border border-white/[0.06] rounded-lg">
                      Precision: <span className="text-emerald-400 font-bold">{riskData.modelMetrics?.precision}</span>
                    </div>
                    <div className="px-3 py-1.5 bg-white/[0.02] border border-white/[0.06] rounded-lg">
                      Recall: <span className="text-emerald-400 font-bold">{riskData.modelMetrics?.recall}</span>
                    </div>
                    <div className="px-3 py-1.5 bg-white/[0.02] border border-white/[0.06] rounded-lg">
                      F1-Score: <span className="text-violet-400 font-bold">{riskData.modelMetrics?.f1Score}</span>
                    </div>
                    <div className="px-3 py-1.5 bg-white/[0.02] border border-white/[0.06] rounded-lg">
                      ROC-AUC: <span className="text-violet-400 font-bold">{riskData.modelMetrics?.rocAuc}</span>
                    </div>
                  </div>
                </div>

                {/* Risk Evaluation Student Table */}
                <div className="glass-panel rounded-2xl border border-white/[0.06] overflow-hidden">
                  <div className="p-4 border-b border-white/[0.06] flex items-center justify-between">
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider">Student Risk Assessment & Decision-Support Indicators</h3>
                    <span className="text-[11px] text-gray-400">Decision-support guidance, not definitive judgment.</span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-white/[0.02] text-gray-400 border-b border-white/[0.04] text-[10px] uppercase tracking-wider">
                        <tr>
                          <th className="p-4">Student & USN</th>
                          <th className="p-4">Risk Probability</th>
                          <th className="p-4">Category</th>
                          <th className="p-4">Risk Factors Identified</th>
                          <th className="p-4">Recommended Decision Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/[0.04]">
                        {riskData.evaluatedStudents?.map((s, idx) => (
                          <tr key={idx} className="hover:bg-white/[0.02] transition">
                            <td className="p-4">
                              <div className="font-bold text-white">{s.name}</div>
                              <div className="text-[11px] text-gray-500 font-mono">{s.usn}</div>
                            </td>
                            <td className="p-4">
                              <div className="flex items-center gap-2">
                                <div className="w-20 bg-gray-800 rounded-full h-2 overflow-hidden">
                                  <div
                                    className={`h-full rounded-full ${
                                      s.riskScore >= 70 ? 'bg-red-500' : s.riskScore >= 35 ? 'bg-amber-500' : 'bg-emerald-500'
                                    }`}
                                    style={{ width: `${s.riskScore}%` }}
                                  />
                                </div>
                                <span className="font-mono font-bold text-white text-[11px]">{s.riskScore}%</span>
                              </div>
                            </td>
                            <td className="p-4">
                              <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                                s.riskCategory === 'High Risk'
                                  ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                                  : s.riskCategory === 'Medium Risk'
                                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                  : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              }`}>
                                {s.riskCategory}
                              </span>
                            </td>
                            <td className="p-4">
                              <div className="flex flex-wrap gap-1.5">
                                {s.riskFactors?.map((f, fi) => (
                                  <span key={fi} className="px-2 py-0.5 bg-white/[0.04] text-gray-300 rounded text-[10px]">
                                    {f}
                                  </span>
                                ))}
                              </div>
                            </td>
                            <td className="p-4 text-gray-300">
                              <span className="text-violet-300 font-medium">{s.recommendedAction}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            ) : null}
          </div>
        )}

        {/* ========================================================================= */}
        {/* 4. TRANSACTION ANOMALY DETECTION TAB (Feature C) */}
        {/* ========================================================================= */}
        {activeTab === 'anomalies' && (
          <div className="space-y-6">
            {tabLoading.anomalies && !anomalies ? (
              <div className="glass-panel p-12 text-center rounded-2xl flex flex-col items-center justify-center space-y-3">
                <ShieldAlert className="w-8 h-8 text-pink-400 animate-spin" />
                <p className="text-xs font-medium text-gray-400">Running Isolation Forest & Local Outlier Factor (LOF) Transaction Analysis...</p>
              </div>
            ) : anomalies ? (
              <>
                <div className="flex items-center justify-between p-4 glass-panel rounded-xl border border-white/[0.06]">
                  <div>
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider">Forensic Audit & Anomaly Detection Status</h3>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      Inspected {anomalies.totalInspected} transactions for outlier patterns and desk deviation.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">Audit Status:</span>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                      anomalies.detectedAnomalies?.length > 0 ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    }`}>
                      {anomalies.overallIntegrityStatus || 'Normal Verified'}
                    </span>
                  </div>
                </div>

                {anomalies.detectedAnomalies?.length === 0 ? (
                  <div className="glass-panel p-12 text-center rounded-2xl border border-emerald-500/20 space-y-2">
                    <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
                    <h3 className="text-base font-bold text-white">No Anomalies Detected</h3>
                    <p className="text-xs text-gray-400">All inspected transactions conform to normal payment head distributions.</p>
                  </div>
                ) : (
                  <div className="glass-panel rounded-2xl border border-white/[0.06] overflow-hidden">
                    <div className="p-4 border-b border-white/[0.06]">
                      <h3 className="text-xs font-bold text-white uppercase tracking-wider">Flagged Transactions for Human Review</h3>
                    </div>
                    <div className="divide-y divide-white/[0.04]">
                      {anomalies.detectedAnomalies?.map((item, idx) => (
                        <div key={idx} className="p-5 hover:bg-white/[0.02] transition flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-2.5">
                              <span className="font-mono font-bold text-violet-400 text-xs">{item.receiptNo}</span>
                              <span className="text-white font-bold text-xs">{item.studentName} ({item.usn})</span>
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-pink-500/10 text-pink-400 border border-pink-500/20">
                                {item.anomalyType}
                              </span>
                            </div>
                            <p className="text-xs text-gray-300">{item.reason}</p>
                            <div className="text-[11px] text-gray-400">
                              <span className="text-indigo-300 font-medium">Audit Action:</span> {item.suggestedAction}
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <div className="text-base font-black text-white">₹{item.amount?.toLocaleString('en-IN')}</div>
                            <div className="text-[11px] text-gray-400">Mode: {item.mode}</div>
                            <div className="text-[10px] font-mono text-amber-400 mt-1">Anomaly Score: {item.anomalyScore}/100</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : null}
          </div>
        )}

        {/* ========================================================================= */}
        {/* 5. AI FINANCIAL ASSISTANT TAB (Feature D) */}
        {/* ========================================================================= */}
        {activeTab === 'assistant' && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Quick Prompts Sidebar */}
            <div className="glass-panel p-5 rounded-2xl border border-white/[0.06] space-y-4">
              <div className="flex items-center gap-2 text-violet-400 font-bold text-xs uppercase tracking-wider">
                <HelpCircle className="w-4 h-4" />
                <span>Controlled Queries</span>
              </div>
              <p className="text-[11px] text-gray-400">
                Click any pre-formulated query to inspect verified institutional ledger summaries.
              </p>

              <div className="space-y-2">
                {promptSuggestions.map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => handleSendQuery(prompt)}
                    className="w-full text-left p-2.5 rounded-xl bg-white/[0.02] hover:bg-violet-600/10 border border-white/[0.04] hover:border-violet-500/30 text-xs text-gray-300 hover:text-white transition flex items-center justify-between group cursor-pointer"
                  >
                    <span className="truncate pr-2">{prompt}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-gray-500 group-hover:text-violet-400 shrink-0" />
                  </button>
                ))}
              </div>
            </div>

            {/* Main Interactive Chat Box */}
            <div className="lg:col-span-3 glass-panel rounded-2xl border border-white/[0.06] flex flex-col h-[560px]">
              <div className="p-4 border-b border-white/[0.06] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bot className="w-4 h-4 text-violet-400" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider">Ghousia AI Financial Copilot</span>
                </div>
                <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-mono">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span> Live Grounding Active
                </span>
              </div>

              {/* Chat Message Feed */}
              <div className="flex-1 p-5 overflow-y-auto space-y-4">
                {messages.map((m, idx) => (
                  <div
                    key={idx}
                    className={`flex items-start gap-3 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {m.sender === 'assistant' && (
                      <div className="w-7 h-7 rounded-lg bg-violet-600/20 border border-violet-500/30 text-violet-400 flex items-center justify-center shrink-0 mt-0.5">
                        <Bot className="w-4 h-4" />
                      </div>
                    )}
                    <div
                      className={`p-4 rounded-2xl text-xs max-w-2xl leading-relaxed whitespace-pre-line ${
                        m.sender === 'user'
                          ? 'bg-violet-600 text-white shadow-md rounded-tr-none'
                          : 'bg-white/[0.04] border border-white/[0.06] text-gray-200 rounded-tl-none'
                      }`}
                    >
                      {m.text}
                    </div>
                  </div>
                ))}
                {assistantLoading && (
                  <div className="flex items-start gap-3 justify-start">
                    <div className="w-7 h-7 rounded-lg bg-violet-600/20 border border-violet-500/30 text-violet-400 flex items-center justify-center shrink-0">
                      <Sparkles className="w-4 h-4 animate-spin" />
                    </div>
                    <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.05] text-xs text-gray-400 rounded-tl-none">
                      Consulting backend fee records and generating insights...
                    </div>
                  </div>
                )}
              </div>

              {/* Chat Input Bar */}
              <div className="p-4 border-t border-white/[0.06] bg-black/20">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendQuery();
                  }}
                  className="flex items-center gap-2"
                >
                  <input
                    type="text"
                    value={inputQuery}
                    onChange={(e) => setInputQuery(e.target.value)}
                    placeholder="Ask a question about collections, branches, dues, or audit logs..."
                    className="flex-1 bg-white/[0.04] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-violet-500/50"
                  />
                  <button
                    type="submit"
                    disabled={assistantLoading || !inputQuery.trim()}
                    className="p-2.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white rounded-xl transition cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AiAnalytics;
