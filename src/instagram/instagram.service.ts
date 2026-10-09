import { Injectable } from '@nestjs/common';
import puppeteer, { Browser, Page } from 'puppeteer';
import * as path from 'path';
import * as fs from 'fs';
import {
  deley,
  getLastQueryParam,
  hasLastParam,
  makeHTMLFile,
  makeScreenshot,
  measure,
  readJsonData,
  readJsonShortCodes,
  setAuthCookies,
} from './instagram.utils';
import { IPost, IShortCode } from './instagram.interfaces';

@Injectable()
export class InstagramService {
  private deleyCount = 1000;

  // поля класса
  private shortCodesArray: IShortCode[] = [];
  private seenShortCodes = new Set<string>();
  private countOfPosts: number = 0;
  private isRunning = false;

  // Определяем корневую папку для скачивания
  mainDir = path.join(process.cwd(), 'uploads');

  private async getShortCodes(
    id: string,
    browser: Browser,
  ): Promise<IShortCode[]> {
    const url = `https://www.instagram.com/${id}/`;

    const uniqueCodes: Array<IShortCode> = [];

    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });

    try {
      await page.goto(url, { waitUntil: 'domcontentloaded' });
      await deley(this.deleyCount);
    } catch (e) {
      console.log('Ошибка загрузки страницы:', (e as Error).message);
      return [];
    }

    try {
      await page.waitForSelector('div:nth-child(1) > span > span > span', {
        timeout: 10000,
      });
    } catch (e) {
      console.warn('⚠️ Селектор поста не найден, продолжаем без него.');
    }

    const postsCount: number = await page.evaluate((): number => {
      const elements: NodeListOf<HTMLSpanElement> = document.querySelectorAll(
        'div:nth-child(1) > span > span > span',
      );
      return parseInt(elements[0]?.innerHTML || '0', 10);
    });
    console.log('postsCount: ', postsCount);

    const savedShortCodes = readJsonShortCodes(this.mainDir, id);
    console.log('savedShortCodes: ', savedShortCodes.length);

    if (savedShortCodes.length && savedShortCodes.length === postsCount) {
      return savedShortCodes;
    }

    let safetyCounter = 0;
    const maxScrolls = postsCount > 0 ? postsCount : 100; // защита от зависания, если postsCount = 0

    while (uniqueCodes.length < postsCount && safetyCounter < maxScrolls) {
      // Прокрутка страницы
      await page.evaluate(() => {
        window.scrollBy(0, 1080);
      });
      await deley(this.deleyCount);

      // Извлекаем data внутри evaluate и возвращаем наружу
      const codes = await page.evaluate(() => {
        const elems: NodeListOf<Element> =
          document.querySelectorAll('div.xg7h5cd a');
        const results: IShortCode[] = [];
        elems.forEach((element) => {
          const href = element.getAttribute('href');
          if (!href) return;
          const parts = href.split('/').filter(Boolean);
          const shortCodeData = parts.pop();
          const typeData = parts.pop();
          results.push({
            type: typeData ?? '',
            shortCode: shortCodeData ?? '',
          });
        });
        return results;
      });

      // Интеграция проверки на дубликаты
      codes.forEach((code) => {
        if (
          !uniqueCodes.some((existing) => existing.shortCode === code.shortCode)
        ) {
          uniqueCodes.push(code);
        }
      });

      safetyCounter++;
    }

    await makeScreenshot(page, 'getShortCodes');

    await page.close();

    return uniqueCodes;
  }
  private async getShortCodesV2(id: string): Promise<void> {
    // Опредение адреса для запроса
    const url = `https://www.instagram.com/${id}/`;

    // Инициализация и настройка браузера
    const browser = await puppeteer.launch({
      headless: true,
    });
    await setAuthCookies(browser);

    // Настройка страницы
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });

    // Переход на сстраницу профиля
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded' });
      await deley(this.deleyCount);
    } catch (e) {
      console.log('Ошибка загрузки страницы:', (e as Error).message);
    }

    // Ожидание загрузки селектора для выбора элемента количества постов
    try {
      const selector = await page.waitForSelector(
        'div:nth-child(1) > span > span > span',
        {
          timeout: 10000,
        },
      );
    } catch (e) {
      console.warn('Селектор поста не найден.');
    }

    // Определение количества постов на странице
    const postCount: number = await page.evaluate((): number => {
      const elem: HTMLSpanElement | null = document.querySelector(
        'div:nth-child(1) > span > span > span',
      );

      if (elem) {
        return Number(elem.innerText);
      } else {
        return 0;
      }
    });
    console.log('postCount: ', postCount);

    this.countOfPosts = postCount;

    const savedShortCodes = readJsonShortCodes(this.mainDir, id);
    console.log('savedShortCodes: ', savedShortCodes.length);

    // Если shortCodes уже были собраны, то возвращаем сохраненные
    if (savedShortCodes.length && savedShortCodes.length === postCount) {
      this.shortCodesArray = savedShortCodes;
      this.seenShortCodes = new Set(savedShortCodes.map((c) => c.shortCode));
    } else {
      let safetyCounter = 0;
      const maxScrolls = postCount > 0 ? postCount / 4 : 100; // защита от зависания, если postsCount = 0

      while (
        this.shortCodesArray.length < postCount &&
        safetyCounter < maxScrolls
      ) {
        // Прокрутка страницы
        await page.evaluate(() => {
          window.scrollBy(0, 1080);
        });
        await deley(this.deleyCount);

        // Извлекаем data внутри evaluate и возвращаем наружу
        const codes: IShortCode[] = await page.evaluate(() => {
          const elems: NodeListOf<Element> =
            document.querySelectorAll('div.xg7h5cd a');
          const results: IShortCode[] = [];
          elems.forEach((element) => {
            const href = element.getAttribute('href');
            if (!href) return;
            const parts = href.split('/').filter(Boolean);
            const shortCodeData = parts.pop();
            const typeData = parts.pop();
            results.push({
              type: typeData ?? '',
              shortCode: shortCodeData ?? '',
            });
          });
          return results;
        });

        // Интеграция проверки на дубликаты
        codes.forEach((code: IShortCode) => {
          if (!code.shortCode || this.seenShortCodes.has(code.shortCode))
            return;
          this.seenShortCodes.add(code.shortCode);
          this.shortCodesArray.push(code);
        });

        safetyCounter++;
      }
    }

    await makeScreenshot(page, 'getShortCodesV2');

    // await makeHTMLFile(page, 'getShortCodesV2');

    await page.close();

    await browser.close();

    if (this.shortCodesArray.length) {
      const fileName = path.join(this.mainDir, `${id}_ShortCodes.json`);

      // Создаем папку uploads, если её нет
      fs.mkdirSync(this.mainDir, { recursive: true });

      fs.writeFileSync(fileName, JSON.stringify(this.shortCodesArray), 'utf-8');
    }
  }
  private async getPUrls(
    shortCode: IShortCode,
    browser: Browser,
  ): Promise<IPost> {
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });

    const picUrl = `https://www.instagram.com/p/${shortCode.shortCode}/`;
    const linksSet = new Set<string>();
    const post: IPost = {
      type: shortCode.type,
      shortCode: shortCode.shortCode,
      picUrls: [],
    };

    await page.goto(picUrl, { waitUntil: 'domcontentloaded' });
    await deley(this.deleyCount);

    const picPagesCount = await page.evaluate(() => {
      const elements = document.querySelectorAll('div._acnb');
      if (elements.length < 1) return 1;
      return elements.length;
    });

    for (let i = 1; i <= picPagesCount; i++) {
      await page.goto(`${picUrl}?img_index=${i}`, {
        waitUntil: 'domcontentloaded',
      });
      await deley(this.deleyCount);

      // await makeScreenshot(page, 'getPUrls_' + Date.now())

      // Считываем актуальный src
      const elementsLinks: string[] = await page.evaluate(() => {
        const nodeList = document.querySelectorAll<HTMLImageElement>(
          'div.x1i10hfl div._aagu img',
        );
        const urls = Array.from(nodeList).map((img) => img.src);
        return urls;
      });

      // Добавляем только уникальные ссылки
      if (elementsLinks) {
        elementsLinks.forEach((element) => {
          const expectedParam: string | null = getLastQueryParam(element);
          if (!hasLastParam(linksSet, expectedParam)) {
            linksSet.add(element);
          }
        });
      }
    }

    await page.close();

    post.picUrls = Array.from(linksSet);

    return post;
  }
  private async getReelPicUrl(
    shortCode: IShortCode,
    browser: Browser,
  ): Promise<IPost> {
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });

    const picUrl = `https://www.instagram.com/reel/${shortCode.shortCode}/`;
    const post: IPost = {
      type: shortCode.type,
      shortCode: shortCode.shortCode,
      picUrls: [],
    };

    await page.goto(picUrl, { waitUntil: 'domcontentloaded' });
    await deley(this.deleyCount);

    const reelPicUrl: string = await page.evaluate((): string => {
      const elements: HTMLImageElement | null =
        document.querySelector('div > img');
      if (elements) return elements.src;
      return '';
    });

    post.picUrls = [reelPicUrl];

    await page.close();

    return post;
  }

  async getAllPics(id: string): Promise<IPost[]> {
    const startTime = Date.now();
    console.log(`Запуск getAllPics для ${id}...`);

    const browser = await puppeteer.launch({
      headless: true,
    });
    await setAuthCookies(browser);

    const shortCodes = await measure('getShortCodes', () =>
      this.getShortCodes(id, browser),
    );

    if (shortCodes.length) {
      const fileName = path.join(this.mainDir, `${id}_ShortCodes.json`);

      // Создаем папку uploads, если её нет
      fs.mkdirSync(this.mainDir, { recursive: true });

      fs.writeFileSync(fileName, JSON.stringify(shortCodes), 'utf-8');
    }

    const picPosts: IPost[] = [];

    let i = 0;

    for (const shortCode of shortCodes) {
      console.log(`#${i + 1} из ${shortCodes.length}`);

      if (shortCode.type === 'p') {
        const post = await measure('getPUrls', () =>
          this.getPUrls(shortCode, browser),
        );
        picPosts.push(post);
      }
      if (shortCode.type === 'reel') {
        const post = await measure('getReelPicUrl', () =>
          this.getReelPicUrl(shortCode, browser),
        );
        picPosts.push(post);
      }
      i++;
    }

    const outputPath = path.join(this.mainDir, `${id}.json`);
    fs.writeFileSync(outputPath, JSON.stringify(picPosts), 'utf-8');

    await browser.close();

    const totalTime = Date.now() - startTime;
    console.log(`✅ getAllPics завершён за ${totalTime} мс`);

    return picPosts;
  }

  async getAllShortCodes(id: string): Promise<IShortCode[]> {
    const startTime = Date.now();
    console.log(`Запуск getAllShortCodes для ${id}...`);

    const browser = await puppeteer.launch({
      headless: true,
    });
    await setAuthCookies(browser);

    const shortCodes = await measure('getShortCodes', () =>
      this.getShortCodes(id, browser),
    );

    if (shortCodes.length) {
      const fileName = path.join(this.mainDir, `${id}_ShortCodes.json`);

      // Создаем папку uploads, если её нет
      fs.mkdirSync(this.mainDir, { recursive: true });

      fs.writeFileSync(fileName, JSON.stringify(shortCodes), 'utf-8');
    }

    await browser.close();

    const totalTime = Date.now() - startTime;
    console.log(`✅ getAllShortCodes завершён за ${totalTime} мс`);

    return shortCodes;
  }

  getAllShortCodesV2(id: string): string {
    if (this.isRunning) return JSON.stringify({ status: 'already_running' });

    this.isRunning = true;
    this.shortCodesArray = [];
    this.seenShortCodes.clear();

    this.getShortCodesV2(id)
      .catch((e) => console.error('❌ getShortCodesV2:', e)) // ← без этого ошибки молча убивают процесс
      .finally(() => {
        console.log('getShortCodesV2 finally');
        this.isRunning = false;
      });

    return JSON.stringify({ status: 'started', id });
  }

  getShortCodesStatus(): { current: number; total: number; running: boolean } {
    console.log('ShortCodes Status was send: ', {
      current: this.shortCodesArray.length,
      total: this.countOfPosts,
      running: this.isRunning,
    });
    return {
      current: this.shortCodesArray.length,
      total: this.countOfPosts,
      running: this.isRunning,
    };
  }
  
  async getShortCodesFile(id: string): Promise<IShortCode[]> {
    const savedShortCodes = readJsonShortCodes(this.mainDir, id);
    return savedShortCodes;
  }

  async getPicByShortCode(type: string, shortCode: string): Promise<IPost> {
    const startTime = Date.now();
    console.log(`Запуск getPicByShortCode для ${shortCode}...`);

    const shortCodeData: IShortCode = { type, shortCode };
    const browser = await puppeteer.launch({
      headless: true,
    });
    await setAuthCookies(browser);

    if (type === 'p') {
      const post: IPost = await measure('getPUrls', () =>
        this.getPUrls(shortCodeData, browser),
      );
      await browser.close();
      return post;
    }
    if (type === 'reel') {
      const post: IPost = await measure('getReelPicUrl', () =>
        this.getReelPicUrl(shortCodeData, browser),
      );
      await browser.close();
      return post;
    }

    const post: IPost = { type: type, shortCode: shortCode, picUrls: [] };

    await browser.close();

    const totalTime = Date.now() - startTime;
    console.log(`✅ getAllShortCodes завершён за ${totalTime} мс`);

    return post;
  }

  async downloadAllPics(fileName: string) {
    try {
      // 1. Определяем корневую папку для скачивания
      const downloadsDir = path.join(this.mainDir, fileName);

      // 2. Создаем папку uploads, если её нет
      fs.mkdirSync(downloadsDir, { recursive: true });

      const posts = readJsonData(fileName);

      for (const post of posts) {
        console.log(`\n Обработка поста: ${post.shortCode}`);
        for (const picUrl of post.picUrls) {
          if (!picUrl) continue;

          try {
            const response = await fetch(picUrl);
            const buffer = await response.arrayBuffer();

            const imgName = `${post.type}_${post.shortCode}_${Date.now()}.jpg`;

            const filePath = path.join(downloadsDir, imgName);

            await fs.promises.writeFile(filePath, Buffer.from(buffer));
            console.log(`Сохранено: ${imgName}`);
          } catch (e) {
            console.log(`Ошибка: ${(e as Error).message}`);
          }
        }
      }
    } catch (error) {
      console.error('Ошибка при загрузке файла:', error);
    }
  }
}
