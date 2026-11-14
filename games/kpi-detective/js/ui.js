/* KPI Detective — interfaz.
 * Dibuja cada paso y envía las respuestas al motor (KPIGame). No calcula puntajes.
 */
(function (global) {
  "use strict";

  const G = global.KPIGame;
  const D = global.KPI_DATA;
  const esc = G.esc;
  const app = document.getElementById("app");
  const guideDialog = document.getElementById("guideDialog");
  const cardDialog = document.getElementById("cardDialog");
  const reduceMotion = global.matchMedia && global.matchMedia("(prefers-reduced-motion: reduce)").matches;

  let draft = {};              // respuesta que el estudiante está armando, antes de confirmar
  let drafts = {};             // borradores por pantalla, para no perder lo marcado al ir y volver
  let view = null;             // pantalla que se está viendo; null = la más avanzada
  const frontier = () => G.state.currentStep;
  const viewIdx = () => (view === null || view >= frontier() ? frontier() : Math.max(0, view));
  const stepAt = () => G.steps[viewIdx()];
  const reviewing = () => G.state.phase === "playing" && viewIdx() < frontier();
  let orderCache = {};         // orden de opciones por pregunta (estable durante la sesión)

  /* ---------- Utilidades ---------- */
  const pts = (x) => String(Math.round(x * 10) / 10);
  const plural = (n, one, many) => (n === 1 ? one : many);

  function hashSeed(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }
  function seededShuffle(arr, seed) {
    const a = arr.slice();
    let s = seed;
    const rnd = () => { s |= 0; s = (s + 0x6d2b79f5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  }
  /* Las opciones de opción múltiple se mezclan para que la mejor no ocupe siempre el mismo lugar. */
  function orderedOptions(step) {
    if (orderCache[step.id]) return orderCache[step.id];
    const keep = step.type !== "choice" || step.fixedOrder || step.layout === "binary";
    orderCache[step.id] = keep ? step.options : seededShuffle(step.options, hashSeed(step.id));
    return orderCache[step.id];
  }

  const ICONS = {
    strong: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="2"/><path d="M7 12.5l3.2 3.2L17 8.8" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    partial: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 2a10 10 0 0 1 0 20z" fill="currentColor"/></svg>',
    weak: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 7v6.5M12 16.8v.2" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/></svg>'
  };

  function stageTitle(n) { return D.stages.find((s) => s.id === n).title; }

  /* ---------- Encabezado persistente ---------- */
  function updateHeader() {
    const s = G.state;
    const status = document.getElementById("status");
    const bar = document.getElementById("progress");
    const cur = s.phase === "playing" ? stepAt() : null;
    if (cur) document.body.dataset.stage = cur.stage; else delete document.body.dataset.stage;
    if (s.phase === "welcome") { status.hidden = true; bar.hidden = true; return; }
    status.hidden = false; bar.hidden = false;
    let label;
    if (s.phase === "report") label = "Informe final";
    else {
      const step = stepAt();
      label = step.type === "reflection" ? "Reflexión final" : "Etapa " + step.stage + " de " + D.stages.length;
    }
    document.getElementById("statusStage").textContent = label;
    const id = G.ideas();
    document.getElementById("statusScore").textContent = id.understood;
    document.getElementById("statusTotal").textContent = id.total;
    const pct = s.phase === "report" ? 100 : Math.round((s.currentStep / G.steps.length) * 100);
    document.getElementById("progressFill").style.width = pct + "%";
    bar.setAttribute("aria-valuenow", String(pct));
    bar.setAttribute("aria-valuetext", label + ", " + pct + "% completado");
  }

  /* ---------- Piezas reutilizables ---------- */
  function gaugeHTML(k, actual, target, favorable, fixedMax) {
    const max = fixedMax || Math.max(actual, target) * 1.18;
    const w = Math.max(3, (actual / max) * 100);
    const t = (target / max) * 100;
    const label = "Resultado " + k.actual + ", meta " + k.target + ", " + (favorable ? "favorable" : "desfavorable");
    return '<div class="gauge" role="img" aria-label="' + esc(label) + '"><div class="gauge-track">' +
      '<div class="gauge-fill ' + (favorable ? "" : "is-bad") + '" style="width:' + w.toFixed(1) + '%"></div>' +
      '<div class="gauge-target" style="left:' + t.toFixed(1) + '%"></div></div>' +
      '<div class="gauge-legend"><span>Resultado: <b>' + esc(k.actual) + '</b></span><span>Meta (línea clara): <b>' + esc(k.target) + "</b></span></div></div>";
  }

  function kpiStatus(k) {
    const favorable = k.better === "higher" ? k.actualNum >= k.targetNum : k.actualNum <= k.targetNum;
    const position = k.better === "higher"
      ? (favorable ? "Por encima de la meta" : "Por debajo de la meta")
      : (favorable ? "Dentro del límite" : "Fuera del límite");
    const trendFav = (k.trend === "up") === (k.better === "higher");
    return { favorable, position, trendText: (k.trend === "up" ? "Sube" : "Baja") + (trendFav ? ", a favor" : ", en contra") };
  }

  function chainHTML(withExamples, wide) {
    return '<ol class="chain' + (wide ? " wide" : "") + '">' + D.chain.map((c) =>
      '<li><span class="chain-name">' + esc(c.label) + '</span><span class="chain-text">' + esc(c.text) + "</span>" +
      (withExamples ? '<span class="chain-example"><b>Ejemplo:</b> ' + esc(c.example) + "</span>" : "") + "</li>").join("") + "</ol>";
  }

  /* ---------- Bienvenida ---------- */
  function welcomeView() {
    const saved = G.loadSaved();
    const resume = saved ? '<section class="card" aria-labelledby="resumeTitle"><h2 id="resumeTitle">Tienes una partida en curso</h2>' +
      '<p class="muted">' + (saved.phase === "report" ? "Ya terminaste el juego. Puedes ver tu informe otra vez." : "Puedes seguir donde la dejaste.") + '</p>' +
      '<div class="btn-row"><button type="button" class="btn primary" data-action="resume">' + (saved.phase === "report" ? "Ver mi informe" : "Continuar la partida") + '</button>' +
      '<button type="button" class="btn" data-action="fresh">Empezar de nuevo</button></div></section>' : "";
    return resume +
      '<section class="hero"><h1 data-focus tabindex="-1">KPI Detective</h1>' +
      '<p class="hero-sub">Las ventas de ' + D.meta.company + ' están por encima de la meta. ¿Será que eso significa que la empresa va bien?</p></section>' +
      '<div class="teaser" aria-label="Dos indicadores de AquaFren">' +
        '<div class="kcard-demo"><strong>Ingresos</strong>' + gaugeHTML(D.dashboard[0], 108, 90, true) + '</div>' +
        '<div class="kcard-demo"><strong>Retención de clientes</strong>' + gaugeHTML(D.dashboard[2], 21, 28, false) + '</div>' +
      '</div>' +
      '<p>Eres analista junior en ' + D.meta.company + ', ' + D.meta.companyDesc + '. Vas a investigar su desempeño, tomar unas 24 decisiones y descubrir qué números ayudan de verdad a la gerencia. La actividad dura aproximadamente 25 minutos.</p>' +
      '<ol class="loop" aria-label="Cómo funciona"><li>Decides</li><li>Recibes retroalimentación</li><li>Entiendes por qué</li><li>Sigues con el próximo reto</li></ol>' +
      '<form id="startForm" class="card" novalidate>' +
        '<label class="field"><span>Tu nombre</span><input id="fName" name="name" type="text" autocomplete="name" maxlength="60" placeholder="Aparecerá en tu informe"></label>' +
                '<button type="submit" class="btn primary">Comenzar la investigación</button>' +
      '</form>';
  }

  /* ---------- Pasos informativos ---------- */
  const STATUS_CLASS = { "Comprendida": "st-Dominado", "En progreso": "st-progress", "Por reforzar": "st-Reforzar" };
  function recapView(step) {
    const qs = G.questionSteps().filter((s) => s.stage === step.stage);
    const id = G.ideas(step.stage);
    const items = qs.map((s) => {
      const r = G.state.results[s.id];
      const st = r ? G.ideaStatus(r.fraction) : "Por reforzar";
      return '<li class="recap-item"><div class="recap-head"><strong>' + esc(s.title) + '</strong><span class="' + STATUS_CLASS[st] + '">' + st + "</span></div>" +
        '<p>' + esc(s.takeaway) + "</p></li>";
    }).join("");
    const last = step.stage === D.stages.length;
    return '<p class="stage-label">' + esc(D.stages.find((s) => s.id === step.stage).title) + "</p>" +
      '<h2 data-focus tabindex="-1">' + esc(step.title) + "</h2>" +
      '<p class="recap-count">' + (id.understood === id.total ? "¡Muy buen trabajo! Ya conoces las ideas de esta etapa." : "Ahora ya conoces algunas ideas nuevas, vas por buen camino.") + "</p>" +
      '<p class="lead">' + (id.understood === id.total
        ? "Muy buen trabajo: dominas las ideas de esta etapa. Puedes repasarlas o " + (last ? "continuar con la reflexión final." : "avanzar a la siguiente etapa.")
        : "Acabas de aprender conceptos nuevos y algunas ideas pueden reforzarse. Revísalas o " + (last ? "continúa con la reflexión final." : "avanza a la siguiente etapa.")) + "</p>" +
      '<ul class="recap-list">' + items + "</ul>" +
      (reviewing() ? "" : '<div class="btn-row"><button type="button" class="btn primary" data-action="next">' + (last ? "Ir a la reflexión final" : "Seguir a la etapa " + (step.stage + 1)) + "</button></div>");
  }

  function infoView(step) {
    if (step.recap) return recapView(step);
    const isStageIntro = /-intro$/.test(step.id) && !step.trap;
    const stage = D.stages.find((s) => s.id === step.stage);
    return (/^Etapa /.test(step.title) ? "" : '<p class="stage-label">' + esc(step.section || stage.title) + "</p>") +
      '<h2 data-focus tabindex="-1">' + esc(step.title) + "</h2>" +
      '<p class="lead">' + step.lead + "</p>" +
      (step.body ? "<p>" + step.body + "</p>" : "") +
      (step.chainDemo ? '<div class="card"><h3>Ejemplo con el servicio al cliente</h3>' + chainHTML(true, true) + "</div>" : "") +
      (isStageIntro ? '<p class="small-note">Duración aproximada: ' + esc(stage.time) + ".</p>" : "") +
      (reviewing() ? "" : '<div class="btn-row"><button type="button" class="btn primary" data-action="next">' + (step.id === "s1-intro" ? "Empezar" : "Continuar") + "</button></div>");
  }

  /* ---------- Preguntas ---------- */
  function scenarioHTML(step) {
    let h = "";
    if (step.objective) h += '<div class="objective"><b>Objetivo del negocio</b>' + esc(step.objective) + "</div>";
    if (step.quote) h += '<blockquote class="quote">«' + esc(step.quote.text) + '»<cite>' + esc(step.quote.who) + "</cite></blockquote>";
    if (step.scenario) h += "<p>" + step.scenario + "</p>";
    return h ? '<section class="card">' + h + "</section>" : "";
  }

  const LEVEL_LABEL = { best: "Opción más sólida", ok: "Razonable", weak: "Poco útil" };
  const LEVEL_LABEL_METRIC = { best: "Muy útil", ok: "Razonable", weak: "Poco útil" };

  function optionHTML(step, o, answered, answer) {
    if (answered) return answeredOptionHTML(step, o, answer);
    const multi = step.type === "multi" || step.type === "dashboard";
    const picked = multi ? (draft.value || []).indexOf(o.id) !== -1 : draft.value === o.id;
    return '<label class="opt ' + (multi ? "check" : "") + '">' +
      '<input type="' + (multi ? "checkbox" : "radio") + '" name="' + step.id + '" value="' + o.id + '"' + (picked ? " checked" : "") + ">" +
      '<span class="opt-body"><span class="opt-mark" aria-hidden="true"></span><span class="opt-main">' +
      '<span class="opt-title"><span>' + o.text + "</span>" + (o.value ? '<span class="opt-value">' + esc(o.value) + "</span>" : "") + "</span>" +
      (o.desc ? '<span class="opt-desc">' + esc(o.desc) + "</span>" : "") + "</span></span></label>";
  }

  /* Tarjeta ya respondida: todas las explicaciones se muestran de inmediato, sin botones. */
  function answeredOptionHTML(step, o, answer) {
    const multi = step.type === "multi" || step.type === "dashboard";
    const isMetric = step.type === "dashboard";
    const picked = multi ? answer.indexOf(o.id) !== -1 : answer === o.id;
    const level = isMetric ? G.metricLevel(D.finalMetrics.find((m) => m.id === o.id)) : G.optionLevel(step, o);
    const label = (isMetric ? LEVEL_LABEL_METRIC : LEVEL_LABEL)[level];
    return '<div class="opt is-answered level-' + level + (picked ? " is-mine" : "") + '"><div class="opt-body">' +
      '<span class="opt-mark' + (picked ? " on" : "") + (multi ? " sq" : "") + '" aria-hidden="true"></span><div class="opt-main">' +
      '<span class="opt-title"><span>' + o.text + "</span>" + (o.value ? '<span class="opt-value">' + esc(o.value) + "</span>" : "") + "</span>" +
      (o.desc ? '<span class="opt-desc">' + esc(o.desc) + "</span>" : "") +
      '<span class="opt-tags">' + (picked ? '<span class="tag mine">Tu elección</span>' : "") + '<span class="tag ' + level + '">' + label + "</span></span>" +
      '<span class="opt-why">' + (o.why || "") + "</span>" +
      "</div></div></div>";
  }

  function chainFormHTML(step, answered, answer) {
    return '<div class="chain-q">' + step.items.map((it) => {
      const chosen = answered ? answer[it.id] : (draft.value || {})[it.id] || "";
      const ok = answered && chosen === it.answer;
      const correctLabel = D.chain.find((c) => c.id === it.answer).label;
      return '<div class="row ' + (answered ? (ok ? "ok" : "no") : "") + '"><label for="c-' + it.id + '">' + esc(it.text) + "</label>" +
        '<select id="c-' + it.id + '" data-chain="' + it.id + '"' + (answered ? " disabled" : "") + '><option value="" disabled selected hidden></option>' +
        D.chain.map((c) => '<option value="' + c.id + '"' + (chosen === c.id ? " selected" : "") + ">" + esc(c.label) + "</option>").join("") + "</select>" +
        (answered ? '<span class="row-res">' + (ok ? "<strong>Correcto.</strong>" : "Corresponde a: <strong>" + esc(correctLabel) + ".</strong>") + "</span>" : "") + "</div>";
    }).join("") + "</div>";
  }

  function investigateHTML(step, answered, answer) {
    const seen = new Set(answered ? answer : (draft.opened || []));
    return '<ul class="dash-grid">' + D.dashboard.map((k) =>
      '<li><button type="button" class="kcard-btn' + (seen.has(k.id) ? " seen" : "") + '" data-action="open-card" data-id="' + k.id + '">' +
      '<span class="kcard-name"><span>' + esc(k.name) + "</span>" + (seen.has(k.id) ? '<span class="seen-tag">Revisado</span>' : "") + "</span>" +
      '<span class="kcard-actual">' + esc(k.actual) + "</span>" +
      '<span class="kcard-meta">Meta: ' + esc(k.target) + ". Tendencia: " + (k.trend === "up" ? "sube" : "baja") + ".</span></button></li>").join("") + "</ul>" +
      '<p class="counter" id="counter" aria-live="polite">' + counterText(step, seen.size) + "</p>";
  }

  function counterText(step, n) {
    if (step.type === "investigate") {
      return "Revisaste <b>" + n + "</b> de " + D.dashboard.length + " indicadores." + (n < step.minOpen ? " Abre al menos " + step.minOpen + " para continuar." : "");
    }
    if (step.pick) return "Has elegido <b>" + n + "</b> de " + step.pick + ".";
    return "Has marcado <b>" + n + "</b>.";
  }

  function questionView(step) {
    const answered = !!G.state.results[step.id];
    const answer = G.state.selectedAnswers[step.id];
    const stage = D.stages.find((s) => s.id === step.stage);
    let options = "";
    let hint = "";
    if (step.type === "choice") {
      options = '<div class="options ' + (step.layout === "binary" ? "binary" : "") + '">' + orderedOptions(step).map((o) => optionHTML(step, o, answered, answer)).join("") + "</div>";
    } else if (step.type === "multi") {
      options = '<div class="options">' + step.options.map((o) => optionHTML(step, o, answered, answer)).join("") + "</div>" +
        '<p class="counter" id="counter" aria-live="polite">' + counterText(step, answered ? answer.length : 0) + "</p>";
      hint = step.pick ? "Elige exactamente " + step.pick + "." : "Puedes marcar más de una.";
    } else if (step.type === "dashboard") {
      const items = D.finalMetrics.map((m) => ({ id: m.id, text: m.name, desc: m.desc, why: answered ? m.why : "" }));
      options = '<div class="options">' + items.map((o) => optionHTML(step, o, answered, answer)).join("") + "</div>" +
        '<p class="counter" id="counter" aria-live="polite">' + counterText(step, answered ? answer.length : 0) + "</p>";
      hint = "Elige exactamente " + step.pick + ".";
    } else if (step.type === "chain") {
      options = chainFormHTML(step, answered, answer);
    } else if (step.type === "investigate") {
      options = investigateHTML(step, answered, answer);
    }
    const submitLabel = step.type === "investigate" ? "Terminar la revisión" : "Confirmar respuesta";
    const button = answered ? "" : '<div class="btn-row"><button type="submit" class="btn primary" id="confirmBtn" disabled>' + submitLabel + "</button></div>";
    return '<p class="stage-label">' + esc(step.section || stage.title) + "</p>" +
      (step.hideTitle ? '<h2 class="step-title" data-focus tabindex="-1" aria-label="' + esc(step.title) + '"></h2>' : '<h2 class="step-title" data-focus tabindex="-1">' + esc(step.title) + "</h2>") +
      scenarioHTML(step) +
      '<form id="qform" data-step="' + step.id + '" novalidate><fieldset><legend>' + step.prompt + "</legend>" +
      (hint ? '<p class="pick-hint">' + hint + "</p>" : "") + options + "</fieldset>" + button + "</form>" +
      (answered ? feedbackHTML(step) : "");
  }

  /* ---------- Retroalimentación ---------- */
  function feedbackTitle(step, tone) {
    const t = {
      choice: { strong: "Elección sólida", partial: "Buena intuición, pero hay una opción más sólida", weak: "Hay otras opciones mejores" },
      multi: { strong: "Muy buena selección", partial: "Buena selección, con margen de mejora", weak: "Hay otras selecciones mejores" },
      chain: { strong: "Cadena bien armada", partial: "Cadena casi completa", weak: "Conviene repasar la cadena" },
      investigate: { strong: "Investigación completa", partial: "Investigación registrada", weak: "Investigación registrada" },
      dashboard: { strong: "Tablero sólido", partial: "Tablero con buen criterio", weak: "Tablero por reforzar" }
    };
    return t[step.type][tone];
  }

  function criteriaHTML(c) {
    const lvl = (x) => (x >= 0.75 ? "Alta" : x >= 0.45 ? "Media" : "Baja");
    const rows = [
      ["Relevancia estratégica", c.relevance], ["Orientación a resultados", c.outcome], ["Capacidad de actuar", c.actionability],
      ["Equilibrio entre áreas", c.balance], ["Alejarse de métricas de vanidad", c.vanityAvoid]
    ];
    return '<h3>Cómo se evaluó tu tablero</h3><ul class="criteria">' + rows.map((r) =>
      "<li><span>" + r[0] + '</span><strong>' + lvl(r[1]) + '</strong><div class="bar" aria-hidden="true"><i style="width:' + Math.round(r[1] * 100) + '%"></i></div></li>').join("") + "</ul>" +
      '<p class="small-note">Áreas cubiertas: ' + (c.areas.length ? c.areas.map((a) => D.areaLabels[a]).join(", ") : "ninguna") + ". Hay más de una combinación válida.</p>";
  }

  function feedbackHTML(step) {
    const r = G.state.results[step.id];
    const tone = G.toneFor(r.fraction);
    let extra = "";
    if (step.type === "dashboard") extra = criteriaHTML(r.criteria);
    if (step.targetsDemo) extra = '<div class="targets-demo">' + step.targetsDemo.map((t) =>
      '<div class="kcard-demo"><strong>' + esc(t.label) + "</strong>" +
      gaugeHTML({ actual: "21%", target: t.target + "%" }, 21, t.target, 21 >= t.target, 33) +
      '<p class="small-note">' + esc(t.note) + "</p></div>").join("") + "</div>";
    if (step.type === "investigate") {
      const seen = new Set(G.state.selectedAnswers[step.id]);
      const missing = D.dashboard.filter((k) => !seen.has(k.id)).map((k) => k.name);
      extra = missing.length ? "<p>Te faltó revisar: <strong>" + missing.map(esc).join(", ") + ".</strong> Puedes abrir esas tarjetas ahora para ver lo que se quedó sin explorar.</p>" : "";
    }
    return '<section class="feedback ' + tone + '" id="feedback" aria-labelledby="fbTitle">' +
      '<h3 class="fb-title" id="fbTitle" tabindex="-1">' + ICONS[tone] + "<span>" + feedbackTitle(step, tone) + "</span></h3>" +
      '<p class="fb-points"><span class="' + STATUS_CLASS[G.ideaStatus(r.fraction)] + '">Idea ' + G.ideaStatus(r.fraction).toLowerCase() + "</span>. Sumaste " + pts(r.earnedTotal) + " de " + r.maxTotal + " " + plural(r.maxTotal, "punto", "puntos") + ".</p>" +
      "<p>" + step.explain + "</p>" + extra +
      (step.concept ? '<div class="concept">' + step.concept + "</div>" : "") +
      (reviewing() ? "" : '<div class="btn-row"><button type="button" class="btn primary" data-action="next">Continuar</button></div>') + "</section>";
  }

  /* ---------- Reflexión ---------- */
  function reflectionView(step) {
    return '<p class="stage-label">Reflexión final</p><h2 data-focus tabindex="-1">' + esc(step.title) + "</h2>" +
      '<p class="lead">' + step.lead + "</p>" +
      '<form id="reflectForm" class="card" novalidate><label class="field"><span>' + step.prompt + "</span>" +
      '<textarea id="reflectText" maxlength="600" placeholder="Escribe aquí con tus palabras">' + esc(G.state.reflection) + "</textarea></label>" +
      '<p class="small-note">' + step.note + "</p>" +
      '<div class="btn-row"><button type="submit" class="btn primary">Ver mi informe</button></div></form>';
  }

  /* ---------- Informe ---------- */
  function styleHTML(sp) {
    if (!sp) return "";
    const S = D.styles, p = S[sp.primary];
    const max = Math.max.apply(null, Object.keys(S).map((k) => sp.counts[k])) || 1;
    const bars = Object.keys(S).map((k) => '<li><span>' + esc(S[k].name) + '</span><span class="num">' + sp.counts[k] + '</span><div class="bar" aria-hidden="true"><i style="width:' + Math.round((sp.counts[k] / max) * 100) + '%"></i></div></li>').join("");
    return '<section class="card style-card"><h3>Tu estilo de decisión</h3>' +
      '<p class="style-name">' + esc(p.name) + "</p><p>" + esc(p.manager) + "</p>" +
      '<dl class="facts style-facts"><dt>Tu fortaleza</dt><dd>' + esc(p.strength) + "</dd><dt>Tu riesgo</dt><dd>" + esc(p.risk) + "</dd><dt>Un consejo</dt><dd>" + esc(p.tip) + "</dd></dl>" +
      (sp.secondary ? '<p class="small-note">Cuando elegiste otras opciones, tu tendencia fue <strong>' + esc(S[sp.secondary].name.toLowerCase()) + "</strong>: " + esc(S[sp.secondary].text.charAt(0).toLowerCase() + S[sp.secondary].text.slice(1)) + " Riesgo a vigilar: " + esc(S[sp.secondary].risk.charAt(0).toLowerCase() + S[sp.secondary].risk.slice(1)) + "</p>" : "") +
      '<details><summary>Ver cómo se repartieron tus ' + sp.total + ' decisiones de juicio</summary><ul class="dims">' + bars + "</ul></details>" +
      '<p class="small-note">Ningún estilo es mejor que otro: cada uno tiene fortalezas y riesgos. Conocer el tuyo te ayuda a compensarlo.</p></section>';
  }

  function reportView() {
    const r = G.buildReport();
    const dims = r.dimensions.map((d) => '<li><span>' + esc(d.label) + '</span><span class="num">' + pts(d.earned) + " / " + d.max +
      '</span><div class="bar" aria-hidden="true"><i style="width:' + Math.round(d.fraction * 100) + '%"></i></div></li>').join("");
    const stages = r.stages.map((s) => '<li><span>' + esc(s.title) + '</span><span class="num">' + s.understood + " de " + s.total + "</span></li>").join("");
    const concepts = r.concepts.map((c) => '<li><span>' + esc(c.label) + '</span><span class="st-' + (c.status === "En progreso" ? "progress" : c.status === "Dominado" ? "Dominado" : "Reforzar") + '">' + c.status + "</span></li>").join("");
    const review = r.review.length ? '<section class="card"><h3>Para repasar</h3><ul class="pill-list block">' +
      r.review.map((x) => "<li><strong>" + esc(x.title) + ".</strong> " + esc(x.takeaway) + "</li>").join("") + "</ul></section>" : "";
    const details = r.details.map((d) => "<tr><td>" + esc(d.title) + "</td><td>" + pts(d.earned) + " / " + d.max + "</td></tr>").join("");
    return '<p class="stage-label">Informe final</p>' +
      '<section class="card report-head"><h2 data-focus tabindex="-1">Informe de ' + esc(r.name) + "</h2>" +
      '<p class="muted">' + KPIReport.fmtDate(r.date) + "</p>" +
      '<p class="ideas-big">Entendiste <strong>' + r.ideas.understood + "</strong> de " + r.ideas.total + " ideas</p>" +
      (r.ideas.progress ? '<p class="muted">Y tienes ' + r.ideas.progress + " " + (r.ideas.progress === 1 ? "idea" : "ideas") + " más en progreso: vas por buen camino.</p>" : "") +
      '<ul class="pill-list">' + stages + "</ul>" +
      '<p class="score-line"><span class="score-mid">' + r.score + '<small> / 100</small></span> <span class="level-name">' + esc(r.level.name) + "</span></p>" +
      "<p>" + esc(r.level.text) + "</p></section>" +
      styleHTML(r.style) +
      '<section class="card"><h3>Tus habilidades</h3><p><strong>Habilidad más fuerte:</strong> ' + esc(r.strongText) + ".</p><p><strong>Área por mejorar:</strong> " + esc(r.improveText) + '.</p><ul class="dims">' + dims + "</ul></section>" +
      '<section class="card"><h3>Conceptos</h3><ul class="pill-list">' + concepts + "</ul></section>" + review +
      '<section class="card"><h3>Tu reflexión</h3><p class="small-note">¿Cuál es la mayor diferencia entre una métrica y un KPI?</p>' +
      (r.reflection ? '<div class="reflection-box">' + esc(r.reflection) + "</div>" : '<p class="muted">Esta respuesta quedó en blanco.</p>') + "</section>" +
      '<details class="card"><summary>Detalle por decisión</summary><table class="mini-table"><tr><th>Decisión</th><th>Puntos</th></tr>' + details + "</table></details>" +
      '<div class="btn-row no-print"><button type="button" class="btn primary" data-action="download">Descargar informe en PDF</button>' +
      '<button type="button" class="btn ghost" data-action="again">Jugar de nuevo</button></div>' +
      '<p class="status-msg no-print" id="statusMsg" role="status" aria-live="polite"></p>';
  }

  /* ---------- Flechas de navegación ---------- */
  const ARROW = {
    back: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    fwd: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>'
  };
  function canForward() {
    if (reviewing()) return true;
    const step = G.currentStep();
    return step.type === "info" || (G.isQuestion(step) && !!G.state.results[step.id]);
  }
  function pagerHTML() {
    return '<nav class="pager" aria-label="Navegación entre pantallas">' +
      '<button type="button" class="pager-btn" data-action="back" aria-label="Pantalla anterior"' + (viewIdx() === 0 ? " disabled" : "") + ">" + ARROW.back + "</button>" +
      '<button type="button" class="pager-btn" data-action="forward" aria-label="Pantalla siguiente"' + (canForward() ? "" : " disabled") + ">" + ARROW.fwd + "</button></nav>";
  }
  function reviewNoteHTML() {
    return reviewing() ? '<p class="review-note" role="status">Estás repasando una pantalla anterior. Tus respuestas ya están guardadas y no se pueden cambiar. ' +
      '<button type="button" class="btn small" data-action="frontier">Volver a donde ibas</button></p>' : "";
  }

  /* ---------- Render principal ---------- */
  function render(focus) {
    const s = G.state;
    updateHeader();
    if (s.phase === "welcome") app.innerHTML = welcomeView();
    else if (s.phase === "report") app.innerHTML = reportView();
    else {
      const step = stepAt();
      draft = drafts[step.id] = drafts[step.id] || {};
      app.innerHTML = pagerHTML() + reviewNoteHTML() +
        (step.type === "info" ? infoView(step) : step.type === "reflection" ? reflectionView(step) : questionView(step));
      if (G.isQuestion(step) && !s.results[step.id]) syncForm();
    }
    if (focus) {
      const target = app.querySelector("[data-focus]") || app;
      global.scrollTo(0, 0);
      target.focus({ preventScroll: true });
    }
  }

  function showFeedback() {
    const fb = document.getElementById("feedback");
    if (!fb) return;
    const t = document.getElementById("fbTitle");
    fb.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
    if (t) t.focus({ preventScroll: true });
  }

  /* ---------- Estado del formulario antes de confirmar ---------- */
  function syncForm() {
    const form = document.getElementById("qform");
    if (!form) return;
    const step = G.stepById(form.dataset.step);
    const btn = document.getElementById("confirmBtn");
    const counter = document.getElementById("counter");
    if (step.type === "choice") {
      const sel = form.querySelector("input:checked");
      draft.value = sel ? sel.value : null;
    } else if (step.type === "multi" || step.type === "dashboard") {
      const checked = Array.prototype.slice.call(form.querySelectorAll("input:checked")).map((i) => i.value);
      draft.value = checked;
      if (counter) counter.innerHTML = counterText(step, checked.length);
      if (step.pick) {
        const full = checked.length >= step.pick;
        form.querySelectorAll("input[type=checkbox]").forEach((i) => {
          i.disabled = full && !i.checked;
          i.closest(".opt").classList.toggle("is-limit", i.disabled);
        });
      }
    } else if (step.type === "chain") {
      const map = {};
      form.querySelectorAll("select[data-chain]").forEach((sel) => { if (sel.value) map[sel.dataset.chain] = sel.value; });
      draft.value = map;
    } else if (step.type === "investigate") {
      draft.value = draft.opened || [];
    }
    if (btn) btn.disabled = !G.isAnswerValid(step, draft.value);
  }

  /* ---------- Diálogos ---------- */
  function openDialog(dlg) {
    if (typeof dlg.showModal === "function") { if (!dlg.open) dlg.showModal(); } else dlg.setAttribute("open", "");
  }
  function closeDialog(dlg) {
    if (typeof dlg.close === "function") dlg.close(); else dlg.removeAttribute("open");
  }

  function openGuide() {
    guideDialog.innerHTML = '<div class="dialog-head"><h2 id="guideTitle">Guía KPI</h2><button type="button" class="btn ghost small" data-action="close-dialog">Cerrar</button></div>' +
      "<p><strong>Métrica</strong> = algo que medimos.<br><strong>KPI</strong> = una métrica estratégicamente importante, que se usa para evaluar el desempeño frente a un objetivo.</p>" +
      "<h3>La cadena de KPI</h3>" + chainHTML(false, false) +
      '<p class="small-note">Un KPI sin meta es solo un número. Que un indicador sea KPI depende del objetivo y del contexto, y un solo KPI rara vez cuenta toda la historia.</p>' +
      '<div class="btn-row"><button type="button" class="btn primary" data-action="close-dialog">Entendido</button></div>';
    openDialog(guideDialog);
  }

  function openKpiCard(id) {
    const k = D.dashboard.find((x) => x.id === id);
    if (!k) return;
    const st = kpiStatus(k);
    cardDialog.innerHTML = '<div class="dialog-head"><h2 id="cardTitle">' + esc(k.name) + '</h2><button type="button" class="btn ghost small" data-action="close-dialog">Cerrar</button></div>' +
      '<p><span class="badge ' + (st.favorable ? "good" : "bad") + '">' + (st.favorable ? "Favorable" : "Desfavorable") + ": " + st.position.toLowerCase() + "</span></p>" +
      '<dl class="facts"><dt>Resultado real</dt><dd>' + esc(k.actual) + "</dd><dt>Meta</dt><dd>" + esc(k.target) + "</dd><dt>Diferencia</dt><dd>" + esc(k.gap) +
      "</dd><dt>Tendencia</dt><dd>" + st.trendText + "</dd></dl>" + gaugeHTML(k, k.actualNum, k.targetNum, st.favorable) +
      "<h3 style=\"margin-top:1rem\">Interpretación</h3><p>" + esc(k.reading) + "</p>" +
      '<p class="small-note">En este indicador, un valor ' + (k.better === "higher" ? "más alto" : "más bajo") + " es mejor.</p>" +
      '<div class="btn-row"><button type="button" class="btn primary" data-action="close-dialog">Volver al tablero</button></div>';
    openDialog(cardDialog);
    const step = stepAt();
    if (step && step.type === "investigate" && !G.state.results[step.id]) {
      draft.opened = draft.opened || [];
      if (draft.opened.indexOf(id) === -1) draft.opened.push(id);
      const btn = app.querySelector('[data-id="' + id + '"]');
      if (btn && !btn.classList.contains("seen")) {
        btn.classList.add("seen");
        btn.querySelector(".kcard-name").insertAdjacentHTML("beforeend", '<span class="seen-tag">Revisado</span>');
      }
      const counter = document.getElementById("counter");
      if (counter) counter.innerHTML = counterText(step, draft.opened.length);
      syncForm();
    }
  }

  /* ---------- Exportar ---------- */
  function setMsg(text) { const m = document.getElementById("statusMsg"); if (m) m.textContent = text; }

  async function download() {
    setMsg("Generando el PDF…");
    try {
      const bytes = await KPIReport.pdf(G.buildReport());
      const blob = new Blob([bytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = "informe-kpi-detective.pdf";
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 4000);
      setMsg("Listo: revisa tu carpeta de descargas.");
    } catch (e) { setMsg("Algo falló al crear el PDF. Inténtalo de nuevo."); }
  }

  /* ---------- Eventos ---------- */
  function go() { view = null; render(true); }

  app.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-action]");
    if (!btn) return;
    const a = btn.dataset.action;
    if (a === "next") { G.advance(); go(); }
    else if (a === "open-card") openKpiCard(btn.dataset.id);
    else if (a === "resume") { G.resume(); go(); }
    else if (a === "fresh") { G.restart(); orderCache = {}; drafts = {}; view = null; render(true); }
    else if (a === "download") download();
    else if (a === "again") { G.restart(); orderCache = {}; drafts = {}; view = null; render(true); }
    else if (a === "back") { view = Math.max(0, viewIdx() - 1); render(true); }
    else if (a === "forward") {
      if (reviewing()) { const n = viewIdx() + 1; view = n >= frontier() ? null : n; render(true); }
      else if (canForward()) { G.advance(); go(); }
    }
    else if (a === "frontier") { view = null; render(true); }
  });

  app.addEventListener("change", (e) => {
    if (e.target.closest("#qform")) syncForm();
  });

  app.addEventListener("submit", (e) => {
    e.preventDefault();
    const form = e.target;
    if (form.id === "startForm") {
      G.start({ name: document.getElementById("fName").value });
      orderCache = {}; drafts = {}; go();
    } else if (form.id === "qform") {
      const step = G.stepById(form.dataset.step);
      syncForm();
      const result = G.submit(step.id, draft.value);
      if (!result) return;
      render(false);
      updateHeader();
      showFeedback();
    } else if (form.id === "reflectForm") {
      G.setReflection(document.getElementById("reflectText").value);
      G.advance(); go();
    }
  });

  document.getElementById("guideBtn").addEventListener("click", openGuide);
  [guideDialog, cardDialog].forEach((dlg) => {
    dlg.addEventListener("click", (e) => {
      if (e.target === dlg || e.target.closest("[data-action='close-dialog']")) closeDialog(dlg);
    });
  });

  /* ---------- Inicio ---------- */
  const problems = G.validateContent();
  if (problems.length && global.console) console.error("Contenido con errores:", problems);
  render(false);
})(window);
