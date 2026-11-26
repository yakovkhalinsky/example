// API clients: the System One decision endpoint and a normal
// chat-completions LLM, both reached via the endpoint the page is
// configured with (the Node server's same-origin proxy by default
// in server mode, a daemon otherwise).

import { els } from "./els.js";

export function endpoint() {
  const preset = els.preset.value;
  if (preset === "same-origin") return location.origin;
  return (preset === "custom" ? els.endpoint.value.trim() : preset).replace(/\/+$/, "");
}

function authHeaders() {
  const headers = { "Content-Type": "application/json" };
  const key = els.apiKey.value.trim();
  if (key) headers["Authorization"] = `Bearer ${key}`;
  return headers;
}

async function postJson(path, payload) {
  let resp;
  try {
    resp = await fetch(`${endpoint()}${path}`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(payload),
    });
  } catch (e) {
    throw new Error(
      `Network error calling ${endpoint()}${path}.\n` +
      `If this is a CORS or mixed-content block, check the browser console. ` +
      `Local daemons accept browser calls from localhost origins; Ollama Cloud needs a valid API key. (${e.message})`
    );
  }
  const text = await resp.text();
  if (!resp.ok) throw new Error(`HTTP ${resp.status} from the endpoint:\n${text}`);
  return JSON.parse(text);
}

// One decision call: returns answers plus usage, timing and the exact
// payload sent (the page shows the whole input next to the results).
export async function decideFull(state, questions) {
  const model = els.model.value || "clef:cloud";
  const payload = { model, state, questions };
  const t0 = performance.now();
  const data = await postJson("/v1/systemone", payload);
  return {
    answers: data.answers,
    usage: data.usage || null,
    model,
    ms: Math.round(performance.now() - t0),
    input: JSON.stringify(payload, null, 2),
  };
}

// The prompt a normal LLM needs to answer the same questions — the
// contrast with the typed System One payload is the point of the demo.
export function llmPrompt(state, questions) {
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

export async function askLLM(state, questions) {
  const model = els.llmModel.value || "gpt-oss:120b";
  const prompt = llmPrompt(state, questions);
  const t0 = performance.now();
  const data = await postJson("/v1/chat/completions", {
    model, stream: false, messages: [{ role: "user", content: prompt }],
  });
  const msg = (data.choices && data.choices[0] && data.choices[0].message) || {};
  return {
    text: msg.content || "(empty response)",
    usage: data.usage || null,
    model,
    ms: Math.round(performance.now() - t0),
    input: prompt,
  };
}
