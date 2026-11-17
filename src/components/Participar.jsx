import { useEffect, useMemo, useRef, useState } from 'react';
import {
  escucharEvaluacion,
  escucharRespuestas,
  guardarRespuesta,
  guardarNombre,
  mensajeError,
  miUid,
  nombreGuardado,
} from '../datos.js';
import { ANIMO, respuestasDeMomento, resumirMomento } from '../animos.js';
import RuedaAnimos from './RuedaAnimos.jsx';

export default function Participar({ codigo }) {
  const [ev, setEv] = useState(undefined); // undefined = cargando, null = no existe
  const [todas, setTodas] = useState([]);
  const [uid, setUid] = useState(null);
  const [error, setError] = useState('');
  const [nombre, setNombre] = useState(nombreGuardado);
  const [sel, setSel] = useState(null); // id del momento visible
  const [eleccion, setEleccion] = useState(null);
  const [comentario, setComentario] = useState('');
  const [editando, setEditando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [aviso, setAviso] = useState('');
  const abiertosAntes = useRef(null);

  useEffect(() => {
    miUid().then(setUid).catch((e) => setError(mensajeError(e)));
    const a = escucharEvaluacion(codigo, setEv, (e) => setError(mensajeError(e)));
    const b = escucharRespuestas(codigo, setTodas, (e) => setError(mensajeError(e)));
    return () => {
      a();
      b();
    };
  }, [codigo]);

  const mias = useMemo(() => todas.find((p) => p.id === uid)?.r || {}, [todas, uid]);
  const momentos = ev?.momentos || [];

  // Elegir automáticamente el momento: el primero abierto sin responder.
  // Si quien facilita abre un momento nuevo, se salta a él (si no se está editando).
  useEffect(() => {
    if (!ev) return;
    const abiertos = momentos.filter((m) => m.abierto).map((m) => m.id);
    const nuevos = abiertosAntes.current ? abiertos.filter((id) => !abiertosAntes.current.includes(id)) : [];
    abiertosAntes.current = abiertos;
    const pendiente = momentos.find((m) => m.abierto && !mias[m.id]);
    if (nuevos.length && !editando && !eleccion) {
      setSel(nuevos[0]);
      const m = momentos.find((x) => x.id === nuevos[0]);
      setAviso(`Se abrió el momento “${m?.nombre}”.`);
      return;
    }
    if (!sel || !momentos.some((m) => m.id === sel)) {
      setSel((pendiente || momentos.find((m) => m.abierto) || momentos[0])?.id || null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ev, uid, todas.length]);

  useEffect(() => {
    if (!aviso) return;
    const t = setTimeout(() => setAviso(''), 5000);
    return () => clearTimeout(t);
  }, [aviso]);

  if (error && ev === undefined) return <Mensaje titulo="No se pudo conectar" texto={error} />;
  if (ev === undefined) return <div className="cargando">Cargando…</div>;
  if (ev === null)
    return (
      <Mensaje
        titulo="No encontramos esa evaluación"
        texto={`Revisa el código “${codigo}”. Debe ser el mismo que te compartió quien facilita.`}
      />
    );

  const idx = momentos.findIndex((m) => m.id === sel);
  const momento = momentos[idx];
  const miRespuesta = momento ? mias[momento.id] : null;
  const respondidos = momentos.filter((m) => mias[m.id]).length;
  const siguiente = momentos.find((m, i) => i > idx && m.abierto && !mias[m.id]);
  const mostrandoFormulario = momento?.abierto && (!miRespuesta || editando);

  function cambiarMomento(id) {
    setSel(id);
    setEleccion(null);
    setComentario('');
    setEditando(false);
  }

  async function enviar() {
    if (!eleccion || !momento) return;
    setGuardando(true);
    setError('');
    try {
      guardarNombre(nombre.trim());
      await guardarRespuesta(codigo, momento.id, { animo: eleccion, comentario: comentario.trim(), nombre: nombre.trim() });
      setEditando(false);
      setEleccion(null);
      setComentario('');
    } catch (e) {
      console.error(e);
      setError(mensajeError(e));
    } finally {
      setGuardando(false);
    }
  }

  const resumen = momento ? resumirMomento(respuestasDeMomento(todas, momento.id)) : null;

  return (
    <div className="participar">
      <div className="participar-cabeza">
        <p className="sobretitulo">Evaluación de la experiencia</p>
        <h1>{ev.nombre}</h1>
        <label className="campo campo-nombre">
          <span>Tu nombre o seudónimo (opcional)</span>
          <input
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            onBlur={() => guardarNombre(nombre.trim())}
            maxLength={60}
            placeholder="Puedes dejarlo en blanco"
          />
        </label>
      </div>

      <nav className="momentos-nav" aria-label="Momentos">
        {momentos.map((m, i) => {
          const hecho = Boolean(mias[m.id]);
          return (
            <button
              key={m.id}
              type="button"
              className={`momento-chip ${m.id === sel ? 'activo' : ''} ${hecho ? 'hecho' : ''} ${m.abierto ? '' : 'cerrado'}`}
              onClick={() => cambiarMomento(m.id)}
              aria-current={m.id === sel ? 'step' : undefined}
            >
              <span className="num-momento">{hecho ? '✓' : i + 1}</span>
              <span className="momento-chip-txt">
                {m.nombre}
                <small>{hecho ? 'Respondido' : m.abierto ? 'Abierto' : 'Aún cerrado'}</small>
              </span>
            </button>
          );
        })}
      </nav>
      <p className="progreso-txt">
        Has respondido {respondidos} de {momentos.length} momentos.
      </p>

      {aviso && <div className="toast" role="status">{aviso}</div>}

      {momento && !momento.abierto && !miRespuesta && (
        <div className="tarjeta espera">
          <div className="espera-icono" aria-hidden="true">⏳</div>
          <h2>“{momento.nombre}” aún no está abierto</h2>
          <p>Cuando quien facilita lo abra, aparecerá aquí automáticamente. No necesitas recargar la página.</p>
        </div>
      )}

      {mostrandoFormulario && (
        <section className="tarjeta responder">
          <p className="sobretitulo">
            Momento {idx + 1}: {momento.nombre}
          </p>
          <h2 className="pregunta">{ev.pregunta}</h2>
          <p className="ayuda">Toca el robot que mejor representa cómo te sientes.</p>
          <RuedaAnimos
            modo="elegir"
            seleccionado={eleccion}
            onElegir={setEleccion}
            mostrarEtiquetas={ev.mostrarEtiquetas !== false}
          />
          <div className={`responder-pie ${eleccion ? 'visible' : ''}`}>
            {eleccion && (
              <p className="elegido-txt">
                Elegiste: <strong>{ANIMO[eleccion].etiqueta}</strong>
              </p>
            )}
            <label className="campo">
              <span>¿Quieres contar por qué? (opcional)</span>
              <textarea
                value={comentario}
                onChange={(e) => setComentario(e.target.value)}
                rows={2}
                maxLength={500}
                placeholder="Escribe con tus palabras cómo te sientes…"
              />
            </label>
            {error && <p className="error">{error}</p>}
            <div className="fila fila-fin">
              {editando && (
                <button type="button" className="btn btn-suave" onClick={() => setEditando(false)}>
                  Cancelar
                </button>
              )}
              <button type="button" className="btn btn-primario btn-grande" disabled={!eleccion || guardando} onClick={enviar}>
                {guardando ? 'Enviando…' : eleccion ? 'Enviar respuesta' : 'Elige un robot'}
              </button>
            </div>
          </div>
        </section>
      )}

      {miRespuesta && !mostrandoFormulario && (
        <section className="tarjeta gracias">
          <div className="gracias-fila">
            <div className="gracias-robot" style={{ '--color': ANIMO[miRespuesta.animo].color }}>
              <img src={ANIMO[miRespuesta.animo].img} alt="" />
            </div>
            <div>
              <p className="sobretitulo">
                Momento {idx + 1}: {momento.nombre}
              </p>
              <h2>¡Gracias! Tu respuesta quedó registrada.</h2>
              <p>
                Elegiste <strong>{ANIMO[miRespuesta.animo].etiqueta}</strong>
                {miRespuesta.comentario ? <> y escribiste: “{miRespuesta.comentario}”</> : '.'}
              </p>
              <div className="fila">
                {momento.abierto && (
                  <button
                    type="button"
                    className="btn btn-suave"
                    onClick={() => {
                      setEditando(true);
                      setEleccion(miRespuesta.animo);
                      setComentario(miRespuesta.comentario || '');
                    }}
                  >
                    Cambiar mi respuesta
                  </button>
                )}
                {siguiente && (
                  <button type="button" className="btn btn-primario" onClick={() => cambiarMomento(siguiente.id)}>
                    Ir a “{siguiente.nombre}” →
                  </button>
                )}
              </div>
              {!siguiente && respondidos < momentos.length && (
                <p className="ayuda">Los demás momentos se abrirán más adelante. Deja esta página abierta o vuelve con el mismo enlace.</p>
              )}
            </div>
          </div>

          {ev.resultadosVisibles !== false && resumen && (
            <div className="resultado-grupo">
              <h3>Así se siente el grupo en este momento</h3>
              <RuedaAnimos modo="resultados" resumen={resumen} />
            </div>
          )}
        </section>
      )}
    </div>
  );
}

function Mensaje({ titulo, texto }) {
  return (
    <div className="tarjeta mensaje">
      <h1>{titulo}</h1>
      <p>{texto}</p>
      <a className="btn btn-primario" href="#/">
        Volver al inicio
      </a>
    </div>
  );
}
