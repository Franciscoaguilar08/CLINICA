
import React, { useState } from 'react';
import { X, UserPlus, Save, AlertTriangle } from 'lucide-react';
import api from '../src/services/api';

interface AddPatientModalProps {
  onClose: () => void;
  onSave: () => void;
}

export const AddPatientModal: React.FC<AddPatientModalProps> = ({ onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    gender: 'M',
    insurance: '',
    condition: ''
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

    try {
      // Split name into first and last for the backend
      const nameParts = formData.name.trim().split(' ');
      const first_name = nameParts[0];
      const last_name = nameParts.slice(1).join(' ') || 'S/A';

      await api.post('/patients', {
        first_name,
        last_name,
        age: parseInt(formData.age),
        gender: formData.gender,
        system_type: formData.condition || 'General'
      });

      onSave(); // Trigger refresh in parent
      onClose();
    } catch (err: any) {
      console.error("Error creating patient:", err);
      setError('No se pudo guardar el paciente. Verifique su conexión.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 font-sans">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-slate-200">

        <div className="bg-slate-50 px-6 py-5 border-b border-slate-100 flex justify-between items-center">
          <div className="flex items-center gap-2 text-slate-800">
            <div className="bg-blue-100 p-2 rounded-lg text-blue-600">
              <UserPlus size={20} />
            </div>
            <h3 className="font-bold text-lg">Nuevo Paciente</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-red-500 transition-colors bg-white p-1 rounded-full hover:bg-red-50">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-5">
          {error && (
            <div className="p-3 bg-red-50 border border-red-100 text-red-600 text-xs font-bold rounded-lg flex items-center gap-2 animate-in slide-in-from-top-2">
              <AlertTriangle size={14} /> {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Nombre Completo</label>
              <input
                type="text"
                name="name"
                required
                disabled={loading}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-slate-50 focus:bg-white transition-colors font-medium disabled:opacity-50"
                placeholder="Ej. Juan Pérez"
                value={formData.name}
                onChange={handleChange}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Edad</label>
              <input
                type="number"
                name="age"
                required
                disabled={loading}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-slate-50 focus:bg-white transition-colors font-medium disabled:opacity-50"
                placeholder="Ej. 65"
                value={formData.age}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Género</label>
              <select
                name="gender"
                disabled={loading}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-slate-50 focus:bg-white transition-colors font-medium disabled:opacity-50"
                value={formData.gender}
                onChange={handleChange}
              >
                <option value="M">Masculino</option>
                <option value="F">Femenino</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Cobertura</label>
              <input
                type="text"
                name="insurance"
                disabled={loading}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-slate-50 focus:bg-white transition-colors font-medium disabled:opacity-50"
                placeholder="Ej. PAMI / OSDE"
                value={formData.insurance}
                onChange={handleChange}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Patología Principal</label>
            <input
              type="text"
              name="condition"
              disabled={loading}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-slate-50 focus:bg-white transition-colors font-medium disabled:opacity-50"
              placeholder="Ej. Insuficiencia Cardíaca"
              value={formData.condition}
              onChange={handleChange}
            />
          </div>

          <div className="pt-6 flex gap-3">
            <button type="button" onClick={onClose} disabled={loading} className="flex-1 px-4 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors text-sm disabled:opacity-50">
              Cancelar
            </button>
            <button type="submit" disabled={loading} className="flex-1 px-4 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all text-sm flex justify-center items-center gap-2 shadow-lg shadow-blue-200 hover:-translate-y-0.5 disabled:bg-blue-400">
              {loading ? 'Guardando...' : <><Save size={16} /> Guardar</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
