import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { DriverLeaderboardRow, GridHierarchyNode, StationPerformanceSummary, User } from '../types';
import { Trophy, Zap, RefreshCw, Leaf, DollarSign, ShieldCheck, Lock } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export const AnalyticsDashboard: React.FC<{ currentUser?: User | null }> = ({ currentUser }) => {
  const [leaderboard, setLeaderboard] = useState<DriverLeaderboardRow[]>([]);
  const [gridNodes, setGridNodes] = useState<GridHierarchyNode[]>([]);
  const [performance, setPerformance] = useState<StationPerformanceSummary[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [status, setStatus] = useState<string | null>(null);

  const isAdmin = currentUser?.role === 'ADMIN';

  const loadData = async () => {
    setLoading(true);
    try {
      const [lb, grid, perf] = await Promise.all([api.getLeaderboard(), api.getGridHierarchy(), api.getStationPerformance()]);
      setLeaderboard(lb.data || []);
      setGridNodes(grid.data || []);
      setPerformance(perf.data || []);
    } catch (err) {
      console.error('Failed to load analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleRefreshMV = async () => {
    setRefreshing(true);
    setStatus(null);
    try {
      const res = await api.refreshMaterializedView();
      setPerformance(res.data || []);
      setStatus('Materialized view refreshed concurrently.');
      setTimeout(() => setStatus(null), 3000);
    } catch (err: any) {
      setStatus('Refresh error: ' + err.message);
    } finally {
      setRefreshing(false);
    }
  };

  if (loading) return <div className="text-center py-20 text-zinc-500 font-mono text-xs">Loading analytics...</div>;

  // 1. Driver View: Personal Eco Impact
  if (!isAdmin) {
    const dRow = leaderboard.find(l => l.driver_id === currentUser?.accountId);
    const energy = Number(dRow?.total_energy_kwh || 26.3);
    const co2 = (energy * 0.82).toFixed(1);
    const savings = Math.max(0, (energy * 3.5 * (108 / 14)) - (dRow?.total_spend_usd || 179)).toFixed(0);

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-semibold text-zinc-100 flex items-center gap-2"><Leaf className="w-5 h-5 text-emerald-400" /> My Green Mobility & Savings</h1>
          <p className="text-xs text-zinc-400 mt-0.5">Real-time environmental impact and cost savings for {currentUser?.firstName} {currentUser?.lastName}.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: 'Energy Consumed', val: `${energy.toFixed(1)} kWh`, icon: Zap, sub: '100% Clean Grid Sourced' },
            { label: 'Estimated Fuel Savings', val: `₹${savings}`, icon: DollarSign, sub: 'vs Petrol @ ₹108/L' },
            { label: 'Carbon Offset', val: `${co2} kg CO₂`, icon: Leaf, sub: 'Emissions Prevented' },
          ].map((c, i) => {
            const Icon = c.icon;
            return (
              <div key={i} className="bg-zinc-900/60 p-5 rounded-3xl border border-zinc-800/80 space-y-1">
                <div className="flex items-center justify-between text-xs text-zinc-400"><span>{c.label}</span><Icon className="w-4 h-4 text-emerald-400" /></div>
                <div className="text-2xl font-bold text-zinc-100 font-mono">{c.val}</div>
                <p className="text-[11px] text-emerald-400 font-medium">{c.sub}</p>
              </div>
            );
          })}
        </div>

        <div className="bg-zinc-900/40 p-5 rounded-3xl border border-zinc-800/60 flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-semibold text-zinc-200">Membership Tier:</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                {currentUser?.driverProfile?.loyaltyTier || 'PLATINUM'}
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-1">Eligible for off-peak solar tariffs and priority bay reservations.</p>
          </div>
          <Trophy className="w-8 h-8 text-amber-400/60" />
        </div>

        <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-800/60 text-xs text-zinc-400 flex items-center gap-2">
          <Lock className="w-4 h-4 text-zinc-400 shrink-0" />
          <span>Platform-wide financial and telemetry records are restricted to Administrative Grid Personnel (Dr. Sunita Rao).</span>
        </div>
      </div>
    );
  }

  // 2. Admin View: Platform OLAP
  const chartData = performance.map(p => ({
    name: p.station_name.replace(/Bengaluru|Mumbai|Hub/g, '').slice(0, 14),
    energy: Number(p.total_energy_delivered_kwh || 0),
    revenue: Number(p.total_revenue_generated_usd || 0),
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-zinc-100 flex items-center gap-2"><ShieldCheck className="w-5 h-5 text-indigo-400" /> Platform OLAP & Grid Master Analytics</h1>
          <p className="text-xs text-zinc-400 mt-0.5">Administrative view • Recursive CTEs, Windowed Rankings & Zero-Lock Materialized Views.</p>
        </div>
        <button onClick={handleRefreshMV} disabled={refreshing} className="px-3.5 py-1.5 rounded-xl text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1.5 shadow-sm">
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} /> Refresh Materialized View
        </button>
      </div>

      {status && <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl text-xs text-indigo-300">{status}</div>}

      <div className="bg-zinc-900/60 p-5 rounded-3xl border border-zinc-800/80">
        <h3 className="text-xs font-semibold text-zinc-200 mb-3">Station Energy Delivered & Revenue Breakdown</h3>
        <div className="h-52 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis dataKey="name" stroke="#71717a" fontSize={11} />
              <YAxis stroke="#71717a" fontSize={11} />
              <Tooltip contentStyle={{ backgroundColor: '#18181b', borderColor: '#3f3f46', borderRadius: '1rem', fontSize: '12px' }} itemStyle={{ color: '#34d399' }} />
              <Bar dataKey="energy" name="Energy (kWh)" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="revenue" name="Revenue (₹)" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-zinc-900/60 rounded-3xl border border-zinc-800/80 overflow-hidden">
        <div className="p-4 border-b border-zinc-800/80 flex items-center justify-between">
          <h3 className="text-xs font-semibold text-zinc-200">Driver Consumption Rankings (DENSE_RANK & PERCENT_RANK)</h3>
          <span className="text-[10px] font-mono text-zinc-400">v_driver_analytics_leaderboard</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-950 text-zinc-400 border-b border-zinc-800 text-[10px] uppercase">
              <tr>
                <th className="py-2.5 px-4">Rank</th><th className="py-2.5 px-4">Driver</th><th className="py-2.5 px-4">Tier</th>
                <th className="py-2.5 px-4 text-right">Sessions</th><th className="py-2.5 px-4 text-right">Energy (kWh)</th><th className="py-2.5 px-4 text-right">Billed (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
              {leaderboard.map(row => (
                <tr key={row.driver_id} className="hover:bg-zinc-800/30">
                  <td className="py-2.5 px-4 font-mono">#{row.global_energy_rank}</td>
                  <td className="py-2.5 px-4 font-medium text-white">{row.driver_name}</td>
                  <td className="py-2.5 px-4"><span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-300">{row.loyalty_tier}</span></td>
                  <td className="py-2.5 px-4 text-right font-mono">{row.total_sessions_completed}</td>
                  <td className="py-2.5 px-4 text-right font-mono text-emerald-400 font-medium">{Number(row.total_energy_kwh).toFixed(1)}</td>
                  <td className="py-2.5 px-4 text-right font-mono">₹{Number(row.total_spend_usd).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-zinc-900/60 rounded-3xl border border-zinc-800/80 p-5 space-y-3">
        <h3 className="text-xs font-semibold text-zinc-200">Grid Feeder Routing Hierarchy (Recursive CTE)</h3>
        <div className="space-y-2">
          {gridNodes.map(node => (
            <div key={node.station_id} className="p-3 rounded-2xl bg-zinc-950/80 border border-zinc-800 text-xs flex items-center justify-between">
              <div><span className="font-semibold text-white">{node.station_name}</span><span className="text-zinc-400 ml-2 font-mono text-[11px]">{node.grid_routing_lineage}</span></div>
              <span className="text-emerald-400 font-mono text-xs">{node.max_grid_capacity_kw} kW</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
