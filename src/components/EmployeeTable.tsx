import React, { useState } from 'react';
import { 
  Search, 
  Plus, 
  Calendar, 
  CheckCircle2, 
  AlertTriangle, 
  ChevronRight, 
  User, 
  Edit3, 
  Trash2, 
  UserPlus, 
  ShieldCheck, 
  AlertOctagon,
  X,
  Filter,
  ChevronDown
} from 'lucide-react';
import { Employee, SectorType, VacationRequest, UserRole } from '../types';
import { getEmployeeBalance, formatDisplayDate, getSectorBadgeClass, getSectorLabel } from '../utils/vacationEngine';
import { EmployeeModal } from './EmployeeModal';

interface EmployeeTableProps {
  employees: Employee[];
  requests: VacationRequest[];
  onOpenRequestForEmployee: (emp: Employee) => void;
  onSelectRequest: (req: VacationRequest) => void;
  userRole?: UserRole;
  activeOperatorId?: string | null;
  onAddEmployee?: (data: { name: string; sector: SectorType; totalDays: number }) => void;
  onUpdateEmployee?: (emp: Employee) => void;
  onDeleteEmployee?: (empId: string) => void;
  onOpenBackupModal?: () => void;
}

export const EmployeeTable: React.FC<EmployeeTableProps> = ({
  employees,
  requests,
  onOpenRequestForEmployee,
  onSelectRequest,
  userRole = 'SUPERVISOR',
  activeOperatorId,
  onAddEmployee,
  onUpdateEmployee,
  onDeleteEmployee,
  onOpenBackupModal,
}) => {
  const isSupervisor = userRole === 'SUPERVISOR';
  const [sectorFilter, setSectorFilter] = useState<'ALL' | SectorType>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedEmployeeId, setExpandedEmployeeId] = useState<string | null>(null);

  // Management modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [employeeToDelete, setEmployeeToDelete] = useState<Employee | null>(null);

  const filteredEmployees = employees.filter((emp) => {
    const matchSector = sectorFilter === 'ALL' || emp.sector === sectorFilter;
    const matchSearch = emp.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchSector && matchSearch;
  });

  const prodCount = employees.filter((e) => e.sector === 'PROD').length;
  const cydCount = employees.filter((e) => e.sector === 'CYD').length;
  const mantCount = employees.filter((e) => e.sector === 'MANT').length;
  const calCount = employees.filter((e) => e.sector === 'CAL').length;

  const handleOpenAddModal = () => {
    setEditingEmployee(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (emp: Employee) => {
    setEditingEmployee(emp);
    setIsModalOpen(true);
  };

  const handleSaveEmployee = (data: { id?: string; name: string; sector: SectorType; totalDays: number }) => {
    if (data.id) {
      onUpdateEmployee?.({
        id: data.id,
        name: data.name,
        sector: data.sector,
        totalDays: data.totalDays,
      });
    } else {
      onAddEmployee?.({
        name: data.name,
        sector: data.sector,
        totalDays: data.totalDays,
      });
    }
  };

  const handleConfirmDelete = () => {
    if (employeeToDelete) {
      onDeleteEmployee?.(employeeToDelete.id);
      setEmployeeToDelete(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Top filters & Management Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full md:w-auto">
          {/* Sector filter dropdown */}
          <div className="relative flex items-center w-full sm:w-auto">
            <Filter className="w-3.5 h-3.5 absolute left-3 text-slate-400 pointer-events-none" />
            <select
              value={sectorFilter}
              onChange={(e) => setSectorFilter(e.target.value as 'ALL' | SectorType)}
              className="w-full sm:w-auto pl-8 pr-8 py-2 text-xs bg-slate-800 border border-slate-700 hover:border-slate-600 rounded-lg text-white font-medium focus:outline-none focus:border-blue-500 cursor-pointer appearance-none shadow-sm transition-colors"
            >
              <option value="ALL" className="bg-slate-900 text-slate-200">
                Todos los Sectores ({employees.length})
              </option>
              <option value="PROD" className="bg-slate-900 text-sky-400">
                Producción (PROD - {prodCount})
              </option>
              <option value="CYD" className="bg-slate-900 text-emerald-400">
                Carga y Descarga (CYD - {cydCount})
              </option>
              <option value="MANT" className="bg-slate-900 text-amber-400">
                Mantenimiento (MANT - {mantCount})
              </option>
              <option value="CAL" className="bg-slate-900 text-purple-400">
                Calidad (Cal - {calCount})
              </option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 text-slate-400 pointer-events-none" />
          </div>

          {/* Supervisor-only: Add Employee & Backup Buttons */}
          {isSupervisor && (
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={handleOpenAddModal}
                className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg shadow-sm transition-all shadow-indigo-900/30 cursor-pointer active:scale-95"
                title="Registrar nuevo ingreso en la dotación de la planta"
              >
                <UserPlus className="w-4 h-4" />
                <span>Nuevo Ingreso</span>
              </button>

              {onOpenBackupModal && (
                <button
                  onClick={onOpenBackupModal}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-600 text-slate-200 hover:text-white text-xs font-bold rounded-lg shadow-sm transition-all cursor-pointer active:scale-95"
                  title="Administrar respaldo privado de nombres reales y privacidad de GitHub"
                >
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Respaldo y Privacidad</span>
                </button>
              )}
            </div>
          )}
        </div>

        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Buscar por nombre..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 pr-3 py-1.5 text-xs bg-slate-800 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 w-full sm:w-56"
          />
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-850 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Colaborador</th>
                <th className="py-3 px-3">Sector</th>
                <th className="py-3 px-3 text-right">Días Totales</th>
                <th className="py-3 px-3 text-right">Aprobados</th>
                <th className="py-3 px-3 text-right">En Revisión</th>
                <th className="py-3 px-3 text-right">Disponibles</th>
                <th className="py-3 px-4 w-44">Utilización</th>
                <th className="py-3 px-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500 text-xs">
                    No se encontraron colaboradores registrados con el criterio de búsqueda.
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((emp) => {
                  const balance = getEmployeeBalance(emp, requests);
                  const percentUsed = Math.min(100, Math.round((balance.approvedDays / balance.totalDays) * 100));
                  const empRequests = requests.filter(
                    (r) =>
                      r.employeeId === emp.id &&
                      r.status !== 'RECHAZADA_AUTO' &&
                      r.status !== 'RECHAZADA_MANUAL' &&
                      r.status !== 'CANCELADA'
                  );

                  const isExpanded = expandedEmployeeId === emp.id;

                  return (
                    <React.Fragment key={emp.id}>
                      <tr className="hover:bg-slate-850/60 transition-colors group">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setExpandedEmployeeId(isExpanded ? null : emp.id)}
                              className="p-1 rounded hover:bg-slate-800 text-slate-400"
                              title={isExpanded ? 'Contraer' : 'Ver períodos'}
                            >
                              <ChevronRight
                                className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-90 text-blue-400' : ''}`}
                              />
                            </button>
                            <div>
                              <div className="font-bold text-slate-200 group-hover:text-blue-400 transition-colors flex items-center gap-1.5">
                                <span>{emp.name}</span>
                                {activeOperatorId === emp.id && (
                                  <span className="text-[9px] bg-sky-500/20 text-sky-300 border border-sky-500/40 px-1.5 py-0.2 rounded font-semibold">
                                    Tú
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-slate-500 font-mono">
                                {emp.id}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getSectorBadgeClass(emp.sector)}`}
                          >
                            {emp.sector}
                          </span>
                        </td>

                        <td className="py-3 px-3 text-right font-mono font-bold text-slate-200">
                          {balance.totalDays}d
                        </td>

                        <td className="py-3 px-3 text-right font-mono text-emerald-400 font-medium">
                          {balance.approvedDays}d
                        </td>

                        <td className="py-3 px-3 text-right font-mono text-amber-400 font-medium">
                          {balance.pendingDays > 0 ? `${balance.pendingDays}d` : '-'}
                        </td>

                        <td className="py-3 px-3 text-right font-mono font-bold text-blue-400">
                          {balance.remainingDays}d
                        </td>

                        <td className="py-3 px-4">
                          <div className="space-y-1">
                            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                              <span>{percentUsed}%</span>
                              <span>{balance.approvedDays}/{balance.totalDays}d</span>
                            </div>
                            <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${
                                  percentUsed === 100
                                    ? 'bg-slate-500'
                                    : percentUsed > 50
                                    ? 'bg-blue-500'
                                    : 'bg-emerald-500'
                                }`}
                                style={{ width: `${percentUsed}%` }}
                              />
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <div className="flex items-center justify-center gap-1.5">
                            {/* Supervisor tools: Edit & Delete */}
                            {isSupervisor && (
                              <>
                                <button
                                  onClick={() => handleOpenEditModal(emp)}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                                  title="Modificar datos / Actualizar días por antigüedad"
                                >
                                  <Edit3 className="w-3.5 h-3.5 text-indigo-400" />
                                </button>
                                <button
                                  onClick={() => setEmployeeToDelete(emp)}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 transition-colors"
                                  title="Dar de baja colaborador"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}

                            {/* Standard Vacation Request button */}
                            <button
                              onClick={() => onOpenRequestForEmployee(emp)}
                              disabled={balance.remainingDays === 0}
                              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1 transition-all ${
                                balance.remainingDays > 0
                                  ? 'bg-blue-600/90 hover:bg-blue-500 text-white shadow-sm'
                                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                              }`}
                              title={
                                balance.remainingDays === 0
                                  ? 'Sin días disponibles restantes'
                                  : 'Iniciar solicitud de vacaciones'
                              }
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Solicitar</span>
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Expanded details row */}
                      {isExpanded && (
                        <tr className="bg-slate-950/70 border-b border-slate-800">
                          <td colSpan={8} className="p-4">
                            <div className="pl-6 space-y-2">
                              <div className="text-xs font-bold text-slate-300 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <Calendar className="w-4 h-4 text-blue-400" />
                                  <span>Períodos programados para {emp.name}:</span>
                                </div>
                                {isSupervisor && (
                                  <button
                                    onClick={() => handleOpenEditModal(emp)}
                                    className="text-[11px] text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
                                  >
                                    <Edit3 className="w-3 h-3" />
                                    <span>Modificar antigüedad / días totales</span>
                                  </button>
                                )}
                              </div>

                              {empRequests.length === 0 ? (
                                <div className="text-xs text-slate-500 italic pl-6">
                                  Aún no registra períodos de vacaciones tomados o solicitados.
                                </div>
                              ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 pl-6">
                                  {empRequests.map((req) => (
                                    <div
                                      key={req.id}
                                      onClick={() => {
                                        if (isSupervisor) {
                                          onSelectRequest(req);
                                        }
                                      }}
                                      className={`p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-xs ${
                                        isSupervisor ? 'hover:border-slate-700 cursor-pointer' : 'cursor-default'
                                      }`}
                                    >
                                      <div className="flex items-center justify-between font-bold text-slate-200">
                                        <span>{req.days} días</span>
                                        <span
                                          className={`text-[10px] px-1.5 py-0.5 rounded ${
                                            req.status === 'APROBADA' || req.status === 'APROBADA_AUTO' || req.status === 'APROBADA_MANUAL'
                                              ? 'bg-emerald-950 text-emerald-300'
                                              : req.status === 'PENDIENTE_CONFLICTO' || req.status === 'PENDIENTE_CUPO'
                                              ? 'bg-amber-950 text-amber-300'
                                              : 'bg-blue-950 text-blue-300'
                                          }`}
                                        >
                                          {req.status === 'APROBADA' || req.status === 'APROBADA_AUTO' || req.status === 'APROBADA_MANUAL'
                                            ? 'Aprobada'
                                            : req.status === 'PENDIENTE_CONFLICTO' || req.status === 'PENDIENTE_CUPO'
                                            ? 'Coincidencia'
                                            : 'En Revisión'}
                                        </span>
                                      </div>
                                      <div className="text-slate-400 text-[11px] font-mono mt-1">
                                        Lun {formatDisplayDate(req.startDate)} al Dom {formatDisplayDate(req.endDate)}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Employee Modal */}
      <EmployeeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        employee={editingEmployee}
        onSave={handleSaveEmployee}
        requests={requests}
      />

      {/* Delete / Discharge Employee Confirmation Modal */}
      {employeeToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-scaleUp">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-850">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-rose-600/20 text-rose-400 border border-rose-500/30 flex items-center justify-center">
                  <AlertOctagon className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white">Baja de Colaborador de Planta</h2>
                  <p className="text-[11px] text-slate-400">Desvinculación de dotación activa</p>
                </div>
              </div>
              <button
                onClick={() => setEmployeeToDelete(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-xs text-slate-300">
                ¿Está seguro de que desea dar de baja al colaborador{' '}
                <strong className="text-white">{employeeToDelete.name}</strong> del sector{' '}
                <strong className="text-white">{employeeToDelete.sector}</strong>?
              </p>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs space-y-1 text-slate-400">
                <div>Legajo: <span className="font-mono text-slate-200">{employeeToDelete.id}</span></div>
                <div>Días anuales registrados: <span className="font-mono text-slate-200">{employeeToDelete.totalDays}d</span></div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEmployeeToDelete(null)}
                  className="py-2.5 px-4 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white text-xs font-semibold transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  className="py-2.5 px-5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all shadow-lg shadow-rose-900/40 flex items-center gap-1.5 cursor-pointer active:scale-95"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Confirmar Baja</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
