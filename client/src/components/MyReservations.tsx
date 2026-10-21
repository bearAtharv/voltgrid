import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { Reservation, User } from '../types';
import { CheckCircle2, AlertTriangle, Zap } from 'lucide-react';

interface MyReservationsProps {
  currentUser: User | null;
}

export const MyReservations: React.FC<MyReservationsProps> = ({ currentUser }) => {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [completingId, setCompletingId] = useState<string | null>(null);
  const [confirmCancelId, setConfirmCancelId] = useState<string | null>(null);
  const [energyInput, setEnergyInput] = useState<string>('24.5');
  const [banner, setBanner] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const fetchReservations = async () => {
    setLoading(true);
    try {
      const res = await api.getMyReservations();
      setReservations(res.data || []);
    } catch (err) {
      console.error('Failed to load reservations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReservations();
    setBanner(null);
  }, [currentUser]);

  const handleCancel = async (reservationId: string) => {
    setActionLoadingId(reservationId);
    setBanner(null);
    try {
      await api.cancelReservation(reservationId);
      setConfirmCancelId(null);
      setBanner({ type: 'ok', text: 'Reservation slot cancelled and released.' });
      await fetchReservations();
    } catch (err: any) {
      setBanner({ type: 'err', text: err.message || 'Failed to cancel reservation' });
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleSimulateCompletion = async (reservationId: string) => {
    const energy = parseFloat(energyInput);
    if (isNaN(energy) || energy <= 0) {
      setBanner({ type: 'err', text: 'Enter a valid delivered energy value in kWh (> 0).' });
      return;
    }

    setActionLoadingId(reservationId);
    setBanner(null);
    try {
      const res = await api.completeSession(reservationId, energy);
      setCompletingId(null);
      setBanner({ type: 'ok', text: `Charging Session Completed! Final Billed: ₹${res.finalAmount}` });
      await fetchReservations();
    } catch (err: any) {
      setBanner({ type: 'err', text: err.message || 'Failed to complete session' });
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="pb-2">
        <h1 className="text-xl font-semibold text-zinc-100">My Charging Activity</h1>
        <p className="text-xs text-zinc-400 mt-0.5">
          Personal booking schedule and completed charging sessions for <strong className="text-zinc-200">{currentUser?.firstName} {currentUser?.lastName}</strong>.
        </p>
      </div>

      {banner && (
        <div className={`p-3 rounded-2xl border text-xs flex items-center justify-between ${
          banner.type === 'ok'
            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
            : 'bg-rose-500/10 border-rose-500/20 text-rose-300'
        }`}>
          <div className="flex items-center gap-2">
            {banner.type === 'ok' ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> : <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />}
            <span>{banner.text}</span>
          </div>
          <button onClick={() => setBanner(null)} className="text-[11px] opacity-75 hover:opacity-100">Dismiss</button>
        </div>
      )}

      {loading ? (
        <div className="text-center py-20 text-zinc-500 font-mono text-xs">Loading activity ledger...</div>
      ) : reservations.length === 0 ? (
        <div className="text-center py-16 text-zinc-500 text-xs bg-zinc-900/30 rounded-3xl border border-zinc-800/60">
          You have no active or historical bookings. Select an available bay from the Stations tab to book a slot.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {reservations.map(res => (
            <div key={res.reservation_id} className="p-5 rounded-3xl border border-zinc-800/80 bg-zinc-900/60 shadow-sm space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-zinc-100">{res.station_name} — Bay #{res.bay_number}</h3>
                  <p className="text-xs text-zinc-400 mt-0.5">{res.street_address}, {res.city}</p>
                </div>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-medium border ${
                  res.reservation_status === 'CONFIRMED' ? 'bg-sky-500/10 text-sky-400 border-sky-500/20' :
                  res.reservation_status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                  res.reservation_status === 'COMPLETED' ? 'bg-zinc-800 text-zinc-400 border-zinc-700' :
                  'bg-rose-500/10 text-rose-400 border-rose-500/20'
                }`}>
                  {res.reservation_status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs bg-zinc-950/70 p-3 rounded-2xl border border-zinc-800/70">
                <div>
                  <span className="text-zinc-400 block text-[10px]">Vehicle:</span>
                  <span className="text-zinc-200 font-medium">{res.vehicle_make} {res.vehicle_model}</span>
                  <span className="text-zinc-400 font-mono block text-[10px] mt-0.5">{res.license_plate} [{res.connector_type}]</span>
                </div>
                <div>
                  <span className="text-zinc-400 block text-[10px]">Tariff Plan:</span>
                  <span className="text-zinc-200 font-medium truncate block">{res.tariff_name}</span>
                  <span className="text-emerald-400 font-mono block text-[10px] mt-0.5">SoC: {res.initial_soc_percent}% &rarr; {res.target_soc_percent}%</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-1 text-zinc-300">
                <div>
                  <span className="text-zinc-400 text-[10px] block">Scheduled Window:</span>
                  <span>
                    {new Date(res.start_time).toLocaleDateString()} • {new Date(res.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} – {new Date(res.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-zinc-400 text-[10px] block">Delivered / Total:</span>
                  <span className="text-emerald-400 font-semibold font-mono">{Number(res.energy_delivered_kwh || 0).toFixed(1)} kWh • ₹{Number(res.total_amount_due || 0).toFixed(2)}</span>
                </div>
              </div>

              {(res.reservation_status === 'CONFIRMED' || res.reservation_status === 'ACTIVE') && (
                <div className="pt-2 border-t border-zinc-800/60 text-xs space-y-2">
                  {completingId === res.reservation_id ? (
                    <div className="flex items-center gap-2 bg-zinc-950 p-2 rounded-xl border border-zinc-800">
                      <Zap className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span className="text-zinc-400 text-[11px] shrink-0">kWh:</span>
                      <input
                        type="number"
                        step="0.1"
                        min="1"
                        value={energyInput}
                        onChange={e => setEnergyInput(e.target.value)}
                        className="w-20 bg-zinc-900 border border-zinc-700 rounded-lg px-2 py-1 text-zinc-100 font-mono text-xs focus:outline-none"
                      />
                      <button
                        disabled={actionLoadingId === res.reservation_id}
                        onClick={() => handleSimulateCompletion(res.reservation_id)}
                        className="ml-auto px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium"
                      >
                        Bill Session
                      </button>
                      <button onClick={() => setCompletingId(null)} className="px-2 py-1 text-zinc-400 hover:text-zinc-200">
                        Back
                      </button>
                    </div>
                  ) : confirmCancelId === res.reservation_id ? (
                    <div className="flex items-center justify-between bg-rose-950/20 p-2 rounded-xl border border-rose-800/40">
                      <span className="text-rose-300 text-[11px]">Confirm slot cancellation?</span>
                      <div className="flex items-center gap-1.5">
                        <button
                          disabled={actionLoadingId === res.reservation_id}
                          onClick={() => handleCancel(res.reservation_id)}
                          className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-medium"
                        >
                          Yes, Cancel
                        </button>
                        <button onClick={() => setConfirmCancelId(null)} className="px-2 py-1 text-zinc-400 hover:text-zinc-200">
                          No
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-end gap-2">
                      {res.reservation_status === 'CONFIRMED' && (
                        <button
                          disabled={actionLoadingId === res.reservation_id}
                          onClick={() => setConfirmCancelId(res.reservation_id)}
                          className="px-3 py-1.5 rounded-xl text-rose-300 hover:bg-rose-500/10 border border-rose-500/20 font-medium transition-colors"
                        >
                          Cancel Slot
                        </button>
                      )}
                      <button
                        disabled={actionLoadingId === res.reservation_id}
                        onClick={() => {
                          setEnergyInput(String(Number(res.energy_delivered_kwh || 24.3).toFixed(1)));
                          setCompletingId(res.reservation_id);
                        }}
                        className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium transition-colors shadow-sm"
                      >
                        Complete Charging
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

