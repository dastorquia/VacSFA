import { 
  collection, 
  doc, 
  onSnapshot, 
  setDoc, 
  deleteDoc, 
  writeBatch, 
  getDocs 
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Employee, PlantConfig, VacationRequest } from '../types';
import { INITIAL_EMPLOYEES, DEFAULT_PLANT_CONFIG } from '../data/plantData';

const EMPLOYEES_COLLECTION = 'employees';
const REQUESTS_COLLECTION = 'vacation_requests';
const CONFIG_DOC = 'default';

/**
 * Subscribes to real-time updates for employees.
 * Automatically seeds the collection with INITIAL_EMPLOYEES on the first run.
 */
export function subscribeToEmployees(onData: (employees: Employee[]) => void): () => void {
  const colRef = collection(db, EMPLOYEES_COLLECTION);
  return onSnapshot(
    colRef,
    async (snapshot) => {
      if (snapshot.empty) {
        // Initial seed so that all devices have the standard plant roster
        try {
          const batch = writeBatch(db);
          for (const emp of INITIAL_EMPLOYEES) {
            const empRef = doc(db, EMPLOYEES_COLLECTION, emp.id);
            batch.set(empRef, emp);
          }
          await batch.commit();
        } catch (err) {
          console.error('Error seeding initial employees to Firestore:', err);
        }
        onData(INITIAL_EMPLOYEES);
      } else {
        const list: Employee[] = [];
        snapshot.forEach((docSnap) => {
          list.push(docSnap.data() as Employee);
        });
        // Sort by id / sector / name
        list.sort((a, b) => a.id.localeCompare(b.id));
        onData(list);
      }
    },
    (error) => {
      console.warn('Real-time employees listener error:', error);
    }
  );
}

/**
 * Subscribes to real-time updates for vacation requests.
 */
export function subscribeToRequests(onData: (requests: VacationRequest[]) => void): () => void {
  const colRef = collection(db, REQUESTS_COLLECTION);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const list: VacationRequest[] = [];
      snapshot.forEach((docSnap) => {
        list.push(docSnap.data() as VacationRequest);
      });
      // Sort newest first
      list.sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime());
      onData(list);
    },
    (error) => {
      console.warn('Real-time requests listener error:', error);
    }
  );
}

/**
 * Subscribes to real-time updates for plant configuration.
 */
export function subscribeToConfig(onData: (config: PlantConfig) => void): () => void {
  const docRef = doc(db, 'plant_config', CONFIG_DOC);
  return onSnapshot(
    docRef,
    async (docSnap) => {
      if (!docSnap.exists()) {
        try {
          await setDoc(docRef, DEFAULT_PLANT_CONFIG);
        } catch (err) {
          console.error('Error seeding plant config to Firestore:', err);
        }
        onData(DEFAULT_PLANT_CONFIG);
      } else {
        onData(docSnap.data() as PlantConfig);
      }
    },
    (error) => {
      console.warn('Real-time config listener error:', error);
    }
  );
}

/**
 * Saves or updates an employee in Firestore.
 */
export async function syncSaveEmployee(emp: Employee): Promise<void> {
  const empRef = doc(db, EMPLOYEES_COLLECTION, emp.id);
  await setDoc(empRef, emp, { merge: true });
}

/**
 * Deletes an employee from Firestore.
 */
export async function syncDeleteEmployee(empId: string): Promise<void> {
  const empRef = doc(db, EMPLOYEES_COLLECTION, empId);
  await deleteDoc(empRef);
}

/**
 * Saves or updates a vacation request in Firestore.
 */
export async function syncSaveRequest(req: VacationRequest): Promise<void> {
  const reqRef = doc(db, REQUESTS_COLLECTION, req.id);
  await setDoc(reqRef, req, { merge: true });
}

/**
 * Deletes a vacation request from Firestore.
 */
export async function syncDeleteRequest(reqId: string): Promise<void> {
  const reqRef = doc(db, REQUESTS_COLLECTION, reqId);
  await deleteDoc(reqRef);
}

/**
 * Updates plant configuration in Firestore.
 */
export async function syncUpdateConfig(cfg: PlantConfig): Promise<void> {
  const docRef = doc(db, 'plant_config', CONFIG_DOC);
  await setDoc(docRef, cfg, { merge: true });
}

/**
 * Restores initial plant data in Firestore.
 */
export async function syncResetAllData(): Promise<void> {
  // Clear requests
  const requestsSnap = await getDocs(collection(db, REQUESTS_COLLECTION));
  const batch1 = writeBatch(db);
  requestsSnap.forEach((d) => batch1.delete(d.ref));
  await batch1.commit();

  // Reset employees
  const empSnap = await getDocs(collection(db, EMPLOYEES_COLLECTION));
  const batch2 = writeBatch(db);
  empSnap.forEach((d) => batch2.delete(d.ref));
  for (const emp of INITIAL_EMPLOYEES) {
    batch2.set(doc(db, EMPLOYEES_COLLECTION, emp.id), emp);
  }
  await batch2.commit();

  // Reset config
  await setDoc(doc(db, 'plant_config', CONFIG_DOC), DEFAULT_PLANT_CONFIG);
}

/**
 * Bulk replaces employees in Firestore with an imported private backup roster.
 */
export async function syncBulkReplaceEmployees(newEmployees: Employee[], newRequests?: VacationRequest[]): Promise<void> {
  const empSnap = await getDocs(collection(db, EMPLOYEES_COLLECTION));
  const batch = writeBatch(db);

  // Delete current employees in Firestore
  empSnap.forEach((d) => batch.delete(d.ref));

  // Insert the new imported employees
  for (const emp of newEmployees) {
    batch.set(doc(db, EMPLOYEES_COLLECTION, emp.id), emp);
  }

  // If requests are included, optionally replace them
  if (newRequests && newRequests.length > 0) {
    const reqSnap = await getDocs(collection(db, REQUESTS_COLLECTION));
    reqSnap.forEach((d) => batch.delete(d.ref));
    for (const req of newRequests) {
      batch.set(doc(db, REQUESTS_COLLECTION, req.id), req);
    }
  }

  await batch.commit();
}
