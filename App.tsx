
import React, { useState } from 'react';
import { MOCK_PATIENTS, OUTCOMES_DATA, MODEL_METRICS } from './constants';
import { Patient, RiskLevel, RiskTrend, CareGap } from './types';
import { VitalChart } from './components/VitalChart';
import { AbkInfo } from './components/AbkInfo';
import { AddPatientModal } from './components/AddPatientModal';
import { analyzePatientRisk } from './services/geminiService';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from 'recharts';
import { 
  Activity, 
  AlertTriangle, 
  BrainCircuit, 
  ChevronRight, 
  Ghost, 
  Clock, 
  BarChart3, 
  DollarSign, 
  HeartPulse, 
  Scale, 
  Stethoscope, 
  Building2, 
  CheckCircle2, 
  ArrowRight, 
  Lock, 
  AlertOctagon, 
  User, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Database,
  ShieldCheck,
  LayoutDashboard,
  Cpu,
  Plus,
  Library,
  GraduationCap,
  CalendarDays,
  History,
  Shield,
  Pill,
  DatabaseZap
} from 'lucide-react';

// --- Components Helpers ---

const TrendIcon = ({ trend }: { trend: RiskTrend }) => {
    switch (trend) {
        case 'WORSENING': return <TrendingUp className="text-red-500" size={18} />;
        case 'IMPROVING': return <TrendingDown className="text-emerald-500" size={18} />;
        default: return <Minus className="text-slate-400" size={18} />;
    }
};

