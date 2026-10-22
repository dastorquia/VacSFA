import React from 'react';
import { Settings, Shield, AlertTriangle, CheckCircle2, RotateCcw, Save, Sliders, Info } from 'lucide-react';
import { PlantConfig } from '../types';

interface PlantRulesConfigProps {
  config: PlantConfig;
  onUpdateConfig: (newConfig: PlantConfig) => void;
  onResetData: () => void;
}

export const PlantRulesConfig: React.FC<PlantRulesConfigProps> = ({
  config,
  onUpdateConfig,
  onResetData,
}) => {
  const [localConfig, setLocalConfig] = React.useState<PlantConfig>(config);
  const [savedSuccess, setSavedSuccess] = React.useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateConfig(localConfig);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Title */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">
              Reglamento Operativo y Motor de Aprobación Automatizado
            </h2>
            <p className="text-xs text-slate-400">
              Parámetros de planta y validaciones automáticas de dotación para Producción (PROD) y Carga y Descarga (CYD)
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Hard Rules: Lunes, Múltiplo de 7 y No Coincidencia en Mismo Sector */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
            <Shield className="w-5 h-5 text-blue-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              1. Normativa Mandatoria de Planta (Reglas Operativas)
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Inicio en Día LUNES</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Todas las solicitudes deben comenzar indefectiblemente el día Lunes para sincronizar la diagramación semanal.
              </p>
              <div className="text-[11px] font-mono text-slate-500 bg-slate-900 px-2 py-1 rounded">
                getDay() === 1
              </div>
            </div>

            <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>MÚLTIPLOS DE 7 DÍAS</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Bloques semanales completos (7, 14, 21 o 28 días). Fin en domingo y reincorporación en el lunes siguiente.
              </p>
              <div className="text-[11px] font-mono text-slate-500 bg-slate-900 px-2 py-1 rounded">
                días % 7 === 0
              </div>
            </div>

            <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>SIN COINCIDENCIA EN SECTOR</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Dos personas de un mismo sector (PROD o CYD) <strong>no pueden coincidir</strong> con sus vacaciones en ninguna fecha.
              </p>
              <div className="text-[11px] font-mono text-amber-400/80 bg-slate-900 px-2 py-1 rounded">
                maxSimultáneo = 1 por sector
              </div>
            </div>
          </div>
        </div>

        {/* Quotas & Capacity Settings */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
            <Sliders className="w-5 h-5 text-blue-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              2. Capacidad y Control de Coincidencias por Sector
            </h3>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            Para respetar que dos personas del mismo sector no coincidan, el cupo máximo simultáneo por sector debe permanecer en <strong>1 colaborador</strong>. Si se programa una coincidencia, el motor automatizado la deriva a <strong>Revisión de Supervisor</strong>.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-500/20 text-sky-300">
                    Sector PROD
                  </span>
                  <div className="text-xs font-bold text-white mt-1">Producción (10 colaboradores)</div>
                </div>
                <div className="text-right">
                  <span className="text-xl font-bold font-mono text-blue-400">
                    {localConfig.maxSimultaneousProd}
                  </span>
                  <span className="text-[10px] text-slate-400 block">simultáneo (sin coincidencia)</span>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] text-slate-400 block">
                  Máximo de colaboradores simultáneos en vacaciones:
                </label>
                <input
                  type="number"
                  min="1"
                  max="3"
                  value={localConfig.maxSimultaneousProd}
                  onChange={(e) =>
                    setLocalConfig({ ...localConfig, maxSimultaneousProd: parseInt(e.target.value) || 1 })
                  }
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white font-mono focus:outline-none focus:border-blue-500"
                />
              </div>
              <p className="text-[11px] text-slate-500">
                Al fijar 1 colaborador, el sistema impide automáticamente que coincidan dos compañeros de Producción.
              </p>
            </div>

            <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300">
                    Sector CYD
                  </span>
                  <div className="text-xs font-bold text-white mt-1">Carga y Descarga (7 colaboradores)</div>
                </div>
                <div className="text-right">
                  <span className="text-xl font-bold font-mono text-emerald-400">
                    {localConfig.maxSimultaneousCyd}
                  </span>
                  <span className="text-[10px] text-slate-400 block">simultáneo (sin coincidencia)</span>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] text-slate-400 block">
                  Máximo de colaboradores simultáneos en vacaciones:
                </label>
                <input
                  type="number"
                  min="1"
                  max="3"
                  value={localConfig.maxSimultaneousCyd}
                  onChange={(e) =>
                    setLocalConfig({ ...localConfig, maxSimultaneousCyd: parseInt(e.target.value) || 1 })
                  }
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white font-mono focus:outline-none focus:border-blue-500"
                />
              </div>
              <p className="text-[11px] text-slate-500">
                Al fijar 1 colaborador, se garantiza la continuidad de tareas en rampas y muelles de Carga y Descarga.
              </p>
            </div>

            <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300">
                    Sector MANT
                  </span>
                  <div className="text-xs font-bold text-white mt-1">Mantenimiento (6 colaboradores)</div>
                </div>
                <div className="text-right">
                  <span className="text-xl font-bold font-mono text-amber-400">
                    {localConfig.maxSimultaneousMant ?? 1}
                  </span>
                  <span className="text-[10px] text-slate-400 block">simultáneo (sin coincidencia)</span>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] text-slate-400 block">
                  Máximo de colaboradores simultáneos en vacaciones:
                </label>
                <input
                  type="number"
                  min="1"
                  max="3"
                  value={localConfig.maxSimultaneousMant ?? 1}
                  onChange={(e) =>
                    setLocalConfig({ ...localConfig, maxSimultaneousMant: parseInt(e.target.value) || 1 })
                  }
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white font-mono focus:outline-none focus:border-blue-500"
                />
              </div>
              <p className="text-[11px] text-slate-500">
                Al fijar 1 colaborador, se asegura la disponibilidad técnica de guardia en Mantenimiento.
              </p>
            </div>

            <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-300">
                    Sector Cal
                  </span>
                  <div className="text-xs font-bold text-white mt-1">Calidad (7 colaboradores)</div>
                </div>
                <div className="text-right">
                  <span className="text-xl font-bold font-mono text-purple-400">
                    {localConfig.maxSimultaneousCal ?? 1}
                  </span>
                  <span className="text-[10px] text-slate-400 block">simultáneo (sin coincidencia)</span>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] text-slate-400 block">
                  Máximo de colaboradores simultáneos en vacaciones:
                </label>
                <input
                  type="number"
                  min="1"
                  max="3"
                  value={localConfig.maxSimultaneousCal ?? 1}
                  onChange={(e) =>
                    setLocalConfig({ ...localConfig, maxSimultaneousCal: parseInt(e.target.value) || 1 })
                  }
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white font-mono focus:outline-none focus:border-blue-500"
                />
              </div>
              <p className="text-[11px] text-slate-500">
                Al fijar 1 colaborador, se mantiene la cobertura continua de ensayos y liberación en Calidad.
              </p>
            </div>
          </div>
        </div>

        {/* Engine status & actions */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-xl p-4">
          <button
            type="button"
            onClick={onResetData}
            className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-400 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restablecer Datos de Planta Originales</span>
          </button>

          <div className="flex items-center gap-3">
            {savedSuccess && (
              <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" />
                Configuración guardada
              </span>
            )}
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-900/30 flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>Guardar Reglas</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
