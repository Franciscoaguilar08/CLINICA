
import React, { useState } from 'react';
import { X, UserPlus, Save, Database } from 'lucide-react';

interface AddPatientModalProps {
  onClose: () => void;
  onSave: (data: any) => void;
}

export const AddPatientModal: React.FC<AddPatientModalProps> = ({ onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    gender: 'M',
    insurance: '',
    condition: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
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
          <div className="grid grid-cols-2 gap-5">
             <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Nombre Completo</label>
                <input 
                  type="text" 
                  name="name"
                  required
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-slate-50 focus:bg-white transition-colors font-medium"
                  placeholder="Ej. Juan Pérez"
                  onChange={handleChange}
                />
             </div>
             <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Edad</label>
                <input 
                  type="number" 
                  name="age"
                  required
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-slate-50 focus:bg-white transition-colors font-medium"
                  placeholder="Ej. 65"
                  onChange={handleChange}
                />
             </div>
          </div>

          <div className="grid grid-cols-2 gap-5">
             <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Género</label>
                <select 
                  name="gender"
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-slate-50 focus:bg-white transition-colors font-medium"
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
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-slate-50 focus:bg-white transition-colors font-medium"
                  placeholder="Ej. PAMI / OSDE"
                  onChange={handleChange}
                />
             </div>
          </div>

          <div>
             <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Patología Principal</label>
             <input 
                type="text" 
                name="condition"
                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-slate-50 focus:bg-white transition-colors font-medium"
                placeholder="Ej. Insuficiencia Cardíaca"
                onChange={handleChange}
             />
          </div>

          <div className="pt-6 flex gap-3">
             <button type="button" onClick={onClose} className="flex-1 px-4 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors text-sm">
                Cancelar
             </button>
             <button type="submit" className="flex-1 px-4 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all text-sm flex justify-center items-center gap-2 shadow-lg shadow-blue-200 hover:-translate-y-0.5">
                <Save size={16} /> Guardar
             </button>
          </div>
        </form>
      </div>
    </div>
  );
};
