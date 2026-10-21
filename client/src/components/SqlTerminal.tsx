import React, { useState, useEffect } from 'react';
import { Terminal, Play, Maximize2, Minimize2, X, Trash2, Sparkles, Copy, Check, Database, Table2, ArrowUpRight, KeyRound, Link2, GitBranch } from 'lucide-react';
import { api, initSocketClient } from '../api/client';

export interface SqlQueryLog {
  id: string;
  sql: string;
  params?: any[];
  durationMs: number;
  rowCount?: number;
  status: 'SUCCESS' | 'ERROR';
  error?: string;
  timestamp: string;
  source?: string;
}

interface QueryResult {
  columns: string[];
  rows: any[];
  rowCount: number;
  durationMs: number;
}

interface FkRelation {
  column: string;
  targetTable: string;
  targetColumn: string;
  onDelete: string;
}

interface TableSchemaMeta {
  table: string;
  pk: string;
  fks: FkRelation[];
  referencedBy: string[];
  sql: string;
}

const DB_TABLES: TableSchemaMeta[] = [
  {
    table: 'charging_station',
    pk: 'station_id',
    fks: [{ column: 'parent_grid_node_id', targetTable: 'charging_station', targetColumn: 'station_id', onDelete: 'ON DELETE SET NULL' }],
    referencedBy: ['charging_bay', 'audit_station_telemetry_log', 'charging_station'],
    sql: 'SELECT station_id, station_name, city, street_address, max_grid_capacity_kw, parent_grid_node_id, operational_status FROM charging_station ORDER BY city, station_name;'
  },
  {
    table: 'charging_bay',
    pk: 'bay_id',
    fks: [{ column: 'station_id', targetTable: 'charging_station', targetColumn: 'station_id', onDelete: 'ON DELETE CASCADE' }],
    referencedBy: ['connector_port', 'charging_reservation', 'maintenance_ticket'],
    sql: 'SELECT bay_id, station_id, bay_number, bay_status, supports_fast_charge, created_at FROM charging_bay ORDER BY station_id, bay_number;'
  },
  {
    table: 'connector_port',
    pk: 'connector_id',
    fks: [{ column: 'bay_id', targetTable: 'charging_bay', targetColumn: 'bay_id', onDelete: 'ON DELETE CASCADE' }],
    referencedBy: [],
    sql: 'SELECT connector_id, bay_id, connector_type, max_power_kw, port_status FROM connector_port ORDER BY bay_id;'
  },
  {
    table: 'charging_reservation',
    pk: 'reservation_id',
    fks: [
      { column: 'driver_id', targetTable: 'driver_profile', targetColumn: 'account_id', onDelete: 'ON DELETE RESTRICT' },
      { column: 'vehicle_id', targetTable: 'ev_vehicle', targetColumn: 'vehicle_id', onDelete: 'ON DELETE RESTRICT' },
      { column: 'bay_id', targetTable: 'charging_bay', targetColumn: 'bay_id', onDelete: 'ON DELETE RESTRICT' },
      { column: 'tariff_id', targetTable: 'tariff_plan', targetColumn: 'tariff_id', onDelete: 'ON DELETE RESTRICT' }
    ],
    referencedBy: ['audit_station_telemetry_log'],
    sql: 'SELECT reservation_id, driver_id, vehicle_id, bay_id, tariff_id, start_time, end_time, energy_delivered_kwh, total_amount_due, reservation_status FROM charging_reservation ORDER BY start_time DESC;'
  },
  {
    table: 'tariff_plan',
    pk: 'tariff_id',
    fks: [],
    referencedBy: ['charging_reservation'],
    sql: 'SELECT tariff_id, plan_name, base_price_per_kwh, peak_multiplier, idle_fee_per_minute, peak_start_time, peak_end_time FROM tariff_plan ORDER BY base_price_per_kwh;'
  },
  {
    table: 'user_account',
    pk: 'account_id',
    fks: [],
    referencedBy: ['driver_profile', 'technician_profile'],
    sql: 'SELECT account_id, email, first_name, last_name, phone_number, user_role, created_at FROM user_account ORDER BY user_role, first_name;'
  },
  {
    table: 'driver_profile',
    pk: 'account_id',
    fks: [{ column: 'account_id', targetTable: 'user_account', targetColumn: 'account_id', onDelete: 'ON DELETE CASCADE' }],
    referencedBy: ['ev_vehicle', 'charging_reservation', 'maintenance_ticket'],
    sql: 'SELECT account_id, driver_license_num, loyalty_tier, payment_customer_token FROM driver_profile;'
  },
  {
    table: 'technician_profile',
    pk: 'account_id',
    fks: [{ column: 'account_id', targetTable: 'user_account', targetColumn: 'account_id', onDelete: 'ON DELETE CASCADE' }],
    referencedBy: ['maintenance_ticket'],
    sql: 'SELECT account_id, employee_code, certification_grade, operational_zone, is_on_duty FROM technician_profile;'
  },
  {
    table: 'ev_vehicle',
    pk: 'vehicle_id',
    fks: [{ column: 'driver_id', targetTable: 'driver_profile', targetColumn: 'account_id', onDelete: 'ON DELETE CASCADE' }],
    referencedBy: ['charging_reservation'],
    sql: 'SELECT vehicle_id, driver_id, license_plate, make, model, connector_type, battery_capacity_kwh, max_charge_rate_kw FROM ev_vehicle;'
  },
  {
    table: 'maintenance_ticket',
    pk: 'ticket_id',
    fks: [
      { column: 'bay_id', targetTable: 'charging_bay', targetColumn: 'bay_id', onDelete: 'ON DELETE CASCADE' },
      { column: 'reported_by_driver_id', targetTable: 'driver_profile', targetColumn: 'account_id', onDelete: 'ON DELETE SET NULL' },
      { column: 'assigned_technician_id', targetTable: 'technician_profile', targetColumn: 'account_id', onDelete: 'ON DELETE SET NULL' }
    ],
    referencedBy: [],
    sql: 'SELECT ticket_id, bay_id, reported_by_driver_id, assigned_technician_id, fault_category, severity_level, ticket_status, reported_at FROM maintenance_ticket ORDER BY reported_at DESC;'
  },
  {
    table: 'audit_station_telemetry_log',
    pk: 'audit_id',
    fks: [
      { column: 'station_id', targetTable: 'charging_station', targetColumn: 'station_id', onDelete: 'ON DELETE CASCADE' },
      { column: 'bay_id', targetTable: 'charging_bay', targetColumn: 'bay_id', onDelete: 'ON DELETE CASCADE' },
      { column: 'reservation_id', targetTable: 'charging_reservation', targetColumn: 'reservation_id', onDelete: 'ON DELETE SET NULL' }
    ],
    referencedBy: [],
    sql: 'SELECT audit_id, station_id, bay_id, reservation_id, event_type, created_at, metric_snapshot FROM audit_station_telemetry_log ORDER BY created_at DESC LIMIT 15;'
  }
];

