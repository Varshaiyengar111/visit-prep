# Visit Prep

**Turn a messy symptom diary into a one-page summary a doctor can read in 60 seconds.**

### ▶ [Try the online demo](https://varshaiyengar111.github.io/visit-prep/)
No install needed. It shows the built-in example and never calls the AI.

A small AI product prototype in health tech. A patient types rough notes about how they've felt. Visit Prep organises them into symptoms, timing, medicines mentioned and questions to ask. It never diagnoses and never gives advice.

> Portfolio demo. Not a medical device. All example data is made up.

---

## The problem

In a busy Indian OPD, a doctor may have only a few minutes per patient. Patients often forget symptoms, mix up dates, or spend the visit telling a long story, then leave without asking what they came to ask. The doctor gets an incomplete picture; the patient leaves anxious.

## Who it's for

| User | What they need |
|---|---|
| **Patient** (primary): an adult with a recurring complaint, booking a GP or specialist visit | Remember everything, feel heard, ask the right questions |
| **Doctor** (secondary): reads the summary at the start of the visit | Symptoms, timing and frequency at a glance, in the patient's own words |
| **Caregiver**: often writes notes for a parent | A simple way to hand over what they've observed |

## Scope (v0.1)

**In scope**
- Paste or type free-text notes in English
- AI turns them into: main concerns, a symptom table (when, how often, in the patient's words), medicines mentioned, what helped, unclear points, and questions for the doctor
- Print or save as PDF to take to the visit
- **Urgent-word check**: a simple keyword rule (not AI) that runs on every request. If notes mention things like chest pain or self-harm, the page shows 112 and Tele-MANAS 14416 at the top
- Free demo mode with a built-in example; live mode with an API key

**Out of scope (on purpose)**
- Diagnosis, possible conditions, causes, treatment or dosage advice. The AI is told never to do these, and the questions it writes are for the patient to *ask*, not answers
- Storing data. Nothing is saved; the summary lives only on the page
- Accounts, sharing with a clinic, Indian languages (see next steps)

## Product decisions

- **Organise, don't interpret.** The safest useful thing an AI can do here is structure what the patient already said. Every row keeps a quote in the patient's own words so the doctor can trust it.
- **Unclear points are a feature.** Instead of guessing, the AI lists what's ambiguous ("how many tablets?"). That prompts a better conversation.
- **Safety check doesn't depend on the AI.** The urgent-word check is plain code so it works even if the AI is down or in demo mode.
- **Structured output.** The AI must reply in a fixed format (JSON schema), so the page never shows a free-form paragraph that could drift into advice.

## Success metrics

| Metric | Target for a pilot | How to measure |
|---|---|---|
| Doctor finds summary useful | ≥ 70% "useful" or "very useful" | One-tap rating from the doctor after the visit |
| Faithfulness | ≥ 98% of symptom rows traceable to the patient's text | Weekly review of a sample against the original notes |
| Zero advice or diagnosis | 0 summaries containing a condition name or advice | Automated check for condition names + manual sample |
| Patient asked their questions | ≥ 60% say they asked at least one listed question | Short follow-up message after the visit |
| Time to create | Median < 3 minutes | Time from opening the page to printing |

**Guardrail metric:** urgent-word check false-negative rate, reviewed on a labelled set of made-up diaries.

## Try the demo

You need [Node.js](https://nodejs.org) 20.12 or newer.

```bash
npm install
npm start
```

Open http://localhost:3001 and click **Use example notes**, then **Make my summary**.

- **Demo mode (free):** with no key, it shows a pre-made example summary.
- **Live AI mode:** copy `.env.example` to `.env`, paste an [Anthropic API key](https://console.anthropic.com) after `ANTHROPIC_API_KEY=`, and restart. The key stays on your computer's server and is never sent to the browser. `.env` is in `.gitignore`, so it is never uploaded.

**Online demo:** the version on GitHub Pages is built from the `public` page with `npm run build:pages`, which saves the built-in example into `docs/`. It has no server and no key, so it never calls the AI.

## How it works

```
Browser page  ──POST /api/run──▶  server.js  ──▶  Claude (structured JSON)
     ▲                              │
     └──── summary + urgent flag ◀──┘   (urgent-word check runs here, without AI)
```

- `task.js`: the instructions given to the AI, the output format, the urgent-word list and the demo example
- `server.js`: a tiny Node server with no framework; keeps the key server-side
- `public/index.html`: the whole user interface in one file

## What I'd do next

1. **Hindi and other Indian-language input, English output for the doctor**: most patients would write in their own language.
2. **Voice notes**: let caregivers speak instead of type.
3. **Evaluation set**: 50 made-up diaries with expected summaries, run on every prompt change to catch drift or advice creeping in.
4. **Clinic pilot**: QR code in the waiting room; summary goes to the doctor's screen with consent.
5. **Clinician review** of the urgent-word list and the "never advise" rules before any real-world use.
