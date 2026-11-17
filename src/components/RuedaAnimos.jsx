import { ANIMOS, pct } from '../animos.js';

const R = 34; // radio del círculo de posiciones (% del ancho)
const D = 21; // diámetro de cada pictograma (% del ancho)

function posicion(angulo) {
  const t = (angulo * Math.PI) / 180;
  return { x: 50 + R * Math.cos(t), y: 50 - R * Math.sin(t) };
}

/**
 * Disposición circular de Pick-A-Mood.
 * modo "elegir": botones para escoger un ánimo.
 * modo "resultados": muestra conteo y porcentaje de cada ánimo, y la tendencia del grupo.
 */
export default function RuedaAnimos({
  modo = 'elegir',
  seleccionado,
  onElegir,
  mostrarEtiquetas = true,
  resumen,
  deshabilitado = false,
  compacta = false,
}) {
  const total = resumen?.total || 0;
  const max = resumen ? Math.max(0, ...Object.values(resumen.conteo)) : 0;

  return (
    <div className={`rueda ${modo === 'resultados' ? 'rueda-resultados' : ''} ${compacta ? 'rueda-compacta' : ''}`}>
      <svg className="rueda-fondo" viewBox="0 0 100 100" aria-hidden="true">
        <circle cx="50" cy="50" r={R} className="rueda-orbita" />
        <line x1="50" y1="24" x2="50" y2="76" className="rueda-eje" />
        <line x1="24" y1="50" x2="76" y2="50" className="rueda-eje" />
        {modo === 'resultados' && resumen?.promedio && (
          <g className="rueda-tendencia">
            <line
              x1="50"
              y1="50"
              x2={50 + resumen.promedio.x * (R - D / 2 - 2)}
              y2={50 - resumen.promedio.y * (R - D / 2 - 2)}
            />
            <circle cx={50 + resumen.promedio.x * (R - D / 2 - 2)} cy={50 - resumen.promedio.y * (R - D / 2 - 2)} r="1.8" />
          </g>
        )}
        {modo === 'resultados' && (
          <g>
            <circle cx="50" cy="50" r="7.2" className="rueda-centro" />
            <text x="50" y="50.6" className="rueda-total">{total}</text>
            <text x="50" y="54.2" className="rueda-total-txt">{total === 1 ? 'respuesta' : 'respuestas'}</text>
          </g>
        )}
      </svg>

      {ANIMOS.map((a) => {
        const p = posicion(a.angulo);
        const g = a.geo;
        const n = resumen?.conteo[a.id] || 0;
        const porcentaje = pct(n, total);
        const elegido = seleccionado === a.id;
        const atenuado =
          (modo === 'elegir' && seleccionado && !elegido) || (modo === 'resultados' && total > 0 && n === 0);
        const estiloImg = {
          width: `${(g.w / (2 * g.r)) * 100}%`,
          left: `${(-(g.cx - g.r) / (2 * g.r)) * 100}%`,
          top: `${(-(g.cy - g.r) / (2 * g.r)) * 100}%`,
        };
        const contenido = (
          <>
            <img src={a.img} alt="" style={estiloImg} draggable="false" />
            {modo === 'resultados' && total > 0 && (
              <svg className="rueda-arco" viewBox="0 0 40 40" aria-hidden="true">
                <circle cx="20" cy="20" r="19" className="rueda-arco-fondo" />
                {n > 0 && <circle
                  cx="20"
                  cy="20"
                  r="19"
                  stroke={a.color}
                  strokeDasharray={`${(porcentaje / 100) * 119.38} 119.38`}
                  transform="rotate(-90 20 20)"
                />}
              </svg>
            )}
            {modo === 'resultados' && (
              <span
                className={`rueda-insignia ${n === max && n > 0 ? 'rueda-insignia-max' : ''}`}
                style={{ background: n > 0 ? a.color : undefined }}
              >
                {total > 0 ? `${porcentaje}%` : '0'}
              </span>
            )}
            {elegido && <span className="rueda-check" aria-hidden="true">✓</span>}
          </>
        );
        const estilo = {
          left: `${p.x - D / 2}%`,
          top: `${p.y - D / 2}%`,
          width: `${D}%`,
          '--color': a.color,
        };
        const etiqueta = (mostrarEtiquetas || modo === 'resultados') && (
          <span className="rueda-etiqueta" style={{ left: `${p.x}%`, top: `${p.y + D / 2 - 1.5}%` }}>
            {a.nombre}
            <span className="rueda-etiqueta-2"> {a.nombre2.toLowerCase()}</span>
            {modo === 'resultados' && <b className="rueda-n"> · {n}</b>}
          </span>
        );
        return (
          <div key={a.id}>
            {modo === 'elegir' ? (
              <button
                type="button"
                className={`rueda-item ${elegido ? 'elegido' : ''} ${atenuado ? 'atenuado' : ''}`}
                style={estilo}
                onClick={() => onElegir?.(a.id)}
                disabled={deshabilitado}
                aria-pressed={elegido}
                aria-label={a.etiqueta}
              >
                {contenido}
              </button>
            ) : (
              <div
                className={`rueda-item ${atenuado ? 'atenuado' : ''}`}
                style={estilo}
                title={`${a.etiqueta}: ${n} (${porcentaje}%)`}
                role="img"
                aria-label={`${a.etiqueta}: ${n} respuestas, ${porcentaje}%`}
              >
                {contenido}
              </div>
            )}
            {etiqueta}
          </div>
        );
      })}
    </div>
  );
}
