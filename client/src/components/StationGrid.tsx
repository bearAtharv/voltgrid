import React, { useState, useEffect } from 'react';
import { Station, ChargingBay, User } from '../types';
import { Zap, MapPin, Search, AlertTriangle, Clock } from 'lucide-react';

interface StationGridProps {
  stations: Station[];
  loading: boolean;
  currentUser: User | null;
  onSelectBayForBooking: (station: Station, bay: ChargingBay) => void;
  onReportFault: (bay: ChargingBay) => void;
  onRefresh: () => void;
}

export const StationGrid: React.FC<StationGridProps> = ({
  stations,
  loading,
  currentUser,
  onSelectBayForBooking,
  onReportFault,
}) => {
  const [selectedCity, setSelectedCity] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeVehicleIdx, setActiveVehicleIdx] = useState<number>(0);

  const vehicles = currentUser?.vehicles || [];
  useEffect(() => { setActiveVehicleIdx(0); }, [currentUser?.accountId]);
  const userVehicle = vehicles[activeVehicleIdx] || vehicles[0];
  const cities = ['ALL', ...Array.from(new Set(stations.map(s => s.city)))];

  const filteredStations = stations.filter(station => {
    const matchesCity = selectedCity === 'ALL' || station.city === selectedCity;
    const matchesSearch = station.station_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          station.street_address.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCity && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Top Header & Search Filter */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2">
        <div>
          <h1 className="text-xl font-semibold text-zinc-100">Charging Locations</h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Discover active EV charging hubs, inspect scheduled time slots, and reserve a charging window.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <div className="flex items-center bg-zinc-900 p-1 rounded-2xl border border-zinc-800 text-xs overflow-x-auto">
            {cities.map(city => (
              <button
                key={city}
                onClick={() => setSelectedCity(city)}
                className={`px-3 py-1 rounded-xl font-medium transition-all shrink-0 ${
                  selectedCity === city
                    ? 'bg-zinc-800 text-zinc-100 shadow-sm font-semibold'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {city}
              </button>
            ))}
          </div>

          <div className="relative flex-1 sm:flex-initial">
            <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search station or area..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-2xl text-xs text-zinc-100 placeholder-zinc-400 focus:outline-none focus:border-zinc-600 w-full sm:w-48"
            />
          </div>
        </div>
      </div>

      {/* Driver Active EV Banner (supports multiple vehicles per driver) */}
      {userVehicle && (
        <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <span className="font-medium text-zinc-200">Active Vehicle Filter: </span>
              <span className="text-zinc-100 font-semibold">{userVehicle.make} {userVehicle.model}</span>
              <span className="text-zinc-400 ml-2">({userVehicle.license_plate} • {userVehicle.connector_type} • {userVehicle.battery_capacity_kwh} kWh)</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {vehicles.length > 1 && vehicles.map((v, idx) => (
              <button
                key={v.vehicle_id}
                onClick={() => setActiveVehicleIdx(idx)}
                className={`px-2.5 py-1 rounded-xl text-[11px] font-medium border transition-colors ${
                  idx === activeVehicleIdx
                    ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                    : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-zinc-200'
                }`}
              >
                {v.make} {v.model} ({v.connector_type})
              </button>
            ))}
            <span className="text-[11px] text-emerald-400 font-medium hidden sm:inline-block">
              Matching Compatible Bays
            </span>
          </div>
        </div>
      )}

      {/* Stations List */}
      {loading ? (
        <div className="text-center py-20 text-zinc-500 text-xs font-mono">
          Loading charging stations...
        </div>
      ) : filteredStations.length === 0 ? (
        <div className="text-center py-16 text-zinc-500 text-xs bg-zinc-900/30 rounded-2xl border border-zinc-800/60">
          No stations found matching your criteria.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredStations.map(station => {
            const availableCount = Number(station.available_bays || 0);
            const totalCount = Number(station.total_bays || 0);

            return (
              <div
                key={station.station_id}
                className="bg-zinc-900/60 rounded-3xl border border-zinc-800/80 p-5 flex flex-col justify-between hover:border-zinc-700/80 transition-all shadow-sm"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-semibold text-zinc-100">{station.station_name}</h3>
                      <p className="text-xs text-zinc-400 mt-0.5 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                        <span>{station.street_address}, <span className="text-zinc-300">{station.city}</span></span>
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-medium border ${
                        availableCount > 0 
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                          : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                      }`}>
                        {availableCount > 0 ? `${availableCount} of ${totalCount} Available` : 'Fully Occupied'}
                      </span>
                    </div>
                  </div>

                  {/* Physical Bays List */}
                  <div className="mt-4 space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-medium text-zinc-400">
                      <span>Charging Bays & Plugs</span>
                      <span className="font-mono text-[10px] text-zinc-500">Grid Cap: {station.max_grid_capacity_kw} kW</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {station.bays?.map(bay => {
                        const isPlugMatch = !userVehicle || bay.connectors.some(
                          c => c.connector_type === userVehicle.connector_type && c.port_status === 'FUNCTIONAL'
                        );
                        const isAvailable = bay.bay_status === 'AVAILABLE';
                        const bookedSlots = bay.booked_slots || [];

                        return (
                          <div
                            key={bay.bay_id}
                            className={`p-3 rounded-2xl border text-xs flex flex-col justify-between transition-all ${
                              isAvailable
                                ? 'bg-zinc-950/80 border-zinc-800 hover:border-zinc-700'
                                : 'bg-zinc-950/40 border-zinc-800/50 opacity-75'
                            }`}
                          >
                            <div>
                              <div className="flex items-center justify-between">
                                <span className="font-medium text-zinc-200 flex items-center gap-1.5">
                                  <span>Bay #{bay.bay_number}</span>
                                  {bay.supports_fast_charge && (
                                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                                      DC FAST
                                    </span>
                                  )}
                                </span>
                                <span className={`text-[10px] font-medium ${
                                  isAvailable ? 'text-emerald-400' : bay.bay_status === 'MAINTENANCE' ? 'text-amber-400' : 'text-sky-400'
                                }`}>
                                  {isAvailable ? 'Free' : bay.bay_status === 'MAINTENANCE' ? 'Maintenance' : 'In Session'}
                                </span>
                              </div>

                              <div className="flex flex-wrap gap-1 mt-2">
                                {bay.connectors.map(c => (
                                  <span
                                    key={c.connector_id}
                                    className={`text-[10px] px-1.5 py-0.5 rounded-lg border ${
                                      c.port_status === 'FUNCTIONAL'
                                        ? 'bg-zinc-900 text-zinc-300 border-zinc-800'
                                        : 'bg-rose-950/40 text-rose-400 border-rose-800/40 line-through'
                                    }`}
                                  >
                                    {c.connector_type} • {c.max_power_kw}kW
                                  </span>
                                ))}
                              </div>

                              {bookedSlots.length > 0 && (
                                <div className="mt-2 flex items-center gap-1 text-[10px] text-sky-400/90 font-mono bg-sky-950/30 border border-sky-800/30 px-2 py-0.5 rounded-lg">
                                  <Clock className="w-3 h-3 shrink-0" />
                                  <span className="truncate">
                                    Next slot: {new Date(bookedSlots[0].start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}–{new Date(bookedSlots[0].end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                </div>
                              )}
                            </div>

                            {/* Booking & Fault Report Actions */}
                            <div className="mt-3 pt-2 border-t border-zinc-800/60 flex items-center gap-1.5">
                              <button
                                disabled={!isAvailable || !isPlugMatch}
                                onClick={() => onSelectBayForBooking(station, bay)}
                                className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-medium transition-all ${
                                  isAvailable && isPlugMatch
                                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm'
                                    : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                                }`}
                              >
                                {!isAvailable ? 'Unavailable' : !isPlugMatch ? 'Port Incompatible' : 'Book Slot'}
                              </button>
                              {bay.bay_status !== 'MAINTENANCE' && (
                                <button
                                  type="button"
                                  onClick={() => onReportFault(bay)}
                                  title="Report Hardware Fault on Bay"
                                  className="p-1.5 rounded-xl bg-zinc-900 hover:bg-amber-500/10 text-zinc-400 hover:text-amber-400 border border-zinc-800 hover:border-amber-500/30 transition-colors"
                                >
                                  <AlertTriangle className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

