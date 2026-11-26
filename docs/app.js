"use strict";

// --- The client: a browser port of jev.py (same wire format). ---

function endpoint() {
  const preset = document.getElementById("endpointPreset").value;
  if (preset === "same-origin") return location.origin;
  return (preset === "custom"
    ? document.getElementById("endpoint").value.trim()
    : preset).replace(/\/+$/, "");
}

function authHeaders() {
  const headers = { "Content-Type": "application/json" };
  const key = document.getElementById("apiKey").value.trim();
  if (key) headers["Authorization"] = `Bearer ${key}`;
  return headers;
}

async function decideFull(state, questions) {
  const model = document.getElementById("model").value || "clef:cloud";
  const payload = { model, state, questions };
  const t0 = performance.now();
  let resp;
  try {
    resp = await fetch(`${endpoint()}/v1/systemone`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(payload),
    });
  } catch (e) {
    throw new Error(
      `Network error calling ${endpoint()}/v1/systemone.\n` +
      `If this is a CORS or mixed-content block, check the browser console. ` +
      `Local daemons accept browser calls from localhost origins; Ollama Cloud needs a valid API key. (${e.message})`
    );
  }
  const text = await resp.text();
  if (!resp.ok) throw new Error(`HTTP ${resp.status} from the endpoint:\n${text}`);
  const data = JSON.parse(text);
  return { answers: data.answers, usage: data.usage || null, model, ms: Math.round(performance.now() - t0), input: JSON.stringify(payload, null, 2) };
}

async function decide(state, questions) {
  return (await decideFull(state, questions)).answers;
}

// --- The normal-LLM side of the comparison. ---

function llmPrompt(state, questions) {
  const stateText = typeof state === "string" ? state : JSON.stringify(state, null, 2);
  let out = `Here is a situation:\n\n${stateText}\n\nAnswer every question below about it.\n`;
  for (const [name, q] of Object.entries(questions)) {
    out += `\n- ${name} (${q.type}): ${q.instructions}`;
    if (q.type === "choice") out += ` Choose exactly one of: ${Object.keys(q.criteria || {}).join(", ")}.`;
    if (q.type === "noul") out += ` Answer true or false.`;
    if (q.type === "score") out += ` Choose exactly one of: ${(q.criteria || []).join(", ")}.`;
  }
  out += `\n\nReply with ONLY a JSON object mapping each question name to your answer ` +
    `(choice/score: the option text; noul: true or false), then one short sentence per question explaining why.`;
  return out;
}

async function askLLM(state, questions) {
  const model = document.getElementById("llmModel").value || "gpt-oss:120b";
  const prompt = llmPrompt(state, questions);
  const t0 = performance.now();
  let resp;
  try {
    resp = await fetch(`${endpoint()}/v1/chat/completions`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ model, stream: false, messages: [{ role: "user", content: prompt }] }),
    });
  } catch (e) {
    throw new Error(`Network error calling ${endpoint()}/v1/chat/completions. (${e.message})`);
  }
  const text = await resp.text();
  if (!resp.ok) throw new Error(`HTTP ${resp.status} from the endpoint:\n${text}`);
  const data = JSON.parse(text);
  const msg = (data.choices && data.choices[0] && data.choices[0].message) || {};
  return { text: msg.content || "(empty response)", usage: data.usage || null, model, ms: Math.round(performance.now() - t0), input: prompt };
}

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;");

