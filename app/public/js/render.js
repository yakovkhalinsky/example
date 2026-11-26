// Rendering: decision answers as probability bars, and the
// side-by-side comparison of a decision model vs a normal LLM.

export const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;");

const pct = (p) => `${Math.round(p * 100)}%`;

function barRow(label, p, top) {
  return `<div class="bar-row"><span class="lbl">${label}</span>` +
    `<div class="bar${top ? " top" : ""}"><div style="width:${(p * 100).toFixed(1)}%"></div></div>` +
    `<span class="val">${pct(p)}</span></div>`;
}

function renderAnswer(name, a) {
  let html = `<div class="answer"><span class="name">${name}:</span> `;
  if (a.type === "choice") {
    html += `<span class="verdict">${a.choice}</span>`;
    const ranked = Object.entries(a.probabilities || {}).sort((x, y) => y[1] - x[1]);
    for (const [label, p] of ranked) html += barRow(label, p, label === a.choice);
  } else if (a.type === "noul") {
    const yes = a.noul >= 0.5;
    html += `<span class="verdict">${yes ? "yes" : "no"}</span>`;
    html += barRow("yes", a.noul, yes) + barRow("no", 1 - a.noul, !yes);
  } else if (a.type === "score") {
    const level = (a.legend || {})[String(Math.round(a.score))] ?? "?";
    html += `<span class="verdict">${level}</span> <span class="val">score ${a.score.toFixed(2)} of ${Object.keys(a.legend || {}).length - 1}</span>`;
    const ranked = Object.entries(a.probabilities || {})
      .sort((x, y) => Number(x[0]) - Number(y[0]));
    for (const [idx, p] of ranked) html += barRow(a.legend[idx] ?? idx, p, idx === String(Math.round(a.score)));
  }
  return html + "</div>";
}

export function renderAnswers(answers) {
  return Object.entries(answers).map(([n, a]) => renderAnswer(n, a)).join("");
}

const inputBlock = (input) => input
  ? `<details class="inputBlock" open><summary>Whole input sent</summary><pre class="raw">${esc(input)}</pre></details>` : "";

// Each side renders independently: the two Run buttons fill their
// own half of the comparison grid, in whichever order they're clicked.
export function renderDecisionSide(so, afterFn) {
  const usage = so.usage ? `${so.usage.input_tokens ?? "?"} in / ${so.usage.output_tokens ?? 0} out tokens` : "tokens n/a";
  return `<div class="side"><h3>Decision model — ${esc(so.model)}</h3>
    <p class="note">${so.ms} ms · ${usage} · probabilities, no generated text</p>
    ${renderAnswers(so.answers)}${afterFn ? afterFn(so.answers) : ""}
    ${inputBlock(so.input)}</div>`;
}

export function renderLLMSide(llm) {
  const usage = llm.usage ? `${llm.usage.prompt_tokens ?? llm.usage.input_tokens ?? "?"} in / ${llm.usage.completion_tokens ?? llm.usage.output_tokens ?? "?"} out tokens` : "tokens n/a";
  return `<div class="side"><h3>Normal LLM — ${esc(llm.model)}</h3>
    <p class="note">${llm.ms} ms · ${usage} · generated text</p>
    <pre class="raw">${esc(llm.text)}</pre>
    ${inputBlock(llm.input)}</div>`;
}

export function renderError(e) {
  return `<div class="error">${esc(e.message)}</div>`;
}
