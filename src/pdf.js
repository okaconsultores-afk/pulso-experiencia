// Informe PDF (A4 vertical) dibujado con jsPDF: texto y gráficos vectoriales, pictogramas como imagen.
import { jsPDF } from 'jspdf';
import logoUrl from './assets/logo-okaic.png';
import {
  ANIMOS,
  ANIMO,
  CUADRANTES,
  COLORES_MOMENTO,
  CREDITO_PAM,
  describirPromedio,
  pct,
} from './animos.js';

const NAVY = '#122138';
const ROJO = '#D14E3A';
const NARANJA = '#E78338';
const CAFE = '#A25F4E';
const GRIS = '#6B7280';
const LINEA = '#E5E0DA';

const W = 210;
const H = 297;
const M = 16; // margen

function cargarImagen(url) {
  return new Promise((res, rej) => {
    const im = new Image();
    im.onload = () => res(im);
    im.onerror = rej;
    im.src = url;
  });
}

/** Miniatura redonda del pictograma (recorte del círculo de fondo). */
async function miniatura(animo, px = 220) {
  const im = await cargarImagen(animo.img);
  const g = animo.geo;
  const c = document.createElement('canvas');
  c.width = c.height = px;
  const x = c.getContext('2d');
  x.fillStyle = '#fff';
  x.fillRect(0, 0, px, px);
  x.save();
  x.beginPath();
  x.arc(px / 2, px / 2, px / 2, 0, Math.PI * 2);
  x.clip();
  const s = px / (2 * g.r);
  x.drawImage(im, (g.r - g.cx) * s, (g.r - g.cy) * s, g.w * s, g.h * s);
  x.restore();
  return c.toDataURL('image/png');
}

async function logo() {
  const im = await cargarImagen(logoUrl);
  const c = document.createElement('canvas');
  c.width = im.width;
  c.height = im.height;
  const x = c.getContext('2d');
  x.drawImage(im, 0, 0);
  return { data: c.toDataURL('image/png'), w: im.width, h: im.height };
}

function franja(doc, y, alto = 2.2) {
  const cols = [NARANJA, ROJO, CAFE, NAVY];
  const ancho = W / cols.length;
  cols.forEach((c, i) => {
    doc.setFillColor(c);
    doc.rect(i * ancho, y, ancho + 0.2, alto, 'F');
  });
}

function texto(doc, t, x, y, { size = 10, color = NAVY, bold = false, align = 'left', maxW } = {}) {
  doc.setFont('helvetica', bold ? 'bold' : 'normal');
  doc.setFontSize(size);
  doc.setTextColor(color);
  if (maxW) {
    const lineas = doc.splitTextToSize(String(t), maxW);
    doc.text(lineas, x, y, { align });
    return lineas.length * size * 0.3528 * 1.25;
  }
  doc.text(String(t), x, y, { align });
  return size * 0.3528 * 1.25;
}

function titulo(doc, t, y) {
  doc.setFillColor(ROJO);
  doc.rect(M, y - 4.2, 1.6, 5.6, 'F');
  texto(doc, t, M + 4, y, { size: 13, bold: true });
  return y + 7;
}

function cabeceraPagina(doc, lg, sub) {
  franja(doc, 0);
  const lw = 18;
  doc.addImage(lg.data, 'PNG', W - M - lw, 6, lw, (lw * lg.h) / lg.w, 'logo', 'FAST');
  texto(doc, 'Pulso de la experiencia · Pick-A-Mood', M, 12, { size: 8, color: GRIS });
  texto(doc, sub, M, 17, { size: 9, bold: true, maxW: W - 2 * M - 25 });
  doc.setDrawColor(LINEA);
  doc.setLineWidth(0.3);
  doc.line(M, 24, W - M, 24);
}

