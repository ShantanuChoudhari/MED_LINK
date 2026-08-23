// src/controllers/patientController.js
const Doctor = require('../models/Doctor');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// POST /api/v1/patient/analyze — AI Symptom Analysis (kept for backward compat; primary is /ai/analyze)
exports.analyzeSymptoms = async (req, res) => {
  try {
    const { symptoms } = req.body;
    if (!symptoms) {
      return res.status(400).json({ success: false, message: 'symptoms field is required.' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ success: false, message: 'Gemini API key not configured.' });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    // ✅ Fixed: correct model name for @google/generative-ai SDK v0.24+
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `
Act as a medical triage AI. The user reports: "${symptoms}".
Return ONLY valid JSON (no markdown, no code fences):
{ 
  "specialization": "Specialist Name (e.g. Cardiologist)", 
  "urgency": 3, 
  "advice": "One short sentence of immediate advice." 
}
The "urgency" must be an integer from 1 (not urgent) to 5 (emergency).
    `.trim();

    const result   = await model.generateContent(prompt);
    const response = result.response;
    const text     = response.text().replace(/```json|```/g, '').trim();

    const parsed = JSON.parse(text);
    res.status(200).json({ success: true, data: parsed });
  } catch (error) {
    console.error('AI Error:', error);
    res.status(500).json({ success: false, message: 'AI Analysis failed. Please try again.' });
  }
};

// GET /api/v1/patient/doctors — Search doctors
exports.searchDoctors = async (req, res) => {
  try {
    const { specialization, search, location } = req.query;
    const query = {};

    if (specialization) query.specialization = { $regex: specialization, $options: 'i' };
    if (search)         query.name           = { $regex: search,         $options: 'i' };
    if (location)       query.location       = { $regex: location,       $options: 'i' };

    const doctors = await Doctor.find(query).populate('user', 'name email');
    res.status(200).json({ success: true, data: doctors });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};