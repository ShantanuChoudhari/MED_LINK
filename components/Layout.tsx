
import React, { useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import {
  LayoutDashboard, Calendar, Search, FileText, MessageSquare,
  CreditCard, Settings, LogOut, Activity, User as UserIcon,
  ShieldCheck, Pill, Edit, Building2, Users, ChevronLeft, ChevronRight, Menu, X, Sun, Moon
} from 'lucide-react';
import NotificationsPanel from './NotificationsPanel';
import { useTheme } from '../contexts/ThemeContext';

interface LayoutProps {
  user: User;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout: () => void;
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ user, activeTab, setActiveTab, onLogout, children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileOpen,  setMobileOpen]  = useState(false);
  const { theme, toggleTheme } = useTheme();

  const getNavItems = () => {
    const common = [{ id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard }];

    if (user.role === UserRole.PATIENT) return [
      ...common,
      { id: 'search',       label: 'Find Doctors',      icon: Search        },
      { id: 'appointments', label: 'Appointments',       icon: Calendar      },
      { id: 'records',      label: 'Medical History',    icon: FileText      },
      { id: 'prescriptions',label: 'Prescriptions',      icon: Pill          },
      { id: 'telemedicine', label: 'Video Consultation', icon: MessageSquare },
    ];

    if (user.role === UserRole.DOCTOR) return [
      ...common,
      { id: 'schedule',      label: 'My Schedule',       icon: Calendar      },
      { id: 'patients',      label: 'My Patients',       icon: UserIcon      },
      { id: 'prescriptions', label: 'Prescriptions',     icon: Pill          },
      { id: 'calls',         label: 'Video Calls',       icon: MessageSquare },
      { id: 'earnings',      label: 'Earnings',          icon: CreditCard    },
      { id: 'profile-edit',  label: 'My Profile',        icon: Edit          },
    ];

    if (user.role === UserRole.ADMIN) return [
      ...common,
      { id: 'analytics',    label: 'Analytics',          icon: Activity      },
      { id: 'hospitals',    label: 'Manage Hospitals',   icon: Building2     },
      { id: 'staff',        label: 'User Management',    icon: Users         },
    ];

    return common;
  };

  const navItems = getNavItems();

  const tabLabel = navItems.find(n => n.id === activeTab)?.label || activeTab.replace('-', ' ');

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors">

      {/* Desktop Sidebar */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 hidden md:flex flex-col sticky top-0 h-screen transition-all duration-300 ease-in-out flex-shrink-0 z-40`}>
        {/* Logo */}
        <div className={`p-5 border-b border-slate-100 flex items-center ${sidebarOpen ? 'gap-3' : 'justify-center'}`}>
          <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
            <Activity className="w-5 h-5 text-white" />
          </div>
          {sidebarOpen && (
            <div>
              <p className="font-black text-slate-900 dark:text-white text-sm leading-tight">MedLink</p>
              <p className="text-blue-600 dark:text-blue-400 text-xs font-bold">AI</p>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map(item => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => { setActiveTab(item.id); setMobileOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 group ${
                  activeTab === item.id
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 dark:shadow-none'
                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-800 dark:hover:text-white'
                }`}
              >
                <Icon className={`w-5 h-5 flex-shrink-0 ${activeTab === item.id ? 'text-white' : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300'}`} />
                {sidebarOpen && <span className="truncate">{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {/* User + Logout */}
        <div className="p-3 border-t border-slate-100 dark:border-slate-800 space-y-1">
          {sidebarOpen && (
            <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 dark:bg-white/5 rounded-xl mb-2">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                {user.name[0]}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{user.name}</p>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-bold">{user.role}</p>
              </div>
            </div>
          )}
          <button onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors">
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {sidebarOpen && 'Sign Out'}
          </button>
        </div>

        {/* Collapse toggle */}
        <button onClick={() => setSidebarOpen(!sidebarOpen)}
          className="absolute -right-3 top-20 w-6 h-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full flex items-center justify-center text-slate-400 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 shadow-sm">
          {sidebarOpen ? <ChevronLeft className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
        </button>
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-slate-900/50 z-40 md:hidden" onClick={() => setMobileOpen(false)} />
      )}
      {/* Mobile Sidebar */}
      <div className={`fixed top-0 left-0 h-full w-64 bg-white dark:bg-slate-950 z-50 md:hidden transform transition-transform duration-300 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <p className="font-black text-slate-900 dark:text-white">MedLink <span className="text-blue-600 dark:text-blue-400">AI</span></p>
          </div>
          <button onClick={() => setMobileOpen(false)}><X className="w-5 h-5 text-slate-400 dark:text-slate-500" /></button>
        </div>
        <nav className="p-3 space-y-1">
          {navItems.map(item => (
            <button key={item.id} onClick={() => { setActiveTab(item.id); setMobileOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                activeTab === item.id ? 'bg-blue-600 text-white' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white'
              }`}>
              <item.icon className="w-5 h-5" />
              {item.label}
            </button>
          ))}
        </nav>
        <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-slate-100 dark:border-slate-800">
          <button onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10">
            <LogOut className="w-5 h-5" /> Sign Out
          </button>
        </div>
      </div>

      {/* Main */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="h-16 bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 md:px-6 sticky top-0 z-30 shadow-sm transition-colors">
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileOpen(true)} className="md:hidden p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800">
              <Menu className="w-5 h-5 text-slate-500 dark:text-slate-400" />
            </button>
            <div>
              <h1 className="text-base font-bold text-slate-900 dark:text-white capitalize">{tabLabel}</h1>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 hidden sm:block">MedLink AI Healthcare Platform</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={toggleTheme}
              className="p-2.5 bg-white/80 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-700 hover:text-blue-600 transition"
              title="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            {/* Real Notification Bell */}
            <NotificationsPanel />
            <div className="h-8 w-px bg-slate-200 dark:bg-slate-700 mx-1" />
            <div className="flex items-center gap-2 pl-1">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm">
                {user.name[0]}
              </div>
              <div className="hidden sm:block">
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{user.name}</p>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase">{user.role}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 p-4 md:p-8 overflow-auto">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
