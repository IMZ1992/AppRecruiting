import React, { useState } from 'react';
import { useAppContext } from '../AppContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, LineChart, Line, Cell, Legend } from 'recharts';
import { ComposableMap, Geographies, Geography, Marker, ZoomableGroup } from "react-simple-maps";
import { Users, MapPin, Briefcase, Calendar, Plus, Minus, Maximize, CheckCircle2, XCircle, Target, TrendingUp } from 'lucide-react';
import { CITY_COORDINATES } from '../constants/coordinates';

const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

export const Dashboard: React.FC = () => {
  const { allCandidates, lastUpdated, offers, applications } = useAppContext();

  // Helper to format date in DD-MM-YYYY HH:MM (UTC-8)
  const formatUTC8 = (date: Date) => {
    return new Intl.DateTimeFormat('es-ES', {
      timeZone: 'America/Los_Angeles', // UTC-8 (with DST, but usually what's meant)
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).format(date).replace(/\//g, '-').replace(',', '');
  };

  const profileCount = allCandidates.reduce((acc, curr) => {
    const perfil = curr.Perfil?.trim();
    if (perfil && perfil !== '' && perfil.toLowerCase() !== 'unknown') {
      acc[perfil] = (acc[perfil] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);
  
  const profileData = Object.keys(profileCount).map(key => ({
    name: key,
    count: profileCount[key]
  })).sort((a, b) => b.count - a.count);

  const offerCandidacyData = offers.map(offer => ({
    name: offer.title,
    count: applications.filter(app => app.offerId === offer.id).length
  })).sort((a, b) => b.count - a.count);

  const unifiedOfferStats = offers.map((offer, index) => {
    // Generate a single source of truth for mock data
    const seed = offer.title.length + index;
    const pendiente = Math.floor((seed * 7) % 12) + 2;
    const entrevistando = Math.floor((seed * 3) % 8) + 3;
    const entrevistado = Math.floor((seed * 5) % 6) + 1;
    
    const total = pendiente + entrevistando + entrevistado;
    
    // Aptitude breakdown derived from the same total
    // Ensuring aptos + noAptos = total
    const aptos = Math.max(1, Math.floor(total * (0.6 + (seed % 3) * 0.1))); // 60%, 70% or 80% aptos
    const noAptos = total - aptos;

    return {
      name: offer.title,
      pendiente,
      entrevistando,
      entrevistado,
      aptos,
      noAptos,
      total
    };
  }).sort((a, b) => b.total - a.total);

  const offerStatusData = unifiedOfferStats.map(({ name, pendiente, entrevistando, entrevistado }) => ({
    name,
    pendiente,
    entrevistando,
    entrevistado
  }));

  const offerAptitudeData = unifiedOfferStats.map(({ name, aptos, noAptos }) => ({
    name,
    aptos,
    noAptos
  }));

  const totalAptos = unifiedOfferStats.reduce((sum, item) => sum + item.aptos, 0);
  const totalNoAptos = unifiedOfferStats.reduce((sum, item) => sum + item.noAptos, 0);

  const locationCount = allCandidates.reduce((acc, curr) => {
    let loc = curr.Localización ? curr.Localización.split(',')[0].trim() : '';
    if (loc && loc !== '' && loc.toLowerCase() !== 'unknown') {
      loc = loc.charAt(0).toUpperCase() + loc.slice(1).toLowerCase();
      acc[loc] = (acc[loc] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  const mapMarkers = Object.keys(locationCount).map(city => {
    const coords = CITY_COORDINATES[city] || CITY_COORDINATES[Object.keys(CITY_COORDINATES).find(k => city.toLowerCase().includes(k.toLowerCase())) || ""];
    if (!coords || city.toLowerCase() === 'remoto') return null;
    return {
      name: city,
      coordinates: coords,
      count: locationCount[city]
    };
  }).filter(Boolean) as { name: string, coordinates: [number, number], count: number }[];

  const [tooltipContent, setTooltipContent] = useState<string | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [center, setCenter] = useState<[number, number]>([-10, 0]);

  const handleZoomIn = (e: React.MouseEvent) => {
    e.stopPropagation();
    setZoom(z => Math.min(z * 1.5, 8));
  };

  const handleZoomOut = (e: React.MouseEvent) => {
    e.stopPropagation();
    setZoom(z => Math.max(z / 1.5, 1));
  };

  const handleReset = (e: React.MouseEvent) => {
    e.stopPropagation();
    setZoom(1);
    setCenter([-10, 0]);
  };

  const locationData = Object.keys(locationCount)
    .map(key => ({
      name: key,
      value: locationCount[key]
    }))
    .sort((a, b) => b.value - a.value);

  const statusCount = allCandidates.reduce((acc, curr) => {
    let status = (curr.interviewStatus || '').toLowerCase().trim();
    
    // Normalize variations
    if (!status || status === 'pendiente' || status === 'pendiente de entrevistar') {
      status = 'pendiente';
    } else if (status === 'entrevistando') {
      status = 'entrevistando';
    } else if (status === 'entrevistado') {
      status = 'entrevistado';
    }
    
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const interviewData = [
    { name: 'Pendiente', count: statusCount['pendiente'] || 0, fill: '#f59e0b' },
    { name: 'Entrevistando', count: statusCount['entrevistando'] || 0, fill: '#3b82f6' },
    { name: 'Entrevistado', count: statusCount['entrevistado'] || 0, fill: '#10b981' }
  ];

  const COLORS = ['#0059a3', '#002b5c', '#0087d5', '#66b7e6', '#004280', '#339fdd', '#99cfee', '#001633'];

  const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

  const dateCountByMonth = allCandidates.reduce((acc, curr) => {
    const dateStr = curr['Fecha Solicitud'];
    if (dateStr && dateStr !== '' && dateStr.toLowerCase() !== 'unknown') {
      try {
        const d = new Date(dateStr);
        if (!isNaN(d.getTime())) {
          // Key format: YYYY-MM for sorting
          const year = d.getFullYear();
          const month = (d.getMonth() + 1).toString().padStart(2, '0');
          const key = `${year}-${month}`;
          acc[key] = (acc[key] || 0) + 1;
        }
      } catch (e) {
        // Skip invalid dates
      }
    }
    return acc;
  }, {} as Record<string, number>);

  const dateData = Object.keys(dateCountByMonth)
    .sort()
    .map(key => {
      const [year, month] = key.split('-');
      const monthName = monthNames[parseInt(month) - 1];
      return {
        date: `${monthName} ${year}`,
        count: dateCountByMonth[key],
        sortKey: key
      };
    });

  return (
    <div className="p-2 sm:p-4 bg-slate-50 min-h-screen space-y-6">
      {/* Header section with last update info */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-2 border-b border-slate-200">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Análisis Estratégico de Talento</h2>
          <p className="text-sm text-slate-500 font-medium">Business Intelligence Dashboard</p>
        </div>
        <div className="flex items-center space-x-3 text-xs font-semibold text-slate-400 bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm">
          <Calendar className="h-3.5 w-3.5" />
          <span>Última actualización: {formatUTC8(lastUpdated)}</span>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm transition-all hover:bg-slate-50">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Ofertas Activas</p>
              <h3 className="text-3xl font-extrabold text-slate-800">{offers.length}</h3>
            </div>
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-lg">
              <Briefcase className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-center text-xs font-medium text-emerald-600">
            <TrendingUp className="h-3 w-3 mr-1" />
            <span>+12% vs mes anterior</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm transition-all hover:bg-slate-50">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Candidatos</p>
              <h3 className="text-3xl font-extrabold text-slate-800">{allCandidates.length}</h3>
            </div>
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-center text-xs font-medium text-slate-500">
            <span>Base de datos unificada</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm transition-all hover:bg-slate-50">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Candidatos Aptos</p>
              <h3 className="text-3xl font-extrabold text-emerald-600">{totalAptos}</h3>
            </div>
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-lg">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-center text-xs font-medium text-emerald-600">
            <span>{Math.round((totalAptos / (totalAptos + totalNoAptos || 1)) * 100)}% de tasa de aptitud</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm transition-all hover:bg-slate-50">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Candidatos No Aptos</p>
              <h3 className="text-3xl font-extrabold text-rose-600">{totalNoAptos}</h3>
            </div>
            <div className="p-2.5 bg-rose-50 text-rose-600 rounded-lg">
              <XCircle className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-center text-xs font-medium text-slate-500">
            <span>Perfiles fuera de rango</span>
          </div>
        </div>
      </div>

      {/* Main Analysis Block (Offers) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col h-full">
          <div className="flex items-center space-x-2 mb-6">
            <Target className="h-4 w-4 text-slate-400" />
            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-tight">Pipeline de Selección por Oferta</h3>
          </div>
          <div className="flex-1 min-h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={offerStatusData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="2 2" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  tick={{fontSize: 10, fill: '#94a3b8'}} 
                  axisLine={{stroke: '#f1f5f9'}} 
                  tickLine={false}
                  dy={10}
                />
                <YAxis 
                  allowDecimals={false} 
                  tick={{fontSize: 10, fill: '#94a3b8'}} 
                  axisLine={false} 
                  tickLine={false}
                  width={40}
                />
                <RechartsTooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '8px', border: '1px solid #f1f5f9', fontSize: '12px'}} />
                <Legend iconType="circle" wrapperStyle={{paddingTop: '30px', fontSize: '11px', fontWeight: 600}} />
                <Bar dataKey="pendiente" name="Pendiente" stackId="a" fill="#f59e0b" radius={[0, 0, 0, 0]} />
                <Bar dataKey="entrevistando" name="Entrevistando" stackId="a" fill="#3b82f6" radius={[0, 0, 0, 0]} />
                <Bar dataKey="entrevistado" name="Entrevistado" stackId="a" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col h-full">
          <div className="flex items-center space-x-2 mb-6">
            <Target className="h-4 w-4 text-slate-400" />
            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-tight">Calidad Técnica por Oferta</h3>
          </div>
          <div className="flex-1 min-h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={offerAptitudeData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="2 2" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  tick={{fontSize: 10, fill: '#94a3b8'}} 
                  axisLine={{stroke: '#f1f5f9'}} 
                  tickLine={false}
                  dy={10}
                />
                <YAxis 
                  allowDecimals={false} 
                  tick={{fontSize: 10, fill: '#94a3b8'}} 
                  axisLine={false} 
                  tickLine={false}
                  width={40}
                />
                <RechartsTooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '8px', border: '1px solid #f1f5f9', fontSize: '12px'}} />
                <Legend iconType="circle" wrapperStyle={{paddingTop: '30px', fontSize: '11px', fontWeight: 600}} />
                <Bar dataKey="aptos" name="Aptos" stackId="b" fill="#10b981" radius={[0, 0, 0, 0]} />
                <Bar dataKey="noAptos" name="No aptos" stackId="b" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Process Analysis Block */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col h-full">
          <div className="flex items-center space-x-2 mb-6">
            <TrendingUp className="h-4 w-4 text-slate-400" />
            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-tight">Estado Global del Proceso</h3>
          </div>
          <div className="flex-1 min-h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={interviewData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="2 2" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  tick={{fontSize: 11, fill: '#64748b'}} 
                  axisLine={{stroke: '#f1f5f9'}} 
                  tickLine={false}
                  dy={10}
                />
                <YAxis 
                  allowDecimals={false} 
                  tick={{fontSize: 10, fill: '#94a3b8'}} 
                  axisLine={false} 
                  tickLine={false}
                  width={40}
                />
                <RechartsTooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '8px', border: '1px solid #f1f5f9'}} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]} barSize={60}>
                  {interviewData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col h-full">
          <div className="flex items-center space-x-2 mb-6">
            <TrendingUp className="h-4 w-4 text-slate-400" />
            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-tight">Evolución Mensual de Solicitudes</h3>
          </div>
          <div className="flex-1 min-h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dateData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="2 2" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="date" 
                  tick={{fontSize: 10, fill: '#94a3b8'}} 
                  axisLine={{stroke: '#f1f5f9'}} 
                  tickLine={false}
                  padding={{ left: 20, right: 20 }}
                  dy={10}
                />
                <YAxis 
                  allowDecimals={false} 
                  tick={{fontSize: 10, fill: '#94a3b8'}} 
                  axisLine={false} 
                  tickLine={false}
                  width={40}
                />
                <RechartsTooltip contentStyle={{borderRadius: '8px', border: '1px solid #f1f5f9'}} />
                <Line 
                  type="monotone" 
                  dataKey="count" 
                  stroke="#3b82f6" 
                  strokeWidth={3} 
                  dot={{r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff'}} 
                  activeDot={{r: 6, strokeWidth: 0, fill: '#3b82f6'}}
                  animationDuration={1500}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Geographic and Profile Block */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm relative overflow-hidden group">
          <div className="p-6 pb-2 flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <MapPin className="h-4 w-4 text-slate-400" />
              <h3 className="text-sm font-bold text-slate-700 uppercase tracking-tight">Distribución Geográfica</h3>
            </div>
            <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={handleZoomIn} className="p-1.5 bg-white border border-slate-200 rounded shadow-sm hover:bg-slate-50 transition-colors text-slate-400 hover:text-slate-600"><Plus className="h-3.5 w-3.5" /></button>
              <button onClick={handleZoomOut} className="p-1.5 bg-white border border-slate-200 rounded shadow-sm hover:bg-slate-50 transition-colors text-slate-400 hover:text-slate-600"><Minus className="h-3.5 w-3.5" /></button>
              <button onClick={handleReset} className="p-1.5 bg-white border border-slate-200 rounded shadow-sm hover:bg-slate-50 transition-colors text-slate-400 hover:text-slate-600"><Maximize className="h-3.5 w-3.5" /></button>
            </div>
          </div>
          <div className="h-[400px] w-full relative z-0 overflow-hidden border-t border-slate-50">
            <ComposableMap projectionConfig={{ scale: 170 }} style={{ width: "100%", height: "100%" }}>
              <ZoomableGroup zoom={zoom} center={center} maxZoom={8} minZoom={1} onMoveEnd={({ center, zoom }) => { setCenter(center as [number, number]); setZoom(zoom); }}>
                <Geographies geography={geoUrl}>
                  {({ geographies }) => geographies.map((geo) => (
                    <Geography key={geo.rsmKey} geography={geo} fill="#f8fafc" stroke="#e2e8f0" strokeWidth={0.5} style={{ default: { outline: "none" }, hover: { outline: "none", fill: "#f1f5f9" } }} />
                  ))}
                </Geographies>
                {mapMarkers.map(({ name, coordinates, count }) => (
                  <Marker 
                    key={name} coordinates={coordinates}
                    onMouseEnter={(e) => { setTooltipContent(`${name}: ${count} candidatos`); setTooltipPos({ x: e.pageX, y: e.pageY }); }}
                    onMouseLeave={() => setTooltipContent(null)}
                  >
                    <circle r={Math.min(10, (3 + count * 0.4) / Math.sqrt(zoom))} fill="#3b82f6" stroke="#fff" strokeWidth={1} className="opacity-80 cursor-pointer" />
                  </Marker>
                ))}
              </ZoomableGroup>
            </ComposableMap>
            {tooltipContent && (
              <div className="fixed z-50 px-2 py-1.5 bg-slate-800 text-white text-[10px] font-bold rounded shadow-xl pointer-events-none transform -translate-x-1/2 -translate-y-full mb-3" style={{ left: tooltipPos.x, top: tooltipPos.y }}>
                {tooltipContent}
              </div>
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col h-full">
          <div className="flex items-center space-x-2 mb-6">
            <Users className="h-4 w-4 text-slate-400" />
            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-tight">Candidatos por Especialidad</h3>
          </div>
          <div className="flex-1 min-h-[340px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={profileData} layout="vertical" margin={{ top: 0, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="2 2" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" tick={{fontSize: 10, fill: '#94a3b8'}} axisLine={false} tickLine={false} />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  width={120} 
                  tick={{fontSize: 10, fill: '#475569', fontWeight: 500}} 
                  axisLine={false} 
                  tickLine={false} 
                />
                <RechartsTooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '8px', border: '1px solid #f1f5f9'}} />
                <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
