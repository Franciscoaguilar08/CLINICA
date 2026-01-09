import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import api from './src/services/api';
import { MOCK_PATIENTS, OUTCOMES_DATA, MODEL_METRICS } from './constants';
import { Patient, RiskLevel, RiskTrend, CareGap } from './types';
import { VitalChart } from './components/VitalChart';
import { AbkInfo } from './components/AbkInfo';
import { AddPatientModal } from './components/AddPatientModal';
import { analyzePatientRisk } from './services/geminiService';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from 'recharts';
import {
    Activity, AlertTriangle, BrainCircuit, ChevronRight, Ghost, Clock, BarChart3,
    DollarSign, HeartPulse, Scale, Stethoscope, Building2, CheckCircle2, ArrowRight,
    Lock, AlertOctagon, User, TrendingUp, TrendingDown, Minus, Database, ShieldCheck,
    LayoutDashboard, Cpu, Plus, Library, GraduationCap, CalendarDays, History, Shield,
    Pill, DatabaseZap, LogOut
} from 'lucide-react';

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
                        <h2 className="text-blue-400 font-bold tracking-wider uppercase text-sm mb-3">La Diferiencia Técnica</h2>
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 bg-gradient-to-br from-indigo-600 to-blue-700 rounded-xl p-6 text-white shadow-lg relative overflow-hidden">
                    <div className="absolute -right-10 -top-10 bg-white/10 w-40 h-40 rounded-full blur-3xl"></div>
                    <div className="relative z-10">
                        <h3 className="text-sm font-bold uppercase tracking-wider opacity-80 mb-2 flex items-center gap-2">
                            <BrainCircuit size={16} /> Resumen Ejecutivo
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

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                    <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
                        <TrendingUp size={18} className="text-blue-600" /> Proyección de Riesgo a 6 Meses
                    </h3>
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data.riskProjection}>
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
        </div>
    );
};

