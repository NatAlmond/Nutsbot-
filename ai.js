import Groq from 'groq-sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import config from '../config.js';

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
 * Vision (gambar + teks) - Owner only biasanya
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
 * List model yang tersedia
 */
export const availableModels = {
  groq: [
    { id: 'openai/gpt-oss-20b', name: 'GPT-OSS 20B (Cepat)' },
    { id: 'openai/gpt-oss-120b', name: 'GPT-OSS 120B (Lebih pintar)' },
    { id: 'qwen/qwen3.8-27b', name: 'Qwen 3.8 27B' }
  ],
  gemini: [
    { id: 'gemini-3.6-flash', name: 'Gemini 3.6 Flash' },
    { id: 'gemini-3.8-flash', name: 'Gemini 3.8 Flash' }
  ]
};
