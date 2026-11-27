import Groq from 'groq-sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import config from './config.js';

let groqClient = null;
let geminiClient = null;

function getGroq() {
  if (!groqClient && config.groqKey) {
    groqClient = new Groq({ apiKey: config.groqKey });
  }
  return groqClient;
}

function getGemini() {
  if (!geminiClient && config.geminiKey) {
    geminiClient = new GoogleGenerativeAI(config.geminiKey);
  }
  return geminiClient;
}

export async function chatGroq(prompt, model = config.groqModel) {
  const client = getGroq();
  if (!client) throw new Error('GROQ_API_KEY belum diset');

  const modelsToTry = [
    model,
    'openai/gpt-oss-20b',
    'llama-3.3-70b-versatile',
    'llama-3.1-8b-instant'
  ].filter((v, i, a) => a.indexOf(v) === i);

  let lastErr;
  for (const m of modelsToTry) {
    try {
      const completion = await client.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: 'Kamu adalah Nuts, asisten AI yang ramah, cerdas, dan sedikit sarkastik. Jawab dalam Bahasa Indonesia kecuali diminta sebaliknya. Singkat tapi informatif.'
          },
          { role: 'user', content: prompt }
        ],
        model: m,
        temperature: 0.7,
        max_tokens: 1024
      });
      return completion.choices[0]?.message?.content || 'Tidak ada respons.';
    } catch (e) {
      lastErr = e;
      console.log(`Groq model ${m} gagal:`, e.message);
    }
  }
  throw lastErr || new Error('Semua model Groq gagal');
}

export async function chatGemini(prompt, model = config.geminiModel) {
  const client = getGemini();
  if (!client) throw new Error('GEMINI_API_KEY belum diset');

  const modelsToTry = [model, 'gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-pro']
    .filter((v, i, a) => a.indexOf(v) === i);

  let lastErr;
  for (const m of modelsToTry) {
    try {
      const genModel = client.getGenerativeModel({ model: m });
      const result = await genModel.generateContent(prompt);
      return result.response.text();
    } catch (e) {
      lastErr = e;
      console.log(`Gemini model ${m} gagal:`, e.message);
    }
  }
  throw lastErr || new Error('Semua model Gemini gagal');
}

export async function visionGemini(imageBuffer, prompt, model = config.geminiModel) {
  const client = getGemini();
  if (!client) throw new Error('GEMINI_API_KEY belum diset');

  const modelsToTry = [model, 'gemini-2.0-flash', 'gemini-1.5-flash'];
  let lastErr;
  for (const m of modelsToTry) {
    try {
      const genModel = client.getGenerativeModel({ model: m });
      const imagePart = {
        inlineData: {
          data: imageBuffer.toString('base64'),
          mimeType: 'image/jpeg'
        }
      };
      const result = await genModel.generateContent([
        prompt || 'Jelaskan gambar ini secara detail.',
        imagePart
      ]);
      return result.response.text();
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr || new Error('Vision gagal');
}

export const availableModels = {
  groq: [
    { id: 'openai/gpt-oss-20b', name: 'GPT-OSS 20B' },
    { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B' },
    { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B (Cepat)' }
  ],
  gemini: [
    { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash' },
    { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash' },
    { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro' }
  ]
};
