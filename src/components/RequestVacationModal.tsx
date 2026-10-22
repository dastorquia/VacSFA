import React, { useState, useMemo, useEffect } from 'react';
import { 
  X, 
  Calendar, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Sparkles, 
  ArrowRight,
  ShieldAlert,
  Info
} from 'lucide-react';
import { Employee, PlantConfig, VacationRequest } from '../types';
import { 
  isMonday, 
  getNextOrCurrentMonday, 
  calculateEndDate, 
  calculateReturnDate, 
  formatDisplayDate, 
  formatLocalDate,
  getEmployeeBalance,
  evaluateVacationRequest 
} from '../utils/vacationEngine';

interface RequestVacationModalProps {
  isOpen: boolean;
  onClose: () => void;
  employees: Employee[];
  existingRequests: VacationRequest[];
  config: PlantConfig;
  preselectedEmployee?: Employee | null;
  onSubmitRequest: (newRequest: VacationRequest) => void;
}

export const RequestVacationModal: React.FC<RequestVacationModalProps> = ({
  isOpen,
  onClose,
  employees,
  existingRequests,
  config,
  preselectedEmployee,
  onSubmitRequest,
}) => {
  // State
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [days, setDays] = useState<number>(7);

  // Initialize form when opened
  useEffect(() => {
    if (isOpen) {
      const defaultEmp = preselectedEmployee || employees[0];
      if (defaultEmp) {
        setSelectedEmployeeId(defaultEmp.id);
      }
      
      // Default to next Monday
      const today = new Date();
      const nextMon = getNextOrCurrentMonday(formatLocalDate(today));
      setStartDate(nextMon);
      setDays(7);
    }
  }, [isOpen, preselectedEmployee, employees]);

  const selectedEmployee = useMemo(() => {
    return employees.find((e) => e.id === selectedEmployeeId);
  }, [employees, selectedEmployeeId]);

  // Balance calculation
  const balance = useMemo(() => {
    if (!selectedEmployee) return null;
    return getEmployeeBalance(selectedEmployee, existingRequests);
  }, [selectedEmployee, existingRequests]);

  // Live checks
  const isStartMon = useMemo(() => isMonday(startDate), [startDate]);
  const endDate = useMemo(() => calculateEndDate(startDate, days), [startDate, days]);
  const returnDate = useMemo(() => calculateReturnDate(startDate, days), [startDate, days]);

  // Live evaluation by the automated engine
  const liveVerdict = useMemo(() => {
    if (!selectedEmployee || !startDate) return null;
    return evaluateVacationRequest(
      selectedEmployee,
      startDate,
      days,
      config,
      existingRequests
    );
  }, [selectedEmployee, startDate, days, config, existingRequests]);

  if (!isOpen) return null;

  const handleFixMonday = () => {
    if (!startDate) return;
    setStartDate(getNextOrCurrentMonday(startDate));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployee || !startDate || !liveVerdict) return;

    // Build the request
    const newReq: VacationRequest = {
      id: `req-${Date.now()}`,
      employeeId: selectedEmployee.id,
      employeeName: selectedEmployee.name,
      sector: selectedEmployee.sector,
      startDate,
      endDate,
      days,
      status: liveVerdict.status,
      requestedAt: new Date().toISOString(),
      resolutionNote: liveVerdict.summary,
      automatedLog: liveVerdict,
    };

    onSubmitRequest(newReq);
    onClose();
  };

  const isFormValid = liveVerdict && liveVerdict.status !== 'RECHAZADA_AUTO';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center font-bold">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Solicitar Vacaciones en Planta</h2>
              <p className="text-xs text-slate-400">
                Reglas obligatorias: Inicio en lunes, múltiplos de 7 y sin coincidencia en el mismo sector
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Step 1: Select Employee */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
              1. Seleccionar Operario
            </label>
            <select
              value={selectedEmployeeId}
              onChange={(e) => setSelectedEmployeeId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-blue-500"
            >
              <optgroup label="Sector PRODUCCIÓN (PROD)">
                {employees
                  .filter((e) => e.sector === 'PROD')
                  .map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.name}
                    </option>
                  ))}
              </optgroup>
              <optgroup label="Sector CARGA Y DESCARGA (CYD)">
                {employees
                  .filter((e) => e.sector === 'CYD')
                  .map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.name}
                    </option>
                  ))}
              </optgroup>
            </select>

            {/* Employee balance card */}
            {selectedEmployee && balance && (
              <div className="bg-slate-800/60 border border-slate-700/60 rounded-lg p-3 text-xs flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      selectedEmployee.sector === 'PROD'
                        ? 'bg-sky-500/20 text-sky-300'
                        : 'bg-emerald-500/20 text-emerald-300'
                    }`}
                  >
                    Sector {selectedEmployee.sector}
                  </span>
                  <span className="text-slate-300 font-medium">{selectedEmployee.name}</span>
                </div>
                <div className="flex items-center gap-3 font-mono text-slate-300">
                  <span>Asignados: <strong className="text-white">{balance.totalDays}d</strong></span>
                  <span aria-hidden="true">·</span>
                  <span>Tomados: <strong className="text-slate-400">{balance.approvedDays}d</strong></span>
                  <span aria-hidden="true">·</span>
                  <span>
                    Disponibles: <strong className="text-blue-400 font-bold">{balance.remainingDays}d</strong>
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Step 2: Start Date (Strictly Mondays) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
                2. Fecha de Inicio (Obligatorio: Día Lunes)
              </label>
              {!isStartMon && startDate && (
                <button
                  type="button"
                  onClick={handleFixMonday}
                  className="text-xs font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Corregir a próximo lunes
                </button>
              )}
            </div>

            <div className="relative">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className={`w-full px-3.5 py-2.5 bg-slate-800 border rounded-lg text-sm text-slate-100 focus:outline-none ${
                  isStartMon
                    ? 'border-emerald-500/60 focus:border-emerald-500'
                    : 'border-amber-500 focus:border-amber-500'
                }`}
              />
            </div>

            {/* Validation warning or confirmation for Monday */}
            {startDate && (
              <div
                className={`text-xs p-2.5 rounded-lg flex items-center justify-between gap-2 ${
                  isStartMon
                    ? 'bg-emerald-950/40 text-emerald-300 border border-emerald-800/50'
                    : 'bg-amber-950/40 text-amber-300 border border-amber-800/50'
                }`}
              >
                <div className="flex items-center gap-2">
                  {isStartMon ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                  )}
                  <span>
                    {isStartMon
                      ? `Válido: Comienza el lunes ${formatDisplayDate(startDate)}.`
                      : `Atención: La fecha seleccionada no es lunes. Las vacaciones deben comenzar en lunes según normativa.`}
                  </span>
                </div>
                {!isStartMon && (
                  <button
                    type="button"
                    onClick={handleFixMonday}
                    className="px-2 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 rounded font-medium text-[11px] whitespace-nowrap"
                  >
                    Ajustar
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Step 3: Duration (Strictly Multiples of 7) */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
              3. Cantidad de Días (Múltiplos de 7)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[7, 14, 21, 28].map((optionDays) => {
                const weeksCount = optionDays / 7;
                const isAvailable = balance ? optionDays <= balance.remainingDays : true;
                const isSelected = days === optionDays;

                return (
                  <button
                    key={optionDays}
                    type="button"
                    disabled={!isAvailable}
                    onClick={() => setDays(optionDays)}
                    className={`p-3 rounded-lg border text-left transition-all ${
                      isSelected
                        ? 'bg-blue-600 border-blue-500 text-white shadow-md'
                        : isAvailable
                        ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-750'
                        : 'bg-slate-850/50 border-slate-800 text-slate-600 cursor-not-allowed'
                    }`}
                  >
                    <div className="text-sm font-bold font-mono">{optionDays} Días</div>
                    <div className="text-[11px] opacity-80">
                      {weeksCount} {weeksCount === 1 ? 'semana' : 'semanas'}
                    </div>
                    {!isAvailable && (
                      <div className="text-[9px] text-rose-400 mt-1">Excede saldo</div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Calculated period details */}
            <div className="bg-slate-850 p-3 rounded-lg border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div>
                <span className="text-slate-400">Período de Vacaciones:</span>{' '}
                <strong className="text-slate-200 font-mono">
                  {formatDisplayDate(startDate)}
                </strong>{' '}
                al{' '}
                <strong className="text-slate-200 font-mono">
                  {formatDisplayDate(endDate)}
                </strong>{' '}
                <span className="text-slate-400">({days} días)</span>
              </div>
              <div>
                <span className="text-slate-400">Reincorporación a Planta:</span>{' '}
                <strong className="text-emerald-400 font-mono">
                  Lunes {formatDisplayDate(returnDate)}
                </strong>
              </div>
            </div>
          </div>

          {/* Step 4: AUDITORÍA DEL MOTOR & MARCA TEMPORAL */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                <span>Auditoría del Motor y Prioridad Temporal</span>
              </label>
              <span className="text-[11px] text-slate-400 font-mono">
                Registra día y hora exactos
              </span>
            </div>

            {liveVerdict && (
              <div
                className={`p-4 rounded-xl border ${
                  liveVerdict.status === 'PENDIENTE_REVISION'
                    ? 'bg-blue-950/30 border-blue-500/40'
                    : liveVerdict.status === 'PENDIENTE_CONFLICTO' || liveVerdict.status === 'PENDIENTE_CUPO'
                    ? 'bg-amber-950/30 border-amber-500/40'
                    : 'bg-rose-950/30 border-rose-500/40'
                }`}
              >
                {/* Result header */}
                <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    {liveVerdict.status === 'PENDIENTE_REVISION' && (
                      <CheckCircle2 className="w-5 h-5 text-blue-400" />
                    )}
                    {(liveVerdict.status === 'PENDIENTE_CONFLICTO' || liveVerdict.status === 'PENDIENTE_CUPO') && (
                      <AlertTriangle className="w-5 h-5 text-amber-400" />
                    )}
                    {liveVerdict.status === 'RECHAZADA_AUTO' && (
                      <XCircle className="w-5 h-5 text-rose-400" />
                    )}
                    <span
                      className={`text-sm font-bold ${
                        liveVerdict.status === 'PENDIENTE_REVISION'
                          ? 'text-blue-300'
                          : liveVerdict.status === 'PENDIENTE_CONFLICTO' || liveVerdict.status === 'PENDIENTE_CUPO'
                          ? 'text-amber-300'
                          : 'text-rose-300'
                      }`}
                    >
                      {liveVerdict.status === 'PENDIENTE_REVISION'
                        ? 'Apta para Revisión de Supervisión (Sin Coincidencias)'
                        : liveVerdict.status === 'PENDIENTE_CONFLICTO' || liveVerdict.status === 'PENDIENTE_CUPO'
                        ? 'Coincidencia en Mismo Sector (Se dirime por Día y Hora)'
                        : 'Rechazo por Normativa Básica'}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-slate-900 text-slate-300">
                    Proceso de Revisión Previo
                  </span>
                </div>

                {/* Priority notice */}
                <div className="mt-2.5 p-2 bg-slate-900/90 rounded text-[11px] text-slate-300 border border-slate-800">
                  <span>
                    🕒 La solicitud se sellará con <strong>fecha, hora, minutos y segundos de ingreso</strong> para que el supervisor defina la prioridad en caso de coincidencia con otro operario.
                  </span>
                </div>

                {/* Rule-by-rule breakdown */}
                <div className="mt-3 space-y-2 text-xs">
                  {liveVerdict.checks.map((chk) => (
                    <div key={chk.ruleId} className="flex items-start gap-2">
                      {chk.passed ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      ) : (
                        <XCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                      )}
                      <div>
                        <span className="font-semibold text-slate-200">{chk.title}: </span>
                        <span className="text-slate-300">{chk.message}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Conflicting workers info if any */}
                {liveVerdict.conflictingEmployees && liveVerdict.conflictingEmployees.length > 0 && (
                  <div className="mt-3 p-2.5 bg-slate-900/80 rounded-lg text-xs text-slate-300 border border-amber-900/40">
                    <span className="font-semibold text-amber-300 block mb-1">
                      Operario(s) con solicitud en el mismo período ({selectedEmployee?.sector}):
                    </span>
                    <ul className="list-disc list-inside space-y-0.5 text-slate-400">
                      {liveVerdict.conflictingEmployees.map((c, i) => (
                        <li key={i}>
                          <strong className="text-slate-200">{c.name}</strong> ({c.period})
                          {c.requestedAt && (
                            <span className="text-amber-400/90 font-mono text-[11px] ml-1">
                              [Ingresó antes: {formatDisplayDate(c.requestedAt.slice(0, 10))} {c.requestedAt.slice(11, 16)} hs]
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!isFormValid}
              className={`px-5 py-2.5 rounded-lg text-xs font-bold text-white transition-all shadow-lg flex items-center gap-2 ${
                isFormValid
                  ? 'bg-blue-600 hover:bg-blue-500 shadow-blue-900/30'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              <span>Confirmar y Procesar Solicitud</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
