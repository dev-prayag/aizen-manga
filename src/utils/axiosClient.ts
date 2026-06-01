import axios from 'axios';

  const SCRAPER_KEY = process.env.SCRAPER_API_KEY;

  const BROWSER_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept-Encoding': 'gzip, deflate, br',
    'Cache-Control': 'no-cache',
    'DNT': '1',
    'Referer': 'https://mangafire.to/',
    'sec-ch-ua': '"Google Chrome";v="135", "Not-A.Brand";v="8", "Chromium";v="135"',
    'sec-ch-ua-mobile': '?0',
    'sec-ch-ua-platform': '"Windows"',
    'sec-fetch-dest': 'document',
    'sec-fetch-mode': 'navigate',
    'sec-fetch-site': 'same-origin',
  };

  export const client = axios.create({
    baseURL: 'https://mangafire.to',
    // ScraperAPI needs more time — direct calls are faster
    timeout: SCRAPER_KEY ? 60000 : 20000,
    headers: BROWSER_HEADERS,
  });

  // When SCRAPER_API_KEY is set, transparently route every request
  // through ScraperAPI's residential IPs to bypass Cloudflare blocks.
  if (SCRAPER_KEY) {
    client.interceptors.request.use(config => {
      const base = (config.baseURL || 'https://mangafire.to').replace(/\/$/, '');
      const path = config.url || '';
      const full = path.startsWith('http') ? path : `${base}${path}`;
      config.baseURL = '';
      config.url = `http://api.scraperapi.com?api_key=${SCRAPER_KEY}&url=${encodeURIComponent(full)}`;
      return config;
    });
    console.log('[axiosClient] ScraperAPI proxy enabled');
  } else {
    console.log('[axiosClient] Direct mode (no SCRAPER_API_KEY set)');
  }
  