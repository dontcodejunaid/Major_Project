import React, { useState, useEffect } from 'react';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Students from './pages/Students';
import Fees from './pages/Fees';
import Payments from './pages/Payments';
import Deadlines from './pages/Deadlines';
import Reports from './pages/Reports';
import UsersPage from './pages/Users';

import { 
  GraduationCap, LayoutDashboard, Users, Tag, Calendar, 
  FileText, LogOut, User, ShieldCheck, CreditCard, UserPlus
} from 'lucide-react';

const App = () => {
  const [user, setUser] = useState(null);
  const [activePage, setActivePage] = useState('dashboard');
  const [pageParams, setPageParams] = useState(null);

  useEffect(() => {
    // Check if user is already logged in
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (storedUser && token) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

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
  };

  // If not logged in, render the login page
  if (!user) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
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
    <div className="flex min-h-screen relative no-print">
      {/* Background radial overlays */}
      <div className="absolute top-0 right-0 w-[40rem] h-[40rem] bg-violet-600/5 rounded-full blur-[140px] pointer-events-none"></div>
      
      {/* Sidebar Navigation Panel */}
      <aside className="w-64 glass-panel border-r border-white/[0.06] flex flex-col justify-between p-5 z-20 min-h-screen shrink-0 no-print">
        <div className="space-y-8">
          {/* Logo Header */}
          <div className="flex items-center gap-3">
            <div className="p-2 bg-violet-500/10 border border-violet-500/20 rounded-xl text-violet-400">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-sm font-extrabold text-white leading-none tracking-wide">NEXUS COLLEGE</h1>
              <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mt-1 block">Accounts Hub</span>
            </div>
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
        <div className="space-y-4 pt-5 border-t border-white/[0.05]">
          <div className="flex items-center gap-3 bg-white/[0.02] p-3 rounded-xl border border-white/[0.04]">
            <div className="p-2 bg-violet-500/15 text-violet-400 rounded-lg">
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
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold text-red-400 hover:text-red-300 hover:bg-red-500/5 transition border border-transparent hover:border-red-500/10"
          >
            <LogOut className="w-4 h-4 text-red-400" />
            <span>Secure Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-screen min-w-0 no-print">
        {/* Top Header Bar */}
        <header className="h-16 border-b border-white/[0.06] flex items-center justify-between px-8 z-10 no-print bg-black/10 backdrop-blur-md">
          <div className="flex items-center gap-2 text-xs font-bold text-gray-400">
            <span>Terminal status:</span>
            <span className="flex items-center gap-1 bg-green-500/10 border border-green-500/20 text-green-400 px-2 py-0.5 rounded-md">
              <ShieldCheck className="w-3.5 h-3.5" /> TLS Secure Connection Active
            </span>
          </div>
          <div className="text-xs font-bold text-gray-400">
            Academic Term: <span className="text-white">2025-2026 Batch</span>
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 p-8 overflow-y-auto no-print">
          {renderActivePage()}
        </main>
      </div>

      {/* Printing overlay trigger area */}
      <div className="print-only hidden">
        {renderActivePage()}
      </div>
    </div>
  );
};

export default App;
