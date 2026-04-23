import React, { useState } from 'react';
import { useAppContext } from '../AppContext';
import { Offer, Candidate } from '../types';
import { Plus, Briefcase, Users, CheckCircle, XCircle, Clock, Sparkles, MessageSquare, Eye, X } from 'lucide-react';
import { evaluateCandidateForOffer, evaluateAllCandidatesForOffer } from '../ai';

export const Offers: React.FC = () => {
  const { offers, addOffer, updateOffer, deleteOffer, allCandidates, applications, addApplication, updateApplicationStatus } = useAppContext();
  const [isAdding, setIsAdding] = useState(false);
  const [newOffer, setNewOffer] = useState<Partial<Offer>>({});
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
  const [isEditingOffer, setIsEditingOffer] = useState(false);
  const [editingOfferData, setEditingOfferData] = useState<Partial<Offer>>({});
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [viewingCandidate, setViewingCandidate] = useState<Candidate | null>(null);
  const [statusModal, setStatusModal] = useState<{ isOpen: boolean, appId: string, status: string, name: string }>({
    isOpen: false,
    appId: '',
    status: '',
    name: ''
  });

  const handleAddOffer = async () => {
    if (newOffer.title && newOffer.description) {
      const newOfferId = crypto.randomUUID();
      const offerToSave: Offer = {
        id: newOfferId,
        title: newOffer.title,
        description: newOffer.description,
        requirements: newOffer.requirements || '',
        status: 'open',
        type: newOffer.type || 'Staffing',
        client: newOffer.type === 'Proyecto' ? newOffer.client : undefined,
        projectCode: newOffer.type === 'Proyecto' ? newOffer.projectCode : undefined,
      };
      
      addOffer(offerToSave);
      setIsAdding(false);
      setNewOffer({});
      setSelectedOffer(offerToSave);

      // Auto-evaluate all candidates
      setIsEvaluating(true);
      try {
        const evaluations = await evaluateAllCandidatesForOffer(offerToSave, allCandidates);
        
        // Sort by score descending and take top 5
        const top5Evaluations = evaluations
          .sort((a: any, b: any) => b.score - a.score)
          .slice(0, 5);
        
        top5Evaluations.forEach((evalResult: any) => {
          addApplication({
            id: crypto.randomUUID(),
            candidateId: evalResult.candidateId,
            offerId: newOfferId,
            status: 'pending',
            aiRecommendation: evalResult.recommendation,
            isFit: evalResult.isFit,
            score: evalResult.score
          });
        });
      } catch (error) {
        console.error("Error auto-evaluating candidates:", error);
      }
      setIsEvaluating(false);
    }
  };

  const handleEvaluateCandidate = async (candidateId: string, offerId: string) => {
    setIsEvaluating(true);
    const candidate = allCandidates.find(c => c.id === candidateId);
    const offer = offers.find(o => o.id === offerId);

    if (candidate && offer) {
      try {
        const evaluation = await evaluateCandidateForOffer(candidate, offer);
        addApplication({
          id: crypto.randomUUID(),
          candidateId,
          offerId,
          status: 'pending',
          aiRecommendation: evaluation.recommendation,
          isFit: evaluation.isFit,
          score: evaluation.score
        });
      } catch (error) {
        console.error("Error evaluating candidate:", error);
        alert("Hubo un error al evaluar al candidato con IA.");
      }
    }
    setIsEvaluating(false);
  };

  const getApplicationsForOffer = (offerId: string) => {
    return applications.filter(app => app.offerId === offerId);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Gestión de Ofertas</h2>
        <button
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-xl hover:bg-blue-700 transition-all shadow-sm font-medium text-sm"
        >
          <Plus className="h-5 w-5" />
          Nueva Oferta
        </button>
      </div>

      {isAdding && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/60">
          <h3 className="text-lg font-semibold mb-6 text-slate-800 tracking-tight">Crear Nueva Oferta</h3>
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Título de la Oferta</label>
              <input
                type="text"
                className="w-full border border-slate-200 rounded-xl p-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all shadow-sm"
                value={newOffer.title || ''}
                onChange={e => setNewOffer({ ...newOffer, title: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Descripción</label>
              <textarea
                className="w-full border border-slate-200 rounded-xl p-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all shadow-sm"
                rows={3}
                value={newOffer.description || ''}
                onChange={e => setNewOffer({ ...newOffer, description: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Requisitos (separados por comas)</label>
              <input
                type="text"
                className="w-full border border-slate-200 rounded-xl p-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all shadow-sm"
                value={newOffer.requirements || ''}
                onChange={e => setNewOffer({ ...newOffer, requirements: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Tipo de Oferta</label>
              <select
                className="w-full border border-slate-200 rounded-xl p-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all shadow-sm bg-white"
                value={newOffer.type || 'Staffing'}
                onChange={e => setNewOffer({ ...newOffer, type: e.target.value as 'Staffing' | 'Proyecto' })}
              >
                <option value="Staffing">Staffing</option>
                <option value="Proyecto">Proyecto</option>
              </select>
            </div>
            {newOffer.type === 'Proyecto' && (
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Cliente</label>
                  <input
                    type="text"
                    className="w-full border border-slate-200 rounded-xl p-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all shadow-sm"
                    value={newOffer.client || ''}
                    onChange={e => setNewOffer({ ...newOffer, client: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Código del Proyecto</label>
                  <input
                    type="text"
                    className="w-full border border-slate-200 rounded-xl p-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all shadow-sm"
                    value={newOffer.projectCode || ''}
                    onChange={e => setNewOffer({ ...newOffer, projectCode: e.target.value })}
                  />
                </div>
              </div>
            )}
            <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-slate-100">
              <button
                onClick={() => setIsAdding(false)}
                className="px-4 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleAddOffer}
                disabled={isEvaluating}
                className="px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2 font-medium shadow-sm transition-all"
              >
                {isEvaluating ? 'Evaluando candidatos...' : 'Guardar Oferta'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Lista de Ofertas */}
        <div className="md:col-span-1 space-y-4">
          {offers.map(offer => (
            <div
              key={offer.id}
              onClick={() => setSelectedOffer(offer)}
              className={`p-5 rounded-2xl border cursor-pointer transition-all hover:shadow-md ${selectedOffer?.id === offer.id ? 'border-blue-500 bg-blue-50/50 shadow-sm' : 'border-slate-200/60 bg-white hover:border-blue-300'}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${selectedOffer?.id === offer.id ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-500'}`}>
                    <Briefcase className="h-5 w-5" />
                  </div>
                  <h3 className="font-semibold text-slate-900 tracking-tight">{offer.title}</h3>
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full ${offer.status === 'open' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'}`}>
                    {offer.status === 'open' ? 'Abierta' : 'Cerrada'}
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">
                    {offer.type || 'Staffing'}
                  </span>
                </div>
              </div>
              <p className="text-sm text-slate-500 mt-3 line-clamp-2">{offer.description}</p>
              <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-2 text-sm text-slate-500 font-medium">
                <Users className="h-4 w-4" />
                <span>{getApplicationsForOffer(offer.id).length} Candidatos</span>
              </div>
            </div>
          ))}
          {offers.length === 0 && !isAdding && (
            <div className="text-center p-8 bg-slate-50 rounded-2xl border border-dashed border-slate-300 text-slate-500">
              No hay ofertas creadas.
            </div>
          )}
        </div>

        {/* Detalle de Oferta y Candidatos */}
        <div className="md:col-span-2">
          {selectedOffer ? (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden">
              <div className="p-6 border-b border-slate-100">
                <div className="flex justify-between items-start mb-6">
                  <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                    {selectedOffer.title}
                    <span className="ml-3 text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 align-middle border border-indigo-100/50">
                      {selectedOffer.type || 'Staffing'}
                    </span>
                  </h2>
                  <div className="flex gap-2">
                    {!isEditingOffer && (
                      <button 
                        onClick={() => {
                          setIsEditingOffer(true);
                          setEditingOfferData(selectedOffer);
                        }}
                        className="px-4 py-2 text-sm font-medium border border-blue-200 text-blue-600 rounded-xl hover:bg-blue-50 transition-colors shadow-sm"
                      >
                        Editar
                      </button>
                    )}
                    <button 
                      onClick={() => updateOffer(selectedOffer.id, { status: selectedOffer.status === 'open' ? 'closed' : 'open' })}
                      className="px-4 py-2 text-sm font-medium border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors shadow-sm"
                    >
                      {selectedOffer.status === 'open' ? 'Cerrar Oferta' : 'Reabrir Oferta'}
                    </button>
                    <button 
                      onClick={() => { deleteOffer(selectedOffer.id); setSelectedOffer(null); setIsEditingOffer(false); }}
                      className="px-4 py-2 text-sm font-medium border border-red-200 text-red-600 rounded-xl hover:bg-red-50 transition-colors shadow-sm"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
                
                {isEditingOffer ? (
                  <div className="space-y-5 mb-4 bg-slate-50/50 p-5 rounded-xl border border-slate-100">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">Título de la Oferta</label>
                      <input
                        type="text"
                        className="w-full border border-slate-200 rounded-xl p-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all shadow-sm bg-white"
                        value={editingOfferData.title || ''}
                        onChange={e => setEditingOfferData({ ...editingOfferData, title: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">Descripción</label>
                      <textarea
                        className="w-full border border-slate-200 rounded-xl p-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all shadow-sm bg-white"
                        rows={3}
                        value={editingOfferData.description || ''}
                        onChange={e => setEditingOfferData({ ...editingOfferData, description: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">Requisitos (separados por comas)</label>
                      <input
                        type="text"
                        className="w-full border border-slate-200 rounded-xl p-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all shadow-sm bg-white"
                        value={editingOfferData.requirements || ''}
                        onChange={e => setEditingOfferData({ ...editingOfferData, requirements: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">Tipo de Oferta</label>
                      <select
                        className="w-full border border-slate-200 rounded-xl p-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all shadow-sm bg-white"
                        value={editingOfferData.type || 'Staffing'}
                        onChange={e => setEditingOfferData({ ...editingOfferData, type: e.target.value as 'Staffing' | 'Proyecto' })}
                      >
                        <option value="Staffing">Staffing</option>
                        <option value="Proyecto">Proyecto</option>
                      </select>
                    </div>
                    {editingOfferData.type === 'Proyecto' && (
                      <div className="grid grid-cols-2 gap-5">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1.5">Cliente</label>
                          <input
                            type="text"
                            className="w-full border border-slate-200 rounded-xl p-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all shadow-sm bg-white"
                            value={editingOfferData.client || ''}
                            onChange={e => setEditingOfferData({ ...editingOfferData, client: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1.5">Código del Proyecto</label>
                          <input
                            type="text"
                            className="w-full border border-slate-200 rounded-xl p-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all shadow-sm bg-white"
                            value={editingOfferData.projectCode || ''}
                            onChange={e => setEditingOfferData({ ...editingOfferData, projectCode: e.target.value })}
                          />
                        </div>
                      </div>
                    )}
                    <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-slate-200/60">
                      <button
                        onClick={() => setIsEditingOffer(false)}
                        className="px-4 py-2.5 text-slate-600 hover:bg-slate-200/50 rounded-xl font-medium transition-colors"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={() => {
                          if (selectedOffer && editingOfferData.title && editingOfferData.description) {
                            updateOffer(selectedOffer.id, editingOfferData);
                            setSelectedOffer({ ...selectedOffer, ...editingOfferData } as Offer);
                            setIsEditingOffer(false);
                          }
                        }}
                        className="px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-medium shadow-sm transition-all"
                      >
                        Guardar Cambios
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="text-slate-600 mb-6 leading-relaxed">{selectedOffer.description}</p>
                    {selectedOffer.type === 'Proyecto' && (
                      <div className="mb-6 flex gap-6 text-sm text-slate-700 bg-slate-50 p-4 rounded-xl border border-slate-100">
                        <div className="flex flex-col"><span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Cliente</span> <span className="font-medium">{selectedOffer.client || 'N/A'}</span></div>
                        <div className="flex flex-col"><span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Código</span> <span className="font-medium">{selectedOffer.projectCode || 'N/A'}</span></div>
                      </div>
                    )}
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Requisitos</h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedOffer.requirements.split(',').map((req, i) => (
                          <span key={i} className="px-3 py-1.5 bg-slate-100 text-slate-700 text-xs font-medium rounded-lg border border-slate-200/50">
                            {req.trim()}
                          </span>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div className="p-6 bg-slate-50/50">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                  <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2 tracking-tight">
                    <Users className="h-5 w-5 text-slate-400" /> Candidatos Vinculados
                  </h3>
                  
                  {/* Vincular nuevo candidato */}
                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <select 
                      id="candidate-select"
                      className="flex-1 sm:w-64 border border-slate-200 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none shadow-sm transition-all bg-white"
                      defaultValue=""
                    >
                      <option value="" disabled>Vincular candidato...</option>
                      {allCandidates
                        .filter(c => !getApplicationsForOffer(selectedOffer.id).some(app => app.candidateId === c.id))
                        .map(c => (
                        <option key={c.id} value={c.id}>{c.Nombre} - {c.Perfil}</option>
                      ))}
                    </select>
                    <button 
                      onClick={() => {
                        const select = document.getElementById('candidate-select') as HTMLSelectElement;
                        if (select.value) {
                          handleEvaluateCandidate(select.value, selectedOffer.id);
                          select.value = "";
                        }
                      }}
                      disabled={isEvaluating}
                      className="px-4 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2 shadow-sm transition-all whitespace-nowrap"
                    >
                      {isEvaluating ? 'Evaluando...' : 'Vincular'}
                    </button>
                  </div>
                </div>
                
                <div className="space-y-4">
                  {getApplicationsForOffer(selectedOffer.id).map(app => {
                    const candidate = allCandidates.find(c => c.id === app.candidateId);
                    if (!candidate) return null;

                    return (
                      <div key={app.id} className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm flex flex-col gap-5 hover:shadow-md transition-all">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-700 font-bold text-lg shrink-0 border border-slate-200/50">
                              {candidate.Nombre.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <div className="flex items-center gap-3 mb-1.5">
                                <h4 
                                  className="font-semibold text-blue-600 hover:text-blue-800 text-lg cursor-pointer hover:underline tracking-tight"
                                  onClick={() => setViewingCandidate(candidate)}
                                >
                                  {candidate.Nombre}
                                </h4>
                                <span className="px-3 py-1 bg-white border border-slate-200 text-slate-700 text-xs font-semibold rounded-full shadow-sm">
                                  {candidate.Perfil}
                                </span>
                              </div>
                              <p className="text-sm text-slate-500">
                                {candidate['Key Knowledge']?.split(',').slice(0, 4).join(' ')} {candidate['Key Knowledge']?.split(',').length > 4 ? '+1' : ''}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-6 w-full sm:w-auto justify-end">
                            <div className="text-center">
                              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">Match</div>
                              <div className="text-emerald-600 font-black text-xl leading-none">{app.score || (app.isFit ? 85 : 40)}%</div>
                            </div>

                            <div className="flex items-center gap-2">
                              <button 
                                onClick={() => setViewingCandidate(candidate)}
                                className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors"
                                title="Ver Perfil Completo"
                              >
                                <Eye className="h-4 w-4" />
                                <span className="hidden sm:inline">Ver Perfil</span>
                              </button>
                              {app.status === 'pending' && <span className="flex items-center gap-1.5 text-sm font-medium px-3 py-2 bg-amber-50 text-amber-700 rounded-xl border border-amber-100/50"><Clock className="h-4 w-4"/> Pendiente</span>}
                              {app.status === 'pass' && <span className="flex items-center gap-1.5 text-sm font-medium px-3 py-2 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-100/50"><CheckCircle className="h-4 w-4"/> Apto</span>}
                              {app.status === 'no-pass' && <span className="flex items-center gap-1.5 text-sm font-medium px-3 py-2 bg-red-50 text-red-700 rounded-xl border border-red-100/50"><XCircle className="h-4 w-4"/> No Apto</span>}
                            </div>
                          </div>
                        </div>

                        {app.aiRecommendation && (
                          <div className={`p-4 rounded-xl text-sm ${app.isFit ? 'bg-emerald-50/50 text-emerald-800 border border-emerald-100/50' : 'bg-amber-50/50 text-amber-800 border border-amber-100/50'}`}>
                            <div className="flex items-center gap-1.5 font-semibold mb-2">
                              <Sparkles className="h-4 w-4" />
                              Recomendación IA: {app.isFit ? 'Buen Encaje' : 'No Recomendado'}
                            </div>
                            <p className="leading-relaxed">{app.aiRecommendation}</p>
                          </div>
                        )}

                        {app.decidedBy && (
                          <div className="text-xs text-slate-500 mt-2 flex items-center gap-1.5 bg-slate-50 p-2 rounded-lg border border-slate-100">
                            <span className="font-semibold text-slate-700">Decisión tomada por:</span> {app.decidedBy}
                          </div>
                        )}

                        <div className="flex gap-3 pt-2">
                          <button 
                            onClick={() => setStatusModal({ isOpen: true, appId: app.id, status: 'pass', name: '' })}
                            className={`flex-1 py-2 text-sm font-medium rounded-xl transition-all shadow-sm ${app.status === 'pass' ? 'bg-emerald-600 text-white shadow-emerald-200' : 'bg-white border border-slate-200 text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200'}`}
                          >
                            Marcar Apto
                          </button>
                          <button 
                            onClick={() => setStatusModal({ isOpen: true, appId: app.id, status: 'no-pass', name: '' })}
                            className={`flex-1 py-2 text-sm font-medium rounded-xl transition-all shadow-sm ${app.status === 'no-pass' ? 'bg-red-600 text-white shadow-red-200' : 'bg-white border border-slate-200 text-slate-700 hover:bg-red-50 hover:text-red-700 hover:border-red-200'}`}
                          >
                            Marcar No Apto
                          </button>
                        </div>
                      </div>
                    );
                  })}

                  {getApplicationsForOffer(selectedOffer.id).length === 0 && (
                    <p className="text-slate-500 text-sm text-center py-8 bg-white rounded-2xl border border-dashed border-slate-200">No hay candidatos vinculados a esta oferta aún.</p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 rounded-2xl border border-dashed border-slate-300 h-full min-h-[400px] flex flex-col items-center justify-center text-slate-500 p-8 text-center">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm border border-slate-100">
                <Briefcase className="h-8 w-8 text-slate-300" />
              </div>
              <p className="font-medium text-slate-600">Selecciona una oferta para ver sus detalles y candidatos.</p>
            </div>
          )}
        </div>
      </div>

      {/* Candidate Details Modal */}
      {viewingCandidate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-full flex items-center justify-center text-blue-700 font-bold text-lg shrink-0 border border-blue-100/50">
                  {viewingCandidate.Nombre ? viewingCandidate.Nombre.trim().split(/\s+/).map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() : '?'}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 leading-none mb-1">{viewingCandidate.Nombre}</h2>
                  <span className="text-sm text-gray-500 font-medium">{viewingCandidate.Perfil || 'Sin Perfil'}</span>
                </div>
              </div>
              <button 
                onClick={() => setViewingCandidate(null)}
                className="p-2 text-gray-400 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              {selectedOffer && (
                <div className="mb-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-3 border-b border-gray-100 pb-2">Evaluación para: {selectedOffer.title}</h3>
                  {(() => {
                    const app = applications.find(a => a.candidateId === viewingCandidate.id && a.offerId === selectedOffer.id);
                    if (!app) return <p className="text-sm text-gray-500">No hay evaluación disponible.</p>;
                    
                    return (
                      <div className="space-y-4">
                        <div className="flex items-center gap-4">
                          <div className="bg-gray-50 px-4 py-2 rounded-lg border border-gray-200">
                            <span className="block text-xs text-gray-500 mb-1">Match Score</span>
                            <span className="text-xl font-bold text-emerald-600">{app.score || (app.isFit ? 85 : 40)}%</span>
                          </div>
                          <div className="bg-gray-50 px-4 py-2 rounded-lg border border-gray-200">
                            <span className="block text-xs text-gray-500 mb-1">Estado</span>
                            <span className="text-sm font-medium text-gray-900">
                              {app.status === 'pending' ? 'Pendiente' : app.status === 'pass' ? 'Apto' : 'No Apto'}
                            </span>
                            {app.decidedBy && (
                              <span className="block text-xs text-gray-500 mt-1">por {app.decidedBy}</span>
                            )}
                          </div>
                        </div>
                        {app.aiRecommendation && (
                          <div className={`p-4 rounded-lg ${app.isFit ? 'bg-emerald-50 border border-emerald-100' : 'bg-orange-50 border border-orange-100'}`}>
                            <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                              <Sparkles className="h-4 w-4" />
                              Recomendación de la IA
                            </h4>
                            <p className="text-sm text-gray-700 whitespace-pre-wrap">{app.aiRecommendation}</p>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              )}

              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-3 border-b border-gray-100 pb-2">Información del Candidato</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {Object.entries(viewingCandidate)
                    .filter(([key]) => !['id', 'source', 'isDrivenValue', 'drivenValueStatus', 'status', 'step', 'rating', 'comments', 'customFields'].includes(key))
                    .map(([key, value]) => (
                      <div key={key} className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                        <span className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">{key}</span>
                        <span className="block text-sm text-gray-900 break-words">{String(value || '-')}</span>
                      </div>
                    ))}
                </div>
              </div>
            </div>
            
            <div className="p-6 border-t border-gray-100 flex justify-end shrink-0">
              <button 
                onClick={() => setViewingCandidate(null)}
                className="px-6 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-medium"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Status Decision Modal */}
      {statusModal.isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[60]">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md flex flex-col p-6 border border-slate-100">
            <h3 className="text-xl font-bold text-slate-900 mb-2">Confirmar Decisión</h3>
            <p className="text-sm text-slate-600 mb-6">
              Por favor, introduce tu nombre para registrar que has marcado a este candidato como <span className="font-bold">{statusModal.status === 'pass' ? 'Apto' : 'No Apto'}</span>.
            </p>
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Tu Nombre</label>
              <input
                type="text"
                placeholder="Ej. Juan Pérez"
                className="w-full border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all shadow-sm"
                value={statusModal.name}
                onChange={(e) => setStatusModal({ ...statusModal, name: e.target.value })}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && statusModal.name.trim() !== '') {
                    updateApplicationStatus(statusModal.appId, statusModal.status, statusModal.name.trim());
                    setStatusModal({ isOpen: false, appId: '', status: '', name: '' });
                  }
                }}
              />
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setStatusModal({ isOpen: false, appId: '', status: '', name: '' })}
                className="px-4 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  if (statusModal.name.trim() !== '') {
                    updateApplicationStatus(statusModal.appId, statusModal.status, statusModal.name.trim());
                    setStatusModal({ isOpen: false, appId: '', status: '', name: '' });
                  }
                }}
                disabled={statusModal.name.trim() === ''}
                className="px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-medium transition-colors disabled:opacity-50 shadow-sm"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
