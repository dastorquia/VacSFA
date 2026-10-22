import React from 'react';
import { 
  Calendar, 
  CheckCircle2, 
  Users, 
  Settings, 
  Plus, 
  Printer, 
  Download, 
  HardHat, 
  ShieldCheck, 
  Lock, 
  UserCircle2 
} from 'lucide-react';
import { UserRole, Employee } from '../types';

interface HeaderProps {
  activeTab: 'calendar' | 'inbox' | 'employees' | 'rules';
  setActiveTab: (tab: 'calendar' | 'inbox' | 'employees' | 'rules') => void;
  onOpenNewRequest: () => void;
  pendingApprovalsCount: number;
  onOpenConfig: () => void;
  onOpenPrint: () => void;
  onExportCsv: () => void;
  userRole: UserRole;
  onRequestSupervisorAccess: () => void;
  onSwitchToOperator: () => void;
  employees: Employee[];
  activeOperatorId: string | null;
  onSelectActiveOperator: (id: string | null) => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onOpenNewRequest,
  pendingApprovalsCount,
  onOpenPrint,
  onExportCsv,
  userRole,
  onRequestSupervisorAccess,
  onSwitchToOperator,
  employees,
  activeOperatorId,
  onSelectActiveOperator,
}) => {
  const isSupervisor = userRole === 'SUPERVISOR';
  const activeOperator = employees.find((e) => e.id === activeOperatorId);

  return (
    <header className="border-b border-slate-800 bg-slate-900/95 backdrop-blur sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-3 h-16">
          {/* Zone 1: Wordmark & Role Indicator */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold text-xs tracking-wider">
              SFA
            </div>
            <div className="flex flex-col">
              <span className="text-base font-bold text-white tracking-tight whitespace-nowrap flex items-center gap-2">
                <span>VacSFA</span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider border ${
                    isSupervisor
                      ? 'bg-indigo-950/80 text-indigo-300 border-indigo-700/60'
                      : 'bg-sky-950/80 text-sky-300 border-sky-700/60'
                  }`}
                >
                  {isSupervisor ? '🛡️ Supervisor' : '👷 Operador'}
                </span>
              </span>
              <span className="text-[11px] text-slate-400 whitespace-nowrap font-medium hidden sm:inline">
                Gestión de Vacaciones de Planta SFA
              </span>
            </div>
          </div>

          {/* Zone 2: Navigation tabs (Filtered according to role) */}
          <nav className="hidden md:flex items-center gap-1 p-1 bg-slate-800/80 rounded-lg border border-slate-700/60">
            <button
              onClick={() => setActiveTab('calendar')}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'calendar'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>{isSupervisor ? 'Calendario Compartido' : 'Calendario de Aprobadas'}</span>
            </button>

            {/* Inbox & Approval: EXCLUSIVE TO SUPERVISOR */}
            {isSupervisor && (
              <button
                onClick={() => setActiveTab('inbox')}
                className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 relative ${
                  activeTab === 'inbox'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Revisión y Aprobación</span>
                {pendingApprovalsCount > 0 && (
                  <span className="ml-1 px-1.5 py-0.2 text-[10px] font-bold rounded-full bg-amber-500 text-slate-950 font-mono">
                    {pendingApprovalsCount}
                  </span>
                )}
              </button>
            )}

            <button
              onClick={() => setActiveTab('employees')}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'employees'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>{isSupervisor ? 'Dotación y Empleados' : 'Consultar Días'}</span>
            </button>

            {/* Plant Rules: EXCLUSIVE TO SUPERVISOR */}
            {isSupervisor && (
              <button
                onClick={() => setActiveTab('rules')}
                className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  activeTab === 'rules'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                <Settings className="w-3.5 h-3.5" />
                <span>Reglas de Planta</span>
              </button>
            )}
          </nav>

          {/* Zone 3: Operator Selection & Role Switcher & Primary Action */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Operator Identifier (when in Operador mode) */}
            {!isSupervisor && (
              <div className="hidden xl:flex items-center gap-1.5 bg-slate-800/90 border border-slate-700 rounded-lg px-2.5 py-1 text-xs">
                <UserCircle2 className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                <span className="text-slate-400 text-[11px]">Operario:</span>
                <select
                  value={activeOperatorId || ''}
                  onChange={(e) => onSelectActiveOperator(e.target.value || null)}
                  className="bg-transparent text-white text-xs font-semibold focus:outline-none cursor-pointer max-w-[140px] truncate"
                >
                  <option value="" className="bg-slate-900 text-slate-300">
                    Todos / General
                  </option>
                  <optgroup label="Producción (PROD)" className="bg-slate-900 text-sky-400 font-bold">
                    {employees
                      .filter((e) => e.sector === 'PROD')
                      .map((e) => (
                        <option key={e.id} value={e.id} className="bg-slate-900 text-white font-normal">
                          {e.name}
                        </option>
                      ))}
                  </optgroup>
                  <optgroup label="Carga y Descarga (CYD)" className="bg-slate-900 text-emerald-400 font-bold">
                    {employees
                      .filter((e) => e.sector === 'CYD')
                      .map((e) => (
                        <option key={e.id} value={e.id} className="bg-slate-900 text-white font-normal">
                          {e.name}
                        </option>
                      ))}
                  </optgroup>
                </select>
              </div>
            )}

            {/* Quick Role Switcher Button */}
            {isSupervisor ? (
              <button
                onClick={onSwitchToOperator}
                title="Cambiar al modo Operador de Planta (solo vista de aprobadas y creación de solicitudes)"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition-colors"
              >
                <HardHat className="w-3.5 h-3.5 text-sky-400" />
                <span className="hidden sm:inline">Cambiar a</span>
                <span>Operador</span>
              </button>
            ) : (
              <button
                onClick={onRequestSupervisorAccess}
                title="Acceder a funciones de Supervisión (requiere PIN)"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-950/70 hover:bg-indigo-900/80 border border-indigo-700/50 text-indigo-300 hover:text-white text-xs font-semibold transition-all shadow-sm"
              >
                <Lock className="w-3.5 h-3.5 text-indigo-400" />
                <span className="hidden sm:inline">Modo</span>
                <span>Supervisor</span>
              </button>
            )}

            {/* Supervisor tools: CSV & Print */}
            {isSupervisor && (
              <>
                <button
                  onClick={onExportCsv}
                  title="Descargar reporte en formato CSV"
                  className="hidden lg:flex items-center gap-1.5 px-2.5 py-2 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 hover:text-white rounded-lg border border-slate-700 transition-colors whitespace-nowrap"
                >
                  <Download className="w-3.5 h-3.5 text-slate-400" />
                  <span>CSV</span>
                </button>

                <button
                  onClick={onOpenPrint}
                  title="Imprimir parte semanal para planta"
                  className="hidden sm:flex items-center gap-1.5 px-2.5 py-2 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 hover:text-white rounded-lg border border-slate-700 transition-colors whitespace-nowrap"
                >
                  <Printer className="w-3.5 h-3.5 text-slate-400" />
                  <span>Parte Semanal</span>
                </button>
              </>
            )}

            {/* Primary Action Button */}
            <button
              onClick={onOpenNewRequest}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-sm transition-all shadow-blue-900/30 whitespace-nowrap shrink-0 active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Solicitar Vacaciones</span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation bar */}
        <div className="flex md:hidden items-center justify-around py-2 border-t border-slate-800/80 gap-1 overflow-x-auto">
          <button
            onClick={() => setActiveTab('calendar')}
            className={`px-3 py-1.5 text-xs font-medium rounded whitespace-nowrap ${
              activeTab === 'calendar' ? 'bg-blue-600 text-white' : 'text-slate-400'
            }`}
          >
            {isSupervisor ? 'Calendario' : 'Aprobadas'}
          </button>

          {isSupervisor && (
            <button
              onClick={() => setActiveTab('inbox')}
              className={`px-3 py-1.5 text-xs font-medium rounded whitespace-nowrap flex items-center gap-1 ${
                activeTab === 'inbox' ? 'bg-blue-600 text-white' : 'text-slate-400'
              }`}
            >
              Aprobación
              {pendingApprovalsCount > 0 && (
                <span className="px-1 text-[10px] rounded-full bg-amber-500 text-slate-950 font-bold">
                  {pendingApprovalsCount}
                </span>
              )}
            </button>
          )}

          <button
            onClick={() => setActiveTab('employees')}
            className={`px-3 py-1.5 text-xs font-medium rounded whitespace-nowrap ${
              activeTab === 'employees' ? 'bg-blue-600 text-white' : 'text-slate-400'
            }`}
          >
            {isSupervisor ? 'Empleados' : 'Mis Días'}
          </button>

          {isSupervisor && (
            <button
              onClick={() => setActiveTab('rules')}
              className={`px-3 py-1.5 text-xs font-medium rounded whitespace-nowrap ${
                activeTab === 'rules' ? 'bg-blue-600 text-white' : 'text-slate-400'
              }`}
            >
              Reglas
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
