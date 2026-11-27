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

/**
 * Chat dengan Groq
 */
export async function chatGroq(prompt, model = config.groqModel) {
  const client = getGroq();
  if (!client) throw new Error('GROQ_API_KEY belum diset');

  const completion = await client.chat.completions.create({
    messages: [
      {
        role: 'system',
        content: 'Kamu adalah Nuts, asisten AI yang ramah, cerdas, dan sedikit sarkastik. Jawab dalam Bahasa Indonesia kecuali diminta sebaliknya. Singkat tapi informatif.'
      },
      { role: 'user', content: prompt }
    ],
    model: model,
    temperature: 0.7,
    max_tokens: 1024
  });

  return completion.choices[0]?.message?.content || 'Tidak ada respons.';
}

/**
 * Chat dengan Gemini
 */
export async function chatGemini(prompt, model = config.geminiModel) {
  const client = getGemini();
  if (!client) throw new Error('GEMINI_API_KEY belum diset');

  const genModel = client.getGenerativeModel({ model });
  const result = await genModel.generateContent(prompt);
  return result.response.text();
}

/**
 * Vision (gambar + teks)
 */
export async function visionGemini(imageBuffer, prompt, model = config.geminiModel) {
  const client = getGemini();
  if (!client) throw new Error('GEMINI_API_KEY belum diset');

  const genModel = client.getGenerativeModel({ model });

  const imagePart = {
    inlineData: {
      data: imageBuffer.toString('base64'),
      mimeType: 'image/jpeg'
    }
  };

  const result = await genModel.generateContent([prompt || 'Jelaskan gambar ini secara detail.', imagePart]);
  return result.response.text();
}

/**
 * List model yang tersedia (nama yang valid)
 */
export const availableModels = {
  groq: [
    { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B' },
    { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B (Cepat)' },
    { id: 'mixtral-8x7b-32768', name: 'Mixtral 8x7B' },
    { id: 'gemma2-9b-it', name: 'Gemma2 9B' }
  ],
  gemini: [
    { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash' },
    { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash' },
    { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro' }
  ]
};
