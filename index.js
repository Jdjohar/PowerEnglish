const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const app = express();
const port = 3000;
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Step 3: Fetch CEFR Level Words
async function getWords(level, count) {
  try {
    const prompt = `Give me ${count} common English words from CEFR ${level} level.`;
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
    const result = await model.generateContent(prompt);

    // Log the full response for debugging
    console.log("Gemini API Response: ", result);

    const words = result.response.text().split('\n').map(w => w.trim()).filter(w => w);
    return words;
  } catch (error) {
    console.error("Error in getWords: ", error);
    throw error;
  }
}

// Step 4: Validate Sentence
async function checkSentence(word, sentence) {
  const prompt = `The user has written a sentence using the word "${word}". The sentence is: "${sentence}". 
Check if it is grammatically correct and fits CEFR standards. If not, explain why and suggest a corrected version.`;
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
  const result = await model.generateContent(prompt);
  return result.response.text();
}

// API Routes


app.get('/list-models', async (req, res) => {
  try {
    const models = await genAI.listModels();
    res.json(models);
  } catch (error) {
    console.error("Error listing models: ", error);
    res.status(500).send('Error listing models');
  }
});

// Get CEFR Words
app.get('/words/:level/:count', async (req, res) => {
  try {
    const { level, count } = req.params;
    const words = await getWords(level, count);
    res.json({ words });
  } catch (error) {
    res.status(500).send('Error fetching words');
  }
});

// Check Sentence
app.post('/check', async (req, res) => {
  try {
    const { word, sentence } = req.body;
    if (!word || !sentence) return res.status(400).send('Missing word or sentence');

    const feedback = await checkSentence(word, sentence);
    res.json({ feedback });
  } catch (error) {
    res.status(500).send('Error checking sentence');
  }
});

// Serve HTML Form for PHP Integration
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

// Start Server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});