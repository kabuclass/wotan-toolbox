# KPI Detective

Juego individual de unos 20 minutos, en español, que enseña qué es un KPI, en qué se diferencia de una métrica y cómo lo usa un gerente. Sigue el documento «KPI Detective — Game Blueprint». No usa servidor ni base de datos.

## Cómo usarlo
- Abre `index.html` en cualquier navegador (también funciona sin internet; sin conexión usa tipografías del sistema).
- Para clase: sube la carpeta completa a cualquier hosting estático (GitHub Pages, Netlify, el aula virtual) y comparte el enlace.
- Cada estudiante termina con un informe y lo descarga en PDF con un clic (se genera en el navegador, sin servidor) para entregárselo al profesor.

## Estructura
- `index.html`: página única.
- `css/style.css`: tablero oscuro, móvil primero, accesible.
- `js/data.js`: TODO el contenido (preguntas, opciones, explicaciones, niveles). Para agregar o cambiar preguntas se edita solo este archivo.
- `js/game.js`: estado, puntaje, progreso e informe (sin DOM).
- `js/report.js`: genera el informe en PDF.
- `js/vendor/pdf-lib.min.js`: librería pdf-lib (licencia MIT), incluida para que funcione sin internet.
- `js/ui.js`: dibuja las pantallas y envía las respuestas al motor.

## Cómo funciona el juego
- 4 etapas y 18 decisiones (básicas en las etapas 1 y 2, intermedias en la 3 y la 4), un resumen al final de cada etapa y una reflexión final. Dura unos 20 minutos.
- Enfoque formativo: el avance se muestra como ideas comprendidas (una idea se comprende con 75% o más de sus puntos). Los 100 puntos se mantienen como apoyo.
- Después de responder, todas las opciones se muestran abiertas, con su etiqueta (Opción más sólida, Razonable, Poco útil) y su explicación, sin botones. La etiqueta sale del campo `credit` de cada opción.
- Algunas opciones declaran un estilo de decisión (`style`: datos, resultados, cliente, prudente, accion). El informe resume el estilo predominante.
- Las flechas de la parte superior permiten repasar pantallas anteriores (solo lectura).
- El informe se descarga en PDF con un clic (pdf-lib incluido en `js/vendor/`, licencia MIT). La descarga funciona desde el zip o GitHub Pages, no dentro de vistas previas con descargas bloqueadas.

## Puntaje (100 puntos)
Cuatro dimensiones de 25 puntos: relevancia estratégica, razonamiento analítico, selección de KPI y calidad de decisiones. Cada decisión declara cuántos puntos aporta y a qué dimensión (`points` en `data.js`). Niveles: 0–49 Observador de datos, 50–69 Explorador de KPI, 70–84 Analista de KPI, 85–94 Detective estratégico de KPI, 95–100 Maestro de KPI.

Al abrir el juego, `KPIGame.validateContent()` revisa que cada dimensión sume 25 y avisa por consola si algo se rompió al editar el contenido.

## Notas
- Formato numérico del contenido: `$94,200` y `3.8%` (como el blueprint). Se cambia en `data.js`.
- El progreso se guarda en el navegador del estudiante (localStorage) para retomar si recarga la página. No se envía a ningún servidor.
