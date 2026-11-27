import axios from 'axios';

export async function react(sock, msg, emoji) {
  try {
    await sock.sendMessage(msg.key.remoteJid, {
      react: { text: emoji, key: msg.key }
    });
  } catch {}
}

export async function textToImage(text) {
  const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(text)}?width=512&height=512&nologo=true`;
  const res = await axios.get(url, { responseType: 'arraybuffer', timeout: 30000 });
  return Buffer.from(res.data);
}

export async function getWeather(city) {
  try {
    const res = await axios.get(`https://wttr.in/${encodeURIComponent(city)}?format=j1`, { timeout: 10000 });
    const data = res.data;
    const current = data.current_condition[0];
    return {
      location: data.nearest_area[0].areaName[0].value,
      temp: current.temp_C,
      feels: current.FeelsLikeC,
      desc: current.weatherDesc[0].value,
      humidity: current.humidity,
      wind: current.windspeedKmph
    };
  } catch {
    return null;
  }
}

export async function shortUrl(url) {
  try {
    const res = await axios.get(`https://is.gd/create.php?format=simple&url=${encodeURIComponent(url)}`, { timeout: 8000 });
    return res.data;
  } catch {
    return null;
  }
}

export async function getMeme() {
  const endpoints = [
    'https://meme-api.com/gimme',
    'https://meme-api.com/gimme/memes',
    'https://meme-api.com/gimme/dankmemes',
    'https://meme-api.com/gimme/wholesomememes'
  ];
  for (const url of endpoints) {
    try {
      const res = await axios.get(url, { timeout: 10000 });
      if (res.data?.url && !res.data.nsfw) {
        return {
          title: res.data.title || 'Random Meme',
          url: res.data.url,
          author: res.data.author || 'Unknown',
          subreddit: res.data.subreddit || 'memes',
          ups: res.data.ups || 0
        };
      }
    } catch {}
  }
  // fallback justmeme
  try {
    const res = await axios.get('https://justmeme.wtf/api/v1/random', { timeout: 8000 });
    if (res.data?.success && res.data.template?.url) {
      return {
        title: res.data.template.name || 'Random Meme',
        url: res.data.template.url,
        author: 'justmeme',
        subreddit: 'templates',
        ups: 0
      };
    }
  } catch {}
  return null;
}
