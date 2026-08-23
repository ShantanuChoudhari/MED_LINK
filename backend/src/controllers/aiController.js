// backend/src/controllers/aiController.js
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Keyword-based specialization lookup (always available, no API needed)
const KEYWORD_MAP = [
  { keywords: ['chest pain','heart','palpitation','angina','cardiac','coronary'],    spec: 'Cardiologist',    urgency: 4 },
  { keywords: ['skin','rash','acne','eczema','mole','psoriasis','dermatitis'],        spec: 'Dermatologist',   urgency: 2 },
  { keywords: ['brain','headache','migraine','seizure','stroke','memory','nerve'],    spec: 'Neurologist',     urgency: 4 },
  { keywords: ['child','baby','infant','toddler','pediatric','kid'],                  spec: 'Pediatrician',    urgency: 3 },
  { keywords: ['bone','joint','knee','back','spine','fracture','arthritis','muscle'], spec: 'Orthopedist',     urgency: 3 },
  { keywords: ['eye','vision','blur','retina','glaucoma','cataract'],                 spec: 'Ophthalmologist', urgency: 3 },
  { keywords: ['ear','nose','throat','sinus','hearing','tonsil','nasal'],             spec: 'ENT Specialist',  urgency: 2 },
  { keywords: ['diabetes','thyroid','hormone','endocrine','insulin','glucose'],       spec: 'Endocrinologist', urgency: 3 },
  { keywords: ['anxiety','depression','stress','mental','panic','ptsd'],              spec: 'Psychiatrist',    urgency: 3 },
  { keywords: ['stomach','abdomen','bowel','colon','ulcer','nausea','liver','ibs'],   spec: 'Gastroenterologist', urgency: 3 },
  { keywords: ['cough','cold','fever','flu','infection','sore throat','breathing'],   spec: 'General Physician', urgency: 2 },
];

function keywordFallback(symptoms) {
  const lower = symptoms.toLowerCase();
  for (const entry of KEYWORD_MAP) {
    if (entry.keywords.some(kw => lower.includes(kw))) {
      return {
        specialization: entry.spec,
        urgency: entry.urgency,
        advice: `Based on your symptoms, you should consult a ${entry.spec} as soon as possible.`,
      };
    }
  }
  return {
    specialization: 'General Physician',
    urgency: 2,
    advice: 'A general physician can assess your condition and refer you to the right specialist.',
  };
}

// POST /api/v1/ai/analyze
exports.analyzeSymptoms = async (req, res) => {
  const { symptoms } = req.body;
  if (!symptoms || !symptoms.trim()) {
    return res.status(400).json({ success: false, message: 'Symptoms text is required.' });
  }

  // Try Gemini first, fallback gracefully to keyword map
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn('⚠️  GEMINI_API_KEY not set — using keyword fallback');
    return res.status(200).json({ success: true, data: keywordFallback(symptoms) });
  }

  const prompt = `You are a medical triage assistant. Given these patient symptoms: "${symptoms}"
Respond ONLY with valid JSON (no markdown, no code fences, no explanation):
{
  "specialization": "<best medical specialization>",
  "urgency": <1-5 integer, 5=ER now>,
  "advice": "<one sentence advice in plain English>"
}`;

  // Try models in preference order — gemini-3.6-flash confirmed working
  const MODEL_CANDIDATES = ['gemini-3.6-flash', 'gemini-2.5-flash'];

  for (const modelName of MODEL_CANDIDATES) {
    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(prompt);
      const text   = result.response.text().replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(text);

      // Validate required fields exist
      if (!parsed.specialization || !parsed.urgency) throw new Error('Invalid AI response structure');

      console.log(`✅ AI analysis using ${modelName}`);
      return res.status(200).json({ success: true, data: parsed });
    } catch (err) {
      console.warn(`⚠️  Model "${modelName}" failed: ${err.message}`);
    }
  }

  // All models failed — use keyword fallback
  console.warn('⚠️  All Gemini models failed — using keyword fallback');
  return res.status(200).json({ success: true, data: keywordFallback(symptoms) });
};
