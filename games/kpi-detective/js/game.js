/* KPI Detective — motor del juego.
 * Estado, puntaje, progreso y construcción del informe. No toca el DOM.
 * La interfaz (ui.js) solo pide datos a KPIGame y le envía las respuestas.
 */
(function (global) {
  "use strict";

  const D = global.KPI_DATA;
  const STEPS = D.steps;
  const DIM_KEYS = Object.keys(D.dimensions);
  const STORAGE_KEY = "kpi-detective-v1";
  const QUESTION_TYPES = ["choice", "multi", "chain", "investigate", "dashboard"];

  const clamp = (x, a, b) => Math.min(b === undefined ? 1 : b, Math.max(a === undefined ? 0 : a, x));
  const round1 = (x) => Math.round(x * 10) / 10;
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => (
    { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  /* ---------- Estado ---------- */
  function freshState() {
    return {
      version: D.meta.version,
      phase: "welcome",            // welcome | playing | report
      currentStep: 0,
      currentStage: 1,
      score: 0,
      selectedAnswers: {},         // id de paso -> respuesta
      results: {},                 // id de paso -> { fraction, parts, earned }
      completedStages: [],
      playerProfile: { name: "" },
      reflection: "",
      finishedAt: null
    };
  }
  let state = freshState();

  /* ---------- Utilidades de pasos ---------- */
  const isQuestion = (step) => QUESTION_TYPES.indexOf(step.type) !== -1;
  const stepById = (id) => STEPS.find((s) => s.id === id);
  const currentStep = () => STEPS[state.currentStep] || null;
  const questionSteps = () => STEPS.filter(isQuestion);

  /* ---------- Reto final: mejor combinación posible (para normalizar) ---------- */
  function finalCriteria(ids) {
    const picks = ids.map((id) => D.finalMetrics.find((m) => m.id === id)).filter(Boolean);
    const n = picks.length || 1;
    const mean = (k) => picks.reduce((s, m) => s + m[k], 0) / n;
    const relevance = mean("rel");
    const outcome = mean("out");
    const actionability = mean("act");
    const vanityAvoid = clamp(1 - picks.reduce((s, m) => s + m.vanity, 0) / 2);
    const areas = new Set(picks.map((m) => m.area).filter((a) => a !== "interno"));
    const balance = [0, 0.3, 0.6, 0.85, 1][Math.min(areas.size, 4)];
    return {
      relevance, outcome, actionability, vanityAvoid, balance, areas: Array.from(areas),
      selectionRaw: 0.35 * relevance + 0.30 * outcome + 0.35 * vanityAvoid,
      decisionRaw: 0.45 * actionability + 0.55 * balance
    };
  }

  /* La mejor combinación posible (la que más puntos suma entre selección y decisión)
   * fija el 100% del reto final, de modo que sí existe una selección con puntaje perfecto. */
  let bestFinalCache = null;
  function bestFinal() {
    if (bestFinalCache) return bestFinalCache;
    const ids = D.finalMetrics.map((m) => m.id);
    const step = stepById("s4-final");
    const need = step.pick;
    let bestTotal = -1, best = null;
    (function walk(start, chosen) {
      if (chosen.length === need) {
        const c = finalCriteria(chosen);
        const total = step.points.selection * c.selectionRaw + step.points.decision * c.decisionRaw;
        if (total > bestTotal) { bestTotal = total; best = { selection: c.selectionRaw, decision: c.decisionRaw, example: chosen.slice() }; }
        return;
      }
      for (let i = start; i < ids.length; i++) { chosen.push(ids[i]); walk(i + 1, chosen); chosen.pop(); }
    })(0, []);
    bestFinalCache = best;
    return bestFinalCache;
  }

  /* ---------- Validación y puntaje de una respuesta ---------- */
  function isAnswerValid(step, answer) {
    if (answer == null) return false;
    switch (step.type) {
      case "choice": return step.options.some((o) => o.id === answer);
      case "multi":
        if (!Array.isArray(answer)) return false;
        if (step.pick && answer.length !== step.pick) return false;
        if (!step.pick && answer.length < 1) return false;
        return answer.every((id) => step.options.some((o) => o.id === id)) && new Set(answer).size === answer.length;
      case "chain":
        return step.items.every((it) => answer[it.id] && D.chain.some((c) => c.id === answer[it.id]));
      case "investigate":
        return Array.isArray(answer) && new Set(answer).size >= step.minOpen;
      case "dashboard":
        return Array.isArray(answer) && answer.length === step.pick && new Set(answer).size === step.pick &&
          answer.every((id) => D.finalMetrics.some((m) => m.id === id));
      default: return false;
    }
  }

  function fractionFor(step, answer) {
    switch (step.type) {
      case "choice":
        return { fraction: step.options.find((o) => o.id === answer).credit };
      case "multi": {
        if (step.scoring === "correct") {
          const total = step.options.filter((o) => o.correct).length;
          const good = answer.filter((id) => step.options.find((o) => o.id === id).correct).length;
          const bad = answer.length - good;
          return { fraction: clamp((good - bad) / total) };
        }
        const best = step.options.map((o) => o.score).sort((a, b) => b - a).slice(0, step.pick).reduce((s, x) => s + x, 0);
        const got = answer.reduce((s, id) => s + step.options.find((o) => o.id === id).score, 0);
        return { fraction: clamp(got / best) };
      }
      case "chain": {
        const ok = step.items.filter((it) => answer[it.id] === it.answer).length;
        return { fraction: ok / step.items.length };
      }
      case "investigate":
        return { fraction: clamp(new Set(answer).size / D.dashboard.length) };
      case "dashboard": {
        const c = finalCriteria(answer);
        const b = bestFinal();
        const sel = clamp(c.selectionRaw / b.selection);
        const dec = clamp(c.decisionRaw / b.decision);
        return { fraction: (sel + dec) / 2, parts: { selection: sel, decision: dec }, criteria: c };
      }
      default: return { fraction: 0 };
    }
  }

  function computeResult(step, answer) {
    const base = fractionFor(step, answer);
    const earned = {}, max = {};
    Object.keys(step.points).forEach((dim) => {
      const part = base.parts && base.parts[dim] !== undefined ? base.parts[dim] : base.fraction;
      max[dim] = step.points[dim];
      earned[dim] = Math.round(step.points[dim] * part * 100) / 100; // dos decimales
    });
    const maxTotal = Object.keys(max).reduce((s, k) => s + max[k], 0);
    const earnedTotal = Object.keys(earned).reduce((s, k) => s + earned[k], 0);
    return { fraction: maxTotal ? earnedTotal / maxTotal : 0, earned, max, earnedTotal, maxTotal, criteria: base.criteria || null };
  }

  /* ---------- Totales ---------- */
  function totals() {
    const byDim = {};
    DIM_KEYS.forEach((k) => { byDim[k] = { earned: 0, max: 0 }; });
    questionSteps().forEach((step) => {
      Object.keys(step.points).forEach((dim) => { byDim[dim].max += step.points[dim]; });
      const r = state.results[step.id];
      if (r) Object.keys(r.earned).forEach((dim) => { byDim[dim].earned += r.earned[dim]; });
    });
    const earned = DIM_KEYS.reduce((s, k) => s + byDim[k].earned, 0);
    const max = DIM_KEYS.reduce((s, k) => s + byDim[k].max, 0);
    return { byDim, earned, max };
  }

  function levelFor(score) {
    const s = Math.round(score);
    return D.levels.find((l) => s >= l.min && s <= l.max) || D.levels[0];
  }

  /* Nivel de cada opción, para las tarjetas de retroalimentación: best | ok | weak */
  function optionLevel(step, o) {
    if (step.type === "choice") return o.credit === 1 ? "best" : o.credit >= 0.4 ? "ok" : "weak";
    if (step.scoring === "correct") return o.correct ? "ok" : "weak";
    return o.score >= 1 ? "best" : o.score >= 0.5 ? "ok" : "weak";
  }
  function metricLevel(m) {
    const q = (m.rel + m.out + m.act) / 3 - m.vanity * 0.3;
    return q >= 0.85 ? "best" : q >= 0.5 ? "ok" : "weak";
  }

  /* Cuenta los estilos de decisión de las opciones elegidas (para el perfil del informe). */
  function styleTally() {
    const t = {};
    Object.keys(D.styles).forEach((k) => { t[k] = 0; });
    STEPS.forEach((s) => {
      if (s.type !== "choice" || !state.results[s.id]) return;
      const o = s.options.find((x) => x.id === state.selectedAnswers[s.id]);
      if (o && o.style) t[o.style] += 1;
    });
    return t;
  }

  /* Enfoque formativo: cada decisión es una idea; se considera comprendida con 75% o más. */
  const UNDERSTOOD = 0.75;
  function ideaStatus(fraction) {
    return fraction >= UNDERSTOOD ? "Comprendida" : fraction >= 0.4 ? "En progreso" : "Por reforzar";
  }
  function ideas(stage) {
    const qs = questionSteps().filter((s) => stage === undefined || s.stage === stage);
    const understood = qs.filter((s) => state.results[s.id] && state.results[s.id].fraction >= UNDERSTOOD).length;
    const progress = qs.filter((s) => state.results[s.id] && state.results[s.id].fraction >= 0.4 && state.results[s.id].fraction < UNDERSTOOD).length;
    return { understood, progress, total: qs.length, answered: qs.filter((s) => state.results[s.id]).length };
  }

  /* Estilo predominante (todas las elecciones) y tendencia alternativa (cuando no se eligió la opción más sólida). */
  function styleProfile() {
    const keys = Object.keys(D.styles);
    const all = {}, alt = {};
    keys.forEach((k) => { all[k] = 0; alt[k] = 0; });
    STEPS.forEach((s) => {
      if (s.type !== "choice" || !state.results[s.id]) return;
      const o = s.options.find((x) => x.id === state.selectedAnswers[s.id]);
      if (!o || !o.style) return;
      all[o.style] += 1;
      if (o.credit < 1) alt[o.style] += 1;
    });
    const top = (t) => keys.reduce((b, k) => (t[k] > t[b] ? k : b), keys[0]);
    const total = keys.reduce((n, k) => n + all[k], 0);
    const altTotal = keys.reduce((n, k) => n + alt[k], 0);
    if (!total) return null;
    const primary = top(all);
    const secondary = altTotal ? top(alt) : null;
    return { primary, secondary: secondary && secondary !== primary ? secondary : null, counts: all, total, altTotal };
  }

  function toneFor(fraction) {
    if (fraction >= 0.85) return "strong";
    if (fraction >= 0.4) return "partial";
    return "weak";
  }

  /* ---------- Persistencia (opcional: puede fallar en modo privado) ---------- */
  function save() {
    try { global.localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (e) { /* sin almacenamiento */ }
  }
  function loadSaved() {
    try {
      const raw = global.localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const saved = JSON.parse(raw);
      if (!saved || saved.version !== D.meta.version || saved.phase === "welcome") return null;
      return saved;
    } catch (e) { return null; }
  }
  function clearSaved() {
    try { global.localStorage.removeItem(STORAGE_KEY); } catch (e) { /* nada */ }
  }

  /* ---------- Acciones ---------- */
  function start(profile) {
    state = freshState();
    state.playerProfile = { name: String((profile && profile.name) || "").trim().slice(0, 60) };
    state.phase = "playing";
    state.currentStage = STEPS[0].stage;
    save();
    return state;
  }

  function resume() {
    const saved = loadSaved();
    if (!saved) return false;
    state = Object.assign(freshState(), saved);
    return true;
  }

  function restart() {
    clearSaved();
    state = freshState();
  }

  /* Idempotente: una segunda llamada devuelve el resultado ya guardado. */
  function submit(stepId, answer) {
    const step = stepById(stepId);
    if (!step || !isQuestion(step)) return null;
    if (state.results[stepId]) return state.results[stepId];
    if (!isAnswerValid(step, answer)) return null;
    const result = computeResult(step, answer);
    state.selectedAnswers[stepId] = answer;
    state.results[stepId] = result;
    state.score = totals().earned;
    save();
    return result;
  }

  function advance() {
    const step = currentStep();
    if (!step) return;
    if (isQuestion(step) && !state.results[step.id]) return; // no se puede saltar una decisión
    const next = STEPS[state.currentStep + 1];
    if (!next) {
      if (state.completedStages.indexOf(step.stage) === -1) state.completedStages.push(step.stage);
      state.phase = "report";
      state.finishedAt = new Date().toISOString();
    } else {
      if (next.stage !== step.stage && state.completedStages.indexOf(step.stage) === -1) state.completedStages.push(step.stage);
      state.currentStep += 1;
      state.currentStage = next.stage;
    }
    save();
  }

  function setReflection(text) {
    state.reflection = String(text || "").slice(0, 600);
    save();
  }

  /* ---------- Informe final ---------- */
  function buildReport() {
    const t = totals();
    const score = Math.round(t.earned);
    const level = levelFor(score);

    const dimensions = DIM_KEYS.map((k) => ({
      key: k, label: D.dimensions[k].label,
      earned: round1(t.byDim[k].earned), max: t.byDim[k].max,
      fraction: t.byDim[k].max ? t.byDim[k].earned / t.byDim[k].max : 0
    }));
    const sorted = dimensions.slice().sort((a, b) => b.fraction - a.fraction);
    const strongest = sorted[0];
    const weakest = sorted[sorted.length - 1];
    const allHigh = weakest.fraction >= 0.95;

    const concepts = Object.keys(D.concepts).map((key) => {
      let earned = 0, max = 0;
      questionSteps().forEach((step) => {
        if (step.concepts.indexOf(key) === -1) return;
        const r = state.results[step.id];
        if (!r) return;
        earned += r.earnedTotal; max += r.maxTotal;
      });
      const fraction = max ? earned / max : 0;
      return { key, label: D.concepts[key], fraction, status: fraction >= 0.75 ? "Dominado" : fraction >= 0.4 ? "En progreso" : "Por reforzar" };
    });

    const review = questionSteps()
      .filter((s) => state.results[s.id] && state.results[s.id].fraction < 0.75)
      .sort((a, b) => state.results[a.id].fraction - state.results[b.id].fraction)
      .slice(0, 3)
      .map((s) => ({ id: s.id, title: s.title, takeaway: s.takeaway, fraction: state.results[s.id].fraction }));

    const details = questionSteps().map((s) => {
      const r = state.results[s.id];
      return { id: s.id, title: s.title, stage: s.stage, earned: r ? round1(r.earnedTotal) : 0, max: r ? r.maxTotal : 0, tone: r ? toneFor(r.fraction) : "weak" };
    });

    return {
      name: state.playerProfile.name || "Estudiante",
      date: state.finishedAt ? new Date(state.finishedAt) : new Date(),
      score, level, dimensions, strongest, weakest, allHigh,
      strongText: D.dimensions[strongest.key].strong,
      improveText: allHigh ? "Sigue practicando: aplica este razonamiento a los indicadores de una empresa real" : D.dimensions[weakest.key].improve,
      concepts, review, details,
      reflection: state.reflection.trim(),
      ideas: ideas(),
      stages: D.stages.map((st) => Object.assign({ title: st.title, id: st.id }, ideas(st.id))),
      style: styleProfile()
    };
  }

  /* ---------- Validación del contenido (para pruebas y para quien edite data.js) ---------- */
  function validateContent() {
    const errors = [];
    const ids = new Set();
    const sums = {};
    DIM_KEYS.forEach((k) => { sums[k] = 0; });
    STEPS.forEach((s) => {
      if (ids.has(s.id)) errors.push("id repetido: " + s.id);
      ids.add(s.id);
      if (!isQuestion(s)) return;
      Object.keys(s.points).forEach((k) => {
        if (!(k in sums)) errors.push(s.id + ": dimensión desconocida " + k);
        else sums[k] += s.points[k];
      });
      (s.concepts || []).forEach((c) => { if (!D.concepts[c]) errors.push(s.id + ": concepto desconocido " + c); });
      if (s.type === "choice") {
        if (!s.options.some((o) => o.credit === 1)) errors.push(s.id + ": no hay opción con crédito 1");
        s.options.forEach((o) => {
          if (o.credit < 0 || o.credit > 1 || !o.why) errors.push(s.id + ": opción " + o.id + " mal definida");
          if (o.style && !D.styles[o.style]) errors.push(s.id + ": estilo desconocido " + o.style);
        });
      }
    });
    DIM_KEYS.forEach((k) => { sums[k] = Math.round(sums[k] * 100) / 100; if (sums[k] !== 25) errors.push("la dimensión " + k + " suma " + sums[k] + " (debe sumar 25)"); });
    return errors;
  }

  global.KPIGame = {
    data: D, steps: STEPS, esc, clamp, round1,
    get state() { return state; },
    isQuestion, stepById, currentStep, questionSteps,
    isAnswerValid, finalCriteria, bestFinal, totals, levelFor, toneFor, optionLevel, metricLevel, styleTally, styleProfile, ideas, ideaStatus,
    start, resume, restart, loadSaved, submit, advance, setReflection, buildReport, validateContent, save
  };
})(window);