/** Rueda de ánimos con miniaturas y porcentajes. */
function rueda(doc, thumbs, resumen, cx, cy, R, d) {
  doc.setDrawColor('#9AA3B2');
  doc.setLineWidth(0.25);
  doc.setLineDashPattern([1, 1], 0);
  doc.circle(cx, cy, R, 'S');
  doc.line(cx - R + d / 2, cy, cx + R - d / 2, cy);
  doc.line(cx, cy - R + d / 2, cx, cy + R - d / 2);
  doc.setLineDashPattern([], 0);

  // Tendencia del grupo
  if (resumen.promedio) {
    const L = R - d / 2 - 3;
    const px = cx + resumen.promedio.x * L;
    const py = cy - resumen.promedio.y * L;
    doc.setDrawColor(ROJO);
    doc.setLineWidth(0.8);
    doc.line(cx, cy, px, py);
    doc.setFillColor(ROJO);
    doc.circle(px, py, 1.1, 'F');
  }
  doc.setFillColor('#ffffff');
  doc.setDrawColor(LINEA);
  doc.circle(cx, cy, 7, 'FD');
  texto(doc, String(resumen.total), cx, cy + 1.2, { size: 13, bold: true, align: 'center' });
  texto(doc, 'respuestas', cx, cy + 4.2, { size: 5.5, color: GRIS, align: 'center' });

  const max = Math.max(0, ...Object.values(resumen.conteo));
  for (const a of ANIMOS) {
    const t = (a.angulo * Math.PI) / 180;
    const x = cx + R * Math.cos(t);
    const y = cy - R * Math.sin(t);
    const n = resumen.conteo[a.id];
    const p = pct(n, resumen.total);
    doc.addImage(thumbs[a.id], 'PNG', x - d / 2, y - d / 2, d, d, 'pam-' + a.id, 'FAST');
    // anillo de porcentaje
    doc.setDrawColor(LINEA);
    doc.setLineWidth(1.1);
    doc.circle(x, y, d / 2 + 0.9, 'S');
    if (n > 0) {
      doc.setDrawColor(a.color);
      const pasos = Math.max(2, Math.round(p * 0.8));
      const ini = -Math.PI / 2;
      const fin = ini + (p / 100) * Math.PI * 2;
      let px = x + (d / 2 + 0.9) * Math.cos(ini);
      let py = y + (d / 2 + 0.9) * Math.sin(ini);
      for (let k = 1; k <= pasos; k++) {
        const ang = ini + ((fin - ini) * k) / pasos;
        const nx = x + (d / 2 + 0.9) * Math.cos(ang);
        const ny = y + (d / 2 + 0.9) * Math.sin(ang);
        doc.line(px, py, nx, ny);
        px = nx;
        py = ny;
      }
    }
    // insignia
    doc.setFillColor(n > 0 ? a.color : '#C9CDD4');
    doc.roundedRect(x + d / 2 - 7, y - d / 2 - 1.5, 10, 5, 2.4, 2.4, 'F');
    texto(doc, `${p}%`, x + d / 2 - 2, y - d / 2 + 2.1, { size: 7, bold: true, color: '#ffffff', align: 'center' });
    texto(doc, `${a.nombre} - ${a.nombre2.toLowerCase()}`, x, y + d / 2 + 4.2, {
      size: 6.8,
      bold: n === max && n > 0,
      align: 'center',
    });
    texto(doc, `${n} ${n === 1 ? 'persona' : 'personas'}`, x, y + d / 2 + 7.2, { size: 6, color: GRIS, align: 'center' });
  }
}

function trayectoria(doc, momentos, resumenes, cx, cy, R) {
  const q = [
    ['activoAgradable', 0, -1],
    ['activoDesagradable', -1, -1],
    ['calmaAgradable', 0, 0],
    ['calmaDesagradable', -1, 0],
  ];
  void q;
  doc.setFillColor('#FBF6F2');
  doc.setDrawColor('#9AA3B2');
  doc.setLineWidth(0.3);
  doc.circle(cx, cy, R, 'FD');
  doc.setLineDashPattern([1, 1], 0);
  doc.line(cx - R, cy, cx + R, cy);
  doc.line(cx, cy - R, cx, cy + R);
  doc.setLineDashPattern([], 0);
  for (const a of ANIMOS) {
    const t = (a.angulo * Math.PI) / 180;
    texto(doc, a.nombre, cx + (R + 7) * Math.cos(t), cy - (R + 7) * Math.sin(t) + 1, {
      size: 7,
      color: GRIS,
      align: 'center',
    });
  }
  texto(doc, 'activación alta', cx, cy - R - 2, { size: 6.5, color: GRIS, align: 'center' });
  texto(doc, 'activación baja', cx, cy + R + 4.5, { size: 6.5, color: GRIS, align: 'center' });

  const pts = resumenes
    .map((r, i) => (r.promedio ? { i, x: cx + r.promedio.x * R, y: cy - r.promedio.y * R } : null))
    .filter(Boolean);
  doc.setDrawColor(NAVY);
  doc.setLineWidth(0.6);
  for (let k = 1; k < pts.length; k++) {
    const a = pts[k - 1];
    const b = pts[k];
    doc.line(a.x, a.y, b.x, b.y);
    // punta de flecha
    const ang = Math.atan2(b.y - a.y, b.x - a.x);
    const ex = b.x - 3.2 * Math.cos(ang);
    const ey = b.y - 3.2 * Math.sin(ang);
    doc.setFillColor(NAVY);
    doc.triangle(
      ex,
      ey,
      ex - 2.2 * Math.cos(ang) + 1.1 * Math.sin(ang),
      ey - 2.2 * Math.sin(ang) - 1.1 * Math.cos(ang),
      ex - 2.2 * Math.cos(ang) - 1.1 * Math.sin(ang),
      ey - 2.2 * Math.sin(ang) + 1.1 * Math.cos(ang),
      'F'
    );
  }
  for (const p of pts) {
    doc.setFillColor(COLORES_MOMENTO[p.i]);
    doc.setDrawColor('#ffffff');
    doc.setLineWidth(0.5);
    doc.circle(p.x, p.y, 2.8, 'FD');
    texto(doc, String(p.i + 1), p.x, p.y + 1.1, { size: 7.5, bold: true, color: '#ffffff', align: 'center' });
  }
}

