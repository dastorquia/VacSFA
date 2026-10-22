import { Employee, VacationRequest } from '../types';
import { formatDisplayDate, getEmployeeBalance } from './vacationEngine';

export function exportPlantVacationsCsv(
  employees: Employee[],
  requests: VacationRequest[]
) {
  // Build CSV content
  const headers = [
    'Sector',
    'ID Operario',
    'Nombre Operario',
    'Días Totales',
    'Días Aprobados',
    'Días en Revisión',
    'Días Restantes',
    'ID Solicitud',
    'Fecha y Hora de Solicitud (Prioridad)',
    'Fecha Inicio (Lunes)',
    'Fecha Fin (Domingo)',
    'Días Período',
    'Estado Aprobación',
    'Dictamen Motor',
  ];

  const rows: string[] = [];
  rows.push(headers.join(';'));

  for (const emp of employees) {
    const balance = getEmployeeBalance(emp, requests);
    const empRequests = requests.filter(
      (r) =>
        r.employeeId === emp.id &&
        r.status !== 'RECHAZADA_AUTO' &&
        r.status !== 'RECHAZADA_MANUAL' &&
        r.status !== 'RECHAZADA' &&
        r.status !== 'CANCELADA'
    );

    if (empRequests.length === 0) {
      // Row with employee without requests yet
      rows.push(
        [
          emp.sector,
          emp.id,
          `"${emp.name}"`,
          emp.totalDays,
          balance.approvedDays,
          balance.pendingDays,
          balance.remainingDays,
          'SIN_SOLICITUD',
          '-',
          '-',
          '-',
          0,
          'SIN_PROGRAMAR',
          'Pendiente de asignación',
        ].join(';')
      );
    } else {
      for (const req of empRequests) {
        rows.push(
          [
            emp.sector,
            emp.id,
            `"${emp.name}"`,
            emp.totalDays,
            balance.approvedDays,
            balance.pendingDays,
            balance.remainingDays,
            req.id,
            `"${new Date(req.requestedAt).toLocaleString('es-ES')}"`,
            formatDisplayDate(req.startDate),
            formatDisplayDate(req.endDate),
            req.days,
            req.status,
            `"${req.resolutionNote.replace(/"/g, '""')}"`,
          ].join(';')
        );
      }
    }
  }

  const csvContent = '\uFEFF' + rows.join('\r\n'); // Add BOM for Excel UTF-8 support
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `VacSFA_Vacaciones_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
