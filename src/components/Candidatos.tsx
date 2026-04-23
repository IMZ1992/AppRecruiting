import React, { useState } from 'react';
import { useAppContext } from '../AppContext';
import { Search, Edit2, X, Plus, Download, MapPin, Briefcase, Mail, Phone, MessageSquare, ExternalLink, CheckCircle, XCircle, Clock } from 'lucide-react';
import { Candidate } from '../types';
import * as XLSX from 'xlsx';
import { KeyKnowledgeBadges } from './KeyKnowledgeBadges';

export const Candidatos: React.FC = () => {
  const { allCandidates, updateCandidate, customFields, addCustomField, applications, offers } = useAppContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [editingCandidate, setEditingCandidate] = useState<Candidate | null>(null);
  const [newField, setNewField] = useState('');
  const [showNewFieldInput, setShowNewFieldInput] = useState(false);
  const [activeTab, setActiveTab] = useState<'Todos' | 'Aprobados' | 'Descartados' | 'Pendientes'>('Todos');
  const [filterEntrevistador, setFilterEntrevistador] = useState('');
  const [filterResponsable, setFilterResponsable] = useState('');

  const uniqueEntrevistadores = Array.from(new Set(allCandidates.map(c => c.Entrevistador).filter(Boolean))) as string[];
  const uniqueResponsables = Array.from(new Set(allCandidates.map(c => c.responsable).filter(Boolean))) as string[];

  const getCandidateStatusInfo = (candidateId: string) => {
    const candidateApps = applications.filter(app => app.candidateId === candidateId);
    if (candidateApps.length === 0) return { status: 'unassigned', match: null };
    
    const hasPass = candidateApps.some(app => app.status === 'pass');
    const hasNoPass = candidateApps.some(app => app.status === 'no-pass');
    const hasPending = candidateApps.some(app => app.status === 'pending');
    
    let status = 'unassigned';
    if (hasPass) status = 'pass';
    else if (hasNoPass) status = 'no-pass';
    else if (hasPending) status = 'pending';
    
    const maxScore = Math.max(...candidateApps.map(app => app.score || (app.isFit ? 85 : 40)));
    
    return { status, match: maxScore };
  };

  const candidatesWithStatus = allCandidates.map(c => ({
    ...c,
    ...getCandidateStatusInfo(c.id)
  }));

  const filteredByTab = candidatesWithStatus.filter(c => {
    if (activeTab === 'Todos') return true;
    if (activeTab === 'Aprobados') return c.status === 'pass';
    if (activeTab === 'Descartados') return c.status === 'no-pass';
    if (activeTab === 'Pendientes') return c.status === 'pending' || c.status === 'unassigned';
    return true;
  });

  const finalFilteredData = filteredByTab.filter(candidate => {
    const matchesSearch = Object.values(candidate).some(val => 
      String(val).toLowerCase().includes(searchTerm.toLowerCase())
    );
    const matchesEntrevistador = filterEntrevistador ? candidate.Entrevistador === filterEntrevistador : true;
    const matchesResponsable = filterResponsable ? candidate.responsable === filterResponsable : true;
    
    return matchesSearch && matchesEntrevistador && matchesResponsable;
  });

  const counts = {
    Todos: candidatesWithStatus.length,
    Aprobados: candidatesWithStatus.filter(c => c.status === 'pass').length,
    Descartados: candidatesWithStatus.filter(c => c.status === 'no-pass').length,
    Pendientes: candidatesWithStatus.filter(c => c.status === 'pending' || c.status === 'unassigned').length,
  };

  const handleSave = () => {
    if (editingCandidate) {
      updateCandidate(editingCandidate.id, editingCandidate);
      setEditingCandidate(null);
    }
  };

  const handleAddField = () => {
    if (newField.trim()) {
      addCustomField(newField.trim());
      setNewField('');
      setShowNewFieldInput(false);
    }
  };

  const handleDownload = () => {
    const worksheet = XLSX.utils.json_to_sheet(allCandidates);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Candidatos");
    XLSX.writeFile(workbook, "candidatos.xlsx");
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between gap-4 items-start sm:items-center">
        <div className="flex items-center gap-2 bg-slate-100/80 p-1.5 rounded-xl w-full sm:w-auto overflow-x-auto shadow-inner">
          {(['Todos', 'Aprobados', 'Descartados', 'Pendientes'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                activeTab === tab 
                  ? 'bg-white text-slate-900 shadow-sm border border-slate-200/50' 
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
              }`}
            >
              {tab} ({counts[tab]})
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-none">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Buscar candidatos..."
              className="pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 w-full sm:w-64 bg-white text-sm shadow-sm transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button 
            onClick={handleDownload}
            className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-4 py-2.5 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all text-sm font-medium shadow-sm shrink-0"
          >
            <Download className="h-4 w-4 text-slate-500" />
            <span className="hidden sm:inline">Exportar</span>
          </button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <select
          className="p-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none bg-white shadow-sm flex-1"
          value={filterEntrevistador}
          onChange={(e) => setFilterEntrevistador(e.target.value)}
        >
          <option value="">Todos los Entrevistadores</option>
          {uniqueEntrevistadores.map(e => (
            <option key={e} value={e}>{e}</option>
          ))}
        </select>
        <select
          className="p-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none bg-white shadow-sm flex-1"
          value={filterResponsable}
          onChange={(e) => setFilterResponsable(e.target.value)}
        >
          <option value="">Todos los Responsables</option>
          {uniqueResponsables.map(r => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
      </div>

      <div className="space-y-4">
        {finalFilteredData.length > 0 ? (
          finalFilteredData.map((candidate) => (
            <div 
              key={candidate.id} 
              className="bg-white rounded-2xl p-5 border border-slate-200/60 shadow-sm hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 group cursor-pointer"
              onClick={() => setEditingCandidate({ ...candidate })}
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-700 font-bold text-sm shrink-0 border border-slate-200/50">
                  {candidate.Nombre ? candidate.Nombre.trim().split(/\s+/).map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() : '?'}
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-1.5 flex-wrap">
                    <h3 className="font-semibold text-slate-900 text-lg leading-none tracking-tight">{candidate.Nombre || 'Sin Nombre'}</h3>
                    <span className="px-3 py-1 bg-white border border-slate-200 text-slate-700 text-xs font-semibold rounded-full shadow-sm">
                      {candidate.Perfil || candidate.Candidatura || 'Sin Perfil'}
                    </span>
                  </div>
                  <div className="mb-2">
                    <KeyKnowledgeBadges knowledge={candidate['Key Knowledge']} />
                  </div>
                  <div className="flex gap-3 mt-2">
                    {candidate.Entrevistador && (
                      <span className="text-xs text-slate-500 bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
                        <span className="font-semibold">Entrevistador:</span> {candidate.Entrevistador}
                      </span>
                    )}
                    {candidate.responsable && (
                      <span className="text-xs text-slate-500 bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
                        <span className="font-semibold">Responsable:</span> {candidate.responsable}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-6 sm:gap-8 justify-between sm:justify-end w-full sm:w-auto border-t sm:border-t-0 border-slate-100 pt-4 sm:pt-0">
                {candidate.interviewStatus && (
                  <div className="flex items-center">
                    <span className={`px-3 py-1.5 text-xs font-medium rounded-full border ${
                      candidate.interviewStatus === 'pendiente de entrevistar' ? 'bg-amber-50 text-amber-700 border-amber-200/50' :
                      candidate.interviewStatus === 'entrevistando' ? 'bg-blue-50 text-blue-700 border-blue-200/50' :
                      candidate.interviewStatus === 'entrevistado' ? 'bg-emerald-50 text-emerald-700 border-emerald-200/50' :
                      'bg-slate-50 text-slate-700 border-slate-200/50'
                    }`}>
                      {candidate.interviewStatus === 'pendiente de entrevistar' ? 'Pendiente de entrevistar' :
                       candidate.interviewStatus === 'entrevistando' ? 'Entrevistando' :
                       candidate.interviewStatus === 'entrevistado' ? 'Entrevistado' : candidate.interviewStatus}
                    </span>
                  </div>
                )}
                
                {candidate.match !== null && (
                  <div className="text-center min-w-[60px]">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">Match</div>
                    <div className={`font-black text-xl leading-none ${candidate.match >= 80 ? 'text-emerald-600' : candidate.match >= 50 ? 'text-amber-500' : 'text-red-600'}`}>
                      {candidate.match}%
                    </div>
                  </div>
                )}
                
                <div className="w-32 flex justify-end">
                  {candidate.status === 'pass' && (
                    <span className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-full text-sm font-medium border border-emerald-100/50">
                      <CheckCircle className="w-4 h-4" /> Aprobado
                    </span>
                  )}
                  {candidate.status === 'no-pass' && (
                    <span className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-700 rounded-full text-sm font-medium border border-red-100/50">
                      <XCircle className="w-4 h-4" /> Descartado
                    </span>
                  )}
                  {(candidate.status === 'pending' || candidate.status === 'unassigned') && (
                    <span className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 text-slate-600 rounded-full text-sm font-medium border border-slate-200/50">
                      <Clock className="w-4 h-4" /> Pendiente
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="py-16 text-center bg-white rounded-2xl border border-slate-200 border-dashed">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
              <Search className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-900 mb-1 tracking-tight">No se encontraron candidatos</h3>
            <p className="text-slate-500">Intenta ajustar los términos de búsqueda o cambiar de pestaña.</p>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editingCandidate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10">
              <h2 className="text-xl font-bold text-gray-900">Editar Candidato</h2>
              <button 
                onClick={() => setEditingCandidate(null)}
                className="p-2 text-gray-400 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                  <input 
                    type="text" 
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    value={editingCandidate.Nombre || ''}
                    onChange={e => setEditingCandidate({...editingCandidate, Nombre: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Perfil</label>
                  <input 
                    type="text" 
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    value={editingCandidate.Perfil || ''}
                    onChange={e => setEditingCandidate({...editingCandidate, Perfil: e.target.value})}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Key Knowledge</label>
                  <input 
                    type="text" 
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    value={editingCandidate['Key Knowledge'] || ''}
                    onChange={e => setEditingCandidate({...editingCandidate, 'Key Knowledge': e.target.value})}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Conocimiento</label>
                  <input 
                    type="text" 
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    value={editingCandidate.Conocimiento || ''}
                    onChange={e => setEditingCandidate({...editingCandidate, Conocimiento: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Localización</label>
                  <input 
                    type="text" 
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    value={editingCandidate.Localización || ''}
                    onChange={e => setEditingCandidate({...editingCandidate, Localización: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Candidatura</label>
                  <input 
                    type="text" 
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    value={editingCandidate.Candidatura || ''}
                    onChange={e => setEditingCandidate({...editingCandidate, Candidatura: e.target.value})}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Información del Contacto</label>
                  <input 
                    type="text" 
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    value={editingCandidate['Información del Contacto'] || ''}
                    onChange={e => setEditingCandidate({...editingCandidate, 'Información del Contacto': e.target.value})}
                  />
                </div>

                {/* New Fields */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Entrevistador</label>
                  <input 
                    type="text" 
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    value={editingCandidate.Entrevistador || ''}
                    onChange={e => setEditingCandidate({...editingCandidate, Entrevistador: e.target.value})}
                    placeholder="¿Quién lo está entrevistando?"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Responsable</label>
                  <input 
                    type="text" 
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    value={editingCandidate.responsable || ''}
                    onChange={e => setEditingCandidate({...editingCandidate, responsable: e.target.value})}
                    placeholder="Responsable de la decisión"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Estado de Entrevista</label>
                  <select 
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                    value={editingCandidate.interviewStatus || ''}
                    onChange={e => setEditingCandidate({...editingCandidate, interviewStatus: e.target.value as any})}
                  >
                    <option value="">Seleccionar estado...</option>
                    <option value="pendiente de entrevistar">Pendiente de entrevistar</option>
                    <option value="entrevistando">Entrevistando</option>
                    <option value="entrevistado">Entrevistado</option>
                  </select>
                </div>
                <div className="md:col-span-2 flex items-center gap-2 mt-2">
                  <input 
                    type="checkbox" 
                    id="isDrivenValue"
                    className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                    checked={editingCandidate.isDrivenValue || false}
                    onChange={e => setEditingCandidate({...editingCandidate, isDrivenValue: e.target.checked})}
                  />
                  <label htmlFor="isDrivenValue" className="text-sm font-medium text-gray-700">
                    Es Team Driven Value
                  </label>
                </div>
                
                {/* Custom Fields */}
                {customFields.map(field => (
                  <div key={field} className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">{field}</label>
                    <input 
                      type="text" 
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      value={editingCandidate[field] || ''}
                      onChange={e => setEditingCandidate({...editingCandidate, [field]: e.target.value})}
                    />
                  </div>
                ))}
              </div>

              {/* Add Custom Field */}
              <div className="mt-6 pt-6 border-t border-gray-100">
                {!showNewFieldInput ? (
                  <button 
                    onClick={() => setShowNewFieldInput(true)}
                    className="flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
                  >
                    <Plus className="h-4 w-4" /> Añadir nuevo campo
                  </button>
                ) : (
                  <div className="flex gap-2 items-center">
                    <input 
                      type="text" 
                      placeholder="Nombre del campo..."
                      className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                      value={newField}
                      onChange={e => setNewField(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleAddField()}
                    />
                    <button 
                      onClick={handleAddField}
                      className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
                    >
                      Añadir
                    </button>
                    <button 
                      onClick={() => setShowNewFieldInput(false)}
                      className="p-2 text-gray-400 hover:text-gray-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Linked Offers */}
              <div className="mt-6 pt-6 border-t border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Ofertas Vinculadas</h3>
                {applications.filter(a => a.candidateId === editingCandidate.id).length > 0 ? (
                  <div className="space-y-3">
                    {applications.filter(a => a.candidateId === editingCandidate.id).map(app => {
                      const offer = offers.find(o => o.id === app.offerId);
                      if (!offer) return null;
                      return (
                        <div key={app.candidateId + '-' + app.offerId} className="p-4 bg-gray-50 rounded-lg border border-gray-200 flex justify-between items-center">
                          <div>
                            <h4 className="font-medium text-gray-900">{offer.title}</h4>
                            <p className="text-sm text-gray-500">{offer.status === 'open' ? 'Abierta' : 'Cerrada'}</p>
                          </div>
                          <div>
                            {app.status === 'pending' && <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">Pendiente</span>}
                            {app.status === 'pass' && <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Apto</span>}
                            {app.status === 'no-pass' && <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">No Apto</span>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">Este candidato no está vinculado a ninguna oferta.</p>
                )}
              </div>
            </div>
            
            <div className="p-6 border-t border-gray-100 flex justify-end gap-3 sticky bottom-0 bg-white">
              <button 
                onClick={() => setEditingCandidate(null)}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={handleSave}
                className="px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
              >
                Guardar Cambios
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

