import React, { useState, useRef, useEffect } from 'react';
import { Zap, User, Wrench, BarChart3, ChevronDown, Check, Database } from 'lucide-react';
import { UserRole } from '../types';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currentUser: any;
  onQuickLogin: (email: string) => void;
  isSocketConnected: boolean;
}

interface PersonaOption {
  email: string;
  name: string;
  role: UserRole;
  title: string;
  vehicle: string;
  badge: string;
}

const PERSONAS: PersonaOption[] = [
  {
    email: 'aarav.patel@gmail.com',
    name: 'Aarav Patel',
    role: 'DRIVER',
    title: 'EV Driver (Platinum)',
    vehicle: 'Tata Nexon EV Max + MG Comet • CCS2/TYPE2',
    badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
  },
  {
    email: 'priya.sharma@yahoo.co.in',
    name: 'Priya Sharma',
    role: 'DRIVER',
    title: 'EV Driver (Gold)',
    vehicle: 'Hyundai Ioniq 5 • CCS2 (72.6 kWh)',
    badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
  },
  {
    email: 'meera.kulkarni@zoho.in',
    name: 'Meera Kulkarni',
    role: 'DRIVER',
    title: 'EV Driver (Platinum)',
    vehicle: 'Kia EV6 GT-Line • CCS2 (77.4 kWh)',
    badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
  },
  {
    email: 'kabir.singh@evfleet.in',
    name: 'Kabir Singh',
    role: 'DRIVER',
    title: 'EV Driver (Silver)',
    vehicle: 'BYD Atto 3 Extended • CCS2 (60.5 kWh)',
    badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
  },
  {
    email: 'rajesh.tech@voltgrid.in',
    name: 'Rajesh Kumar',
    role: 'TECHNICIAN',
    title: 'Grid Technician (L4)',
    vehicle: 'Bengaluru South & Electronic City Zone',
    badge: 'bg-sky-500/10 text-sky-400 border-sky-500/20'
  },
  {
    email: 'suresh.tech@voltgrid.in',
    name: 'Suresh Nair',
    role: 'TECHNICIAN',
    title: 'Grid Technician (L3)',
    vehicle: 'Mumbai Metropolitan & BKC Zone',
    badge: 'bg-sky-500/10 text-sky-400 border-sky-500/20'
  },
  {
    email: 'sunita.rao@voltgrid.in',
    name: 'Dr. Sunita Rao',
    role: 'ADMIN',
    title: 'System Administrator',
    vehicle: 'Full Grid & DB Clearance',
    badge: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
  }
];

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  currentUser,
  onQuickLogin,
  isSocketConnected
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const activePersona = PERSONAS.find(p => p.email === currentUser?.email) || PERSONAS[0];
  const isDev = Boolean(import.meta.env.DEV || (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')));

  return (
    <header className="border-b border-zinc-800/60 bg-zinc-950/80 backdrop-blur-xl sticky top-0 z-40 transition-colors">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Brand */}
          <div 
            className="flex items-center space-x-3 cursor-pointer group" 
            onClick={() => setActiveTab('stations')}
          >
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform">
              <Zap className="w-4 h-4 fill-emerald-400/20" />
            </div>
            <div>
              <span className="text-sm font-semibold tracking-tight text-zinc-100">
                VoltGrid
              </span>
              <span className="text-[11px] text-zinc-400 block -mt-0.5">EV Infrastructure</span>
            </div>
          </div>

          {/* Clean 4 Core Tabs */}
          <nav className="hidden md:flex items-center space-x-1 bg-zinc-900/70 p-1 rounded-2xl border border-zinc-800/70">
            <button
              onClick={() => setActiveTab('stations')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center space-x-1.5 ${
                activeTab === 'stations'
                  ? 'bg-zinc-800 text-zinc-100 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-emerald-400" />
              <span>Stations</span>
            </button>

            <button
              onClick={() => setActiveTab('reservations')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center space-x-1.5 ${
                activeTab === 'reservations'
                  ? 'bg-zinc-800 text-zinc-100 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
              }`}
            >
              <User className="w-3.5 h-3.5 text-sky-400" />
              <span>My Activity</span>
            </button>

            <button
              onClick={() => setActiveTab('maintenance')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center space-x-1.5 ${
                activeTab === 'maintenance'
                  ? 'bg-zinc-800 text-zinc-100 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
              }`}
            >
              <Wrench className="w-3.5 h-3.5 text-amber-400" />
              <span>Maintenance</span>
            </button>

            <button
              onClick={() => setActiveTab('analytics')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center space-x-1.5 ${
                activeTab === 'analytics'
                  ? 'bg-zinc-800 text-zinc-100 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5 text-indigo-400" />
              <span>{currentUser?.role === 'ADMIN' ? 'Platform OLAP' : 'Eco Impact'}</span>
            </button>

            <button
              onClick={() => setActiveTab('database')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center space-x-1.5 ${
                activeTab === 'database'
                  ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shadow-sm'
                  : 'text-emerald-400/90 hover:text-emerald-300 hover:bg-emerald-500/10'
              }`}
            >
              <Database className="w-3.5 h-3.5 text-emerald-400" />
              <span>Database & SQL Lab</span>
            </button>
          </nav>

          {/* Right Section: Persona Selector Dropdown */}
          <div className="flex items-center space-x-3">
            
            {/* Live Indicator */}
            <div className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[11px] bg-zinc-900/60 border border-zinc-800 text-zinc-400">
              <span className={`w-1.5 h-1.5 rounded-full ${isSocketConnected ? 'bg-emerald-400' : 'bg-zinc-500'}`}></span>
              <span className="text-[10px] font-mono">{isSocketConnected ? 'Live' : 'Sync'}</span>
            </div>

            {/* Persona Switcher: Interactive in Dev/Localhost, Static Badge in Production */}
            {!isDev ? (
              <div className="flex items-center space-x-2.5 py-1.5 px-3 rounded-2xl bg-zinc-900/90 border border-zinc-800 text-left shadow-sm">
                <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-zinc-700 to-zinc-600 flex items-center justify-center font-bold text-[10px] text-white">
                  {currentUser?.firstName?.[0] || 'U'}
                </div>
                <div className="flex items-center space-x-1.5">
                  <span className="text-xs font-medium text-zinc-200">
                    {currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : 'User'}
                  </span>
                  <span className={`text-[9px] font-semibold px-1.5 py-0.2 rounded-full border ${activePersona.badge}`}>
                    {currentUser?.role || 'DRIVER'}
                  </span>
                </div>
              </div>
            ) : (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center space-x-2.5 py-1.5 px-3 rounded-2xl bg-zinc-900/90 border border-zinc-800 hover:border-zinc-700 transition-all text-left group shadow-sm"
                  title="Dev Persona Switcher (RBAC Demo)"
                >
                  <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-zinc-700 to-zinc-600 flex items-center justify-center font-bold text-[10px] text-white">
                    {currentUser?.firstName?.[0] || 'U'}
                  </div>

                  <div className="flex flex-col">
                    <div className="flex items-center space-x-1.5">
                      <span className="text-xs font-medium text-zinc-200 group-hover:text-white">
                        {currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : 'Select User'}
                      </span>
                      <span className={`text-[9px] font-semibold px-1.5 py-0.2 rounded-full border ${activePersona.badge}`}>
                        {currentUser?.role || 'DRIVER'}
                      </span>
                    </div>
                  </div>

                  <ChevronDown className={`w-3.5 h-3.5 text-zinc-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Menu */}
                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-80 bg-zinc-900 border border-zinc-800/90 rounded-2xl shadow-xl overflow-hidden z-50 p-1.5 text-xs animate-in fade-in slide-in-from-top-1">
                    
                    <div className="px-3 py-2 border-b border-zinc-800/70 mb-1 flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                        Switch Active Persona (RBAC)
                      </span>
                      <span className="text-[9px] font-mono text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800/40">DEV</span>
                    </div>

                    <div className="space-y-1">
                      {PERSONAS.map(p => {
                        const isSelected = currentUser?.email === p.email;
                        return (
                          <button
                            key={p.email}
                            onClick={() => {
                              onQuickLogin(p.email);
                              setDropdownOpen(false);
                            }}
                            className={`w-full p-2.5 rounded-xl text-left transition-all flex items-center justify-between ${
                              isSelected 
                                ? 'bg-zinc-800/90 text-white' 
                                : 'hover:bg-zinc-800/40 text-zinc-300'
                            }`}
                          >
                            <div>
                              <div className="flex items-center space-x-1.5">
                                <span className="font-semibold text-xs text-zinc-100">{p.name}</span>
                                <span className={`text-[9px] font-semibold px-1.5 py-0.2 rounded-full border ${p.badge}`}>
                                  {p.role}
                                </span>
                              </div>
                              <p className="text-[11px] text-zinc-400 mt-0.5">{p.vehicle}</p>
                            </div>

                            {isSelected && (
                              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                            )}
                          </button>
                        );
                      })}
                    </div>

                  </div>
                )}
              </div>
            )}

          </div>

        </div>
      </div>
    </header>
  );
};
