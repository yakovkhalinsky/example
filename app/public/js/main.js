// Page wiring: builds the example cards, hooks up Run buttons, and
// runs the side-by-side comparison (decision model vs normal LLM on
// the same state and questions, in parallel).

import { els } from "./els.js";
import { decideFull, askLLM } from "./api.js";
import { renderCompare, renderPartial, esc } from "./render.js";
import { EXAMPLES } from "./examples.js";
import { initSettings } from "./settings.js";

async function runCompare(resultsEl, state, questions, afterFn) {
  resultsEl.innerHTML = `<p class="note">Asking both models…</p>`;
  const [so, llm] = await Promise.allSettled([decideFull(state, questions), askLLM(state, questions)]);
  resultsEl.innerHTML = (so.status === "fulfilled" && llm.status === "fulfilled")
    ? renderCompare(so.value, llm.value, afterFn)
    : renderPartial(so, llm);
}

function buildExampleCard(ex) {
  const section = document.createElement("section");
  section.className = "card";
  const qSummary = Object.entries(ex.questions)
    .map(([n, q]) => `<code>${n}</code> (${q.type})`).join(" · ");
  section.innerHTML = `
    <h2>${ex.title}</h2>
    <p class="note">${ex.blurb}</p>
    <label>State<textarea class="state" rows="${ex.stateIsJson ? 9 : 4}">${esc(ex.state)}</textarea></label>
    <p class="qsummary">Questions: ${qSummary}</p>
    <button class="runBtn">Run decision</button>
    <div class="results"></div>`;
  const button = section.querySelector(".runBtn");
  const results = section.querySelector(".results");
  button.addEventListener("click", async () => {
    button.disabled = true;
    try {
      const raw = section.querySelector(".state").value;
      const state = ex.stateIsJson ? JSON.parse(raw) : raw;
      await runCompare(results, state, ex.questions, ex.after);
    } catch (e) {
      results.innerHTML = `<div class="error">${esc(e.message)}</div>`;
    } finally {
      button.disabled = false;
    }
  });
  return section;
}

for (const ex of EXAMPLES) els.examples.appendChild(buildExampleCard(ex));

els.pgRun.addEventListener("click", async () => {
  els.pgRun.disabled = true;
  try {
    const questions = JSON.parse(els.pgQuestions.value);
    await runCompare(els.pgResults, els.pgState.value, questions);
  } catch (err) {
    els.pgResults.innerHTML = `<div class="error">${esc(err.message)}</div>`;
  } finally {
    els.pgRun.disabled = false;
  }
});

initSettings();
