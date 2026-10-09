export interface IShortCode {
  type: string;
  shortCode: string;
}

export interface IPost {
  type: string;
  shortCode: string;
  picUrls: string[];
}

export interface CookieObject {
  name: string;
  value: string;
  domain: string;
  path: string;
}