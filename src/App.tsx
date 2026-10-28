import React, { useState, useEffect } from 'react';
import { 
  INITIAL_EMPLOYEES, 
  INITIAL_REQUESTS, 
  DEFAULT_PLANT_CONFIG 
} from './data/plantData';
import { Employee, PlantConfig, VacationRequest, UserRole, SectorType } from './types';
import { Header } from './components/Header';
import { SharedCalendar } from './components/SharedCalendar';
import { ApprovalInbox } from './components/ApprovalInbox';
import { EmployeeTable } from './components/EmployeeTable';
import { PlantRulesConfig } from './components/PlantRulesConfig';
import { RequestVacationModal } from './components/RequestVacationModal';
import { PrintReportModal } from './components/PrintReportModal';
import { SupervisorPinModal } from './components/SupervisorPinModal';
import { DataBackupModal } from './components/DataBackupModal';
import { exportPlantVacationsCsv } from './utils/exportCsv';
import { 
  Calendar, 
  CheckCircle2, 
  AlertTriangle, 
  Users, 
  TrendingUp, 
  Plus, 
  FileSpreadsheet,
  Info,
  HardHat,
  ShieldCheck
} from 'lucide-react';

import { 
  isStatusApproved, 
  isStatusPending, 
  formatExactDateTime,
  formatDisplayDate,
  calculateEndDate
} from './utils/vacationEngine';
import { testFirestoreConnection } from './lib/firebase';
import { 
  subscribeToEmployees, 
  subscribeToRequests, 
  subscribeToConfig,
  syncSaveEmployee,
  syncDeleteEmployee,
  syncSaveRequest,
  syncDeleteRequest,
  syncUpdateConfig,
  syncResetAllData,
  syncBulkReplaceEmployees
} from './services/firestoreSync';

const STORAGE_KEYS = {
  EMPLOYEES: 'vacsfa_employees_v2',
  REQUESTS: 'vacsfa_requests_v2',
  CONFIG: 'vacsfa_config_v2',
  USER_ROLE: 'vacsfa_user_role_v2',
  ACTIVE_OPERATOR: 'vacsfa_active_colaborador_v2',
};

// Clean up any old keys to ensure sanitized anonymous names load immediately
try {
  [
    'vacsfa_employees_v1', 
    'vacsfa_requests_v1', 
    'vacsfa_active_operator_v1', 
    'plantavac_employees_v2', 
    'plantavac_requests_v2', 
    'plantavac_config_v2', 
    'plantavac_requests_v1'
  ].forEach((k) => {
    localStorage.removeItem(k);
  });
} catch {
  // ignore storage errors
}