// --- Clinical Command Center (Dashboard) ---
const Dashboard = ({ onSelectPatient, onAddPatient }: { onSelectPatient: (p: Patient) => void, onAddPatient: () => void }) => {
    const [patients, setPatients] = useState<Patient[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPatients = async () => {
            try {
                const res = await api.get('/patients');
                if (res.data.length > 0) {
                    const adapted = res.data.map((p: any) => {
                        const mockMatch = MOCK_PATIENTS.find(m => m.id === p.id) || MOCK_PATIENTS[0];
                        return {
                            ...mockMatch,
                            id: p.id,
                            name: `${p.first_name} ${p.last_name}`,
                            age: p.age,
                            gender: p.gender,
                            lastEncounter: p.admission_date
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

    const sortedPatients = [...patients].sort((a, b) => {
        if (a.careGaps.length > 0 && b.careGaps.length === 0) return -1;
        if (b.careGaps.length > 0 && a.careGaps.length === 0) return 1;
        return b.riskScore - a.riskScore;
    });

    const getRiskColor = (level: RiskLevel) => {
        switch (level) {
            case 'CRITICAL': return 'bg-red-600 text-white border-red-700 animate-pulse';
            case 'HIGH': return 'bg-red-100 text-red-800 border-red-200';
            case 'MEDIUM': return 'bg-amber-100 text-amber-800 border-amber-200';
            case 'LOW': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
            default: return 'bg-slate-100 text-slate-800';
        }
    };

    if (loading) return <div className="p-8 text-center text-slate-500">Analizando cohorte poblacional...</div>;

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
                        Target: <strong>Internación &lt; 30 días</strong>
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
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Reducción Re-ingresos</span>
                    <div className="flex items-center gap-2 text-blue-600">
                        <TrendingDown size={24} />
                        <span className="text-2xl font-bold">{OUTCOMES_DATA.readmissionsReducedPercentage}%</span>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Pacientes Activos</span>
                    <div className="flex items-center gap-2 text-slate-700">
                        <User size={24} />
                        <span className="text-2xl font-bold">{OUTCOMES_DATA.activePatients}</span>
                    </div>
                </div>
                <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-4 rounded-xl border border-slate-700 shadow-sm flex flex-col text-white">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Ahorro Proyectado</span>
                    <div className="flex items-center gap-2 text-emerald-400">
                        <DollarSign size={24} />
                        <span className="text-2xl font-bold">{OUTCOMES_DATA.estimatedSavings.toLocaleString()}</span>
                    </div>
                </div>
            </div>

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
                            <th className="px-6 py-4">Principal Driver</th>
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
                                                <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold text-xs uppercase">
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
                                        <div className={`px-2.5 py-1 rounded text-xs font-bold border w-fit ${getRiskColor(patient.riskLevel)}`}>
                                            {patient.riskScore}%
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
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

// --- Patient Detail Component ---
const PatientDetail = ({ patient, onBack }: { patient: Patient, onBack: () => void }) => {
    const [aiAnalysisData, setAiAnalysisData] = useState<any | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [activeTab, setActiveTab] = useState<'clinical' | 'timeline'>('clinical');

    const handleRunAnalysis = async () => {
        setIsAnalyzing(true);
        const result = await analyzePatientRisk(patient);
        setAiAnalysisData(result);
        setIsAnalyzing(false);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4 mb-2">
                <button onClick={onBack} className="text-slate-400 hover:text-slate-600 text-sm font-medium">
                    &larr; Volver al Tablero
                </button>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between md:items-center gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 text-xl font-bold relative uppercase">
                        {patient.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">{patient.name}</h1>
                        <div className="flex gap-2 text-sm text-slate-500 mt-1">
                            <span>{patient.age} años</span>
                            <span>•</span>
                            <span>{patient.gender}</span>
                        </div>
                    </div>
                </div>
                <div className="text-center bg-slate-50 p-4 rounded-lg border border-slate-100 min-w-32">
                    <div className="text-xs text-slate-500 font-semibold uppercase">Probabilidad (30d)</div>
                    <div className={`text-2xl font-bold ${patient.riskScore > 50 ? 'text-red-600' : 'text-emerald-600'}`}>
                        {patient.riskScore}%
                    </div>
                </div>
            </div>

            <div className="border-b border-slate-200">
                <nav className="-mb-px flex space-x-8">
                    <button onClick={() => setActiveTab('clinical')} className={`${activeTab === 'clinical' ? 'border-blue-500 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}>
                        <Activity size={16} /> Dashboard Clínico
                    </button>
                    <button onClick={() => setActiveTab('timeline')} className={`${activeTab === 'timeline' ? 'border-blue-500 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}>
                        <History size={16} /> Timeline Anti-Leakage
                    </button>
                </nav>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    {activeTab === 'clinical' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <VitalChart title="Creatinina" unit="mg/dL" data={patient.creatinine} color="#f59e0b" />
                            <VitalChart title="Peso Corporal" unit="kg" data={patient.weight} color="#3b82f6" />
                        </div>
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
                                            {event.value && <span className="mt-2 sm:mt-0 px-2 py-1 bg-slate-100 rounded text-xs font-mono text-slate-700 border border-slate-200">{event.value}</span>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="space-y-6">
                    <div className="p-6 rounded-xl border shadow-sm relative overflow-hidden bg-gradient-to-b from-indigo-50 to-white border-indigo-100">
                        <div className="flex items-center gap-2 mb-4 relative z-10">
                            <div className="p-1.5 rounded-lg text-white bg-indigo-600">
                                <BrainCircuit size={20} />
                            </div>
                            <h3 className="font-bold text-indigo-900">Motor de Riesgo (IA)</h3>
                        </div>
                        <p className="text-sm mb-6 relative z-10 leading-relaxed text-indigo-700">Análisis de riesgo basado en "Eventos Duros" y "Vacío de Datos".</p>
                        <button
                            onClick={handleRunAnalysis}
                            disabled={isAnalyzing}
                            className="w-full text-white font-medium py-2.5 px-4 rounded-lg shadow-sm hover:shadow transition-all flex justify-center items-center gap-2 relative z-10 disabled:opacity-70 bg-indigo-600 hover:bg-indigo-700"
                        >
                            {isAnalyzing ? "Analizando..." : "Analizar Riesgo & Polifarmacia"}
                        </button>
                    </div>
                    <AIAnalysisView data={aiAnalysisData} />
                </div>
            </div>
        </div>
    );
};

// --- Main Layout ---
const MainLayout = () => {
    const { isAuthenticated, logout, user } = useAuth();
    const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
    const [isAddPatientOpen, setIsAddPatientOpen] = useState(false);

    if (!isAuthenticated) return <Navigate to="/login" />;

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
            <ModelValidationHeader />
            <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setSelectedPatient(null)}>
                        <BrandLogo size="sm" />
                        <span className="text-xl font-bold text-slate-900 group-hover:text-blue-700 transition-colors">Abk Clinical</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="hidden md:flex items-center gap-2 text-sm text-blue-700 px-4 py-2 rounded-full border bg-blue-50 border-blue-100">
                            <Stethoscope size={14} />
                            <span className="font-bold">{user?.email}</span>
                        </div>
                        <button onClick={logout} className="text-xs text-red-500 font-bold hover:text-red-700 transition-colors flex items-center gap-1">
                            <LogOut size={12} /> Cerrar Sesión
                        </button>
                    </div>
                </div>
            </header>

            <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-8">
                {selectedPatient ? (
                    <PatientDetail patient={selectedPatient} onBack={() => setSelectedPatient(null)} />
                ) : (
                    <Dashboard onSelectPatient={setSelectedPatient} onAddPatient={() => setIsAddPatientOpen(true)} />
                )}
            </main>

            {isAddPatientOpen && (
                <AddPatientModal onClose={() => setIsAddPatientOpen(false)} onSave={() => setIsAddPatientOpen(false)} />
            )}
        </div>
    );
};

// --- Private Route ---
const PrivateRoute = ({ children }: { children: JSX.Element }) => {
    const { isAuthenticated } = useAuth();
    return isAuthenticated ? children : <Navigate to="/login" replace />;
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
