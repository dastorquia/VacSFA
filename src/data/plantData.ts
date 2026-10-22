import { Employee, PlantConfig, VacationRequest } from '../types';

export const INITIAL_EMPLOYEES: Employee[] = [
  // SECTOR PROD (10 colaboradores)
  { id: 'emp-prod-01', name: 'Colaborador de Producción 1', sector: 'PROD', totalDays: 21 },
  { id: 'emp-prod-02', name: 'Colaborador de Producción 2', sector: 'PROD', totalDays: 21 },
  { id: 'emp-prod-03', name: 'Colaborador de Producción 3', sector: 'PROD', totalDays: 21 },
  { id: 'emp-prod-04', name: 'Colaborador de Producción 4', sector: 'PROD', totalDays: 28 },
  { id: 'emp-prod-05', name: 'Colaborador de Producción 5', sector: 'PROD', totalDays: 28 },
  { id: 'emp-prod-06', name: 'Colaborador de Producción 6', sector: 'PROD', totalDays: 28 },
  { id: 'emp-prod-07', name: 'Colaborador de Producción 7', sector: 'PROD', totalDays: 28 },
  { id: 'emp-prod-08', name: 'Colaborador de Producción 8', sector: 'PROD', totalDays: 28 },
  { id: 'emp-prod-09', name: 'Colaborador de Producción 9', sector: 'PROD', totalDays: 21 },
  { id: 'emp-prod-10', name: 'Colaborador de Producción 10', sector: 'PROD', totalDays: 21 },

  // SECTOR CYD (Carga y Descarga - 7 colaboradores)
  { id: 'emp-cyd-01', name: 'Colaborador de Carga y Descarga 1', sector: 'CYD', totalDays: 28 },
  { id: 'emp-cyd-02', name: 'Colaborador de Carga y Descarga 2', sector: 'CYD', totalDays: 21 },
  { id: 'emp-cyd-03', name: 'Colaborador de Carga y Descarga 3', sector: 'CYD', totalDays: 14 },
  { id: 'emp-cyd-04', name: 'Colaborador de Carga y Descarga 4', sector: 'CYD', totalDays: 28 },
  { id: 'emp-cyd-05', name: 'Colaborador de Carga y Descarga 5', sector: 'CYD', totalDays: 14 },
  { id: 'emp-cyd-06', name: 'Colaborador de Carga y Descarga 6', sector: 'CYD', totalDays: 14 },
  { id: 'emp-cyd-07', name: 'Colaborador de Carga y Descarga 7', sector: 'CYD', totalDays: 14 },

  // SECTOR MANT (Mantenimiento - 6 colaboradores: 3 con 14d, 2 con 21d, 1 con 28d)
  { id: 'emp-mant-01', name: 'Colaborador de Mantenimiento 1', sector: 'MANT', totalDays: 14 },
  { id: 'emp-mant-02', name: 'Colaborador de Mantenimiento 2', sector: 'MANT', totalDays: 14 },
  { id: 'emp-mant-03', name: 'Colaborador de Mantenimiento 3', sector: 'MANT', totalDays: 14 },
  { id: 'emp-mant-04', name: 'Colaborador de Mantenimiento 4', sector: 'MANT', totalDays: 21 },
  { id: 'emp-mant-05', name: 'Colaborador de Mantenimiento 5', sector: 'MANT', totalDays: 21 },
  { id: 'emp-mant-06', name: 'Colaborador de Mantenimiento 6', sector: 'MANT', totalDays: 28 },

  // SECTOR CAL (Calidad - 7 colaboradores: 3 con 14d, 4 con 21d)
  { id: 'emp-cal-01', name: 'Colaborador de Calidad 1', sector: 'CAL', totalDays: 14 },
  { id: 'emp-cal-02', name: 'Colaborador de Calidad 2', sector: 'CAL', totalDays: 14 },
  { id: 'emp-cal-03', name: 'Colaborador de Calidad 3', sector: 'CAL', totalDays: 14 },
  { id: 'emp-cal-04', name: 'Colaborador de Calidad 4', sector: 'CAL', totalDays: 21 },
  { id: 'emp-cal-05', name: 'Colaborador de Calidad 5', sector: 'CAL', totalDays: 21 },
  { id: 'emp-cal-06', name: 'Colaborador de Calidad 6', sector: 'CAL', totalDays: 21 },
  { id: 'emp-cal-07', name: 'Colaborador de Calidad 7', sector: 'CAL', totalDays: 21 },
];

export const DEFAULT_PLANT_CONFIG: PlantConfig = {
  plantName: 'Planta SFA',
  maxSimultaneousProd: 1, // Regla estricta: Dos personas de un mismo sector no pueden coincidir
  maxSimultaneousCyd: 1,  // Regla estricta: Dos personas de un mismo sector no pueden coincidir
  maxSimultaneousMant: 1, // Regla estricta: Dos personas de un mismo sector no pueden coincidir
  maxSimultaneousCal: 1,  // Regla estricta: Dos personas de un mismo sector no pueden coincidir
  allowAutoApproval: false, // Requiere proceso de revisión previo por supervisor
};

// Registros de vacaciones limpios para iniciar desde cero
export const INITIAL_REQUESTS: VacationRequest[] = [];
