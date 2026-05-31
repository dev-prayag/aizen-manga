import createHttpError from 'http-errors';
  import { client } from '../utils/axiosClient';
  import { AxiosError } from 'axios';
  import { load } from 'cheerio';
  import { ScrapedHomePage } from '../types/parsers/index';

  async function scrapeHomePage(): Promise<ScrapedHomePage> {
    const res: ScrapedHomePage = { releasingManga: [], mostViewedManga: { day: [], week: [], month: [] }, recentlyUpdatedManga: [], newReleaseManga: [] };
    try {
      const content = await client.get('/home');
      const $ = load(content.data);
      $('#top-trending .container .swiper .swiper-wrapper .swiper-slide').each((_, el) => {
        res.releasingManga.push({ id: $(el).find('.info .above a').attr('href') || null, status: $(el).find('.info .above span').text().trim() || null, name: $(el).find('.info .above a').text().trim() || null, description: $(el).find('.info .below span').text().trim() || null, currentChapter: $(el).find('.info .below p').text().trim() || null, genres: $(el).find('.info .below div a').map((_, e) => $(e).text().trim()).get() || null, poster: $(el).find('.swiper-inner a div img').attr('src')?.trim() || null });
      });
      $('#most-viewed .tab-content[data-name="day"] .swiper-slide.unit').each((_, el) => { res.mostViewedManga.day.push({ id: $(el).find('a').attr('href') || null, name: $(el).find('a span').text().trim() || null, rank: $(el).find('a b').text().trim() || null, poster: $(el).find('a .poster img').attr('src')?.trim() || null }); });
      $('#most-viewed .tab-content[data-name="week"] .swiper-slide.unit').each((_, el) => { res.mostViewedManga.week.push({ id: $(el).find('a').attr('href') || null, name: $(el).find('a span').text().trim() || null, rank: $(el).find('a b').text().trim() || null, poster: $(el).find('a .poster img').attr('src')?.trim() || null }); });
      $('#most-viewed .tab-content[data-name="month"] .swiper-slide.unit').each((_, el) => { res.mostViewedManga.month.push({ id: $(el).find('a').attr('href') || null, name: $(el).find('a span').text().trim() || null, rank: $(el).find('a b').text().trim() || null, poster: $(el).find('a .poster img').attr('src')?.trim() || null }); });
      $('.tab-content[data-name="all"] .unit').each((_, el) => { res.recentlyUpdatedManga.push({ id: $(el).find('.inner > a').attr('href') || null, name: $(el).find('.info > a').text().trim() || null, poster: $(el).find('.inner > a img').attr('src')?.trim() || null, type: $(el).find('.inner .info div .type').text().trim() || null, latestChapters: $(el).find('.info .content[data-name="chap"] li').map((_, ce) => ({ chapterName: $(ce).find('a span').first().text().trim(), releaseTime: $(ce).find('a span').last().text().trim() })).get() || null }); });
      $(' .swiper-container .swiper.completed .card-md .swiper-slide.unit').each((_, el) => { res.newReleaseManga.push({ id: $(el).find('a').attr('href') || null, name: $(el).find('a span').text().trim() || null, poster: $(el).find('a .poster img').attr('src')?.trim() || null }); });
      return res;
    } catch (err: any) {
      if (err instanceof AxiosError) throw createHttpError(err?.response?.status || 500, err?.response?.statusText || 'Something went wrong');
      throw createHttpError(500, err?.message);
    }
  }
  export default scrapeHomePage;
  