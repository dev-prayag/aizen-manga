# MangaFire API

  A REST API that scrapes manga data from [MangaFire.to](https://mangafire.to).

  ## Endpoints

  | Endpoint | Description |
  |---|---|
  | `GET /api/home` | Home page — trending, most viewed, recently updated |
  | `GET /api/search/:keyword?page=1` | Search manga by keyword |
  | `GET /api/category/:category?page=1` | Browse by category (manga, manhwa, manhua, etc.) |
  | `GET /api/genre/:genre?page=1` | Browse by genre |
  | `GET /api/manga/:id` | Manga details |
  | `GET /api/manga/:id/chapters` | Available languages |
  | `GET /api/manga/:id/chapters/:lng` | Chapter list for a language |
  | `GET /api/chapter/:chapterId` | Chapter images |
  | `GET /api/volumes/:id?lang=en` | Volume list |
  | `GET /api/updated?page=1` | Recently updated manga |
  | `GET /api/newest?page=1` | Newest manga |
  | `GET /api/added?page=1` | Recently added manga |
  | `GET /api/cache/stats` | Cache statistics |
  | `GET /proxy-image?url=...` | Image proxy (CORS bypass) |

  ## Deploy on Vercel

  [![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/dev-prayag/aizen-manga)

  ## Local development

  ```bash
  npm install
  npm run dev
  ```
  