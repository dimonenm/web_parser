import { CookieObject, IPost, IShortCode } from './instagram.interfaces';
import * as path from 'path';
import * as fs from 'fs';
import { Browser, Page } from 'puppeteer';

export function parseCookiesToPuppeteerFormat(
  cookieString: string,
  domain = '.instagram.com',
  path = '/',
): CookieObject[] {
  return cookieString
    .split('; ')
    .map((cookie) => {
      const [name, ...valueParts] = cookie.split('=');
      const value = valueParts.join('=');
      return {
        name: name.trim(),
        value: decodeURIComponent(value.trim()),
        domain,
        path,
      };
    })
    .filter((cookie) => cookie.name && cookie.value);
}

// Скриншот
export async function makeScreenshot(
  page: Page,
  fileName: string,
): Promise<void> {
  const outputPath = path.join(process.cwd(), 'uploads', `${fileName}.jpeg`);
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  await page.screenshot({ path: outputPath, fullPage: true });
}

// Получить HTML
export async function makeHTMLFile(
  page: Page,
  fileName: string,
): Promise<void> {
  const outputPath = path.join(process.cwd(), 'uploads', `${fileName}.html`);
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  const html = await page.content();
  fs.writeFileSync(outputPath, html, 'utf-8');
}

export function getLastQueryParam(url: string): string | null {
  const query = url.split('?')[1];
  if (!query) return null;
  return query.split('&').pop() || null;
}

export function hasLastParam(
  linksSet: Set<string>,
  expectedParam: string | null,
): boolean {
  for (const url of linksSet) {
    const lastParam = url.split('?')[1]?.split('&').pop();
    if (lastParam === expectedParam) {
      return true;
    }
  }
  return false;
}

export async function measure<T>(
  name: string,
  fn: () => Promise<T>,
): Promise<T> {
  // Замеряем ресурсы до запуска
  const startTime = Date.now();

  // Выполняем функцию
  const result = await fn();

  // Замеряем ресурсы после
  const endTime = Date.now();

  // Выводим результат
  console.log(`\n📊 ${name}:`);
  console.log(`  ⏱  Время:  ${endTime - startTime} мс`);

  return result;
}

export async function setAuthCookies(browser: Browser) {
  const ds_user_id: string = process.env.ds_user_id
  ? process.env.ds_user_id
  : '';
  const ig_did: string = process.env.ig_did ? process.env.ig_did : '';
  const mid: string = process.env.mid ? process.env.mid : '';
  const datr: string = process.env.datr ? process.env.datr : '';
  const csrftoken: string = process.env.csrftoken ? process.env.csrftoken : '';
  const sessionid: string = process.env.sessionid ? process.env.sessionid : '';
  const rur: string = process.env.rur ? process.env.rur : '';

  await browser.setCookie(
    {
      name: 'ds_user_id',
      value: ds_user_id,
      domain: '.instagram.com',
      path: '/',
    },
    {
      name: 'ig_did',
      value: ig_did,
      domain: '.instagram.com',
      path: '/',
    },
    {
      name: 'mid',
      value: mid,
      domain: '.instagram.com',
      path: '/',
    },
    {
      name: 'datr',
      value: datr,
      domain: '.instagram.com',
      path: '/',
    },
    {
      name: 'ps_l',
      value: '1',
      domain: '.instagram.com',
      path: '/',
    },
    {
      name: 'ps_n',
      value: '1',
      domain: '.instagram.com',
      path: '/',
    },
    {
      name: 'csrftoken',
      value: csrftoken,
      domain: '.instagram.com',
      path: '/',
    },
    {
      name: 'sessionid',
      value: sessionid,
      domain: '.instagram.com',
      path: '/',
    },
    {
      name: 'wd',
      value: '1920x1080',
      domain: '.instagram.com',
      path: '/',
    },
    {
      name: 'rur',
      value: rur,
      domain: '.instagram.com',
      path: '/',
    },
  );
}

export function readJsonData(fileName: string): IPost[] {
  // Полный путь к файлу
  const fullPath = path.join(process.cwd(), `uploads/${fileName}.json`);

  // Проверяем существование
  if (!fs.existsSync(fullPath)) {
    throw new Error(`Файл не найден: ${fullPath}`);
  }

  // Читаем и парсим
  const rawData = fs.readFileSync(fullPath, 'utf-8');
  const data: IPost[] = JSON.parse(rawData);

  return data;
}
export function readJsonShortCodes(mainDir: string, id: string): IShortCode[] {
  // Полный путь к файлу
  const filePath = path.join(mainDir, `${id}_ShortCodes.json`);
  try {
    // Проверяем существование
    if (!fs.existsSync(filePath)) {
      console.log(`Файл не найден: ${filePath}`);
      return [];
    } else {
      // Читаем и парсим
      const rawData = fs.readFileSync(filePath, 'utf-8');
      const data: IShortCode[] = JSON.parse(rawData);

      return data;
    }
  } catch (error) {
    console.log(`Ошибка чтения файла ${filePath}:`);
    return [];
  }
}

export async function deley(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}
