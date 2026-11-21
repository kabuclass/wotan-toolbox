/* KPI Detective — informe en PDF.
 * Recibe el objeto que devuelve KPIGame.buildReport() y genera el PDF en el navegador
 * con pdf-lib (js/vendor/pdf-lib.min.js, licencia MIT). No toca el DOM ni usa internet.
 */
(function (global) {
  "use strict";

  const pad = (n) => String(n).padStart(2, "0");
  const fmtDate = (d) => pad(d.getDate()) + "/" + pad(d.getMonth() + 1) + "/" + d.getFullYear();
  const num = (x) => (Math.round(x * 10) / 10).toString();

  /* Las fuentes estándar del PDF solo admiten WinAnsi: se reemplaza lo que no cabe (por ejemplo, emojis). */
  const clean = (t) => String(t == null ? "" : t).replace(/[\u{1F000}-\u{1FFFF}\u2600-\u27BF\uFE0F\u200D]/gu, "").replace(/[^\x20-\x7E\xA0-\xFF\u2013\u2014\u2018\u2019\u201C\u201D\u2022\u2026]/g, "?");

  const COLORS = { text: [0.09, 0.12, 0.15], muted: [0.35, 0.4, 0.44], accent: [0.04, 0.37, 0.51], line: [0.8, 0.83, 0.85], track: [0.9, 0.92, 0.94] };

  async function pdf(r) {
    const L = global.PDFLib;
    const doc = await L.PDFDocument.create();
    const font = await doc.embedFont(L.StandardFonts.Helvetica);
    const bold = await doc.embedFont(L.StandardFonts.HelveticaBold);
    const W = 595.28, H = 841.89, M = 54, MAXW = W - 2 * M;
    const rgb = (c) => L.rgb(c[0], c[1], c[2]);
    let page, y;

    function newPage() { page = doc.addPage([W, H]); y = H - M; }
    function ensure(h) { if (y - h < M) newPage(); }

    function wrap(text, f, size, width) {
      const out = [];
      clean(text).split("\n").forEach((para) => {
        let line = "";
        para.split(/\s+/).filter(Boolean).forEach((word) => {
          const test = line ? line + " " + word : word;
          if (f.widthOfTextAtSize(test, size) <= width) { line = test; return; }
          if (line) out.push(line);
          line = word;
        });
        out.push(line);
      });
      return out;
    }

    function text(t, o) {
      o = o || {};
      const size = o.size || 11, f = o.bold ? bold : font, lead = size * 1.4, x = M + (o.indent || 0);
      wrap(t, f, size, MAXW - (o.indent || 0) - (o.right || 0)).forEach((ln) => {
        ensure(lead);
        y -= lead;
        page.drawText(ln, { x, y: y + size * 0.25, size, font: f, color: rgb(o.color || COLORS.text) });
      });
      y -= o.after === undefined ? 4 : o.after;
    }

    function heading(t) { ensure(40); y -= 10; text(t, { size: 14, bold: true, color: COLORS.accent, after: 6 }); }

    function row(label, value, fraction) {
      ensure(30);
      const size = 11;
      y -= 15;
      page.drawText(clean(label), { x: M, y, size, font, color: rgb(COLORS.text) });
      const v = clean(value);
      page.drawText(v, { x: W - M - bold.widthOfTextAtSize(v, size), y, size, font: bold, color: rgb(COLORS.text) });
      if (fraction !== undefined) {
        y -= 9;
        page.drawRectangle({ x: M, y, width: MAXW, height: 5, color: rgb(COLORS.track) });
        page.drawRectangle({ x: M, y, width: Math.max(1, MAXW * Math.min(1, fraction)), height: 5, color: rgb(COLORS.accent) });
        y -= 4;
      } else {
        page.drawLine({ start: { x: M, y: y - 5 }, end: { x: W - M, y: y - 5 }, thickness: 0.5, color: rgb(COLORS.line) });
        y -= 6;
      }
    }

    newPage();
    text("KPI Detective", { size: 22, bold: true, color: COLORS.accent, after: 0 });
    text("Informe de resultados", { size: 12, color: COLORS.muted, after: 14 });
    text("Estudiante: " + r.name, { bold: true, after: 0 });
    text("Fecha: " + fmtDate(r.date), { color: COLORS.muted, after: 10 });

    text("Entendiste " + r.ideas.understood + " de " + r.ideas.total + " ideas", { size: 17, bold: true, after: 2 });
    if (r.ideas.progress) text("Y " + r.ideas.progress + " más en progreso.", { color: COLORS.muted, after: 4 });
    r.stages.forEach((st) => row(st.title, st.understood + " de " + st.total));
    y -= 6;
    ensure(70);
    y -= 44;
    page.drawText(String(r.score), { x: M, y, size: 44, font: bold, color: rgb(COLORS.text) });
    page.drawText("/ 100", { x: M + bold.widthOfTextAtSize(String(r.score), 44) + 8, y: y + 4, size: 16, font, color: rgb(COLORS.muted) });
    y -= 10;
    text(r.level.name, { size: 15, bold: true, color: COLORS.accent, after: 2 });
    text(r.level.text, { after: 6 });

    if (r.style) {
      const S = global.KPI_DATA.styles, p = S[r.style.primary];
      heading("Tu estilo de decisión: " + p.name);
      text(p.manager, { after: 4 });
      text("Tu fortaleza: " + p.strength, { after: 2 });
      text("Tu riesgo: " + p.risk, { after: 2 });
      text("Un consejo: " + p.tip, { after: 4 });
      if (r.style.secondary) text("Cuando elegiste otras opciones, tu tendencia fue " + S[r.style.secondary].name.toLowerCase() + ".", { color: COLORS.muted });
    }

    heading("Puntaje por dimensión");
    r.dimensions.forEach((d) => row(d.label, num(d.earned) + " / " + d.max, d.fraction));

    heading("Tu perfil");
    text("Habilidad más fuerte: " + r.strongText + ".", { after: 4 });
    text("Área por mejorar: " + r.improveText + ".");

    heading("Conceptos");
    r.concepts.forEach((c) => row(c.label, c.status));

    if (r.review.length) {
      heading("Para repasar");
      r.review.forEach((x) => { text(x.title, { bold: true, after: 0 }); text(x.takeaway, { color: COLORS.muted, after: 6 }); });
    }

    heading("Reflexión del estudiante");
    text("¿Cuál es la mayor diferencia entre una métrica y un KPI?", { color: COLORS.muted, after: 3 });
    text(r.reflection || "Sin respuesta.", { indent: 10 });

    heading("Detalle por decisión");
    r.details.forEach((d) => row(d.title, num(d.earned) + " / " + d.max));

    const pages = doc.getPages();
    pages.forEach((p, i) => {
      const t = clean("KPI Detective · " + r.name + " · página " + (i + 1) + " de " + pages.length).replace(/·/g, "-");
      p.drawText(t, { x: M, y: 28, size: 8.5, font, color: rgb(COLORS.muted) });
    });
    return doc.save();
  }

  global.KPIReport = { pdf, fmtDate };
})(window);
