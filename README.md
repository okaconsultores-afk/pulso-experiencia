# Pulso de la experiencia

_El que lo vive es el que lo goza · OkaIC Investi CreAdora_

Aplicación web para evaluar cómo se siente un grupo en **2 a 4 momentos** de una experiencia (taller, clase,
visita, evento…). Cada persona responde desde su celular o computador eligiendo uno de los 8 pictogramas del
robot de **Pick-A-Mood** (Desmet, Vastenburg & Romero, 2016), dispuestos en el círculo original de
agrado–activación. Los resultados del grupo se ven **en tiempo real** y se descargan en **PDF**.

## Funciones

- **Crear una evaluación**: nombre de la experiencia, pregunta, momentos (de 2 a 4) y opciones.
- **Invitar**: código de 6 letras, enlace para copiar y código QR (se puede ampliar para proyectarlo).
- **Abrir y cerrar momentos**: quien facilita decide cuándo se responde cada momento. Al abrir uno, los
  celulares de participantes saltan solos a ese momento.
- **Responder**: la persona escribe primero su nombre o sus iniciales (obligatorio). En cada momento toca el
  robot que mejor expresa cómo se siente (sin ver el nombre del estado de ánimo, que aparece solo después de
  enviar) y responde dos campos obligatorios: cómo identifica el momento (p. ej. "cuando empezamos a jugar") y
  por qué se siente así. Se puede cambiar la respuesta mientras el momento esté abierto.
- **Nueva evaluación**: botón en el panel de resultados y botón "Limpiar" en el formulario de creación.
- **Resultados en vivo** por momento: círculo con el porcentaje de cada estado de ánimo, flecha de tendencia
  del grupo, los 4 grupos (energía/calma × agradable/desagradable), barras y comentarios.
- **Comparar momentos**: recorrido del ánimo promedio del grupo en el mapa agrado–activación y barras apiladas.
- **Informe PDF**: resumen, recorrido entre momentos, una página por momento y todos los comentarios.

### Los 8 estados (en el orden del círculo)

| Grupo | Estados |
| --- | --- |
| Activación alta · agradable | Emocionado - Animado, Alegre - Feliz |
| Activación baja · agradable | Relajado - Despreocupado, Calmado - Sereno |
| Activación baja · desagradable | Sombrío - Triste, Aburrido - Cansado |
| Activación alta · desagradable | Irritado - Molesto, Tenso - Nervioso |

La **tendencia del grupo** es el promedio de las posiciones de todas las respuestas en el círculo:
hacia la derecha hay más agrado, hacia arriba más activación; cerca del centro el grupo está dividido.

## Por qué usa Firebase

GitHub Pages solo publica páginas: no puede guardar datos ni comunicar a varias personas entre sí. Para que
muchas personas respondan a la vez y los resultados se actualicen al instante, la aplicación usa
**Firebase Firestore** (de Google), cuyo plan gratuito _Spark_ alcanza de sobra para talleres y grupos
(50.000 lecturas y 20.000 escrituras por día, sin tarjeta de crédito).

Mientras `src/firebaseConfig.js` esté vacío, la aplicación funciona en **modo demostración**: guarda todo en
el navegador actual (sirve para probar abriendo varias pestañas, no para un grupo real).

## Configurar Firebase (una sola vez)

1. Entra a <https://console.firebase.google.com> con una cuenta de Google y pulsa **Crear un proyecto**.
   Ponle un nombre (p. ej. `pulso-experiencia`), desactiva Google Analytics y pulsa **Crear proyecto**.
2. En el menú izquierdo: **Compilación → Authentication → Comenzar**. En la pestaña **Método de acceso**,
   elige **Anónimo**, actívalo y pulsa **Guardar**. (Así nadie necesita cuenta; cada dispositivo responde una vez
   por momento.)
3. En el menú: **Compilación → Firestore Database → Crear base de datos**. Elige una ubicación
   (p. ej. `southamerica-east1` o `nam5`), luego **Iniciar en modo de producción** y **Crear**.
4. En Firestore, abre la pestaña **Reglas**, borra lo que haya, pega todo el contenido del archivo
   [`firestore.rules`](firestore.rules) y pulsa **Publicar**.
5. Pulsa el engranaje ⚙ (arriba a la izquierda) → **Configuración del proyecto**. Abajo, en **Tus apps**, pulsa
   el ícono **`</>`** (Web), escribe un apodo y pulsa **Registrar app**. Aparece un bloque
   `const firebaseConfig = { apiKey: ..., ... }`.
6. Copia esos valores dentro de [`src/firebaseConfig.js`](src/firebaseConfig.js). No son secretos: Firebase los
   diseñó para ir dentro de la página; la protección la dan las reglas del paso 4.

## Publicar en GitHub Pages

El flujo `.github/workflows/deploy.yml` construye y publica la aplicación cada vez que se sube un cambio a `main`.
Solo hay que activar una vez **Settings → Pages → Source: GitHub Actions**. La dirección queda así:
`https://<usuario>.github.io/<repositorio>/`.

## Seguridad y privacidad

- Solo el navegador que creó una evaluación puede abrir/cerrar sus momentos o cambiar sus opciones.
- Cada dispositivo solo puede escribir su propia respuesta.
- Cualquiera que tenga el código puede ver los resultados (útil para proyectarlos). El nombre es opcional.

## Desarrollo local

```bash
npm install
npm run dev      # servidor de desarrollo
npm run build    # genera la carpeta dist/
```

Estructura: `src/animos.js` (los 8 estados, colores y cálculos), `src/datos.js` (Firebase o modo demostración),
`src/pdf.js` (informe), `src/components/` (pantallas y gráficos).

## Créditos y licencia de los pictogramas

Pick-A-Mood © Desmet, P. M. A., Vastenburg, M. H., & Romero, N. (2016). _Mood measurement with Pick-A-Mood:
Review of current methods and design of a pictorial self-report scale._ Journal of Design Research, 14(3),
241–279. Delft University of Technology. Los pictogramas se distribuyen con licencia **Creative Commons
BY-NC-ND** (atribución, uso no comercial, sin obras derivadas). Perfil del autor:
<https://www.tudelft.nl/io/over-io/personen/desmet-pma>

Ilustraciones adaptadas del trabajo de Pieter Desmet, elaboradas por Ángela Henao-Ortiz.

Grupo de investigación OkaIC · Investi CreAdora:
[GrupLAC](https://scienti.minciencias.gov.co/gruplac/jsp/visualiza/visualizagr.jsp?nro=00000000021358)
