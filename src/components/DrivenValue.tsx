import React, { useState, useRef } from 'react';
import { useAppContext } from '../AppContext';
import { Upload, FileText, CheckCircle, Search, Sparkles, User, Briefcase, MapPin, Edit2, X, Trash2, Download, Plus } from 'lucide-react';
import * as XLSX from 'xlsx';
import { Candidate } from '../types';
import { recommendCandidatesForNeeds } from '../ai';

export const DrivenValue: React.FC = () => {
  const { allCandidates, addDrivenValueCandidates, updateCandidate, deleteDrivenValueCandidate } = useAppContext();
  const [isDragging, setIsDragging] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // AI Search State
  const [needs, setNeeds] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [recommendations, setRecommendations] = useState<{ candidate: Candidate; reason: string; score: number }[]>([]);

  // Edit State
  const [editingCandidate, setEditingCandidate] = useState<Candidate | null>(null);
  const [candidateToDelete, setCandidateToDelete] = useState<Candidate | null>(null);

  const teamCandidates = allCandidates.filter(c => c.source === 'driven-value' || c.isDrivenValue);

  const standardKeys = ['id', 'source', 'drivenValueStatus', 'Nombre', 'Perfil', 'Localización', 'Key Knowledge', 'isDrivenValue', 'status', 'step', 'rating', 'comments', 'customFields'];
  const allKeys = new Set<string>();
  teamCandidates.forEach(c => {
    Object.keys(c).forEach(k => {
      if (!standardKeys.includes(k) && typeof (c as any)[k] !== 'object') {
        allKeys.add(k);
      }
    });
  });
  const dynamicColumns = Array.from(allKeys);

  const handleFileUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary', cellDates: true });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(worksheet, { raw: false, dateNF: 'dd/mm/yyyy' });

        const parsed = json.map((row: any, index: number) => {
          const id = `driven-${Date.now()}-${index}`;
          
          // Helper to find a key ignoring case and spaces
          const findValue = (keys: string[]) => {
            const rowKeys = Object.keys(row);
            for (const key of keys) {
              const foundKey = rowKeys.find(k => k.toLowerCase().trim() === key.toLowerCase().trim());
              if (foundKey && row[foundKey]) return String(row[foundKey]);
            }
            return '';
          };

          return {
            ...row,
            Nombre: findValue(['Nombre y apellidos', 'Nombre y apellido', 'Nombre', 'Name', 'Candidato', 'Full Name', 'Nombre completo']),
            Perfil: findValue(['Perfil', 'Profile', 'Role', 'Rol', 'Puesto', 'Title', 'Job Title']),
            Localización: findValue(['Localización', 'Localizacion', 'Location', 'Ciudad', 'City', 'Ubicación', 'Ubicacion']),
            'Key Knowledge': findValue(['Key Knowledge', 'Knowledge', 'Conocimientos', 'Skills', 'Habilidades', 'Stack', 'Tecnologías']),
            id,
            source: 'driven-value' as const,
            drivenValueStatus: findValue(['Estado', 'Status', 'Staffing', 'Disponibilidad']) || 'Staffing'
          };
        });
        addDrivenValueCandidates(parsed);
        setUploadSuccess(true);
        setTimeout(() => setUploadSuccess(false), 3000);
      } catch (error: any) {
        alert('Error al procesar el archivo Excel: ' + error.message);
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleSearch = async () => {
    if (!needs.trim()) return;
    setIsSearching(true);
    try {
      // Search only within team candidates
      const results = await recommendCandidatesForNeeds(needs, teamCandidates);
      const mappedResults = results.map((r: any) => {
        const candidate = teamCandidates.find(c => c.id === r.candidateId);
        return {
          candidate: candidate as Candidate,
          reason: r.justification,
          score: r.score || 100
        };
      }).filter((r: any) => r.candidate !== undefined);
      setRecommendations(mappedResults);
    } catch (error) {
      console.error("Error al buscar recomendaciones:", error);
      alert("Hubo un error al procesar la solicitud con IA.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleSave = () => {
    if (editingCandidate) {
      updateCandidate(editingCandidate.id, editingCandidate);
      setEditingCandidate(null);
    }
  };

  const handleDownload = () => {
    if (teamCandidates.length === 0) return;
    
    const exportData = teamCandidates.map(c => {
      const row: any = {
        'Nombre': c.Nombre || '',
        'Perfil': c.Perfil || '',
        'Localización': c.Localización || '',
        'Key Knowledge': c['Key Knowledge'] || '',
        'Estado': c.drivenValueStatus || 'Staffing',
      };
      
      if (c.drivenValueStatus === 'Proyecto') {
        row['Cliente'] = c.Cliente || '';
      }

      Object.keys(c).forEach(k => {
        if (!['id', 'source', 'isDrivenValue', 'drivenValueStatus', 'status', 'step', 'rating', 'comments', 'customFields', 'Nombre', 'Perfil', 'Localización', 'Key Knowledge', 'Cliente'].includes(k)) {
          row[k] = (c as any)[k];
        }
      });
      
      return row;
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Equipo");
    XLSX.writeFile(workbook, "Team_Driven_Value.xlsx");
  };

  return (
    <div className="space-y-8">
      {/* AI Search Section */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/60">
        <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-2 tracking-tight">
          <Sparkles className="h-6 w-6 text-indigo-600" />
          Buscador de Necesidades (Team Driven Value)
        </h2>
        <p className="text-slate-600 mb-6 leading-relaxed">
          Describe las necesidades del cliente. La IA analizará los perfiles del equipo Driven Value y recomendará los que mejor se ajusten.
        </p>

        <div className="space-y-4">
          <textarea
            className="w-full border border-slate-200 rounded-xl p-4 min-h-[120px] focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all shadow-sm resize-y"
            placeholder="Ej: Necesitamos un desarrollador frontend senior con experiencia en React y TypeScript..."
            value={needs}
            onChange={(e) => setNeeds(e.target.value)}
          />
          <div className="flex justify-end">
            <button
              onClick={handleSearch}
              disabled={isSearching || !needs.trim()}
              className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
            >
              {isSearching ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Analizando perfiles...
                </>
              ) : (
                <>
                  <Search className="h-5 w-5" />
                  Buscar Candidatos
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {recommendations.length > 0 && (
        <div className="space-y-5">
          <h3 className="text-xl font-bold text-slate-900 mb-4 tracking-tight">Candidatos Recomendados ({recommendations.length})</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {recommendations.map((rec, index) => (
              <div key={index} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/60 hover:shadow-md hover:border-indigo-300 transition-all">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-4">
                    <div className="bg-indigo-50 p-3 rounded-xl text-indigo-600 border border-indigo-100/50">
                      <User className="h-6 w-6" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-lg tracking-tight">{rec.candidate.Nombre}</h4>
                      <div className="flex items-center gap-2 text-sm text-slate-500 mt-1">
                        <Briefcase className="h-4 w-4" /> {rec.candidate.Perfil}
                      </div>
                    </div>
                  </div>
                  <div className="bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-full text-sm font-bold border border-indigo-100/50 shadow-sm">
                    Match: {rec.score}%
                  </div>
                </div>
                
                <div className="mb-5 text-sm text-slate-600 flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-slate-400" /> {rec.candidate.Localización}
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <h5 className="text-sm font-semibold text-slate-800 mb-2 flex items-center gap-1.5">
                    <Sparkles className="h-4 w-4 text-indigo-500" /> Por qué encaja:
                  </h5>
                  <p className="text-sm text-slate-600 leading-relaxed">{rec.reason}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Team List Section */}
      <div 
        className={`bg-white rounded-2xl shadow-sm border transition-all ${isDragging ? 'border-indigo-400 bg-indigo-50/50 shadow-md' : 'border-slate-200/60'}`}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
      >
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Miembros del Equipo ({teamCandidates.length})</h2>
            <p className="text-sm text-slate-500 mt-1">Gestiona el talento y visualiza toda la información importada.</p>
          </div>
          
          <div className="flex items-center gap-3">
            <input 
              type="file" 
              accept=".xlsx, .xls, .csv" 
              className="hidden" 
              ref={fileInputRef}
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  handleFileUpload(e.target.files[0]);
                  e.target.value = '';
                }
              }}
            />
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 font-medium rounded-xl hover:bg-slate-50 hover:text-indigo-600 transition-all shadow-sm text-sm"
            >
              <Upload className="h-4 w-4" />
              Importar Excel
            </button>
            <button 
              onClick={handleDownload}
              disabled={teamCandidates.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 font-medium rounded-xl hover:bg-slate-50 hover:text-indigo-600 transition-all shadow-sm text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="h-4 w-4" />
              Descargar
            </button>
          </div>
        </div>

        {uploadSuccess && (
          <div className="bg-emerald-50 p-4 border-b border-emerald-100 flex items-center justify-center gap-2 text-emerald-700 text-sm font-medium">
            <CheckCircle className="h-5 w-5" />
            ¡Archivo procesado con éxito! Los candidatos han sido añadidos.
          </div>
        )}

        {teamCandidates.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-5 border border-slate-100 shadow-sm">
              <FileText className="h-10 w-10 text-slate-300" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2 tracking-tight">No hay candidatos todavía</h3>
            <p className="text-slate-500 text-sm max-w-md mx-auto mb-8 leading-relaxed">
              Arrastra un archivo Excel aquí o usa el botón de importar para cargar tu equipo. Toda la información del archivo se mostrará en una tabla.
            </p>
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="px-6 py-3 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition-all shadow-sm text-sm"
            >
              Seleccionar Archivo
            </button>
          </div>
        ) : (
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {teamCandidates.map((candidate) => (
              <div 
                key={candidate.id} 
                className="bg-white rounded-2xl p-6 border border-slate-200/60 shadow-sm hover:shadow-md transition-all flex flex-col relative group"
              >
                {/* Status Badge */}
                <div className="absolute top-4 right-4 flex flex-col items-end gap-1.5">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border shadow-sm ${
                    candidate.drivenValueStatus === 'Proyecto' 
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-100/50' 
                      : 'bg-amber-50 text-amber-700 border-amber-100/50'
                  }`}>
                    {candidate.drivenValueStatus || 'Staffing'}
                  </span>
                  {candidate.drivenValueStatus === 'Proyecto' && candidate.Cliente && (
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider bg-slate-100 px-2.5 py-1 rounded-md max-w-[120px] truncate border border-slate-200/50" title={candidate.Cliente}>
                      🏢 {candidate.Cliente}
                    </span>
                  )}
                </div>

                {/* Header: Avatar & Name */}
                <div className="flex items-center gap-4 mb-5 pr-20">
                  <div className="w-16 h-16 bg-gradient-to-br from-indigo-50 to-blue-50 rounded-full flex items-center justify-center text-indigo-700 font-bold text-xl shrink-0 border border-indigo-100/50 shadow-sm">
                    {candidate.Nombre ? candidate.Nombre.trim().split(/\s+/).map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() : '?'}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-lg leading-tight tracking-tight line-clamp-2 mb-1">
                      {candidate.Nombre || 'Sin Nombre'}
                    </h3>
                    <span className="inline-block px-2.5 py-1 bg-slate-50 border border-slate-200 text-slate-600 text-xs font-semibold rounded-lg shadow-sm">
                      {candidate.Perfil || candidate.Candidatura || 'Sin Perfil'}
                    </span>
                  </div>
                </div>
                
                {/* Details */}
                <div className="space-y-3 mb-6 flex-1">
                  {candidate.Localización && (
                    <div className="flex items-center gap-2 text-slate-600 text-sm">
                      <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                      <span className="truncate">{candidate.Localización}</span>
                    </div>
                  )}
                  <div className="flex items-start gap-2 text-slate-600 text-sm">
                    <Briefcase className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                    <span className="line-clamp-2 leading-relaxed">
                      {candidate['Key Knowledge'] || 'Sin conocimientos registrados'}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 mt-auto">
                  <button 
                    onClick={() => setEditingCandidate({ ...candidate })}
                    className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors"
                  >
                    <Edit2 className="h-4 w-4" />
                    Editar
                  </button>
                  <button 
                    onClick={() => setCandidateToDelete(candidate)}
                    className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                    Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editingCandidate && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col border border-slate-200/60">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center shrink-0">
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">Detalles del Candidato</h2>
              <button 
                onClick={() => setEditingCandidate(null)}
                className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              {/* Status Editor */}
              <div className="bg-indigo-50/50 p-5 rounded-2xl border border-indigo-100">
                <label className="block text-sm font-bold text-indigo-900 mb-2">Estado de Asignación</label>
                <select 
                  className="w-full p-3 border border-indigo-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none bg-white text-slate-800 font-medium shadow-sm transition-all"
                  value={editingCandidate.drivenValueStatus || 'Staffing'}
                  onChange={e => setEditingCandidate({...editingCandidate, drivenValueStatus: e.target.value as any})}
                >
                  <option value="Staffing">Staffing</option>
                  <option value="Proyecto">En Proyecto</option>
                </select>
                
                {editingCandidate.drivenValueStatus === 'Proyecto' && (
                  <div className="mt-4">
                    <label className="block text-sm font-bold text-indigo-900 mb-2">Cliente</label>
                    <input
                      type="text"
                      className="w-full p-3 border border-indigo-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none bg-white text-slate-800 shadow-sm transition-all"
                      placeholder="Nombre del cliente..."
                      value={editingCandidate.Cliente || ''}
                      onChange={e => setEditingCandidate({...editingCandidate, Cliente: e.target.value})}
                    />
                  </div>
                )}
                
                <p className="text-xs text-indigo-600 mt-3 font-medium">
                  Asigna si el candidato está disponible (Staffing) o ya asignado (En Proyecto).
                </p>
              </div>

              {/* All Data Display / Edit */}
              <div>
                <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-3">
                  <h3 className="text-lg font-bold text-slate-900 tracking-tight">Información del Candidato</h3>
                  <button 
                    onClick={() => {
                      const newField = prompt('Nombre del nuevo campo:');
                      if (newField && newField.trim()) {
                        setEditingCandidate({...editingCandidate, [newField.trim()]: ''});
                      }
                    }}
                    className="flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-800 font-medium bg-indigo-50 px-3 py-1.5 rounded-xl transition-colors border border-indigo-100/50"
                  >
                    <Plus className="h-4 w-4" /> Añadir Campo
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {Object.entries(editingCandidate)
                    .filter(([key]) => !['id', 'source', 'isDrivenValue', 'drivenValueStatus', 'status', 'step', 'rating', 'comments', 'customFields', 'Cliente'].includes(key))
                    .map(([key, value]) => (
                      <div key={key} className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/60 focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all shadow-sm">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">{key}</label>
                        <input
                          type="text"
                          className="w-full p-1 border-none bg-transparent focus:ring-0 outline-none text-sm text-slate-900 font-medium"
                          value={String(value || '')}
                          onChange={e => setEditingCandidate({...editingCandidate, [key]: e.target.value})}
                          placeholder={`Valor para ${key}...`}
                        />
                      </div>
                    ))}
                </div>
              </div>
            </div>
            
            <div className="p-6 border-t border-slate-100 flex justify-end gap-3 shrink-0 bg-slate-50/50 rounded-b-2xl">
              <button 
                onClick={() => setEditingCandidate(null)}
                className="px-5 py-2.5 text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-all font-medium shadow-sm"
              >
                Cancelar
              </button>
              <button 
                onClick={handleSave}
                className="px-5 py-2.5 text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all font-medium shadow-sm"
              >
                Guardar Cambios
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {candidateToDelete && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md border border-slate-200/60">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">Eliminar Candidato</h2>
              <button 
                onClick={() => setCandidateToDelete(null)}
                className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6">
              <p className="text-slate-700 leading-relaxed">
                ¿Estás seguro de que quieres eliminar a <span className="font-bold text-slate-900">{candidateToDelete.Nombre || 'este candidato'}</span> del equipo?
              </p>
              <p className="text-sm text-slate-500 mt-2">
                Esta acción no se puede deshacer.
              </p>
            </div>
            
            <div className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-slate-50/50 rounded-b-2xl">
              <button 
                onClick={() => setCandidateToDelete(null)}
                className="px-5 py-2.5 text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-all font-medium shadow-sm"
              >
                Cancelar
              </button>
              <button 
                onClick={() => {
                  if (candidateToDelete.source === 'driven-value') {
                    deleteDrivenValueCandidate(candidateToDelete.id);
                  } else {
                    updateCandidate(candidateToDelete.id, { isDrivenValue: false });
                  }
                  setCandidateToDelete(null);
                }}
                className="px-5 py-2.5 text-white bg-red-600 hover:bg-red-700 rounded-xl transition-all font-medium shadow-sm"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