const READ_PRESETS = [
  {
    name: 'SELECT: Available Bays',
    sql: "SELECT bay_id, station_id, bay_number, bay_status, supports_fast_charge FROM charging_bay WHERE bay_status = 'AVAILABLE' ORDER BY bay_number;"
  },
  {
    name: 'JOIN: Reservations & Drivers',
    sql: "SELECT cr.reservation_id, ua.first_name || ' ' || ua.last_name AS driver, ev.make || ' ' || ev.model AS vehicle, cs.station_name, cb.bay_number, cr.reservation_status, cr.total_amount_due FROM charging_reservation cr JOIN user_account ua ON cr.driver_id = ua.account_id JOIN ev_vehicle ev ON cr.vehicle_id = ev.vehicle_id JOIN charging_bay cb ON cr.bay_id = cb.bay_id JOIN charging_station cs ON cb.station_id = cs.station_id ORDER BY cr.start_time DESC;"
  },
  {
    name: 'GROUP BY: Station Revenue',
    sql: "SELECT station_name, city, total_bays, available_bays, total_energy_delivered_kwh, total_revenue_generated_usd AS total_revenue_inr FROM mv_station_performance_summary ORDER BY total_revenue_generated_usd DESC;"
  },
  {
    name: 'Recursive CTE: Grid Hierarchy',
    sql: "SELECT station_name, city, grid_tier_depth, max_grid_capacity_kw, grid_routing_lineage FROM v_grid_hierarchy_tree;"
  },
  {
    name: 'Foreign Keys Catalog',
    sql: "SELECT tc.table_name AS from_table, kcu.column_name AS fk_column, ccu.table_name AS references_table, ccu.column_name AS pk_column, rc.delete_rule AS on_delete FROM information_schema.table_constraints tc JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = tc.constraint_name JOIN information_schema.referential_constraints rc ON rc.constraint_name = tc.constraint_name WHERE tc.constraint_type = 'FOREIGN KEY' ORDER BY tc.table_name;"
  }
];

