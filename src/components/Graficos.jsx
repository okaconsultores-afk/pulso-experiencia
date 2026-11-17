import { ANIMOS, CUADRANTES, COLORES_MOMENTO, pct } from '../animos.js';

/** Barras horizontales: una por ánimo, en el orden del círculo. */
export function BarrasAnimos({ resumen }) {
  const { total, conteo } = resumen;
  const max = Math.max(1, ...Object.values(conteo));
  return (
    <ul className="barras">
      {ANIMOS.map((a) => {
        const n = conteo[a.id];
        return (
          <li key={a.id}>
            <span className="barras-nombre">
              <span className="punto" style={{ background: a.color }} />
              {a.etiqueta}
            </span>
            <span className="barras-pista">
              <span className="barras-relleno" style={{ width: `${(n / max) * 100}%`, background: a.color }} />
            </span>
            <span className="barras-valor">
              {n} <small>({pct(n, total)}%)</small>
            </span>
          </li>
        );
      })}
    </ul>
  );
}

/** Los 4 grupos de ánimo (cuadrantes) en tarjetas. */
export function Cuadrantes({ resumen }) {
  const orden = ['activoDesagradable', 'activoAgradable', 'calmaDesagradable', 'calmaAgradable'];
  return (
    <div className="cuadrantes">
      {orden.map((k) => (
        <div key={k} className="cuadrante" style={{ '--color': CUADRANTES[k].color }}>
          <strong>{pct(resumen.cuadrantes[k], resumen.total)}%</strong>
          <span>{CUADRANTES[k].corto}</span>
        </div>
      ))}
    </div>
  );
}

/** Barra apilada por momento: cómo se reparte el grupo en cada momento. */
export function BarrasApiladas({ momentos, resumenes }) {
  return (
    <div className="apiladas">
      {momentos.map((m, i) => {
        const r = resumenes[i];
        return (
          <div key={m.id} className="apilada-fila">
            <div className="apilada-nombre">
              <span className="num-momento" style={{ background: COLORES_MOMENTO[i] }}>{i + 1}</span>
              <span>
                {m.nombre} <small>· {r.total} resp.</small>
              </span>
            </div>
            <div className="apilada-barra">
              {r.total === 0 && <span className="apilada-vacia">Sin respuestas todavía</span>}
              {ANIMOS.map((a) =>
                r.conteo[a.id] ? (
                  <span
                    key={a.id}
                    style={{ width: `${(r.conteo[a.id] / r.total) * 100}%`, background: a.color }}
                    title={`${a.etiqueta}: ${r.conteo[a.id]} (${pct(r.conteo[a.id], r.total)}%)`}
                  >
                    {pct(r.conteo[a.id], r.total) >= 9 ? `${pct(r.conteo[a.id], r.total)}%` : ''}
                  </span>
                ) : null
              )}
            </div>
          </div>
        );
      })}
      <div className="leyenda">
        {ANIMOS.map((a) => (
          <span key={a.id}>
            <span className="punto" style={{ background: a.color }} />
            {a.nombre}
          </span>
        ))}
      </div>
    </div>
  );
}

/** Mapa agrado–activación: punto promedio del grupo en cada momento y el recorrido entre ellos. */
export function Trayectoria({ momentos, resumenes }) {
  const S = 100;
  const c = S / 2;
  const rad = 40;
  const puntos = resumenes.map((r, i) =>
    r.promedio ? { i, x: c + r.promedio.x * rad, y: c - r.promedio.y * rad } : null
  );
  const validos = puntos.filter(Boolean);
  return (
    <div className="trayectoria">
      <svg viewBox="0 0 100 100" role="img" aria-label="Recorrido del ánimo del grupo entre momentos">
        <defs>
          <marker id="flecha" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="4" markerHeight="4" orient="auto">
            <path d="M0 0 L10 5 L0 10 z" fill="#122138" />
          </marker>
          <clipPath id="tray-clip">
            <circle cx={c} cy={c} r={rad} />
          </clipPath>
        </defs>
        <g clipPath="url(#tray-clip)">
        <rect x={c} y={c - rad} width={rad} height={rad} fill="#E78338" opacity="0.08" />
        <rect x={c - rad} y={c - rad} width={rad} height={rad} fill="#D14E3A" opacity="0.08" />
        <rect x={c} y={c} width={rad} height={rad} fill="#A25F4E" opacity="0.08" />
        <rect x={c - rad} y={c} width={rad} height={rad} fill="#122138" opacity="0.07" />
        </g>
        <circle cx={c} cy={c} r={rad} className="tray-circulo" />
        <line x1={c - rad} y1={c} x2={c + rad} y2={c} className="tray-eje" />
        <line x1={c} y1={c - rad} x2={c} y2={c + rad} className="tray-eje" />
        {ANIMOS.map((a) => {
          const t = (a.angulo * Math.PI) / 180;
          return (
            <text
              key={a.id}
              x={c + (rad + 5.5) * Math.cos(t)}
              y={c - (rad + 5.5) * Math.sin(t) + 1.2}
              className="tray-etq"
            >
              {a.nombre}
            </text>
          );
        })}
        <text x={c} y={c - rad - 1.5} className="tray-eje-txt">activación alta</text>
        <text x={c} y={c + rad + 3.5} className="tray-eje-txt">activación baja</text>
        {validos.slice(1).map((p, k) => (
          <line
            key={k}
            x1={validos[k].x}
            y1={validos[k].y}
            x2={p.x}
            y2={p.y}
            className="tray-linea"
            markerEnd="url(#flecha)"
          />
        ))}
        {validos.map((p) => (
          <g key={p.i}>
            <circle cx={p.x} cy={p.y} r="3.4" fill={COLORES_MOMENTO[p.i]} stroke="#fff" strokeWidth="0.8" />
            <text x={p.x} y={p.y + 1.25} className="tray-num">
              {p.i + 1}
            </text>
          </g>
        ))}
      </svg>
      <ol className="tray-leyenda">
        {momentos.map((m, i) => (
          <li key={m.id}>
            <span className="num-momento" style={{ background: COLORES_MOMENTO[i] }}>{i + 1}</span>
            {m.nombre}
            {!resumenes[i].promedio && <small> (sin respuestas)</small>}
          </li>
        ))}
      </ol>
      <p className="nota">
        Cada punto es el promedio del grupo en ese momento. Hacia la derecha, más agrado; hacia arriba, más
        activación. Cuanto más cerca del borde, más coincide el grupo; cerca del centro, el grupo está dividido.
      </p>
    </div>
  );
}
