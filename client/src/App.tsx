import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { StationGrid } from './components/StationGrid';
import { BookingModal } from './components/BookingModal';
import { ReportFaultModal } from './components/ReportFaultModal';
import { MyReservations } from './components/MyReservations';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { MaintenanceBoard } from './components/MaintenanceBoard';
import { SqlTerminal } from './components/SqlTerminal';
import { api, setAuthToken, initSocketClient } from './api/client';
import { Station, ChargingBay, TariffPlan, User } from './types';
import { CheckCircle2 } from 'lucide-react';

export function App() {
  const [activeTab, setActiveTab] = useState<string>('stations');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [stations, setStations] = useState<Station[]>([]);
  const [tariffs, setTariffs] = useState<TariffPlan[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isSocketConnected, setIsSocketConnected] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modals state
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);
  const [selectedBayForBooking, setSelectedBayForBooking] = useState<ChargingBay | null>(null);
  const [selectedBayForFault, setSelectedBayForFault] = useState<ChargingBay | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  // Quick Persona Login
  const handleQuickLogin = async (email: string) => {
    try {
      const res = await api.quickLogin(email);
      setAuthToken(res.token);
      setCurrentUser(res.user);
      showToast(`Switched to: ${res.user.firstName} ${res.user.lastName} (${res.user.role})`);
    } catch (err: any) {
      console.error('Quick login failed:', err);
      showToast(`Login failed: ${err.message}`);
    }
  };

  const loadUserData = async () => {
    try {
      const meRes = await api.getMe();
      setCurrentUser(meRes.user);
    } catch (err) {
      await handleQuickLogin('aarav.patel@gmail.com');
    }
  };

  const loadStationData = async () => {
    setLoading(true);
    try {
      const [stRes, tfRes] = await Promise.all([
        api.getStations(),
        api.getTariffs()
      ]);

      setStations(stRes.data || []);
      setTariffs(tfRes.data || []);
    } catch (err) {
      console.error('Failed to load station mesh:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUserData();
    loadStationData();

    const socket = initSocketClient();

    socket.on('connect', () => {
      setIsSocketConnected(true);
    });

    socket.on('disconnect', () => {
      setIsSocketConnected(false);
    });

    socket.on('bay_status_changed', (data: { stationId: string; bayId: string; status: any }) => {
      setStations(prev => prev.map(station => {
        if (station.station_id !== data.stationId) return station;
        return {
          ...station,
          bays: station.bays?.map(bay => {
            if (bay.bay_id !== data.bayId) return bay;
            return { ...bay, bay_status: data.status };
          })
        };
      }));
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('bay_status_changed');
    };
  }, []);

  const openBookingModal = (station: Station, bay: ChargingBay) => {
    setSelectedStation(station);
    setSelectedBayForBooking(bay);
  };

  const openFaultModal = (bay: ChargingBay) => {
    setSelectedBayForFault(bay);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col selection:bg-emerald-500 selection:text-white relative">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-zinc-900 border border-zinc-800 text-zinc-200 px-4 py-3 rounded-2xl shadow-xl flex items-center space-x-2.5 text-xs font-medium animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentUser={currentUser}
        onQuickLogin={handleQuickLogin}
        isSocketConnected={isSocketConnected}
      />

      {/* Main Viewport */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'stations' && (
          <StationGrid
            stations={stations}
            loading={loading}
            currentUser={currentUser}
            onSelectBayForBooking={openBookingModal}
            onReportFault={openFaultModal}
            onRefresh={loadStationData}
          />
        )}

        {activeTab === 'reservations' && (
          <MyReservations currentUser={currentUser} />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsDashboard currentUser={currentUser} />
        )}

        {activeTab === 'maintenance' && (
          <MaintenanceBoard currentUser={currentUser} />
        )}

        {activeTab === 'database' && (
          <SqlTerminal mode="page" />
        )}
      </main>

      {/* Booking Modal */}
      {selectedBayForBooking && (
        <BookingModal
          station={selectedStation}
          bay={selectedBayForBooking}
          vehicles={currentUser?.vehicles || []}
          tariffs={tariffs}
          onClose={() => {
            setSelectedBayForBooking(null);
            setSelectedStation(null);
          }}
          onSuccess={() => {
            loadStationData();
            setActiveTab('reservations');
          }}
        />
      )}

      {/* Report Fault Modal */}
      {selectedBayForFault && (
        <ReportFaultModal
          bay={selectedBayForFault}
          onClose={() => setSelectedBayForFault(null)}
          onSuccess={() => {
            loadStationData();
          }}
        />
      )}

      {/* Subtle Footer */}
      <footer className="border-t border-zinc-900 bg-zinc-950 py-6 text-center text-xs text-zinc-400">
        VoltGrid EV Infrastructure • PostgreSQL 16 Relational DBMS
      </footer>

      {/* Docked Live SQL Terminal & Engine Inspector when browsing UI tabs */}
      {activeTab !== 'database' && (
        <SqlTerminal mode="dock" onOpenFullLab={() => setActiveTab('database')} />
      )}
    </div>
  );
}
