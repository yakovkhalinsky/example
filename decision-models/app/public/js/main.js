// Page wiring: builds the example cards and hooks up the Run
// buttons. Each card (and the playground) has two independent
// buttons — Run decision model and Run LLM — and each fills its own
// side of the comparison grid, so the two can be run in any order
// and compared side by side.

import { els } from "./els.js";
import { decideFull, askLLM } from "./api.js";
import { renderDecisionSide, renderLLMSide, renderError, esc } from "./render.js";
import { EXAMPLES } from "./examples.js";
import { initSettings } from "./settings.js";

// The results area is a two-column grid with one slot per model;
// slots are created on first use with a "not run yet" placeholder.
function ensureSlots(resultsEl) {
  let decision = resultsEl.querySelector(".slotDecision");
  if (!decision) {
    resultsEl.innerHTML = `<div class="compare">
      <div class="slotDecision"><p class="note">Decision model not run yet.</p></div>
      <div class="slotLlm"><p class="note">LLM not run yet.</p></div>
    </div>`;
    decision = resultsEl.querySelector(".slotDecision");
  }
  return { decision, llm: resultsEl.querySelector(".slotLlm") };
}

// Attach one Run button: on click it fills its side's slot with the
// rendered result (or the error), leaving the other side untouched.
function attachRun(button, resultsEl, slotName, run) {
  button.addEventListener("click", async () => {
    button.disabled = true;
    const slot = ensureSlots(resultsEl)[slotName];
    slot.innerHTML = `<p class="note">Asking…</p>`;
    try {
      slot.innerHTML = await run();
    } catch (e) {
      slot.innerHTML = renderError(e);
    } finally {
      button.disabled = false;
    }
  });
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
    <button class="runDecision">Run decision model</button>
    <button class="runLlm">Run LLM</button>
    <div class="results"></div>`;
  const results = section.querySelector(".results");
  const getState = () => {
    const raw = section.querySelector(".state").value;
    return ex.stateIsJson ? JSON.parse(raw) : raw;
  };
  attachRun(section.querySelector(".runDecision"), results, "decision",
    async () => renderDecisionSide(await decideFull(getState(), ex.questions), ex.after));
  attachRun(section.querySelector(".runLlm"), results, "llm",
    async () => renderLLMSide(await askLLM(getState(), ex.questions)));
  return section;
}

for (const ex of EXAMPLES) els.examples.appendChild(buildExampleCard(ex));

// Playground: same two buttons, state/questions read from the form.
const pgQuestions = () => JSON.parse(els.pgQuestions.value);
attachRun(els.pgRunDecision, els.pgResults, "decision",
  async () => renderDecisionSide(await decideFull(els.pgState.value, pgQuestions())));
attachRun(els.pgRunLlm, els.pgResults, "llm",
  async () => renderLLMSide(await askLLM(els.pgState.value, pgQuestions())));

initSettings();