const WRITE_PRESETS = [
  {
    name: 'INSERT: New Tariff Plan',
    sql: "INSERT INTO tariff_plan (plan_name, base_price_per_kwh, peak_multiplier, idle_fee_per_minute, peak_start_time, peak_end_time)\nVALUES ('Student Night Saver Plan', 5.5000, 1.10, 0.25, '22:00:00', '06:00:00')\nON CONFLICT (plan_name) DO UPDATE SET base_price_per_kwh = EXCLUDED.base_price_per_kwh\nRETURNING tariff_id, plan_name, base_price_per_kwh, peak_multiplier, idle_fee_per_minute;"
  },
  {
    name: 'UPDATE: Upgrade Driver Loyalty',
    sql: "UPDATE driver_profile\nSET loyalty_tier = 'PLATINUM'\nWHERE account_id = 'cccccccc-cccc-cccc-cccc-ccccccccccc5'\nRETURNING account_id, driver_license_num, loyalty_tier;"
  },
  {
    name: 'INSERT: Fault Ticket (Fires Trigger)',
    sql: "INSERT INTO maintenance_ticket (bay_id, reported_by_driver_id, fault_category, severity_level, ticket_status, description)\nVALUES ('ffffffff-ffff-ffff-ffff-fffffffffff2', 'cccccccc-cccc-cccc-cccc-ccccccccccc1', 'DISPLAY_GLITCH', 'LOW', 'OPEN', 'Demo fault inserted via SQL Runner (Trigger sets Bay #2 to MAINTENANCE)')\nRETURNING ticket_id, bay_id, fault_category, severity_level, ticket_status, reported_at;"
  },
  {
    name: 'UPDATE: Resolve Demo Ticket',
    sql: "UPDATE maintenance_ticket\nSET ticket_status = 'RESOLVED', resolved_at = CURRENT_TIMESTAMP\nWHERE bay_id = 'ffffffff-ffff-ffff-ffff-fffffffffff2' AND ticket_status = 'OPEN'\nRETURNING ticket_id, bay_id, ticket_status, resolved_at;"
  },
  {
    name: 'DELETE: Demo Tariff Plan',
    sql: "DELETE FROM tariff_plan\nWHERE plan_name = 'Student Night Saver Plan'\nRETURNING tariff_id, plan_name, base_price_per_kwh;"
  },
  {
    name: 'UPDATE: Reset Demo Bookings',
    sql: "UPDATE charging_reservation\nSET reservation_status = 'CONFIRMED'\nWHERE reservation_id IN ('20000000-0000-0000-0000-000000000004', '20000000-0000-0000-0000-000000000010', '20000000-0000-0000-0000-000000000011', '20000000-0000-0000-0000-000000000013', '20000000-0000-0000-0000-000000000014', '20000000-0000-0000-0000-000000000015', '20000000-0000-0000-0000-000000000016', '20000000-0000-0000-0000-000000000017')\nRETURNING reservation_id, driver_id, bay_id, reservation_status;"
  }
];

const getSqlOpType = (sql: string): 'INSERT' | 'UPDATE' | 'DELETE' | 'SELECT' => {
  const clean = sql.trim().toUpperCase();
  if (clean.startsWith('INSERT')) return 'INSERT';
  if (clean.startsWith('UPDATE')) return 'UPDATE';
  if (clean.startsWith('DELETE')) return 'DELETE';
  return 'SELECT';
};

export const formatSql = (sql: string): string => {
  if (!sql) return '';
  const trimmed = sql.trim();
  if (trimmed.includes('\n')) return trimmed;
  const regex = /\b(WITH RECURSIVE|WITH|SELECT DISTINCT|SELECT|FROM|LEFT JOIN|RIGHT JOIN|INNER JOIN|FULL JOIN|CROSS JOIN|JOIN|WHERE|GROUP BY|HAVING|ORDER BY|LIMIT|OFFSET|INSERT INTO|VALUES|UPDATE|SET|DELETE FROM|RETURNING|UNION ALL|UNION|CALL)\b/gi;
  const formatted = trimmed.replace(regex, '\n$1');
  const lines = formatted.split('\n').map(l => l.trim()).filter(Boolean);
  return lines.map((line, i) => i === 0 || /^(WITH|SELECT|FROM|WHERE|GROUP|HAVING|ORDER|LIMIT|INSERT|UPDATE|DELETE|UNION)/i.test(line) ? line : '  ' + line).join('\n');
};

