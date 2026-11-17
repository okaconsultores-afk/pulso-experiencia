// Los 8 estados de ánimo de Pick-A-Mood (Desmet, Vastenburg & Romero, 2016), personaje robot.
// angulo: posición en el círculo, en grados matemáticos (0 = derecha/placer, 90 = arriba/activación alta).
// Cada estado queda en el centro de su octante, igual que en la representación circular del manual.
import emocionado from './assets/robots/emocionado.png';
import alegre from './assets/robots/alegre.png';
import relajado from './assets/robots/relajado.png';
import calmado from './assets/robots/calmado.png';
import sombrio from './assets/robots/sombrio.png';
import aburrido from './assets/robots/aburrido.png';
import irritado from './assets/robots/irritado.png';
import tenso from './assets/robots/tenso.png';

// Geometría de cada imagen (px): ancho, alto, centro y radio del círculo gris de fondo.
const geo = {
  sombrio: { w: 261, h: 287, cx: 130.0, cy: 155.6, r: 130 },
  irritado: { w: 261, h: 262, cx: 130.3, cy: 130.1, r: 130 },
  calmado: { w: 261, h: 397, cx: 130.3, cy: 154.6, r: 130 },
  alegre: { w: 426, h: 316, cx: 231.0, cy: 154.7, r: 130 },
  aburrido: { w: 261, h: 380, cx: 130.3, cy: 154.6, r: 130 },
  tenso: { w: 261, h: 304, cx: 130.3, cy: 163.1, r: 130 },
  emocionado: { w: 298, h: 307, cx: 150.7, cy: 173.9, r: 130 },
  relajado: { w: 282, h: 299, cx: 130.3, cy: 168.3, r: 130 },
};

export const CUADRANTES = {
  activoAgradable: { nombre: 'Activación alta · agradable', corto: 'Energía agradable', color: '#E78338' },
  activoDesagradable: { nombre: 'Activación alta · desagradable', corto: 'Energía desagradable', color: '#D14E3A' },
  calmaAgradable: { nombre: 'Activación baja · agradable', corto: 'Calma agradable', color: '#A25F4E' },
  calmaDesagradable: { nombre: 'Activación baja · desagradable', corto: 'Calma desagradable', color: '#122138' },
};

export const ANIMOS = [
  { id: 'emocionado', nombre: 'Emocionado', nombre2: 'Animado', angulo: 67.5, cuadrante: 'activoAgradable', color: '#E78338', img: emocionado },
  { id: 'alegre', nombre: 'Alegre', nombre2: 'Feliz', angulo: 22.5, cuadrante: 'activoAgradable', color: '#F2AE4B', img: alegre },
  { id: 'relajado', nombre: 'Relajado', nombre2: 'Despreocupado', angulo: -22.5, cuadrante: 'calmaAgradable', color: '#C99076', img: relajado },
  { id: 'calmado', nombre: 'Calmado', nombre2: 'Sereno', angulo: -67.5, cuadrante: 'calmaAgradable', color: '#A25F4E', img: calmado },
  { id: 'sombrio', nombre: 'Sombrío', nombre2: 'Triste', angulo: -112.5, cuadrante: 'calmaDesagradable', color: '#122138', img: sombrio },
  { id: 'aburrido', nombre: 'Aburrido', nombre2: 'Cansado', angulo: -157.5, cuadrante: 'calmaDesagradable', color: '#56688A', img: aburrido },
  { id: 'irritado', nombre: 'Irritado', nombre2: 'Molesto', angulo: 157.5, cuadrante: 'activoDesagradable', color: '#9E3123', img: irritado },
  { id: 'tenso', nombre: 'Tenso', nombre2: 'Nervioso', angulo: 112.5, cuadrante: 'activoDesagradable', color: '#D14E3A', img: tenso },
].map((a) => ({ ...a, geo: geo[a.id], etiqueta: `${a.nombre} - ${a.nombre2}` }));

export const ANIMO = Object.fromEntries(ANIMOS.map((a) => [a.id, a]));

export const COLORES_MOMENTO = ['#E78338', '#D14E3A', '#A25F4E', '#122138'];

/** Respuestas de un momento: lista de { animo, comentario, nombre }. */
export function respuestasDeMomento(respuestas, momentoId) {
  const lista = [];
  for (const p of respuestas) {
    const r = p.r?.[momentoId];
    if (r && ANIMO[r.animo]) lista.push({ ...r, nombre: p.nombre || '', uid: p.id, t: r.t || 0 });
  }
  return lista.sort((a, b) => (a.t || 0) - (b.t || 0));
}

/** Conteo por ánimo, por cuadrante y vector promedio (valencia, activación) de un momento. */
export function resumirMomento(lista) {
  const conteo = Object.fromEntries(ANIMOS.map((a) => [a.id, 0]));
  const cuadrantes = Object.fromEntries(Object.keys(CUADRANTES).map((k) => [k, 0]));
  let x = 0;
  let y = 0;
  for (const r of lista) {
    const a = ANIMO[r.animo];
    conteo[a.id] += 1;
    cuadrantes[a.cuadrante] += 1;
    x += Math.cos((a.angulo * Math.PI) / 180);
    y += Math.sin((a.angulo * Math.PI) / 180);
  }
  const total = lista.length;
  const max = Math.max(0, ...Object.values(conteo));
  const predominantes = max > 0 ? ANIMOS.filter((a) => conteo[a.id] === max).map((a) => a.id) : [];
  return {
    total,
    conteo,
    cuadrantes,
    predominantes,
    // Promedio de los vectores de cada respuesta: x = valencia (placer), y = activación. Ambos entre -1 y 1.
    promedio: total ? { x: x / total, y: y / total } : null,
  };
}

export function pct(n, total) {
  return total ? Math.round((n / total) * 100) : 0;
}

export function describirPromedio(p) {
  if (!p) return 'Sin respuestas';
  const fuerza = Math.hypot(p.x, p.y);
  if (fuerza < 0.2) return 'Grupo dividido (sin tendencia clara)';
  const val = p.x >= 0 ? 'agradable' : 'desagradable';
  const act = p.y >= 0 ? 'activación alta' : 'activación baja';
  return `Tendencia ${val}, ${act}`;
}

export const CREDITO_PAM =
  'Pick-A-Mood © Desmet, Vastenburg & Romero (2016), Delft University of Technology. Licencia CC BY-NC-ND.';
export const CREDITO_ILUSTRACIONES =
  'Ilustraciones adaptadas del trabajo de Pieter Desmet, elaboradas por Ángela Henao-Ortiz.';
export const URL_DESMET = 'https://www.tudelft.nl/io/over-io/personen/desmet-pma';
export const URL_GRUPLAC = 'https://scienti.minciencias.gov.co/gruplac/jsp/visualiza/visualizagr.jsp?nro=00000000021358';
