import { 
  Employee, 
  PlantConfig, 
  SectorType, 
  VacationRequest, 
  VacationRuleCheck, 
  AutomatedApprovalVerdict,
  ConflictingEmployeeInfo,
  VacationStatus
} from '../types';

/**
 * Parses YYYY-MM-DD safely into a local Date without UTC offset issues.
 */
export function parseLocalDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Formats a Date into YYYY-MM-DD.
 */
export function formatLocalDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Formats a Date string into DD/MM/YYYY.
 */
export function formatDisplayDate(dateStr: string): string {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
}

/**
 * Gets Spanish day name abbreviation (e.g. Lun, Mar, Mié, etc.)
 */
export function getDayName(dateStr: string): string {
  if (!dateStr) return '';
  const d = parseLocalDate(dateStr);
  const names = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  return names[d.getDay()];
}

/**
 * Formats a Date string into 'Lun 12/10/2026'
 */
export function formatDayAndDate(dateStr: string): string {
  if (!dateStr) return '';
  return `${getDayName(dateStr)} ${formatDisplayDate(dateStr)}`;
}

/**
 * Formats an ISO timestamp into a full readable date and time string.
 * Example: "Lun 21/10/2026, 09:30:15 hs"
 */
export function formatExactDateTime(isoStr: string): string {
  if (!isoStr) return '';
  const d = new Date(isoStr);
  const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  const dayName = days[d.getDay()];
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  const ss = String(d.getSeconds()).padStart(2, '0');

  return `${dayName} ${dd}/${mm}/${yyyy}, ${hh}:${min}:${ss} hs`;
}

/**
 * Formats an ISO timestamp into a short time string with date.
 * Example: "21/10 09:30 hs"
 */
