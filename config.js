import dotenv from 'dotenv';
dotenv.config();

export default {
  owner: process.env.OWNER_NUMBER || '6281234567890',
  ownerCode: process.env.OWNER_CODE || 'myownerlikepeanuts',

  prefix: process.env.PREFIX || '.',
  botName: process.env.BOT_NAME || 'Nuts',

  groqKey: process.env.GROQ_API_KEY || '',
  geminiKey: process.env.GEMINI_API_KEY || '',

  defaultAI: process.env.DEFAULT_AI || 'groq',
  groqModel: process.env.GROQ_MODEL || 'openai/gpt-oss-20b',
  geminiModel: process.env.GEMINI_MODEL || 'gemini-2.0-flash',

  limit: {
    download: parseInt(process.env.LIMIT_DOWNLOAD) || 5,
    ai: parseInt(process.env.LIMIT_AI) || 15,
    game: parseInt(process.env.LIMIT_GAME) || 10
  },

  timezone: process.env.TIMEZONE || 'Asia/Jakarta',
  footer: '⚡ Nuts Bot • Multi Function',
  allowedGroups: []
};
