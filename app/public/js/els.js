// Shared references to the page's form elements, in one place.

export const els = {
  preset: document.getElementById("endpointPreset"),
  customWrap: document.getElementById("customEndpointWrap"),
  endpoint: document.getElementById("endpoint"),
  model: document.getElementById("model"),
  llmModel: document.getElementById("llmModel"),
  apiKey: document.getElementById("apiKey"),
  config: document.getElementById("config"),
  examples: document.getElementById("examples"),
  forgetKey: document.getElementById("forgetKey"),
  forgetStatus: document.getElementById("forgetStatus"),
  pgRun: document.getElementById("pgRun"),
  pgState: document.getElementById("pgState"),
  pgQuestions: document.getElementById("pgQuestions"),
  pgResults: document.getElementById("pgResults"),
};
