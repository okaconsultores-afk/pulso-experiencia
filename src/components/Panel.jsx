import { useEffect, useMemo, useState } from 'react';
import QRCode from 'qrcode';
import {
  actualizarEvaluacion,
  escucharEvaluacion,
  escucharRespuestas,
  mensajeError,
  miUid,
  MODO_NUBE,
} from '../datos.js';
import { ANIMO, COLORES_MOMENTO, describirPromedio, respuestasDeMomento, resumirMomento } from '../animos.js';
import RuedaAnimos from './RuedaAnimos.jsx';
import { BarrasAnimos, BarrasApiladas, Cuadrantes, Trayectoria } from './Graficos.jsx';

function enlaceParticipar(codigo) {
  const base = window.location.href.split('#')[0];
  return `${base}#/e/${codigo}`;
}

export default function Panel({ codigo }) {
  const [ev, setEv] = useState(undefined);
  const [todas, setTodas] = useState([]);
  const [uid, setUid] = useState(null);
  const [error, setError] = useState('');
  const [pestana, setPestana] = useState(null);
  const [qr, setQr] = useState('');
  const [copiado, setCopiado] = useState(false);
  const [generando, setGenerando] = useState(false);
  const [verQR, setVerQR] = useState(false);

  useEffect(() => {
    miUid().then(setUid).catch((e) => setError(mensajeError(e)));
    const a = escucharEvaluacion(codigo, setEv, (e) => setError(mensajeError(e)));
    const b = escucharRespuestas(codigo, setTodas, (e) => setError(mensajeError(e)));
    return () => {
      a();
      b();
    };
  }, [codigo]);

  const enlace = enlaceParticipar(codigo);
  useEffect(() => {
    QRCode.toDataURL(enlace, { margin: 1, width: 480, color: { dark: '#122138', light: '#ffffff' } })
      .then(setQr)
      .catch(() => {});
  }, [enlace]);

  const momentos = ev?.momentos || [];
  const datos = useMemo(
    () =>
      momentos.map((m) => {
        const lista = respuestasDeMomento(todas, m.id);
        return { lista, resumen: resumirMomento(lista) };
      }),
    [momentos, todas]
  );

  useEffect(() => {
    if (ev && !pestana) {
      // Mostrar el último momento abierto
      const abiertos = momentos.filter((m) => m.abierto);
      setPestana((abiertos[abiertos.length - 1] || momentos[0])?.id || 'comparar');
    }
  }, [ev]); // eslint-disable-line react-hooks/exhaustive-deps

  if (error && ev === undefined)
    return (
      <div className="tarjeta mensaje">
        <h1>No se pudo conectar</h1>
        <p>{error}</p>
      </div>
    );
  if (ev === undefined) return <div className="cargando">Cargando…</div>;
  if (ev === null)
    return (
      <div className="tarjeta mensaje">
        <h1>No encontramos esa evaluación</h1>
        <p>Revisa el código “{codigo}”.</p>
        <a className="btn btn-primario" href="#/">
          Volver al inicio
        </a>
      </div>
    );

  const esDuenio = uid && ev.duenio === uid;
  const participantes = todas.filter((p) => p.r && Object.keys(p.r).length).length;

  async function cambiar(cambios) {
    setError('');
    try {
      await actualizarEvaluacion(codigo, cambios);
    } catch (e) {
      setError(mensajeError(e));
    }
  }
  const alternarMomento = (id) =>
    cambiar({ momentos: momentos.map((m) => (m.id === id ? { ...m, abierto: !m.abierto } : m)) });

  async function copiar() {
    try {
      await navigator.clipboard.writeText(enlace);
    } catch {
      const t = document.createElement('textarea');
      t.value = enlace;
      document.body.appendChild(t);
      t.select();
      document.execCommand('copy');
      t.remove();
    }
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  }

  async function descargarPDF() {
    setGenerando(true);
    try {
      const { generarPDF } = await import('../pdf.js');
      await generarPDF({ ev, codigo, datos, participantes, qr, enlace });
    } catch (e) {
      console.error(e);
      setError('No se pudo generar el PDF. Intenta de nuevo.');
    } finally {
      setGenerando(false);
    }
  }

  const iMomento = momentos.findIndex((m) => m.id === pestana);
  const actual = iMomento >= 0 ? datos[iMomento] : null;

  return (
    <div className="panel">
      <div className="panel-cabeza">
        <div>
          <p className="sobretitulo">Resultados {esDuenio ? '· Panel de quien facilita' : ''}</p>
          <h1>{ev.nombre}</h1>
          <p className="pregunta-sub">“{ev.pregunta}”</p>
          <p className="en-vivo">
            <span className="pulso" aria-hidden="true" />
            En vivo · <strong>{participantes}</strong> {participantes === 1 ? 'participante' : 'participantes'}
            {!MODO_NUBE && ' (demostración)'}
          </p>
        </div>
        <div className="panel-botones">
          <a className="btn btn-suave" href="#/" onClick={() => setTimeout(() => document.getElementById('crear')?.scrollIntoView({ behavior: 'smooth' }), 200)}>
            + Nueva evaluación
          </a>
          <button type="button" className="btn btn-primario" onClick={descargarPDF} disabled={generando}>
            {generando ? 'Generando PDF…' : '⤓ Descargar PDF'}
          </button>
        </div>
      </div>

      {error && <p className="error">{error}</p>}

      <div className="panel-arriba">
        <section className="tarjeta compartir">
          <h2>Invita al grupo</h2>
          <div className="compartir-cuerpo">
            {qr && (
              <button type="button" className="qr" onClick={() => setVerQR(true)} title="Ver en grande para proyectar">
                <img src={qr} alt="Código QR para participar" />
                <small>Ampliar</small>
              </button>
            )}
            <div className="compartir-datos">
              <p className="ayuda">Código</p>
              <p className="codigo-grande">{codigo}</p>
              <div className="enlace">
                <input readOnly value={enlace} onFocus={(e) => e.target.select()} aria-label="Enlace para participar" />
                <button type="button" className="btn btn-suave" onClick={copiar}>
                  {copiado ? '¡Copiado!' : 'Copiar'}
                </button>
              </div>
              <a className="enlace-secundario" href={`#/e/${codigo}`}>
                Abrir la vista de participante →
              </a>
            </div>
          </div>
        </section>

        <section className="tarjeta control">
          <h2>{esDuenio ? 'Abre y cierra los momentos' : 'Momentos'}</h2>
          <ul className="control-lista">
            {momentos.map((m, i) => (
              <li key={m.id}>
                <span className="num-momento" style={{ background: COLORES_MOMENTO[i] }}>
                  {i + 1}
                </span>
                <span className="control-nombre">
                  {m.nombre}
                  <small>
                    {datos[i].resumen.total} {datos[i].resumen.total === 1 ? 'respuesta' : 'respuestas'}
                  </small>
                </span>
                {esDuenio ? (
                  <button
                    type="button"
                    role="switch"
                    aria-checked={m.abierto}
                    className={`interruptor ${m.abierto ? 'on' : ''}`}
                    onClick={() => alternarMomento(m.id)}
                  >
                    <span>{m.abierto ? 'Abierto' : 'Cerrado'}</span>
                  </button>
                ) : (
                  <span className={`estado ${m.abierto ? 'on' : ''}`}>{m.abierto ? 'Abierto' : 'Cerrado'}</span>
                )}
              </li>
            ))}
          </ul>
          {esDuenio && (
            <label className="check">
              <input
                type="checkbox"
                checked={ev.resultadosVisibles !== false}
                onChange={(e) => cambiar({ resultadosVisibles: e.target.checked })}
              />
              <span>Participantes ven los resultados después de responder</span>
            </label>
          )}
          {esDuenio && (
            <p className="ayuda">
              Solo este navegador puede abrir y cerrar momentos. Para volver aquí, entra desde la página de inicio
              en “Mis evaluaciones”.
            </p>
          )}
        </section>
      </div>

      <div className="pestanas" role="tablist">
        {momentos.map((m, i) => (
          <button
            key={m.id}
            role="tab"
            aria-selected={pestana === m.id}
            className={pestana === m.id ? 'activa' : ''}
            onClick={() => setPestana(m.id)}
          >
            <span className="num-momento" style={{ background: COLORES_MOMENTO[i] }}>
              {i + 1}
            </span>
            {m.nombre}
            <small>{datos[i].resumen.total}</small>
          </button>
        ))}
        <button
          role="tab"
          aria-selected={pestana === 'comparar'}
          className={pestana === 'comparar' ? 'activa' : ''}
          onClick={() => setPestana('comparar')}
        >
          ⇄ Comparar momentos
        </button>
      </div>

      {actual && (
        <section className="tarjeta resultados">
          <div className="resultados-grid">
            <div>
              <RuedaAnimos modo="resultados" resumen={actual.resumen} />
            </div>
            <div className="resultados-lado">
              <h2>
                Momento {iMomento + 1}: {momentos[iMomento].nombre}
              </h2>
              <p className="tendencia">
                {actual.resumen.total === 0 ? (
                  'Aún no hay respuestas para este momento.'
                ) : (
                  <>
                    Más elegido:{' '}
                    <strong>{actual.resumen.predominantes.map((id) => ANIMO[id].etiqueta).join(' / ')}</strong>
                    <br />
                    {describirPromedio(actual.resumen.promedio)}
                  </>
                )}
              </p>
              <Cuadrantes resumen={actual.resumen} />
              <BarrasAnimos resumen={actual.resumen} />
            </div>
          </div>
          <Comentarios lista={actual.lista} />
        </section>
      )}

      {pestana === 'comparar' && (
        <section className="tarjeta comparar">
          <h2>Cómo cambió el ánimo del grupo</h2>
          <div className="comparar-grid">
            <Trayectoria momentos={momentos} resumenes={datos.map((d) => d.resumen)} />
            <BarrasApiladas momentos={momentos} resumenes={datos.map((d) => d.resumen)} />
          </div>
        </section>
      )}

      {verQR && (
        <div className="modal" role="dialog" aria-modal="true" onClick={() => setVerQR(false)}>
          <div className="modal-caja" onClick={(e) => e.stopPropagation()}>
            <h2>{ev.nombre}</h2>
            <img src={qr} alt="Código QR para participar" />
            <p className="codigo-grande">{codigo}</p>
            <p className="ayuda">Escanea con la cámara del celular o entra a la aplicación y escribe el código.</p>
            <button type="button" className="btn btn-primario" onClick={() => setVerQR(false)}>
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Comentarios({ lista }) {
  const con = lista.filter((r) => r.comentario || r.identificacion);
  if (!con.length) return null;
  return (
    <div className="comentarios">
      <h3>Lo que dicen ({con.length})</h3>
      <ul>
        {con
          .slice()
          .reverse()
          .map((r) => (
            <li key={r.uid} style={{ '--color': ANIMO[r.animo].color }}>
              <img src={ANIMO[r.animo].img} alt={ANIMO[r.animo].etiqueta} title={ANIMO[r.animo].etiqueta} />
              <div>
                {r.identificacion && (
                  <p className="coment-momento">
                    <b>El momento:</b> {r.identificacion}
                  </p>
                )}
                {r.comentario && <p>“{r.comentario}”</p>}
                <small>
                  {r.nombre || 'Anónimo'} · {ANIMO[r.animo].etiqueta}
                </small>
              </div>
            </li>
          ))}
      </ul>
    </div>
  );
}
