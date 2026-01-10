import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import api from './src/services/api';
import { MOCK_PATIENTS, OUTCOMES_DATA, MODEL_METRICS } from './constants';
import { Patient, RiskLevel, RiskTrend, CareGap, ClinicalEvent } from './types';
import { VitalChart } from './components/VitalChart';
import { AbkInfo } from './components/AbkInfo';
import { AddPatientModal } from './components/AddPatientModal';
import { AddEventModal } from './components/AddEventModal';
import { AddMeasurementModal } from './components/AddMeasurementModal';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { analyzePatientRisk } from './services/geminiService';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from 'recharts';
import {
    Activity, AlertTriangle, BrainCircuit, ChevronRight, ChevronLeft, Ghost, Clock, BarChart3,
    DollarSign, HeartPulse, Scale, Stethoscope, Building2, CheckCircle2, ArrowRight,
    Lock, AlertOctagon, User, TrendingUp, TrendingDown, Minus, Database, ShieldCheck,
    LayoutDashboard, Cpu, Plus, Library, GraduationCap, CalendarDays, History, Shield,
    Pill, DatabaseZap, LogOut, Beaker, Sparkles, Terminal, Printer, FileText, Users,
    List, LayoutGrid, HelpCircle
} from 'lucide-react';

// --- Risk Trend Chart Component ---
const RiskTrendChart = ({ data }: { data: any[] }) => {
    if (!data || data.length === 0) return (
        <div className="h-[200px] flex items-center justify-center text-slate-400 text-sm italic border-2 border-dashed border-slate-100 rounded-xl">
            Sin historial predictivo guardado
        </div>
    );

    const chartData = data.map(d => ({
        date: new Date(d.created_at).toLocaleDateString([], { day: '2-digit', month: '2-digit' }),
        risk: parseFloat(d.score)
    }));

    return (
        <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                    <defs>
                        <linearGradient id="colorRisk" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.1} />
                            <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="date" fontSize={10} axisLine={false} tickLine={false} tick={{ fill: '#94a3b8' }} />
                    <YAxis domain={[0, 100]} fontSize={10} axisLine={false} tickLine={false} tick={{ fill: '#94a3b8' }} />
                    <RechartsTooltip
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    />
                    <Area
                        type="monotone"
                        dataKey="risk"
                        stroke="#ef4444"
                        strokeWidth={4}
                        fillOpacity={1}
                        fill="url(#colorRisk)"
                        animationDuration={1500}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
};

// --- Helpers ---
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