const KEYWORDS = new Set([
  'SELECT', 'FROM', 'WHERE', 'AND', 'OR', 'NOT', 'IN', 'IS', 'NULL', 'JOIN', 'LEFT', 'RIGHT',
  'INNER', 'ON', 'AS', 'GROUP', 'BY', 'HAVING', 'ORDER', 'ASC', 'DESC', 'LIMIT', 'OFFSET',
  'INSERT', 'INTO', 'VALUES', 'UPDATE', 'SET', 'DELETE', 'RETURNING', 'WITH', 'RECURSIVE',
  'UNION', 'CASE', 'WHEN', 'THEN', 'ELSE', 'END', 'CALL', 'COUNT', 'SUM', 'AVG', 'COALESCE'
]);

function highlightSqlTokens(line: string): React.ReactNode[] {
  const tokenRegex = /('(?:''|[^'])*'|\$[0-9]+|\b\d+(?:\.\d+)?\b|[a-zA-Z_][a-zA-Z0-9_]*|[(),;=<>!+\-*\/]|\s+)/g;
  const tokens = line.match(tokenRegex) || [line];
  return tokens.map((token, i) => {
    if (/^\s+$/.test(token)) return <span key={i}>{token}</span>;
    if (token.startsWith("'")) return <span key={i} className="text-emerald-400">{token}</span>;
    if (token.startsWith('$')) return <span key={i} className="text-purple-400 font-bold">{token}</span>;
    if (/^\d+(\.\d+)?$/.test(token)) return <span key={i} className="text-amber-300 font-mono">{token}</span>;
    const upper = token.toUpperCase();
    if (KEYWORDS.has(upper)) return <span key={i} className="text-sky-400 font-semibold">{token}</span>;
    if (/^[(),;=<>!+\-*\/]$/.test(token)) return <span key={i} className="text-zinc-500">{token}</span>;
    return <span key={i} className="text-zinc-200">{token}</span>;
  });
}

export const SqlCodeView: React.FC<{ code: string }> = ({ code }) => {
  const [copied, setCopied] = useState(false);
  const formatted = formatSql(code);
  const lines = formatted.split('\n');

  const onCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(formatted);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="relative group rounded-lg bg-zinc-950/90 border border-zinc-800/80 p-2.5 font-mono text-[11px] leading-relaxed overflow-x-auto select-text">
      <button
        onClick={onCopy}
        className="absolute top-1.5 right-1.5 flex items-center gap-1 px-1.5 py-0.5 rounded bg-zinc-900 text-zinc-400 hover:text-zinc-200 text-[10px] border border-zinc-800 opacity-0 group-hover:opacity-100 transition-opacity"
        title="Copy SQL"
      >
        {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
        <span>{copied ? 'Copied' : 'Copy'}</span>
      </button>
      <div className="space-y-0.5">
        {lines.map((line, idx) => (
          <div key={idx} className="whitespace-pre">
            {highlightSqlTokens(line)}
          </div>
        ))}
      </div>
    </div>
  );
};

interface SqlTerminalProps {
  mode?: 'dock' | 'page';
  onOpenFullLab?: () => void;
}

