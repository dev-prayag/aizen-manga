import createHttpError from 'http-errors';
  import { client } from '../utils/axiosClient';
  import { AxiosError } from 'axios';
  import { load } from 'cheerio';
  import { MangaChapter, Chapter, Volume, Language } from '../types/parsers/index';

  export async function getLanguages(mangaId: string): Promise<Language[]> {
    try {
      const content = await client.get(`/manga/${mangaId}`);
      const $ = load(content.data);
      const languages: Language[] = [];
      $('div[data-name="chapter"] .dropdown-menu a').each((_, el) => {
        const item = $(el); const text = item.text().trim();
        const m = text.match(/\((\d+)\s*Chapters?\)/i);
        languages.push({ id: item.attr('data-code') || null, title: item.attr('data-title') || null, chapters: m ? `${m[1]} Chapters` : null, logo: null });
      });
      return languages;
    } catch (err: any) {
      if (err instanceof AxiosError) throw createHttpError(err?.response?.status || 500, err?.response?.statusText || 'Something went wrong');
      throw createHttpError(500, err?.message);
    }
  }

  export async function getChapters(mangaId: string, language?: string): Promise<Chapter[] | Language[]> {
    if (!language) return getLanguages(mangaId);
    try {
      const response = await client.get(`/ajax/read/${mangaId.split('.')[1]}/chapter/${language.toLowerCase()}`, { headers: { 'X-Requested-With': 'XMLHttpRequest' } });
      const json: { result: { html: string } } = response.data;
      const $ = load(json.result.html);
      const chapters: Chapter[] = [];
      $('li').each((_, li) => { const a = $(li).find('a'); chapters.push({ number: a.attr('data-number') ?? '', title: a.find('span:first-child').text().trim(), chapterId: a.attr('data-id') ?? '', language, releaseDate: a.find('span:last-child').text().trim() || null }); });
      return chapters;
    } catch (err: any) {
      if (err instanceof AxiosError) throw createHttpError(err?.response?.status || 500, err?.response?.statusText || 'Something went wrong');
      throw createHttpError(500, err?.message);
    }
  }

  export async function getChapterImages(chapterId: string): Promise<string[]> {
    try {
      const response = await client.get(`/ajax/read/chapter/${chapterId}`, { headers: { 'X-Requested-With': 'XMLHttpRequest' } });
      const json: { result: { images: string[][] } } = response.data;
      return json.result.images.map(img => img[0]);
    } catch (err: any) {
      if (err instanceof AxiosError) throw createHttpError(err?.response?.status || 500, err?.response?.statusText || 'Something went wrong');
      throw createHttpError(500, err?.message);
    }
  }

  export async function scrapeChaptersFromInfoPage(mangaSlug: string): Promise<MangaChapter[]> {
    try {
      const content = await client.get(`/manga/${mangaSlug}`);
      const $ = load(content.data);
      const chapters: MangaChapter[] = [];
      $('ul.scroll-sm li.item').each((_, el) => { chapters.push({ url: $(el).find('a').attr('href') || null, title: $(el).find('a').attr('title') || null, chapter: $(el).find('a > span:first-child').text().trim() || null, releaseDate: $(el).find('a > span:last-child').text().trim() || null }); });
      return chapters;
    } catch (err: any) {
      if (err instanceof AxiosError) throw createHttpError(err?.response?.status || 500, err?.response?.statusText || 'Something went wrong');
      throw createHttpError(500, err?.message);
    }
  }

  export async function getVolumes(mangaId: string, language: string = 'en'): Promise<Volume[]> {
    try {
      const actualId = mangaId.split('.').pop();
      const response = await client.get(`/ajax/manga/${actualId}/volume/${language.toLowerCase()}`, { headers: { 'X-Requested-With': 'XMLHttpRequest' } });
      const json: { result: string } = response.data;
      const $ = load(json.result);
      const volumes: Volume[] = [];
      $('.unit').each((_, el) => { const img = $(el).find('img').attr('src'); volumes.push({ id: $(el).find('a').attr('href') || null, image: img?.startsWith('http') ? img : `https://mangafire.to${img}` }); });
      return volumes;
    } catch (err: any) {
      if (err instanceof AxiosError) throw createHttpError(err?.response?.status || 500, err?.response?.statusText || 'Something went wrong');
      throw createHttpError(500, err?.message);
    }
  }
  