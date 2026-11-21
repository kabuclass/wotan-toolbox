/* KPI Detective — contenido del juego (datos, sin lógica ni DOM).
 * Para agregar o editar preguntas basta con modificar este archivo.
 * Regla de puntaje: la suma de todos los "points" de cada dimensión debe ser 25 (total 100).
 * Los textos admiten HTML simple (<strong>, <em>) porque son contenido propio, no escrito por el estudiante.
 */
(function (global) {
  "use strict";

  const D = {};

  /* ---------- Información general ---------- */
  D.meta = {
    title: "KPI Detective",
    company: "AquaFren",
    companyDesc: "una empresa que vende botellas reutilizables inteligentes",
    minutes: "unos 20 minutos",
    version: 1
  };

  /* ---------- Dimensiones de puntaje (25 puntos cada una) ---------- */
  D.dimensions = {
    relevance: {
      label: "Relevancia estratégica",
      strong: "Identificar KPI conectados con los objetivos del negocio",
      improve: "Conectar cada indicador con el objetivo que debe medir"
    },
    analysis: {
      label: "Razonamiento analítico",
      strong: "Interpretar varios indicadores juntos y compararlos con sus metas",
      improve: "Evitar conclusiones basadas en un solo indicador"
    },
    selection: {
      label: "Selección de KPI",
      strong: "Distinguir KPI de métricas comunes y armar un tablero equilibrado",
      improve: "Separar los KPI estratégicos de las métricas de actividad o de vanidad"
    },
    decision: {
      label: "Calidad de decisiones",
      strong: "Convertir la evidencia en decisiones gerenciales",
      improve: "Pasar del diagnóstico a una acción gerencial concreta"
    }
  };

  /* ---------- Niveles de logro ---------- */
  D.levels = [
    { min: 0, max: 49, name: "Observación de datos",
      text: "Ya ves los números, pero todavía falta conectarlos con objetivos y metas. Repasa la Guía KPI y vuelve a intentarlo: la segunda vuelta suele cambiar mucho el resultado." },
    { min: 50, max: 69, name: "Exploración de KPI",
      text: "Entiendes varias ideas clave, pero a veces te quedas con indicadores llamativos o con un solo dato. Practica preguntándote siempre: ¿para qué objetivo sirve este número?" },
    { min: 70, max: 84, name: "Análisis de KPI",
      text: "Conectas indicadores con objetivos y los comparas con sus metas. El siguiente paso es interpretar varios KPI en conjunto y convertir el diagnóstico en acciones." },
    { min: 85, max: 94, name: "Detective estratégico de KPI",
      text: "Piensas con criterio gerencial: combinas evidencia, desconfías de las conclusiones apresuradas y propones acciones concretas." },
    { min: 95, max: 100, name: "Maestría en KPI",
      text: "Dominio sobresaliente: eliges, interpretas y decides con criterio. Ya puedes aplicar este razonamiento a empresas reales." }
  ];

  /* ---------- Conceptos que se evalúan en el informe ---------- */
  D.concepts = {
    kpiVsMetric: "KPI frente a métrica",
    relevance: "Conexión con el objetivo",
    targets: "Metas",
    gaps: "Brechas de desempeño",
    tradeoffs: "Compromisos entre KPI",
    decisions: "Decisiones gerenciales"
  };

  /* ---------- La cadena de KPI ---------- */
  D.chain = [
    { id: "objetivo", label: "Objetivo del negocio", text: "Lo que la empresa quiere lograr.", example: "Mejorar el servicio al cliente" },
    { id: "kpi", label: "KPI", text: "El indicador estratégico que mide el avance hacia ese objetivo.", example: "% de casos resueltos en 24 horas" },
    { id: "meta", label: "Meta", text: "El valor que queremos alcanzar.", example: "90%" },
    { id: "real", label: "Resultado real", text: "Lo que efectivamente ocurrió.", example: "78%" },
    { id: "accion", label: "Acción gerencial", text: "La decisión que tomamos al comparar el resultado con la meta.", example: "Reforzar el equipo en las horas de mayor demanda" }
  ];

  /* ---------- Etapas ---------- */
  D.stages = [
    { id: 1, title: "¿Qué es un KPI?", time: "4–5 min" },
    { id: 2, title: "¿KPI o solo una métrica?", time: "3–4 min" },
    { id: 3, title: "¿Qué KPI importan?", time: "5–6 min" },
    { id: 4, title: "Usa los KPI para investigar", time: "7–8 min" }
  ];

  /* ---------- Tablero del caso (etapa 4) ---------- */
  D.dashboard = [
    { id: "revenue", name: "Ingresos", target: "$90k", actual: "$108k", targetNum: 90, actualNum: 108, better: "higher", trend: "up",
      gap: "20% por encima de la meta",
      reading: "Las ventas superan la meta. Es una buena señal, pero los ingresos solos no dicen si la empresa es rentable ni si los clientes están satisfechos." },
    { id: "conversion", name: "Tasa de conversión", target: "4.0%", actual: "3.7%", targetNum: 4.0, actualNum: 3.7, better: "higher", trend: "down",
      gap: "0.3 puntos por debajo de la meta",
      reading: "Llega gente al sitio, pero una proporción menor termina comprando. Con 82,000 visitas, 0.3 puntos equivalen a unos 246 pedidos menos." },
    { id: "retention", name: "Retención de clientes", target: "28%", actual: "21%", targetNum: 28, actualNum: 21, better: "higher", trend: "down",
      gap: "7 puntos por debajo de la meta",
      reading: "Regresan menos clientes. Si sigue así, la empresa dependerá de conseguir clientes nuevos todo el tiempo, y eso suele costar más." },
    { id: "complaints", name: "Quejas de clientes", target: "menos de 150", actual: "183", targetNum: 150, actualNum: 183, better: "lower", trend: "up",
      gap: "33 quejas por encima del límite",
      reading: "Más quejas suelen anticipar pérdida de clientes y daño a la reputación. Hay que averiguar de qué tratan." },
    { id: "delivery", name: "Tiempo de entrega", target: "menos de 3 días", actual: "4.2 días", targetNum: 3, actualNum: 4.2, better: "lower", trend: "up",
      gap: "1.2 días más lento que la meta",
      reading: "Las entregas tardías pueden explicar parte de las quejas y de la caída en retención." },
    { id: "defects", name: "Tasa de defectos", target: "menos de 3%", actual: "4.8%", targetNum: 3, actualNum: 4.8, better: "lower", trend: "up",
      gap: "1.8 puntos por encima del límite",
      reading: "Los productos defectuosos generan devoluciones, quejas y pérdida de confianza en la marca." },
    { id: "aov", name: "Valor promedio del pedido", target: "$45", actual: "$48", targetNum: 45, actualNum: 48, better: "higher", trend: "up",
      gap: "$3 por encima de la meta",
      reading: "Los clientes gastan un poco más en cada compra. Es una buena señal, con un efecto moderado en el resultado total." },
    { id: "traffic", name: "Tráfico del sitio", target: "70k", actual: "82k", targetNum: 70, actualNum: 82, better: "higher", trend: "up",
      gap: "17% por encima de la meta",
      reading: "Más visitas solo ayudan si se convierten en compras y en clientes que regresan. Fíjate qué pasó con la conversión." }
  ];

  /* ---------- Métricas del reto final ---------- */
  D.finalMetrics = [
    { id: "revenue", name: "Ingresos", desc: "Dinero que entra por ventas", area: "finanzas",
      rel: 1, out: 1, act: 0.6, vanity: 0,
      why: "KPI de resultado: mide si el negocio vende. Casi siempre aparece en un tablero, pero no debería estar solo." },
    { id: "margin", name: "Margen de utilidad", desc: "Parte de las ventas que queda como ganancia", area: "finanzas",
      rel: 1, out: 1, act: 0.7, vanity: 0,
      why: "Muestra si crecer deja ganancia. Complementa a los ingresos: vender más no siempre es ganar más." },
    { id: "traffic", name: "Tráfico del sitio", desc: "Número de visitas a la tienda en línea", area: "marketing",
      rel: 0.4, out: 0.2, act: 0.5, vanity: 0.5,
      why: "Es una señal temprana útil, pero no mide resultados. Vale más leída junto con la conversión." },
    { id: "conversion", name: "Tasa de conversión", desc: "Visitas que terminan comprando", area: "marketing",
      rel: 0.9, out: 0.7, act: 0.9, vanity: 0,
      why: "Conecta el marketing con las ventas y señala dónde mejorar el sitio y las campañas." },
    { id: "instagram", name: "Seguidores de Instagram", desc: "Personas que siguen la cuenta de la marca", area: "marketing",
      rel: 0.15, out: 0, act: 0.2, vanity: 1,
      why: "Mide audiencia, no desempeño del negocio. Es el ejemplo típico de métrica de vanidad cuando no se vincula a un objetivo." },
    { id: "retention", name: "Retención de clientes", desc: "Clientes que siguen comprando", area: "cliente",
      rel: 1, out: 1, act: 0.8, vanity: 0,
      why: "Indica si los clientes regresan: lealtad, ingresos futuros y menor costo de conseguir clientes nuevos." },
    { id: "satisfaction", name: "Satisfacción del cliente", desc: "Opinión de los clientes después de comprar", area: "cliente",
      rel: 0.9, out: 0.9, act: 0.8, vanity: 0,
      why: "Mide cómo viven los clientes la compra y anticipa recompra y reputación." },
    { id: "delivery", name: "Tiempo de entrega", desc: "Días entre el pedido y la llegada", area: "operaciones",
      rel: 0.8, out: 0.7, act: 0.9, vanity: 0,
      why: "Mide el cumplimiento de la promesa al cliente y se puede mejorar con acciones concretas." },
    { id: "defects", name: "Tasa de defectos", desc: "Botellas con fallas de fabricación", area: "operaciones",
      rel: 0.8, out: 0.8, act: 0.9, vanity: 0,
      why: "Mide la calidad del producto en origen y permite actuar antes de que lleguen las quejas." },
    { id: "meetings", name: "Reuniones de empleados", desc: "Reuniones internas por mes", area: "interno",
      rel: 0, out: 0, act: 0.1, vanity: 1,
      why: "Mide actividad interna, no resultados. Rara vez merece un lugar en un tablero gerencial." }
  ];
  D.areaLabels = { finanzas: "Finanzas", marketing: "Marketing y ventas", cliente: "Clientes", operaciones: "Operaciones", interno: "Gestión interna" };

  /* ---------- Estilos de decisión (se usan en el perfil del informe) ---------- */
  D.styles = {
    datos: { name: "Analítico", text: "Buscas evidencia, comparas indicadores y compruebas causas antes de concluir.",
      manager: "Investigas antes de decidir. Lees varios KPI a la vez, separas los síntomas de las causas y propones acciones con seguimiento.",
      strength: "Decisiones basadas en evidencia.",
      risk: "Analizar demasiado y demorar decisiones urgentes.",
      tip: "Ponle un plazo al análisis y decide con la mejor evidencia disponible." },
    resultados: { name: "Orientado a resultados", text: "Pones la atención en las ventas y en los números que muestran crecimiento.",
      manager: "Te mueve el crecimiento: miras primero las ventas y los ingresos, y buscas que las metas se cumplan.",
      strength: "Foco en lo que sostiene el negocio.",
      risk: "Confiar en un solo KPI favorable y no ver los problemas que crecen detrás.",
      tip: "Antes de celebrar un resultado, revisa al menos dos KPI que podrían contradecirlo." },
    cliente: { name: "Centrado en el cliente", text: "Te fijas primero en la experiencia de los clientes y en su lealtad.",
      manager: "Pones a las personas primero: la satisfacción y la lealtad de los clientes guían tus decisiones.",
      strength: "Proteges la relación con los clientes a largo plazo.",
      risk: "Atender el síntoma (disculpas, premios) sin corregir la causa en los procesos.",
      tip: "Cuando veas clientes molestos, busca en el tablero qué proceso lo está causando." },
    prudente: { name: "Prudente", text: "Prefieres esperar o reunir más información antes de decidir.",
      manager: "Prefieres no apresurarte: pides más información y esperas a confirmar antes de actuar.",
      strength: "Evitas reacciones exageradas ante datos aislados.",
      risk: "Esperar demasiado cuando varios KPI ya muestran el mismo problema.",
      tip: "Si tres o más indicadores apuntan en la misma dirección, ya tienes evidencia para actuar." },
    accion: { name: "De acción rápida", text: "Prefieres actuar pronto y corregir sobre la marcha.",
      manager: "Te gusta resolver rápido: tomas decisiones concretas y corriges sobre la marcha.",
      strength: "Rapidez y capacidad de ejecución.",
      risk: "Actuar sin conocer la causa y gastar recursos en la solución equivocada.",
      tip: "Antes de actuar, plantea una hipótesis con los KPI y define cómo sabrás si funcionó." }
  };

  /* ---------- Pasos del juego, en orden ----------
   * Dificultad: etapas 1 y 2 básicas; etapas 3 y 4 intermedias.
   * "credit" (0 a 1) define la etiqueta: 1 = Opción más sólida; 0.4 o más = Razonable; menos = Poco útil.
   * "style" (opcional) indica el estilo de decisión que revela cada opción.
   */
  D.steps = [

    /* ===== ETAPA 1 · básica ===== */
    {
      id: "s1-intro", type: "info", stage: 1,
      title: "Etapa 1: ¿Qué es un KPI?",
      lead: "AquaFren tiene ventas en línea, marketing, servicio al cliente, fabricación, entregas y clientes que repiten.",
      body: "Hoy llegó el resumen del mes y la dirección ejecutiva (CEO, por sus siglas en inglés) te hace una pregunta."
    },
    {
      id: "s1q1", type: "multi", stage: 1, pick: 3, points: { relevance: 6 }, hideTitle: true,
      title: "Elegir los números a investigar",
      concepts: ["kpiVsMetric", "relevance"],
      scenario: "La dirección ejecutiva quiere saber si la empresa está funcionando bien. Necesitas brindar una respuesta hasta el final del día, pero no tienes idea de qué se trata un KPI. Abajo tienes ocho números sobre la mesa.",
      prompt: "¿Cuáles números investigarías primero?",
      options: [
        { id: "revenue", text: "Ingresos", value: "$94,200", score: 1,
          why: "Muestra si el negocio vende lo suficiente. Se conecta con un resultado económico importante." },
        { id: "visits", text: "Visitas al sitio web", value: "82,450", score: 0.2,
          why: "Mide interés, pero no dice si esas visitas se convirtieron en clientes." },
        { id: "complaints", text: "Quejas de clientes", value: "183", score: 0.6,
          why: "Es una alerta útil sobre el servicio o el producto. Sin una meta, no sabemos si 183 es mucho o poco." },
        { id: "instagram", text: "Seguidores de Instagram", value: "41,300", score: 0,
          why: "Mide audiencia, no ventas ni satisfacción. Por sí solo no evalúa el desempeño." },
        { id: "conversion", text: "Tasa de conversión", value: "3.8%", score: 1,
          why: "Indica qué proporción de visitantes compra. Une el tráfico con las ventas." },
        { id: "aov", text: "Valor promedio del pedido", value: "$47", score: 0.5,
          why: "Dice cuánto se gasta en cada compra. Es útil, aunque menos central que los ingresos o la conversión." },
        { id: "meetings", text: "Número de reuniones", value: "36", score: 0,
          why: "Mide actividad interna; para saber si la empresa logra sus objetivos hacen falta otros indicadores." },
        { id: "repeat", text: "Tasa de recompra", value: "21%", score: 1,
          why: "Muestra si los clientes regresan: es una señal de lealtad y de ingresos futuros." }
      ],
      explain: "Los ingresos, la conversión y la recompra dan buena evidencia porque se conectan con resultados importantes del negocio.",
      concept: "<strong>Métrica</strong> = algo que medimos. <strong>KPI</strong> = una métrica estratégicamente importante, que se usa para evaluar el desempeño frente a un objetivo.",
      takeaway: "Un número es más valioso cuando se conecta con un resultado importante del negocio, no solo con actividad o popularidad."
    },
    {
      id: "s1q2", type: "choice", stage: 1, points: { analysis: 4 },
      title: "Interpretar un resultado sin meta",
      concepts: ["targets"],
      scenario: "En el resumen, la <strong>tasa de recompra de AquaFren es 21%</strong>. La dirección ejecutiva pregunta: «¿Es una buena noticia?»",
      prompt: "¿Qué respondes?",
      options: [
        { id: "a", text: "Sí: más de una de cada cinco personas vuelve a comprar, eso es bastante.", credit: 0.1, style: "accion",
          why: "Suena razonable, pero «bastante» es una impresión. Sin una meta o una referencia no se puede saber." },
        { id: "b", text: "Depende: necesito compararlo con la meta de la empresa o con los meses anteriores.", credit: 1, style: "datos",
          why: "Un resultado cobra sentido al compararlo con una meta o con una referencia." },
        { id: "c", text: "No: si el producto es bueno, la mayoría debería volver a comprar.", credit: 0.1, style: "cliente",
          why: "Una botella dura mucho: quizá la mayoría no necesita comprar otra pronto. Sin meta, «la mayoría» es un límite arbitrario." },
        { id: "d", text: "Primero revisaría los ingresos: si crecieron, es buena noticia.", credit: 0.25, style: "resultados",
          why: "Los ingresos importan, pero no responden la pregunta: la recompra se evalúa frente a su propia meta." }
      ],
      explain: "El mismo 21% cambia de significado según la meta. Mira cómo se lee frente a tres metas posibles:",
      targetsDemo: [
        { label: "Si la meta fuera 15%", target: 15, note: "Supera la meta por 6 puntos: buena noticia." },
        { label: "Si la meta fuera 21%", target: 21, note: "Cumple la meta justo." },
        { label: "Si la meta fuera 28%", target: 28, note: "Queda 7 puntos por debajo: hay que actuar." }
      ],
      takeaway: "Un KPI sin meta es solo un número: la meta permite saber si el resultado es bueno o malo."
    },
    {
      id: "s1q3", type: "choice", stage: 1, points: { relevance: 5 },
      title: "Corregir una definición de KPI",
      concepts: ["kpiVsMetric"],
      scenario: "Una persona de tu equipo dice: «Un KPI es cualquier número que la empresa registra.»",
      prompt: "¿Cómo corriges esa definición?",
      options: [
        { id: "a", text: "Un KPI es un número que la empresa revisa todos los meses.", credit: 0.15,
          why: "Revisar algo con frecuencia no lo vuelve estratégico: también se revisan cada mes las reuniones o los correos." },
        { id: "b", text: "Un KPI es una métrica importante que se usa para evaluar el avance hacia un objetivo.", credit: 1,
          why: "Es la idea central: importancia estratégica más un objetivo con el cual evaluar." },
        { id: "c", text: "Un KPI es un indicador financiero, como los ingresos o las utilidades.", credit: 0.3,
          why: "Muchos KPI son financieros, pero no todos: la retención, las entregas a tiempo o la satisfacción también pueden serlo." },
        { id: "d", text: "Un KPI es la meta que la empresa quiere alcanzar, por ejemplo vender $100,000.", credit: 0.35,
          why: "Confunde el KPI con la meta. El KPI es lo que se mide (ventas mensuales); la meta es el valor esperado ($100,000)." }
      ],
      explain: "Medir es fácil; lo difícil es decidir qué medir. Un KPI es el resultado de esa decisión: se elige porque ayuda a evaluar un objetivo importante.",
      takeaway: "Solo algunos de los números que se miden son KPI: un KPI se elige por su importancia para un objetivo."
    },
    {
      id: "s1-recap", type: "info", recap: true, stage: 1,
      title: "Resumen de la etapa 1",
      lead: "Acabas de aprender conceptos nuevos y algunas ideas pueden reforzarse. Revísalas o avanza a la siguiente etapa."
    },

    /* ===== ETAPA 2 · básica ===== */
    {
      id: "s2-intro", type: "info", stage: 2,
      title: "Etapa 2: ¿KPI o solo una métrica?",
      lead: "Un indicador no es KPI por sí mismo: depende del objetivo que la empresa esté buscando en ese momento.",
      body: "Verás seis indicadores, uno por uno, cada uno con el objetivo del trimestre. Decide si es un KPI o si es una métrica. Atención: uno aparece dos veces."
    },
    {
      id: "s2q1", type: "choice", layout: "binary", stage: 2, points: { selection: 2.25 },
      title: "Clasificar: ingresos mensuales",
      concepts: ["kpiVsMetric"],
      objective: "Crecer en ventas de forma sostenible",
      scenario: "<strong>Indicador: ingresos mensuales.</strong>",
      prompt: "¿Qué es este indicador para ese objetivo?",
      options: [
        { id: "kpi", text: "Es un KPI", credit: 1,
          why: "Los ingresos están directamente conectados con el objetivo de crecer en ventas." },
        { id: "metric", text: "Es una métrica, pero no necesariamente un KPI", credit: 0,
          why: "Aquí los ingresos son justo el resultado que la empresa quiere mejorar, así que son un KPI." }
      ],
      explain: "Los ingresos son un KPI cuando se conectan con un objetivo importante. Si el objetivo fuera mejorar el diseño de un producto, tal vez no lo serían.",
      takeaway: "Un indicador es KPI cuando se conecta directamente con un objetivo importante."
    },
    {
      id: "s2q2", type: "choice", layout: "binary", stage: 2, points: { selection: 2.25 },
      title: "Clasificar: reuniones de empleados",
      concepts: ["kpiVsMetric"],
      objective: "Mejorar la satisfacción de los clientes",
      scenario: "<strong>Indicador: número de reuniones del equipo al mes.</strong>",
      prompt: "¿Qué es este indicador para ese objetivo?",
      options: [
        { id: "kpi", text: "Es un KPI", credit: 0,
          why: "Contar reuniones mide actividad interna; para saber si los clientes están más satisfechos hacen falta otros indicadores." },
        { id: "metric", text: "Es una métrica, pero no necesariamente un KPI", credit: 1,
          why: "Es una métrica de actividad. Hacer más reuniones no demuestra que el objetivo se esté logrando." }
      ],
      explain: "Medir actividad no es lo mismo que medir resultados. Las reuniones pueden ser útiles, pero normalmente no son un KPI de negocio.",
      takeaway: "La actividad (reuniones, correos, horas) rara vez mide si se logra un objetivo."
    },
    {
      id: "s2q4", type: "choice", layout: "binary", stage: 2, points: { selection: 2.25 },
      title: "Clasificar: seguidores de Instagram",
      concepts: ["kpiVsMetric"],
      objective: "Aumentar las ventas en línea",
      scenario: "<strong>Indicador: seguidores de Instagram.</strong>",
      prompt: "¿Qué es este indicador para ese objetivo?",
      options: [
        { id: "kpi", text: "Es un KPI", credit: 0.25,
          why: "Es comprensible: la audiencia puede influir en las ventas. Pero por sí sola no mide ventas." },
        { id: "metric", text: "Es una métrica, pero no necesariamente un KPI", credit: 1,
          why: "Es una métrica potencialmente útil, pero no está conectada de forma directa con las ventas en línea." }
      ],
      explain: "Tener más seguidores no garantiza vender más. Para este objetivo, la conversión o los ingresos en línea dicen mucho más.",
      takeaway: "Una métrica popular no es KPI si no mide el objetivo."
    },
    {
      id: "s2q6", type: "choice", layout: "binary", stage: 2, points: { selection: 2.25 },
      title: "Clasificar: seguidores de Instagram, con otro objetivo",
      concepts: ["kpiVsMetric", "relevance"],
      objective: "Dar a conocer la marca en una ciudad donde AquaFren acaba de llegar",
      scenario: "<strong>Indicador: seguidores de Instagram en esa ciudad.</strong> Es el mismo tipo de indicador de antes, pero el objetivo cambió.",
      prompt: "¿Qué es este indicador para ese objetivo?",
      options: [
        { id: "kpi", text: "Es un KPI", credit: 1,
          why: "Ahora el objetivo es que la gente conozca la marca, y la audiencia en esa ciudad es una señal directa de ello." },
        { id: "metric", text: "Es una métrica, pero no necesariamente un KPI", credit: 0.4,
          why: "Es una duda razonable: seguir una cuenta no siempre significa conocer la marca. Aun así, para este objetivo es una de las mejores señales disponibles." }
      ],
      explain: "El mismo indicador puede ser solo una métrica para un objetivo y un KPI para otro. Incluso aquí conviene complementarlo, por ejemplo con el alcance de las publicaciones o con encuestas de reconocimiento.",
      takeaway: "Que un indicador sea KPI depende del objetivo, no del indicador en sí."
    },
    {
      id: "s2-recap", type: "info", recap: true, stage: 2,
      title: "Resumen de la etapa 2",
      lead: "Acabas de aprender conceptos nuevos y algunas ideas pueden reforzarse. Revísalas o avanza a la siguiente etapa."
    },

    /* ===== ETAPA 3 · intermedia ===== */
    {
      id: "s3-intro", type: "info", stage: 3,
      title: "Etapa 3: ¿Qué KPI importan?",
      lead: "Cuando el objetivo es claro, elegir el indicador correcto es más fácil, pero no siempre obvio.",
      body: "Te daremos un objetivo y cuatro indicadores. Varios pueden servir: elige el que mejor permita saber si el objetivo se está logrando."
    },
    {
      id: "s3q1", type: "choice", stage: 3, points: { relevance: 4 },
      title: "KPI para mejorar el servicio al cliente",
      concepts: ["relevance"],
      objective: "Mejorar el servicio al cliente",
      prompt: "¿Qué indicador te daría la mejor evidencia?",
      options: [
        { id: "a", text: "Horas de capacitación del equipo de servicio", credit: 0.15,
          why: "Capacitar ayuda, pero mide un esfuerzo, no el resultado. Se puede capacitar mucho y seguir atendiendo mal." },
        { id: "b", text: "Tiempo promedio de respuesta", credit: 0.6,
          why: "Está conectado con el servicio, pero mide velocidad, no si el problema se resolvió." },
        { id: "c", text: "Número de correos recibidos", credit: 0,
          why: "Mide volumen de trabajo, no la calidad del servicio." },
        { id: "d", text: "% de casos resueltos en 24 horas", credit: 1,
          why: "Combina rapidez y solución: se acerca mucho al resultado que el cliente espera." }
      ],
      explain: "El mejor indicador es el que más se acerca al resultado deseado. Los esfuerzos (capacitación) y el volumen (correos) son contexto; la solución a tiempo es resultado.",
      takeaway: "Elige indicadores de resultado, no de esfuerzo ni de volumen."
    },
    {
      id: "s3q2", type: "choice", stage: 3, points: { relevance: 4 },
      title: "KPI para aumentar la lealtad",
      concepts: ["relevance"],
      objective: "Aumentar la lealtad de los clientes",
      prompt: "¿Qué indicador te daría la mejor evidencia?",
      options: [
        { id: "a", text: "Satisfacción de los clientes después de la compra", credit: 0.6,
          why: "Está relacionada con la lealtad y ayuda a explicarla, pero un cliente satisfecho no siempre vuelve a comprar." },
        { id: "b", text: "Número de clientes nuevos del mes", credit: 0.15,
          why: "Mide crecimiento, no lealtad: una empresa puede ganar muchos clientes nuevos y perder a los anteriores." },
        { id: "c", text: "Porcentaje de correos promocionales abiertos", credit: 0.2,
          why: "Muestra interés en las promociones, pero abrir un correo no es volver a comprar." },
        { id: "d", text: "Tasa de recompra", credit: 1,
          why: "Es la evidencia más directa de lealtad: el cliente decide volver." }
      ],
      explain: "La lealtad se ve en lo que los clientes hacen. La satisfacción ayuda a explicarla, pero la recompra la mide.",
      takeaway: "Prefiere indicadores que midan el comportamiento deseado del cliente."
    },
    {
      id: "s3-chain", type: "info", stage: 3, chainDemo: true,
      title: "La cadena de KPI",
      lead: "Lo que acabas de hacer sigue siempre el mismo camino. Un KPI no va solo: forma parte de una secuencia.",
      body: "La tendrás disponible en cualquier momento con el botón «Guía KPI»."
    },
    {
      id: "s3q4", type: "chain", stage: 3, points: { relevance: 6 },
      title: "Ordenar la cadena de KPI",
      concepts: ["relevance", "targets"],
      scenario: "AquaFren quiere reducir sus problemas de calidad. Estas son cinco frases del caso.",
      prompt: "Indica a qué etapa de la cadena corresponde cada frase.",
      items: [
        { id: "i1", text: "Menos de 3%", answer: "meta" },
        { id: "i2", text: "Auditar al proveedor del material y reforzar la inspección", answer: "accion" },
        { id: "i3", text: "Reducir los problemas de calidad de las botellas", answer: "objetivo" },
        { id: "i4", text: "4.8% este mes", answer: "real" },
        { id: "i5", text: "Porcentaje de botellas defectuosas", answer: "kpi" }
      ],
      explain: "El objetivo da sentido al KPI; la meta indica cuánto queremos; el resultado real se compara con la meta; y esa diferencia impulsa la acción gerencial. Sin acción, el KPI solo informa.",
      takeaway: "Objetivo, KPI, meta, resultado real y acción forman una cadena: si falta una etapa, el indicador pierde utilidad."
    },
    {
      id: "s3q5", type: "choice", stage: 3, points: { analysis: 4 },
      title: "Formular una buena meta",
      concepts: ["targets"],
      scenario: "Las entregas de AquaFren tardan en promedio <strong>4.2 días</strong>. La gerencia quiere fijar una meta para el próximo trimestre.",
      prompt: "¿Cuál es la meta mejor formulada?",
      options: [
        { id: "a", text: "Entregar más rápido.", credit: 0, style: "accion",
          why: "Es una intención, no una meta: no dice cuánto ni para cuándo, así que nadie sabrá si se cumplió." },
        { id: "b", text: "Reducir el tiempo de entrega todo lo posible este trimestre.", credit: 0.2, style: "resultados",
          why: "Tiene plazo, pero «todo lo posible» no se puede medir ni comparar." },
        { id: "c", text: "Bajar el tiempo promedio de entrega de 4.2 a menos de 3 días antes de fin de trimestre.", credit: 1, style: "datos",
          why: "Dice qué se mide, cuánto se quiere lograr y para cuándo, y es exigente pero alcanzable." },
        { id: "d", text: "Que ningún pedido tarde más de 1 día, a partir de la próxima semana.", credit: 0.4, style: "cliente",
          why: "Es medible y piensa en el cliente, pero pasar de 4.2 días a 1 día en una semana es poco realista; una meta imposible desmotiva." }
      ],
      explain: "Una buena meta dice qué se mide, cuánto se quiere lograr y para cuándo. Además, debe ser exigente pero alcanzable.",
      takeaway: "Una meta útil es medible, tiene plazo y es realista."
    },
    {
      id: "s3-recap", type: "info", recap: true, stage: 3,
      title: "Resumen de la etapa 3",
      lead: "Acabas de aprender conceptos nuevos y algunas ideas pueden reforzarse. Revísalas o avanza a la siguiente etapa."
    },

    /* ===== ETAPA 4 · intermedia ===== */
    {
      id: "s4-intro", type: "info", stage: 4,
      title: "Etapa 4: usa los KPI para investigar",
      lead: "Llegó la hora de investigar. Revisarás el tablero de este mes, pondrás a prueba una conclusión y, al final, armarás tu propio tablero.",
      body: "Aquí ya no se trata de definiciones: se trata de leer varios indicadores a la vez y decidir qué hacer. En varias preguntas habrá más de una opción razonable."
    },
    {
      id: "s4-investigate", type: "investigate", stage: 4, section: "El caso del tablero", points: { analysis: 4 }, minOpen: 4,
      title: "Investigar el tablero",
      concepts: ["gaps"],
      scenario: "<strong>El caso.</strong> Las ventas de AquaFren aumentaron mucho este mes y la dirección ejecutiva cree que la empresa va mejor. Investiga el tablero antes de la reunión y determina si la evidencia respalda esa conclusión.",
      prompt: "Toca cada indicador para abrir su ficha: verás el resultado, la meta, el estado y una interpretación.",
      explain: "Un buen análisis revisa toda la evidencia antes de concluir. Cada tarjeta que no abres es una pista sin explorar.",
      takeaway: "Revisa todos los indicadores relevantes antes de sacar conclusiones."
    },
    {
      id: "s4q1", type: "choice", fixedOrder: true, stage: 4, section: "El caso del tablero", points: { analysis: 7 },
      title: "Evaluar la conclusión de la dirección ejecutiva",
      concepts: ["gaps", "tradeoffs"],
      quote: { who: "La dirección ejecutiva", text: "Las ventas están 20% por encima de la meta, así que vamos muy bien." },
      prompt: "¿Estás de acuerdo?",
      options: [
        { id: "a", text: "Sí. Los ingresos son el indicador más importante.", credit: 0, style: "resultados",
          why: "Los ingresos son importantes, pero ningún indicador cuenta toda la historia. Cinco de ocho KPI están peor que su meta." },
        { id: "b", text: "Depende: otros KPI muestran señales de problemas.", credit: 1, style: "datos",
          why: "Conversión, retención, quejas, entregas y defectos están peor que la meta. Un solo KPI favorable no basta para concluir." },
        { id: "c", text: "Falta información para saberlo.", credit: 0.5, style: "prudente",
          why: "Es una postura prudente. Pero el tablero ya da evidencia suficiente para advertir problemas, aunque se pueda seguir investigando." }
      ],
      explain: "Un solo KPI rara vez da una imagen completa. Las ventas suben, pero los clientes regresan menos, se quejan más y reciben entregas tardías con más defectos.",
      takeaway: "Un solo KPI rara vez da una imagen completa del desempeño de una organización."
    },
    {
      id: "s4q2", type: "choice", stage: 4, section: "El caso del tablero", points: { analysis: 6 },
      title: "Interpretar tráfico y conversión",
      concepts: ["tradeoffs"],
      scenario: "El tráfico del sitio está 17% por encima de la meta, pero la tasa de conversión (3.7%) quedó por debajo de la meta (4.0%).",
      prompt: "¿Qué harías con esta combinación?",
      options: [
        { id: "a", text: "Dar por cumplido el trabajo de marketing: el tráfico superó la meta, y la conversión es tarea del equipo de ventas.", credit: 0.2, style: "resultados",
          why: "Cada área tiene sus KPI, pero si llegan visitantes que no compran, quizá la publicidad atrae al público equivocado. Los dos datos están conectados." },
        { id: "b", text: "Revisar la calidad del tráfico y la experiencia de compra: más visitantes no se están convirtiendo en compradores.", credit: 1, style: "datos",
          why: "Lee los dos KPI juntos y busca la causa antes de actuar." },
        { id: "c", text: "Esperar un mes: 0.3 puntos es una variación pequeña que puede ser normal.", credit: 0.4, style: "prudente",
          why: "Ignorar variaciones mínimas es sensato, pero con 82,000 visitas son unos 246 pedidos menos, y otros indicadores también empeoran." },
        { id: "d", text: "Bajar los precios para que más visitantes se animen a comprar.", credit: 0.15, style: "accion",
          why: "Podría subir la conversión, pero sin conocer la causa es una apuesta, y reduce el margen de cada venta." }
      ],
      explain: "Leer dos KPI juntos revela lo que uno solo esconde: el tráfico mejora, pero la capacidad de vender empeora.",
      takeaway: "Los indicadores se interpretan en conjunto: uno que mejora puede esconder otro que empeora."
    },
    {
      id: "s4q4", type: "choice", stage: 4, section: "El caso del tablero", points: { decision: 5 },
      title: "Elegir la acción ante la brecha de retención",
      concepts: ["gaps", "decisions"],
      scenario: "La retención de clientes está en <strong>21%</strong> y la meta es <strong>28%</strong>. Falta la última etapa de la cadena: la acción gerencial.",
      prompt: "¿Qué decides?",
      options: [
        { id: "a", text: "Ajustar la meta a 23%: quizá 28% era demasiado ambicioso.", credit: 0.2, style: "resultados",
          why: "Revisar una meta puede ser válido si estaba mal calculada. Pero hacerlo justo cuando no se cumple, y sin analizar causas, maquilla el problema." },
        { id: "b", text: "Investigar por qué no regresan (encuestas, entregas, defectos), definir acciones con responsables y revisar el KPI cada mes.", credit: 1, style: "datos",
          why: "Convierte la brecha en acción: busca causas, asigna responsables y vuelve a medir." },
        { id: "c", text: "Crear un programa de puntos para premiar a quienes vuelvan a comprar.", credit: 0.45, style: "cliente",
          why: "Puede ayudar a la lealtad, pero si los clientes se van por defectos y entregas lentas, un premio no resuelve la causa." },
        { id: "d", text: "Esperar un mes más antes de actuar, por si fue algo pasajero.", credit: 0.2, style: "prudente",
          why: "Observar puede ser prudente, pero aquí la caída viene acompañada de otras señales negativas." }
      ],
      explain: "Una brecha entre meta y resultado es una invitación a actuar. El KPI no resuelve nada por sí solo: sirve para decidir dónde y qué mejorar.",
      takeaway: "Una brecha frente a la meta debe terminar en una acción concreta, con seguimiento."
    },
    {
      id: "s4q5", type: "choice", stage: 4, section: "El caso del tablero", points: { decision: 6 },
      title: "Recomendación para la reunión con la dirección ejecutiva",
      concepts: ["decisions", "tradeoffs"],
      scenario: "Es hora de la reunión. La dirección ejecutiva te pide tu recomendación.",
      prompt: "¿Qué dices?",
      options: [
        { id: "a", text: "«Superamos la meta de ventas. Propongo invertir más en publicidad para seguir creciendo.»", credit: 0.15, style: "resultados",
          why: "Más tráfico con conversión a la baja y clientes insatisfechos puede empeorar las cosas." },
        { id: "b", text: "«Las ventas van bien, pero cinco de ocho KPI están peor que la meta. Antes de crecer más, corrijamos entregas y defectos y protejamos la retención.»", credit: 1, style: "datos",
          why: "Reconoce lo positivo, usa varios KPI y propone prioridades basadas en evidencia." },
        { id: "c", text: "«Los clientes están molestos: propongo pedir disculpas públicamente y dar descuentos a quienes se quejaron.»", credit: 0.3, style: "cliente",
          why: "Cuida la relación con los clientes, pero no corrige lo que causa las quejas." },
        { id: "d", text: "«Necesito una semana más de análisis antes de recomendar algo.»", credit: 0.35, style: "prudente",
          why: "Pedir más datos es prudente, pero la gerencia también debe ofrecer un primer diagnóstico con la evidencia disponible." }
      ],
      explain: "Una buena recomendación reconoce lo que va bien, señala lo que preocupa, usa varios KPI y propone una prioridad.",
      takeaway: "Recomienda con evidencia: reconoce lo bueno, señala lo preocupante y propone prioridades."
    },
    {
      id: "s4-trap-intro", type: "info", stage: 4, section: "La trampa del KPI",
      title: "La trampa del KPI",
      lead: "Un KPI mal diseñado puede provocar justo lo contrario de lo que se buscaba.",
      body: "Veamos qué le pasó a AquaFren cuando la gerencia fijó una meta para el servicio al cliente.",
      trap: true
    },
    {
      id: "s4q7", type: "choice", stage: 4, section: "La trampa del KPI", points: { decision: 5 },
      title: "Corregir el KPI del servicio al cliente",
      concepts: ["tradeoffs", "decisions"],
      scenario: "La gerencia fijó la meta de responder a los clientes en <strong>menos de 2 horas</strong>. El tiempo de respuesta mejoró de 10 horas a 1.8 horas: <strong>meta cumplida</strong>. Pero la satisfacción de los clientes cayó de 89% a 71%.",
      prompt: "¿Cuál es la mejor decisión gerencial?",
      options: [
        { id: "a", text: "Mantener la meta y premiar al equipo: cumplió lo que se le pidió.", credit: 0.1, style: "resultados",
          why: "Es justo reconocer el esfuerzo, pero premiar solo la velocidad refuerza la conducta que causó el problema." },
        { id: "b", text: "Mantener el tiempo de respuesta, pero sumar KPI de resultado (satisfacción, % de casos resueltos) y revisar cómo se premia al equipo.", credit: 1, style: "datos",
          why: "Equilibra velocidad y calidad, y alinea los incentivos con el objetivo verdadero." },
        { id: "c", text: "Cambiar el tiempo de respuesta por la satisfacción como único KPI del área.", credit: 0.45, style: "cliente",
          why: "Pone el foco en el cliente, pero vuelve a depender de un solo KPI y pierde la información sobre la velocidad." },
        { id: "d", text: "Pedir al equipo que explique la caída antes de cambiar nada.", credit: 0.4, style: "prudente",
          why: "Escuchar al equipo es útil, pero la evidencia ya muestra un problema en el diseño del KPI que conviene corregir." }
      ],
      explain: "La solución no es dejar de medir, sino medir mejor: combinar KPI que se equilibren entre sí para que mejorar uno no sacrifique otro.",
      concept: "<strong>Ley de los KPI:</strong> cuando una medida se convierte en el objetivo, deja de ser una buena medida.",
      takeaway: "Combina KPI que se equilibren entre sí, para que mejorar uno no sacrifique otro."
    },
    {
      id: "s4-final", type: "dashboard", stage: 4, section: "Tu tablero", pick: 5, points: { selection: 16, decision: 9 },
      title: "Armar el tablero gerencial",
      concepts: ["relevance", "decisions"],
      scenario: "<strong>Reto final.</strong> Ahora eres responsable del tablero mensual de gestión de AquaFren.",
      prompt: "Solo puedes elegir cinco indicadores. ¿Cuáles merecen la atención de la gerencia?",
      explain: "Hay más de una combinación válida. Un buen tablero reúne indicadores de resultado, relevantes para los objetivos, que permitan actuar, que cubran distintas áreas del negocio y que eviten métricas de vanidad.",
      takeaway: "Un buen tablero combina pocos indicadores de resultado que cubren distintas áreas y permiten actuar."
    },
    {
      id: "s4-recap", type: "info", recap: true, stage: 4,
      title: "Resumen de la etapa 4",
      lead: "Acabas de aprender conceptos nuevos y algunas ideas pueden reforzarse. Revísalas o continúa con la reflexión final."
    },
    {
      id: "s4-reflection", type: "reflection", stage: 4, section: "Reflexión final",
      title: "Reflexión final",
      lead: "Antes de ver tu informe, escribe con tus propias palabras lo que te llevas.",
      prompt: "¿Cuál es la mayor diferencia entre una métrica y un KPI?",
      note: "Esta respuesta no suma puntos. Aparece en tu informe para que tu profesor o profesora pueda leerla."
    }
  ];

  global.KPI_DATA = D;
})(window);
