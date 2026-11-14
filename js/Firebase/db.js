import { db } from "./firebase-config.js";
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  orderBy
} from "https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";

const MOVEMENTS_COL = "movimientos";
const PROJECTS_COL = "proyectos";

// Escuchar movimientos en tiempo real
export function subscribeMovements(callback) {
  const q = query(collection(db, MOVEMENTS_COL), orderBy("date", "desc"));
  return onSnapshot(q, (snapshot) => {
    const items = [];
    snapshot.forEach((docSnap) => {
      items.push({ id: docSnap.id, ...docSnap.data() });
    });
    callback(items);
  });
}

// Escuchar proyectos en tiempo real
export function subscribeProjects(callback) {
  const q = query(collection(db, PROJECTS_COL), orderBy("name", "asc"));
  return onSnapshot(q, (snapshot) => {
    const items = [];
    snapshot.forEach((docSnap) => {
      items.push({ id: docSnap.id, ...docSnap.data() });
    });
    callback(items);
  });
}

// Crear movimiento
export async function addMovement(data) {
  await addDoc(collection(db, MOVEMENTS_COL), {
    ...data,
    createdAt: new Date().toISOString()
  });
}

// Actualizar movimiento
export async function updateMovement(id, data) {
  const ref = doc(db, MOVEMENTS_COL, id);
  await updateDoc(ref, {
    ...data,
    updatedAt: new Date().toISOString()
  });
}

// Eliminar movimiento
export async function removeMovement(id) {
  await deleteDoc(doc(db, MOVEMENTS_COL, id));
}

// Agregar proyecto
export async function addProject(name) {
  await addDoc(collection(db, PROJECTS_COL), {
    name,
    createdAt: new Date().toISOString()
  });
}

// Eliminar proyecto
export async function removeProject(id) {
  await deleteDoc(doc(db, PROJECTS_COL, id));
}