const CareGapBadge = ({ gaps }: { gaps: CareGap[] }) => {
    if (!gaps || gaps.length === 0) return null;
    return (
        <div className="flex gap-1">
            {gaps.map(gap => {
                let text = '';
                let color = '';
                if (gap === 'LOST_TO_FOLLOW_UP') { text = 'Abandono'; color = 'bg-purple-100 text-purple-700 border-purple-200'; }
                if (gap === 'NO_ACTIVE_SCRIPT') { text = 'Sin Receta'; color = 'bg-amber-100 text-amber-700 border-amber-200'; }
                
                return (
                    <span key={gap} className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded border ${color}`}>
                        {text}
                    </span>
                );
            })}
        </div>
    );
};

// --- Model Validation Header ---
const ModelValidationHeader = () => {
  return (
    <div className="bg-slate-900 text-slate-300 text-xs py-2 px-4 flex justify-between items-center border-b border-slate-700">
      <div className="flex items-center gap-4">
        <span className="font-mono text-emerald-400 font-bold">{MODEL_METRICS.version}</span>
        <span className="flex items-center gap-1"><Database size={10} /> Train: {MODEL_METRICS.trainingPeriod}</span>
        <span className="flex items-center gap-1"><ShieldCheck size={10} /> Validation: {MODEL_METRICS.validationPeriod}</span>
      </div>
      <div className="flex items-center gap-4 font-mono">
        <span>AUC: <strong className="text-white">{MODEL_METRICS.auc}</strong></span>
        <span>Sens: <strong className="text-white">{MODEL_METRICS.sensitivity}</strong></span>
        <span>PPV: <strong className="text-white">{MODEL_METRICS.ppv}</strong></span>
        <span>N={MODEL_METRICS.nTotal.toLocaleString()}</span>
      </div>
    </div>
  );
};

// --- Logo Component (KEPT FROM PREVIOUS STEP) ---
const BrandLogo = ({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) => {
  const containerClasses = size === 'sm' ? 'w-8 h-8 p-1.5' : size === 'lg' ? 'w-16 h-16 p-3' : 'w-10 h-10 p-2';
  const iconSize = size === 'sm' ? 16 : size === 'lg' ? 32 : 24;

  // The logo retains the pink/purple identity as requested
  return (
     <div className={`${containerClasses} rounded-xl bg-gradient-to-br from-pink-500 via-violet-600 to-blue-700 text-white shadow-lg shadow-violet-200/50 flex items-center justify-center`}>
         <Shield size={iconSize} fill="currentColor" className="text-white/90" />
     </div>
  );
};

// --- Landing Page ---
const LandingPage = ({ onEnter }: { onEnter: () => void }) => {
  return (
    <div className="min-h-screen bg-white flex flex-col font-sans">
      {/* Navbar */}
      <header className="fixed w-full bg-white/80 backdrop-blur-md border-b border-slate-100 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex justify-between items-center">
            <div className="flex items-center gap-3">
                <BrandLogo />
                <span className="text-xl font-bold text-slate-900 tracking-tight">Abk Clinical</span>
            </div>
            <div className="flex items-center gap-4">
                <span className="hidden md:inline text-sm text-slate-500 font-medium">Para Prestadores y Financiadores</span>
                <button 
                    onClick={onEnter}
                    className="text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 px-5 py-2.5 rounded-full transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                >
                    Acceso Plataforma
                </button>
            </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="pt-32 pb-20 lg:pt-40 lg:pb-28 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
            <div className="lg:grid lg:grid-cols-12 gap-16 items-center">
                <div className="lg:col-span-6 mb-12 lg:mb-0 text-center lg:text-left">
                    <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-1.5 rounded-full text-sm font-bold mb-8 border border-blue-100 animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <BrainCircuit size={16} /> IA Predictiva Gemini 3 Pro
                    </div>
                    <h1 className="text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.1] mb-6">
                        Detecte al paciente <br/>
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">invisible</span> antes de la crisis.
                    </h1>
                    <p className="text-xl text-slate-600 mb-10 leading-relaxed max-w-2xl mx-auto lg:mx-0">
                        La primera plataforma de prevención secundaria diseñada para la realidad de LatAm: donde <strong>la falta de datos es el dato más fuerte.</strong> Reduzca internaciones priorizando a quien dejó de venir.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                        <button 
                            onClick={onEnter}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl font-bold text-lg shadow-blue-200 shadow-xl transition-all flex items-center justify-center gap-2 hover:-translate-y-1"
                        >
                            Ver Demo Interactiva <ArrowRight size={20} />
                        </button>
                        <button className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-8 py-4 rounded-xl font-bold text-lg shadow-sm transition-all">
                            Agendar Reunión B2B
                        </button>
                    </div>
                    
                    <div className="mt-10 pt-8 border-t border-slate-100 flex items-center justify-center lg:justify-start gap-8 text-slate-400 grayscale opacity-70">
                        <div className="flex items-center gap-2 font-bold text-lg"><ShieldCheck size={20}/> HIPAA Compliant</div>
                        <div className="flex items-center gap-2 font-bold text-lg"><DatabaseZap size={20}/> HL7 FHIR Ready</div>
                    </div>
                </div>

                {/* Abstract UI Representation */}
                <div className="lg:col-span-6 relative perspective-1000">
                    <div className="absolute inset-0 bg-gradient-to-tr from-blue-100 to-indigo-50 rounded-full blur-3xl opacity-60 animate-pulse"></div>
                    <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-200/60 p-2 transform rotate-y-6 hover:rotate-y-0 transition-transform duration-700">
                         <div className="bg-slate-50 rounded-xl overflow-hidden border border-slate-200">
                            {/* Fake Header */}
                            <div className="bg-white px-4 py-3 border-b border-slate-100 flex justify-between items-center">
                                <div className="flex gap-2">
                                    <div className="h-3 w-3 rounded-full bg-red-400"></div>
                                    <div className="h-3 w-3 rounded-full bg-amber-400"></div>
                                    <div className="h-3 w-3 rounded-full bg-green-400"></div>
                                </div>
                                <div className="h-2 w-24 bg-slate-100 rounded"></div>
                            </div>
                            {/* Fake Content */}
                            <div className="p-6 space-y-4">
                                <div className="flex justify-between items-center mb-6">
                                    <div>
                                        <div className="h-8 w-48 bg-slate-800 rounded mb-2"></div>
                                        <div className="h-4 w-32 bg-slate-300 rounded"></div>
                                    </div>
                                    <div className="bg-red-50 text-red-600 px-3 py-1 rounded-lg text-xs font-bold border border-red-100 flex items-center gap-1">
                                        <AlertTriangle size={12} /> RIESGO CRÍTICO
                                    </div>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                                        <div className="text-xs text-slate-400 font-bold uppercase mb-2">Predicción IA</div>
                                        <div className="text-2xl font-bold text-slate-800">88%</div>
                                        <div className="text-xs text-slate-500 mt-1">Prob. Internación 30d</div>
                                    </div>
                                    <div className="bg-white p-4 rounded-lg border border-red-100 shadow-sm relative overflow-hidden">
                                        <div className="absolute top-0 right-0 p-1 bg-red-500 text-white rounded-bl-lg">
                                            <Ghost size={12} />
                                        </div>
                                        <div className="text-xs text-slate-400 font-bold uppercase mb-2">Alerta Principal</div>
                                        <div className="text-sm font-bold text-red-600">Paciente "Fantasma"</div>
                                        <div className="text-xs text-slate-500 mt-1">Sin consulta {'>'} 180 días</div>
                                    </div>
                                </div>

                                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 flex items-center gap-3">
                                    <div className="bg-white p-2 rounded-full text-blue-600 shadow-sm">
                                        <Pill size={18} />
                                    </div>
                                    <div>
                                        <div className="text-xs font-bold text-blue-800">Polifarmacia Detectada</div>
                                        <div className="text-xs text-blue-600">8 fármacos activos • Riesgo Renal</div>
                                    </div>
                                </div>
                            </div>
                         </div>
                    </div>
                </div>
            </div>
        </div>
      </div>

      {/* Philosophy Section */}
      <div className="bg-slate-900 py-24 text-white">
         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
                <h2 className="text-blue-400 font-bold tracking-wider uppercase text-sm mb-3">La Diferencia Técnica</h2>
                <h3 className="text-3xl md:text-4xl font-bold mb-6">Un Motor de Riesgo diseñado para datos imperfectos.</h3>
                <p className="text-slate-400 text-lg leading-relaxed">
                    Los modelos tradicionales fallan en LatAm porque esperan historias clínicas completas. 
                    Abk Clinical utiliza la <strong>ausencia de información</strong> como el predictor más fuerte de riesgo.
                </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
                <div className="bg-slate-800 p-8 rounded-2xl border border-slate-700 hover:border-blue-500 transition-colors group">
                    <div className="w-12 h-12 bg-slate-900 rounded-xl flex items-center justify-center text-purple-400 mb-6 group-hover:bg-purple-500/10 group-hover:scale-110 transition-all">
                        <Ghost size={28} />
                    </div>
                    <h4 className="text-xl font-bold mb-3">El Silencio es Dato</h4>
                    <p className="text-slate-400">
                        Si un paciente crónico no consume recetas ni asiste a consulta, su riesgo es crítico. Nuestro algoritmo detecta el "abandono silencioso" antes de la guardia.
                    </p>
                </div>
                
                <div className="bg-slate-800 p-8 rounded-2xl border border-slate-700 hover:border-amber-500 transition-colors group">
                    <div className="w-12 h-12 bg-slate-900 rounded-xl flex items-center justify-center text-amber-400 mb-6 group-hover:bg-amber-500/10 group-hover:scale-110 transition-all">
                        <AlertOctagon size={28} />
                    </div>
                    <h4 className="text-xl font-bold mb-3">Escudo Farmacológico</h4>
                    <p className="text-slate-400">
                        Auditoría automática de polifarmacia. Detectamos cascadas de prescripción, dosis inadecuadas para la función renal y duplicidades terapéuticas en tiempo real.
                    </p>
                </div>

                <div className="bg-slate-800 p-8 rounded-2xl border border-slate-700 hover:border-emerald-500 transition-colors group">
                    <div className="w-12 h-12 bg-slate-900 rounded-xl flex items-center justify-center text-emerald-400 mb-6 group-hover:bg-emerald-500/10 group-hover:scale-110 transition-all">
                        <BarChart3 size={28} />
                    </div>
                    <h4 className="text-xl font-bold mb-3">Outcomes Tangibles</h4>
                    <p className="text-slate-400">
                        Transforme la gestión clínica en métricas financieras. Dashboard en vivo de internaciones evitadas, reducción de re-ingresos y ahorro proyectado.
                    </p>
                </div>
            </div>
         </div>
      </div>

      {/* CTA Footer */}
      <div className="bg-white border-t border-slate-100 py-16">
          <div className="max-w-4xl mx-auto px-4 text-center">
              <h2 className="text-3xl font-bold text-slate-900 mb-6">¿Listo para cambiar el paradigma?</h2>
              <p className="text-lg text-slate-600 mb-8">
                  Únase a la red de prevención secundaria más avanzada de la región.
              </p>
              <button 
                  onClick={onEnter}
                  className="bg-slate-900 text-white px-10 py-4 rounded-xl font-bold text-lg shadow-lg hover:bg-slate-800 transition-all"
              >
                  Ingresar Ahora
              </button>
              <p className="mt-6 text-sm text-slate-400">
                  © 2024 Abk Clinical. Todos los derechos reservados.
              </p>
          </div>
      </div>
    </div>
  );
};

// --- Login Page ---
const LoginPage = ({ onLogin }: { onLogin: (role: 'doctor' | 'consultant', id: string) => void }) => {
    const [role, setRole] = useState<'doctor' | 'consultant'>('doctor');
    const [identifier, setIdentifier] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (identifier.trim()) {
            onLogin(role, identifier);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
                <div className="bg-slate-900 p-6 text-center">
                    <div className="flex justify-center mb-4">
                        <BrandLogo size="lg" />
                    </div>
                    <h2 className="text-2xl font-bold text-white">Abk Clinical</h2>
                    <p className="text-slate-400 text-sm mt-1">Acceso Seguro a Plataforma Clínica</p>
                </div>
                
                <div className="p-8">
                    {/* Role Toggle */}
                    <div className="flex bg-slate-100 p-1 rounded-lg mb-8">
                        <button 
                            onClick={() => setRole('doctor')}
                            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-all ${role === 'doctor' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            <Stethoscope size={16} /> Soy Médico
                        </button>
                        <button 
                            onClick={() => setRole('consultant')}
                            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-all ${role === 'consultant' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            <Building2 size={16} /> Consultor
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                {role === 'doctor' ? 'Matrícula Profesional (M.N. / M.P.)' : 'ID Corporativo / Legajo'}
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                                    {role === 'doctor' ? <CheckCircle2 size={18} /> : <Lock size={18} />}
                                </div>
                                <input 
                                    type="text" 
                                    required
                                    value={identifier}
                                    onChange={(e) => setIdentifier(e.target.value)}
                                    className="block w-full pl-10 pr-3 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                    placeholder={role === 'doctor' ? 'Ej: 124589' : 'Ej: C-99802'}
                                />
                            </div>
                        </div>

                        <button 
                            type="submit"
                            className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${role === 'doctor' ? 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500' : 'bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500'}`}
                        >
                            Ingresar al Sistema
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

// --- Clinical Command Center (Dashboard) ---
const Dashboard = ({ onSelectPatient, onAddPatient }: { onSelectPatient: (p: Patient) => void, onAddPatient: () => void }) => {
  const sortedPatients = [...MOCK_PATIENTS].sort((a, b) => {
      // Prioritization: Care Gaps > High Risk > Score
      if (a.careGaps.length > 0 && b.careGaps.length === 0) return -1;
      if (b.careGaps.length > 0 && a.careGaps.length === 0) return 1;
      return b.riskScore - a.riskScore;
  });

  const getRiskColor = (level: RiskLevel) => {
    switch(level) {
      case RiskLevel.CRITICAL: return 'bg-red-600 text-white border-red-700 animate-pulse';
      case RiskLevel.HIGH: return 'bg-red-100 text-red-800 border-red-200';
      case RiskLevel.MEDIUM: return 'bg-amber-100 text-amber-800 border-amber-200';
      case RiskLevel.LOW: return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            Panel de Gestión Poblacional
          </h1>
          <p className="text-slate-500 text-sm flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Modelo v2.4 Activo
            <span className="text-slate-300">|</span> 
            Target: <strong>Internación &#60; 30 días</strong>
          </p>
        </div>
        <div className="flex gap-3">
           <button className="flex items-center gap-2 px-4 py-2 bg-white text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors font-medium text-sm shadow-sm">
              <Database size={16} /> Importar Base
           </button>
           <button onClick={onAddPatient} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-bold text-sm shadow-sm">
              <Plus size={18} /> Nuevo Paciente
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Internaciones Evitadas</span>
                <div className="flex items-center gap-2 text-emerald-600">
                    <HeartPulse size={24} />
                    <span className="text-2xl font-bold">{OUTCOMES_DATA.hospitalizationsAvoided}</span>
                </div>
                <span className="text-xs text-emerald-600/80 font-medium mt-1">Estimadas este mes</span>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Reducción Re-ingresos</span>
                <div className="flex items-center gap-2 text-blue-600">
                    <TrendingDown size={24} />
                    <span className="text-2xl font-bold">{OUTCOMES_DATA.readmissionsReducedPercentage}%</span>
                </div>
                <span className="text-xs text-blue-600/80 font-medium mt-1">vs. Promedio Histórico</span>
            </div>

             <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Pacientes Activos</span>
                <div className="flex items-center gap-2 text-slate-700">
                    <User size={24} />
                    <span className="text-2xl font-bold">{OUTCOMES_DATA.activePatients}</span>
                </div>
                <span className="text-xs text-slate-500 font-medium mt-1">Seguimiento continuo</span>
            </div>

            <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-4 rounded-xl border border-slate-700 shadow-sm flex flex-col text-white">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Ahorro Proyectado</span>
                <div className="flex items-center gap-2 text-emerald-400">
                    <DollarSign size={24} />
                    <span className="text-2xl font-bold">{OUTCOMES_DATA.estimatedSavings.toLocaleString()}</span>
                </div>
                <span className="text-xs text-slate-400 font-medium mt-1">ROI Mensual Estimado</span>
            </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-slate-50 px-6 py-3 border-b border-slate-200 flex justify-between items-center">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                <BarChart3 size={14} /> Cohorte de Riesgo Alto (Top 10%)
            </h2>
        </div>
        <table className="w-full text-left">
          <thead className="bg-white text-slate-500 text-xs uppercase font-semibold border-b border-slate-100">
            <tr>
              <th className="px-6 py-4">Paciente</th>
              <th className="px-6 py-4">Principal Driver (SHAP)</th>
              <th className="px-6 py-4">Probabilidad (30d)</th>
              <th className="px-6 py-4">Ultimo Dato</th>
              <th className="px-6 py-4">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {sortedPatients.map((patient) => {
                const isGhost = patient.careGaps.length > 0;
                
                return (
              <tr key={patient.id} className={`hover:bg-slate-50 transition-colors cursor-pointer ${isGhost ? 'bg-slate-50/50' : ''}`} onClick={() => onSelectPatient(patient)}>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                        <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold text-xs">
                        {patient.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        {isGhost && (
                             <div className="absolute -top-1 -right-1 bg-purple-500 text-white rounded-full p-0.5 border-2 border-white">
                                <Ghost size={10} />
                             </div>
                        )}
                    </div>
                    <div>
                      <div className="font-medium text-slate-900">{patient.name}</div>
                      <div className="text-xs text-slate-500">ID: {patient.id}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                   <div className="flex flex-col gap-1">
                        {patient.riskDrivers.slice(0, 1).map((driver, idx) => (
                             <span key={idx} className="text-xs font-medium text-slate-700 bg-slate-100 px-2 py-1 rounded border border-slate-200 inline-block w-fit">
                                {driver.factor}
                             </span>
                        ))}
                   </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <div className={`px-2.5 py-1 rounded text-xs font-bold border ${getRiskColor(patient.riskLevel)}`}>
                      {patient.riskScore}%
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Clock size={14} className={isGhost ? "text-purple-500" : "text-slate-400"} />
                    <span className={isGhost ? "font-semibold text-purple-700" : ""}>
                        {new Date(patient.lastEncounter).toLocaleDateString()}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <button className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1">
                    Ver <ChevronRight size={16} />
                  </button>
                </td>
              </tr>
            )})}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// --- Rich AI Analysis Visualization ---
const AIAnalysisView = ({ data }: { data: any }) => {
    if (!data) return null;

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Top Cards: Summary & Score */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 bg-gradient-to-br from-indigo-600 to-blue-700 rounded-xl p-6 text-white shadow-lg relative overflow-hidden">
                    <div className="absolute -right-10 -top-10 bg-white/10 w-40 h-40 rounded-full blur-3xl"></div>
                    <div className="relative z-10">
                        <h3 className="text-sm font-bold uppercase tracking-wider opacity-80 mb-2 flex items-center gap-2">
                            <BrainCircuit size={16}/> Resumen Ejecutivo
                        </h3>
                        <p className="text-lg leading-relaxed font-medium">
                            {data.executiveSummary}
                        </p>
                    </div>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col justify-center items-center text-center">
                     <div className="text-xs font-bold uppercase text-slate-400 mb-2">Score (Internación 30d)</div>
                     <div className={`text-5xl font-extrabold ${data.riskScore > 70 ? 'text-red-600' : 'text-emerald-600'} mb-2`}>
                         {data.riskScore}%
                     </div>
                     <div className="px-3 py-1 rounded bg-slate-100 text-slate-600 text-xs font-bold border border-slate-200">
                         {data.riskLevel}
                     </div>
                </div>
            </div>

            {/* Middle: Risk Projection Chart & Factors */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Chart */}
                <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                    <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
                        <TrendingUp size={18} className="text-blue-600" /> Proyección de Riesgo a 6 Meses
                    </h3>
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data.riskProjection}>
                                <defs>
                                    <linearGradient id="colorUntreated" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                                    </linearGradient>
                                    <linearGradient id="colorTreated" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} domain={[0, 100]} />
                                <RechartsTooltip 
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Legend wrapperStyle={{ paddingTop: '20px' }}/>
                                <Area 
                                    type="monotone" 
                                    dataKey="riskUntreated" 
                                    name="Sin Intervención"
                                    stroke="#ef4444" 
                                    fillOpacity={1} 
                                    fill="url(#colorUntreated)" 
                                />
                                <Area 
                                    type="monotone" 
                                    dataKey="riskTreated" 
                                    name="Con Tratamiento"
                                    stroke="#10b981" 
                                    fillOpacity={1} 
                                    fill="url(#colorTreated)" 
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Factors List */}
                <div className="bg-slate-50 rounded-xl border border-slate-200 p-6 shadow-sm overflow-y-auto max-h-[380px]">
                    <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <Scale size={18} className="text-indigo-600" /> SHAP Values (Causas)
                    </h3>
                    <div className="space-y-3">
                        {data.riskFactors?.map((factor: any, idx: number) => (
                            <div key={idx} className="bg-white p-3 rounded-lg border border-slate-100 shadow-sm">
                                <div className="flex justify-between items-start mb-1">
                                    <span className="font-bold text-sm text-slate-800">{factor.factor}</span>
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${factor.impact === 'ALTO' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                                        {factor.impact}
                                    </span>
                                </div>
                                <p className="text-xs text-slate-500 leading-snug">{factor.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Bottom: Evidence & Guidelines */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl border border-blue-100 p-6 shadow-sm">
                    <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <Library size={18} className="text-blue-600" /> Fundamentación Teórica (Guías AR)
                    </h3>
                    <ul className="space-y-2">
                        {data.argentinaGuidelines?.map((guide: string, idx: number) => (
                            <li key={idx} className="flex items-start gap-2 text-sm text-slate-600 bg-slate-50 p-2 rounded border border-slate-100">
                                <div className="mt-0.5 min-w-[4px] h-4 bg-blue-500 rounded-full"></div>
                                {guide}
                            </li>
                        ))}
                    </ul>
                </div>
                 <div className="bg-white rounded-xl border border-emerald-100 p-6 shadow-sm">
                    <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <GraduationCap size={18} className="text-emerald-600" /> Evidencia Científica (Papers)
                    </h3>
                    <div className="space-y-3">
                        {data.scientificPapers?.map((paper: any, idx: number) => (
                            <div key={idx} className="flex flex-col gap-1 border-b border-slate-50 pb-2 last:border-0 last:pb-0">
                                <a href="#" className="font-bold text-sm text-slate-800 hover:text-blue-600 transition-colors line-clamp-1">
                                    {paper.title}
                                </a>
                                <div className="flex justify-between items-center text-xs text-slate-400">
                                    <span>{paper.source} ({paper.year})</span>
                                </div>
                                <p className="text-xs text-slate-500 italic mt-1">"{paper.relevance}"</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- Patient Detail Component ---
const PatientDetail = ({ patient, onBack }: { patient: Patient, onBack: () => void }) => {
  const [aiAnalysisData, setAiAnalysisData] = useState<any | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeTab, setActiveTab] = useState<'clinical' | 'timeline' | 'pharma'>('clinical');

  const handleRunAnalysis = async () => {
    setIsAnalyzing(true);
    const result = await analyzePatientRisk(patient);
    setAiAnalysisData(result);
    setIsAnalyzing(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-2">
        <button onClick={onBack} className="text-slate-400 hover:text-slate-600 text-sm font-medium">
          &larr; Volver al Tablero
        </button>
      </div>

      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 text-xl font-bold relative">
             {patient.name.split(' ').map(n => n[0]).join('')}
          </div>
          <div>
             <h1 className="text-2xl font-bold text-slate-900">{patient.name}</h1>
             <div className="flex gap-2 text-sm text-slate-500 mt-1">
                <span>{patient.age} años</span>
                <span>•</span>
                <span>{patient.gender}</span>
                <span>•</span>
                <span>ID: {patient.id}</span>
             </div>
          </div>
        </div>
        
        <div className="flex items-center gap-6 bg-slate-50 p-4 rounded-lg border border-slate-100">
            <div className="text-center">
                <div className="text-xs text-slate-500 font-semibold uppercase">Prob. Internación (30d)</div>
                <div className={`text-2xl font-bold ${patient.riskScore > 50 ? 'text-red-600' : 'text-emerald-600'}`}>
                    {patient.riskScore}%
                </div>
            </div>
        </div>
      </div>

      <div className="border-b border-slate-200">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          <button onClick={() => setActiveTab('clinical')} className={`${activeTab === 'clinical' ? 'border-blue-500 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}>
             <Activity size={16} /> Dashboard
          </button>
          <button onClick={() => setActiveTab('timeline')} className={`${activeTab === 'timeline' ? 'border-blue-500 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}>
             <History size={16} /> Timeline Clínica (Anti-Leakage)
          </button>
        </nav>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column (Data) */}
        <div className="lg:col-span-2 space-y-6">
          
          {activeTab === 'clinical' && (
              <>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <VitalChart title="Creatinina" unit="mg/dL" data={patient.creatinine} color="#f59e0b" />
                    <VitalChart title="Peso Corporal" unit="kg" data={patient.weight} color="#3b82f6" />
                </div>
              </>
          )}

          {activeTab === 'timeline' && (
              <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6">
                 <h3 className="text-sm font-bold text-slate-700 mb-6 flex items-center gap-2">
                    <CalendarDays size={16} /> Eventos Históricos (Features)
                 </h3>
                 <div className="relative border-l-2 border-slate-200 ml-3 space-y-8">
                    {patient.history.map((event, i) => (
                        <div key={i} className="relative pl-6">
                            <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-slate-300 border-2 border-white"></div>
                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start">
                                <div>
                                    <span className="text-xs font-bold text-slate-500 uppercase">{event.date}</span>
                                    <h4 className="text-sm font-bold text-slate-800 mt-1">{event.type}</h4>
                                    <p className="text-sm text-slate-600 mt-1">{event.description}</p>
                                </div>
                                {event.value && (
                                    <span className="mt-2 sm:mt-0 px-2 py-1 bg-slate-100 rounded text-xs font-mono text-slate-700 border border-slate-200">
                                        {event.value}
                                    </span>
                                )}
                            </div>
                        </div>
                    ))}
                 </div>
              </div>
          )}
        </div>

        {/* Right Column (AI Assistant) */}
        <div className="space-y-6">
            <div className={`p-6 rounded-xl border shadow-sm relative overflow-hidden bg-gradient-to-b from-indigo-50 to-white border-indigo-100`}>
                <div className="flex items-center gap-2 mb-4 relative z-10">
                    <div className={`p-1.5 rounded-lg text-white bg-indigo-600`}>
                        <BrainCircuit size={20} />
                    </div>
                    <h3 className="font-bold text-indigo-900">
                       Motor de Riesgo (IA)
                    </h3>
                </div>
                
                <p className="text-sm mb-6 relative z-10 leading-relaxed text-indigo-700">
                   Análisis de riesgo basado en "Eventos Duros" y "Vacío de Datos".
                </p>

                <button 
                    onClick={handleRunAnalysis}
                    disabled={isAnalyzing}
                    className="w-full text-white font-medium py-2.5 px-4 rounded-lg shadow-sm hover:shadow transition-all flex justify-center items-center gap-2 relative z-10 disabled:opacity-70 bg-indigo-600 hover:bg-indigo-700"
                >
                    {isAnalyzing ? (
                        <>
                            <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Generando Proyección...
                        </>
                    ) : 'Analizar Riesgo & Polifarmacia'}
                </button>
            </div>

            {/* AI Output Area (New Rich Visualization) */}
            <AIAnalysisView data={aiAnalysisData} />
            
        </div>
      </div>
    </div>
  );
};

// --- Main App ---
const App = () => {
  const [view, setView] = useState<'landing' | 'login' | 'app'>('landing');
  const [activeModule, setActiveModule] = useState<'dashboard' | 'abk_info'>('dashboard');
  const [userRole, setUserRole] = useState<'doctor' | 'consultant'>('doctor');
  const [userId, setUserId] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [isAddPatientOpen, setIsAddPatientOpen] = useState(false);

  const handleLogin = (role: 'doctor' | 'consultant', id: string) => {
      setUserRole(role);
      setUserId(id);
      setView('app');
  };

  const handleLogout = () => {
      setView('landing');
      setSelectedPatient(null);
      setUserId('');
      setActiveModule('dashboard');
  };

  const handleAddPatient = (data: any) => {
      console.log("Adding patient:", data);
      setIsAddPatientOpen(false);
      alert("Paciente agregado exitosamente (Simulación)");
  };

  if (view === 'landing') {
      return <LandingPage onEnter={() => setView('login')} />;
  }

  if (view === 'login') {
      return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
      <ModelValidationHeader /> {/* Always visible in App View */}
      
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => { setSelectedPatient(null); setActiveModule('dashboard'); }}>
            <BrandLogo size="sm" />
            <span className="text-xl font-bold text-slate-900 group-hover:text-blue-700 transition-colors">
                Abk Clinical
            </span>
          </div>
          
          {/* Main Navigation Tabs */}
          <div className="hidden md:flex items-center space-x-1 bg-slate-100 p-1.5 rounded-xl border border-slate-200">
             <button 
                onClick={() => { setActiveModule('dashboard'); setSelectedPatient(null); }}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeModule === 'dashboard' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
             >
                <LayoutDashboard size={16} /> Panel Poblacional
             </button>
             <button 
                onClick={() => { setActiveModule('abk_info'); setSelectedPatient(null); }}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeModule === 'abk_info' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
             >
                <Cpu size={16} /> Inteligencia Clínica
             </button>
          </div>

          <div className="flex items-center gap-4">
             <div className={`hidden md:flex items-center gap-2 text-sm text-slate-500 px-4 py-2 rounded-full border ${userRole === 'doctor' ? 'bg-blue-50 border-blue-100 text-blue-700' : 'bg-indigo-50 border-indigo-100 text-indigo-700'}`}>
                {userRole === 'doctor' ? <Stethoscope size={14} /> : <Building2 size={14} />}
                <span className="font-bold">
                    {userRole === 'doctor' ? `Dr. ${userId}` : `ID: ${userId}`}
                </span>
             </div>
             <button onClick={handleLogout} className="text-xs text-slate-400 hover:text-red-500 font-bold transition-colors">
                 Cerrar Sesión
             </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 h-[calc(100vh-6rem)]">
        {activeModule === 'dashboard' ? (
             selectedPatient ? (
                <PatientDetail patient={selectedPatient} onBack={() => setSelectedPatient(null)} />
             ) : (
                <Dashboard onSelectPatient={setSelectedPatient} onAddPatient={() => setIsAddPatientOpen(true)} />
             )
        ) : (
            <AbkInfo />
        )}
      </main>

      {isAddPatientOpen && (
          <AddPatientModal onClose={() => setIsAddPatientOpen(false)} onSave={handleAddPatient} />
      )}
    </div>
  );
};

export default App;
