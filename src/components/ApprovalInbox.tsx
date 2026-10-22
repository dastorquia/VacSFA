import React, { useState, useMemo } from 'react';
import { 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  ShieldCheck, 
  Filter, 
  UserCheck, 
  UserX, 
  Trash2, 
  Calendar,
  Layers,
  ArrowUpDown,
  Award,
  ChevronRight,
  Flame,
  Info,
  Lock,
  KeyRound
} from 'lucide-react';
import { VacationRequest, VacationStatus, SectorType, UserRole } from '../types';
import { formatDisplayDate, formatExactDateTime, isStatusApproved, isStatusPending } from '../utils/vacationEngine';

interface ApprovalInboxProps {
  requests: VacationRequest[];
  onApproveException: (requestId: string, supervisorNote: string) => void;
  onRejectRequest: (requestId: string, supervisorNote: string) => void;
  onCancelRequest: (requestId: string) => void;
  selectedRequest: VacationRequest | null;
  onSelectRequest: (req: VacationRequest | null) => void;
  userRole?: UserRole;
  onRequestSupervisorAccess?: () => void;
}

export const ApprovalInbox: React.FC<ApprovalInboxProps> = ({
  requests,
  onApproveException,
  onRejectRequest,
  onCancelRequest,
  selectedRequest,
  onSelectRequest,
  userRole = 'SUPERVISOR',
  onRequestSupervisorAccess,
}) => {
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'CONFLICT' | 'APPROVED' | 'REJECTED'>('ALL');
  const [sectorFilter, setSectorFilter] = useState<'ALL' | SectorType>('ALL');
  const [sortBy, setSortBy] = useState<'PRIORITY_FIFO' | 'NEWEST' | 'DATE_START'>('PRIORITY_FIFO');
  const [supervisorNote, setSupervisorNote] = useState<string>('');

  // Calculate submission order for pending requests in the same sector to display priority rank (#1, #2, etc.)
  const priorityMap = useMemo(() => {
    const map = new Map<string, { rank: number; totalInSector: number }>();
    const pendingRequests = requests.filter((r) => isStatusPending(r.status));

    // Sort ascending by requestedAt (FIFO)
    const sortedPending = [...pendingRequests].sort(
      (a, b) => new Date(a.requestedAt).getTime() - new Date(b.requestedAt).getTime()
    );

    ['PROD', 'CYD'].forEach((sec) => {
      const inSector = sortedPending.filter((r) => r.sector === sec);
      inSector.forEach((req, idx) => {
        map.set(req.id, { rank: idx + 1, totalInSector: inSector.length });
      });
    });

    return map;
  }, [requests]);

  // Filter and sort requests
  const filteredAndSortedRequests = useMemo(() => {
    return requests
      .filter((r) => {
        const matchSector = sectorFilter === 'ALL' || r.sector === sectorFilter;
        let matchStatus = true;
        if (statusFilter === 'PENDING') {
          matchStatus = r.status === 'PENDIENTE_REVISION';
        } else if (statusFilter === 'CONFLICT') {
          matchStatus = r.status === 'PENDIENTE_CONFLICTO' || r.status === 'PENDIENTE_CUPO';
        } else if (statusFilter === 'APPROVED') {
          matchStatus = isStatusApproved(r.status);
        } else if (statusFilter === 'REJECTED') {
          matchStatus = r.status === 'RECHAZADA' || r.status === 'RECHAZADA_MANUAL' || r.status === 'RECHAZADA_AUTO';
        }
        return matchSector && matchStatus;
      })
      .sort((a, b) => {
        if (sortBy === 'PRIORITY_FIFO') {
          // Earlier submission first (priority)
          return new Date(a.requestedAt).getTime() - new Date(b.requestedAt).getTime();
        } else if (sortBy === 'NEWEST') {
          // Most recent submission first
          return new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime();
        } else {
          // Vacation start date
          return a.startDate.localeCompare(b.startDate);
        }
      });
  }, [requests, sectorFilter, statusFilter, sortBy]);

  const pendingRevisionCount = requests.filter((r) => r.status === 'PENDIENTE_REVISION').length;
  const pendingConflictCount = requests.filter((r) => r.status === 'PENDIENTE_CONFLICTO' || r.status === 'PENDIENTE_CUPO').length;
  const totalPending = pendingRevisionCount + pendingConflictCount;
  const approvedCount = requests.filter((r) => isStatusApproved(r.status)).length;

  if (userRole === 'OPERADOR') {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 text-center">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-indigo-950/60 border border-indigo-700/50 text-indigo-400 flex items-center justify-center mx-auto shadow-inner">
            <Lock className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-lg font-bold text-white">
              Bandeja de Aprobación Restringida a Supervisión
            </h2>
            <p className="text-xs text-slate-300 max-w-md mx-auto leading-relaxed">
              Has iniciado en modo <strong>Operador</strong>. Conforme al reglamento de planta, los operarios no pueden autoaprobar solicitudes de vacaciones. Solo los supervisores y jefes de planta están autorizados para revisar y aprobar pedidos.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-left text-xs space-y-2">
            <div className="font-semibold text-slate-200 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-indigo-400" />
              <span>Privilegios del Rol Supervisor:</span>
            </div>
            <ul className="text-slate-400 text-[11px] list-disc list-inside space-y-1">
              <li>Auditar día, hora, minuto y segundo exacto de recepción de solicitudes</li>
              <li>Dirimir orden de mérito y prioridad en casos de coincidencia</li>
              <li>Aprobar o rechazar períodos con firma digital del supervisor</li>
              <li>Configurar cupos y parámetros de dotación de planta</li>
            </ul>
          </div>

          {onRequestSupervisorAccess && (
            <button
              onClick={onRequestSupervisorAccess}
              className="py-2.5 px-6 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs transition-all shadow-lg shadow-indigo-900/40 inline-flex items-center gap-2 cursor-pointer active:scale-95"
            >
              <KeyRound className="w-4 h-4" />
              <span>Ingresar como Supervisor</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Engine Overview Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-bold font-mono text-blue-400">{totalPending}</div>
            <div className="text-xs text-slate-400 font-medium">
              En Bandeja de Revisión ({pendingConflictCount} con coincidencia)
            </div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-bold font-mono text-emerald-400">{approvedCount}</div>
            <div className="text-xs text-slate-400 font-medium">Aprobadas por Supervisión</div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-bold font-mono text-white">Criterio Temporal</div>
            <div className="text-xs text-slate-400 font-medium">Prioridad por Día y Hora Exactos</div>
          </div>
        </div>
      </div>

      {/* Filter and Sorting Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
        <div className="flex flex-wrap items-center gap-2">
          {/* Status filters */}
          <div className="flex items-center gap-1 p-1 bg-slate-800 rounded-lg border border-slate-700/60 text-xs">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                statusFilter === 'ALL' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Todas ({requests.length})
            </button>

            <button
              onClick={() => setStatusFilter('PENDING')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors flex items-center gap-1.5 ${
                statusFilter === 'PENDING' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>Por Aprobar</span>
              {pendingRevisionCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-blue-400 text-slate-950 font-mono text-[10px] font-bold">
                  {pendingRevisionCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setStatusFilter('CONFLICT')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors flex items-center gap-1.5 ${
                statusFilter === 'CONFLICT' ? 'bg-amber-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>Con Coincidencia</span>
              {pendingConflictCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-amber-400 text-slate-950 font-mono text-[10px] font-bold">
                  {pendingConflictCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setStatusFilter('APPROVED')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                statusFilter === 'APPROVED' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Aprobadas ({approvedCount})
            </button>
          </div>

          {/* Sector filters */}
          <div className="flex items-center gap-1 p-1 bg-slate-800 rounded-lg border border-slate-700/60 text-xs">
            <button
              onClick={() => setSectorFilter('ALL')}
              className={`px-2.5 py-1 rounded font-medium ${
                sectorFilter === 'ALL' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Sectores
            </button>
            <button
              onClick={() => setSectorFilter('PROD')}
              className={`px-2.5 py-1 rounded font-medium ${
                sectorFilter === 'PROD' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              PROD
            </button>
            <button
              onClick={() => setSectorFilter('CYD')}
              className={`px-2.5 py-1 rounded font-medium ${
                sectorFilter === 'CYD' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              CYD (Carga y Descarga)
            </button>
          </div>
        </div>

        {/* Priority / Timestamp sorting */}
        <div className="flex items-center gap-2 text-xs">
          <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="text-slate-400 font-medium">Ordenar:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 text-xs font-medium focus:outline-none focus:border-blue-500"
          >
            <option value="PRIORITY_FIFO">🏆 Prioridad por Ingreso (Primero en llegar)</option>
            <option value="NEWEST">Más recientes primero</option>
            <option value="DATE_START">Fecha de inicio de vacaciones</option>
          </select>
        </div>
      </div>

      {/* Explanatory banner for resolution by priority */}
      <div className="bg-slate-900 border border-blue-900/40 rounded-xl p-3.5 text-xs text-slate-300 flex items-start gap-2.5">
        <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong>Criterio de Prioridad Temporal:</strong> En caso de que dos o más operarios del mismo sector soliciten fechas coincidentes en igualdad de méritos, el sistema registra el <strong>día, hora, minuto y segundo exactos</strong> de ingreso para otorgar prioridad a quien haya enviado la solicitud con anterioridad.
        </div>
      </div>

      {/* Requests List */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className={`${selectedRequest ? 'lg:col-span-7' : 'lg:col-span-12'} space-y-3`}>
          {filteredAndSortedRequests.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center text-slate-400">
              No se encontraron solicitudes con los filtros aplicados.
            </div>
          ) : (
            filteredAndSortedRequests.map((req) => {
              const isSelected = selectedRequest?.id === req.id;
              const isApproved = isStatusApproved(req.status);
              const isConflict = req.status === 'PENDIENTE_CONFLICTO' || req.status === 'PENDIENTE_CUPO';
              const isPendingReview = req.status === 'PENDIENTE_REVISION';
              const isRejected = req.status === 'RECHAZADA' || req.status === 'RECHAZADA_MANUAL' || req.status === 'RECHAZADA_AUTO';

              const priorityInfo = priorityMap.get(req.id);

              return (
                <div
                  key={req.id}
                  onClick={() => onSelectRequest(req)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-slate-800/90 border-blue-500 ring-1 ring-blue-500 shadow-lg'
                      : 'bg-slate-900/90 border-slate-800 hover:bg-slate-850 hover:border-slate-700'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="space-y-1.5 flex-1">
                      {/* Name and Sector */}
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            req.sector === 'PROD'
                              ? 'bg-sky-500/20 text-sky-300'
                              : 'bg-emerald-500/20 text-emerald-300'
                          }`}
                        >
                          {req.sector === 'CYD' ? 'CYD · Carga y Descarga' : 'PROD · Producción'}
                        </span>

                        <h3 className="text-sm font-bold text-white tracking-tight">
                          {req.employeeName}
                        </h3>

                        {/* Priority Rank Badge if pending */}
                        {priorityInfo && (
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold flex items-center gap-1 ${
                              priorityInfo.rank === 1
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                            title={`Solicitud #${priorityInfo.rank} de ${priorityInfo.totalInSector} pendientes en ${req.sector}`}
                          >
                            <Award className="w-3 h-3 text-amber-400" />
                            <span>Prioridad #{priorityInfo.rank}</span>
                          </span>
                        )}
                      </div>

                      {/* Vacation Period */}
                      <div className="text-xs text-slate-300 flex flex-wrap items-center gap-2 pt-0.5">
                        <span className="font-mono font-semibold text-blue-400">
                          {req.days} días ({Math.floor(req.days / 7)} semanas)
                        </span>
                        <span aria-hidden="true" className="text-slate-600">·</span>
                        <span>
                          Del <strong className="text-slate-200">Lun {formatDisplayDate(req.startDate)}</strong> al{' '}
                          <strong className="text-slate-200">Dom {formatDisplayDate(req.endDate)}</strong>
                        </span>
                      </div>

                      {/* PROMINENT TIMESTAMP OF SUBMISSION */}
                      <div className="flex items-center gap-2 pt-1">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-950 border border-slate-800 text-xs font-mono text-slate-300">
                          <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          <span>Solicitado el:</span>
                          <strong className="text-amber-300 font-bold">
                            {formatExactDateTime(req.requestedAt)}
                          </strong>
                        </div>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div className="shrink-0 text-left sm:text-right flex sm:flex-col items-center sm:items-end justify-between gap-1">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                          isApproved
                            ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/60'
                            : isConflict
                            ? 'bg-amber-950/80 text-amber-300 border border-amber-800/60 animate-pulse'
                            : isPendingReview
                            ? 'bg-blue-950/80 text-blue-300 border border-blue-800/60'
                            : 'bg-rose-950/80 text-rose-300 border border-rose-800/60'
                        }`}
                      >
                        {isApproved && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                        {isConflict && <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />}
                        {isPendingReview && <Clock className="w-3.5 h-3.5 text-blue-400" />}
                        {isRejected && <UserX className="w-3.5 h-3.5 text-rose-400" />}
                        <span>
                          {isApproved
                            ? 'Aprobada'
                            : isConflict
                            ? 'Coincidencia de Fechas'
                            : isPendingReview
                            ? 'Pendiente de Aprobación'
                            : 'Rechazada'}
                        </span>
                      </span>

                      {/* Quick inline action for supervisor */}
                      {!isApproved && !isRejected && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onApproveException(req.id, 'Aprobada por orden de prioridad temporal y mérito');
                          }}
                          className="mt-1 px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[11px] font-bold shadow transition-colors flex items-center gap-1"
                          title="Aprobar inmediatamente esta solicitud"
                        >
                          <UserCheck className="w-3 h-3" />
                          <span>Aprobar</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Conflict comparison details if any */}
                  {req.automatedLog.conflictingEmployees && req.automatedLog.conflictingEmployees.length > 0 && (
                    <div className="mt-3 p-3 bg-amber-950/40 rounded-lg border border-amber-900/60 text-xs text-amber-200 space-y-1">
                      <div className="font-bold flex items-center gap-1.5 text-amber-300">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                        <span>Solapamiento con operario del mismo sector:</span>
                      </div>
                      {req.automatedLog.conflictingEmployees.map((conf, idx) => (
                        <div key={idx} className="pl-5 text-slate-300 flex flex-wrap items-center justify-between gap-1">
                          <span>
                            Coincide con <strong>{conf.name}</strong> ({conf.period})
                          </span>
                          {conf.requestedAt && (
                            <span className="font-mono text-[11px] text-slate-400">
                              (Solicitado: {formatExactDateTime(conf.requestedAt)})
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Summary Note */}
                  <div className="mt-3 text-xs text-slate-400 bg-slate-950/50 p-2.5 rounded-lg border border-slate-800/70">
                    <span className="text-slate-300 font-medium">Informe de Auditoría: </span>
                    {req.resolutionNote}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Selected Request Detail & Supervisor Resolution Panel */}
        {selectedRequest && (
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 sticky top-24 shadow-xl">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Revisión y Dictamen de Supervisión
                </div>
                <button
                  onClick={() => onSelectRequest(null)}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  Cerrar
                </button>
              </div>

              <div className="pt-3 space-y-4">
                <div>
                  <h4 className="text-base font-bold text-white">{selectedRequest.employeeName}</h4>
                  <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                    <span>
                      Sector {selectedRequest.sector === 'CYD' ? 'Carga y Descarga (CYD)' : 'Producción (PROD)'}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono">{selectedRequest.days} días totales</span>
                  </div>
                </div>

                {/* EXACT TIMESTAMP CALLOUT */}
                <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800 space-y-1">
                  <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Registro de Ingreso de Solicitud
                  </div>
                  <div className="text-sm font-bold font-mono text-amber-300 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>{formatExactDateTime(selectedRequest.requestedAt)}</span>
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Marca temporal precisa utilizada como criterio de prioridad ante solicitudes concurrentes.
                  </div>
                </div>

                {/* Audit Checklist */}
                <div className="space-y-2 bg-slate-950/60 p-3.5 rounded-lg border border-slate-800 text-xs">
                  <div className="text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-2">
                    Validaciones del Motor Automatizado:
                  </div>

                  {selectedRequest.automatedLog.checks.map((chk) => (
                    <div key={chk.ruleId} className="flex items-start gap-2">
                      {chk.passed ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      )}
                      <div>
                        <span className="font-semibold text-slate-200">{chk.title}: </span>
                        <span className="text-slate-400">{chk.message}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Conflicting Employees Info if any */}
                {selectedRequest.automatedLog.conflictingEmployees &&
                  selectedRequest.automatedLog.conflictingEmployees.length > 0 && (
                    <div className="p-3 bg-amber-950/30 border border-amber-800/40 rounded-lg text-xs space-y-2">
                      <span className="font-bold text-amber-300 block">
                        Comparativa de Coincidencia en Sector {selectedRequest.sector}:
                      </span>
                      <ul className="space-y-2 text-slate-300">
                        {selectedRequest.automatedLog.conflictingEmployees.map((c, i) => (
                          <li key={i} className="p-2 bg-slate-900 rounded border border-slate-800">
                            <div className="font-semibold text-white">{c.name}</div>
                            <div className="text-slate-400 text-[11px]">{c.period}</div>
                            {c.requestedAt && (
                              <div className="text-amber-400 font-mono text-[10px] mt-1 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                <span>Ingresó: {formatExactDateTime(c.requestedAt)}</span>
                              </div>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                {/* Supervisor Resolution Form */}
                {!isStatusApproved(selectedRequest.status) ? (
                  <div className="pt-3 border-t border-slate-800 space-y-3">
                    <div className="text-xs font-bold text-slate-200">
                      Resolución del Supervisor / Jefe de Planta:
                    </div>
                    <textarea
                      placeholder="Observación o motivo de aprobación/rechazo (opcional)..."
                      value={supervisorNote}
                      onChange={(e) => setSupervisorNote(e.target.value)}
                      className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                      rows={2}
                    />

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          onApproveException(
                            selectedRequest.id,
                            supervisorNote || 'Aprobada formalmente por el Supervisor tras revisión previa'
                          );
                          setSupervisorNote('');
                        }}
                        className="flex-1 py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-md shadow-emerald-950"
                      >
                        <UserCheck className="w-4 h-4" />
                        <span>Aprobar Vacaciones</span>
                      </button>

                      <button
                        onClick={() => {
                          onRejectRequest(
                            selectedRequest.id,
                            supervisorNote || 'Rechazada por conflicto de coincidencia de fechas'
                          );
                          setSupervisorNote('');
                        }}
                        className="py-2.5 px-3 bg-rose-600/80 hover:bg-rose-600 text-white font-semibold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5"
                      >
                        <UserX className="w-3.5 h-3.5" />
                        <span>Rechazar</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="pt-3 border-t border-slate-800 space-y-2">
                    <div className="text-xs text-emerald-400 font-semibold flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Solicitud Aprobada por {selectedRequest.supervisedBy || 'Supervisor'}</span>
                    </div>
                    {selectedRequest.supervisedAt && (
                      <div className="text-[11px] text-slate-500 font-mono">
                        Aprobada el: {formatExactDateTime(selectedRequest.supervisedAt)}
                      </div>
                    )}
                    <div className="text-right pt-2">
                      <button
                        onClick={() => onCancelRequest(selectedRequest.id)}
                        className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 ml-auto"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Anular Aprobación</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
