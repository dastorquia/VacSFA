export type SectorType = 'PROD' | 'CYD';
export type UserRole = 'OPERADOR' | 'SUPERVISOR';

export interface Employee {
  id: string;
  name: string;
  sector: SectorType;
  totalDays: number; // 14, 21, 28 as specified
}

export type VacationStatus = 
  | 'PENDIENTE_REVISION'   // Ingresada, auditada por el motor, aguarda decisión de supervisor
  | 'PENDIENTE_CONFLICTO'  // Coincide con otro operario del mismo sector, aguarda decisión
  | 'APROBADA'             // Aprobada por el Supervisor / Jefe de Planta
  | 'RECHAZADA'            // Rechazada por el Supervisor
  | 'APROBADA_AUTO'        // Compatibilidad histórica (tratada como aprobada)
  | 'APROBADA_MANUAL'      // Compatibilidad histórica (tratada como aprobada)
  | 'PENDIENTE_CUPO'       // Compatibilidad histórica (tratada como conflicto de sector)
  | 'RECHAZADA_AUTO'       // Rechazada por regla dura
  | 'RECHAZADA_MANUAL'     // Rechazada manualmente
  | 'CANCELADA';           // Cancelada

export interface VacationRuleCheck {
  ruleId: 'IS_MONDAY' | 'IS_MULTIPLE_OF_SEVEN' | 'HAS_BALANCE' | 'SECTOR_QUOTA';
  title: string;
  passed: boolean;
  message: string;
}

export interface ConflictingEmployeeInfo {
  id?: string;
  name: string;
  sector: SectorType;
  period: string;
  requestedAt?: string;
  isPriorToCurrent?: boolean; // true if the other request was submitted before this one
}

export interface AutomatedApprovalVerdict {
  status: VacationStatus;
  canApprove: boolean;
  summary: string;
  checks: VacationRuleCheck[];
  conflictingEmployees?: ConflictingEmployeeInfo[];
  submissionPriorityRank?: number;
}

export interface VacationRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  sector: SectorType;
  startDate: string; // ISO date 'YYYY-MM-DD', always a Monday
  endDate: string;   // ISO date 'YYYY-MM-DD', always a Sunday
  days: number;      // 7, 14, 21, 28
  status: VacationStatus;
  requestedAt: string; // ISO timestamp (exact date and time of submission)
  resolutionNote: string;
  automatedLog: AutomatedApprovalVerdict;
  supervisedBy?: string;
  supervisedAt?: string;
}

export interface PlantConfig {
  maxSimultaneousProd: number; // Máximo operarios simultáneos (default: 1)
  maxSimultaneousCyd: number;  // Máximo operarios simultáneos (default: 1)
  allowAutoApproval: boolean;  // false por defecto: siempre requiere revisión previa
  plantName: string;
}
