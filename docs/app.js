"use strict";

// --- The client: a browser port of jev.py (same wire format). ---

function endpoint() {
  const preset = document.getElementById("endpointPreset").value;
  return (preset === "custom"
    ? document.getElementById("endpoint").value.trim()
    : preset).replace(/\/+$/, "");
}

async function decide(state, questions) {
  const headers = { "Content-Type": "application/json" };
  const key = document.getElementById("apiKey").value.trim();
  if (key) headers["Authorization"] = `Bearer ${key}`;
  const model = document.getElementById("model").value.trim() || "clef:cloud";
  let resp;
  try {
    resp = await fetch(`${endpoint()}/v1/systemone`, {
      method: "POST",
      headers,
      body: JSON.stringify({ model, state, questions }),
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
  return JSON.parse(text).answers;
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
    <button>Run decision</button>
    <div class="results"></div>`;
  const button = section.querySelector("button");
  const results = section.querySelector(".results");
  button.addEventListener("click", async () => {
    button.disabled = true;
    results.innerHTML = `<p class="note">Deciding…</p>`;
    try {
      const raw = section.querySelector(".state").value;
      const state = ex.stateIsJson ? JSON.parse(raw) : raw;
      const answers = await decide(state, ex.questions);
      results.innerHTML = renderAnswers(answers) + (ex.after ? ex.after(answers) : "");
    } catch (e) {
      results.innerHTML = `<div class="error">${e.message.replace(/</g, "&lt;")}</div>`;
    } finally {
      button.disabled = false;
    }
  });
  main.appendChild(section);
});

document.getElementById("endpointPreset").addEventListener("change", (e) => {
  document.getElementById("customEndpointWrap").hidden = e.target.value !== "custom";
});

document.getElementById("pgRun").addEventListener("click", async (e) => {
  const button = e.target;
  const results = document.getElementById("pgResults");
  button.disabled = true;
  results.innerHTML = `<p class="note">Deciding…</p>`;
  try {
    const questions = JSON.parse(document.getElementById("pgQuestions").value);
    const answers = await decide(document.getElementById("pgState").value, questions);
    results.innerHTML = renderAnswers(answers);
  } catch (err) {
    results.innerHTML = `<div class="error">${err.message.replace(/</g, "&lt;")}</div>`;
  } finally {
    button.disabled = false;
  }
});