const BrandLogo = ({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) => {
    const containerClasses = size === 'sm' ? 'w-8 h-8 p-1.5' : size === 'lg' ? 'w-16 h-16 p-3' : 'w-10 h-10 p-2';
    const iconSize = size === 'sm' ? 16 : size === 'lg' ? 32 : 24;
    return (
        <div className={`${containerClasses} rounded-xl bg-gradient-to-br from-pink-500 via-violet-600 to-blue-700 text-white shadow-lg shadow-violet-200/50 flex items-center justify-center`}>
            <Shield size={iconSize} fill="currentColor" className="text-white/90" />
        </div>
    );
};

// --- Landing Page ---
const LandingPage = () => {
    const navigate = useNavigate();
    return (
        <div className="min-h-screen bg-white flex flex-col font-sans">
            <header className="fixed w-full bg-white/80 backdrop-blur-md border-b border-slate-100 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <BrandLogo />
                        <span className="text-xl font-bold text-slate-900 tracking-tight">Abk Clinical</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="hidden md:inline text-sm text-slate-500 font-medium">Para Prestadores y Financiadores</span>
                        <button
                            onClick={() => navigate('/login')}
                            className="text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 px-5 py-2.5 rounded-full transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                        >
                            Acceso Plataforma
                        </button>
                    </div>
                </div>
            </header>

            <div className="pt-32 pb-20 lg:pt-40 lg:pb-28 overflow-hidden">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
                    <div className="lg:grid lg:grid-cols-12 gap-16 items-center">
                        <div className="lg:col-span-6 mb-12 lg:mb-0 text-center lg:text-left">
                            <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-1.5 rounded-full text-sm font-bold mb-8 border border-blue-100 animate-in fade-in slide-in-from-bottom-4 duration-700">
                                <BrainCircuit size={16} /> IA Predictiva Gemini 3 Pro
                            </div>
                            <h1 className="text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.1] mb-6">
                                Detecte al paciente <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">invisible</span> antes de la crisis.
                            </h1>
                            <p className="text-xl text-slate-600 mb-10 leading-relaxed max-w-2xl mx-auto lg:mx-0">
                                La primera plataforma de prevención secundaria diseñada para la realidad de LatAm: donde <strong>la falta de datos es el dato más fuerte.</strong> Reduzca internaciones priorizando a quien dejó de venir.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                                <button
                                    onClick={() => navigate('/login')}
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl font-bold text-lg shadow-blue-200 shadow-xl transition-all flex items-center justify-center gap-2 hover:-translate-y-1"
                                >
                                    Ver Demo Interactiva <ArrowRight size={20} />
                                </button>
                                <button className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-8 py-4 rounded-xl font-bold text-lg shadow-sm transition-all">
                                    Agendar Reunión B2B
                                </button>
                            </div>
                            <div className="mt-10 pt-8 border-t border-slate-100 flex items-center justify-center lg:justify-start gap-8 text-slate-400 grayscale opacity-70">
                                <div className="flex items-center gap-2 font-bold text-lg"><ShieldCheck size={20} /> HIPAA Compliant</div>
                                <div className="flex items-center gap-2 font-bold text-lg"><DatabaseZap size={20} /> HL7 FHIR Ready</div>
                            </div>
                        </div>

                        <div className="lg:col-span-6 relative perspective-1000">
                            <div className="absolute inset-0 bg-gradient-to-tr from-blue-100 to-indigo-50 rounded-full blur-3xl opacity-60 animate-pulse"></div>
                            <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-200/60 p-2 transform rotate-y-6 hover:rotate-y-0 transition-transform duration-700">
                                <div className="bg-slate-50 rounded-xl overflow-hidden border border-slate-200">
                                    <div className="bg-white px-4 py-3 border-b border-slate-100 flex justify-between items-center">
                                        <div className="flex gap-2">
                                            <div className="h-3 w-3 rounded-full bg-red-400"></div>
                                            <div className="h-3 w-3 rounded-full bg-amber-400"></div>
                                            <div className="h-3 w-3 rounded-full bg-green-400"></div>
                                        </div>
                                        <div className="h-2 w-24 bg-slate-100 rounded"></div>
                                    </div>
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

            <div className="bg-white border-t border-slate-100 py-16">
                <div className="max-w-4xl mx-auto px-4 text-center">
                    <h2 className="text-3xl font-bold text-slate-900 mb-6">¿Listo para cambiar el paradigma?</h2>
                    <p className="text-lg text-slate-600 mb-8">
                        Únase a la red de prevención secundaria más avanzada de la región.
                    </p>
                    <button
                        onClick={() => navigate('/login')}
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

// --- Login Page (Connected) ---
const LoginPage = () => {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const res = await api.post('/auth/login', { email, password });
            login(res.data.token, res.data.user);
            navigate('/app');
        } catch (err: any) {
            console.error(err);
            setError('Credenciales inválidas. Pruebe admin@clinica.com / admin123');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
                <div className="bg-slate-900 p-6 text-center">
                    <div className="flex justify-center mb-4"><BrandLogo size="lg" /></div>
                    <h2 className="text-2xl font-bold text-white">Abk Clinical</h2>
                    <p className="text-slate-400 text-sm mt-1">Acceso Seguro</p>
                </div>

                <div className="p-8">
                    {error && (
                        <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100 flex items-center gap-2">
                            <AlertTriangle size={16} /> {error}
                        </div>
                    )}
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
                            <input
                                type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                                className="block w-full px-3 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 sm:text-sm"
                                placeholder="admin@clinica.com"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Contraseña</label>
                            <input
                                type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                                className="block w-full px-3 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 sm:text-sm"
                                placeholder="••••••"
                            />
                        </div>
                        <button type="submit" disabled={loading} className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-sm transition-colors">
                            {loading ? 'Ingresando...' : 'Ingresar'}
                        </button>
                    </form>
                    <div className="mt-6 text-center">
                        <Link to="/" className="text-sm text-slate-500 hover:text-slate-800 font-medium">
                            &larr; Volver a la Landing
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- Rich AI Analysis Visualization ---
const AIAnalysisView = ({ data }: { data: any }) => {
    if (!data) return null;

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Clinical Alerts Section (Level 2) - Anti-Leakage */}
            {data.clinicalAlerts?.length > 0 && (
                <div className="space-y-2">
                    {data.clinicalAlerts.map((alert: any, idx: number) => (
                        <div key={idx} className={`p-4 rounded-xl border flex items-center gap-4 shadow-sm ${alert.severity === 'CRITICAL' ? 'bg-red-50 border-red-200 text-red-700' :
                            alert.severity === 'WARNING' ? 'bg-amber-50 border-amber-200 text-amber-700' :
                                'bg-blue-50 border-blue-200 text-blue-700'
                            }`}>
                            <div className={`p-2 rounded-lg ${alert.severity === 'CRITICAL' ? 'bg-red-100' :
                                alert.severity === 'WARNING' ? 'bg-amber-100' :
                                    'bg-blue-100'
                                }`}>
                                <AlertTriangle size={20} />
                            </div>
                            <div className="flex-1">
                                <div className="text-[10px] font-extrabold uppercase tracking-widest leading-none mb-1 opacity-70">
                                    {alert.type} • {alert.severity}
                                </div>
                                <div className="text-sm font-bold">{alert.message}</div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 bg-gradient-to-br from-indigo-600 to-blue-700 rounded-xl p-6 text-white shadow-lg relative overflow-hidden flex flex-col justify-center min-h-[220px]">
                    <div className="absolute -right-10 -top-10 bg-white/10 w-40 h-40 rounded-full blur-3xl"></div>
                    <div className="relative z-10">
                        <h3 className="text-sm font-bold uppercase tracking-wider opacity-80 mb-4 flex items-center gap-2">
                            <BrainCircuit size={16} /> Resumen de Riesgo Multi-Outcome (XAI)
                        </h3>
                        <div className="text-sm leading-relaxed font-medium space-y-2">
                            {data.executiveSummary ? (
                                data.executiveSummary.split('.').filter((s: string) => s.trim().length > 5).map((sentence: string, idx: number) => (
                                    <div key={idx} className="flex gap-2">
                                        <div className="mt-1.5 w-1 min-w-[4px] h-1 rounded-full bg-white/60"></div>
                                        <p>{sentence.trim()}.</p>
                                    </div>
                                ))
                            ) : (
                                <p className="opacity-70 italic">Esperando análisis clínico...</p>
                            )}
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col gap-4">
                    <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Compuesto de Predicciones</h3>
                    <div className="space-y-3">
                        {data.predictions?.map((pred: any, idx: number) => (
                            <div key={idx} className="group cursor-help relative">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-[10px] font-bold text-slate-600">{pred.outcome.replace(/_/g, ' ')}</span>
                                    <span className={`text-xs font-black ${pred.probability > 70 ? 'text-red-600' : pred.probability > 40 ? 'text-amber-600' : 'text-emerald-600'}`}>
                                        {pred.probability}%
                                    </span>
                                </div>
                                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full transition-all duration-1000 ${pred.probability > 70 ? 'bg-red-500' : pred.probability > 40 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                                        style={{ width: `${pred.probability}%` }}
                                    ></div>
                                </div>
                                {/* Tooltip experimental simple */}
                                <div className="hidden group-hover:block absolute z-20 top-full left-0 mt-2 p-2 bg-slate-800 text-white text-[10px] rounded shadow-xl w-full">
                                    {pred.rationale}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                    <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
                        <TrendingUp size={18} className="text-blue-600" /> Proyección de Reincidencia (6 Meses)
                    </h3>
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data.riskProjection || []}>
                                <defs>
                                    <linearGradient id="colorUntreated" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorTreated" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} domain={[0, 100]} />
                                <RechartsTooltip
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Legend wrapperStyle={{ paddingTop: '20px' }} />
                                <Area type="monotone" dataKey="riskUntreated" name="Sin Intervención" stroke="#ef4444" fillOpacity={1} fill="url(#colorUntreated)" />
                                <Area type="monotone" dataKey="riskTreated" name="Con Tratamiento" stroke="#10b981" fillOpacity={1} fill="url(#colorTreated)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                    <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
                        <Scale size={18} className="text-purple-600" /> SHAP Values (Causas)
                    </h3>
                    <div className="space-y-4">
                        {data.featureImportance?.slice(0, 5).map((feat: any, idx: number) => (
                            <div key={idx} className="space-y-1">
                                <div className="flex justify-between text-xs font-bold text-slate-600">
                                    <span>{feat.feature.replace(/_/g, ' ')}</span>
                                    <span className={feat.importance > 0 ? "text-red-500" : "text-blue-500"}>
                                        {feat.importance > 0 ? '+' : ''}{feat.importance.toFixed(2)}
                                    </span>
                                </div>
                                <div className="h-2 w-full bg-slate-100 rounded-full relative overflow-hidden">
                                    <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-slate-300"></div>
                                    <div
                                        className={`absolute h-full rounded-full ${feat.importance > 0 ? 'bg-red-400 left-1/2' : 'bg-blue-400 right-1/2'}`}
                                        style={{ width: `${Math.abs(feat.importance * 50)}%` }} // Normalized visual scale
                                    ></div>
                                </div>
                            </div>
                        ))}
                        {(!data.featureImportance || data.featureImportance.length === 0) && (
                            <div className="text-center text-slate-400 text-xs py-10">
                                Datos insuficientes para análisis SHAP.
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Level 2: Medication Safety Section */}
            {data.medicationSafety?.length > 0 && (
                <div className="bg-white rounded-xl border border-red-100 p-6 shadow-sm">
                    <h3 className="font-bold text-red-800 mb-4 flex items-center gap-2">
                        <Pill size={18} /> Seguridad Farmacológica & Ajustes
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {data.medicationSafety.map((item: any, idx: number) => (
                            <div key={idx} className="bg-red-50/30 p-4 rounded-xl border border-red-50 relative overflow-hidden group hover:bg-red-50 transition-colors">
                                <div className="absolute right-2 top-2 text-red-100 group-hover:text-red-200 transition-colors">
                                    <Pill size={40} />
                                </div>
                                <div className="relative z-10">
                                    <div className="font-bold text-slate-900 text-sm mb-1">{item.drug}</div>
                                    <div className="text-[10px] text-red-600 font-extrabold mb-2 uppercase tracking-tight flex items-center gap-1">
                                        <div className="w-1 h-1 bg-red-600 rounded-full"></div>
                                        {item.issue}
                                    </div>
                                    <p className="text-xs text-slate-600 font-medium leading-relaxed italic">"{item.recommendation}"</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Capa 8: Evidencia Determinista & Guías */}
            {data.clinicalScores && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                        <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2 text-sm uppercase tracking-wider">
                            <Activity size={16} className="text-emerald-500" /> Evidencia Determinista (Hard Data)
                        </h3>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                                <div>
                                    <div className="text-xs font-bold text-slate-500">MDRD (eGFR)</div>
                                    <div className="text-lg font-black text-slate-900">{data.clinicalScores.mdrd.gfr} <small className="text-[10px] font-normal opacity-50">ml/min</small></div>
                                </div>
                                <div className="text-right">
                                    <span className={`px-2 py-1 rounded text-[10px] font-bold ${data.clinicalScores.mdrd.gfr < 60 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                        ESTADIO {data.clinicalScores.mdrd.stage}
                                    </span>
                                </div>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                                <div>
                                    <div className="text-xs font-bold text-slate-500">CHA₂DS₂-VASc</div>
                                    <div className="text-lg font-black text-slate-900">{data.clinicalScores.cha2ds2vasc.score} <small className="text-[10px] font-normal opacity-50">Pts</small></div>
                                </div>
                                <div className="text-right">
                                    <span className={`px-2 py-1 rounded text-[10px] font-bold ${data.clinicalScores.cha2ds2vasc.score >= 2 ? 'bg-red-100 text-red-700' : 'bg-slate-200 text-slate-700'}`}>
                                        RIESGO {data.clinicalScores.cha2ds2vasc.risk}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                        <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2 text-sm uppercase tracking-wider">
                            <Library size={16} className="text-blue-500" /> Respaldo Científico & Guías
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            {data.guidelinesCited?.map((guide: string, idx: number) => (
                                <span key={idx} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-xs font-bold border border-blue-100 shadow-sm">
                                    <div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
                                    {guide}
                                </span>
                            ))}
                        </div>
                        <p className="mt-4 text-[10px] text-slate-400 leading-relaxed">
                            * Las recomendaciones se basan en protocolos estandarizados (SAC, KDIGO, GPC MinSalud). La decisión final siempre corresponde al médico tratante.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};

// --- Clinical Command Center (Dashboard) ---
const Dashboard = ({ onSelectPatient, onAddPatient, setActiveModule }: { onSelectPatient: (p: Patient) => void, onAddPatient: () => void, setActiveModule: (m: 'dashboard' | 'abk_info') => void, key?: any }) => {
    const [patients, setPatients] = useState<Patient[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'list' | 'analytics'>('list'); // We'll keep this just for internal usage if needed but we'll prioritize module switching
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCondition, setFilterCondition] = useState('ALL');
    const [filterRisk, setFilterRisk] = useState('ALL');
    const [viewLayout, setViewLayout] = useState<'grid' | 'list'>('grid');

    useEffect(() => {
        const fetchPatients = async () => {
            try {
                const res = await api.get('/patients');
                if (res.data.length > 0) {
                    const adapted: Patient[] = res.data.map((p: any) => {
                        const fullName = `${p.first_name || ''} ${p.last_name || ''}`.trim();
                        const formattedName = fullName.split(' ')
                            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                            .join(' ');

                        return {
                            id: p.id.toString(),
                            name: formattedName || 'Paciente sin nombre',
                            age: p.age,
                            gender: p.gender === 'F' ? 'Femenino' : 'Masculino',
                            conditions: p.primary_condition ? [p.primary_condition] : ['Sin diagnóstico'],
                            riskLevel: (p.risk_level as RiskLevel) || (parseFloat(p.risk_score) > 70 ? 'CRITICAL' : parseFloat(p.risk_score) > 40 ? 'HIGH' : parseFloat(p.risk_score) > 20 ? 'MEDIUM' : 'LOW'),
                            riskScore: parseFloat(p.risk_score) || 0,
                            predictionLabel: 'HOSPITALIZATION_30D',
                            riskTrend: 'STABLE',
                            riskDrivers: p.risk_drivers || [],
                            careGaps: p.care_gaps || [],
                            lastEncounter: p.admission_date || new Date().toISOString(),
                            nextScheduled: null,
                            lastPrescriptionDate: new Date().toISOString(),
                            insurance: p.insurance || 'Particular',
                            baseline: { weight: 70, creatinine: 1.0 },
                            creatinine: [],
                            hba1c: [],
                            bnp: [],
                            weight: [],
                            feve: 0,
                            egfr: 90,
                            medications: [],
                            history: [],
                            socialVulnerability: p.social_vulnerability || 1,
                            socialFactors: p.social_factors || []
                        };
                    });
                    setPatients(adapted);
                } else {
                    setPatients(MOCK_PATIENTS);
                }
            } catch (e) {
                console.warn("Backend connection failed, using mocks.", e);
                setPatients(MOCK_PATIENTS);
            } finally {
                setLoading(false);
            }
        };
        fetchPatients();
    }, []);

    const filteredPatients = patients.filter(p => {
        const matchesCondition = filterCondition === 'ALL' || p.conditions.includes(filterCondition);
        const matchesRisk = filterRisk === 'ALL' || p.riskLevel === filterRisk;
        const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesCondition && matchesRisk && matchesSearch;
    });

    const sortedPatients = [...filteredPatients].sort((a, b) => {
        if (a.careGaps.length > 0 && b.careGaps.length === 0) return -1;
        if (b.careGaps.length > 0 && a.careGaps.length === 0) return 1;
        return (b.riskScore || 0) - (a.riskScore || 0);
    });

    const uniqueConditions = Array.from(new Set(patients.flatMap(p => p.conditions)));

    const getRiskColor = (level: RiskLevel) => {
        switch (level) {
            case 'CRITICAL': return 'bg-red-600 text-white border-red-700 animate-pulse';
            case 'HIGH': return 'bg-red-100 text-red-800 border-red-200';
            case 'MEDIUM': return 'bg-amber-100 text-amber-800 border-amber-200';
            case 'LOW': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
            default: return 'bg-slate-100 text-slate-800';
        }
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center p-20 space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <div className="text-slate-500 font-bold uppercase tracking-widest text-xs">Analizando cohorte poblacional...</div>
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap gap-4 items-center bg-white p-4 rounded-3xl border border-slate-200 shadow-sm">
                <div className="flex-1 min-w-[240px]">
                    <div className="relative group">
                        <input
                            type="text"
                            placeholder="Buscar paciente por nombre o ID..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-blue-400 focus:bg-white transition-all text-sm"
                        />
                        <div className="absolute left-3.5 top-3 text-slate-400 group-focus-within:text-blue-500 transition-colors">
                            <User size={18} />
                        </div>
                    </div>
                </div>

                <div className="flex gap-2">
                    <select
                        value={filterCondition}
                        onChange={(e) => setFilterCondition(e.target.value)}
                        className="bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-xs font-black text-slate-600 outline-none focus:border-blue-400 cursor-pointer"
                    >
                        <option value="ALL">TODAS LAS PATOLOGÍAS</option>
                        {uniqueConditions.map(c => <option key={c as string} value={c as string}>{(c as string).toUpperCase()}</option>)}
                    </select>
                    <select
                        value={filterRisk}
                        onChange={(e) => setFilterRisk(e.target.value)}
                        className="bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-xs font-black text-slate-600 outline-none focus:border-blue-400 cursor-pointer"
                    >
                        <option value="ALL">TODOS LOS RIESGOS</option>
                        <option value="CRITICAL">CRÍTICO</option>
                        <option value="HIGH">ALTO</option>
                        <option value="MEDIUM">MEDIO</option>
                        <option value="LOW">BAJO</option>
                    </select>
                </div>

                <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200 shadow-inner">
                    <button
                        onClick={() => setViewLayout('grid')}
                        className={`p-2 rounded-xl transition-all flex items-center gap-2 px-3 ${viewLayout === 'grid' ? 'bg-white text-blue-600 shadow-sm ring-1 ring-slate-200/50' : 'text-slate-400 hover:text-slate-600'}`}
                        title="Vista Cuadrícula"
                    >
                        <LayoutGrid size={18} /> <span className="text-[10px] font-black uppercase tracking-tighter hidden sm:inline">Tarjetas</span>
                    </button>
                    <button
                        onClick={() => setViewLayout('list')}
                        className={`p-2 rounded-xl transition-all flex items-center gap-2 px-3 ${viewLayout === 'list' ? 'bg-white text-blue-600 shadow-sm ring-1 ring-slate-200/50' : 'text-slate-400 hover:text-slate-600'}`}
                        title="Vista Lista"
                    >
                        <List size={18} /> <span className="text-[10px] font-black uppercase tracking-tighter hidden sm:inline">Columnas</span>
                    </button>
                </div>

                <button
                    onClick={onAddPatient}
                    className="bg-blue-600 text-white px-6 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 active:scale-95"
                >
                    <Plus size={16} /> Nuevo Ingreso
                </button>
            </div>

            {/* Banner IA Consola */}
            <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-blue-900 rounded-[2rem] p-8 shadow-2xl border border-slate-800 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-12 opacity-5 group-hover:scale-110 group-hover:rotate-12 transition-transform duration-1000 grayscale">
                    <BrainCircuit size={180} />
                </div>
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
                    <div className="max-w-xl">
                        <div className="flex items-center gap-2.5 text-indigo-400 mb-4">
                            <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 backdrop-blur-md">
                                <Sparkles size={20} />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Soporte de Inteligencia Activo</span>
                        </div>
                        <h2 className="text-3xl font-black text-white mb-3 tracking-tight">Abk Info: Medicina de Precisión</h2>
                        <p className="text-indigo-200/70 text-sm leading-relaxed font-medium">
                            Análisis automático de guías clínicas MinSalud, interacciones farmacológicas y
                            perfil genómico en tiempo real para optimizar decisiones en el punto de cuidado.
                        </p>
                    </div>
                    <button
                        onClick={() => setActiveModule('abk_info')}
                        className="bg-indigo-500 text-white border-none px-8 py-4 rounded-[1.25rem] font-black text-xs uppercase tracking-widest hover:bg-indigo-400 transition-all flex items-center gap-3 shadow-xl shadow-indigo-500/20 hover:-translate-y-1 active:scale-95 group/btn"
                    >
                        <Terminal size={18} /> Consola Clínica <ArrowRight size={18} className="translate-x-0 group-hover/btn:translate-x-1 transition-transform" />
                    </button>
                </div>
            </div>

            {/* Métrica de Outcomes Población */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col relative overflow-hidden group">
                    <div className="absolute -right-4 -bottom-4 text-emerald-50 opacity-[0.03] group-hover:scale-110 transition-transform">
                        <HeartPulse size={80} />
                    </div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Hospitalizaciones Evitadas</span>
                    <div className="flex items-end gap-2 text-emerald-600">
                        <span className="text-4xl font-black tabular-nums leading-none">{Math.round(patients.filter(p => p.riskScore > 0).length * 0.8)}</span>
                        <div className="mb-1 p-1 bg-emerald-50 rounded-lg text-emerald-600">
                            <TrendingUp size={14} />
                        </div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col relative overflow-hidden group">
                    <div className="absolute -right-4 -bottom-4 text-blue-50 opacity-[0.03] group-hover:scale-110 transition-transform">
                        <Activity size={80} />
                    </div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Reducción de Re-ingresos</span>
                    <div className="flex items-end gap-2 text-blue-600">
                        <span className="text-4xl font-black tabular-nums leading-none">18.5%</span>
                        <div className="mb-1 p-1 bg-blue-50 rounded-lg text-blue-600">
                            <ShieldCheck size={14} />
                        </div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col relative overflow-hidden group">
                    <div className="absolute -right-4 -bottom-4 text-indigo-50 opacity-[0.03] group-hover:scale-110 transition-transform">
                        <User size={80} />
                    </div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Población Activa</span>
                    <div className="flex items-end gap-2 text-slate-900">
                        <span className="text-4xl font-black tabular-nums leading-none">{patients.length}</span>
                        <div className="mb-1 p-1 bg-slate-100 rounded-lg text-slate-700">
                            <Users size={14} />
                        </div>
                    </div>
                </div>
                <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 shadow-xl flex flex-col relative overflow-hidden group">
                    <div className="absolute -right-4 -bottom-4 text-emerald-400 opacity-[0.05] group-hover:scale-110 transition-transform">
                        <DollarSign size={80} />
                    </div>
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Ahorro Proyectado</span>
                    <div className="flex items-end gap-2 text-emerald-400">
                        <span className="text-4xl font-black tabular-nums leading-none">${Math.round(patients.filter(p => p.riskScore > 50).length * 2.5)}k</span>
                        <span className="text-[10px] font-bold text-slate-500 mb-2 uppercase">USD / Mes</span>
                    </div>
                </div>
            </div>

            {/* Layout Toggle Render */}
            {viewLayout === 'grid' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-in fade-in duration-500">
                    {sortedPatients.map((patient) => (
                        <div
                            key={patient.id}
                            onClick={() => onSelectPatient(patient)}
                            className="group bg-white rounded-[2rem] border border-slate-200 p-6 hover:border-blue-400 hover:shadow-2xl hover:shadow-blue-500/10 transition-all cursor-pointer relative overflow-hidden"
                        >
                            <div className={`absolute top-0 right-0 w-32 h-32 -mr-10 -mt-10 opacity-[0.03] transition-transform group-hover:scale-110 group-hover:rotate-12`}>
                                <BrainCircuit size={128} />
                            </div>

                            <div className="flex justify-between items-start mb-5">
                                <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-500 text-lg font-black border border-slate-100 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors shadow-sm">
                                    {patient.name.split(' ').map(n => n[0]).join('')}
                                </div>
                                <div className={`px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest border shadow-sm ${getRiskColor(patient.riskLevel)}`}>
                                    {patient.riskScore}% RIESGO
                                </div>
                            </div>

                            <h3 className="text-lg font-black text-slate-900 group-hover:text-blue-700 transition-colors line-clamp-1 tracking-tight">{patient.name}</h3>
                            <div className="flex flex-wrap items-center gap-2 mt-2">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-100">{patient.conditions[0]}</span>
                                {patient.careGaps.length > 0 && (
                                    <div className="flex items-center gap-1.5 bg-purple-50 text-purple-600 px-2 py-0.5 rounded-lg text-[9px] font-black border border-purple-100 uppercase tracking-tighter">
                                        <Ghost size={12} /> Reincidencia
                                    </div>
                                )}
                            </div>

                            <div className="mt-8 pt-6 border-t border-slate-50 flex justify-between items-center group/footer">
                                <div className="flex flex-col">
                                    <span className="text-[8px] text-slate-400 font-black uppercase tracking-[0.2em]">Última Admisión</span>
                                    <span className="text-xs font-bold text-slate-700 mt-0.5 tabular-nums">{new Date(patient.lastEncounter).toLocaleDateString()}</span>
                                </div>
                                <div className="flex items-center gap-1 text-blue-600">
                                    <span className="text-[10px] font-black uppercase tracking-widest opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all">Perfil</span>
                                    <div className="p-2 rounded-xl bg-slate-50 group-hover:bg-blue-600 group-hover:text-white transition-all">
                                        <ChevronRight size={18} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="bg-white rounded-[2rem] border border-slate-200 shadow-xl overflow-hidden animate-in fade-in duration-500">
                    <div className="bg-slate-50/50 px-8 py-4 border-b border-slate-100 flex items-center justify-between">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Listado Maestro de Pacientes</span>
                        <span className="text-[10px] font-black text-slate-500">{sortedPatients.length} CASOS IDENTIFICADOS</span>
                    </div>
                    <table className="w-full text-left">
                        <thead className="bg-slate-50/30 text-slate-500 text-[10px] uppercase font-black tracking-widest border-b border-slate-100">
                            <tr>
                                <th className="px-8 py-5">Ficha Antropométrica</th>
                                <th className="px-8 py-5">Driver Clínico (Determinista)</th>
                                <th className="px-8 py-5">
                                    <div className="flex items-center gap-2 group/tooltip relative w-fit">
                                        Score Probabilístico
                                        <HelpCircle size={14} className="text-slate-400 cursor-help" />
                                        <div className="hidden group-hover/tooltip:block absolute left-full top-1/2 -translate-y-1/2 ml-2 w-64 p-3 bg-slate-800 text-white rounded-xl shadow-xl z-50">
                                            <div className="font-bold text-[10px] uppercase tracking-widest text-blue-300 mb-1">Índice Multi-Outcome</div>
                                            <p className="text-[10px] leading-relaxed text-slate-300 font-medium normal-case">
                                                Cálculo compuesto basado en 3 ejes: Clínico, Farmacológico y Social.
                                            </p>
                                            <div className="mt-2 pt-2 border-t border-white/10 flex flex-wrap gap-1">
                                                <span className="bg-slate-700 px-1.5 py-0.5 rounded text-[9px]">Hospitalización 30d</span>
                                                <span className="bg-slate-700 px-1.5 py-0.5 rounded text-[9px]">Mortalidad</span>
                                                <span className="bg-slate-700 px-1.5 py-0.5 rounded text-[9px]">Sepsis</span>
                                            </div>
                                        </div>
                                    </div>
                                </th>
                                <th className="px-8 py-5 text-right">Aciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {sortedPatients.map((patient) => (
                                <tr
                                    key={patient.id}
                                    onClick={() => onSelectPatient(patient)}
                                    className="hover:bg-blue-50/30 transition-colors cursor-pointer group"
                                >
                                    <td className="px-8 py-5">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 font-black text-xs group-hover:bg-blue-100 group-hover:text-blue-600 transition-all">
                                                {patient.name.split(' ').map(n => n[0]).join('')}
                                            </div>
                                            <div>
                                                <div className="font-black text-slate-900 tracking-tight">{patient.name}</div>
                                                <div className="text-[10px] font-bold text-slate-400 flex items-center gap-2">
                                                    ID: {patient.id} <span className="w-1 h-1 rounded-full bg-slate-300"></span> {patient.age} años
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5">
                                        <div className="flex flex-col gap-1.5">
                                            <span className="text-[10px] font-black text-slate-700 bg-slate-100 px-3 py-1 rounded-lg border border-slate-200 inline-block w-fit uppercase tracking-tighter">
                                                {patient.conditions[0]}
                                            </span>
                                            {patient.riskDrivers.slice(0, 1).map((driver, idx) => (
                                                <span key={idx} className="text-[9px] font-bold text-slate-400 italic">
                                                    Detonante: {driver.factor}
                                                </span>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="px-8 py-5">
                                        <div className="flex items-center gap-3">
                                            <div className={`px-4 py-1.5 rounded-full text-[10px] font-black border shadow-sm ${getRiskColor(patient.riskLevel)}`}>
                                                {patient.riskScore}%
                                            </div>
                                            <div className="flex-1 max-w-[100px] h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full transition-all duration-1000 ${patient.riskLevel === 'CRITICAL' ? 'bg-red-600' : 'bg-blue-500'}`}
                                                    style={{ width: `${patient.riskScore}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5 text-right">
                                        <button className="p-2.5 rounded-xl bg-slate-50 text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
                                            <ArrowRight size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

// --- Patient Detail Component ---
const PatientDetail = ({ patient, onBack }: { patient: Patient, onBack: () => void }) => {
    const [aiAnalysisData, setAiAnalysisData] = useState<any | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [activeTab, setActiveTab] = useState<'clinical' | 'timeline'>('clinical');
    const [history, setHistory] = useState<ClinicalEvent[]>([]);
    const [measurements, setMeasurements] = useState<any[]>([]);
    const [riskHistory, setRiskHistory] = useState<any[]>([]);
    const [isAddEventOpen, setIsAddEventOpen] = useState(false);
    const [isAddMeasurementOpen, setIsAddMeasurementOpen] = useState(false);
    const [loadingEvents, setLoadingEvents] = useState(true);
    const [isSimulationMode, setIsSimulationMode] = useState(false);
    const [simulatedValues, setSimulatedValues] = useState({ weight: '', creatinine: '' });
    const [engineResult, setEngineResult] = useState<any>(null);
    const [lastAssessmentId, setLastAssessmentId] = useState<number | null>(null);
    const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);


    const fetchHistory = async () => {
        setLoadingEvents(true);
        try {
            const res = await api.get(`/events/${patient.id}`);
            const adaptedEvents = res.data.map((e: any) => ({
                id: e.id,
                date: new Date(e.date).toLocaleDateString(),
                type: e.type.charAt(0).toUpperCase() + e.type.slice(1),
                description: e.notes || 'Sin descripción adicional'
            }));
            setHistory(adaptedEvents);
        } catch (err) {
            console.error("Error fetching patient history:", err);
            setHistory([]);
        } finally {
            setLoadingEvents(false);
        }
    };

    const fetchMeasurements = async () => {
        try {
            const res = await api.get(`/measurements/${patient.id}`);
            setMeasurements(res.data);
        } catch (err) {
            console.error("Error fetching measurements:", err);
        }
    };

    const fetchRiskHistory = async () => {
        try {
            const res = await api.get(`/risks/${patient.id}`);
            setRiskHistory(res.data);
        } catch (err) {
            console.error("Error fetching risk history:", err);
        }
    };

    useEffect(() => {
        fetchHistory();
        fetchMeasurements();
        fetchRiskHistory();
    }, [patient.id]);

    const handleRunAnalysis = async () => {
        setIsAnalyzing(true);
        try {
            // Preparar paciente para simulación si aplica
            const enrichedPatient = {
                ...patient,
                history,
                measurements: isSimulationMode ? [
                    ...measurements,
                    ...(simulatedValues.weight ? [{ type: 'weight', value: simulatedValues.weight, date: new Date().toISOString() }] : []),
                    ...(simulatedValues.creatinine ? [{ type: 'creatinine', value: simulatedValues.creatinine, date: new Date().toISOString() }] : [])
                ] : measurements
            };

            const result = await analyzePatientRisk(enrichedPatient, isSimulationMode);
            setAiAnalysisData(result);

            // CAPA 13: Inferencia 3 Ejes (Motor Propietario)
            try {
                const engRes = await api.get(`/risks/${patient.id}/analysis`);
                setEngineResult(engRes.data);
            } catch (xErr) {
                console.error("Clinical Engine Inference failed:", xErr);
            }


            if (!isSimulationMode) {
                // Seleccionar score de 30 días para persistencia histórica
                const hosp30 = result.predictions?.find((p: any) => p.outcome === 'HOSPITALIZATION_30D');

                const savedRes = await api.post('/risks', {
                    patient_id: patient.id,
                    score: hosp30?.probability || 0,
                    category: hosp30?.riskLevel || 'N/A',
                    summary: result.executiveSummary,
                    drivers: result.riskFactors
                });
                setLastAssessmentId(savedRes.data.id);
                setFeedbackSubmitted(false);
                fetchRiskHistory();
            }
        } catch (err) {
            console.error("Analysis or Save failed:", err);
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleFeedback = async (outcome: string) => {
        if (!lastAssessmentId) return;
        try {
            await api.patch(`/risks/${lastAssessmentId}/feedback`, {
                actual_outcome: outcome,
                feedback_notes: 'Feedback clínico directo desde Dashboard'
            });
            setFeedbackSubmitted(true);
            fetchRiskHistory();
        } catch (err) {
            console.error("Feedback submission failed:", err);
        }
    };

    const getVitalsForChart = (type: string) => {
        const filtered = measurements.filter(m => m.type === type);
        if (filtered.length === 0) return [];
        return filtered.map(m => ({
            date: new Date(m.date).toLocaleDateString([], { day: '2-digit', month: '2-digit' }),
            value: parseFloat(m.value)
        }));
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center mb-2">
                <button onClick={onBack} className="text-slate-400 hover:text-slate-600 text-sm font-medium transition-colors flex items-center gap-1">
                    <ChevronLeft size={16} /> Volver al Tablero
                </button>
                <div className="flex gap-2">
                    <button
                        onClick={() => window.print()}
                        className="bg-slate-100 text-slate-600 border border-slate-200 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-slate-200 transition-all shadow-sm no-print"
                    >
                        <Printer size={18} /> Exportar Reporte
                    </button>
                    <button
                        onClick={() => setIsAddMeasurementOpen(true)}
                        className="bg-white text-blue-600 border border-blue-200 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-blue-50 transition-all shadow-sm no-print"
                    >
                        <Beaker size={18} /> Cargar Lab/Peso
                    </button>
                    <button
                        onClick={() => setIsAddEventOpen(true)}
                        className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100 no-print"
                    >
                        <Plus size={18} /> Registrar Hito Clínico
                    </button>
                </div>
            </div>

            {/* Header de Reporte (Solo Impresión) */}
            <div className="print-only mb-8 border-b-2 border-slate-900 pb-4">
                <div className="flex justify-between items-end">
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 uppercase">Reporte de Análisis Predictivo</h1>
                        <p className="text-sm font-bold text-slate-500">Abk Clinical | Inteligencia Artificial para Prevención Secundaria</p>
                    </div>
                    <div className="text-right">
                        <p className="text-xs font-bold text-slate-700">FECHA: {new Date().toLocaleDateString()}</p>
                        <p className="text-[10px] text-slate-400">ID SISTEMA: {patient.id}</p>
                    </div>
                </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between md:items-center gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 text-xl font-bold relative uppercase">
                        {patient.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">{patient.name}</h1>
                        <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500 mt-1">
                            <span>{patient.age} años</span>
                            <span>•</span>
                            <span>{patient.gender}</span>
                            <span>•</span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${(patient as any).social_vulnerability >= 4 ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                                SDOH {(patient as any).social_vulnerability || 1}/5
                            </span>
                            {(patient as any).social_factors?.length > 0 && (
                                <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded italic">
                                    {(patient as any).social_factors.join(', ')}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
                <div className="text-center bg-slate-50 p-4 rounded-lg border border-slate-100 min-w-32">
                    <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Probabilidad (30d)</div>
                    <div className={`text-3xl font-extrabold ${patient.riskScore > 50 ? 'text-red-600' : 'text-emerald-600'}`}>
                        {patient.riskScore}%
                    </div>
                </div>
            </div>

            <div className="border-b border-slate-200">
                <nav className="-mb-px flex space-x-8">
                    <button onClick={() => setActiveTab('clinical')} className={`${activeTab === 'clinical' ? 'border-blue-500 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'} whitespace-nowrap py-4 px-1 border-b-2 font-bold text-sm flex items-center gap-2 transition-all`}>
                        <Activity size={16} /> Dashboard Clínico
                    </button>
                    <button onClick={() => setActiveTab('timeline')} className={`${activeTab === 'timeline' ? 'border-blue-500 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'} whitespace-nowrap py-4 px-1 border-b-2 font-bold text-sm flex items-center gap-2 transition-all`}>
                        <History size={16} /> Timeline Anti-Leakage
                    </button>
                </nav>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    {activeTab === 'clinical' && (
                        <>
                            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 overflow-hidden relative">
                                <div className="absolute top-0 right-0 p-4 opacity-5">
                                    <TrendingUp size={80} />
                                </div>
                                <h3 className="text-sm font-bold text-slate-700 mb-6 flex items-center gap-2">
                                    <History size={16} /> Evolución del Riesgo (Predicción Longitudinal)
                                </h3>
                                <RiskTrendChart data={riskHistory} />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <VitalChart
                                    title="Creatinina"
                                    unit="mg/dL"
                                    data={getVitalsForChart('creatinine').length > 0 ? getVitalsForChart('creatinine') : patient.creatinine}
                                    color="#f59e0b"
                                />
                                <VitalChart
                                    title="Peso Corporal"
                                    unit="kg"
                                    data={getVitalsForChart('weight').length > 0 ? getVitalsForChart('weight') : patient.weight}
                                    color="#3b82f6"
                                />
                            </div>
                        </>
                    )}
                    {activeTab === 'timeline' && (
                        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6">
                            <h3 className="text-sm font-bold text-slate-700 mb-6 flex items-center gap-2">
                                <CalendarDays size={16} /> Eventos Históricos (Features)
                            </h3>
                            <div className="relative border-l-2 border-slate-200 ml-3 space-y-8">
                                {loadingEvents ? (
                                    <div className="text-center py-12 text-slate-400">Cargando eventos...</div>
                                ) : history.length > 0 ? (
                                    history.map((event, i) => (
                                        <div key={i} className="relative pl-6 animate-in slide-in-from-left duration-300" style={{ animationDelay: `${i * 100}ms` }}>
                                            <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-slate-300 border-2 border-white"></div>
                                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start">
                                                <div>
                                                    <span className="text-xs font-bold text-slate-500 uppercase">{event.date}</span>
                                                    <h4 className="text-sm font-bold text-slate-800 mt-1">{event.type}</h4>
                                                    <p className="text-sm text-slate-600 mt-1">{event.description}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-12 text-slate-400">
                                        No hay eventos registrados en la historia clínica.
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <div className="space-y-6">
                    <div className="p-6 rounded-xl border shadow-sm relative overflow-hidden bg-gradient-to-b from-indigo-50 to-white border-indigo-100">
                        <div className="absolute -right-10 -top-10 bg-indigo-500/5 w-32 h-32 rounded-full blur-2xl"></div>
                        <div className="flex items-center gap-2 mb-4 relative z-10">
                            <div className="p-1.5 rounded-lg text-white bg-indigo-600">
                                <BrainCircuit size={20} />
                            </div>
                            <h3 className="font-bold text-indigo-900">Motor de Riesgo (IA)</h3>
                        </div>
                        <p className="text-sm mb-6 relative z-10 leading-relaxed text-indigo-700 font-medium">Análisis de riesgo predictivo basado en "Eventos Duros" y "Vacío de Datos".</p>

                        <div className="mb-4 p-3 bg-white/50 rounded-lg border border-indigo-100 relative z-10">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={isSimulationMode}
                                    onChange={(e) => setIsSimulationMode(e.target.checked)}
                                    className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                                />
                                <span className="text-xs font-bold text-indigo-900 uppercase tracking-wider">Modo Simulación (What-If)</span>
                            </label>

                            {isSimulationMode && (
                                <div className="mt-3 space-y-3 animate-in fade-in zoom-in duration-200">
                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <label className="text-[10px] font-bold text-slate-500 uppercase">Peso Sim (kg)</label>
                                            <input
                                                type="number"
                                                placeholder="Ej: 75"
                                                value={simulatedValues.weight}
                                                onChange={(e) => setSimulatedValues({ ...simulatedValues, weight: e.target.value })}
                                                className="w-full text-xs p-1.5 border border-slate-200 rounded outline-none focus:border-indigo-400"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-bold text-slate-500 uppercase">Creatinina Sim</label>
                                            <input
                                                type="number"
                                                placeholder="Ej: 1.1"
                                                value={simulatedValues.creatinine}
                                                onChange={(e) => setSimulatedValues({ ...simulatedValues, creatinine: e.target.value })}
                                                className="w-full text-xs p-1.5 border border-slate-200 rounded outline-none focus:border-indigo-400"
                                            />
                                        </div>
                                    </div>
                                    <div className="bg-amber-50 p-2 rounded border border-amber-100 text-[10px] text-amber-800 italic">
                                        * La simulación no se guardará en el historial.
                                    </div>
                                </div>
                            )}
                        </div>

                        <button
                            onClick={handleRunAnalysis}
                            disabled={isAnalyzing}
                            className={`w-full text-white font-bold py-3 px-4 rounded-xl shadow-lg transition-all flex justify-center items-center gap-2 relative z-10 disabled:opacity-70 ${isSimulationMode ? 'bg-indigo-500 shadow-indigo-100 ring-2 ring-indigo-200' : 'bg-indigo-600 shadow-indigo-200'}`}
                        >
                            {isAnalyzing ? (
                                <>
                                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    {isSimulationMode ? 'Proyectando Simulación...' : 'Generando Proyección...'}
                                </>
                            ) : isSimulationMode ? "Correr Simulación Híbrida" : "Analizar Riesgo & Polifarmacia"}
                        </button>

                        {/* CAPA 13: Visualización de Riesgo Triaxial */}
                        {engineResult && (
                            <div className="mt-4 p-5 bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl animate-in fade-in slide-in-from-top-4 duration-500 overflow-hidden relative">
                                <div className="absolute top-0 right-0 p-2 opacity-10">
                                    <Activity size={40} className="text-blue-500" />
                                </div>

                                <div className="flex justify-between items-center mb-4 relative z-10">
                                    <div className="flex items-center gap-2">
                                        <Cpu size={14} className="text-blue-400" />
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Motor de Riesgo Híbrido</span>
                                    </div>
                                    <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded-full border border-blue-500/30">
                                        {engineResult.guidelines}
                                    </span>
                                </div>

                                <div className="flex items-center justify-between mb-6 relative z-10">
                                    <div className="flex flex-col">
                                        <span className="text-4xl font-black text-white">{engineResult.score}%</span>
                                        <span className="text-[10px] text-slate-400 font-extrabold uppercase mt-1 tracking-tight">Riesgo Ponderado (Total)</span>
                                    </div>
                                    <div className="h-14 w-14 rounded-full border-4 border-slate-800 flex items-center justify-center relative bg-slate-800/50 shadow-lg">
                                        <div
                                            className="absolute inset-0 rounded-full border-4 border-blue-500 transition-all duration-1000 shadow-[0_0_15px_rgba(59,130,246,0.5)]"
                                            style={{
                                                clipPath: `inset(${100 - engineResult.score}% 0 0 0)`,
                                                filter: engineResult.score > 60 ? 'hue-rotate(-45deg)' : 'none'
                                            }}
                                        ></div>
                                        <DatabaseZap size={20} className="text-blue-400" />
                                    </div>
                                </div>

                                <div className="space-y-3 relative z-10">
                                    <div className="group">
                                        <div className="flex justify-between text-[10px] font-bold mb-1">
                                            <span className="text-slate-400 uppercase">Clínico • Bio</span>
                                            <span className="text-white">{engineResult.axes.clinical}%</span>
                                        </div>
                                        <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] transition-all duration-1000"
                                                style={{ width: `${engineResult.axes.clinical}%` }}
                                            ></div>
                                        </div>
                                    </div>

                                    <div className="group">
                                        <div className="flex justify-between text-[10px] font-bold mb-1">
                                            <span className="text-slate-400 uppercase">Farmacológico</span>
                                            <span className="text-white">{engineResult.axes.pharmacological}%</span>
                                        </div>
                                        <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)] transition-all duration-1000"
                                                style={{ width: `${engineResult.axes.pharmacological}%` }}
                                            ></div>
                                        </div>
                                    </div>

                                    <div className="group">
                                        <div className="flex justify-between text-[10px] font-bold mb-1">
                                            <span className="text-slate-400 uppercase">Contextual • SDOH</span>
                                            <span className="text-white">{engineResult.axes.contextual}%</span>
                                        </div>
                                        <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.5)] transition-all duration-1000"
                                                style={{ width: `${engineResult.axes.contextual}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-4 pt-3 border-t border-slate-800 flex justify-between items-center text-[9px]">
                                    <div className="text-slate-500 flex items-center gap-1">
                                        <div className="w-1 h-1 rounded-full bg-blue-500"></div>
                                        Driver: <span className="text-slate-300 font-bold uppercase">{engineResult.pathology_used}</span>
                                    </div>
                                    <div className="text-slate-600 italic">v3.0 Hybrid Engine</div>
                                </div>

                                {/* Seccción de Feedback Clínico */}
                                {!isSimulationMode && (
                                    <div className="mt-4 pt-4 border-t border-slate-800 animate-in fade-in duration-700">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Validación Clínica</span>
                                            {feedbackSubmitted && (
                                                <span className="text-[9px] font-bold text-emerald-400 flex items-center gap-1">
                                                    <div className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse"></div>
                                                    Feedback Recibido
                                                </span>
                                            )}
                                        </div>

                                        {!feedbackSubmitted ? (
                                            <div className="grid grid-cols-3 gap-2">
                                                <button
                                                    onClick={() => handleFeedback('ACCURATE')}
                                                    className="py-2.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-emerald-500/10 hover:border-emerald-500/50 text-slate-300 hover:text-emerald-400 transition-all flex flex-col items-center gap-1 group"
                                                >
                                                    <span className="text-xs group-hover:scale-110 transition-transform">👍</span>
                                                    <span className="text-[8px] font-black uppercase tracking-tighter">Certero</span>
                                                </button>
                                                <button
                                                    onClick={() => handleFeedback('OVERESTIMATED')}
                                                    className="py-2.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-amber-500/10 hover:border-amber-500/50 text-slate-300 hover:text-amber-400 transition-all flex flex-col items-center gap-1 group"
                                                >
                                                    <span className="text-xs group-hover:scale-110 transition-transform">📉</span>
                                                    <span className="text-[8px] font-black uppercase tracking-tighter">Sobre-est</span>
                                                </button>
                                                <button
                                                    onClick={() => handleFeedback('UNDERESTIMATED')}
                                                    className="py-2.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-red-500/10 hover:border-red-500/50 text-slate-300 hover:text-red-400 transition-all flex flex-col items-center gap-1 group"
                                                >
                                                    <span className="text-xs group-hover:scale-110 transition-transform">📈</span>
                                                    <span className="text-[8px] font-black uppercase tracking-tighter">Sub-est</span>
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="py-2 bg-emerald-500/5 rounded-xl border border-emerald-500/10 text-center">
                                                <p className="text-[9px] text-emerald-400 font-bold italic">"Gracias, esta data servirá para recalibrar el motor XGBoost"</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                    <AIAnalysisView data={aiAnalysisData} />

                </div>
            </div>

            {/* Disclaimer & Firma (Solo Impresión) */}
            <div className="print-only mt-12 pt-8 border-t border-slate-200">
                <div className="grid grid-cols-2 gap-12 text-xs">
                    <div className="space-y-4">
                        <p className="font-bold underline uppercase">Nota Legal y Clínico:</p>
                        <p className="text-slate-500 leading-relaxed italic">
                            Este reporte contiene análisis generado por Inteligencia Artificial (Abk Engine) basado en datos cargados.
                            Debe ser validado por un profesional matriculado previo a cualquier conducta terapéutica.
                            El score de riesgo es una estimación probabilística y no reemplaza el juicio clínico.
                        </p>
                    </div>
                    <div className="flex flex-col items-center justify-end">
                        <div className="w-full border-b border-slate-900 mb-2"></div>
                        <p className="font-bold">FIRMA Y SELLO MÉDICO RESPONSABLE</p>
                        <p className="text-[10px] text-slate-400">Fecha de Validación: ____/____/202__</p>
                    </div>
                </div>
            </div>

            {isAddEventOpen && (
                <AddEventModal
                    patientId={patient.id}
                    onClose={() => setIsAddEventOpen(false)}
                    onSave={fetchHistory}
                />
            )}

            {isAddMeasurementOpen && (
                <AddMeasurementModal
                    patientId={patient.id}
                    onClose={() => setIsAddMeasurementOpen(false)}
                    onSave={fetchMeasurements}
                />
            )}
        </div>
    );
};

// --- Main Layout ---
const MainLayout = () => {
    const { isAuthenticated, logout, user } = useAuth();
    const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
    const [isAddPatientOpen, setIsAddPatientOpen] = useState(false);
    const [activeModule, setActiveModule] = useState<'dashboard' | 'analytics' | 'abk_info'>('dashboard');
    const [refreshKey, setRefreshKey] = useState(0);

    if (!isAuthenticated) return <Navigate to="/login" />;

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
            <ModelValidationHeader />
            <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3 cursor-pointer group" onClick={() => { setSelectedPatient(null); setActiveModule('dashboard'); }}>
                        <BrandLogo size="sm" />
                        <span className="text-xl font-bold text-slate-900 group-hover:text-blue-700 transition-colors">Abk Clinical</span>
                    </div>

                    {/* Main Navigation Tabs */}
                    <div className="hidden md:flex items-center space-x-1 bg-slate-100 p-1.5 rounded-xl border border-slate-200">
                        <button
                            onClick={() => { setActiveModule('dashboard'); setSelectedPatient(null); }}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeModule === 'dashboard' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                        >
                            <LayoutDashboard size={16} /> Población
                        </button>
                        <button
                            onClick={() => { setActiveModule('analytics'); setSelectedPatient(null); }}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeModule === 'analytics' ? 'bg-white text-amber-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                        >
                            <Activity size={16} /> Centro de Inteligencia
                        </button>
                        <button
                            onClick={() => { setActiveModule('abk_info'); setSelectedPatient(null); }}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeModule === 'abk_info' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                        >
                            <Cpu size={16} /> IA Clínica
                        </button>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="hidden md:flex items-center gap-2 text-sm text-blue-700 px-4 py-2 rounded-full border bg-blue-50 border-blue-100">
                            <Stethoscope size={14} />
                            <span className="font-bold">Dr. {user?.email.split('@')[0]}</span>
                        </div>
                        <button onClick={logout} className="text-xs text-red-500 font-bold hover:text-red-700 transition-colors flex items-center gap-1">
                            <LogOut size={12} /> Cerrar Sesión
                        </button>
                    </div>
                </div>
            </header>

            <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-8">
                {activeModule === 'dashboard' ? (
                    selectedPatient ? (
                        <PatientDetail patient={selectedPatient} onBack={() => setSelectedPatient(null)} />
                    ) : (
                        <Dashboard key={refreshKey} onSelectPatient={setSelectedPatient} onAddPatient={() => setIsAddPatientOpen(true)} setActiveModule={setActiveModule} />
                    )
                ) : activeModule === 'analytics' ? (
                    <AnalyticsDashboard />
                ) : (
                    <AbkInfo />
                )}
            </main>

            {isAddPatientOpen && (
                <AddPatientModal onClose={() => setIsAddPatientOpen(false)} onSave={() => { setIsAddPatientOpen(false); setRefreshKey(prev => prev + 1); }} />
            )}
        </div>
    );
};

// --- Private Route ---
const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
    const { isAuthenticated } = useAuth();
    const location = useLocation();
    return isAuthenticated ? children : <Navigate to="/login" state={{ from: location }} replace />;
};

function App() {
    return (
        <Router>
            <AuthProvider>
                <Routes>
                    <Route path="/" element={<LandingPage />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route
                        path="/app/*"
                        element={
                            <PrivateRoute>
                                <MainLayout />
                            </PrivateRoute>
                        }
                    />
                    {/* Catch all redirect to landing */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </AuthProvider>
        </Router>
    );
}

export default App;