function renderCompare(so, llm, afterFn) {
  const soUsage = so.usage ? `${so.usage.input_tokens ?? "?"} in / ${so.usage.output_tokens ?? 0} out tokens` : "tokens n/a";
  const llmUsage = llm.usage ? `${llm.usage.prompt_tokens ?? llm.usage.input_tokens ?? "?"} in / ${llm.usage.completion_tokens ?? llm.usage.output_tokens ?? "?"} out tokens` : "tokens n/a";
  const inputBlock = (input) => input
    ? `<details class="inputBlock" open><summary>Whole input sent</summary><pre class="raw">${esc(input)}</pre></details>` : "";
  return `<div class="compare">
    <div class="side"><h3>Decision model — ${esc(so.model)}</h3>
      <p class="note">${so.ms} ms · ${soUsage} · probabilities, no generated text</p>
      ${renderAnswers(so.answers)}${afterFn ? afterFn(so.answers) : ""}
      ${inputBlock(so.input)}</div>
    <div class="side"><h3>Normal LLM — ${esc(llm.model)}</h3>
      <p class="note">${llm.ms} ms · ${llmUsage} · generated text</p>
      <pre class="raw">${esc(llm.text)}</pre>
      ${inputBlock(llm.input)}</div>
  </div>`;
}

async function runCompare(resultsEl, state, questions, afterFn) {
  resultsEl.innerHTML = `<p class="note">Asking both models…</p>`;
  const [so, llm] = await Promise.allSettled([decideFull(state, questions), askLLM(state, questions)]);
  if (so.status === "fulfilled" && llm.status === "fulfilled") {
    resultsEl.innerHTML = renderCompare(so.value, llm.value, afterFn);
  } else {
    const err = (r) => r.status === "rejected" ? `<div class="error">${esc(r.reason.message)}</div>` : "";
    const ok = (r, label) => r.status === "fulfilled"
      ? (label === "so" ? `<div class="side"><h3>Decision model</h3>${renderAnswers(r.value.answers)}</div>`
                         : `<div class="side"><h3>Normal LLM</h3><pre class="raw">${esc(r.value.text)}</pre></div>`) : "";
    resultsEl.innerHTML = `<div class="compare">${ok(so, "so")}${err(so)}${ok(llm, "llm")}${err(llm)}</div>`;
  }
}

// --- Rendering answers as probability bars. ---

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

function renderAnswers(answers) {
  return Object.entries(answers).map(([n, a]) => renderAnswer(n, a)).join("");
}

// --- The five examples, ported from the Python versions. ---

