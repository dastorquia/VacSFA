import React, { useState } from 'react';
import { X, Printer, Calendar, Users, CheckCircle2 } from 'lucide-react';
import { Employee, PlantConfig, VacationRequest } from '../types';
import { formatDisplayDate, formatLocalDate, parseLocalDate } from '../utils/vacationEngine';

interface PrintReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  employees: Employee[];
  requests: VacationRequest[];
  config: PlantConfig;
}

export const PrintReportModal: React.FC<PrintReportModalProps> = ({
  isOpen,
  onClose,
  employees,
  requests,
  config,
}) => {
  // Target week starting Monday (default: 2026-11-09)
  const [selectedMonday, setSelectedMonday] = useState<string>('2026-11-09');

  if (!isOpen) return null;

  // Calculate Sunday of selected week
  const monDate = parseLocalDate(selectedMonday);
  const sunDate = new Date(monDate);
  sunDate.setDate(sunDate.getDate() + 6);
  const selectedSunday = formatLocalDate(sunDate);

  const monMs = monDate.getTime();
  const sunMs = sunDate.getTime();

  // Find vacations active in this week
  const activeVacations = requests.filter((r) => {
    if (r.status === 'RECHAZADA_AUTO' || r.status === 'RECHAZADA_MANUAL' || r.status === 'CANCELADA') {
      return false;
    }
    const rStart = parseLocalDate(r.startDate).getTime();
    const rEnd = parseLocalDate(r.endDate).getTime();
    return !(rEnd < monMs || rStart > sunMs);
  });

  const prodVacations = activeVacations.filter((r) => r.sector === 'PROD');
  const cydVacations = activeVacations.filter((r) => r.sector === 'CYD');
  const mantVacations = activeVacations.filter((r) => r.sector === 'MANT');
  const calVacations = activeVacations.filter((r) => r.sector === 'CAL');

  const prodActiveEmployees = employees.filter(
    (e) => e.sector === 'PROD' && !prodVacations.some((v) => v.employeeId === e.id)
  );
  const cydActiveEmployees = employees.filter(
    (e) => e.sector === 'CYD' && !cydVacations.some((v) => v.employeeId === e.id)
  );
  const mantActiveEmployees = employees.filter(
    (e) => e.sector === 'MANT' && !mantVacations.some((v) => v.employeeId === e.id)
  );
  const calActiveEmployees = employees.filter(
    (e) => e.sector === 'CAL' && !calVacations.some((v) => v.employeeId === e.id)
  );

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Modal Controls (No print) */}
        <div className="no-print flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <Printer className="w-5 h-5 text-blue-400" />
            <h2 className="text-base font-bold text-white">
              Parte Semanal de Vacaciones y Dotación de Planta
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-md"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir / Guardar PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Week Selector in Modal (No print) */}
        <div className="no-print p-4 bg-slate-850 border-b border-slate-800 flex items-center gap-4 text-xs">
          <span className="text-slate-300 font-semibold">Seleccionar Semana de Reporte:</span>
          <select
            value={selectedMonday}
            onChange={(e) => setSelectedMonday(e.target.value)}
            className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white font-mono"
          >
            {[
              '2026-11-02',
              '2026-11-09',
              '2026-11-16',
              '2026-11-23',
              '2026-11-30',
              '2026-12-07',
              '2026-12-14',
              '2026-12-21',
              '2026-12-28',
              '2027-01-04',
              '2027-01-11',
              '2027-01-18',
              '2027-01-25',
            ].map((mon) => {
              const d = parseLocalDate(mon);
              const weekNum = Math.ceil((((d.getTime() - new Date(d.getFullYear(), 0, 1).getTime()) / 86400000) + 1) / 7);
              return (
                <option key={mon} value={mon}>
                  Sem. {weekNum} · Lun {formatDisplayDate(mon)}
                </option>
              );
            })}
          </select>
        </div>

        {/* Printable Document Area */}
        <div className="p-8 bg-slate-900 print:bg-white print:text-black space-y-6">
          {/* Document Header */}
          <div className="border-b-2 border-slate-700 print:border-black pb-4 flex justify-between items-start">
            <div>
              <h1 className="text-xl font-bold text-white print:text-black tracking-tight">
                PLANTA INDUSTRIAL — PARTE SEMANAL DE VACACIONES
              </h1>
              <p className="text-xs text-slate-400 print:text-gray-600 mt-1">
                Supervisión Operativa · Producción y Carga y Descarga · RH-PV-01
              </p>
            </div>
            <div className="text-right">
              <div className="text-xs font-mono font-bold text-blue-400 print:text-black">
                Semana: {formatDisplayDate(selectedMonday)} al {formatDisplayDate(selectedSunday)}
              </div>
              <div className="text-[10px] text-slate-500 print:text-gray-500">
                Generado: {new Date().toLocaleDateString('es-ES')}
              </div>
            </div>
          </div>

          {/* Summary KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs font-mono">
            <div className="p-2.5 bg-slate-850 print:bg-gray-100 rounded border border-slate-700 print:border-gray-300">
              <div className="font-bold text-sky-400 print:text-black mb-1">
                PRODUCCIÓN (PROD)
              </div>
              <div className="text-[11px] text-slate-300 print:text-gray-700">Total: {employees.filter((e) => e.sector === 'PROD').length} colab.</div>
              <div className="text-[11px] text-slate-400">Vacaciones: {prodVacations.length}</div>
              <div className="font-bold text-emerald-400 print:text-green-700 text-[11px] mt-0.5">
                Activos: {prodActiveEmployees.length}
              </div>
            </div>

            <div className="p-2.5 bg-slate-850 print:bg-gray-100 rounded border border-slate-700 print:border-gray-300">
              <div className="font-bold text-emerald-400 print:text-black mb-1">
                CARGA Y DESCARGA (CYD)
              </div>
              <div className="text-[11px] text-slate-300 print:text-gray-700">Total: {employees.filter((e) => e.sector === 'CYD').length} colab.</div>
              <div className="text-[11px] text-slate-400">Vacaciones: {cydVacations.length}</div>
              <div className="font-bold text-emerald-400 print:text-green-700 text-[11px] mt-0.5">
                Activos: {cydActiveEmployees.length}
              </div>
            </div>

            <div className="p-2.5 bg-slate-850 print:bg-gray-100 rounded border border-slate-700 print:border-gray-300">
              <div className="font-bold text-amber-400 print:text-black mb-1">
                MANTENIMIENTO (MANT)
              </div>
              <div className="text-[11px] text-slate-300 print:text-gray-700">Total: {employees.filter((e) => e.sector === 'MANT').length} colab.</div>
              <div className="text-[11px] text-slate-400">Vacaciones: {mantVacations.length}</div>
              <div className="font-bold text-emerald-400 print:text-green-700 text-[11px] mt-0.5">
                Activos: {mantActiveEmployees.length}
              </div>
            </div>

            <div className="p-2.5 bg-slate-850 print:bg-gray-100 rounded border border-slate-700 print:border-gray-300">
              <div className="font-bold text-purple-400 print:text-black mb-1">
                CALIDAD (Cal)
              </div>
              <div className="text-[11px] text-slate-300 print:text-gray-700">Total: {employees.filter((e) => e.sector === 'CAL').length} colab.</div>
              <div className="text-[11px] text-slate-400">Vacaciones: {calVacations.length}</div>
              <div className="font-bold text-emerald-400 print:text-green-700 text-[11px] mt-0.5">
                Activos: {calActiveEmployees.length}
              </div>
            </div>
          </div>

          {/* Section: Colaboradores en Vacaciones */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-slate-300 print:text-black uppercase tracking-wider">
              1. Personal en Goce de Vacaciones (Semana {formatDisplayDate(selectedMonday)})
            </h3>
            {activeVacations.length === 0 ? (
              <div className="text-xs text-slate-400 print:text-gray-600 p-3 bg-slate-950/40 print:bg-gray-50 rounded">
                Sin ausencias de vacaciones registradas en esta semana.
              </div>
            ) : (
              <table className="w-full text-xs text-left border border-slate-800 print:border-gray-300">
                <thead className="bg-slate-800 print:bg-gray-200 font-bold">
                  <tr>
                    <th className="p-2">Colaborador</th>
                    <th className="p-2">Sector</th>
                    <th className="p-2">Período Completo</th>
                    <th className="p-2 text-right">Días</th>
                    <th className="p-2">Estado de Aprobación</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 print:divide-gray-300 font-mono">
                  {activeVacations.map((v) => (
                    <tr key={v.id}>
                      <td className="p-2 font-bold font-sans">{v.employeeName}</td>
                      <td className="p-2">{v.sector}</td>
                      <td className="p-2">
                        {formatDisplayDate(v.startDate)} al {formatDisplayDate(v.endDate)}
                      </td>
                      <td className="p-2 text-right">{v.days}d</td>
                      <td className="p-2 text-[11px]">
                        {v.status === 'APROBADA_AUTO' || v.status === 'APROBADA' || v.status === 'APROBADA_MANUAL'
                          ? 'Aprobada Oficial'
                          : 'Pendiente de Revisión'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Section: Personal Activo en Planta */}
          <div className="space-y-2 pt-2">
            <h3 className="text-xs font-bold text-slate-300 print:text-black uppercase tracking-wider">
              2. Dotación Activa en Operación de Planta ({prodActiveEmployees.length + cydActiveEmployees.length + mantActiveEmployees.length + calActiveEmployees.length} colaboradores)
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div>
                <div className="font-semibold text-sky-400 print:text-gray-700 mb-1">
                  PRODUCCIÓN ({prodActiveEmployees.length})
                </div>
                <ul className="divide-y divide-slate-800 print:divide-gray-200 border border-slate-800 print:border-gray-300 rounded p-1 max-h-48 overflow-y-auto">
                  {prodActiveEmployees.map((e) => (
                    <li key={e.id} className="py-1 px-2 font-medium truncate">
                      {e.name}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <div className="font-semibold text-emerald-400 print:text-gray-700 mb-1">
                  CARGA Y DESCARGA ({cydActiveEmployees.length})
                </div>
                <ul className="divide-y divide-slate-800 print:divide-gray-200 border border-slate-800 print:border-gray-300 rounded p-1 max-h-48 overflow-y-auto">
                  {cydActiveEmployees.map((e) => (
                    <li key={e.id} className="py-1 px-2 font-medium truncate">
                      {e.name}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <div className="font-semibold text-amber-400 print:text-gray-700 mb-1">
                  MANTENIMIENTO ({mantActiveEmployees.length})
                </div>
                <ul className="divide-y divide-slate-800 print:divide-gray-200 border border-slate-800 print:border-gray-300 rounded p-1 max-h-48 overflow-y-auto">
                  {mantActiveEmployees.map((e) => (
                    <li key={e.id} className="py-1 px-2 font-medium truncate">
                      {e.name}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <div className="font-semibold text-purple-400 print:text-gray-700 mb-1">
                  CALIDAD ({calActiveEmployees.length})
                </div>
                <ul className="divide-y divide-slate-800 print:divide-gray-200 border border-slate-800 print:border-gray-300 rounded p-1 max-h-48 overflow-y-auto">
                  {calActiveEmployees.map((e) => (
                    <li key={e.id} className="py-1 px-2 font-medium truncate">
                      {e.name}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Signatures */}
          <div className="pt-8 grid grid-cols-2 gap-8 text-center text-xs text-slate-500 print:text-gray-600">
            <div className="border-t border-slate-700 print:border-black pt-2">
              Firma Supervisor de Planta
            </div>
            <div className="border-t border-slate-700 print:border-black pt-2">
              Firma Recursos Humanos / Personal
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