export function formatShortDateTime(isoStr: string): string {
  if (!isoStr) return '';
  const d = new Date(isoStr);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${dd}/${mm} ${hh}:${min} hs`;
}

/**
 * Calculates the ISO-8601 week number of a given Date (1 - 53).
 */
export function getISOWeekNumber(d: Date): number {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

/**
 * Checks if a given date string is a Monday.
 * In JS getDay(): 0 is Sunday, 1 is Monday, ..., 6 is Saturday.
 */
export function isMonday(dateStr: string): boolean {
  if (!dateStr) return false;
  const d = parseLocalDate(dateStr);
  return d.getDay() === 1;
}

/**
 * Finds the closest upcoming Monday (or returns the date if already Monday).
 */
export function getNextOrCurrentMonday(dateStr: string): string {
  const d = parseLocalDate(dateStr);
  const day = d.getDay();
  if (day === 1) return dateStr;
  
  const diff = (8 - day) % 7 || 7;
  d.setDate(d.getDate() + diff);
  return formatLocalDate(d);
}

/**
 * Calculates end date (Sunday) from a Monday start date and days (multiple of 7).
 */
export function calculateEndDate(startDateStr: string, days: number): string {
  const d = parseLocalDate(startDateStr);
  d.setDate(d.getDate() + (days - 1));
  return formatLocalDate(d);
}

/**
 * Calculates return date (next Monday).
 */
export function calculateReturnDate(startDateStr: string, days: number): string {
  const d = parseLocalDate(startDateStr);
  d.setDate(d.getDate() + days);
  return formatLocalDate(d);
}

/**
 * Helper to check if a status represents an approved vacation.
 */
export function isStatusApproved(status: VacationStatus): boolean {
  return status === 'APROBADA' || status === 'APROBADA_AUTO' || status === 'APROBADA_MANUAL';
}

/**
 * Helper to check if a status represents a pending vacation.
 */
export function isStatusPending(status: VacationStatus): boolean {
  return status === 'PENDIENTE_REVISION' || status === 'PENDIENTE_CONFLICTO' || status === 'PENDIENTE_CUPO';
}

/**
 * Calculates employee days usage.
 */
export function getEmployeeBalance(
  employee: Employee,
  requests: VacationRequest[],
  excludeRequestId?: string
) {
  const empRequests = requests.filter(
    (r) => r.employeeId === employee.id && r.id !== excludeRequestId
  );

  const approvedDays = empRequests
    .filter((r) => isStatusApproved(r.status))
    .reduce((sum, r) => sum + r.days, 0);

  const pendingDays = empRequests
    .filter((r) => isStatusPending(r.status))
    .reduce((sum, r) => sum + r.days, 0);

  const remainingDays = Math.max(0, employee.totalDays - approvedDays);
  const remainingConsideringPending = Math.max(0, employee.totalDays - approvedDays - pendingDays);

  return {
    totalDays: employee.totalDays,
    approvedDays,
    pendingDays,
    remainingDays,
    remainingConsideringPending,
  };
}

/**
 * Evaluates overlapping active requests for the same sector.
 * Returns max concurrency in that sector and conflicting requests with their submission timestamps.
 */
export function checkSectorConcurrency(
  sector: SectorType,
  startDateStr: string,
  endDateStr: string,
  requests: VacationRequest[],
  currentSubmissionTime?: string,
  excludeRequestId?: string
): { maxActive: number; conflicting: ConflictingEmployeeInfo[] } {
  const start = parseLocalDate(startDateStr).getTime();
  const end = parseLocalDate(endDateStr).getTime();
  const currentSubmitTs = currentSubmissionTime ? new Date(currentSubmissionTime).getTime() : Date.now();

  // Active requests in the same sector (approved or pending review)
  const activeRequests = requests.filter(
    (r) =>
      r.sector === sector &&
      r.id !== excludeRequestId &&
      (isStatusApproved(r.status) || isStatusPending(r.status))
  );

  const conflictingMap = new Map<string, ConflictingEmployeeInfo>();
  let maxActive = 0;

  const oneDayMs = 24 * 60 * 60 * 1000;
  for (let current = start; current <= end; current += oneDayMs) {
    let dayCount = 0;
    for (const req of activeRequests) {
      const reqStart = parseLocalDate(req.startDate).getTime();
      const reqEnd = parseLocalDate(req.endDate).getTime();
      if (current >= reqStart && current <= reqEnd) {
        dayCount++;
        const otherSubmitTs = new Date(req.requestedAt).getTime();
        conflictingMap.set(req.id, {
          id: req.id,
          name: req.employeeName,
          sector: req.sector,
          period: `${formatDisplayDate(req.startDate)} al ${formatDisplayDate(req.endDate)}`,
          requestedAt: req.requestedAt,
          isPriorToCurrent: otherSubmitTs < currentSubmitTs,
        });
      }
    }
    if (dayCount > maxActive) {
      maxActive = dayCount;
    }
  }

  return {
    maxActive,
    conflicting: Array.from(conflictingMap.values()),
  };
}

/**
 * The core Automated Auditor & Pre-approval Engine.
 * Evaluates plant policies and prepares the request for supervisor review:
 * 1. Must start on Monday
 * 2. Must be multiple of 7
 * 3. Must have enough remaining balance
 * 4. No two employees from the same sector can coincide
 * 
 * Instead of auto-approving directly, requests pass into a preliminary review state:
 * - PENDIENTE_REVISION: Verified OK, awaiting supervisor approval
 * - PENDIENTE_CONFLICTO: Overlaps in same sector, awaiting supervisor resolution
 * - RECHAZADA_AUTO: Hard rules broken
 */
export function getMaxQuotaForSector(sector: SectorType, config: PlantConfig): number {
  switch (sector) {
    case 'PROD':
      return config.maxSimultaneousProd ?? 1;
    case 'CYD':
      return config.maxSimultaneousCyd ?? 1;
    case 'MANT':
      return config.maxSimultaneousMant ?? 1;
    case 'CAL':
      return config.maxSimultaneousCal ?? 1;
    default:
      return 1;
  }
}

export function getSectorLabel(sector: SectorType): string {
  switch (sector) {
    case 'PROD':
      return 'Producción (PROD)';
    case 'CYD':
      return 'Carga y Descarga (CYD)';
    case 'MANT':
      return 'Mantenimiento (MANT)';
    case 'CAL':
      return 'Calidad (Cal)';
    default:
      return sector;
  }
}

export function getSectorShortLabel(sector: SectorType): string {
  switch (sector) {
    case 'PROD':
      return 'PROD';
    case 'CYD':
      return 'CYD';
    case 'MANT':
      return 'MANT';
    case 'CAL':
      return 'Cal';
    default:
      return sector;
  }
}

export function getSectorBadgeClass(sector: SectorType): string {
  switch (sector) {
    case 'PROD':
      return 'bg-sky-500/20 text-sky-300 border-sky-500/40';
    case 'CYD':
      return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
    case 'MANT':
      return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
    case 'CAL':
      return 'bg-purple-500/20 text-purple-300 border-purple-500/40';
    default:
      return 'bg-slate-700 text-slate-300 border-slate-600';
  }
}

export const ALL_SECTORS: SectorType[] = ['PROD', 'CYD', 'MANT', 'CAL'];

export function evaluateVacationRequest(
  employee: Employee,
  startDateStr: string,
  days: number,
  config: PlantConfig,
  existingRequests: VacationRequest[],
  submissionTimestamp?: string,
  excludeRequestId?: string
): AutomatedApprovalVerdict {
  const checks: VacationRuleCheck[] = [];
  const endDateStr = calculateEndDate(startDateStr, days);

  // Check 1: Must be Monday
  const startIsMonday = isMonday(startDateStr);
  checks.push({
    ruleId: 'IS_MONDAY',
    title: 'Inicio en día Lunes',
    passed: startIsMonday,
    message: startIsMonday
      ? `Fecha válida: Inicia el lunes ${formatDisplayDate(startDateStr)}.`
      : `Requisito de planta incumplido: La fecha ${formatDisplayDate(startDateStr)} no es día lunes.`,
  });

  // Check 2: Multiple of 7
  const isMult7 = days > 0 && days % 7 === 0;
  const weeksCount = Math.floor(days / 7);
  checks.push({
    ruleId: 'IS_MULTIPLE_OF_SEVEN',
    title: 'Período en múltiplos de 7',
    passed: isMult7,
    message: isMult7
      ? `${days} días solicitados (${weeksCount} ${weeksCount === 1 ? 'semana completa' : 'semanas completas'}).`
      : `Requisito de planta incumplido: ${days} no es múltiplo de 7 (debe ser 7, 14, 21 o 28 días).`,
  });

  // Check 3: Balance check
  const balance = getEmployeeBalance(employee, existingRequests, excludeRequestId);
  const hasBalance = days <= balance.remainingDays;
  checks.push({
    ruleId: 'HAS_BALANCE',
    title: 'Saldo de días disponible',
    passed: hasBalance,
    message: hasBalance
      ? `Saldo verificado: Solicita ${days} días de ${balance.remainingDays} disponibles (quedarán ${balance.remainingDays - days}).`
      : `Saldo insuficiente: Solicita ${days} días pero solo dispone de ${balance.remainingDays} días reglamentarios.`,
  });

  // Check 4: Sector quota & non-overlapping rule
  const maxQuota = getMaxQuotaForSector(employee.sector, config);
  const { maxActive, conflicting } = checkSectorConcurrency(
    employee.sector,
    startDateStr,
    endDateStr,
    existingRequests,
    submissionTimestamp,
    excludeRequestId
  );

  const projectedConcurrency = maxActive + 1;
  const quotaPassed = projectedConcurrency <= maxQuota;

  checks.push({
    ruleId: 'SECTOR_QUOTA',
    title: `Sin coincidencia en Sector ${employee.sector}`,
    passed: quotaPassed,
    message: quotaPassed
      ? `Sin coincidencia en ${employee.sector}: Ningún otro compañero coincide en estas fechas.`
      : `Conflicto de coincidencia: Dos personas de ${employee.sector} no pueden coincidir en vacaciones (${conflicting.length} compañero(s) coincidente(s)).`,
  });

  // Hard rejections (Rule 1, 2, or 3 failed)
  if (!startIsMonday || !isMult7 || !hasBalance) {
    return {
      status: 'RECHAZADA_AUTO',
      canApprove: false,
      summary: 'Solicitud no admisible: Incumple normativas básicas de planta (Lunes, Múltiplos de 7 o Saldo disponible).',
      checks,
      conflictingEmployees: conflicting,
    };
  }

  // Sector overlap conflict: requires supervisor review with priority timestamps
  if (!quotaPassed) {
    return {
      status: 'PENDIENTE_CONFLICTO',
      canApprove: false,
      summary: `Requiere revisión y definición de prioridad: Coincide con otro colaborador de ${employee.sector}. El supervisor deberá definir cuál aprobar según orden de ingreso (día y hora).`,
      checks,
      conflictingEmployees: conflicting,
    };
  }

  // All automated checks passed: Ready for supervisor review & approval
  return {
    status: 'PENDIENTE_REVISION',
    canApprove: true,
    summary: 'Auditada y Validada por el Motor: Cumple inicio lunes, múltiplo de 7, saldo y no coincide con compañeros. Lista para aprobación de supervisor.',
    checks,
  };
}
