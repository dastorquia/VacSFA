import React, { useState, useMemo } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Filter, 
  Search, 
  Info, 
  CheckCircle2, 
  AlertTriangle, 
  Calendar as CalendarIcon,
  Layers,
  Sparkles,
  Clock,
  HardHat,
  ShieldCheck,
  X,
  UserCheck
} from 'lucide-react';
import { Employee, PlantConfig, SectorType, VacationRequest, UserRole } from '../types';
import { 
  formatLocalDate, 
  parseLocalDate, 
  formatDisplayDate, 
  getISOWeekNumber, 
  isStatusApproved, 
  formatExactDateTime 
} from '../utils/vacationEngine';

interface SharedCalendarProps {
  employees: Employee[];
  requests: VacationRequest[];
  config: PlantConfig;
  onSelectRequest: (req: VacationRequest) => void;
  onRequestVacationForEmployee?: (emp: Employee) => void;
  userRole: UserRole;
  activeEmployeeId?: string | null;
}

export const SharedCalendar: React.FC<SharedCalendarProps> = ({
  employees,
  requests,
  config,
  onSelectRequest,
  onRequestVacationForEmployee,
  userRole,
  activeEmployeeId,
}) => {
  const isSupervisor = userRole === 'SUPERVISOR';

  // Navigation: base date for the visible window
  const [currentDate, setCurrentDate] = useState<Date>(() => new Date(2026, 10, 1));
  const [selectedSector, setSelectedSector] = useState<'ALL' | SectorType>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'timeline' | 'month'>('timeline');
  const [operatorDetailModal, setOperatorDetailModal] = useState<VacationRequest | null>(null);

  // Filter visible requests based on role:
  // Operador: only sees APPROVED vacations (or their own pending request if activeEmployeeId matches)
  // Supervisor: sees all
  const visibleRequests = useMemo(() => {
    return requests.filter((r) => {
      if (r.status === 'RECHAZADA_AUTO' || r.status === 'RECHAZADA_MANUAL' || r.status === 'RECHAZADA' || r.status === 'CANCELADA') {
        return false;
      }
      if (!isSupervisor) {
        if (isStatusApproved(r.status)) return true;
        if (activeEmployeeId && r.employeeId === activeEmployeeId) return true;
        return false;
      }
      return true;
    });
  }, [requests, isSupervisor, activeEmployeeId]);

  // Filter employees
  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      const matchSector = selectedSector === 'ALL' || emp.sector === selectedSector;
      const matchSearch = emp.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchSector && matchSearch;
    });
  }, [employees, selectedSector, searchQuery]);

  // Generate 8 consecutive Mondays starting from current date
  const weeks = useMemo(() => {
    const list: { startMonday: Date; endSunday: Date; weekLabel: string; weekNumber: number; startIso: string; endIso: string }[] = [];
    
    const cur = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const day = cur.getDay();
    const diffToMonday = day === 0 ? -6 : 1 - day;
    cur.setDate(cur.getDate() + diffToMonday);

    for (let i = 0; i < 8; i++) {
      const startMonday = new Date(cur);
      const endSunday = new Date(cur);
      endSunday.setDate(endSunday.getDate() + 6);

      const startIso = formatLocalDate(startMonday);
      const endIso = formatLocalDate(endSunday);
      const weekNumber = getISOWeekNumber(startMonday);
      const weekLabel = `Sem. ${weekNumber}`;

      list.push({
        startMonday,
        endSunday,
        weekLabel,
        weekNumber,
        startIso,
        endIso,
      });

      cur.setDate(cur.getDate() + 7);
    }
    return list;
  }, [currentDate]);

  // Calculate sector occupancy per week
  const weekStats = useMemo(() => {
    return weeks.map((w) => {
      const wStart = w.startMonday.getTime();
      const wEnd = w.endSunday.getTime();

      const activeInWeek = visibleRequests.filter((r) => {
        const rStart = parseLocalDate(r.startDate).getTime();
        const rEnd = parseLocalDate(r.endDate).getTime();
        return !(rEnd < wStart || rStart > wEnd);
      });

      const prodCount = activeInWeek.filter((r) => r.sector === 'PROD').length;
      const cydCount = activeInWeek.filter((r) => r.sector === 'CYD').length;

      return {
        prodCount,
        cydCount,
        prodOverlimit: prodCount > config.maxSimultaneousProd,
        cydOverlimit: cydCount > config.maxSimultaneousCyd,
        prodAtLimit: prodCount === config.maxSimultaneousProd,
        cydAtLimit: cydCount === config.maxSimultaneousCyd,
      };
    });
  }, [weeks, visibleRequests, config]);

  const handlePrev = () => {
    const next = new Date(currentDate);
    next.setMonth(next.getMonth() - 1);
    setCurrentDate(next);
  };

  const handleNext = () => {
    const next = new Date(currentDate);
    next.setMonth(next.getMonth() + 1);
    setCurrentDate(next);
  };

  const monthYearLabel = currentDate.toLocaleDateString('es-ES', {
    month: 'long',
    year: 'numeric',
  });

  const handleRequestClick = (req: VacationRequest) => {
    if (isSupervisor) {
      onSelectRequest(req);
    } else {
      setOperatorDetailModal(req);
    }
  };

  return (
    <div className="space-y-4">
      {/* Role Banner */}
      <div
        className={`p-3 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs ${
          isSupervisor
            ? 'bg-indigo-950/40 border-indigo-800/50 text-indigo-200'
            : 'bg-sky-950/40 border-sky-800/50 text-sky-200'
        }`}
      >
        <div className="flex items-center gap-2.5">
          {isSupervisor ? (
            <ShieldCheck className="w-5 h-5 text-indigo-400 shrink-0" />
          ) : (
            <HardHat className="w-5 h-5 text-sky-400 shrink-0" />
          )}
          <div>
            <div className="font-bold text-white flex items-center gap-2">
              <span>{isSupervisor ? 'Modo Supervisor Activo' : 'Modo Operador Activo'}</span>
              <span className="text-[10px] font-normal px-2 py-0.5 rounded bg-slate-900 border border-slate-700">
                {isSupervisor ? 'Control total y resolución' : 'Visualización de vacaciones aprobadas'}
              </span>
            </div>
            <p className="text-[11px] text-slate-300 mt-0.5">
              {isSupervisor
                ? 'Visualizando solicitudes aprobadas y en proceso de revisión previa. Puedes aprobar, rechazar o resolver conflictos.'
                : 'Estás consultando el calendario oficial de vacaciones ya aprobadas de la planta. Úsalo para planificar fechas con cupo disponible.'}
            </p>
          </div>
        </div>

        {!isSupervisor && (
          <div className="text-[11px] text-sky-300/90 bg-sky-900/30 px-3 py-1.5 rounded-lg border border-sky-700/40 font-medium">
            Solo lectura · Aprobación restringida a Supervisores
          </div>
        )}
      </div>

      {/* Top Controls & Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
        <div className="flex flex-wrap items-center gap-3">
          {/* Sector Filter Tabs */}
          <div className="flex items-center gap-1 p-1 bg-slate-800 rounded-lg border border-slate-700/60">
            <button
              onClick={() => setSelectedSector('ALL')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                selectedSector === 'ALL'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Todos los Sectores
            </button>
            <button
              onClick={() => setSelectedSector('PROD')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                selectedSector === 'PROD'
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Producción (PROD)
            </button>
            <button
              onClick={() => setSelectedSector('CYD')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                selectedSector === 'CYD'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Carga y Descarga (CYD)
            </button>
          </div>

          {/* Search box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Buscar operario..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 w-44"
            />
          </div>
        </div>

        {/* Date Navigation & View Mode */}
        <div className="flex items-center justify-between md:justify-end gap-3">
          <div className="flex items-center gap-1">
            <button
              onClick={handlePrev}
              title="Período anterior"
              className="p-1.5 rounded-lg bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-300 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-semibold text-slate-200 px-3 capitalize min-w-[130px] text-center">
              {monthYearLabel}
            </span>
            <button
              onClick={handleNext}
              title="Siguiente período"
              className="p-1.5 rounded-lg bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-300 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-1 p-1 bg-slate-800 rounded-lg border border-slate-700/60">
            <button
              onClick={() => setViewMode('timeline')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                viewMode === 'timeline'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Cronograma Semanal
            </button>
            <button
              onClick={() => setViewMode('month')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                viewMode === 'month'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Mes Detallado
            </button>
          </div>
        </div>
      </div>

      {/* Operational Rules reminder banner */}
      <div className="bg-blue-950/40 border border-blue-900/50 rounded-lg px-4 py-2.5 flex flex-wrap items-center justify-between text-xs text-blue-300 gap-2">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-blue-400 shrink-0" />
          <span>
            <strong>Normativa de Planta:</strong> Vacaciones inician exclusivamente días <strong>LUNES</strong> y en múltiplos de <strong>7 días</strong>. Restricción estricta: <strong>Dos personas de un mismo sector no pueden coincidir con sus vacaciones</strong>.
          </span>
        </div>
        <div className="flex items-center gap-4 text-slate-400">
          <span>
            Cupo PROD: <strong className="text-white font-mono">{config.maxSimultaneousProd} simultáneo</strong>
          </span>
          <span aria-hidden="true">·</span>
          <span>
            Cupo CYD: <strong className="text-white font-mono">{config.maxSimultaneousCyd} simultáneo</strong>
          </span>
        </div>
      </div>

      {/* VIEW MODE 1: TIMELINE (WEEKLY GANTT) */}
      {viewMode === 'timeline' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <div className="min-w-[1050px]">
              {/* Header row with Weeks */}
              <div className="grid grid-cols-[260px_repeat(8,minmax(110px,1fr))] border-b border-slate-800 bg-slate-850">
                <div className="p-3 text-xs font-bold text-slate-300 border-r border-slate-800 flex items-center justify-between">
                  <span>Operario y Sector</span>
                  <span className="text-[10px] text-slate-500 font-normal">
                    {filteredEmployees.length} personal
                  </span>
                </div>

                {weeks.map((w, idx) => (
                  <div
                    key={w.startIso}
                    className="p-2 border-r border-slate-800 text-center flex flex-col justify-between"
                  >
                    <div>
                      <span className="text-xs font-bold text-white font-mono block">
                        {w.weekLabel}
                      </span>
                      <span className="text-[10px] text-slate-400 block font-mono">
                        Lun {formatDisplayDate(w.startIso)}
                      </span>
                    </div>
                    <div className="text-[9px] text-slate-500 border-t border-slate-800/80 mt-1 pt-1 font-mono">
                      al Dom {formatDisplayDate(w.endIso)}
                    </div>
                  </div>
                ))}
              </div>

              {/* Weekly Capacity / Sector Occupancy Row */}
              <div className="grid grid-cols-[260px_repeat(8,minmax(110px,1fr))] border-b border-slate-800 bg-slate-900/90 text-[10px]">
                <div className="p-2 border-r border-slate-800 font-bold text-slate-400 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-blue-400" />
                  <span>
                    {isSupervisor ? 'Ocupación de Planta' : 'Plazas Ocupadas (Aprobadas)'}
                  </span>
                </div>
                {weekStats.map((stat, idx) => (
                  <div
                    key={idx}
                    className="p-2 border-r border-slate-800 flex flex-col items-center justify-center gap-0.5 font-mono text-[10px]"
                  >
                    <div className="flex items-center gap-1">
                      <span className="text-slate-500">P:</span>
                      <span
                        className={`font-semibold px-1 rounded ${
                          stat.prodOverlimit
                            ? 'bg-rose-500/30 text-rose-300 font-bold'
                            : stat.prodAtLimit
                            ? 'bg-amber-500/20 text-amber-300'
                            : 'text-slate-300'
                        }`}
                        title={`PROD: ${stat.prodCount} ausentes de ${config.maxSimultaneousProd} permitidos`}
                      >
                        {stat.prodCount}/{config.maxSimultaneousProd}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-slate-500">C:</span>
                      <span
                        className={`font-semibold px-1 rounded ${
                          stat.cydOverlimit
                            ? 'bg-rose-500/30 text-rose-300 font-bold'
                            : stat.cydAtLimit
                            ? 'bg-amber-500/20 text-amber-300'
                            : 'text-slate-300'
                        }`}
                        title={`CYD: ${stat.cydCount} ausentes de ${config.maxSimultaneousCyd} permitidos`}
                      >
                        {stat.cydCount}/{config.maxSimultaneousCyd}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Rows grouped by Sector */}
              {['PROD', 'CYD'].map((sec) => {
                const sectorEmployees = filteredEmployees.filter((e) => e.sector === sec);
                if (sectorEmployees.length === 0) return null;

                return (
                  <React.Fragment key={sec}>
                    {/* Sector Header Separator */}
                    <div className="bg-slate-850/90 px-4 py-1.5 text-xs font-bold text-slate-300 border-b border-slate-800 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${sec === 'PROD' ? 'bg-sky-400' : 'bg-emerald-400'}`} />
                        <span>SECTOR {sec === 'PROD' ? 'PRODUCCIÓN (PROD)' : 'CARGA Y DESCARGA (CYD)'}</span>
                      </div>
                      <span className="text-[11px] text-slate-400 font-normal">
                        {sectorEmployees.length} operarios · Cupo simultáneo: {sec === 'PROD' ? config.maxSimultaneousProd : config.maxSimultaneousCyd} (Sin coincidencias)
                      </span>
                    </div>

                    {/* Employee Rows */}
                    {sectorEmployees.map((emp) => {
                      const empRequests = visibleRequests.filter((r) => r.employeeId === emp.id);

                      const totalApproved = requests
                        .filter((r) => r.employeeId === emp.id && isStatusApproved(r.status))
                        .reduce((acc, r) => acc + r.days, 0);

                      const remaining = Math.max(0, emp.totalDays - totalApproved);
                      const isCurrentUser = activeEmployeeId === emp.id;

                      return (
                        <div
                          key={emp.id}
                          className={`grid grid-cols-[260px_repeat(8,minmax(110px,1fr))] border-b border-slate-800/60 hover:bg-slate-800/30 transition-colors group ${
                            isCurrentUser ? 'bg-sky-950/20 ring-1 ring-inset ring-sky-500/30' : ''
                          }`}
                        >
                          {/* Employee column */}
                          <div className="p-2.5 border-r border-slate-800 flex items-center justify-between">
                            <div className="truncate pr-2">
                              <div className="text-xs font-semibold text-slate-200 truncate group-hover:text-blue-400 transition-colors flex items-center gap-1.5">
                                <span>{emp.name}</span>
                                {isCurrentUser && (
                                  <span className="text-[9px] bg-sky-500/20 text-sky-300 px-1 rounded">Tú</span>
                                )}
                              </div>
                              <div className="text-[10px] text-slate-400">
                                {emp.sector} · {emp.totalDays}d totales
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <span
                                className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-medium ${
                                  remaining === 0
                                    ? 'bg-slate-800 text-slate-500'
                                    : 'bg-blue-900/40 text-blue-300'
                                }`}
                                title={`${totalApproved} tomados de ${emp.totalDays}`}
                              >
                                {remaining}d disp.
                              </span>
                            </div>
                          </div>

                          {/* 8 Week Columns */}
                          {weeks.map((w) => {
                            const wStart = w.startMonday.getTime();
                            const wEnd = w.endSunday.getTime();

                            const matchReq = empRequests.find((r) => {
                              const rStart = parseLocalDate(r.startDate).getTime();
                              const rEnd = parseLocalDate(r.endDate).getTime();
                              return !(rEnd < wStart || rStart > wEnd);
                            });

                            if (!matchReq) {
                              return (
                                <div
                                  key={w.startIso}
                                  className="border-r border-slate-800/40 p-1 flex items-center justify-center relative hover:bg-slate-800/50 cursor-pointer group/cell"
                                  onClick={() => onRequestVacationForEmployee && onRequestVacationForEmployee(emp)}
                                  title={`Programar vacaciones para ${emp.name} iniciando el lunes ${formatDisplayDate(w.startIso)}`}
                                >
                                  <span className="text-[10px] text-slate-600 opacity-0 group-hover/cell:opacity-100 transition-opacity">
                                    + Solicitar
                                  </span>
                                </div>
                              );
                            }

                            const isApproved = isStatusApproved(matchReq.status);
                            const isConflict = matchReq.status === 'PENDIENTE_CONFLICTO' || matchReq.status === 'PENDIENTE_CUPO';
                            const isPending = matchReq.status === 'PENDIENTE_REVISION';

                            return (
                              <div
                                key={w.startIso}
                                className="border-r border-slate-800/40 p-1 flex items-center justify-center"
                              >
                                <button
                                  onClick={() => handleRequestClick(matchReq)}
                                  className={`w-full py-1.5 px-2 rounded text-[10px] font-medium transition-all text-left flex flex-col justify-center shadow-sm cursor-pointer ${
                                    isApproved
                                      ? 'bg-emerald-950/80 border border-emerald-500/40 text-emerald-200 hover:bg-emerald-900'
                                      : isConflict
                                      ? 'bg-amber-950/80 border border-amber-500/40 text-amber-200 hover:bg-amber-900'
                                      : 'bg-blue-950/80 border border-blue-500/40 text-blue-200 hover:bg-blue-900'
                                  }`}
                                  title={`${matchReq.employeeName}: ${matchReq.days} días. ${isApproved ? 'Aprobada' : 'En proceso de revisión'}`}
                                >
                                  <div className="flex items-center gap-1 font-semibold truncate">
                                    {isApproved && <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />}
                                    {isConflict && <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0" />}
                                    {isPending && <Clock className="w-3 h-3 text-blue-400 shrink-0" />}
                                    <span>{matchReq.days}d</span>
                                    <span className="text-[9px] opacity-75">
                                      ({Math.floor(matchReq.days / 7)}s)
                                    </span>
                                  </div>
                                  <span className="text-[8px] opacity-80 truncate block">
                                    {isApproved ? 'Aprobada' : 'En revisión'}
                                  </span>
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* VIEW MODE 2: MONTH VIEW */}
      {viewMode === 'month' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-xl">
          <div className="grid grid-cols-7 gap-1.5 text-center text-xs text-slate-400 font-semibold mb-2">
            <div className="p-2 bg-blue-950/40 text-blue-300 rounded border border-blue-800/40 font-bold">Lunes (Inicio Vac.)</div>
            <div className="p-2">Martes</div>
            <div className="p-2">Miércoles</div>
            <div className="p-2">Jueves</div>
            <div className="p-2">Viernes</div>
            <div className="p-2">Sábado</div>
            <div className="p-2">Domingo (Fin Período)</div>
          </div>

          <div className="grid grid-cols-7 gap-1.5">
            {Array.from({ length: 35 }).map((_, i) => {
              const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
              const dayOffset = (firstDay.getDay() + 6) % 7;
              const cellDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1 - dayOffset + i);
              const iso = formatLocalDate(cellDate);
              const isMon = cellDate.getDay() === 1;
              const isSun = cellDate.getDay() === 0;
              const isCurMonth = cellDate.getMonth() === currentDate.getMonth();

              const dayRequests = visibleRequests.filter((r) => {
                if (selectedSector !== 'ALL' && r.sector !== selectedSector) return false;
                return iso >= r.startDate && iso <= r.endDate;
              });

              return (
                <div
                  key={iso}
                  className={`min-h-[90px] p-2 rounded-lg border text-left flex flex-col justify-between transition-colors ${
                    isCurMonth ? 'bg-slate-850 border-slate-800' : 'bg-slate-900/40 border-slate-900 opacity-40'
                  } ${isMon ? 'ring-1 ring-blue-500/30' : ''}`}
                >
                  <div className="flex items-center justify-between text-xs">
                    <span
                      className={`font-mono font-bold ${
                        isMon ? 'text-blue-400' : isSun ? 'text-slate-400' : 'text-slate-300'
                      }`}
                    >
                      {cellDate.getDate()}
                    </span>
                    {isMon && (
                      <span className="text-[9px] text-blue-400 font-medium">Inicio</span>
                    )}
                  </div>

                  <div className="space-y-1 my-1 overflow-y-auto max-h-[70px]">
                    {dayRequests.map((req) => (
                      <div
                        key={req.id}
                        onClick={() => handleRequestClick(req)}
                        className={`px-1.5 py-0.5 rounded text-[10px] truncate cursor-pointer font-medium ${
                          isStatusApproved(req.status)
                            ? 'bg-emerald-950/80 text-emerald-200 border border-emerald-700/50'
                            : 'bg-blue-950/80 text-blue-200 border border-blue-700/50'
                        }`}
                        title={`${req.employeeName} (${req.sector}) - ${req.days} días`}
                      >
                        {req.employeeName.split(' ')[0]} ({req.sector})
                      </div>
                    ))}
                  </div>

                  {dayRequests.length > 0 && (
                    <div className="text-[9px] text-slate-500 font-mono text-right">
                      {dayRequests.length} ausente{dayRequests.length > 1 ? 's' : ''}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900/60 p-3.5 rounded-xl border border-slate-800 text-xs text-slate-400">
        <div className="flex flex-wrap items-center gap-4">
          <span className="font-semibold text-slate-300">Estados de Planificación:</span>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span className="text-slate-300">Vacación Aprobada</span>
          </div>
          {isSupervisor ? (
            <>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                <span className="text-slate-300">En Revisión Previa (Auditada OK)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span className="text-slate-300">Coincidencia en Sector (A dirimir por orden de ingreso)</span>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
              <span className="text-slate-300">Tu Solicitud (En proceso de revisión previa)</span>
            </div>
          )}
        </div>
        <div className="text-[11px] text-slate-400">
          {isSupervisor
            ? 'Haz clic en cualquier período para abrir la bandeja de resolución del supervisor'
            : 'Haz clic en las celdas vacías (+ Solicitar) para generar un pedido'}
        </div>
      </div>

      {/* Read-only details modal for Operator mode */}
      {operatorDetailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">Detalle de Vacaciones</h3>
              </div>
              <button
                onClick={() => setOperatorDetailModal(null)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-800/60">
                <span className="text-slate-400">Operario:</span>
                <span className="font-bold text-white">{operatorDetailModal.employeeName}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800/60">
                <span className="text-slate-400">Sector:</span>
                <span className="font-mono text-slate-200">
                  {operatorDetailModal.sector === 'PROD' ? 'Producción (PROD)' : 'Carga y Descarga (CYD)'}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800/60">
                <span className="text-slate-400">Período:</span>
                <span className="font-mono text-emerald-300 font-semibold">
                  Lun {formatDisplayDate(operatorDetailModal.startDate)} al Dom {formatDisplayDate(operatorDetailModal.endDate)}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800/60">
                <span className="text-slate-400">Duración:</span>
                <span className="font-mono font-bold text-white">
                  {operatorDetailModal.days} días ({Math.floor(operatorDetailModal.days / 7)} semana{operatorDetailModal.days > 7 ? 's' : ''})
                </span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-400">Estado de Aprobación:</span>
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800/50">
                  {isStatusApproved(operatorDetailModal.status) ? 'Aprobada Oficialmente' : 'En Revisión'}
                </span>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => setOperatorDetailModal(null)}
                className="w-full py-2 bg-slate-800 hover:bg-slate-750 text-slate-200 font-semibold rounded-xl text-xs transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
