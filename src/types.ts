export interface Channel {
  id: string;
  name: string;
  logo: string;
  group: string;
  url: string;
  description?: string;
  tvgId?: string;
  rawTitle?: string;
  isFavorite?: boolean;
}

export interface PlaylistInfo {
  url: string;
  title: string;
  lastUpdated: string;
  channelCount: number;
}

export type ViewMode = 'grid' | 'compact' | 'list';
export type AspectRatio = '16:9' | '4:3' | 'cover' | 'fill';
export type AppLanguage = 'ku' | 'en' | 'ar';
