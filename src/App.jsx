import { useEffect, useState } from 'react';
import Inicio from './components/Inicio.jsx';
import Participar from './components/Participar.jsx';
import Panel from './components/Panel.jsx';
import logo from './assets/logo-okaic.png';
import { MODO_NUBE, normalizarCodigo } from './datos.js';
import { CREDITO_ILUSTRACIONES, URL_DESMET, URL_GRUPLAC } from './animos.js';

function leerRuta() {
  const h = window.location.hash.replace(/^#\/?/, '');
  const partes = h.split('/').filter(Boolean);
  if (partes[0] === 'e' && partes[1]) {
    return { vista: partes[2] === 'resultados' ? 'panel' : 'participar', codigo: normalizarCodigo(partes[1]) };
  }
  return { vista: 'inicio' };
}

export function ir(ruta) {
  window.location.hash = ruta;
}

export default function App() {
  const [ruta, setRuta] = useState(leerRuta);
  useEffect(() => {
    const f = () => {
      setRuta(leerRuta());
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', f);
    return () => window.removeEventListener('hashchange', f);
  }, []);

  return (
    <div className="app">
      <header className="barra">
        <div className="barra-marca">
          <a href={URL_GRUPLAC} target="_blank" rel="noopener noreferrer" title="Grupo OkaIC · Investi CreAdora en GrupLAC">
            <img src={logo} alt="OkaIC · Investi CreAdora (abre su GrupLAC)" />
          </a>
          <a href="#/" className="barra-titulo" aria-label="Ir al inicio">
            <strong>Pulso de la experiencia</strong>
            <small>El que lo vive es el que lo goza</small>
          </a>
        </div>
        <span className="franja" aria-hidden="true" />
      </header>

      {!MODO_NUBE && (
        <div className="aviso-demo">
          <strong>Modo demostración.</strong> Las respuestas se guardan solo en este navegador. Para usarla con un
          grupo real hay que conectar la base de datos (ver README).
        </div>
      )}

      <main className="contenido">
        {ruta.vista === 'inicio' && <Inicio />}
        {ruta.vista === 'participar' && <Participar key={ruta.codigo} codigo={ruta.codigo} />}
        {ruta.vista === 'panel' && <Panel key={ruta.codigo} codigo={ruta.codigo} />}
      </main>

      <footer className="pie">
        <p>
          Pick-A-Mood ©{' '}
          <a href={URL_DESMET} target="_blank" rel="noopener noreferrer">
            Desmet
          </a>
          , Vastenburg &amp; Romero (2016), Delft University of Technology. Licencia CC BY-NC-ND.
        </p>
        <p>{CREDITO_ILUSTRACIONES}</p>
        <p>
          Desarrollado por{' '}
          <a href={URL_GRUPLAC} target="_blank" rel="noopener noreferrer">
            <strong>OkaIC · Investi CreAdora</strong>
          </a>
        </p>
      </footer>
    </div>
  );
}
