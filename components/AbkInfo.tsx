
import React, { useState, useEffect, useRef } from 'react';
import { 
  Cpu, 
  ShieldCheck, 
  Zap, 
  FileText, 
  UploadCloud, 
  Terminal, 
  ArrowRight, 
  BookOpen, 
  Dna, 
  Pill, 
  CheckCircle2, 
  AlertTriangle,
  Search,
  Sparkles
} from 'lucide-react';

const MOCK_HISTORY = [
  { id: 'REQ-9921', title: 'BRCA1 Germline Mutation', time: '2h ago' },
  { id: 'REQ-9920', title: 'PD-L1 Expression >50%', time: '5h ago' },
  { id: 'REQ-9918', title: 'T790M Resistance', time: '1d ago' },
];

export const AbkInfo = () => {
  const [state, setState] = useState<'IDLE' | 'PROCESSING' | 'COMPLETE'>('IDLE');
  const [query, setQuery] = useState('');
  const [logs, setLogs] = useState<string[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  const processingSteps = [
    "Initializing Secure Environment (HIPAA/Habeas Data)...",
    "Handshake TLS 1.3 established...",
    "Parsing clinical context from input...",
    "Agent 'Librarian' querying Msalud Argentina & SAC Guidelines...",
    "Agent 'Geneticist' analyzing molecular pathways...",
    "Agent 'Pharmacist' checking ANMAT/Vademecum Nacional...",
    "Synthesizing therapeutic matrix...",
    "Finalizing report..."
  ];

  useEffect(() => {
    if (state === 'PROCESSING') {
      let stepIndex = 0;
      setLogs([]);
      const interval = setInterval(() => {
        if (stepIndex >= processingSteps.length) {
          clearInterval(interval);
          setTimeout(() => setState('COMPLETE'), 800);
        } else {
          setLogs(prev => [...prev, `> ${processingSteps[stepIndex]}`]);
          stepIndex++;
          // Auto scroll
          if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
          }
        }
      }, 600);
      return () => clearInterval(interval);
    }
  }, [state]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setState('PROCESSING');
  };

  const handleReset = () => {
    setState('IDLE');
    setQuery('');
    setLogs([]);
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm font-sans">
      
      {/* --- Sidebar (25%) --- */}
      <div className="w-1/4 bg-slate-50 border-r border-slate-200 flex flex-col">
        {/* Featured Insight */}
        <div className="p-6 border-b border-slate-200 relative overflow-hidden group cursor-pointer">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-indigo-600 opacity-90 transition-opacity group-hover:opacity-100"></div>
          {/* Decorative Blur */}
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-white opacity-20 blur-3xl rounded-full"></div>
          
          <div className="relative z-10 text-white">
            <div className="flex items-center gap-2 mb-3">
              <div className="bg-white/20 p-1.5 rounded-lg backdrop-blur-sm">
                <Zap size={16} className="text-yellow-300" fill="currentColor" />
              </div>
              <span className="text-xs font-bold tracking-wider uppercase opacity-90">Featured Insight</span>
            </div>
            <h3 className="font-bold text-lg leading-tight mb-2">Nuevos inhibidores HER2 en ensayo.</h3>
            <p className="text-blue-100 text-sm line-clamp-3 font-medium">
              Análisis preliminar de la fase 3 muestra eficacia superior en metástasis cerebral.
            </p>
          </div>
        </div>

        {/* History List */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-5 border-b border-slate-200 flex items-center gap-2 text-slate-500">
            <FileText size={14} />
            <span className="text-xs font-bold uppercase tracking-wider">Historial Reciente</span>
          </div>
          <div className="divide-y divide-slate-100">
            {MOCK_HISTORY.map((item) => (
              <div key={item.id} className="p-4 hover:bg-white hover:shadow-sm transition-all cursor-pointer group">
                <div className="flex justify-between items-start mb-1">
                  <span className="font-mono text-xs text-slate-400 group-hover:text-blue-500 transition-colors font-bold">{item.id}</span>
                  <span className="text-[10px] text-slate-400 font-medium">{item.time}</span>
                </div>
                <div className="font-bold text-slate-700 text-sm group-hover:text-slate-900">{item.title}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* --- Main Area (75%) --- */}
      <div className="w-3/4 flex flex-col relative bg-white">
        
        {/* Header */}
        <header className="bg-white border-b border-slate-200 px-8 py-5 flex justify-between items-center z-10">
          <div>
            <h2 className="text-xl font-extrabold text-slate-800 flex items-center gap-2">
              <Cpu className="text-blue-500" /> Abk Info <span className="text-slate-300 font-light">|</span> Clinical Intelligence
            </h2>
            <p className="text-slate-500 text-sm font-medium">Motor de Análisis de Precisión Oncológica y Farmacológica</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 rounded-lg bg-slate-50 border border-slate-200 text-slate-500 text-xs font-mono font-bold">v2.4.0</span>
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-bold">
              <ShieldCheck size={14} /> HIPAA Secure
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 relative overflow-y-auto">
          
          {/* STATE 1: IDLE */}
          {state === 'IDLE' && (
            <div className="h-full flex flex-col items-center justify-center p-12 animate-in fade-in zoom-in-95 duration-500 bg-slate-50/30">
              
              {/* Drag Drop Zone */}
              <div className="w-full max-w-2xl h-48 border-2 border-dashed border-slate-300 rounded-2xl bg-white flex flex-col items-center justify-center mb-8 hover:border-blue-400 hover:bg-blue-50 transition-all cursor-pointer group">
                <div className="bg-blue-50 p-4 rounded-full mb-4 group-hover:bg-blue-100 transition-colors text-blue-600">
                  <UploadCloud size={32} />
                </div>
                <p className="text-slate-700 font-bold">Arrastra tu reporte NGS o Historia Clínica aquí</p>
                <p className="text-slate-400 text-sm mt-1 font-medium">Soporta PDF, HL7, JSON, TXT</p>
              </div>

              {/* Input */}
              <div className="w-full max-w-2xl">
                <form onSubmit={handleSubmit} className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Terminal size={20} className="text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                  </div>
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="O escribe un comando clínico (ej: Análisis de riesgo cardiovascular por AINEs)"
                    className="w-full pl-12 pr-12 py-5 bg-white border border-slate-300 rounded-2xl shadow-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-mono text-sm font-medium"
                  />
                  <button 
                    type="submit"
                    className="absolute inset-y-1.5 right-1.5 px-4 bg-slate-900 text-white rounded-xl hover:bg-blue-600 transition-colors flex items-center justify-center shadow-md"
                  >
                    <ArrowRight size={18} />
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* STATE 2: PROCESSING */}
          {state === 'PROCESSING' && (
            <div className="h-full bg-slate-950 p-8 font-mono text-sm overflow-y-auto flex flex-col">
              <div className="flex-1" ref={scrollRef}>
                {logs.map((log, i) => (
                  <div key={i} className="mb-2 text-emerald-400 animate-in slide-in-from-left-2 fade-in duration-300">
                    <span className="opacity-50 mr-2 text-blue-400">{new Date().toLocaleTimeString()}</span>
                    {log}
                  </div>
                ))}
                <div className="animate-pulse text-blue-500">_</div>
              </div>
            </div>
          )}

          {/* STATE 3: COMPLETE */}
          {state === 'COMPLETE' && (
            <div className="p-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
              
              {/* Visual Agents Header */}
              <div className="flex justify-center items-center gap-8 mb-10">
                 <div className="flex flex-col items-center gap-2">
                    <div className="w-14 h-14 rounded-2xl bg-indigo-100 flex items-center justify-center text-indigo-600 animate-bounce delay-100 shadow-sm border border-indigo-200">
                       <BookOpen size={24} />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Librarian</span>
                 </div>
                 <div className="h-0.5 w-16 bg-gradient-to-r from-indigo-200 via-blue-200 to-emerald-200 rounded-full"></div>
                 <div className="flex flex-col items-center gap-2">
                    <div className="w-14 h-14 rounded-2xl bg-blue-100 flex items-center justify-center text-blue-600 animate-bounce delay-200 shadow-sm border border-blue-200">
                       <Dna size={24} />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Geneticist</span>
                 </div>
                 <div className="h-0.5 w-16 bg-gradient-to-r from-blue-200 via-emerald-200 to-teal-200 rounded-full"></div>
                 <div className="flex flex-col items-center gap-2">
                    <div className="w-14 h-14 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-600 animate-bounce delay-300 shadow-sm border border-emerald-200">
                       <Pill size={24} />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Pharmacist</span>
                 </div>
              </div>

              {/* Bento Grid Results */}
              <div className="grid grid-cols-12 gap-6">
                
                {/* 1. Executive Summary (Width 8/12) */}
                <div className="col-span-12 lg:col-span-8 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex">
                   <div className="w-2 bg-amber-500 h-full"></div> {/* Severity Indicator */}
                   <div className="p-8 flex-1">
                      <div className="flex justify-between items-start mb-4">
                        <h3 className="text-xl font-bold text-slate-800">Análisis de Riesgo: Interacción & Cascada</h3>
                        <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-lg text-xs font-bold border border-amber-200 flex items-center gap-1">
                          <AlertTriangle size={12} /> MODERADO
                        </span>
                      </div>
                      <p className="text-slate-600 leading-relaxed text-sm font-medium">
                        Se detecta un patrón de <strong>cascada de prescripción</strong>. El uso de AINEs (Diclofenac) probablemente elevó la presión arterial, resultando en la adición de Amlodipina. Además, el riesgo renal es elevado para la edad del paciente (79 años) con el uso concomitante de Enalapril + AINE.
                      </p>
                      <div className="mt-6 pt-6 border-t border-slate-100">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Recomendación Primaria (GPC MinSalud)</span>
                        <p className="text-blue-600 font-bold mt-1 text-sm bg-blue-50 p-3 rounded-lg border border-blue-100">Suspender AINE y rotar a analgésico no nefrotóxico (ej. Paracetamol). Re-evaluar HTA en 15 días.</p>
                      </div>
                   </div>
                </div>

                {/* 2. Molecular Impact / Evidence Level (Width 4/12) */}
                <div className="col-span-12 lg:col-span-4 bg-white rounded-2xl shadow-sm border border-slate-200 p-8 flex flex-col justify-between">
                   <div>
                      <h4 className="text-sm font-bold text-slate-800 mb-2 flex items-center gap-2">
                        <Sparkles size={16} className="text-blue-500"/> Nivel de Evidencia
                      </h4>
                      <p className="text-xs text-slate-500 font-medium">Basado en GPC MinSalud Argentina, Consenso SAC y Beers Criteria.</p>
                   </div>
                   
                   <div className="mt-6">
                      <div className="flex justify-between text-xs font-bold text-slate-700 mb-2">
                        <span>Certeza Algorítmica</span>
                        <span>92%</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                        <div className="bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-500 h-3 rounded-full" style={{ width: '92%' }}></div>
                      </div>
                   </div>

                   <div className="mt-6 flex gap-3">
                      <div className="px-3 py-3 bg-slate-50 rounded-xl border border-slate-200 text-center flex-1">
                         <div className="text-xl font-extrabold text-slate-800">3</div>
                         <div className="text-[10px] text-slate-400 uppercase font-bold">Guías Nac.</div>
                      </div>
                      <div className="px-3 py-3 bg-slate-50 rounded-xl border border-slate-200 text-center flex-1">
                         <div className="text-xl font-extrabold text-slate-800">12</div>
                         <div className="text-[10px] text-slate-400 uppercase font-bold">Papers</div>
                      </div>
                   </div>
                </div>

                {/* 3. Therapeutic Matrix Table (Width 12/12) */}
                <div className="col-span-12 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                   <div className="bg-slate-50 px-8 py-4 border-b border-slate-200 flex items-center gap-2">
                      <Pill size={16} className="text-slate-500" />
                      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Matriz Terapéutica Auditada</h4>
                   </div>
                   <table className="w-full text-sm text-left">
                      <thead className="bg-white text-slate-500 font-bold border-b border-slate-100 text-xs uppercase">
                        <tr>
                           <th className="px-8 py-4 w-1/4">Fármaco</th>
                           <th className="px-8 py-4 w-1/4">Clase / Diana</th>
                           <th className="px-8 py-4 w-1/4">Estado de Seguridad</th>
                           <th className="px-8 py-4 w-1/4 text-right">Acción</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        <tr className="hover:bg-slate-50 group transition-colors">
                           <td className="px-8 py-5 font-bold text-slate-800">Diclofenac</td>
                           <td className="px-8 py-5 text-slate-600 font-medium">AINE (COX Inhibitor)</td>
                           <td className="px-8 py-5">
                              <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-red-100 text-red-800 border border-red-200">
                                 Riesgo Alto (Edad/Riñón)
                              </span>
                           </td>
                           <td className="px-8 py-5 text-right text-red-600 font-bold text-xs cursor-pointer hover:underline">SUSPENDER</td>
                        </tr>
                        <tr className="hover:bg-slate-50 group transition-colors">
                           <td className="px-8 py-5 font-bold text-slate-800">Enalapril</td>
                           <td className="px-8 py-5 text-slate-600 font-medium">IECA</td>
                           <td className="px-8 py-5">
                              <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                 Aprobado FDA/ANMAT
                              </span>
                           </td>
                           <td className="px-8 py-5 text-right text-slate-400 text-xs font-bold">Mantener</td>
                        </tr>
                         <tr className="hover:bg-slate-50 group transition-colors">
                           <td className="px-8 py-5 font-bold text-slate-800">Clonazepam</td>
                           <td className="px-8 py-5 text-slate-600 font-medium">Benzodiazepina</td>
                           <td className="px-8 py-5">
                              <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
                                 Vigilar (Caídas)
                              </span>
                           </td>
                           <td className="px-8 py-5 text-right text-blue-600 font-bold text-xs cursor-pointer hover:underline">REDUCIR DOSIS</td>
                        </tr>
                      </tbody>
                   </table>
                </div>

              </div>

               <div className="mt-10 flex justify-center">
                  <button onClick={handleReset} className="px-8 py-4 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all text-sm font-bold shadow-lg flex items-center gap-2 hover:-translate-y-0.5">
                     <Search size={16} /> Nueva Consulta
                  </button>
               </div>

            </div>
          )}

        </div>
      </div>
    </div>
  );
};
