export interface IGalleryItem {
  type: string;
  shortCode: string;
  picUrls: string[];
  index: number; // позиция якоря в сетке, чтобы кликнуть по нему позже
}

export interface IPost {
  type: string;
  shortCode: string;
  picUrls: string[];
}

export interface IDownloadedPosts {
  id: string;
  firstPicUrl: string;
}

export interface IStatusData {
  id: string; // профиль, который обрабатывается сейчас
  running: boolean; // идёт ли парсинг
  current: number; // собрано постов
  total: number; // всего постов в профиле (0 — пока неизвестно)
  scanned: number; // просмотрено постов, включая пропущенные
  round: number; // текущий раунд прокрутки
  lastShortCode: string | null;
  startedAt: number | null;
  finishedAt: number | null;
  elapsedMs: number; // сколько длится/продолжалась обработка
  error: string | null;
}
