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

/** Quote random (no key) */
export async function getQuote() {
  try {
    const res = await axios.get('https://api.quotable.io/random', { timeout: 8000 });
    return {
      content: res.data.content,
      author: res.data.author
    };
  } catch {
    try {
      const res = await axios.get('https://dummyjson.com/quotes/random', { timeout: 8000 });
      return { content: res.data.quote, author: res.data.author };
    } catch {
      return null;
    }
  }
}

/** Fakta random */
export async function getFact() {
  try {
    const res = await axios.get('https://uselessfacts.jsph.pl/api/v2/facts/random?language=en', { timeout: 8000 });
    return res.data.text;
  } catch {
    try {
      const res = await axios.get('https://catfact.ninja/fact', { timeout: 8000 });
      return res.data.fact;
    } catch {
      return null;
    }
  }
}

/** Joke */
export async function getJoke() {
  try {
    const res = await axios.get('https://v2.jokeapi.dev/joke/Any?type=single', { timeout: 8000 });
    if (res.data?.joke) return res.data.joke;
  } catch {}
  try {
    const res = await axios.get('https://official-joke-api.appspot.com/random_joke', { timeout: 8000 });
    return `${res.data.setup}\n\n${res.data.punchline}`;
  } catch {
    return null;
  }
}

/** Gambar anjing / kucing */
export async function getDog() {
  try {
    const res = await axios.get('https://dog.ceo/api/breeds/image/random', { timeout: 10000 });
    return res.data?.message || null;
  } catch {
    return null;
  }
}

export async function getCat() {
  try {
    const res = await axios.get('https://api.thecatapi.com/v1/images/search', { timeout: 10000 });
    return res.data?.[0]?.url || null;
  } catch {
    return null;
  }
}

/** Info negara */
export async function getCountry(name) {
  try {
    const res = await axios.get(`https://restcountries.com/v3.1/name/${encodeURIComponent(name)}`, { timeout: 10000 });
    const c = res.data[0];
    return {
      name: c.name?.common,
      official: c.name?.official,
      capital: (c.capital || []).join(', '),
      region: c.region,
      population: c.population?.toLocaleString?.('id-ID') || c.population,
      flag: c.flag,
      currencies: c.currencies ? Object.values(c.currencies).map(x => x.name).join(', ') : '-'
    };
  } catch {
    return null;
  }
}

/** Kurs (Frankfurter, base USD) */
export async function getKurs(base = 'USD') {
  try {
    const res = await axios.get(`https://api.frankfurter.dev/v1/latest?base=${base}`, { timeout: 10000 });
    return res.data;
  } catch {
    return null;
  }
}