export default function App() {
  // User Role: OPERADOR / COLABORADOR (default) vs SUPERVISOR (can review, adjust dates and approve)
  const [userRole, setUserRole] = useState<UserRole>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.USER_ROLE);
      return saved === 'SUPERVISOR' || saved === 'OPERADOR' || saved === 'COLABORADOR' ? (saved as UserRole) : 'OPERADOR';
    } catch {
      return 'OPERADOR';
    }
  });

  // Active operator identifier when in operator mode
  const [activeOperatorId, setActiveOperatorId] = useState<string | null>(() => {
    try {
      return localStorage.getItem(STORAGE_KEYS.ACTIVE_OPERATOR) || null;
    } catch {
      return null;
    }
  });

  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [isCloudSynced, setIsCloudSynced] = useState<boolean>(true);

  // State initialization with localStorage fallback and automatic sector upgrade
  const [employees, setEmployees] = useState<Employee[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.EMPLOYEES);
      if (saved) {
        const parsed: Employee[] = JSON.parse(saved);
        const hasMantOrCal = parsed.some((e) => e.sector === 'MANT' || e.sector === 'CAL');
        if (!hasMantOrCal) {
          const newSectorsEmployees = INITIAL_EMPLOYEES.filter(
            (e) => e.sector === 'MANT' || e.sector === 'CAL'
          );
          const merged = [...parsed, ...newSectorsEmployees];
          try {
            localStorage.setItem(STORAGE_KEYS.EMPLOYEES, JSON.stringify(merged));
          } catch {}
          return merged;
        }
        return parsed;
      }
      return INITIAL_EMPLOYEES;
    } catch {
      return INITIAL_EMPLOYEES;
    }
  });

  const [requests, setRequests] = useState<VacationRequest[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.REQUESTS);
      return saved ? JSON.parse(saved) : INITIAL_REQUESTS;
    } catch {
      return INITIAL_REQUESTS;
    }
  });

  const [config, setConfig] = useState<PlantConfig>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CONFIG);
      return saved ? JSON.parse(saved) : DEFAULT_PLANT_CONFIG;
    } catch {
      return DEFAULT_PLANT_CONFIG;
    }
  });

  const [activeTab, setActiveTab] = useState<'calendar' | 'inbox' | 'employees' | 'rules'>('calendar');
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [preselectedEmp, setPreselectedEmp] = useState<Employee | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<VacationRequest | null>(null);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Real-time synchronization across devices (Mobile <-> Web)
  useEffect(() => {
    testFirestoreConnection().then((connected) => {
      setIsCloudSynced(connected);
    });

    const unsubEmployees = subscribeToEmployees((remoteEmployees) => {
      if (remoteEmployees && remoteEmployees.length > 0) {
        setEmployees(remoteEmployees);
      }
    });

    const unsubRequests = subscribeToRequests((remoteRequests) => {
      setRequests(remoteRequests);
    });

    const unsubConfig = subscribeToConfig((remoteConfig) => {
      if (remoteConfig) {
        setConfig(remoteConfig);
      }
    });

    return () => {
      unsubEmployees();
      unsubRequests();
      unsubConfig();
    };
  }, []);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.EMPLOYEES, JSON.stringify(employees));
    } catch (e) {
      console.error(e);
    }
  }, [employees]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.REQUESTS, JSON.stringify(requests));
    } catch (e) {
      console.error(e);
    }
  }, [requests]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(config));
    } catch (e) {
      console.error(e);
    }
  }, [config]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.USER_ROLE, userRole);
    } catch (e) {
      console.error(e);
    }
    // If switched to OPERADOR and user is on supervisor-only tabs, redirect to calendar
    if (userRole === 'OPERADOR' && (activeTab === 'inbox' || activeTab === 'rules')) {
      setActiveTab('calendar');
    }
  }, [userRole, activeTab]);

  useEffect(() => {
    try {
      if (activeOperatorId) {
        localStorage.setItem(STORAGE_KEYS.ACTIVE_OPERATOR, activeOperatorId);
      } else {
        localStorage.removeItem(STORAGE_KEYS.ACTIVE_OPERATOR);
      }
    } catch (e) {
      console.error(e);
    }
  }, [activeOperatorId]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  // Dotación Management Handlers (Supervisor only)
  const handleAddEmployee = (data: { name: string; sector: SectorType; totalDays: number }) => {
    if (userRole !== 'SUPERVISOR') {
      showToast('Acceso denegado: Se requiere rol de Supervisor para modificar la dotación.');
      return;
    }

    const sectorPrefix = data.sector.toLowerCase();
    const countInSector = employees.filter((e) => e.sector === data.sector).length + 1;
    const newId = `emp-${sectorPrefix}-${countInSector.toString().padStart(2, '0')}-${Date.now().toString().slice(-4)}`;

    const newEmp: Employee = {
      id: newId,
      name: data.name,
      sector: data.sector,
      totalDays: data.totalDays,
    };

    setEmployees((prev) => [...prev, newEmp]);
    syncSaveEmployee(newEmp).catch(console.error);
    showToast(`Colaborador ${newEmp.name} incorporado a la dotación (${newEmp.sector} · ${newEmp.totalDays}d anuales).`);
  };

  const handleUpdateEmployee = (updatedEmp: Employee) => {
    if (userRole !== 'SUPERVISOR') {
      showToast('Acceso denegado: Se requiere rol de Supervisor para modificar la dotación.');
      return;
    }

    setEmployees((prev) =>
      prev.map((e) => (e.id === updatedEmp.id ? updatedEmp : e))
    );
    syncSaveEmployee(updatedEmp).catch(console.error);

    // Synchronize employee name and sector in any existing requests
    setRequests((prev) =>
      prev.map((r) => {
        if (r.employeeId === updatedEmp.id) {
          const syncedReq = {
            ...r,
            employeeName: updatedEmp.name,
            sector: updatedEmp.sector,
          };
          syncSaveRequest(syncedReq).catch(console.error);
          return syncedReq;
        }
        return r;
      })
    );

    showToast(`Datos y días de vacaciones de ${updatedEmp.name} actualizados exitosamente.`);
  };

  const handleDeleteEmployee = (empId: string) => {
    if (userRole !== 'SUPERVISOR') {
      showToast('Acceso denegado: Se requiere rol de Supervisor para dar de baja colaboradores.');
      return;
    }

    const emp = employees.find((e) => e.id === empId);
    setEmployees((prev) => prev.filter((e) => e.id !== empId));
    syncDeleteEmployee(empId).catch(console.error);

    if (activeOperatorId === empId) {
      setActiveOperatorId(null);
    }

    showToast(`Colaborador ${emp?.name || empId} dado de baja de la dotación.`);
  };

  // Supervisor start date editor handler (e.g. for Monday holidays)
  const handleUpdateRequestDate = (requestId: string, newStartDate: string) => {
    if (userRole !== 'SUPERVISOR') {
      showToast('Acceso denegado: Se requiere rol de Supervisor para ajustar fechas.');
      return;
    }

    let updatedReqToSync: VacationRequest | null = null;
    setRequests((prev) =>
      prev.map((r) => {
        if (r.id === requestId) {
          const newEndDate = calculateEndDate(newStartDate, r.days);
          const updatedReq = {
            ...r,
            startDate: newStartDate,
            endDate: newEndDate,
            resolutionNote: r.resolutionNote.includes('Inicio ajustado')
              ? r.resolutionNote
              : `${r.resolutionNote} · [Inicio ajustado a ${formatDisplayDate(newStartDate)} por supervisión]`,
            supervisedBy: r.supervisedBy || 'Supervisor de Planta',
          };
          updatedReqToSync = updatedReq;
          return updatedReq;
        }
        return r;
      })
    );

    if (updatedReqToSync) {
      syncSaveRequest(updatedReqToSync).catch(console.error);
    }

    setSelectedRequest((prev) => {
      if (!prev || prev.id !== requestId) return prev;
      return {
        ...prev,
        startDate: newStartDate,
        endDate: calculateEndDate(newStartDate, prev.days),
      };
    });

    showToast(`Fecha de inicio actualizada al ${formatDisplayDate(newStartDate)}.`);
  };

  // Handlers
  const handleCreateRequest = (newReq: VacationRequest) => {
    setRequests((prev) => [newReq, ...prev]);
    syncSaveRequest(newReq).catch(console.error);
    showToast(`Solicitud de ${newReq.employeeName} registrada (${formatExactDateTime(newReq.requestedAt)}). Aguarda revisión de supervisión.`);
  };

  const handleApproveException = (requestId: string, supervisorNote: string) => {
    if (userRole !== 'SUPERVISOR') {
      showToast('Acceso denegado: Solo el rol Supervisor puede aprobar vacaciones.');
      return;
    }

    let updatedReqToSync: VacationRequest | null = null;
    setRequests((prev) =>
      prev.map((r) => {
        if (r.id === requestId) {
          const updatedReq = {
            ...r,
            status: 'APROBADA' as const,
            resolutionNote: `Aprobada por Supervisor de Planta: ${supervisorNote || 'Validada tras proceso de revisión previo'}`,
            supervisedBy: 'Jefe de Planta',
            supervisedAt: new Date().toISOString(),
          };
          updatedReqToSync = updatedReq;
          return updatedReq;
        }
        return r;
      })
    );

    if (updatedReqToSync) {
      syncSaveRequest(updatedReqToSync).catch(console.error);
    }

    setSelectedRequest(null);
    showToast('Vacaciones aprobadas oficialmente por Supervisión.');
  };

  const handleRejectRequest = (requestId: string, supervisorNote: string) => {
    if (userRole !== 'SUPERVISOR') {
      showToast('Acceso denegado: Solo el rol Supervisor puede rechazar vacaciones.');
      return;
    }

    let updatedReqToSync: VacationRequest | null = null;
    setRequests((prev) =>
      prev.map((r) => {
        if (r.id === requestId) {
          const updatedReq = {
            ...r,
            status: 'RECHAZADA' as const,
            resolutionNote: `Rechazada por Supervisor: ${supervisorNote || 'Conflicto de coincidencia de fechas'}`,
            supervisedBy: 'Jefe de Planta',
            supervisedAt: new Date().toISOString(),
          };
          updatedReqToSync = updatedReq;
          return updatedReq;
        }
        return r;
      })
    );

    if (updatedReqToSync) {
      syncSaveRequest(updatedReqToSync).catch(console.error);
    }

    setSelectedRequest(null);
    showToast('Solicitud rechazada.');
  };

  const handleCancelRequest = (requestId: string) => {
    setRequests((prev) => prev.filter((r) => r.id !== requestId));
    syncDeleteRequest(requestId).catch(console.error);
    setSelectedRequest(null);
    showToast('Solicitud eliminada de la planificación.');
  };

  const handleResetData = () => {
    if (userRole !== 'SUPERVISOR') {
      showToast('Acceso denegado: Se requiere rol de Supervisor para restablecer datos.');
      return;
    }

    if (window.confirm('¿Restablecer datos originales de la planta y solicitudes predeterminadas en todos los dispositivos?')) {
      setEmployees(INITIAL_EMPLOYEES);
      setRequests(INITIAL_REQUESTS);
      setConfig(DEFAULT_PLANT_CONFIG);
      localStorage.removeItem(STORAGE_KEYS.EMPLOYEES);
      localStorage.removeItem(STORAGE_KEYS.REQUESTS);
      localStorage.removeItem(STORAGE_KEYS.CONFIG);
      syncResetAllData().catch(console.error);
      showToast('Datos de planta restablecidos y sincronizados.');
    }
  };

  const handleImportBackup = async (importedEmployees: Employee[], importedRequests?: VacationRequest[]) => {
    setEmployees(importedEmployees);
    if (importedRequests && importedRequests.length > 0) {
      setRequests(importedRequests);
    }
    try {
      localStorage.setItem(STORAGE_KEYS.EMPLOYEES, JSON.stringify(importedEmployees));
      if (importedRequests && importedRequests.length > 0) {
        localStorage.setItem(STORAGE_KEYS.REQUESTS, JSON.stringify(importedRequests));
      }
    } catch {}
    await syncBulkReplaceEmployees(importedEmployees, importedRequests);
    showToast(`Dotación actualizada y sincronizada en Firestore (${importedEmployees.length} colaboradores).`);
  };

  const handleResetToGeneric = () => {
    setEmployees(INITIAL_EMPLOYEES);
    setRequests(INITIAL_REQUESTS);
    setConfig(DEFAULT_PLANT_CONFIG);
    try {
      localStorage.setItem(STORAGE_KEYS.EMPLOYEES, JSON.stringify(INITIAL_EMPLOYEES));
      localStorage.setItem(STORAGE_KEYS.REQUESTS, JSON.stringify(INITIAL_REQUESTS));
    } catch {}
    syncResetAllData().catch(console.error);
    showToast('Dotación restablecida a la plantilla genérica pública de GitHub.');
  };

  const handleOpenNewRequest = () => {
    if (activeOperatorId) {
      const current = employees.find((e) => e.id === activeOperatorId) || null;
      setPreselectedEmp(current);
    } else {
      setPreselectedEmp(null);
    }
    setIsRequestModalOpen(true);
  };

  const handleOpenRequestForEmployee = (emp: Employee) => {
    setPreselectedEmp(emp);
    setIsRequestModalOpen(true);
  };

  const handleSelectRequestFromCalendar = (req: VacationRequest) => {
    if (userRole === 'SUPERVISOR') {
      setSelectedRequest(req);
      setActiveTab('inbox');
    }
  };

  const pendingCount = requests.filter((r) => isStatusPending(r.status)).length;

  // Global KPIs
  const totalDaysEntitled = employees.reduce((sum, e) => sum + e.totalDays, 0);
  const totalDaysScheduled = requests
    .filter((r) => isStatusApproved(r.status))
    .reduce((sum, r) => sum + r.days, 0);
  const totalDaysRemaining = totalDaysEntitled - totalDaysScheduled;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans w-full overflow-x-hidden">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 border border-blue-500/50 shadow-2xl rounded-xl p-4 text-xs text-white flex items-center gap-2.5 max-w-md animate-slideUp">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenNewRequest={handleOpenNewRequest}
        pendingApprovalsCount={pendingCount}
        onOpenConfig={() => setActiveTab('rules')}
        onOpenPrint={() => setIsPrintModalOpen(true)}
        onExportCsv={() => exportPlantVacationsCsv(employees, requests)}
        userRole={userRole}
        onRequestSupervisorAccess={() => setIsPinModalOpen(true)}
        onSwitchToOperator={() => {
          setUserRole('OPERADOR');
          showToast('Modo Colaborador activo: visualizando únicamente vacaciones aprobadas.');
        }}
        employees={employees}
        activeOperatorId={activeOperatorId}
        onSelectActiveOperator={(id) => {
          setActiveOperatorId(id);
          const emp = employees.find((e) => e.id === id);
          if (emp) {
            showToast(`Operando como: ${emp.name} (${emp.sector})`);
          } else {
            showToast('Vista de Colaborador General');
          }
        }}
        onOpenBackup={() => setIsBackupModalOpen(true)}
      />

      {/* KPI & Plant Status Bar */}
      <section className="border-b border-slate-800 bg-slate-900/40">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 text-xs">
            <div className="flex items-start sm:items-center gap-2 sm:gap-3 bg-slate-900/50 sm:bg-transparent p-2 sm:p-0 rounded-lg border border-slate-800/60 sm:border-0">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-300 shrink-0 mt-0.5 sm:mt-0">
                <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-slate-400 text-[10px] sm:text-[11px]">Plantel Total</div>
                <div className="font-bold text-slate-200 font-mono text-xs sm:text-sm">
                  {employees.length} Colaboradores
                </div>
                <div className="text-[9px] sm:text-[10px] text-slate-400 font-mono truncate">
                  {employees.filter((e) => e.sector === 'PROD').length} PROD · {employees.filter((e) => e.sector === 'CYD').length} CYD · {employees.filter((e) => e.sector === 'MANT').length} MANT · {employees.filter((e) => e.sector === 'CAL').length} Cal
                </div>
              </div>
            </div>

            <div className="flex items-start sm:items-center gap-2 sm:gap-3 bg-slate-900/50 sm:bg-transparent p-2 sm:p-0 rounded-lg border border-slate-800/60 sm:border-0">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-emerald-950/60 text-emerald-400 border border-emerald-800/40 flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
                <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-slate-400 text-[10px] sm:text-[11px]">Días Aprobados</div>
                <div className="font-bold text-emerald-300 font-mono text-xs sm:text-sm">
                  {totalDaysScheduled} / {totalDaysEntitled} d
                </div>
                <div className="text-[9px] sm:text-[10px] text-emerald-400/80 font-mono">
                  {Math.round((totalDaysScheduled / totalDaysEntitled) * 100)}% asignado
                </div>
              </div>
            </div>

            <div className="flex items-start sm:items-center gap-2 sm:gap-3 bg-slate-900/50 sm:bg-transparent p-2 sm:p-0 rounded-lg border border-slate-800/60 sm:border-0">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-blue-950/60 text-blue-400 border border-blue-800/40 flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
                <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-slate-400 text-[10px] sm:text-[11px]">Días por Planificar</div>
                <div className="font-bold text-blue-300 font-mono text-xs sm:text-sm">
                  {totalDaysRemaining} días
                </div>
                <div className="text-[9px] sm:text-[10px] text-slate-400 font-mono">
                  Disponibles en dotación
                </div>
              </div>
            </div>

            <div className="flex items-start sm:items-center gap-2 sm:gap-3 bg-slate-900/50 sm:bg-transparent p-2 sm:p-0 rounded-lg border border-slate-800/60 sm:border-0">
              <div
                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 sm:mt-0 ${
                  pendingCount > 0
                    ? 'bg-amber-950 text-amber-400 border border-amber-800/50'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-slate-400 text-[10px] sm:text-[11px]">
                  {userRole === 'SUPERVISOR' ? 'Supervisión' : 'En Revisión'}
                </div>
                <div
                  className={`font-bold font-mono text-xs sm:text-sm ${
                    pendingCount > 0 ? 'text-amber-300' : 'text-slate-400'
                  }`}
                >
                  {pendingCount === 0
                    ? 'Al día (0)'
                    : userRole === 'SUPERVISOR'
                    ? `${pendingCount} en bandeja`
                    : `${pendingCount} en proceso`}
                </div>
                <div className="text-[9px] sm:text-[10px] text-slate-400 font-mono">
                  {pendingCount > 0 ? 'Requiere resolución' : 'Sin pendientes'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-5 w-full">
        {activeTab === 'calendar' && (
          <SharedCalendar
            employees={employees}
            requests={requests}
            config={config}
            onSelectRequest={handleSelectRequestFromCalendar}
            onRequestVacationForEmployee={handleOpenRequestForEmployee}
            userRole={userRole}
            activeEmployeeId={activeOperatorId}
          />
        )}

        {activeTab === 'inbox' && (
          <ApprovalInbox
            requests={requests}
            onApproveException={handleApproveException}
            onRejectRequest={handleRejectRequest}
            onCancelRequest={handleCancelRequest}
            onUpdateRequestDate={handleUpdateRequestDate}
            selectedRequest={selectedRequest}
            onSelectRequest={setSelectedRequest}
            userRole={userRole}
            onRequestSupervisorAccess={() => setIsPinModalOpen(true)}
          />
        )}

        {activeTab === 'employees' && (
          <EmployeeTable
            employees={employees}
            requests={requests}
            onOpenRequestForEmployee={handleOpenRequestForEmployee}
            onSelectRequest={handleSelectRequestFromCalendar}
            userRole={userRole}
            activeOperatorId={activeOperatorId}
            onAddEmployee={handleAddEmployee}
            onUpdateEmployee={handleUpdateEmployee}
            onDeleteEmployee={handleDeleteEmployee}
            onOpenBackupModal={() => setIsBackupModalOpen(true)}
          />
        )}

        {activeTab === 'rules' && (
          <PlantRulesConfig
            config={config}
            onUpdateConfig={(cfg) => {
              setConfig(cfg);
              syncUpdateConfig(cfg).catch(console.error);
              showToast('Reglas de planta actualizadas y sincronizadas.');
            }}
            onResetData={handleResetData}
          />
        )}
      </main>

      {/* Request Vacation Modal */}
      <RequestVacationModal
        isOpen={isRequestModalOpen}
        onClose={() => {
          setIsRequestModalOpen(false);
          setPreselectedEmp(null);
        }}
        employees={employees}
        existingRequests={requests}
        config={config}
        preselectedEmployee={preselectedEmp}
        onSubmitRequest={handleCreateRequest}
      />

      {/* Supervisor PIN Verification Modal */}
      <SupervisorPinModal
        isOpen={isPinModalOpen}
        onClose={() => setIsPinModalOpen(false)}
        onSuccess={() => {
          setUserRole('SUPERVISOR');
          setIsPinModalOpen(false);
          showToast('Modo Supervisor habilitado. Ahora puedes revisar y aprobar solicitudes.');
        }}
      />

      {/* Print Report Modal */}
      <PrintReportModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        employees={employees}
        requests={requests}
        config={config}
      />

      {/* Data Backup & Privacy Modal */}
      <DataBackupModal
        isOpen={isBackupModalOpen}
        onClose={() => setIsBackupModalOpen(false)}
        employees={employees}
        requests={requests}
        config={config}
        onImportBackup={handleImportBackup}
        onResetToGeneric={handleResetToGeneric}
      />

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>VacSFA · Sistema de Gestión de Vacaciones y Dotación de Planta SFA</div>
          <div className="flex items-center gap-3">
            <span>Sectores: PROD (Producción), CYD (Carga y Descarga), MANT (Mantenimiento) & Cal (Calidad)</span>
            <span aria-hidden="true">·</span>
            <a
              href="https://github.com/dastorquia"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-400 hover:text-emerald-400 underline underline-offset-2 transition-colors font-mono"
            >
              github.com/dastorquia
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
