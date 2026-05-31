import { AxiosError } from 'axios';
  import { load } from 'cheerio';
  import createHttpError from 'http-errors';
  import { client } from '../utils/axiosClient';
  import { MangaChapter, ScrapedSearchResults, SearchResult } from '../types/parsers';

  export const scrapeSearchResults = async (keyword: string, page: number = 1): Promise<ScrapedSearchResults> => {
    const res: ScrapedSearchResults = { currentPage: page, totalPages: 0, results: [] };
    try {
      const content = await client.get(`/filter?keyword=${keyword}&page=${page}`);
      const $ = load(content.data);
      let totalPages = 0;
      const pageLinks = $('ul.pagination > li.page-item > a');
      if (pageLinks.length > 0) { pageLinks.each((_, el) => { const n = parseInt($(el).text()); if (!isNaN(n) && n > totalPages) totalPages = n; }); }
      if (totalPages === 0) { const t = $('section.mt-5 > .head > span').text(); const total = parseInt(t.replace('mangas','').trim()); const onPage = $('div.original.card-lg > div.unit').length; totalPages = (!isNaN(total) && onPage > 0) ? Math.ceil(total / onPage) : (!isNaN(total) && total === 0) ? 0 : 1; }
      res.totalPages = totalPages;
      $('div.original.card-lg > div.unit').each((_, el) => {
        const r: SearchResult = { id: $(el).find('a.poster').attr('href')?.replace('/manga/','') || null, title: $(el).find('div.info > a').text().trim() || null, poster: $(el).find('a.poster > div > img').attr('src')?.trim() || null, type: $(el).find('div.info > div > span.type').text().trim() || null, chapters: [] };
        $(el).find('ul.content[data-name="chap"] > li').each((_, ce) => { r.chapters!.push({ url: $(ce).find('a').attr('href') || null, title: $(ce).find('a').attr('title') || null, chapter: $(ce).find('a > span:first-child').text().trim() || null, releaseDate: $(ce).find('a > span:last-child').text().trim() || null }); });
        res.results.push(r);
      });
      return res;
    } catch (err: any) {
      if (err instanceof AxiosError) throw createHttpError(err?.response?.status || 500, err?.response?.statusText || 'Something went wrong');
      throw createHttpError(500, err?.message);
    }
  };
  