export async function generarPDF({ ev, codigo, datos, participantes, qr, enlace }) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const lg = await logo();
  const thumbs = {};
  await Promise.all(ANIMOS.map(async (a) => (thumbs[a.id] = await miniatura(a))));
  const fecha = new Date().toLocaleString('es', { dateStyle: 'long', timeStyle: 'short' });
  const momentos = ev.momentos;
  const resumenes = datos.map((d) => d.resumen);

  /* ---------------- Portada / resumen ---------------- */
  franja(doc, 0, 3);
  const lw = 34;
  doc.addImage(lg.data, 'PNG', W - M - lw, 10, lw, (lw * lg.h) / lg.w, 'logo', 'FAST');
  texto(doc, 'INFORME DE EVALUACIÓN DE LA EXPERIENCIA', M, 18, { size: 8.5, bold: true, color: ROJO });
  let y = 26;
  y += texto(doc, ev.nombre, M, y, { size: 20, bold: true, maxW: W - 2 * M - lw - 6 });
  y += 1;
  y += texto(doc, `Pregunta: “${ev.pregunta}”`, M, y, { size: 10, color: GRIS, maxW: W - 2 * M - lw - 6 });
  y = Math.max(y + 4, 10 + (lw * lg.h) / lg.w + 6);

  // Datos generales
  doc.setFillColor('#FBF6F2');
  doc.roundedRect(M, y, W - 2 * M, 18, 2, 2, 'F');
  const col = (W - 2 * M) / 4;
  const datosGen = [
    ['Participantes', String(participantes)],
    ['Momentos', String(momentos.length)],
    ['Código', codigo],
    ['Generado', fecha],
  ];
  datosGen.forEach(([k, v], i) => {
    texto(doc, k.toUpperCase(), M + 5 + i * col, y + 6.5, { size: 6.5, color: GRIS, bold: true });
    texto(doc, v, M + 5 + i * col, y + 12.5, { size: i === 3 ? 8 : 12, bold: true, maxW: col - 6 });
  });
  y += 27;

  y = titulo(doc, 'Resumen por momento', y);
  // Encabezado de tabla
  const cols = [M, M + 10, M + 62, M + 84, M + 135];
  texto(doc, '#', cols[0] + 2, y, { size: 7, color: GRIS, bold: true });
  texto(doc, 'MOMENTO', cols[1], y, { size: 7, color: GRIS, bold: true });
  texto(doc, 'RESPUESTAS', cols[2], y, { size: 7, color: GRIS, bold: true });
  texto(doc, 'MÁS ELEGIDO', cols[3], y, { size: 7, color: GRIS, bold: true });
  texto(doc, 'TENDENCIA DEL GRUPO', cols[4], y, { size: 7, color: GRIS, bold: true });
  y += 2.5;
  momentos.forEach((m, i) => {
    const r = resumenes[i];
    doc.setDrawColor(LINEA);
    doc.setLineWidth(0.3);
    doc.line(M, y, W - M, y);
    const yc = y + 7;
    doc.setFillColor(COLORES_MOMENTO[i]);
    doc.circle(cols[0] + 3, yc, 3, 'F');
    texto(doc, String(i + 1), cols[0] + 3, yc + 1.2, { size: 8, bold: true, color: '#fff', align: 'center' });
    texto(doc, m.nombre, cols[1], yc + 1.2, { size: 9.5, bold: true, maxW: 50 });
    texto(doc, String(r.total), cols[2] + 6, yc + 1.2, { size: 11, bold: true, align: 'center' });
    if (r.predominantes.length) {
      doc.addImage(thumbs[r.predominantes[0]], 'PNG', cols[3], yc - 5, 10, 10, 'pam-' + r.predominantes[0], 'FAST');
      const etq = r.predominantes.map((id) => ANIMO[id].etiqueta).join(' / ');
      texto(doc, etq, cols[3] + 12, yc - 0.3, { size: 8, bold: true, maxW: 38 });
      texto(doc, `${pct(r.conteo[r.predominantes[0]], r.total)}%`, cols[3] + 12, yc + 4, { size: 7, color: GRIS });
    } else {
      texto(doc, 'Sin respuestas', cols[3], yc + 1.2, { size: 8.5, color: GRIS });
    }
    texto(doc, describirPromedio(r.promedio), cols[4], yc + 1.2, { size: 8, maxW: W - M - cols[4] });
    y += 14;
  });
  doc.line(M, y, W - M, y);
  y += 10;

  y = titulo(doc, 'Cómo cambió el ánimo del grupo', y);
  const R = 34;
  trayectoria(doc, momentos, resumenes, M + R + 10, y + R + 6, R);
  // Barras apiladas a la derecha
  const bx = M + 2 * R + 30;
  const bw = W - M - bx;
  let by = y + 6;
  texto(doc, 'Distribución de respuestas por momento', bx, by, { size: 8, bold: true });
  by += 5;
  momentos.forEach((m, i) => {
    const r = resumenes[i];
    texto(doc, `${i + 1}. ${m.nombre}  (${r.total})`, bx, by + 1, { size: 7.5, maxW: bw });
    by += 2.5;
    doc.setFillColor('#F1EEEA');
    doc.rect(bx, by, bw, 6, 'F');
    let xx = bx;
    if (r.total) {
      for (const a of ANIMOS) {
        const n = r.conteo[a.id];
        if (!n) continue;
        const ancho = (n / r.total) * bw;
        doc.setFillColor(a.color);
        doc.rect(xx, by, ancho, 6, 'F');
        if (ancho > 8) texto(doc, `${pct(n, r.total)}%`, xx + ancho / 2, by + 4.1, { size: 6, bold: true, color: '#fff', align: 'center' });
        xx += ancho;
      }
    }
    by += 10;
  });
  // leyenda
  ANIMOS.forEach((a, k) => {
    const lx = bx + (k % 2) * (bw / 2);
    const ly = by + Math.floor(k / 2) * 4.5;
    doc.setFillColor(a.color);
    doc.rect(lx, ly - 2.4, 2.8, 2.8, 'F');
    texto(doc, a.etiqueta, lx + 4, ly, { size: 6.5 });
  });
  y += 2 * R + 20;
  texto(
    doc,
    'Cada punto numerado es el promedio del grupo en ese momento. Hacia la derecha hay más agrado y hacia arriba más activación. Cerca del borde el grupo coincide; cerca del centro está dividido.',
    M,
    y,
    { size: 7.5, color: GRIS, maxW: W - 2 * M }
  );

  /* ---------------- Una página por momento ---------------- */
  momentos.forEach((m, i) => {
    const { resumen: r, lista } = datos[i];
    doc.addPage();
    cabeceraPagina(doc, lg, ev.nombre);
    let yy = 34;
    doc.setFillColor(COLORES_MOMENTO[i]);
    doc.circle(M + 4, yy - 1.8, 4, 'F');
    texto(doc, String(i + 1), M + 4, yy - 0.4, { size: 10, bold: true, color: '#fff', align: 'center' });
    texto(doc, `Momento ${i + 1}: ${m.nombre}`, M + 11, yy, { size: 15, bold: true, maxW: W - 2 * M - 12 });
    yy += 6;
    texto(
      doc,
      r.total
        ? `${r.total} ${r.total === 1 ? 'respuesta' : 'respuestas'} · ${describirPromedio(r.promedio)}`
        : 'Sin respuestas para este momento',
      M + 11,
      yy,
      { size: 9, color: GRIS }
    );
    yy += 6;

    // Rueda
    const d = 20;
    const Rr = 40;
    rueda(doc, thumbs, r, W / 2, yy + Rr + d / 2 + 2, Rr, d);
    yy += 2 * Rr + d + 14;

    // Cuadrantes
    const orden = ['activoAgradable', 'activoDesagradable', 'calmaAgradable', 'calmaDesagradable'];
    const qw = (W - 2 * M - 9) / 4;
    orden.forEach((k, j) => {
      const x = M + j * (qw + 3);
      doc.setFillColor('#FBF6F2');
      doc.roundedRect(x, yy, qw, 14, 1.5, 1.5, 'F');
      doc.setFillColor(CUADRANTES[k].color);
      doc.rect(x, yy, 1.4, 14, 'F');
      texto(doc, `${pct(r.cuadrantes[k], r.total)}%`, x + 4, yy + 6.2, { size: 12, bold: true });
      texto(doc, CUADRANTES[k].nombre, x + 4, yy + 10.5, { size: 6, color: GRIS, maxW: qw - 6 });
    });
    yy += 21;

    // Tabla de frecuencias
    texto(doc, 'ESTADO DE ÁNIMO', M, yy, { size: 7, color: GRIS, bold: true });
    texto(doc, 'N', W - M - 22, yy, { size: 7, color: GRIS, bold: true, align: 'right' });
    texto(doc, '%', W - M, yy, { size: 7, color: GRIS, bold: true, align: 'right' });
    yy += 2;
    const maxN = Math.max(1, ...Object.values(r.conteo));
    for (const a of ANIMOS) {
      const n = r.conteo[a.id];
      doc.setDrawColor(LINEA);
      doc.setLineWidth(0.2);
      doc.line(M, yy, W - M, yy);
      doc.addImage(thumbs[a.id], 'PNG', M, yy + 0.6, 5.8, 5.8, 'pam-' + a.id, 'FAST');
      texto(doc, a.etiqueta, M + 8, yy + 4.6, { size: 8 });
      const x0 = M + 55;
      const ancho = W - M - 30 - x0;
      doc.setFillColor('#F1EEEA');
      doc.rect(x0, yy + 2, ancho, 3, 'F');
      doc.setFillColor(a.color);
      if (n) doc.rect(x0, yy + 2, (n / maxN) * ancho, 3, 'F');
      texto(doc, String(n), W - M - 22, yy + 4.6, { size: 8.5, bold: true, align: 'right' });
      texto(doc, `${pct(n, r.total)}%`, W - M, yy + 4.6, { size: 8.5, align: 'right' });
      yy += 6.5;
    }
    doc.line(M, yy, W - M, yy);
    yy += 9;

    // Comentarios
    const con = lista.filter((x) => x.comentario);
    if (con.length) {
      if (yy > H - 32) {
        doc.addPage();
        cabeceraPagina(doc, lg, `${ev.nombre} · Momento ${i + 1}: ${m.nombre}`);
        yy = 34;
      }
      yy = titulo(doc, `Lo que dijeron las personas (${con.length})`, yy);
      for (const c of con) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        const lineas = doc.splitTextToSize(`“${c.comentario}”`, W - 2 * M - 10);
        const alto = lineas.length * 4.1 + 6;
        if (yy + alto > H - 16) {
          doc.addPage();
          cabeceraPagina(doc, lg, `${ev.nombre} · Momento ${i + 1}: ${m.nombre} (comentarios)`);
          yy = 34;
        }
        doc.addImage(thumbs[c.animo], 'PNG', M, yy - 3.2, 6.5, 6.5, 'pam-' + c.animo, 'FAST');
        doc.setTextColor(NAVY);
        doc.text(lineas, M + 10, yy);
        texto(doc, `${c.nombre || 'Anónimo'} · ${ANIMO[c.animo].etiqueta}`, M + 10, yy + lineas.length * 4.1, {
          size: 7,
          color: GRIS,
        });
        yy += alto + 1.5;
      }
    }
  });

  /* ---------------- Pies de página ---------------- */
  const total = doc.getNumberOfPages();
  for (let p = 1; p <= total; p++) {
    doc.setPage(p);
    doc.setDrawColor(LINEA);
    doc.setLineWidth(0.3);
    doc.line(M, H - 12, W - M, H - 12);
    texto(doc, CREDITO_PAM, M, H - 7.5, { size: 6.5, color: GRIS, maxW: W - 2 * M - 25 });
    texto(doc, `Página ${p} de ${total}`, W - M, H - 7.5, { size: 7, color: GRIS, align: 'right' });
  }
  void qr;
  void enlace;

  const nombreArchivo = `pulso-${ev.nombre}`
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60);
  doc.save(`${nombreArchivo || 'resultados'}.pdf`);
}
