import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { MaintenanceTicket, User } from '../types';
import { Wrench, CheckCircle2, UserCheck, AlertTriangle, ShieldCheck, Lock } from 'lucide-react';

interface MaintenanceBoardProps {
  currentUser: User | null;
}

export const MaintenanceBoard: React.FC<MaintenanceBoardProps> = ({ currentUser }) => {
  const [tickets, setTickets] = useState<MaintenanceTicket[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [banner, setBanner] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const isTechnicianOrAdmin = currentUser?.role === 'TECHNICIAN' || currentUser?.role === 'ADMIN';

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const res = await api.getTickets();
      setTickets(res.data || []);
    } catch (err) {
      console.error('Failed to fetch tickets:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
    setBanner(null);
  }, [currentUser]);

  const handleClaim = async (ticketId: string) => {
    setActionLoadingId(ticketId);
    setBanner(null);
    try {
      await api.claimTicket(ticketId);
      setBanner({ type: 'ok', text: 'Work order claimed and assigned to your technician profile.' });
      await fetchTickets();
    } catch (err: any) {
      setBanner({ type: 'err', text: err.message || 'Failed to claim ticket' });
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleResolve = async (ticketId: string) => {
    setActionLoadingId(ticketId);
    setBanner(null);
    try {
      await api.resolveTicket(ticketId);
      setBanner({ type: 'ok', text: 'Incident resolved! PostgreSQL trigger automatically unlocked the bay to AVAILABLE.' });
      await fetchTickets();
    } catch (err: any) {
      setBanner({ type: 'err', text: err.message || 'Failed to resolve ticket' });
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="pb-2">
        <h1 className="text-xl font-semibold text-zinc-100 flex items-center gap-2">
          <Wrench className="w-5 h-5 text-amber-400" />
          Hardware Maintenance & Fault Logs
        </h1>
        <p className="text-xs text-zinc-400 mt-0.5">
          Automated bay state synchronization via PostgreSQL triggers on ticket lifecycle.
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

      {!isTechnicianOrAdmin ? (
        <div className="bg-zinc-900/40 border border-zinc-800/60 rounded-2xl p-4 text-xs text-zinc-400 flex items-center gap-3">
          <Lock className="w-4 h-4 text-zinc-400 shrink-0" />
          <span>
            You are viewing the status log as a Driver. To claim work orders or trigger bay unlock procedures, switch to <strong>Rajesh Kumar (Technician)</strong> or <strong>Dr. Sunita Rao (Admin)</strong> in the top profile menu.
          </span>
        </div>
      ) : (
        <div className="bg-sky-500/5 border border-sky-500/20 rounded-2xl p-4 text-xs text-sky-300 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-4 h-4 text-sky-400 shrink-0" />
            <span>Technician Clearance: You can claim reported incidents and verify hardware repair.</span>
          </div>
          <span className="text-[10px] font-mono font-semibold uppercase px-2 py-0.5 rounded bg-sky-500/10 border border-sky-500/20">
            {currentUser?.role} Active
          </span>
        </div>
      )}

      {loading ? (
        <div className="text-center py-20 text-zinc-500 font-mono text-xs">Loading incident records...</div>
      ) : tickets.length === 0 ? (
        <div className="text-center py-16 text-zinc-500 text-xs bg-zinc-900/30 rounded-3xl border border-zinc-800/60">
          All charging bays and connector ports are currently operational. No active tickets.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tickets.map(ticket => (
            <div key={ticket.ticket_id} className="p-5 rounded-3xl border border-zinc-800/80 bg-zinc-900/60 shadow-sm flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[11px] text-zinc-400">{ticket.station_name} • Bay #{ticket.bay_number}</span>
                    <h3 className="text-sm font-semibold text-zinc-100 mt-0.5">{ticket.fault_category}</h3>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-semibold border ${
                      ticket.severity_level === 'CRITICAL' ? 'bg-rose-500/15 text-rose-400 border-rose-500/30' :
                      ticket.severity_level === 'HIGH' ? 'bg-amber-500/15 text-amber-400 border-amber-500/30' :
                      'bg-zinc-800 text-zinc-400 border-zinc-700'
                    }`}>
                      {ticket.severity_level}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-medium border ${
                      ticket.ticket_status === 'OPEN' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                      ticket.ticket_status === 'IN_PROGRESS' ? 'bg-sky-500/10 text-sky-400 border-sky-500/20' :
                      'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    }`}>
                      {ticket.ticket_status}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-zinc-300 mt-3 bg-zinc-950/70 p-3 rounded-2xl border border-zinc-800/70 leading-relaxed">
                  {ticket.description}
                </p>

                <div className="mt-3 text-[11px] text-zinc-400 flex items-center justify-between">
                  <span>Assigned: <strong className="text-zinc-300 font-medium">{ticket.assigned_technician_name || 'Unassigned'}</strong></span>
                  <span className="text-zinc-400">{new Date(ticket.reported_at).toLocaleDateString()} • {new Date(ticket.reported_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>

              {isTechnicianOrAdmin && (
                <div className="pt-2 border-t border-zinc-800/60 flex items-center justify-end gap-2 text-xs">
                  {ticket.ticket_status === 'OPEN' && (
                    <button
                      disabled={actionLoadingId === ticket.ticket_id}
                      onClick={() => handleClaim(ticket.ticket_id)}
                      className="px-3.5 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-medium transition-colors flex items-center gap-1.5"
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>Claim Ticket</span>
                    </button>
                  )}

                  {ticket.ticket_status === 'IN_PROGRESS' && (
                    <button
                      disabled={actionLoadingId === ticket.ticket_id}
                      onClick={() => handleResolve(ticket.ticket_id)}
                      className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium transition-colors flex items-center gap-1.5 shadow-sm"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Mark Resolved & Unlock Bay</span>
                    </button>
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

