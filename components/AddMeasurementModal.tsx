import React, { useState } from 'react';
import { X, Beaker, Scale, Save, AlertCircle, Calendar } from 'lucide-react';
import api from '../src/services/api';

interface AddMeasurementModalProps {
    patientId: string;
    onClose: () => void;
    onSave: () => void;
}

export const AddMeasurementModal: React.FC<AddMeasurementModalProps> = ({ patientId, onClose, onSave }) => {
    const [formData, setFormData] = useState({
        type: 'creatinine',
        value: '',
        date: new Date().toISOString().split('T')[0]
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const units: Record<string, string> = {
            creatinine: 'mg/dL',
            weight: 'kg',
            bnp: 'pg/mL',
            hba1c: '%'
        };

        const val = parseFloat(formData.value);
        if (isNaN(val)) {
            setError('Por favor ingrese un valor numérico válido.');
            setLoading(false);
            return;
        }

        try {
            await api.post('/measurements', {
                patient_id: patientId,
                type: formData.type,
                value: val,
                unit: units[formData.type],
                date: formData.date
            });
            onSave();
            onClose();
        } catch (err: any) {
            console.error("Error creating measurement:", err);
            const msg = err.response?.data?.error || 'Error al registrar la medición.';
            setError(`${msg} Verifique el valor y la conexión.`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4 font-sans">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-slate-200">

                <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                    <div className="flex items-center gap-2 text-slate-800">
                        <div className="bg-blue-100 p-2 rounded-lg text-blue-600">
                            <Beaker size={18} />
                        </div>
                        <h3 className="font-bold">Nueva Medición Clínica</h3>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-red-500 transition-colors bg-white p-1 rounded-full hover:bg-red-50">
                        <X size={18} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {error && (
                        <div className="p-3 bg-red-50 border border-red-100 text-red-600 text-xs font-bold rounded-lg flex items-center gap-2">
                            <AlertCircle size={14} /> {error}
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2 tracking-wider">Tipo de Medición</label>
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, type: 'creatinine' })}
                                    className={`flex items-center justify-center gap-2 p-3 rounded-xl border font-bold text-sm transition-all ${formData.type === 'creatinine' ? 'bg-amber-50 border-amber-500 text-amber-700 shadow-sm' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'}`}
                                >
                                    <Beaker size={16} /> Creatinina
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, type: 'weight' })}
                                    className={`flex items-center justify-center gap-2 p-3 rounded-xl border font-bold text-sm transition-all ${formData.type === 'weight' ? 'bg-blue-50 border-blue-500 text-blue-700 shadow-sm' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'}`}
                                >
                                    <Scale size={16} /> Peso
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2 tracking-wider">Valor</label>
                            <input
                                type="number"
                                step="0.01"
                                name="value"
                                required
                                placeholder="0.00"
                                disabled={loading}
                                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-slate-50 font-bold"
                                value={formData.value}
                                onChange={handleChange}
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2 tracking-wider">Fecha</label>
                            <div className="relative">
                                <Calendar className="absolute left-4 top-3 text-slate-400" size={16} />
                                <input
                                    type="date"
                                    name="date"
                                    required
                                    disabled={loading}
                                    className="w-full pl-11 pr-4 py-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-slate-50 font-medium"
                                    value={formData.date}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 flex gap-3">
                        <button type="button" onClick={onClose} disabled={loading} className="flex-1 px-4 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors text-sm">
                            Cancelar
                        </button>
                        <button type="submit" disabled={loading} className="flex-1 px-4 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all text-sm flex justify-center items-center gap-2 shadow-lg shadow-blue-100 disabled:opacity-50">
                            {loading ? 'Guardando...' : <><Save size={16} /> Guardar Dato</>}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
