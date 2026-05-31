import createHttpError from 'http-errors';
  import { client } from '../utils/axiosClient';
  import { AxiosError } from 'axios';
  import { load } from 'cheerio';
  import { ScrapedLatestPage, MangaCategoryResult } from '../types/parsers/index';

  export type LatestPageType = 'updated' | 'newest' | 'added';

  async function scrapeLatestPage(pageType: LatestPageType, page: number = 1): Promise<ScrapedLatestPage> {
    const res: ScrapedLatestPage = { results: [], currentPage: page, hasNextPage: false, totalPages: 1 };
    try {
      const content = await client.get(`/${pageType}?page=${page}`);
      const $ = load(content.data);
      const totalText = $('section.mt-5 > .head > span').text().trim();
      const m = totalText.match(/(\d{1,3}(,\d{3})*)/);
      const total = m ? parseInt(m[0].replace(/,/g,'')) : 0;
      const onPage = $('div.original.card-lg > div.unit').length;
      res.totalPages = (total > 0 && onPage > 0) ? Math.ceil(total / onPage) : 1;
      res.hasNextPage = page < res.totalPages;
      $('div.original.card-lg > div.unit').each((_, el) => {
        const manga: MangaCategoryResult = { id: $(el).find('a.poster').attr('href')?.replace('/manga/','') || null, title: $(el).find('div.info > a').text().trim() || null, poster: $(el).find('a.poster > div > img').attr('src')?.trim() || null, type: $(el).find('div.info > div > span.type').text().trim() || null, chapters: [] };
        $(el).find('ul.content[data-name="chap"] > li').each((_, ce) => { manga.chapters!.push({ url: $(ce).find('a').attr('href') || null, title: $(ce).find('a').attr('title') || null, chapter: $(ce).find('a > span:first-child').text().trim() || null, releaseDate: $(ce).find('a > span:last-child').text().trim() || null }); });
        res.results.push(manga);
      });
      return res;
    } catch (err: any) {
      if (err instanceof AxiosError) throw createHttpError(err?.response?.status || 500, err?.response?.statusText || 'Something went wrong');
      throw createHttpError(500, err?.message);
    }
  }
  export default scrapeLatestPage;
  