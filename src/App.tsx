/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { AppProvider, useAppContext } from './AppContext';
import { Dashboard } from './components/Dashboard';
import { Candidatos } from './components/Candidatos';
import { DrivenValue } from './components/DrivenValue';
import { Offers } from './components/Offers';
import { LayoutDashboard, Users, FileUp, Briefcase, Sparkles, LogOut, RefreshCw, Zap } from 'lucide-react';

type Tab = 'dashboard' | 'candidatos' | 'driven-value' | 'ofertas';

function AppContent() {
  const { isRefreshing, fetchData, lastUpdated } = useAppContext();
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');

  const triggerWebhook = async () => {
    try {
      await fetch('https://imantero2.app.n8n.cloud/webhook-test/a939d9e3-af3f-451c-a01f-bd957343ac9a', {
        method: 'GET',
        mode: 'no-cors'
      });
    } catch (error) {
      console.error('Webhook trigger failed:', error);
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'candidatos':
        return <Candidatos />;
      case 'driven-value':
        return <DrivenValue />;
      case 'ofertas':
        return <Offers />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans text-slate-900">
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-white border-r border-slate-200 flex flex-col md:min-h-screen sticky top-0 z-10 shadow-sm">
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0 drop-shadow-sm">
              <rect width="36" height="36" rx="10" fill="url(#ntt-gradient)"/>
              <path d="M10 18C10 13.5817 13.5817 10 18 10C22.4183 10 26 13.5817 26 18C26 22.4183 22.4183 26 18 26" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="1 6"/>
              <path d="M14 18C14 15.7909 15.7909 14 18 14C20.2091 14 22 15.7909 22 18" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
              <circle cx="18" cy="18" r="2.5" fill="white"/>
              <defs>
                <linearGradient id="ntt-gradient" x1="0" y1="0" x2="36" y2="36" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#0059a3" />
                  <stop offset="1" stopColor="#002b5c" />
                </linearGradient>
              </defs>
            </svg>
            <div className="flex flex-col">
              <span className="text-xl font-black tracking-tight text-[#002b5c] leading-none">NTTDATA</span>
              <span className="text-[10px] font-bold tracking-[0.2em] text-[#0059a3] uppercase mt-1 leading-none">Recruiting</span>
            </div>
          </div>
        </div>
        
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
              activeTab === 'dashboard' 
                ? 'bg-ntt-blue-50 text-ntt-blue-700 font-semibold shadow-sm border border-ntt-blue-100/50' 
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium'
            }`}
          >
            <LayoutDashboard className={`h-5 w-5 ${activeTab === 'dashboard' ? 'text-ntt-blue-600' : 'text-slate-400'}`} />
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab('candidatos')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
              activeTab === 'candidatos' 
                ? 'bg-ntt-blue-50 text-ntt-blue-700 font-semibold shadow-sm border border-ntt-blue-100/50' 
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium'
            }`}
          >
            <Users className={`h-5 w-5 ${activeTab === 'candidatos' ? 'text-ntt-blue-600' : 'text-slate-400'}`} />
            Candidatos
          </button>
          <button
            onClick={() => setActiveTab('driven-value')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
              activeTab === 'driven-value' 
                ? 'bg-ntt-blue-50 text-ntt-blue-700 font-semibold shadow-sm border border-ntt-blue-100/50' 
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium'
            }`}
          >
            <FileUp className={`h-5 w-5 ${activeTab === 'driven-value' ? 'text-ntt-blue-600' : 'text-slate-400'}`} />
            Team Driven Value
          </button>
          <button
            onClick={() => setActiveTab('ofertas')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
              activeTab === 'ofertas' 
                ? 'bg-ntt-blue-50 text-ntt-blue-700 font-semibold shadow-sm border border-ntt-blue-100/50' 
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium'
            }`}
          >
            <Briefcase className={`h-5 w-5 ${activeTab === 'ofertas' ? 'text-ntt-blue-600' : 'text-slate-400'}`} />
            Ofertas
          </button>
        </nav>

        <div className="p-5 border-t border-slate-100 bg-slate-50/50 relative">
          <button 
            onClick={triggerWebhook}
            className="absolute bottom-2 left-2 p-1.5 opacity-0 hover:opacity-100 transition-opacity duration-300 rounded-md hover:bg-slate-200"
            title="Sincronizar n8n"
          >
            <Zap className="h-3 w-3 text-slate-400" />
          </button>
          <div className="text-xs text-slate-500 mb-4 text-center font-medium">
            Última actualización:<br/>
            <span className="text-slate-700 font-semibold">{lastUpdated.toLocaleTimeString()}</span>
          </div>
          <button 
            onClick={() => fetchData(true)}
            disabled={isRefreshing}
            className="w-full flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-700 px-4 py-2.5 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm disabled:opacity-50 font-medium text-sm"
          >
            <RefreshCw className={`h-4 w-4 text-slate-500 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Actualizar Datos</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-8 overflow-y-auto">
        <div className="max-w-7xl mx-auto">
          {renderContent()}
        </div>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

