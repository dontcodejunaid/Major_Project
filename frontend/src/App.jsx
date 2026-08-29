import React, { useState, useEffect } from 'react';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Students from './pages/Students';
import Fees from './pages/Fees';
import Payments from './pages/Payments';
import Deadlines from './pages/Deadlines';
import Reports from './pages/Reports';
import UsersPage from './pages/Users';
import AiAnalytics from './pages/AiAnalytics';
import SkyToggle from './components/SkyToggle';
import FloatingAiAssistant from './components/FloatingAiAssistant';

import { 
  GraduationCap, LayoutDashboard, Users, Tag, Calendar, 
  FileText, LogOut, User, ShieldCheck, CreditCard, UserPlus,
  Sun, Moon, Sparkles, Bot, Menu, X
} from 'lucide-react';

const App = () => {
  const [user, setUser] = useState(null);
  const [activePage, setActivePage] = useState('dashboard');
  const [pageParams, setPageParams] = useState(null);
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    // Check if user is already logged in
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (storedUser && token) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  useEffect(() => {
    // Sync theme class with body element
    if (theme === 'light') {
      document.body.classList.add('light-theme');
    } else {
      document.body.classList.remove('light-theme');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const handleLoginSuccess = (loggedInUser) => {
    setUser(loggedInUser);
    setActivePage('dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setActivePage('dashboard');
    setPageParams(null);
  };

  const navigateTo = (page, params = null) => {
    setActivePage(page);
    setPageParams(params);
    setMobileMenuOpen(false); // Close mobile drawer on navigation
  };

  // If not logged in, render the login page with theme toggle
  if (!user) {
    return <Login onLoginSuccess={handleLoginSuccess} theme={theme} setTheme={setTheme} />;
  }

  // Sidebar navigation configurations by Role
  const navigationItems = [
    {
      name: 'Dashboard',
      icon: LayoutDashboard,
      page: 'dashboard',
      roles: ['Admin', 'Staff', 'Student']
    },
    {
      name: 'Student Directory',
      icon: Users,
      page: 'students',
      roles: ['Admin', 'Staff']
    },
    {
      name: 'Collect Payments',
      icon: CreditCard,
      page: 'payments',
      roles: ['Staff', 'Admin']
    },
    {
      name: 'AI Intelligence Hub',
      icon: Bot,
      page: 'ai-analytics',
      roles: ['Admin', 'Staff']
    },
    {
      name: 'Fee Structures',
      icon: Tag,
      page: 'fees',
      roles: ['Admin']
    },
    {
      name: 'Late Fines Policy',
      icon: Calendar,
      page: 'deadlines',
      roles: ['Admin']
    },
    {
      name: 'System Audit Logs',
      icon: FileText,
      page: 'reports',
      roles: ['Admin']
    },
    {
      name: 'Staff & Admin Logins',
      icon: UserPlus,
      page: 'users',
      roles: ['Admin']
    }
  ];

  // Filter items matching user role
  const allowedNav = navigationItems.filter(item => item.roles.includes(user.role));

  const renderActivePage = () => {
    switch (activePage) {
      case 'dashboard':
        return <Dashboard user={user} navigateTo={navigateTo} />;
      case 'ai-analytics':
        return <AiAnalytics user={user} />;
      case 'students':
        return <Students user={user} />;
      case 'fees':
        return <Fees user={user} />;
      case 'payments':
        return (
          <Payments 
            user={user} 
            initialStudentId={pageParams?.studentId} 
            navigateTo={navigateTo} 
          />
        );
      case 'deadlines':
        return <Deadlines user={user} />;
      case 'reports':
        return <Reports user={user} />;
      case 'users':
        return <UsersPage user={user} navigateTo={navigateTo} />;
      default:
        return <Dashboard user={user} navigateTo={navigateTo} />;
    }
  };

  return (
    <div className="flex min-h-screen relative overflow-x-hidden">
      {/* Background radial overlays */}
      <div className="absolute top-0 right-0 w-[40rem] h-[40rem] bg-violet-600/5 rounded-full blur-[140px] pointer-events-none no-print"></div>

      {/* Mobile Drawer Backdrop Overlay */}
      {mobileMenuOpen && (
        <div 
          onClick={() => setMobileMenuOpen(false)} 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 md:hidden transition-opacity"
        />
      )}
      
      {/* Sidebar Navigation Panel - Responsive Drawer on Mobile, Sticky on Desktop */}
      <aside className={`
        fixed md:sticky top-0 left-0 h-screen w-64 glass-panel border-r border-white/[0.06] flex flex-col justify-between p-5 z-40 md:z-20 shrink-0 no-print overflow-y-auto transition-transform duration-300 ease-in-out
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="space-y-6">
          {/* Logo Header with Mobile Close button */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-1 bg-white rounded-full border border-violet-500/30 shadow-lg shadow-violet-950/50 flex-shrink-0">
                <img src="/ghousia_logo.png" alt="Ghousia College Logo" className="w-8 h-8 object-contain rounded-full" />
              </div>
              <div>
                <h1 className="text-xs font-black text-white leading-tight tracking-wider uppercase">GHOUSIA COLLEGE</h1>
                <span className="text-[9px] text-emerald-400 font-extrabold uppercase tracking-widest block">OF ENGINEERING</span>
                <span className="text-[9px] text-gray-400 font-semibold tracking-wide mt-0.5 block">Accounts & Fee Hub</span>
              </div>
            </div>
            {/* Mobile close button */}
            <button 
              onClick={() => setMobileMenuOpen(false)}
              className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 md:hidden"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links list */}
          <nav className="space-y-1">
            {allowedNav.map((item) => {
              const Icon = item.icon;
              const isActive = activePage === item.page;
              return (
                <button
                  key={item.page}
                  onClick={() => navigateTo(item.page)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition ${
                    isActive
                      ? 'bg-violet-600/10 border border-violet-500/30 text-white'
                      : 'text-gray-400 hover:text-white hover:bg-white/[0.02] border border-transparent'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-violet-400' : 'text-gray-500'}`} />
                  <span>{item.name}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* User Card & Logout button */}
        <div className="space-y-3 pt-4 border-t border-white/[0.05]">
          <div className="flex items-center gap-3 bg-white/[0.02] p-2.5 rounded-xl border border-white/[0.04]">
            <div className="p-2 bg-violet-500/15 text-violet-400 rounded-lg shrink-0">
              <User className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-bold text-white truncate leading-none">{user.name}</p>
              <span className="text-[9px] font-semibold text-violet-400 uppercase tracking-wider mt-1 block">
                {user.role} Account
              </span>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold text-red-400 hover:text-red-300 hover:bg-red-500/5 transition border border-transparent hover:border-red-500/10"
          >
            <LogOut className="w-4 h-4 text-red-400" />
            <span>Secure Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-screen min-w-0">
        {/* Top Header Bar */}
        <header className="h-16 border-b border-white/[0.06] flex items-center justify-between px-4 sm:px-8 z-10 no-print bg-black/10 backdrop-blur-md sticky top-0">
          <div className="flex items-center gap-3">
            {/* Hamburger Button on Mobile */}
            <button 
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 rounded-xl bg-white/[0.05] border border-white/10 text-gray-300 hover:text-white md:hidden transition"
              aria-label="Open Navigation Menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="hidden sm:flex items-center gap-2 text-xs font-bold text-gray-400">
              <span>Status:</span>
              <span className="flex items-center gap-1 bg-green-500/10 border border-green-500/20 text-green-400 px-2 py-0.5 rounded-md">
                <ShieldCheck className="w-3.5 h-3.5" /> TLS Active
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-4 text-xs font-bold text-gray-400">
            <SkyToggle
              checked={theme === 'dark'}
              onChange={(isNight) => setTheme(isNight ? 'dark' : 'light')}
            />
            <span className="hidden sm:inline">Batch: <span className="text-white">2026-27</span></span>
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto max-w-full">
          {renderActivePage()}
        </main>
      </div>

      {/* Floating AI Assistant Copilot Button */}
      {(user.role === 'Admin' || user.role === 'Staff') && (
        <FloatingAiAssistant user={user} />
      )}

      {/* Printing overlay trigger area */}
      <div className="print-only hidden">
        {renderActivePage()}
      </div>
    </div>
  );
};

export default App;
