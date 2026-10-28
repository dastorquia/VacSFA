import { Employee, PlantConfig, VacationRequest, SectorType } from '../types';

export interface BackupData {
  app: 'VacSFA';
  version: string;
  exportedAt: string;
  type: 'PRIVATE_BACKUP';
  plant: string;
  note: string;
  employees: Employee[];
  requests?: VacationRequest[];
  config?: PlantConfig;
}

export interface ImportResult {
  success: boolean;
  employees: Employee[];
  requests?: VacationRequest[];
  errors: string[];
  warnings: string[];
}

/**
 * Generates and downloads a private JSON backup file.
 */
export function downloadJsonBackup(
  employees: Employee[],
  requests: VacationRequest[],
  config: PlantConfig
): void {
  const data: BackupData = {
    app: 'VacSFA',
    version: '1.0',
    exportedAt: new Date().toISOString(),
    type: 'PRIVATE_BACKUP',
    plant: config.plantName || 'Planta SFA',
    note: 'ADVERTENCIA: Este archivo contiene nombres y datos reales de la dotación. Guardar de forma privada; NO subir a repositorios públicos como GitHub.',
    employees,
    requests,
    config,
  };

  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const dateStr = new Date().toISOString().split('T')[0];
  a.href = url;
  a.download = `respaldo_privado_dotacion_sfa_${dateStr}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Generates and downloads an editable CSV backup of the employee roster.
 */
export function downloadCsvEmployees(employees: Employee[]): void {
  const headers = ['id', 'name', 'sector', 'totalDays'];
  const rows = employees.map((e) => [
    e.id,
    `"${e.name.replace(/"/g, '""')}"`,
    e.sector,
    e.totalDays,
  ]);

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const blob = new Blob([new Uint8Array([0xef, 0xbb, 0xbf]), csvContent], {
    type: 'text/csv;charset=utf-8;',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const dateStr = new Date().toISOString().split('T')[0];
  a.href = url;
  a.download = `dotacion_real_empleados_sfa_${dateStr}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Validates whether a sector is valid.
 */
function isValidSector(sec: string): sec is SectorType {
  return ['PROD', 'CYD', 'MANT', 'CAL'].includes(sec);
}

/**
 * Parses and validates an uploaded JSON backup file.
 */
export function parseJsonBackup(jsonText: string): ImportResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    const data = JSON.parse(jsonText);
    if (!data || typeof data !== 'object') {
      return { success: false, employees: [], errors: ['El archivo no tiene un formato JSON válido.'], warnings };
    }

    const rawEmployees = Array.isArray(data.employees) ? data.employees : [];
    if (rawEmployees.length === 0) {
      return { success: false, employees: [], errors: ['El archivo JSON no contiene una lista de colaboradores en "employees".'], warnings };
    }

    const validEmployees: Employee[] = [];
    const usedIds = new Set<string>();

    rawEmployees.forEach((item: any, index: number) => {
      const idx = index + 1;
      if (!item.name || typeof item.name !== 'string' || item.name.trim() === '') {
        errors.push(`Fila ${idx}: Falta el nombre del colaborador.`);
        return;
      }

      const sectorStr = String(item.sector || '').toUpperCase().trim();
      if (!isValidSector(sectorStr)) {
        errors.push(`Fila ${idx} (${item.name}): Sector inválido "${item.sector}". Debe ser PROD, CYD, MANT o CAL.`);
        return;
      }

      const totalDays = Number(item.totalDays);
      if (isNaN(totalDays) || totalDays < 7) {
        errors.push(`Fila ${idx} (${item.name}): Días de vacaciones inválidos (${item.totalDays}). Mínimo 7 días.`);
        return;
      }

      let id = item.id && typeof item.id === 'string' && item.id.trim() !== ''
        ? item.id.trim()
        : `emp-${sectorStr.toLowerCase()}-${String(idx).padStart(2, '0')}`;

      // Ensure unique IDs
      if (usedIds.has(id)) {
        id = `${id}-${Math.random().toString(36).substring(2, 6)}`;
      }
      usedIds.add(id);

      validEmployees.push({
        id,
        name: item.name.trim(),
        sector: sectorStr,
        totalDays,
      });
    });

    if (errors.length > 0 && validEmployees.length === 0) {
      return { success: false, employees: [], errors, warnings };
    }

    // Optional requests validation
    const validRequests: VacationRequest[] = [];
    if (Array.isArray(data.requests)) {
      data.requests.forEach((r: any) => {
        if (r && r.id && r.employeeId && r.startDate && r.endDate) {
          validRequests.push(r as VacationRequest);
        }
      });
    }

    return {
      success: validEmployees.length > 0,
      employees: validEmployees,
      requests: validRequests.length > 0 ? validRequests : undefined,
      errors,
      warnings,
    };
  } catch (err: any) {
    return {
      success: false,
      employees: [],
      errors: [`Error al procesar el archivo JSON: ${err.message || 'Estructura inválida'}`],
      warnings,
    };
  }
}

/**
 * Parses and validates an uploaded CSV file.
 */
export function parseCsvEmployees(csvText: string): ImportResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const lines = csvText.split(/\r?\n/).filter((l) => l.trim().length > 0);

  if (lines.length < 2) {
    return { success: false, employees: [], errors: ['El archivo CSV no contiene registros suficientes.'], warnings };
  }

  // Determine separator (comma or semicolon)
  const firstLine = lines[0];
  const sep = firstLine.includes(';') ? ';' : ',';
  const headers = firstLine.split(sep).map((h) => h.replace(/["\r]/g, '').trim().toLowerCase());

  const nameIdx = headers.findIndex((h) => h === 'name' || h === 'nombre');
  const sectorIdx = headers.findIndex((h) => h === 'sector');
  const daysIdx = headers.findIndex((h) => h === 'totaldays' || h === 'dias' || h === 'días');
  const idIdx = headers.findIndex((h) => h === 'id' || h === 'legajo');

  if (nameIdx === -1 || sectorIdx === -1 || daysIdx === -1) {
    return {
      success: false,
      employees: [],
      errors: ['El archivo CSV debe tener encabezados: "name", "sector", "totalDays" (o "nombre", "sector", "dias").'],
      warnings,
    };
  }

  const validEmployees: Employee[] = [];
  const usedIds = new Set<string>();

  for (let i = 1; i < lines.length; i++) {
    const rawLine = lines[i];
    if (!rawLine.trim()) continue;

    // Simple CSV row parser handling quotes
    const regex = /(?:,|\n|^)("(?:(?:"")*[^"]*)*"|[^",\n]*|(?:\n|$))/g;
    const cols: string[] = [];
    
    // Fallback simple split if no quotes
    if (!rawLine.includes('"')) {
      rawLine.split(sep).forEach((c) => cols.push(c.trim()));
    } else {
      let cur = '';
      let insideQuote = false;
      for (let c = 0; c < rawLine.length; c++) {
        const char = rawLine[c];
        if (char === '"') {
          insideQuote = !insideQuote;
        } else if (char === sep && !insideQuote) {
          cols.push(cur.trim().replace(/^"|"$/g, ''));
          cur = '';
        } else {
          cur += char;
        }
      }
      cols.push(cur.trim().replace(/^"|"$/g, ''));
    }

    const rowNum = i + 1;
    const name = cols[nameIdx]?.trim();
    if (!name) {
      errors.push(`Fila ${rowNum}: Nombre vacío.`);
      continue;
    }

    const sectorStr = String(cols[sectorIdx] || '').toUpperCase().trim();
    if (!isValidSector(sectorStr)) {
      errors.push(`Fila ${rowNum} (${name}): Sector inválido "${cols[sectorIdx]}". Debe ser PROD, CYD, MANT o CAL.`);
      continue;
    }

    const days = parseInt(cols[daysIdx], 10);
    if (isNaN(days) || days < 7) {
      errors.push(`Fila ${rowNum} (${name}): Días inválidos ("${cols[daysIdx]}"). Mínimo 7.`);
      continue;
    }

    let id = idIdx !== -1 && cols[idIdx]?.trim()
      ? cols[idIdx].trim()
      : `emp-${sectorStr.toLowerCase()}-${String(i).padStart(2, '0')}`;

    if (usedIds.has(id)) {
      id = `${id}-${Math.random().toString(36).substring(2, 5)}`;
    }
    usedIds.add(id);

    validEmployees.push({
      id,
      name,
      sector: sectorStr,
      totalDays: days,
    });
  }

  return {
    success: validEmployees.length > 0,
    employees: validEmployees,
    errors,
    warnings,
  };
}