const EXAMPLES = [
  {
    title: "1. Ticket triage",
    blurb: "Route a ticket, score its urgency, and check two yes/no conditions — four questions in one call.",
    state: "I was charged twice for my subscription this month. Please refund the extra amount today.",
    questions: {
      team: { type: "choice", instructions: "Which team should handle this ticket?",
        criteria: { billing: "Payments, charges, invoices and refunds",
          technical: "Bugs, errors, and how-to problems with the product",
          account: "Sign-up, login, passwords and account settings",
          other: "Anything that does not fit the other teams" } },
      urgency: { type: "score", instructions: "How urgent is this ticket?",
        criteria: ["Routine", "Soon", "Immediate"] },
      blocked: { type: "noul", instructions: "Is the customer currently blocked from doing their work?" },
      refund_requested: { type: "noul", instructions: "Is the customer asking for a refund?" },
    },
  },
  {
    title: "2. Refund policy",
    blurb: "Apply a written policy: the policy goes in the state, the allowed outcomes are a choice, and side questions show the reasoning trail.",
    state: "Refund policy:\n- Full refund if the request is within 30 days of purchase and the customer provides proof of purchase (receipt or order number).\n- Requests 31-60 days after purchase, or without proof, go to a human.\n- No refunds after 60 days, except where consumer law requires one.\n\nCustomer request: Bought the annual plan 10 days ago (order #88123, receipt attached). Changed my mind — please refund in full.",
    questions: {
      decision: { type: "choice", instructions: "Under the policy in the state, what happens to this refund request?",
        criteria: { approve: "The policy clearly allows a full refund",
          deny: "The policy clearly refuses this refund",
          escalate: "The policy sends this case to a human" } },
      within_window: { type: "noul", instructions: "Was the request made within 30 days of purchase?" },
      proof_provided: { type: "noul", instructions: "Did the customer provide proof of purchase?" },
    },
  },
  {
    title: "3. Agent tool-call guard",
    blurb: "Moderate an agent's proposed tool call before it runs. Try editing the command — the gate rule (block if harmful) is in the page's code, not a prompt.",
    state: JSON.stringify({ tool: "run_shell",
      args: { command: "rm -rf ~/jobs && git push --force origin main" },
      context: "Agent says it is 'cleaning up and syncing the repo'." }, null, 2),
    stateIsJson: true,
    questions: {
      harmful: { type: "noul", instructions: "Would executing this tool call cause harm, data loss, or an irreversible side effect?" },
      touches_production: { type: "noul", instructions: "Does this tool call affect a production system or real customer data?" },
    },
    after: (answers) => {
      const risk = answers.harmful.noul;
      const gate = risk > 0.5 ? "BLOCK" : risk > 0.25 ? "review" : "allow";
      return `<div class="answer"><span class="name">gate:</span> <span class="verdict">${gate}</span></div>`;
    },
  },
  {
    title: "4. Mode routing",
    blurb: "An agent supervisor decides how much process a task brief deserves — micro, lite, or the full lifecycle. (A compressed version of a routing policy running against clef:cloud in production.)",
    state: "Fix the off-by-one error in the pagination helper and add a regression test. The failing case is described in issue #112.",
    questions: {
      mode: { type: "choice", instructions: "How much process does this task brief need?",
        criteria: { micro: "One small, well-specified change with an obvious check; a single package, no design questions, no test writing",
          lite: "A known-approach build in one area: implement to a clear spec, then verify (including writing or updating tests); some judgement calls but no open design",
          full: "Design, security, persistence, or cross-system work; ambiguous requirements, irreversible steps, or anything needing a design review first" } },
    },
  },
  {
    title: "5. Business decisions over JSON",
    blurb: "States don't have to be prose. A gym's period summary goes in as JSON; a management decision comes out.",
    state: JSON.stringify({ business: "gym", period: "November", members_active: 371,
      members_cancelled: 34, members_frozen: 19, new_signups: 8, revenue: 15980,
      classes_run: 88, classes_full: 2, pt_sessions: 41 }, null, 2),
    stateIsJson: true,
    questions: {
      action: { type: "choice", instructions: "What is the best management action for this gym next month?",
        criteria: { retention_outreach: "Contact at-risk members personally before they cancel",
          freeze_offer: "Offer membership freezes/pauses to struggling members",
          class_schedule_review: "Fix class capacity/timetable problems",
          no_action: "The business is healthy; keep operating as-is" } },
      churn_risk: { type: "score", instructions: "How high is the risk of elevated member churn next month?",
        criteria: ["Low", "Medium", "High"] },
      healthy: { type: "noul", instructions: "Is this business financially healthy this period?" },
    },
  },
];

// --- Page wiring. ---

const main = document.getElementById("examples");

EXAMPLES.forEach((ex, i) => {
  const section = document.createElement("section");
  section.className = "card";
  const qSummary = Object.entries(ex.questions)
    .map(([n, q]) => `<code>${n}</code> (${q.type})`).join(" · ");
  section.innerHTML = `
    <h2>${ex.title}</h2>
    <p class="note">${ex.blurb}</p>
    <label>State<textarea class="state" rows="${ex.stateIsJson ? 9 : 4}">${ex.state.replace(/&/g, "&amp;").replace(/</g, "&lt;")}</textarea></label>
    <p class="qsummary">Questions: ${qSummary}</p>
    <button class="runBtn">Run decision</button>
    <div class="results"></div>`;
  const button = section.querySelector(".runBtn");
  const results = section.querySelector(".results");
  const getState = () => {
    const raw = section.querySelector(".state").value;
    return ex.stateIsJson ? JSON.parse(raw) : raw;
  };
  // One button runs BOTH models side by side: the decision model and
  // the selected normal LLM, on the same state and questions.
  button.addEventListener("click", async () => {
    button.disabled = true;
    try {
      await runCompare(results, getState(), ex.questions, ex.after);
    } catch (e) {
      results.innerHTML = `<div class="error">${e.message.replace(/</g, "&lt;")}</div>`;
    } finally {
      button.disabled = false;
    }
  });
  main.appendChild(section);
});

