import { Browser, Page } from 'puppeteer';
import * as path from 'path';
import * as fs from 'fs';
import { IPost } from './instagram.interfaces';

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

export function saveJsonFile<T>(
  mainDir: string,
  fileName: string, // например `${id}_Gallery`
  fileData: T[],
) {
  const filePath = path.join(mainDir, `${fileName}.json`);

  try {
    fs.mkdirSync(mainDir, { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(fileData), 'utf-8');
  } catch (error) {
    console.log(`Ошибка записи файла ${filePath}:`);
    console.log('error: ', error);
  }
}

export async function deley(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

// Форматирование длительности: 850 -> "850 мс", 3400 -> "3.400 с", 65000 -> "1 мин 5 с"
export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms} мс`;

  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) {
    return `${seconds}.${String(ms % 1000).padStart(3, '0')} с`;
  }

  const minutes = Math.floor(seconds / 60);
  return `${minutes} мин ${seconds % 60} с`;
}