import React, { useState } from 'react';
import { X, Calendar, ClipboardList, Save, AlertCircle } from 'lucide-react';
import api from '../src/services/api';

interface AddEventModalProps {
    patientId: string;
    onClose: () => void;
    onSave: () => void;
}

export const AddEventModal: React.FC<AddEventModalProps> = ({ patientId, onClose, onSave }) => {
    const [formData, setFormData] = useState({
        type: 'consulta',
        date: new Date().toISOString().split('T')[0],
        notes: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            await api.post('/events', {
                patient_id: patientId,
                type: formData.type,
                date: formData.date,
                notes: formData.notes
            });
            onSave();
            onClose();
        } catch (err: any) {
            console.error("Error creating clinical event:", err);
            setError('Error al registrar el hito clínico. Verifique los datos.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4 font-sans">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-slate-200">

                <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                    <div className="flex items-center gap-2 text-slate-800">
                        <div className="bg-indigo-100 p-2 rounded-lg text-indigo-600">
                            <ClipboardList size={18} />
                        </div>
                        <h3 className="font-bold">Nuevo Hito Clínico</h3>
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

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2 tracking-wider">Tipo de Hito</label>
                        <select
                            name="type"
                            disabled={loading}
                            className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none bg-slate-50 font-medium"
                            value={formData.type}
                            onChange={handleChange}
                        >
                            <option value="consulta">Consulta Programada</option>
                            <option value="guardia">Atención en Guardia</option>
                            <option value="internacion">Internación</option>
                            <option value="medicacion">Cambio de Medicación</option>
                            <option value="alta">Alta / Seguimiento Exitoso</option>
                            <option value="estudio">Resultado de Estudio</option>
                        </select>
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
                                className="w-full pl-11 pr-4 py-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none bg-slate-50 font-medium"
                                value={formData.date}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2 tracking-wider">Notas Clínicas / Descripción</label>
                        <textarea
                            name="notes"
                            disabled={loading}
                            rows={3}
                            className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none bg-slate-50 font-medium resize-none"
                            placeholder="Ej: Se ajusta dosis de Enalapril por HT persistente..."
                            value={formData.notes}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="pt-4 flex gap-3">
                        <button type="button" onClick={onClose} disabled={loading} className="flex-1 px-4 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors text-sm">
                            Cancelar
                        </button>
                        <button type="submit" disabled={loading} className="flex-1 px-4 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all text-sm flex justify-center items-center gap-2 shadow-lg shadow-indigo-100 disabled:opacity-50">
                            {loading ? 'Guardando...' : <><Save size={16} /> Guardar Hito</>}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
