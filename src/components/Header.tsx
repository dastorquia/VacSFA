import React, { useState, useRef, useEffect } from 'react';
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
  UserCircle2,
  MoreVertical,
  ChevronDown
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
  onOpenBackup?: () => void;
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
  onOpenBackup,
}) => {
  const isSupervisor = userRole === 'SUPERVISOR';
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdown menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        setIsMobileMenuOpen(false);
      }
    };
    if (isMobileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMobileMenuOpen]);

  return (
    <header className="border-b border-slate-800 bg-slate-900/95 backdrop-blur sticky top-0 z-40 w-full">
      <div className="max-w-7xl mx-auto px-2.5 sm:px-4 lg:px-6">
        {/* Main Header Row */}
        <div className="flex items-center justify-between gap-1.5 sm:gap-3 h-14 sm:h-16">
          
          {/* Zone 1: Branding & Role Pill */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0 min-w-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold text-xs tracking-wider shrink-0">
              SFA
            </div>
            
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="text-sm sm:text-base font-bold text-white tracking-tight shrink-0">
                  VacSFA
                </span>
                
                {/* Role Pill */}
                <span
                  className={`text-[9px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded-full uppercase tracking-wider border shrink-0 ${
                    isSupervisor
                      ? 'bg-indigo-950/80 text-indigo-300 border-indigo-700/60'
                      : 'bg-sky-950/80 text-sky-300 border-sky-700/60'
                  }`}
                >
                  {isSupervisor ? (
                    <>
                      <span className="sm:hidden">🛡️ Sup</span>
                      <span className="hidden sm:inline">🛡️ Supervisor</span>
                    </>
                  ) : (
                    <>
                      <span className="sm:hidden">👷 Colab</span>
                      <span className="hidden sm:inline">👷 Colaborador</span>
                    </>
                  )}
                </span>

                {/* Live Real-time Cloud Indicator Dot */}
                <span 
                  className="inline-flex items-center gap-1 text-[9px] sm:text-[10px] text-emerald-400 font-mono ml-0.5" 
                  title="Sincronizado en tiempo real con Firebase Firestore"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="hidden lg:inline text-slate-400 font-sans text-[10px]">En vivo</span>
                </span>
              </div>

              {/* Subtitle (only visible on 2XL screens to preserve horizontal space) */}
              <div className="hidden 2xl:flex items-center gap-1 text-[11px] text-slate-400 font-medium truncate">
                <span>Gestión de Vacaciones de Planta SFA</span>
              </div>
            </div>
          </div>

          {/* Zone 2: Navigation Tabs (Desktop / Tablet) */}
          <nav className="hidden md:flex items-center gap-0.5 lg:gap-1 p-1 bg-slate-800/80 rounded-lg border border-slate-700/60 shrink-0">
            <button
              onClick={() => setActiveTab('calendar')}
              className={`flex items-center gap-1.5 px-2.5 lg:px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                activeTab === 'calendar'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Calendario</span>
              <span className="hidden xl:inline text-slate-300 font-normal">
                {isSupervisor ? ' Compartido' : ''}
              </span>
            </button>

            {/* Inbox & Approval: EXCLUSIVE TO SUPERVISOR */}
            {isSupervisor && (
              <button
                onClick={() => setActiveTab('inbox')}
                className={`flex items-center gap-1.5 px-2.5 lg:px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap relative ${
                  activeTab === 'inbox'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Aprobaciones</span>
                {pendingApprovalsCount > 0 && (
                  <span className="ml-1 px-1.5 py-0.2 text-[10px] font-bold rounded-full bg-amber-500 text-slate-950 font-mono">
                    {pendingApprovalsCount}
                  </span>
                )}
              </button>
            )}

            <button
              onClick={() => setActiveTab('employees')}
              className={`flex items-center gap-1.5 px-2.5 lg:px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                activeTab === 'employees'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>{isSupervisor ? 'Dotación' : 'Mis Días'}</span>
              {isSupervisor && (
                <span className="hidden xl:inline text-slate-300 font-normal">
                  {' y Personal'}
                </span>
              )}
            </button>

            {/* Plant Rules: EXCLUSIVE TO SUPERVISOR */}
            {isSupervisor && (
              <button
                onClick={() => setActiveTab('rules')}
                className={`flex items-center gap-1.5 px-2.5 lg:px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                  activeTab === 'rules'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                <Settings className="w-3.5 h-3.5" />
                <span>Reglas</span>
                <span className="hidden xl:inline text-slate-300 font-normal">
                  {' de Planta'}
                </span>
              </button>
            )}
          </nav>

          {/* Zone 3: Actions & Role Switching */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Colaborador active selection (Desktop, when in Colaborador mode) */}
            {!isSupervisor && (
              <div className="hidden lg:flex items-center gap-1 bg-slate-800/90 border border-slate-700 rounded-lg px-2 py-1 text-xs">
                <UserCircle2 className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                <span className="text-slate-400 text-[11px] hidden xl:inline">Colaborador:</span>
                <select
                  value={activeOperatorId || ''}
                  onChange={(e) => onSelectActiveOperator(e.target.value || null)}
                  className="bg-transparent text-white text-xs font-semibold focus:outline-none cursor-pointer max-w-[120px] xl:max-w-[150px] truncate"
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
                  <optgroup label="Mantenimiento (MANT)" className="bg-slate-900 text-amber-400 font-bold">
                    {employees
                      .filter((e) => e.sector === 'MANT')
                      .map((e) => (
                        <option key={e.id} value={e.id} className="bg-slate-900 text-white font-normal">
                          {e.name}
                        </option>
                      ))}
                  </optgroup>
                  <optgroup label="Calidad (Cal)" className="bg-slate-900 text-purple-400 font-bold">
                    {employees
                      .filter((e) => e.sector === 'CAL')
                      .map((e) => (
                        <option key={e.id} value={e.id} className="bg-slate-900 text-white font-normal">
                          {e.name}
                        </option>
                      ))}
                  </optgroup>
                </select>
              </div>
            )}

            {/* Role Switcher Button */}
            {isSupervisor ? (
              <button
                onClick={onSwitchToOperator}
                title="Cambiar al modo Colaborador (solo vista de aprobadas y creación de solicitudes)"
                className="flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition-colors shrink-0"
              >
                <HardHat className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                <span className="hidden sm:inline">Modo </span>
                <span className="hidden md:inline">Colaborador</span>
              </button>
            ) : (
              <button
                onClick={onRequestSupervisorAccess}
                title="Acceder a funciones de Supervisión (requiere PIN)"
                className="flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-lg bg-indigo-950/70 hover:bg-indigo-900/80 border border-indigo-700/50 text-indigo-300 hover:text-white text-xs font-semibold transition-all shadow-sm shrink-0"
              >
                <Lock className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <span className="hidden sm:inline">Modo </span>
                <span className="hidden md:inline">Supervisor</span>
              </button>
            )}

            {/* Desktop Supervisor Tools: CSV & Print */}
            {isSupervisor && (
              <div className="hidden lg:flex items-center gap-1 shrink-0">
                <button
                  onClick={onExportCsv}
                  title="Descargar reporte en formato CSV"
                  className="flex items-center gap-1 px-2 py-1.5 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 hover:text-white rounded-lg border border-slate-700 transition-colors whitespace-nowrap"
                >
                  <Download className="w-3.5 h-3.5 text-slate-400" />
                  <span>CSV</span>
                </button>

                <button
                  onClick={onOpenPrint}
                  title="Imprimir parte semanal para planta"
                  className="flex items-center gap-1 px-2 py-1.5 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 hover:text-white rounded-lg border border-slate-700 transition-colors whitespace-nowrap"
                >
                  <Printer className="w-3.5 h-3.5 text-slate-400" />
                  <span>Parte</span>
                  <span className="hidden xl:inline"> Semanal</span>
                </button>
              </div>
            )}

            {/* Mobile / Compact Menu for Supervisor Extra Tools */}
            {isSupervisor && (
              <div className="relative lg:hidden" ref={mobileMenuRef}>
                <button
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  title="Más herramientas de supervisión"
                  className="p-1.5 text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>

                {isMobileMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl py-1 z-50 text-xs">
                    <button
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        onExportCsv();
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-slate-200 hover:bg-slate-800 hover:text-white text-left transition-colors"
                    >
                      <Download className="w-4 h-4 text-blue-400" />
                      <span>Descargar CSV</span>
                    </button>
                    <button
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        onOpenPrint();
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-slate-200 hover:bg-slate-800 hover:text-white text-left transition-colors"
                    >
                      <Printer className="w-4 h-4 text-emerald-400" />
                      <span>Parte Semanal</span>
                    </button>
                    <button
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        setActiveTab('rules');
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-slate-200 hover:bg-slate-800 hover:text-white text-left transition-colors"
                    >
                      <Settings className="w-4 h-4 text-purple-400" />
                      <span>Reglas de Planta</span>
                    </button>
                    {onOpenBackup && (
                      <button
                        onClick={() => {
                          setIsMobileMenuOpen(false);
                          onOpenBackup();
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-slate-200 hover:bg-slate-800 hover:text-white text-left transition-colors border-t border-slate-800 mt-1 pt-1.5"
                      >
                        <ShieldCheck className="w-4 h-4 text-emerald-400" />
                        <span>Respaldo y Privacidad</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Primary Action Button: Always Visible & Distinctive */}
            <button
              onClick={onOpenNewRequest}
              className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-1.5 sm:py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-sm transition-all shadow-blue-900/30 whitespace-nowrap shrink-0 active:scale-95"
            >
              <Plus className="w-4 h-4 shrink-0" />
              <span>Solicitar</span>
              <span className="hidden sm:inline"> Vacaciones</span>
            </button>
          </div>
        </div>

        {/* Mobile Colaborador Selector (when on mobile & in Colaborador mode) */}
        {!isSupervisor && (
          <div className="flex lg:hidden items-center justify-between py-1.5 px-2 mb-1.5 bg-slate-800/80 border border-slate-700/70 rounded-lg text-xs">
            <div className="flex items-center gap-1.5 text-slate-300">
              <UserCircle2 className="w-4 h-4 text-sky-400 shrink-0" />
              <span className="text-[11px] text-slate-400">Viendo como:</span>
            </div>
            <select
              value={activeOperatorId || ''}
              onChange={(e) => onSelectActiveOperator(e.target.value || null)}
              className="bg-slate-900 text-white text-xs font-semibold px-2 py-1 rounded border border-slate-700 focus:outline-none cursor-pointer max-w-[190px] truncate"
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
              <optgroup label="Mantenimiento (MANT)" className="bg-slate-900 text-amber-400 font-bold">
                {employees
                  .filter((e) => e.sector === 'MANT')
                  .map((e) => (
                    <option key={e.id} value={e.id} className="bg-slate-900 text-white font-normal">
                      {e.name}
                    </option>
                  ))}
              </optgroup>
              <optgroup label="Calidad (Cal)" className="bg-slate-900 text-purple-400 font-bold">
                {employees
                  .filter((e) => e.sector === 'CAL')
                  .map((e) => (
                    <option key={e.id} value={e.id} className="bg-slate-900 text-white font-normal">
                      {e.name}
                    </option>
                  ))}
              </optgroup>
            </select>
          </div>
        )}

        {/* Mobile Navigation Bar */}
        <div className="flex md:hidden items-center justify-around py-1.5 border-t border-slate-800/80 gap-1 overflow-x-auto">
          <button
            onClick={() => setActiveTab('calendar')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
              activeTab === 'calendar' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>{isSupervisor ? 'Calendario' : 'Aprobadas'}</span>
          </button>

          {isSupervisor && (
            <button
              onClick={() => setActiveTab('inbox')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors relative ${
                activeTab === 'inbox' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Aprobación</span>
              {pendingApprovalsCount > 0 && (
                <span className="px-1.5 py-0.2 text-[9px] rounded-full bg-amber-500 text-slate-950 font-bold font-mono">
                  {pendingApprovalsCount}
                </span>
              )}
            </button>
          )}

          <button
            onClick={() => setActiveTab('employees')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
              activeTab === 'employees' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>{isSupervisor ? 'Dotación' : 'Mis Días'}</span>
          </button>

          {isSupervisor && (
            <button
              onClick={() => setActiveTab('rules')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
                activeTab === 'rules' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Reglas</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
