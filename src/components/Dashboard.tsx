import React, { useState } from 'react';
import { useAppContext } from '../AppContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, LineChart, Line, Cell } from 'recharts';
import { ComposableMap, Geographies, Geography, Marker, ZoomableGroup } from "react-simple-maps";
import { Users, MapPin, Briefcase, Calendar, Plus, Minus, Maximize } from 'lucide-react';
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
    { name: 'Pendiente', count: statusCount['pendiente'] || 0, fill: '#94a3b8' },
    { name: 'Entrevistando', count: statusCount['entrevistando'] || 0, fill: '#3b82f6' },
    { name: 'Entrevistado', count: statusCount['entrevistado'] || 0, fill: '#0059a3' }
  ];

  const COLORS = ['#0059a3', '#002b5c', '#0087d5', '#66b7e6', '#004280', '#339fdd', '#99cfee', '#001633'];

  const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

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
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/60 flex items-center space-x-5 transition-all hover:shadow-md">
          <div className="p-3.5 bg-blue-50 text-blue-600 rounded-xl border border-blue-100/50">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Total Candidatos</p>
            <h3 className="text-2xl font-bold text-slate-900 tracking-tight">{allCandidates.length}</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/60 flex items-center space-x-5 transition-all hover:shadow-md">
          <div className="p-3.5 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100/50">
            <Briefcase className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Total Ofertas</p>
            <h3 className="text-2xl font-bold text-slate-900 tracking-tight">{offers.length}</h3>
          </div>
        </div>
        

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/60 flex items-center space-x-5 transition-all hover:shadow-md">
          <div className="p-3.5 bg-amber-50 text-amber-600 rounded-xl border border-amber-100/50">
            <MapPin className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Ubicaciones</p>
            <h3 className="text-2xl font-bold text-slate-900 tracking-tight">{Object.keys(locationCount).length}</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/60 flex items-center space-x-5 transition-all hover:shadow-md">
          <div className="p-3.5 bg-purple-50 text-purple-600 rounded-xl border border-purple-100/50">
            <Calendar className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Última Solicitud</p>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">
              {formatUTC8(lastUpdated)}
            </h3>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/60 flex flex-col h-full">
          <h3 className="text-lg font-semibold mb-6 text-slate-800 tracking-tight">Candidatos por Oferta</h3>
          <div className="flex-1 min-h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={offerCandidacyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis 
                  dataKey="name" 
                  tick={{fontSize: 12, fill: '#64748b'}} 
                  axisLine={{stroke: '#cbd5e1'}} 
                  tickLine={false}
                  dy={10}
                />
                <YAxis 
                  allowDecimals={false} 
                  tick={{fill: '#64748b'}} 
                  axisLine={false} 
                  tickLine={false}
                  width={40}
                />
                <RechartsTooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                <Bar dataKey="count" fill="#4f46e5" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/60 flex flex-col h-full">
          <h3 className="text-lg font-semibold mb-6 text-slate-800 tracking-tight">Estado de Entrevistas</h3>
          <div className="flex-1 min-h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={interviewData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis 
                  dataKey="name" 
                  tick={{fontSize: 12, fill: '#64748b'}} 
                  axisLine={{stroke: '#cbd5e1'}} 
                  tickLine={false}
                  dy={10}
                />
                <YAxis 
                  allowDecimals={false} 
                  tick={{fill: '#64748b'}} 
                  axisLine={false} 
                  tickLine={false}
                  width={40}
                />
                <RechartsTooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {interviewData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/60 flex flex-col h-full">
          <h3 className="text-lg font-semibold mb-6 text-slate-800 tracking-tight">Evolución de Solicitudes</h3>
          <div className="flex-1 min-h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dateData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis 
                  dataKey="date" 
                  tick={{fontSize: 11, fill: '#64748b'}} 
                  axisLine={{stroke: '#cbd5e1'}} 
                  tickLine={false}
                  padding={{ left: 30, right: 30 }}
                  dy={10}
                />
                <YAxis 
                  allowDecimals={false} 
                  tick={{fill: '#64748b'}} 
                  axisLine={false} 
                  tickLine={false}
                  width={40}
                />
                <RechartsTooltip contentStyle={{borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                <Line 
                  type="monotone" 
                  dataKey="count" 
                  stroke="#0059a3" 
                  strokeWidth={3} 
                  dot={{r: 6, fill: '#0059a3', strokeWidth: 2, stroke: '#fff'}} 
                  activeDot={{r: 8, strokeWidth: 0, fill: '#0059a3'}}
                  animationDuration={1500}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 relative overflow-hidden group">
          <div className="p-6 pb-0 flex justify-between items-center">
            <h3 className="text-lg font-semibold text-slate-800 tracking-tight">Geolocalización de Candidatos</h3>
            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button 
                onClick={handleZoomIn}
                className="p-1.5 bg-white border border-slate-200 rounded-lg shadow-sm hover:bg-slate-50 transition-colors text-slate-600"
                title="Acercar"
              >
                <Plus className="h-4 w-4" />
              </button>
              <button 
                onClick={handleZoomOut}
                className="p-1.5 bg-white border border-slate-200 rounded-lg shadow-sm hover:bg-slate-50 transition-colors text-slate-600"
                title="Alejar"
              >
                <Minus className="h-4 w-4" />
              </button>
              <button 
                onClick={handleReset}
                className="p-1.5 bg-white border border-slate-200 rounded-lg shadow-sm hover:bg-slate-50 transition-colors text-slate-600"
                title="Resetear Vista"
              >
                <Maximize className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div className="h-[420px] w-full relative z-0 overflow-hidden border-t border-slate-100">
            <ComposableMap
              projectionConfig={{
                scale: 170
              }}
              style={{ width: "100%", height: "100%", display: "block" }}
            >
              <ZoomableGroup
                zoom={zoom}
                center={center}
                maxZoom={8}
                minZoom={1}
                onMoveEnd={({ center, zoom }) => {
                  setCenter(center as [number, number]);
                  setZoom(zoom);
                }}
              >
                <Geographies geography={geoUrl}>
                  {({ geographies }) =>
                    geographies.map((geo) => (
                      <Geography
                        key={geo.rsmKey}
                        geography={geo}
                        fill="#f1f5f9"
                        stroke="#fff"
                        strokeWidth={0.5}
                        style={{
                          default: { outline: "none" },
                          hover: { outline: "none", fill: "#e2e8f0" },
                          pressed: { outline: "none" }
                        }}
                      />
                    ))
                  }
                </Geographies>
                {mapMarkers.map(({ name, coordinates, count }) => (
                  <Marker 
                    key={name} 
                    coordinates={coordinates}
                    onMouseEnter={(e) => {
                      setTooltipContent(`${name}: ${count} candidatos`);
                      setTooltipPos({ x: e.pageX, y: e.pageY });
                    }}
                    onMouseLeave={() => setTooltipContent(null)}
                  >
                    <circle 
                      r={Math.min(10, (3 + count * 0.4) / Math.sqrt(zoom))} 
                      fill="#0059a3" 
                      stroke="#fff" 
                      strokeWidth={1.5 / Math.sqrt(zoom)} 
                      className="opacity-90 transition-all hover:scale-125 cursor-pointer" 
                    />
                  </Marker>
                ))}
              </ZoomableGroup>
            </ComposableMap>
            {tooltipContent && (
              <div 
                className="fixed z-50 px-3 py-2 bg-slate-900 text-white text-xs font-medium rounded-lg shadow-xl pointer-events-none transform -translate-x-1/2 -translate-y-full mb-4 whitespace-nowrap"
                style={{ left: tooltipPos.x, top: tooltipPos.y }}
              >
                {tooltipContent}
              </div>
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/60 flex flex-col h-full">
          <h3 className="text-lg font-semibold mb-6 text-slate-800 tracking-tight">Candidatos por Perfil</h3>
          <div className="flex-1 min-h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={profileData} layout="vertical" margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                <XAxis type="number" tick={{fill: '#64748b'}} axisLine={false} tickLine={false} />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  width={140} 
                  tick={{fontSize: 11, fill: '#475569'}} 
                  axisLine={false} 
                  tickLine={false} 
                />
                <RechartsTooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                <Bar dataKey="count" fill="#0059a3" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
