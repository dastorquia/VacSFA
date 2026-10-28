# Plan de Implementación: Gestión de Datos Reales en Firestore y Plantilla Genérica en GitHub

Este plan detalla la arquitectura y las herramientas para que los nombres reales de los colaboradores residan exclusivamente en la base de datos de **Firebase Firestore** y en respaldos locales privados del supervisor, manteniendo el repositorio público de **GitHub 100% anonimizado** con nombres genéricos.

---

## 1. Arquitectura de Separación y Privacidad

1. **Repositorio Público de GitHub**:
   - El archivo `src/data/plantData.ts` contendrá únicamente la plantilla predeterminada con nombres genéricos (`Colaborador de Producción 1`, `Colaborador de Carga y Descarga 1`, etc.).
   - Ningún nombre, DNI ni dato sensible se almacenará en archivos de código versionados en Git.

2. **Base de Datos en Tiempo Real (Firebase Firestore)**:
   - La colección `employees` en Firestore almacena los datos reales activos cargados por la supervisión.
   - Al abrir la aplicación web o móvil, el cliente consulta Firestore; si existen los datos reales, estos se muestran dinámicamente en pantalla sin tocar el repositorio de código.
   - Los datos en Firestore están vinculados a la instancia en la nube de la planta y no se publican en GitHub.

3. **Herramienta de Copia de Seguridad Privada (Importación / Exportación)**:
   - Panel de supervisión con exportación a archivo local (`.json` o `.csv`) que el supervisor guarda en su equipo personal.
   - Módulo de importación que permite cargar el archivo privado en cualquier momento y sincronizarlo instantáneamente con Firestore.
   - Opción de "Anonimizar / Modo Demostración" para restablecer a la plantilla genérica pública cuando se requiera tomar capturas o grabar demostraciones públicas.

---

## 2. Componentes y Flujos a Implementar

### A. Módulo de Respaldo Privado (`src/components/DataBackupModal.tsx`)
- **Exportar Respaldo**: Descarga instantánea de un archivo `dotacion_planta_sfa_privado.json` o `.csv` con la dotación actual, sectores, días asignados y solicitudes.
- **Importar Respaldo**: Selector de archivo con validación de estructura (nombres, sectores `PROD`, `CYD`, `MANT`, `CAL`, y días). Al confirmar, actualiza el estado y sincroniza automáticamente con Firestore.
- **Restablecer a Genérico (Plantilla GitHub)**: Permite volver a la dotación genérica en caso de necesitar mostrar la app a terceros.

### B. Integración en la Interfaz de Supervisión (`src/components/EmployeeTable.tsx` y `Header.tsx`)
- Botón destacado de **"Respaldo y Privacidad"** en la pestaña de *Dotación y Empleados* (solo visible para Supervisor).
- Indicador visual explicativo: *"Datos sensibles protegidos en Firestore · Repositorio GitHub anonimizado"*.
- Accesos directos para importar/exportar dotación en el menú de herramientas.

### C. Servicios de Sincronización y Validación (`src/services/firestoreSync.ts` y `src/utils/backupEngine.ts`)
- Funciones para importación por lote (`batch import`) hacia Firestore.
- Validación de integridad de datos para asegurar que los sectores y días cumplan las reglas de la planta.

---

## 3. Plan de Verificación

1. **Verificación de Código Público**:
   - Confirmar que `src/data/plantData.ts` mantiene únicamente nomenclaturas genéricas.
2. **Prueba de Exportación**:
   - Generar el archivo de respaldo con datos de prueba y verificar el formato JSON/CSV generado.
3. **Prueba de Importación y Sincronización en Tiempo Real**:
   - Cargar un archivo con nombres reales y constatar que se actualizan inmediatamente en pantalla y en Firestore.
4. **Prueba de Restablecimiento**:
   - Ejecutar la opción de restablecer a la plantilla pública y constatar que vuelve a los nombres genéricos en todos los dispositivos.
5. **Compilación y Linters**:
   - Ejecutar `compile_applet` y `lint_applet` para garantizar cero errores de TypeScript y empaquetado.
