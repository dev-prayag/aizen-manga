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
  import { MangaCategories } from '../src/types/manga';
  import axios from 'axios';

  const app = express();

  app.use(cors());
  app.use(express.json());

  app.get('/', (_req, res) => {
    res.json({ status: 'ok', message: 'MangaFire API — try /api/home' });
  });

  app.get('/proxy-image', async (req: Request, res: Response, next: NextFunction) => {
    const url = req.query.url as string;
    if (!url) return next(createHttpError(400, 'url query param required'));
    try {
      const response = await axios.get(url, {
        responseType: 'stream',
        headers: { Referer: 'https://mangafire.to/' },
      });
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
    try { res.json(await cache.getOrFetch(`search:${keyword}:${page}`, () => scrapeSearchResults(keyword, page), TTL.SEARCH)); } catch (e) { next(e); }
  });

  app.get('/api/category/:category', async (req: Request, res: Response, next: NextFunction) => {
    const { category } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    try { res.json(await cache.getOrFetch(`category:${category}:${page}`, () => scrapedMangaCategory(category as MangaCategories, page), TTL.CATEGORY)); } catch (e) { next(e); }
  });

  app.get('/api/genre/:genre', async (req: Request, res: Response, next: NextFunction) => {
    const { genre } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    try { res.json(await cache.getOrFetch(`genre:${genre}:${page}`, () => scrapedMangaGenre(genre, page), TTL.GENRE)); } catch (e) { next(e); }
  });

  app.get('/api/manga/:id', async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    try { res.json(await cache.getOrFetch(`manga-info:${id}`, () => scrapeMangaInfo(id), TTL.MANGA_INFO)); } catch (e) { next(e); }
  });

  app.get('/api/manga/:id/chapters', async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    try { res.json(await cache.getOrFetch(`chapters:${id}`, () => getChapters(id), TTL.CHAPTERS)); } catch (e) { next(e); }
  });

  app.get('/api/manga/:id/chapters/:lng', async (req: Request, res: Response, next: NextFunction) => {
    const { id, lng } = req.params;
    try { res.json(await cache.getOrFetch(`chapters:${id}:${lng}`, () => getChapters(id, lng), TTL.CHAPTERS)); } catch (e) { next(e); }
  });

  app.get('/api/chapter/:chapterId', async (req: Request, res: Response, next: NextFunction) => {
    const { chapterId } = req.params;
    try { res.json(await cache.getOrFetch(`chapter-imgs:${chapterId}`, () => getChapterImages(chapterId), TTL.CHAPTER_IMGS)); } catch (e) { next(e); }
  });

  app.get('/api/volumes/:id', async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const lang = (req.query.lang as string) || 'en';
    try { res.json(await cache.getOrFetch(`volumes:${id}:${lang}`, () => getVolumes(id, lang), TTL.VOLUMES)); } catch (e) { next(e); }
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

  app.use((_req: Request, _res: Response, next: NextFunction) => { next(createHttpError(404, 'Route not found')); });

  app.use((err: HttpError, _req: Request, res: Response, _next: NextFunction) => {
    res.status(err.status || 500).json({ error: err.message || 'Internal server error', status: err.status || 500 });
  });

  const PORT = parseInt(process.env.PORT || '3000');
  app.listen(PORT, () => console.log(`MangaFire API running on port ${PORT}`));

  export default app;
  