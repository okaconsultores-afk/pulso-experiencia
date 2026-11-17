import { useState } from 'react';
import { ir } from '../App.jsx';
import { crearEvaluacion, misEvaluaciones, normalizarCodigo, mensajeError, olvidarEvaluacion } from '../datos.js';
import RuedaAnimos from './RuedaAnimos.jsx';

const SUGERENCIAS = ['Al inicio', 'Durante', 'Al cierre', 'Una semana después'];

export default function Inicio() {
  const [codigo, setCodigo] = useState('');
  const [nombre, setNombre] = useState('');
  const [pregunta, setPregunta] = useState('¿Cómo te sientes en este momento?');
  const [momentos, setMomentos] = useState(['Al inicio', 'Durante', 'Al cierre']);
  const [mostrarEtiquetas, setMostrarEtiquetas] = useState(true);
  const [resultadosVisibles, setResultadosVisibles] = useState(true);
  const [abrirTodos, setAbrirTodos] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');
  const [mias, setMias] = useState(misEvaluaciones);

  const cambiarMomento = (i, v) => setMomentos((m) => m.map((x, j) => (j === i ? v : x)));

  async function crear(e) {
    e.preventDefault();
    setError('');
    const lista = momentos.map((m) => m.trim()).filter(Boolean);
    if (!nombre.trim()) return setError('Escribe el nombre de la experiencia.');
    if (lista.length < 2) return setError('Se necesitan al menos 2 momentos con nombre.');
    setEnviando(true);
    try {
      const c = await crearEvaluacion({
        nombre: nombre.trim().slice(0, 120),
        pregunta: (pregunta.trim() || '¿Cómo te sientes en este momento?').slice(0, 200),
        momentos: lista.map((n, i) => ({ id: `m${i + 1}`, nombre: n.slice(0, 60), abierto: abrirTodos || i === 0 })),
        mostrarEtiquetas,
        resultadosVisibles,
      });
      ir(`/e/${c}/resultados`);
    } catch (err) {
      console.error(err);
      setError(mensajeError(err));
    } finally {
      setEnviando(false);
    }
  }

  function unirse(e) {
    e.preventDefault();
    const c = normalizarCodigo(codigo);
    if (c.length >= 4) ir(`/e/${c}`);
  }

  return (
    <div className="inicio">
      <section className="heroe">
        <div className="heroe-texto">
          <h1>¿Cómo se vive la experiencia, momento a momento?</h1>
          <p>
            Cada participante elige, desde su celular o computador, el robot que mejor expresa cómo se siente en
            cada momento. Los resultados del grupo aparecen al instante y se descargan en PDF.
          </p>
          <form className="unirse" onSubmit={unirse}>
            <label htmlFor="codigo">¿Te dieron un código?</label>
            <div className="fila">
              <input
                id="codigo"
                value={codigo}
                onChange={(e) => setCodigo(e.target.value.toUpperCase())}
                placeholder="Ej.: K7PX2M"
                autoComplete="off"
                inputMode="text"
                maxLength={12}
              />
              <button className="btn btn-primario" disabled={normalizarCodigo(codigo).length < 4}>
                Participar
              </button>
            </div>
          </form>
        </div>
        <div className="heroe-rueda" aria-hidden="true">
          <RuedaAnimos modo="elegir" mostrarEtiquetas={false} compacta deshabilitado />
        </div>
      </section>

      <div className="inicio-columnas">
        <form className="tarjeta crear" onSubmit={crear}>
          <h2>Crear una evaluación</h2>
          <p className="ayuda">Para quien facilita la experiencia (taller, clase, visita, evento…).</p>

          <label className="campo">
            <span>Nombre de la experiencia</span>
            <input
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej.: Taller de co-creación con docentes"
              maxLength={120}
              required
            />
          </label>

          <label className="campo">
            <span>Pregunta para participantes</span>
            <input value={pregunta} onChange={(e) => setPregunta(e.target.value)} maxLength={200} />
            <small>
              Para medir el ánimo general: “¿Cómo te sientes?”. Para la reacción a algo concreto: “¿Cómo te hace
              sentir esta actividad?”.
            </small>
          </label>

          <fieldset className="campo">
            <legend>Momentos a evaluar (de 2 a 4)</legend>
            <ol className="lista-momentos">
              {momentos.map((m, i) => (
                <li key={i}>
                  <span className="num-momento">{i + 1}</span>
                  <input
                    value={m}
                    onChange={(e) => cambiarMomento(i, e.target.value)}
                    placeholder={SUGERENCIAS[i]}
                    maxLength={60}
                    aria-label={`Momento ${i + 1}`}
                  />
                  {momentos.length > 2 && (
                    <button
                      type="button"
                      className="btn-icono"
                      onClick={() => setMomentos((x) => x.filter((_, j) => j !== i))}
                      aria-label={`Quitar momento ${i + 1}`}
                      title="Quitar"
                    >
                      ×
                    </button>
                  )}
                </li>
              ))}
            </ol>
            {momentos.length < 4 && (
              <button
                type="button"
                className="btn btn-suave"
                onClick={() => setMomentos((x) => [...x, SUGERENCIAS[x.length] || ''])}
              >
                + Agregar momento
              </button>
            )}
          </fieldset>

          <fieldset className="campo opciones">
            <legend>Opciones</legend>
            <label className="check">
              <input type="checkbox" checked={!abrirTodos} onChange={(e) => setAbrirTodos(!e.target.checked)} />
              <span>
                Abrir los momentos uno a uno, cuando yo lo indique
                <small>Si lo desmarcas, todos los momentos quedan abiertos desde ya.</small>
              </span>
            </label>
            <label className="check">
              <input type="checkbox" checked={mostrarEtiquetas} onChange={(e) => setMostrarEtiquetas(e.target.checked)} />
              <span>
                Mostrar el nombre de cada estado de ánimo bajo el robot
                <small>Los autores recomiendan usar los robots sin palabras para una respuesta más intuitiva.</small>
              </span>
            </label>
            <label className="check">
              <input
                type="checkbox"
                checked={resultadosVisibles}
                onChange={(e) => setResultadosVisibles(e.target.checked)}
              />
              <span>Las personas ven los resultados del grupo después de responder</span>
            </label>
          </fieldset>

          {error && <p className="error">{error}</p>}
          <button className="btn btn-primario btn-grande" disabled={enviando}>
            {enviando ? 'Creando…' : 'Crear y obtener el enlace'}
          </button>
        </form>

        <aside className="tarjeta como">
          <h2>Cómo funciona</h2>
          <ol className="pasos">
            <li>
              <b>Crea</b> la evaluación y define sus momentos (por ejemplo: al inicio, durante y al cierre).
            </li>
            <li>
              <b>Comparte</b> el código, el enlace o el código QR con el grupo.
            </li>
            <li>
              <b>Abre cada momento</b> cuando llegue. Cada persona elige un robot y, si quiere, cuenta por qué.
            </li>
            <li>
              <b>Mira</b> los resultados en vivo, compara los momentos y <b>descarga el PDF</b>.
            </li>
          </ol>
          {mias.length > 0 && (
            <>
              <h3>Mis evaluaciones en este dispositivo</h3>
              <ul className="mias">
                {mias.map((e) => (
                  <li key={e.codigo}>
                    <a href={`#/e/${e.codigo}/resultados`}>
                      <strong>{e.nombre}</strong>
                      <small>
                        {e.codigo} · {new Date(e.creada).toLocaleDateString('es')}
                      </small>
                    </a>
                    <button
                      type="button"
                      className="btn-icono"
                      title="Quitar de esta lista"
                      aria-label={`Quitar ${e.nombre} de la lista`}
                      onClick={() => {
                        olvidarEvaluacion(e.codigo);
                        setMias(misEvaluaciones());
                      }}
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}
        </aside>
      </div>
    </div>
  );
}
