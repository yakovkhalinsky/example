// The five worked examples: a state plus typed questions each.

export const EXAMPLES = [
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
