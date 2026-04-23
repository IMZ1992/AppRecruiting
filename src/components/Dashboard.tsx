import React, { useState } from 'react';
import { useAppContext } from '../AppContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend, LabelList } from 'recharts';
import { Users, MapPin, Briefcase, Calendar } from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { allCandidates } = useAppContext();

  const profileCount = allCandidates.reduce((acc, curr) => {
    acc[curr.Perfil] = (acc[curr.Perfil] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const profileData = Object.keys(profileCount).map(key => ({
    name: key || 'Unknown',
    count: profileCount[key]
  }));

  const locationCount = allCandidates.reduce((acc, curr) => {
    let loc = curr.Localización ? curr.Localización.split(',')[0].trim() : 'Unknown';
    if (loc !== 'Unknown') {
      loc = loc.charAt(0).toUpperCase() + loc.slice(1).toLowerCase();
    }
    acc[loc] = (acc[loc] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const locationData = Object.keys(locationCount)
    .map(key => ({
      name: key,
      value: locationCount[key]
    }))
    .sort((a, b) => b.value - a.value);

  const statusCount = allCandidates.reduce((acc, curr) => {
    const status = curr.interviewStatus || 'pendiente de entrevistar';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const interviewData = [
    { name: 'Pendiente', count: statusCount['pendiente de entrevistar'] || 0, fill: '#94a3b8' },
    { name: 'Entrevistando', count: statusCount['entrevistando'] || 0, fill: '#3b82f6' },
    { name: 'Entrevistado', count: statusCount['entrevistado'] || 0, fill: '#0059a3' }
  ];

  const COLORS = ['#0059a3', '#002b5c', '#0087d5', '#66b7e6', '#004280', '#339fdd', '#99cfee', '#001633'];

  const dateCount = allCandidates.reduce((acc, curr) => {
    const date = curr['Fecha Solicitud'] || 'Unknown';
    acc[date] = (acc[date] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const dateData = Object.keys(dateCount)
    .sort()
    .map(key => ({
      date: key,
      count: dateCount[key]
    }));

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
          <div className="p-3.5 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100/50">
            <Briefcase className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Perfiles Únicos</p>
            <h3 className="text-2xl font-bold text-slate-900 tracking-tight">{Object.keys(profileCount).length}</h3>
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
            <h3 className="text-lg font-bold text-slate-900 tracking-tight">
              {dateData.length > 0 ? dateData[dateData.length - 1].date : '-'}
            </h3>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/60">
          <h3 className="text-lg font-semibold mb-6 text-slate-800 tracking-tight">Candidatos por Perfil</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={profileData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                <XAxis type="number" tick={{fill: '#64748b'}} axisLine={{stroke: '#cbd5e1'}} tickLine={false} />
                <YAxis dataKey="name" type="category" width={150} tick={{fontSize: 12, fill: '#475569'}} axisLine={{stroke: '#cbd5e1'}} tickLine={false} />
                <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                <Bar dataKey="count" fill="#0059a3" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/60">
          <h3 className="text-lg font-semibold mb-6 text-slate-800 tracking-tight">Evolución de Solicitudes</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dateData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="date" tick={{fontSize: 12, fill: '#64748b'}} axisLine={{stroke: '#cbd5e1'}} tickLine={false} />
                <YAxis allowDecimals={false} tick={{fill: '#64748b'}} axisLine={{stroke: '#cbd5e1'}} tickLine={false} />
                <Tooltip contentStyle={{borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                <Line type="monotone" dataKey="count" stroke="#0059a3" strokeWidth={3} dot={{r: 4, fill: '#0059a3', strokeWidth: 2, stroke: '#fff'}} activeDot={{r: 6, strokeWidth: 0}} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/60">
          <h3 className="text-lg font-semibold mb-6 text-slate-800 tracking-tight">Distribución por Localización</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={locationData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={100}
                  innerRadius={60}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {locationData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                <Legend iconType="circle" wrapperStyle={{fontSize: '12px', color: '#475569'}} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/60">
          <h3 className="text-lg font-semibold mb-6 text-slate-800 tracking-tight">Estado de Entrevistas</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={interviewData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{fontSize: 12, fill: '#64748b'}} axisLine={{stroke: '#cbd5e1'}} tickLine={false} />
                <YAxis allowDecimals={false} tick={{fill: '#64748b'}} axisLine={{stroke: '#cbd5e1'}} tickLine={false} />
                <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {interviewData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