export const SqlTerminal: React.FC<SqlTerminalProps> = ({ mode = 'dock', onOpenFullLab }) => {
  const isPage = mode === 'page';
  const [isOpen, setIsOpen] = useState(isPage);
  const [isMaximized, setIsMaximized] = useState(true);
  const [activeTab, setActiveTab] = useState<'tables' | 'console' | 'stream'>('tables');
  const [selectedTableName, setSelectedTableName] = useState<string>(DB_TABLES[0].table);
  const [queryLogs, setQueryLogs] = useState<SqlQueryLog[]>([]);
  const [streamFilter, setStreamFilter] = useState<'ALL' | 'WRITE' | 'READ'>('ALL');
  const [customQuery, setCustomQuery] = useState(formatSql(READ_PRESETS[0].sql));
  const [executing, setExecuting] = useState(false);
  const [queryResult, setQueryResult] = useState<QueryResult | null>(null);
  const [consoleError, setConsoleError] = useState<string | null>(null);

  const currentTableMeta = DB_TABLES.find(t => t.table === selectedTableName) || DB_TABLES[0];

  useEffect(() => {
    api.getSqlHistory().then(res => {
      if (res.success && Array.isArray(res.data)) {
        setQueryLogs(prev => {
          const seen = new Set(prev.map(x => x.id));
          return [...prev, ...res.data.filter((x: SqlQueryLog) => !seen.has(x.id))].slice(0, 50);
        });
      }
    }).catch(() => {});
    const socket = initSocketClient();
    const handleSql = (log: SqlQueryLog) => setQueryLogs(prev => [log, ...prev.filter(x => x.id !== log.id)].slice(0, 50));
    socket.on('sql_executed', handleSql);
    return () => { socket.off('sql_executed', handleSql); };
  }, []);

  const executeQueryText = async (sqlToRun: string) => {
    if (!sqlToRun.trim() || executing) return;
    setExecuting(true);
    setConsoleError(null);
    try {
      const res = await api.executeSql(sqlToRun.trim());
      if (res.success) {
        setQueryResult({ columns: res.columns, rows: res.rows, rowCount: res.rowCount, durationMs: res.durationMs });
      }
    } catch (err: any) {
      setConsoleError(err.message || 'Execution error');
    } finally {
      setExecuting(false);
    }
  };

  useEffect(() => {
    if ((isPage || isOpen) && !queryResult && !executing) {
      executeQueryText(DB_TABLES[0].sql);
    }
  }, [isPage, isOpen]);

  const handleSelectTable = (tableName: string) => {
    const meta = DB_TABLES.find(t => t.table === tableName);
    if (!meta) return;
    setSelectedTableName(meta.table);
    setActiveTab('tables');
    executeQueryText(meta.sql);
  };

  const filteredLogs = queryLogs.filter(log => {
    const op = getSqlOpType(log.sql);
    if (streamFilter === 'WRITE') return op !== 'SELECT';
    if (streamFilter === 'READ') return op === 'SELECT';
    return true;
  });

  const renderResultTable = (showKeyBadges: boolean) => (
    <div className="rounded-2xl bg-zinc-950 border border-zinc-800 p-3 flex-1 overflow-hidden flex flex-col min-h-[16rem]">
      {consoleError && (
        <div className="text-rose-400 bg-rose-950/40 p-3 rounded-xl border border-rose-800/60 font-mono mb-2">
          {consoleError}
        </div>
      )}
      {executing ? (
        <div className="flex items-center justify-center py-12 text-emerald-400 font-mono text-xs animate-pulse">
          Executing on PostgreSQL...
        </div>
      ) : queryResult ? (
        <div className="flex flex-col flex-1 overflow-hidden space-y-2">
          <div className="flex items-center justify-between text-[11px] text-zinc-400 pb-2 border-b border-zinc-800 shrink-0">
            <span>
              <strong className="text-emerald-400">{queryResult.rowCount}</strong> rows affected/returned • <strong className="text-sky-300">{queryResult.columns.length}</strong> columns
            </span>
            <span className="text-zinc-500">{queryResult.durationMs}ms</span>
          </div>
          {queryResult.rows.length === 0 ? (
            <div className="py-8 text-center font-mono text-xs">
              {queryResult.rowCount > 0 ? (
                <span className="text-emerald-400">✓ Statement executed successfully ({queryResult.rowCount} row{queryResult.rowCount === 1 ? '' : 's'} affected). Add RETURNING * to inspect modified rows.</span>
              ) : (
                <span className="text-zinc-500 italic">0 rows returned/affected.</span>
              )}
            </div>
          ) : (
            <div className="overflow-auto flex-1">
              <table className="w-full text-left border-collapse text-[11px]">
                <thead>
                  <tr className="border-b border-zinc-800 text-zinc-200 bg-zinc-900 sticky top-0 z-10">
                    <th className="px-2 py-2 font-mono text-zinc-500 w-8">#</th>
                    {queryResult.columns.map(c => {
                      const isPk = showKeyBadges && currentTableMeta.pk === c;
                      const fk = showKeyBadges ? currentTableMeta.fks.find(f => f.column === c) : undefined;
                      return (
                        <th key={c} className="px-3 py-2 font-semibold font-mono text-zinc-100 whitespace-nowrap border-r border-zinc-800/50 last:border-r-0">
                          <div className="flex items-center gap-1.5">
                            <span>{c}</span>
                            {isPk && (
                              <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[9px] font-sans font-bold">
                                PK
                              </span>
                            )}
                            {fk && (
                              <button
                                onClick={() => handleSelectTable(fk.targetTable)}
                                title={`Click to jump to ${fk.targetTable}(${fk.targetColumn}) [${fk.onDelete}]`}
                                className="px-1.5 py-0.2 rounded bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/40 text-[9px] font-sans font-semibold flex items-center gap-0.5"
                              >
                                <span>FK &rarr; {fk.targetTable}</span>
                              </button>
                            )}
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60 font-mono">
                  {queryResult.rows.map((row, rIdx) => (
                    <tr key={rIdx} className="hover:bg-zinc-900/70 transition-colors">
                      <td className="px-2 py-1.5 text-zinc-500">{rIdx + 1}</td>
                      {queryResult.columns.map(col => (
                        <td key={col} className="px-3 py-1.5 text-zinc-200 max-w-xs truncate border-r border-zinc-800/30 last:border-r-0" title={typeof row[col] === 'object' && row[col] !== null ? JSON.stringify(row[col]) : String(row[col] ?? 'NULL')}>
                          {typeof row[col] === 'object' && row[col] !== null ? JSON.stringify(row[col]) : String(row[col] ?? 'NULL')}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );

  if (!isPage && !isOpen) {
    return (
      <div className="fixed bottom-4 right-4 z-40 flex items-center gap-2">
        <button
          onClick={() => { setActiveTab('tables'); setIsOpen(true); }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-2xl transition-all text-xs font-medium"
        >
          <Table2 className="w-4 h-4" />
          <span>View DB Tables</span>
        </button>
        <button
          onClick={() => { setActiveTab('stream'); setIsOpen(true); }}
          className="flex items-center gap-2 px-3.5 py-2.5 rounded-2xl bg-zinc-900/95 hover:bg-zinc-800 text-zinc-100 border border-zinc-700 shadow-2xl backdrop-blur-md transition-all text-xs font-mono"
        >
          <Terminal className="w-3.5 h-3.5 text-emerald-400" />
          <span>SQL Stream</span>
          <span className="px-1.5 py-0.2 rounded text-[10px] bg-zinc-800 text-emerald-300 border border-zinc-700">{queryLogs.length}</span>
        </button>
      </div>
    );
  }

  const containerClass = isPage
    ? 'w-full rounded-3xl bg-zinc-900/50 border border-zinc-800 shadow-xl overflow-hidden flex flex-col min-h-[78vh]'
    : `fixed bottom-0 left-0 right-0 z-50 flex flex-col bg-zinc-950/95 border-t border-zinc-800 shadow-2xl backdrop-blur-xl transition-all duration-200 ${isMaximized ? 'h-[85vh]' : 'h-[32rem]'}`;

  return (
    <div className={containerClass}>
      {/* Clean Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 bg-zinc-900 border-b border-zinc-800 select-none shrink-0">
        <div className="flex items-center gap-3">
          {!isPage && (
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500/80 cursor-pointer" onClick={() => setIsOpen(false)} title="Close" />
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/80 cursor-pointer" onClick={() => setIsMaximized(!isMaximized)} title="Toggle Height" />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
            </div>
          )}
          <Database className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-mono font-semibold text-zinc-100">voltgrid_db</span>
        </div>

        <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-xl border border-zinc-800">
          <button
            onClick={() => handleSelectTable(selectedTableName)}
            className={`px-3 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${
              activeTab === 'tables' ? 'bg-emerald-600 text-white font-semibold' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Table2 className="w-3.5 h-3.5" />
            <span>Tables & Keys</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('console');
              executeQueryText(customQuery);
            }}
            className={`px-3 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${
              activeTab === 'console' ? 'bg-sky-600 text-white font-semibold' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Play className="w-3 h-3" />
            <span>SQL Runner</span>
          </button>

          <button
            onClick={() => setActiveTab('stream')}
            className={`px-3 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${
              activeTab === 'stream' ? 'bg-zinc-800 text-emerald-300 font-semibold' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Live Stream ({queryLogs.length})</span>
          </button>
        </div>

        <div className="flex items-center gap-1.5 text-zinc-400">
          {!isPage && onOpenFullLab && (
            <button onClick={() => { setIsOpen(false); onOpenFullLab(); }} className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[11px] flex items-center gap-1">
              <span>Full Page</span>
              <ArrowUpRight className="w-3 h-3" />
            </button>
          )}
          {!isPage && (
            <>
              <button onClick={() => setIsMaximized(!isMaximized)} className="p-1 hover:text-zinc-200 rounded">
                {isMaximized ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              </button>
              <button onClick={() => setIsOpen(false)} className="p-1 hover:text-zinc-200 rounded"><X className="w-3.5 h-3.5" /></button>
            </>
          )}
        </div>
      </div>

      {/* TAB 1: TABLES, PRIMARY KEYS & FOREIGN KEY RELATIONSHIPS */}
      {activeTab === 'tables' && (
        <div className="flex-1 flex flex-col p-4 gap-3 overflow-y-auto text-xs">
          {/* Row of Table Pills */}
          <div className="flex flex-wrap items-center gap-1.5 shrink-0">
            {DB_TABLES.map(t => (
              <button
                key={t.table}
                onClick={() => handleSelectTable(t.table)}
                className={`px-3 py-1.5 rounded-xl font-mono text-[11px] border transition-all ${
                  selectedTableName === t.table
                    ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300 font-bold'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800 hover:text-white'
                }`}
              >
                {t.table}
              </button>
            ))}
          </div>

          {/* Primary Key & Foreign Key Relationship Strip */}
          <div className="p-3 rounded-2xl bg-zinc-900/80 border border-zinc-800 flex flex-wrap items-center gap-x-6 gap-y-2 text-[11px] shrink-0">
            <div className="flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-zinc-400">Primary Key:</span>
              <span className="px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30 font-mono font-semibold">
                {currentTableMeta.pk}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              <Link2 className="w-3.5 h-3.5 text-sky-400" />
              <span className="text-zinc-400">Foreign Keys:</span>
              {currentTableMeta.fks.length === 0 ? (
                <span className="text-zinc-500 italic">None (Root Table)</span>
              ) : (
                currentTableMeta.fks.map(fk => (
                  <button
                    key={fk.column}
                    onClick={() => handleSelectTable(fk.targetTable)}
                    className="px-2 py-0.5 rounded bg-sky-500/15 hover:bg-sky-500/25 text-sky-300 border border-sky-500/30 font-mono transition-colors"
                    title="Click to open referenced parent table"
                  >
                    {fk.column} &rarr; {fk.targetTable}({fk.targetColumn}) <span className="text-[9px] text-zinc-400">[{fk.onDelete}]</span>
                  </button>
                ))
              )}
            </div>

            {currentTableMeta.referencedBy.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5">
                <GitBranch className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-zinc-400">Referenced By:</span>
                {currentTableMeta.referencedBy.map(child => (
                  <button
                    key={child}
                    onClick={() => handleSelectTable(child)}
                    className="px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 font-mono transition-colors"
                  >
                    {child}
                  </button>
                ))}
              </div>
            )}
          </div>

          {renderResultTable(true)}
        </div>
      )}

      {/* TAB 2: SIMPLE SQL RUNNER (READ & WRITE TRIAL PRESETS) */}
      {activeTab === 'console' && (
        <div className="flex-1 flex flex-col p-4 gap-2.5 overflow-y-auto text-xs">
          {/* Read Presets */}
          <div className="flex flex-wrap items-center gap-1.5 shrink-0">
            <span className="text-zinc-400 font-medium w-24 shrink-0">Read (SELECT):</span>
            {READ_PRESETS.map(p => (
              <button
                key={p.name}
                onClick={() => {
                  const formatted = formatSql(p.sql);
                  setCustomQuery(formatted);
                  executeQueryText(formatted);
                }}
                className="px-2.5 py-1 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-sky-300 border border-zinc-800 transition-colors"
              >
                {p.name}
              </button>
            ))}
            <button
              onClick={() => setCustomQuery(formatSql(customQuery))}
              className="ml-auto flex items-center gap-1 px-2.5 py-1 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800"
            >
              <Sparkles className="w-3 h-3 text-sky-400" /> Format
            </button>
          </div>

          {/* Write / Trial DML Presets */}
          <div className="flex flex-wrap items-center gap-1.5 shrink-0">
            <span className="text-zinc-400 font-medium w-24 shrink-0">Trial Writes:</span>
            {WRITE_PRESETS.map(p => (
              <button
                key={p.name}
                onClick={() => {
                  const formatted = formatSql(p.sql);
                  setCustomQuery(formatted);
                  executeQueryText(formatted);
                }}
                className="px-2.5 py-1 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 transition-colors"
              >
                {p.name}
              </button>
            ))}
          </div>

          <div className="flex gap-2 rounded-2xl bg-zinc-900/90 border border-zinc-800 p-3 shrink-0">
            <span className="text-emerald-400 font-mono font-bold select-none pt-1">voltgrid_db=&gt;</span>
            <textarea
              value={customQuery}
              onChange={e => setCustomQuery(e.target.value)}
              onKeyDown={e => (e.ctrlKey || e.metaKey) && e.key === 'Enter' && (e.preventDefault(), executeQueryText(customQuery))}
              rows={4}
              className="flex-1 bg-transparent text-emerald-300 font-mono text-xs focus:outline-none resize-y leading-relaxed"
            />
            <button
              onClick={() => executeQueryText(customQuery)}
              disabled={executing || !customQuery.trim()}
              className="self-end px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold flex items-center gap-1.5 disabled:opacity-50 shrink-0"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              {executing ? 'Running...' : 'Run SQL'}
            </button>
          </div>

          {renderResultTable(false)}
        </div>
      )}

      {/* TAB 3: CLEAN LIVE STREAM WITH OPERATION BADGES & FILTER */}
      {activeTab === 'stream' && (
        <div className="flex-1 overflow-y-auto p-4 font-mono text-xs space-y-2.5 select-text">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-1 font-sans">
            <div className="flex items-center gap-1.5">
              <span className="text-zinc-400 mr-1">Filter:</span>
              <button
                onClick={() => setStreamFilter('ALL')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border ${
                  streamFilter === 'ALL' ? 'bg-zinc-800 text-white border-zinc-600' : 'bg-zinc-900 text-zinc-400 border-zinc-800'
                }`}
              >
                All ({queryLogs.length})
              </button>
              <button
                onClick={() => setStreamFilter('WRITE')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border ${
                  streamFilter === 'WRITE' ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' : 'bg-zinc-900 text-zinc-400 border-zinc-800'
                }`}
              >
                INSERT / UPDATE / DELETE ({queryLogs.filter(l => getSqlOpType(l.sql) !== 'SELECT').length})
              </button>
              <button
                onClick={() => setStreamFilter('READ')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border ${
                  streamFilter === 'READ' ? 'bg-sky-500/20 text-sky-300 border-sky-500/40' : 'bg-zinc-900 text-zinc-400 border-zinc-800'
                }`}
              >
                SELECT Only ({queryLogs.filter(l => getSqlOpType(l.sql) === 'SELECT').length})
              </button>
            </div>
            <button onClick={() => setQueryLogs([])} className="px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 flex items-center gap-1">
              <Trash2 className="w-3 h-3" /> Clear
            </button>
          </div>

          {filteredLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-zinc-500 gap-2 font-sans">
              <Terminal className="w-6 h-6 text-zinc-600" />
              <p>No matching queries yet. Perform an action in the UI or run a query in SQL Runner.</p>
            </div>
          ) : (
            filteredLogs.map(log => {
              const op = getSqlOpType(log.sql);
              const opBadgeClass =
                op === 'INSERT' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' :
                op === 'UPDATE' ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' :
                op === 'DELETE' ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' :
                'bg-sky-500/15 text-sky-300 border-sky-500/30';
              return (
                <div
                  key={log.id}
                  className={`p-3 rounded-2xl border space-y-2 ${
                    op !== 'SELECT' ? 'bg-zinc-900/90 border-amber-500/30' : 'bg-zinc-900/60 border-zinc-800/80'
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px] text-zinc-400">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded border font-bold text-[10px] ${opBadgeClass}`}>
                        {op}
                      </span>
                      <span className="text-zinc-500">[{log.timestamp}]</span>
                      <span className={`px-1.5 py-0.2 rounded font-semibold text-[10px] ${log.status === 'SUCCESS' ? 'bg-emerald-950/60 text-emerald-400' : 'bg-red-950/60 text-red-400'}`}>
                        {log.status}
                      </span>
                      <span className="text-zinc-400">{log.durationMs}ms</span>
                      {log.rowCount !== undefined && <span className="text-emerald-400">{log.rowCount} rows</span>}
                    </div>
                  </div>
                  <SqlCodeView code={log.sql} />
                  {log.params && log.params.length > 0 && (
                    <div className="text-[11px] text-purple-300 bg-zinc-950/60 px-2.5 py-1 rounded border border-zinc-800/60">
                      <span className="text-zinc-500">Params: </span>{JSON.stringify(log.params)}
                    </div>
                  )}
                  {log.error && <div className="text-[11px] text-red-400 bg-red-950/30 p-2 rounded border border-red-800/40">{log.error}</div>}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};
