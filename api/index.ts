import express, { Request, Response, NextFunction } from 'express';
  import cors from 'cors';
  import createHttpError, { HttpError } from 'http-errors';
  import scrapeHomePage from '../src/parsers/homePage';
  import scrapeMangaInfo from '../src/parsers/infoPage';
  import { scrapeSearchResults } from '../src/parsers/searchPage';
  import scrapedMangaCategory from '../src/parsers/categoryPage';
  import scrapedMangaGenre from '../src/parsers/genrePage';
  import { getChapters, getChapterImages, getVolumes } from '../src/parsers/readPage';
  import scrapeLatestPage from '../src/parsers/latestPage';
  import { cache, TTL } from '../src/lib/cache';
  import { MangaCategories, MANGA_GENRES } from '../src/types/manga';
  import axios from 'axios';

  const app = express();

  app.use(cors());
  app.use(express.json());

  app.get('/', (_req, res) => { res.json({ status: 'ok', message: 'MangaFire API — /api/home to get started' }); });

  // Proxy image endpoint (CORS bypass)
  app.get('/proxy-image', async (req: Request, res: Response, next: NextFunction) => {
    const url = req.query.url as string;
    if (!url) return next(createHttpError(400, 'url query param required'));
    try {
      const response = await axios.get(url, { responseType: 'stream', headers: { Referer: 'https://mangafire.to/' } });
      res.setHeader('Content-Type', response.headers['content-type'] || 'image/jpeg');
      response.data.pipe(res);
    } catch { next(createHttpError(502, 'Failed to proxy image')); }
  });

  app.get('/api/cache/stats', (_req, res) => { res.json(cache.stats()); });

  app.get('/api/home', async (_req, res: Response, next: NextFunction) => {
    try { res.json(await cache.getOrFetch('home', scrapeHomePage, TTL.HOME)); } catch (e) { next(e); }
  });

  app.get('/api/search/:keyword', async (req: Request, res: Response, next: NextFunction) => {
    const { keyword } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const key = `search:${keyword}:${page}`;
    try { res.json(await cache.getOrFetch(key, () => scrapeSearchResults(keyword, page), TTL.SEARCH)); } catch (e) { next(e); }
  });

  app.get('/api/category/:category', async (req: Request, res: Response, next: NextFunction) => {
    const { category } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const key = `category:${category}:${page}`;
    try { res.json(await cache.getOrFetch(key, () => scrapedMangaCategory(category as MangaCategories, page), TTL.CATEGORY)); } catch (e) { next(e); }
  });

  app.get('/api/genre/:genre', async (req: Request, res: Response, next: NextFunction) => {
    const { genre } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const key = `genre:${genre}:${page}`;
    try { res.json(await cache.getOrFetch(key, () => scrapedMangaGenre(genre, page), TTL.GENRE)); } catch (e) { next(e); }
  });

  app.get('/api/manga/:id', async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const key = `manga-info:${id}`;
    try { res.json(await cache.getOrFetch(key, () => scrapeMangaInfo(id), TTL.MANGA_INFO)); } catch (e) { next(e); }
  });

  app.get('/api/manga/:id/chapters', async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const key = `chapters:${id}`;
    try { res.json(await cache.getOrFetch(key, () => getChapters(id), TTL.CHAPTERS)); } catch (e) { next(e); }
  });

  app.get('/api/manga/:id/chapters/:lng', async (req: Request, res: Response, next: NextFunction) => {
    const { id, lng } = req.params;
    const key = `chapters:${id}:${lng}`;
    try { res.json(await cache.getOrFetch(key, () => getChapters(id, lng), TTL.CHAPTERS)); } catch (e) { next(e); }
  });

  app.get('/api/chapter/:chapterId', async (req: Request, res: Response, next: NextFunction) => {
    const { chapterId } = req.params;
    const key = `chapter-imgs:${chapterId}`;
    try { res.json(await cache.getOrFetch(key, () => getChapterImages(chapterId), TTL.CHAPTER_IMGS)); } catch (e) { next(e); }
  });

  app.get('/api/volumes/:id', async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const lang = (req.query.lang as string) || 'en';
    const key = `volumes:${id}:${lang}`;
    try { res.json(await cache.getOrFetch(key, () => getVolumes(id, lang), TTL.VOLUMES)); } catch (e) { next(e); }
  });

  app.get('/api/updated', async (req: Request, res: Response, next: NextFunction) => {
    const page = parseInt(req.query.page as string) || 1;
    try { res.json(await cache.getOrFetch(`updated:${page}`, () => scrapeLatestPage('updated', page), TTL.LATEST)); } catch (e) { next(e); }
  });

  app.get('/api/newest', async (req: Request, res: Response, next: NextFunction) => {
    const page = parseInt(req.query.page as string) || 1;
    try { res.json(await cache.getOrFetch(`newest:${page}`, () => scrapeLatestPage('newest', page), TTL.LATEST)); } catch (e) { next(e); }
  });

  app.get('/api/added', async (req: Request, res: Response, next: NextFunction) => {
    const page = parseInt(req.query.page as string) || 1;
    try { res.json(await cache.getOrFetch(`added:${page}`, () => scrapeLatestPage('added', page), TTL.LATEST)); } catch (e) { next(e); }
  });

  // 404 handler
  app.use((_req: Request, _res: Response, next: NextFunction) => { next(createHttpError(404, 'Route not found')); });

  // Error handler
  app.use((err: HttpError, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || 500;
    res.status(status).json({ error: err.message || 'Internal server error', status });
  });

  // Standalone server (for local dev)
  if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
    const PORT = parseInt(process.env.PORT || '3000');
    app.listen(PORT, () => console.log(`MangaFire API running on http://localhost:${PORT}`));
  }

  export default app;
  module.exports = app;
  