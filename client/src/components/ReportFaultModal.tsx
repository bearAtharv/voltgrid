import React, { useState } from 'react';
import { ChargingBay, TicketSeverity } from '../types';
import { api } from '../api/client';
import { X, AlertTriangle, CheckCircle2, ShieldAlert } from 'lucide-react';

interface ReportFaultModalProps {
  bay: ChargingBay | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const ReportFaultModal: React.FC<ReportFaultModalProps> = ({
  bay,
  onClose,
  onSuccess
}) => {
  const [faultCategory, setFaultCategory] = useState<string>('Broken Connector Gun');
  const [severityLevel, setSeverityLevel] = useState<TicketSeverity>('HIGH');
  const [description, setDescription] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bay) return;

    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      await api.createTicket({
        bayId: bay.bay_id,
        faultCategory,
        severityLevel,
        description: description.trim() || 'Driver reported hardware anomaly at physical bay.'
      });

      setSuccessMsg('Incident reported. Bay locked for diagnostic safety.');
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1400);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to submit incident ticket');
    } finally {
      setLoading(false);
    }
  };

  if (!bay) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/70 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl max-w-md w-full p-6 shadow-2xl relative text-zinc-100">
        
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80">
          <div>
            <h3 className="text-base font-semibold text-zinc-100 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              Report Hardware Fault
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Bay #{bay.bay_number}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 text-zinc-400 hover:text-white rounded-xl hover:bg-zinc-800">
            <X className="w-4 h-4" />
          </button>
        </div>

        {errorMsg && (
          <div className="mt-3 p-3 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-xs text-rose-300">
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="mt-3 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-xs text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-3 text-xs">
          <div>
            <label className="block font-medium text-zinc-300 mb-1">Issue Category</label>
            <select
              value={faultCategory}
              onChange={(e) => setFaultCategory(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-100 focus:outline-none focus:border-zinc-600"
            >
              <option value="Broken Connector Gun">Broken Connector Gun / Latch Pin</option>
              <option value="Screen or UPI Reader Failure">Screen or UPI QR Scanner Failure</option>
              <option value="Power Delivery Failure">Power Interruption / Inverter Trip</option>
              <option value="Physical Obstruction">Physical Stall Obstruction</option>
            </select>
          </div>

          <div>
            <label className="block font-medium text-zinc-300 mb-1">Severity</label>
            <select
              value={severityLevel}
              onChange={(e) => setSeverityLevel(e.target.value as TicketSeverity)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-100 focus:outline-none focus:border-zinc-600"
            >
              <option value="LOW">Low (Cosmetic / Non-blocking)</option>
              <option value="MEDIUM">Medium (Degraded Performance)</option>
              <option value="HIGH">High (Port Inoperable)</option>
              <option value="CRITICAL">Critical (High Voltage Risk)</option>
            </select>
          </div>

          <div>
            <label className="block font-medium text-zinc-300 mb-1">Description</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the issue..."
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-zinc-100 focus:outline-none focus:border-zinc-600"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl font-medium bg-amber-600 hover:bg-amber-500 text-white transition-all shadow-sm"
          >
            {loading ? 'Logging Incident...' : 'Submit Incident Report'}
          </button>
        </form>

      </div>
    </div>
  );
};
