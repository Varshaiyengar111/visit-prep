// What Visit Prep asks the AI to do, and the built-in example used in demo mode.
// All example text is made up. It is not a real patient.

const sampleDiary = `Mon - headache again in the evening, behind my eyes. Took a paracetamol, slept badly.
Tue - fine in the morning. Headache came back after office around 6pm. Had only 2 glasses of water today.
Thu - woke up tired. Headache at lunch, screen work all day. Dizzy for a few seconds when I stood up quickly.
Sat - no headache! Went for a walk, drank more water.
Sun - mild headache at night. Mom says I'm on my phone too late. Worried it's something serious.
Also my left knee has been stiff in the mornings for 2 weeks but goes away after I move around.`;

// Simple word checks that run on every request, with or without AI.
// If any match, the page shows urgent-help numbers at the top.
const URGENT_WORDS = [
  "chest pain", "can't breathe", "cannot breathe", "faint", "fainted", "unconscious",
  "suicide", "kill myself", "end my life", "self harm", "self-harm",
  "worst headache", "slurred", "numb face", "seizure", "blood in vomit",
];

export default {
  name: "Visit Prep",
  port: 3001,
  sampleInput: { diary: sampleDiary },

  validate(input) {
    if (typeof input.diary !== "string" || input.diary.trim().length < 20) {
      return "Please write at least a few lines about how you have been feeling.";
    }
    if (input.diary.length > 8000) return "Please keep the diary under 8,000 characters.";
    return null;
  },

  checks(input) {
    const text = input.diary.toLowerCase();
    const found = URGENT_WORDS.filter((w) => text.includes(w));
    return { urgent: found.length > 0, urgentWords: found };
  },

  system: `You help a patient in India get ready for a doctor's visit.
The patient gives you rough diary notes about how they have felt. You turn them into a short, organised summary the patient can show their doctor.

Rules you must always follow:
- Never diagnose, never name a possible condition, and never suggest a cause.
- Never give medical advice, treatment, dosages, or tell the patient what to do about a symptom.
- Only use what the patient wrote. Do not add symptoms, dates, or details. If something is unclear, put it in "unclear_points".
- Keep the patient's own words where you can. Use plain, simple English.
- Medicines: list only what the patient says they took, exactly as written. Do not comment on them.
- Questions for the doctor should be open questions the patient could ask, for example "What could be causing my headaches?". Never answer them.`,

  userMessage(input) {
    return `Here are my diary notes:\n\n<diary>\n${input.diary}\n</diary>\n\nMake my visit summary.`;
  },

  schema: {
    type: "object",
    additionalProperties: false,
    required: ["main_concerns", "symptoms", "medicines_mentioned", "what_helped", "unclear_points", "questions_for_doctor"],
    properties: {
      main_concerns: { type: "array", items: { type: "string" } },
      symptoms: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          required: ["symptom", "when", "how_often", "patient_words"],
          properties: {
            symptom: { type: "string" },
            when: { type: "string" },
            how_often: { type: "string" },
            patient_words: { type: "string" },
          },
        },
      },
      medicines_mentioned: { type: "array", items: { type: "string" } },
      what_helped: { type: "array", items: { type: "string" } },
      unclear_points: { type: "array", items: { type: "string" } },
      questions_for_doctor: { type: "array", items: { type: "string" } },
    },
  },

  demoOutput: {
    main_concerns: [
      "Headaches on most days this week, usually in the evening",
      "Worried the headaches might be something serious",
      "Left knee stiff in the mornings for about 2 weeks",
    ],
    symptoms: [
      { symptom: "Headache", when: "Evenings and after office; once at lunch", how_often: "5 of the 6 days noted", patient_words: "headache again in the evening, behind my eyes" },
      { symptom: "Tiredness and poor sleep", when: "Monday night; Thursday morning", how_often: "2 days noted", patient_words: "slept badly", },
      { symptom: "Dizziness on standing", when: "Thursday", how_often: "Once, for a few seconds", patient_words: "Dizzy for a few seconds when I stood up quickly" },
      { symptom: "Knee stiffness (left)", when: "Mornings", how_often: "Daily for about 2 weeks", patient_words: "stiff in the mornings ... goes away after I move around" },
    ],
    medicines_mentioned: ["Paracetamol (Monday)"],
    what_helped: ["Saturday: walk and more water, no headache that day"],
    unclear_points: [
      "How many paracetamol tablets were taken, and on which other days",
      "Whether the headache on Sunday was the same kind as the others",
    ],
    questions_for_doctor: [
      "What could be causing my headaches?",
      "Could my screen time, sleep or water intake be related?",
      "Is the dizziness when I stand up something to watch?",
      "What should I do about the morning stiffness in my knee?",
    ],
  },
};
