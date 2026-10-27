export interface IShortCode {
  type: string;
  shortCode: string;
}

export interface IGalleryItem extends IShortCode {
  index: number; // позиция якоря в сетке, чтобы кликнуть по нему позже
  previewUrl?: string; // src превью-картинки (для reel берём прямо из сетки)
}

export interface IPost {
  type: string;
  shortCode: string;
  picUrls: string[];
}

export interface IStatusData {
  current: number;
  total: number;
  running: boolean;
}

export interface IPostsStatusData extends IStatusData {
  posts: IPost[];
}

export interface CookieObject {
  name: string;
  value: string;
  domain: string;
  path: string;
}