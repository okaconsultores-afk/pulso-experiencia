// Capa de datos. Con Firebase configurado usa Firestore (tiempo real entre dispositivos).
// Sin configuración usa el navegador (localStorage) en "modo demostración".
import { firebaseConfig } from './firebaseConfig.js';

export const MODO_NUBE = Boolean(firebaseConfig && firebaseConfig.apiKey && firebaseConfig.projectId);

const ALFABETO = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export function nuevoCodigo(n = 6) {
  const v = new Uint32Array(n);
  crypto.getRandomValues(v);
  return Array.from(v, (x) => ALFABETO[x % ALFABETO.length]).join('');
}

export function normalizarCodigo(c) {
  return String(c || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 12);
}

function leerLS(k, defecto) {
  try {
    const v = localStorage.getItem(k);
    return v ? JSON.parse(v) : defecto;
  } catch {
    return defecto;
  }
}
function escribirLS(k, v) {
  try {
    localStorage.setItem(k, JSON.stringify(v));
  } catch {
    /* sin almacenamiento */
  }
}

// Evaluaciones creadas en este navegador (para volver a ellas desde el inicio).
export function misEvaluaciones() {
  return leerLS('pam:mias', []);
}
function recordarEvaluacion(codigo, nombre) {
  const l = misEvaluaciones().filter((e) => e.codigo !== codigo);
  l.unshift({ codigo, nombre, creada: Date.now() });
  escribirLS('pam:mias', l.slice(0, 20));
}
export function olvidarEvaluacion(codigo) {
  escribirLS('pam:mias', misEvaluaciones().filter((e) => e.codigo !== codigo));
}

export function nombreGuardado() {
  return leerLS('pam:nombre', '');
}
export function guardarNombre(n) {
  escribirLS('pam:nombre', n);
}

/* ------------------------------------------------------------------ */
/* Modo nube: Firebase                                                 */
/* ------------------------------------------------------------------ */
let nube = null;
async function cargarNube() {
  if (nube) return nube;
  nube = (async () => {
    const [{ initializeApp }, auth, fs] = await Promise.all([
      import('firebase/app'),
      import('firebase/auth'),
      import('firebase/firestore'),
    ]);
    const app = initializeApp(firebaseConfig);
    const a = auth.getAuth(app);
    const db = fs.getFirestore(app);
    const uid = await new Promise((resolve, reject) => {
      const stop = auth.onAuthStateChanged(a, (u) => {
        if (u) {
          stop();
          resolve(u.uid);
        }
      });
      auth.signInAnonymously(a).catch((e) => {
        stop();
        reject(e);
      });
    });
    return { db, fs, uid };
  })();
  try {
    return await nube;
  } catch (e) {
    nube = null;
    throw e;
  }
}

/* ------------------------------------------------------------------ */
/* Modo demostración: navegador                                        */
/* ------------------------------------------------------------------ */
const canal = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('pam-demo') : null;
const oyentesLocales = new Set();
function avisarLocal() {
  oyentesLocales.forEach((f) => f());
  canal?.postMessage('cambio');
}
canal?.addEventListener('message', () => oyentesLocales.forEach((f) => f()));
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key?.startsWith('pam:')) oyentesLocales.forEach((f) => f());
  });
}
function uidLocal() {
  // Por pestaña: así se pueden simular varios participantes abriendo varias pestañas.
  try {
    let u = sessionStorage.getItem('pam:uid');
    if (!u) {
      u = 'demo-' + nuevoCodigo(10);
      sessionStorage.setItem('pam:uid', u);
    }
    return u;
  } catch {
    return 'demo-anon';
  }
}

/* ------------------------------------------------------------------ */
/* API común                                                           */
/* ------------------------------------------------------------------ */
export async function miUid() {
  if (!MODO_NUBE) return uidLocal();
  return (await cargarNube()).uid;
}

export async function crearEvaluacion({ nombre, pregunta, momentos, mostrarEtiquetas, resultadosVisibles }) {
  const base = {
    nombre,
    pregunta,
    momentos,
    mostrarEtiquetas,
    resultadosVisibles,
    creada: Date.now(),
  };
  if (!MODO_NUBE) {
    const codigo = nuevoCodigo();
    escribirLS(`pam:eval:${codigo}`, { ...base, duenio: uidLocal(), codigo });
    escribirLS(`pam:resp:${codigo}`, {});
    recordarEvaluacion(codigo, nombre);
    avisarLocal();
    return codigo;
  }
  const { db, fs, uid } = await cargarNube();
  for (let intento = 0; intento < 5; intento++) {
    const codigo = nuevoCodigo();
    try {
      // Las reglas impiden sobrescribir una evaluación ajena: si el código ya existe, falla y se reintenta.
      await fs.setDoc(fs.doc(db, 'evaluaciones', codigo), { ...base, duenio: uid, codigo });
      recordarEvaluacion(codigo, nombre);
      return codigo;
    } catch (e) {
      if (intento === 4) throw e;
    }
  }
  return null;
}

