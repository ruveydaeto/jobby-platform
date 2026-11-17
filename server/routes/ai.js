const express = require('express');
const router = express.Router();

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || 'sk-test';

// AI Cover Letter Generator
router.post('/generate-cover-letter', async (req, res) => {
  try {
    const { jobTitle, category, experience, candidateName } = req.body;

    const prompt = `Sen profesyonel bir CV yazarısın. Aşağıdaki bilgilere göre, kısa ve etkili bir kapak mektubu yaz:

İş Başlığı: ${jobTitle}
Kategori: ${category}
Deneyim: ${experience}
Aday Adı: ${candidateName}

Çıktı: 2-3 cümleden oluşan, profesyonel Türkçe kapak mektubu. Doğrudan iş tanımına hitap et.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 200
      })
    });

    const data = await response.json();
    const draft = data.choices[0].message.content;

    res.json({
      draft,
      score: 0.85,
      suggestions: ['Deneyim detaylarını ekle', 'Motivasyonunu vurgula'],
      generated_at: new Date()
    });
  } catch (error) {
    res.status(500).json({
      error: 'Cover letter generation failed',
      fallback: 'Merhaba, bu pozisyon için çok uygun ve heyecan duyuyorum.'
    });
  }
});

// AI Job Scoring & Recommendation
router.post('/score-job-match', async (req, res) => {
  try {
    const { jobTitle, jobCategory, candidateCategories, candidateCity, jobCity } = req.body;

    // Skill Match (80%)
    const skillScore = candidateCategories.includes(jobCategory) ? 80 : 50;

    // Location Match (10%)
    const locationScore = candidateCity === jobCity ? 10 : 5;

    // Availability Match (10%)
    const availabilityScore = 10; // Simplified

    const totalScore = Math.min(100, skillScore + locationScore + availabilityScore);

    res.json({
      total_score: totalScore,
      skill_match: skillScore,
      location_match: locationScore,
      availability_match: availabilityScore,
      recommendation: totalScore >= 75 ? 'Excellent Match' : totalScore >= 50 ? 'Good Match' : 'Consider',
      apply_probability: (totalScore / 100 * 0.9 + 0.1).toFixed(2)
    });
  } catch (error) {
    res.status(500).json({ error: 'Scoring failed' });
  }
});

module.exports = router;
