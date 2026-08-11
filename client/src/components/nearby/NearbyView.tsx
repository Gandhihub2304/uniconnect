'use client';

import React, { useEffect, useState } from 'react';
import { MapPin, Users, Calendar, Coffee, Navigation, CheckCircle2, MessageSquare, Sliders, Radio } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { apiGet } from '@/lib/api';

export const NearbyView: React.FC = () => {
  const { setActiveTab, startCall } = useAppStore();
  const [activeFilter, setActiveFilter] = useState<'all' | 'friends' | 'events' | 'sports' | 'cafes'>('all');
  const [radiusKm, setRadiusKm] = useState(10);
  const [connectedIds, setConnectedIds] = useState<string[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Geolocation state
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [geoStatus, setGeoStatus] = useState<'loading' | 'granted' | 'denied' | 'unavailable'>('loading');

  // Real nearby people from the API
  const [nearbyItems, setNearbyItems] = useState<any[]>([]);
  const [isLoadingNearby, setIsLoadingNearby] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  // Request real browser geolocation on mount
  useEffect(() => {
    if (!('geolocation' in navigator)) {
      setGeoStatus('unavailable');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords({ lat: position.coords.latitude, lng: position.coords.longitude });
        setGeoStatus('granted');
      },
      (error) => {
        console.error('Geolocation error:', error);
        setGeoStatus(error.code === error.PERMISSION_DENIED ? 'denied' : 'unavailable');
      }
    );
  }, []);

  const fetchNearby = async () => {
    if (!coords) return;
    try {
      setIsLoadingNearby(true);
      const data = await apiGet(`/api/nearby?lat=${coords.lat}&lng=${coords.lng}&radiusKm=${radiusKm}`);
      if (data.success && data.nearby) {
        setNearbyItems(data.nearby);
      }
    } catch (err) {
      console.error('Failed to fetch nearby users:', err);
    } finally {
      setIsLoadingNearby(false);
    }
  };

  useEffect(() => {
    if (coords) fetchNearby();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coords, radiusKm]);

  const handleConnect = (userId: string, name: string) => {
    if (connectedIds.includes(userId)) {
      setConnectedIds(connectedIds.filter(id => id !== userId));
      showToast(`Disconnected from ${name}`);
    } else {
      setConnectedIds([...connectedIds, userId]);
      showToast(`Connected to ${name}! 🎉`);
    }
  };

  // People are the only real category available from the backend right now
  const filteredItems = activeFilter === 'all' || activeFilter === 'friends' ? nearbyItems : [];

  const gpsBadge = () => {
    if (geoStatus === 'granted') {
      return (
        <span className="px-3 py-1 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 font-bold text-xs rounded-xl flex items-center gap-1">
          <Radio className="w-3.5 h-3.5 text-emerald-500 animate-pulse" /> Live GPS Signal
        </span>
      );
    }
    if (geoStatus === 'loading') {
      return (
        <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-500 font-bold text-xs rounded-xl flex items-center gap-1">
          <Radio className="w-3.5 h-3.5 text-slate-400 animate-pulse" /> Locating...
        </span>
      );
    }
    return (
      <span className="px-3 py-1 bg-amber-100 dark:bg-amber-950/60 text-amber-600 font-bold text-xs rounded-xl flex items-center gap-1">
        <Radio className="w-3.5 h-3.5 text-amber-500" /> GPS Unavailable
      </span>
    );
  };

  return (
    <div className="space-y-4 max-w-4xl mx-auto pb-12 select-none relative">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 px-4 py-2.5 bg-slate-900 text-white text-xs font-bold rounded-2xl border border-slate-700 shadow-lg animate-in fade-in slide-in-from-top-2">
          {toastMessage}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            Nearby Radar <Navigation className="w-4 h-4 text-blue-500 animate-spin" />
          </h1>
          <p className="text-xs text-slate-500 font-medium">Discover nearby friends, badminton players, events & study cafes in real time</p>
        </div>
        {gpsBadge()}
      </div>

      {/* Permission Denied / Unavailable Message */}
      {geoStatus === 'denied' && (
        <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-2xl text-xs font-semibold text-amber-700 dark:text-amber-300">
          Location permission was denied. Enable location access in your browser settings to discover nearby people.
        </div>
      )}
      {geoStatus === 'unavailable' && (
        <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-2xl text-xs font-semibold text-amber-700 dark:text-amber-300">
          Geolocation isn't available on this device/browser. Nearby discovery requires location access.
        </div>
      )}

      {/* Dynamic Radar Pulse & Distance Slider Box */}
      <div className="p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-3 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center shrink-0">
              <MapPin className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </span>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Location Radar Radius: {radiusKm} km</h3>
          </div>
          <span className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-3 py-1 rounded-full font-bold">
            {isLoadingNearby ? 'Searching...' : `${filteredItems.length} Items Found Nearby`}
          </span>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400">1 km</span>
          <input
            type="range"
            min={1}
            max={25}
            value={radiusKm}
            onChange={(e) => setRadiusKm(Number(e.target.value))}
            className="w-full accent-blue-600 cursor-pointer"
          />
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400">25 km</span>
        </div>
      </div>

      {/* Category Filter Chips */}
      <div className="flex flex-wrap items-center gap-2 pb-1">
        <button
          onClick={() => setActiveFilter('all')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
            activeFilter === 'all' ? 'bg-blue-600 text-white shadow-sm' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300'
          }`}
        >
          All Nearby ({nearbyItems.length})
        </button>
        <button
          onClick={() => setActiveFilter('friends')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
            activeFilter === 'friends' ? 'bg-blue-600 text-white shadow-sm' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300'
          }`}
        >
          Friends
        </button>
        <button
          onClick={() => setActiveFilter('sports')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
            activeFilter === 'sports' ? 'bg-blue-600 text-white shadow-sm' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300'
          }`}
        >
          Badminton / Sports
        </button>
        <button
          onClick={() => setActiveFilter('events')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
            activeFilter === 'events' ? 'bg-blue-600 text-white shadow-sm' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300'
          }`}
        >
          Events
        </button>
        <button
          onClick={() => setActiveFilter('cafes')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
            activeFilter === 'cafes' ? 'bg-blue-600 text-white shadow-sm' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300'
          }`}
        >
          Study Cafes
        </button>
      </div>

      {/* Items List */}
      {geoStatus !== 'granted' ? (
        <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-center space-y-2">
          <MapPin className="w-7 h-7 text-slate-400 mx-auto" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            {geoStatus === 'loading' ? 'Waiting for your location...' : 'Location access required'}
          </h3>
          <p className="text-xs text-slate-400">We need your location to find people nearby.</p>
        </div>
      ) : isLoadingNearby ? (
        <div className="p-6 text-center text-xs font-bold text-slate-400 animate-pulse">
          Scanning for nearby people...
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-center space-y-2">
          <MapPin className="w-7 h-7 text-slate-400 mx-auto" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">No people found within {radiusKm} km</h3>
          <p className="text-xs text-slate-400">Try increasing your location radar radius slider above!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredItems.map((item) => {
            const person = item.user;
            const isConnected = connectedIds.includes(person._id);
            return (
              <div key={person._id} className="p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center justify-between shadow-sm hover:border-blue-500 transition-all">
                <div className="flex items-center gap-3">
                  <img
                    src={person.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300"}
                    alt={person.name}
                    className="w-12 h-12 rounded-2xl object-cover"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">{person.name}</h4>
                      <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/40 text-blue-600 text-[10px] font-bold rounded-md uppercase">
                        @{person.username}
                      </span>
                    </div>
                    <p className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3 text-rose-500" /> {item.distanceKm.toFixed(1)} km away{person.bio ? ` • ${person.bio}` : ''}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleConnect(person._id, person.name)}
                    className={`py-2 px-4 font-bold text-xs rounded-xl shadow-sm transition-all ${
                      isConnected
                        ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    {isConnected ? 'Connected ✓' : 'Connect'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