/** Escucha una evaluación. cb(evaluacion | null). Devuelve función para dejar de escuchar. */
export function escucharEvaluacion(codigo, cb, cbError) {
  if (!MODO_NUBE) {
    const leer = () => cb(leerLS(`pam:eval:${codigo}`, null));
    oyentesLocales.add(leer);
    leer();
    return () => oyentesLocales.delete(leer);
  }
  let stop = () => {};
  let activo = true;
  cargarNube()
    .then(({ db, fs }) => {
      if (!activo) return;
      stop = fs.onSnapshot(
        fs.doc(db, 'evaluaciones', codigo),
        (s) => cb(s.exists() ? s.data() : null),
        (e) => cbError?.(e)
      );
    })
    .catch((e) => cbError?.(e));
  return () => {
    activo = false;
    stop();
  };
}

/** Escucha todas las respuestas de una evaluación. cb([{ id, nombre, r: { momentoId: {animo, comentario, t} } }]). */
export function escucharRespuestas(codigo, cb, cbError) {
  if (!MODO_NUBE) {
    const leer = () => {
      const o = leerLS(`pam:resp:${codigo}`, {});
      cb(Object.entries(o).map(([id, d]) => ({ id, ...d })));
    };
    oyentesLocales.add(leer);
    leer();
    return () => oyentesLocales.delete(leer);
  }
  let stop = () => {};
  let activo = true;
  cargarNube()
    .then(({ db, fs }) => {
      if (!activo) return;
      stop = fs.onSnapshot(
        fs.collection(db, 'evaluaciones', codigo, 'respuestas'),
        (s) => cb(s.docs.map((d) => ({ id: d.id, ...d.data() }))),
        (e) => cbError?.(e)
      );
    })
    .catch((e) => cbError?.(e));
  return () => {
    activo = false;
    stop();
  };
}

/** Guarda (o cambia) la respuesta de la persona actual en un momento. */
export async function guardarRespuesta(codigo, momentoId, { animo, comentario, nombre }) {
  const r = { animo, comentario: (comentario || '').slice(0, 500), t: Date.now() };
  if (!MODO_NUBE) {
    const uid = uidLocal();
    const o = leerLS(`pam:resp:${codigo}`, {});
    const previo = o[uid] || { r: {} };
    o[uid] = { ...previo, nombre: (nombre || '').slice(0, 60), r: { ...previo.r, [momentoId]: r } };
    escribirLS(`pam:resp:${codigo}`, o);
    avisarLocal();
    return;
  }
  const { db, fs, uid } = await cargarNube();
  await fs.setDoc(
    fs.doc(db, 'evaluaciones', codigo, 'respuestas', uid),
    { nombre: (nombre || '').slice(0, 60), r: { [momentoId]: r } },
    { merge: true }
  );
}

/** Cambios de la persona que creó la evaluación (abrir/cerrar momentos, opciones). */
export async function actualizarEvaluacion(codigo, cambios) {
  if (!MODO_NUBE) {
    const e = leerLS(`pam:eval:${codigo}`, null);
    if (!e) return;
    escribirLS(`pam:eval:${codigo}`, { ...e, ...cambios });
    avisarLocal();
    return;
  }
  const { db, fs } = await cargarNube();
  await fs.updateDoc(fs.doc(db, 'evaluaciones', codigo), cambios);
}

export function mensajeError(e) {
  const c = e?.code || '';
  if (c.includes('permission-denied'))
    return 'No hay permiso para esta acción. Revisa que las reglas de Firestore estén publicadas.';
  if (c.includes('admin-restricted-operation') || c.includes('operation-not-allowed'))
    return 'Falta activar el acceso "Anónimo" en Firebase Authentication.';
  if (c.includes('unavailable') || c.includes('network')) return 'Sin conexión. Revisa tu internet e intenta de nuevo.';
  return 'Ocurrió un problema al conectar con la base de datos. Intenta de nuevo.';
}
