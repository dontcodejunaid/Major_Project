import React, { useState } from 'react';
import { api } from '../utils/api';
import { Lock, Mail, GraduationCap, ShieldAlert, Users, Loader2, Eye, EyeOff } from 'lucide-react';
import SkyToggle from '../components/SkyToggle';

const Login = ({ onLoginSuccess, theme, setTheme }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const data = await api.post('/auth/login', { email, password });
      
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      onLoginSuccess(data.user);
    } catch (err) {
      setError(err.message || 'Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (role) => {
    if (role === 'admin') {
      setEmail('admin@college.edu');
      setPassword('admin123');
    } else if (role === 'staff') {
      setEmail('staff@college.edu');
      setPassword('staff123');
    } else if (role === 'student') {
      setEmail('rahul@student.edu');
      setPassword('1gc22cs001'); // USN lowercase is student's default password
    }
    setError('');
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 relative">
      {/* Top-right Day/Night Sky Theme Toggle */}
      {setTheme && (
        <div className="absolute top-6 right-6 z-20 flex items-center gap-2 bg-black/20 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
          <span className="text-[10px] uppercase font-bold text-gray-400">Theme</span>
          <SkyToggle
            checked={theme === 'dark'}
            onChange={(isNight) => setTheme(isNight ? 'dark' : 'light')}
          />
        </div>
      )}

      {/* Background glow highlights */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-600/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-fuchsia-600/10 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-md animate-fade-in">
        {/* App Title */}
        <div className="text-center mb-6">
          <div className="inline-flex p-1 bg-white rounded-full border-2 border-violet-500/40 mb-3 shadow-2xl">
            <img src="/ghousia_logo.png" alt="Ghousia College Logo" className="w-16 h-16 object-contain rounded-full" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-wider uppercase glow-text">
            GHOUSIA COLLEGE
          </h1>
          <h2 className="text-xs font-black text-emerald-400 uppercase tracking-widest mt-0.5">
            OF ENGINEERING • RAMANAGARAM
          </h2>
          <p className="text-gray-400 text-xs mt-1.5 font-medium">
            Fee Receipt & Accounts Management System
          </p>
        </div>

        {/* Login Card */}
        <div className="glass-panel rounded-3xl p-8 shadow-2xl relative overflow-hidden border-t border-white/[0.08]">
          <h2 className="text-xl font-bold text-white mb-6">Account Log In</h2>

          {error && (
            <div className="flex items-center gap-2.5 bg-red-500/10 border border-red-500/20 text-red-300 px-4 py-3 rounded-xl mb-5 text-sm">
              <ShieldAlert className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3.5 w-5 h-5 text-gray-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 rounded-xl glass-input text-sm"
                  placeholder="name@college.edu"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3.5 w-5 h-5 text-gray-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-11 py-3 rounded-xl glass-input text-sm font-sans"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3.5 text-gray-400 hover:text-white transition cursor-pointer p-0.5"
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-sm font-bold transition glow-btn flex items-center justify-center gap-2 shadow-lg shadow-violet-950/50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Logging in...</span>
                </>
              ) : (
                'Secure Log In'
              )}
            </button>
          </form>

          {/* Quick Demo Login Section */}
          <div className="mt-8 pt-6 border-t border-white/[0.05]">
            <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-4 flex items-center gap-2">
              <Users className="w-3.5 h-3.5 text-violet-400" />
              Demo Roles Fast-Fill
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('admin')}
                className="py-2.5 px-3 rounded-xl bg-violet-500/10 hover:bg-violet-500/20 border border-violet-500/20 text-violet-300 text-xs font-bold transition cursor-pointer"
              >
                Admin Panel
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('staff')}
                className="py-2.5 px-3 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-300 text-xs font-bold transition cursor-pointer"
              >
                Staff Portal
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('student')}
                className="py-2.5 px-3 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 text-cyan-300 text-xs font-bold transition cursor-pointer"
              >
                Student Hub
              </button>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <p className="text-center text-xs text-gray-500 mt-6">
          © {new Date().getFullYear()} Ghousia College of Engineering, Ramanagaram. Managed by G.I.E.T., Bangalore.
        </p>
      </div>
    </div>
  );
};

export default Login;
