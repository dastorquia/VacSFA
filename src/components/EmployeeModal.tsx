import React, { useState, useEffect } from 'react';
import { X, User, Briefcase, Calendar, Award, Check, AlertCircle } from 'lucide-react';
import { Employee, SectorType, VacationRequest } from '../types';
import { getEmployeeBalance } from '../utils/vacationEngine';

interface EmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: Employee | null; // null = new hire, Employee = edit existing
  onSave: (data: { id?: string; name: string; sector: SectorType; totalDays: number }) => void;
  requests: VacationRequest[];
}

const SENIORITY_PRESETS = [
  { days: 14, label: '14 días', desc: '< 5 años' },
  { days: 21, label: '21 días', desc: '5 a 10 años' },
  { days: 28, label: '28 días', desc: '10 a 20 años' },
  { days: 35, label: '35 días', desc: '> 20 años' },
];

export const EmployeeModal: React.FC<EmployeeModalProps> = ({
  isOpen,
  onClose,
  employee,
  onSave,
  requests,
}) => {
  const [name, setName] = useState('');
  const [sector, setSector] = useState<SectorType>('PROD');
  const [totalDays, setTotalDays] = useState<number>(21);
  const [customDays, setCustomDays] = useState<string>('21');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (employee) {
      setName(employee.name);
      setSector(employee.sector);
      setTotalDays(employee.totalDays);
      setCustomDays(employee.totalDays.toString());
    } else {
      setName('');
      setSector('PROD');
      setTotalDays(21);
      setCustomDays('21');
    }
    setError(null);
  }, [employee, isOpen]);

  if (!isOpen) return null;

  const isEditing = !!employee;

  // Calculate live preview of balance
  const tempEmp: Employee = {
    id: employee ? employee.id : 'temp-id',
    name: name || 'Colaborador',
    sector,
    totalDays: totalDays || 0,
  };
  const liveBalance = isEditing ? getEmployeeBalance(tempEmp, requests) : null;
  const currentApproved = liveBalance ? liveBalance.approvedDays : 0;
  const liveAvailable = Math.max(0, totalDays - currentApproved);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim().toUpperCase();

    if (!trimmedName) {
      setError('Por favor ingrese el nombre y apellido del colaborador.');
      return;
    }

    if (totalDays <= 0 || isNaN(totalDays)) {
      setError('Los días de vacaciones deben ser un número positivo.');
      return;
    }

    if (isEditing && totalDays < currentApproved) {
      setError(
        `El colaborador ya tiene ${currentApproved} días de vacaciones aprobados. Los días totales no pueden ser menores a los días ya tomados.`
      );
      return;
    }

    onSave({
      id: employee?.id,
      name: trimmedName,
      sector,
      totalDays,
    });
    onClose();
  };

  const handlePresetSelect = (days: number) => {
    setTotalDays(days);
    setCustomDays(days.toString());
    setError(null);
  };

  const handleCustomDaysChange = (val: string) => {
    setCustomDays(val);
    const parsed = parseInt(val, 10);
    if (!isNaN(parsed) && parsed >= 0) {
      setTotalDays(parsed);
      setError(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-scaleUp">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-850">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">
                {isEditing ? 'Modificar Datos de Colaborador y Antigüedad' : 'Nuevo Ingreso a la Dotación'}
              </h2>
              <p className="text-[11px] text-slate-400">
                {isEditing
                  ? `Actualización de legajo y cupo anual (${employee.id})`
                  : 'Alta de nuevo personal en el plantel de la planta'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-3 rounded-xl bg-rose-950/50 border border-rose-800/60 text-xs text-rose-200 flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Nombre y Apellido */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-slate-400" />
              <span>Nombre y Apellido Completo</span>
            </label>
            <input
              type="text"
              required
              placeholder="Ej: PEREZ JUAN CARLOS"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError(null);
              }}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 focus:border-blue-500 rounded-xl text-white text-sm uppercase placeholder:normal-case placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all font-medium"
            />
          </div>

          {/* Sector de Trabajo */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Briefcase className="w-3.5 h-3.5 text-slate-400" />
              <span>Sector de Planta</span>
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setSector('PROD')}
                className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all text-left flex items-center justify-between ${
                  sector === 'PROD'
                    ? 'bg-sky-600/20 border-sky-500 text-sky-200 shadow-sm'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="font-bold text-white">PRODUCCIÓN</div>
                  <div className="text-[10px] text-sky-400">Sector PROD</div>
                </div>
                {sector === 'PROD' && <Check className="w-4 h-4 text-sky-400" />}
              </button>

              <button
                type="button"
                onClick={() => setSector('CYD')}
                className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all text-left flex items-center justify-between ${
                  sector === 'CYD'
                    ? 'bg-emerald-600/20 border-emerald-500 text-emerald-200 shadow-sm'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="font-bold text-white">CARGA Y DESCARGA</div>
                  <div className="text-[10px] text-emerald-400">Sector CYD</div>
                </div>
                {sector === 'CYD' && <Check className="w-4 h-4 text-emerald-400" />}
              </button>

              <button
                type="button"
                onClick={() => setSector('MANT')}
                className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all text-left flex items-center justify-between ${
                  sector === 'MANT'
                    ? 'bg-amber-600/20 border-amber-500 text-amber-200 shadow-sm'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="font-bold text-white">MANTENIMIENTO</div>
                  <div className="text-[10px] text-amber-400">Sector MANT</div>
                </div>
                {sector === 'MANT' && <Check className="w-4 h-4 text-amber-400" />}
              </button>

              <button
                type="button"
                onClick={() => setSector('CAL')}
                className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all text-left flex items-center justify-between ${
                  sector === 'CAL'
                    ? 'bg-purple-600/20 border-purple-500 text-purple-200 shadow-sm'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="font-bold text-white">CALIDAD</div>
                  <div className="text-[10px] text-purple-400">Sector Cal</div>
                </div>
                {sector === 'CAL' && <Check className="w-4 h-4 text-purple-400" />}
              </button>
            </div>
          </div>

          {/* Días Totales / Antigüedad */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-blue-400" />
                <span>Días de Vacaciones Anuales (Antigüedad)</span>
              </div>
              <span className="text-xs text-blue-400 font-mono font-bold">{totalDays} días totales</span>
            </label>

            {/* Presets based on labor law seniority */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {SENIORITY_PRESETS.map((preset) => (
                <button
                  type="button"
                  key={preset.days}
                  onClick={() => handlePresetSelect(preset.days)}
                  className={`py-2 px-2.5 rounded-xl border text-center transition-all ${
                    totalDays === preset.days
                      ? 'bg-blue-600 border-blue-500 text-white shadow-md'
                      : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white'
                  }`}
                >
                  <div className="text-xs font-bold">{preset.label}</div>
                  <div className={`text-[10px] ${totalDays === preset.days ? 'text-blue-100' : 'text-slate-500'}`}>
                    {preset.desc}
                  </div>
                </button>
              ))}
            </div>

            {/* Direct numeric input for custom days */}
            <div className="pt-1 flex items-center gap-3">
              <span className="text-xs text-slate-400 whitespace-nowrap">O especificar cantidad:</span>
              <div className="relative flex-1">
                <input
                  type="number"
                  min={1}
                  max={60}
                  value={customDays}
                  onChange={(e) => handleCustomDaysChange(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 focus:border-blue-500 rounded-lg text-white text-xs font-mono focus:outline-none"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500 font-mono">
                  días
                </span>
              </div>
            </div>
          </div>

          {/* Real-time balance preview */}
          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 text-xs space-y-1.5">
            <div className="flex items-center justify-between text-slate-400">
              <span>Días asignados por antigüedad:</span>
              <span className="font-mono font-bold text-white">{totalDays} días</span>
            </div>
            {isEditing && (
              <div className="flex items-center justify-between text-slate-400">
                <span>Días ya aprobados este ciclo:</span>
                <span className="font-mono text-emerald-400 font-bold">{currentApproved} días</span>
              </div>
            )}
            <div className="flex items-center justify-between pt-1 border-t border-slate-800/80">
              <span className="font-semibold text-slate-200">Días que quedarán disponibles:</span>
              <span className="font-mono text-sm font-bold text-blue-400">{liveAvailable} días</span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-4 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white text-xs font-semibold transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="py-2.5 px-5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-lg shadow-blue-900/30 flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <Check className="w-4 h-4" />
              <span>{isEditing ? 'Guardar Modificaciones' : 'Incorporar a la Dotación'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
