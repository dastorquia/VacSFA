import React, { useState, useRef } from 'react';
import { 
  X, 
  ShieldCheck, 
  Download, 
  Upload, 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  Lock, 
  RefreshCw, 
  FileSpreadsheet, 
  Database, 
  HelpCircle,
  EyeOff,
  GitBranch
} from 'lucide-react';
import { Employee, PlantConfig, VacationRequest } from '../types';
import { 
  downloadJsonBackup, 
  downloadCsvEmployees, 
  parseJsonBackup, 
  parseCsvEmployees,
  ImportResult 
} from '../utils/backupEngine';

interface DataBackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  employees: Employee[];
  requests: VacationRequest[];
  config: PlantConfig;
  onImportBackup: (importedEmployees: Employee[], importedRequests?: VacationRequest[]) => Promise<void>;
  onResetToGeneric: () => void;
}

export const DataBackupModal: React.FC<DataBackupModalProps> = ({
  isOpen,
  onClose,
  employees,
  requests,
  config,
  onImportBackup,
  onResetToGeneric,
}) => {
  const [activeTab, setActiveTab] = useState<'export' | 'import' | 'generic' | 'guide'>('export');
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportFile(file);
    setStatusMessage(null);

    const text = await file.text();
    const isJson = file.name.endsWith('.json');
    const isCsv = file.name.endsWith('.csv') || file.name.endsWith('.txt');

    if (isJson) {
      const res = parseJsonBackup(text);
      setImportResult(res);
    } else if (isCsv) {
      const res = parseCsvEmployees(text);
      setImportResult(res);
    } else {
      setImportResult({
        success: false,
        employees: [],
        errors: ['Formato no soportado. Por favor sube un archivo con extensión .json o .csv.'],
        warnings: [],
      });
    }
  };

  const handleConfirmImport = async () => {
    if (!importResult || !importResult.success || importResult.employees.length === 0) return;

    try {
      setIsProcessing(true);
      await onImportBackup(importResult.employees, importResult.requests);
      setStatusMessage({
        type: 'success',
        text: `¡Éxito! Se han cargado y sincronizado en Firestore ${importResult.employees.length} colaboradores reales.`,
      });
      setImportFile(null);
      setImportResult(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: `Error al sincronizar con Firestore: ${err.message || 'Error desconocido'}`,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div 
        className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-start justify-between bg-slate-850">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-tight">
                  Respaldo Privado y Privacidad de Datos
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-mono">
                  GitHub Seguro
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Los datos reales residen en Firebase Firestore y en tu equipo. El código en GitHub permanece 100% genérico.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-900/60 px-4 pt-2 gap-1 overflow-x-auto">
          <button
            onClick={() => {
              setActiveTab('export');
              setStatusMessage(null);
            }}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-t-lg transition-colors border-b-2 whitespace-nowrap ${
              activeTab === 'export'
                ? 'border-blue-500 text-blue-400 bg-slate-800/60'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Exportar Respaldo</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('import');
              setStatusMessage(null);
            }}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-t-lg transition-colors border-b-2 whitespace-nowrap ${
              activeTab === 'import'
                ? 'border-blue-500 text-blue-400 bg-slate-800/60'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Importar Datos</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('generic');
              setStatusMessage(null);
            }}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-t-lg transition-colors border-b-2 whitespace-nowrap ${
              activeTab === 'generic'
                ? 'border-blue-500 text-blue-400 bg-slate-800/60'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <EyeOff className="w-3.5 h-3.5" />
            <span>Plantilla GitHub</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('guide');
              setStatusMessage(null);
            }}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-t-lg transition-colors border-b-2 whitespace-nowrap ${
              activeTab === 'guide'
                ? 'border-blue-500 text-blue-400 bg-slate-800/60'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>¿Cómo funciona?</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1 text-xs">
          {statusMessage && (
            <div
              className={`p-3 rounded-xl border flex items-center gap-2.5 ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
                  : 'bg-rose-950/40 border-rose-800/60 text-rose-300'
              }`}
            >
              {statusMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 shrink-0" />
              )}
              <span>{statusMessage.text}</span>
            </div>
          )}

          {/* TAB 1: EXPORT */}
          {activeTab === 'export' && (
            <div className="space-y-4">
              <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-white text-sm flex items-center gap-2">
                    <Database className="w-4 h-4 text-blue-400" />
                    <span>Dotación Actual en Planta</span>
                  </div>
                  <span className="text-xs font-mono text-slate-300 bg-slate-900 px-2 py-0.5 rounded">
                    {employees.length} Colaboradores
                  </span>
                </div>

                <p className="text-slate-300 text-xs leading-relaxed">
                  Genera una copia de seguridad local de los colaboradores, sectores y días registrados actualmente. 
                  Guarda este archivo en tu computadora privada.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <button
                    onClick={() => downloadJsonBackup(employees, requests, config)}
                    className="flex items-center justify-center gap-2 p-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-all shadow-md active:scale-95 cursor-pointer"
                  >
                    <FileText className="w-4 h-4" />
                    <span>Descargar Respaldo JSON</span>
                  </button>

                  <button
                    onClick={() => downloadCsvEmployees(employees)}
                    className="flex items-center justify-center gap-2 p-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-600 text-white font-semibold rounded-xl transition-all active:scale-95 cursor-pointer"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                    <span>Descargar Dotación en CSV</span>
                  </button>
                </div>
              </div>

              <div className="bg-amber-950/30 border border-amber-800/50 rounded-xl p-3.5 text-amber-300 flex items-start gap-2.5">
                <Lock className="w-4 h-4 shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <strong>Recomendación de Seguridad:</strong> Este archivo contendrá los nombres reales de la dotación. 
                  <strong>No lo subas a GitHub</strong> ni lo incluyas en repositorios públicos. Almacénalo en tu disco local o red segura.
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: IMPORT */}
          {activeTab === 'import' && (
            <div className="space-y-4">
              <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4 space-y-3">
                <div className="font-bold text-white text-sm flex items-center gap-2">
                  <Upload className="w-4 h-4 text-blue-400" />
                  <span>Cargar Dotación Real desde Archivo</span>
                </div>
                <p className="text-slate-300 text-xs leading-relaxed">
                  Sube un archivo de respaldo previo (<code>.json</code>) o una planilla (<code>.csv</code>) con las columnas 
                  <code>name</code>, <code>sector</code> y <code>totalDays</code>. Los datos se guardarán directamente en Firestore 
                  y se actualizarán en tiempo real en todos tus dispositivos.
                </p>

                {/* Upload Input Area */}
                <div className="border-2 border-dashed border-slate-700 hover:border-blue-500 rounded-xl p-6 text-center transition-colors bg-slate-900/50">
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept=".json,.csv,.txt"
                    onChange={handleFileChange}
                    className="hidden"
                    id="backup-file-upload"
                  />
                  <label
                    htmlFor="backup-file-upload"
                    className="cursor-pointer flex flex-col items-center gap-2"
                  >
                    <div className="w-12 h-12 rounded-full bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                      <Upload className="w-6 h-6" />
                    </div>
                    <span className="font-semibold text-slate-200 text-sm">
                      {importFile ? importFile.name : 'Haz clic para seleccionar tu archivo de respaldo'}
                    </span>
                    <span className="text-slate-500 text-[11px]">
                      Soporta archivos .JSON y .CSV
                    </span>
                  </label>
                </div>

                {/* Preview / Validation Results */}
                {importResult && (
                  <div className="mt-4 space-y-2">
                    {importResult.success ? (
                      <div className="p-3 bg-emerald-950/40 border border-emerald-800/60 rounded-xl text-emerald-300 space-y-1">
                        <div className="font-bold flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Archivo válido: {importResult.employees.length} colaboradores listos para sincronizar</span>
                        </div>
                        <div className="text-[11px] text-emerald-400/90 font-mono">
                          PROD: {importResult.employees.filter((e) => e.sector === 'PROD').length} · 
                          CYD: {importResult.employees.filter((e) => e.sector === 'CYD').length} · 
                          MANT: {importResult.employees.filter((e) => e.sector === 'MANT').length} · 
                          Cal: {importResult.employees.filter((e) => e.sector === 'CAL').length}
                        </div>
                      </div>
                    ) : (
                      <div className="p-3 bg-rose-950/40 border border-rose-800/60 rounded-xl text-rose-300 space-y-1">
                        <div className="font-bold flex items-center gap-1.5">
                          <AlertTriangle className="w-4 h-4" />
                          <span>No se pudo procesar el archivo</span>
                        </div>
                        <ul className="list-disc list-inside text-[11px] space-y-0.5 text-rose-400">
                          {importResult.errors.map((err, i) => (
                            <li key={i}>{err}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {importResult.success && (
                      <button
                        onClick={handleConfirmImport}
                        disabled={isProcessing}
                        className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold rounded-xl transition-all shadow-lg shadow-emerald-900/30 flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                      >
                        {isProcessing ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            <span>Sincronizando con Firestore...</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Confirmar e Importar a Firestore</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: GENERIC TEMPLATE */}
          {activeTab === 'generic' && (
            <div className="space-y-4">
              <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4 space-y-3">
                <div className="font-bold text-white text-sm flex items-center gap-2">
                  <GitBranch className="w-4 h-4 text-purple-400" />
                  <span>Plantilla Pública de GitHub (Modo Anonimizado)</span>
                </div>
                <p className="text-slate-300 text-xs leading-relaxed">
                  Si vas a grabar un video demostrativo, compartir capturas de pantalla de la aplicación o hacer una presentación pública, 
                  puedes restablecer la base de datos a la <strong>plantilla genérica predeterminada</strong> con nombres anónimos 
                  (<em>Colaborador de Producción 1</em>, <em>Colaborador de Carga y Descarga 1</em>, etc.).
                </p>

                <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 font-mono text-[11px] text-slate-400 space-y-1">
                  <div>· 10 Colaboradores de Producción (PROD)</div>
                  <div>· 7 Colaboradores de Carga y Descarga (CYD)</div>
                  <div>· 6 Colaboradores de Mantenimiento (MANT)</div>
                  <div>· 7 Colaboradores de Calidad (Cal)</div>
                </div>

                <button
                  onClick={() => {
                    if (window.confirm('¿Deseas restablecer la base de datos a la plantilla anónima de GitHub? Te sugerimos exportar un respaldo previo si aún no lo has hecho.')) {
                      onResetToGeneric();
                      setStatusMessage({
                        type: 'success',
                        text: 'Se restableció la dotación a la plantilla genérica pública de GitHub.',
                      });
                    }
                  }}
                  className="w-full py-2.5 px-4 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl transition-all shadow-md shadow-purple-900/30 flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Restablecer a Plantilla Genérica Pública</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 4: PRIVACY ARCHITECTURE GUIDE */}
          {activeTab === 'guide' && (
            <div className="space-y-3 bg-slate-800/60 border border-slate-700/60 rounded-xl p-4 text-xs">
              <h4 className="font-bold text-white text-sm flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-blue-400" />
                <span>¿Cómo se garantiza que GitHub nunca tenga datos reales?</span>
              </h4>

              <div className="space-y-3 text-slate-300 leading-relaxed pt-2">
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 font-bold flex items-center justify-center shrink-0 text-[11px]">
                    1
                  </span>
                  <div>
                    <strong className="text-white">Código en GitHub 100% Genérico:</strong> El código versionado en el archivo <code>src/data/plantData.ts</code> solo contiene la plantilla de nombres genéricos numerados.
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center shrink-0 text-[11px]">
                    2
                  </span>
                  <div>
                    <strong className="text-white">Base de Datos en Firestore (Nube):</strong> Cuando modificas o importas los colaboradores reales, estos se guardan directamente en tu base de datos de Firebase Firestore (no en archivos de git).
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 font-bold flex items-center justify-center shrink-0 text-[11px]">
                    3
                  </span>
                  <div>
                    <strong className="text-white">Sincronización en Tiempo Real:</strong> Cuando un supervisor o colaborador abre la app web o móvil, el sistema consulta Firestore y muestra los nombres reales sin que estos existan en GitHub.
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center shrink-0 text-[11px]">
                    4
                  </span>
                  <div>
                    <strong className="text-white">Respaldos Privados:</strong> Mediante los botones de esta ventana puedes descargar tu copia de seguridad local (JSON o CSV) en cualquier momento para resguardarla en tu disco seguro.
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 bg-slate-850 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>Plantel actual: <strong>{employees.length}</strong> colaboradores</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-medium transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
