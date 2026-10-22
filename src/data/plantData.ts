import { Employee, PlantConfig, VacationRequest } from '../types';

export const INITIAL_EMPLOYEES: Employee[] = [
  // SECTOR PROD (10 empleados)
  { id: 'emp-prod-01', name: 'AGUIRRE ALAN', sector: 'PROD', totalDays: 21 },
  { id: 'emp-prod-02', name: 'BROCHERO JORGE', sector: 'PROD', totalDays: 21 },
  { id: 'emp-prod-03', name: 'CUELLO ALEXIS', sector: 'PROD', totalDays: 21 },
  { id: 'emp-prod-04', name: 'DREISE DAMIAN GASTON', sector: 'PROD', totalDays: 28 },
  { id: 'emp-prod-05', name: 'FIGUEROA GARRIDO AXEL', sector: 'PROD', totalDays: 28 },
  { id: 'emp-prod-06', name: 'PARDI MARIO DAMIAN', sector: 'PROD', totalDays: 28 },
  { id: 'emp-prod-07', name: 'RODRIGUEZ JESUS MARIA', sector: 'PROD', totalDays: 28 },
  { id: 'emp-prod-08', name: 'SILVA NICOLAS LEONEL', sector: 'PROD', totalDays: 28 },
  { id: 'emp-prod-09', name: 'VAZQUEZ EDGARDO DANIEL', sector: 'PROD', totalDays: 21 },
  { id: 'emp-prod-10', name: 'VILLAFAÑE BRIAN', sector: 'PROD', totalDays: 21 },

  // SECTOR CYD (Carga y Descarga - 7 empleados)
  { id: 'emp-cyd-01', name: 'AGUIRRE RAMON ADRIAN', sector: 'CYD', totalDays: 28 },
  { id: 'emp-cyd-02', name: 'BALMACEDA ALEXIS', sector: 'CYD', totalDays: 21 },
  { id: 'emp-cyd-03', name: 'DUARTE LEONEL', sector: 'CYD', totalDays: 14 },
  { id: 'emp-cyd-04', name: 'GASTALDI JESUS IVAN', sector: 'CYD', totalDays: 28 },
  { id: 'emp-cyd-05', name: 'MOLINA BRUNO', sector: 'CYD', totalDays: 14 },
  { id: 'emp-cyd-06', name: 'MORENO GUSTAVO', sector: 'CYD', totalDays: 14 },
  { id: 'emp-cyd-07', name: 'STAM FABIAN', sector: 'CYD', totalDays: 14 },
];

export const DEFAULT_PLANT_CONFIG: PlantConfig = {
  plantName: 'Planta SFA',
  maxSimultaneousProd: 1, // Regla estricta: Dos personas de un mismo sector no pueden coincidir
  maxSimultaneousCyd: 1,  // Regla estricta: Dos personas de un mismo sector no pueden coincidir
  allowAutoApproval: false, // Requiere proceso de revisión previo por supervisor
};

// Registros de vacaciones limpios para iniciar desde cero
export const INITIAL_REQUESTS: VacationRequest[] = [];
