import { useEffect, useState } from 'react';
import Inicio from './components/Inicio.jsx';
import Participar from './components/Participar.jsx';
import Panel from './components/Panel.jsx';
import logo from './assets/logo-okaic.png';
import { MODO_NUBE, normalizarCodigo } from './datos.js';
import { CREDITO_PAM } from './animos.js';

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
        <a href="#/" className="barra-marca" aria-label="Ir al inicio">
          <img src={logo} alt="OkaIC · Investi CreAdora" />
          <span>
            <strong>Pulso de la experiencia</strong>
            <small>Evaluación con Pick-A-Mood</small>
          </span>
        </a>
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
        <p>{CREDITO_PAM}</p>
        <p>
          Desarrollado por <strong>OkaIC · Investi CreAdora</strong>
        </p>
      </footer>
    </div>
  );
}