// --- Persist connection settings in localStorage. ---

const STORAGE_KEY = "decision-model-examples:connection:v1";

const els = {
  preset: document.getElementById("endpointPreset"),
  customWrap: document.getElementById("customEndpointWrap"),
  endpoint: document.getElementById("endpoint"),
  model: document.getElementById("model"),
  llmModel: document.getElementById("llmModel"),
  apiKey: document.getElementById("apiKey"),
};

function updateCustomVisibility() {
  els.customWrap.hidden = els.preset.value !== "custom";
}

function saveSettings() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      endpointPreset: els.preset.value,
      endpoint: els.endpoint.value,
      model: els.model.value,
      llmModel: els.llmModel.value,
      apiKey: els.apiKey.value,
    }));
  } catch (_) { /* storage unavailable (private mode etc.) — page still works */ }
}

function loadSettings() {
  let saved = null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) saved = JSON.parse(raw);
  } catch (_) { saved = null; }
  if (saved && typeof saved === "object") {
    if (typeof saved.endpointPreset === "string" &&
        [...els.preset.options].some((o) => o.value === saved.endpointPreset)) {
      els.preset.value = saved.endpointPreset;
    }
    if (typeof saved.endpoint === "string") els.endpoint.value = saved.endpoint;
    if (typeof saved.model === "string" &&
        [...els.model.options].some((o) => o.value === saved.model)) els.model.value = saved.model;
    if (typeof saved.llmModel === "string" &&
        [...els.llmModel.options].some((o) => o.value === saved.llmModel)) els.llmModel.value = saved.llmModel;
    if (typeof saved.apiKey === "string") els.apiKey.value = saved.apiKey;
  }
  updateCustomVisibility();
}

function forgetSettings() {
  try { localStorage.removeItem(STORAGE_KEY); } catch (_) {}
  els.apiKey.value = "";
  els.endpoint.value = "";
  // Reset the rest to defaults so a reload also comes back clean.
  els.preset.selectedIndex = 0;
  els.model.value = "clef:cloud";
  els.llmModel.value = "gpt-oss:120b";
  updateCustomVisibility();
  const status = document.getElementById("forgetStatus");
  if (status) status.textContent = "Saved key and settings forgotten.";
}

loadSettings();

// If this page is being served by server.js (it answers /healthz), the
// endpoint and API key live in the server's .env — switch to the
// same-origin proxy and hide those fields entirely; only Model remains.
fetch("/healthz").then((r) => r.json()).then((h) => {
  if (!h || !h.ok) return;
  els.preset.value = "same-origin";
  updateCustomVisibility();
  // Everything in the Connection section is server-side in this mode
  // (endpoint + key in .env; the model field keeps its default in the
  // DOM, still hidden), so remove the whole section from the page.
  document.getElementById("config").hidden = true;
  if (!h.keyConfigured) {
    console.warn("Node server reports NO API key configured in .env — runs will fail until one is added.");
  }
}).catch(() => {});

for (const el of [els.preset, els.endpoint, els.model, els.llmModel, els.apiKey]) {
  el.addEventListener("input", () => { updateCustomVisibility(); saveSettings(); });
  el.addEventListener("change", () => { updateCustomVisibility(); saveSettings(); });
}

document.getElementById("forgetKey").addEventListener("click", forgetSettings);

document.getElementById("pgRun").addEventListener("click", async (e) => {
  const button = e.target;
  const results = document.getElementById("pgResults");
  button.disabled = true;
  try {
    const questions = JSON.parse(document.getElementById("pgQuestions").value);
    await runCompare(results, document.getElementById("pgState").value, questions);
  } catch (err) {
    results.innerHTML = `<div class="error">${err.message.replace(/</g, "&lt;")}</div>`;
  } finally {
    button.disabled = false;
  }
});
