import React, { useEffect, useState, useMemo } from 'react';
import {
  Tv,
  Search,
  Globe,
  Radio,
  Star,
  RefreshCw,
  Info,
  Grid,
  List,
  LayoutGrid,
  Link as LinkIcon,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  SlidersHorizontal,
  Check,
  AlertCircle,
  Upload,
  FileText,
  Send,
  X
} from 'lucide-react';
import { Channel, AppLanguage, ViewMode } from './types';
import { parseM3U, extractCategories } from './lib/m3uParser';
import { VideoPlayer } from './components/VideoPlayer';
import { ChannelCard } from './components/ChannelCard';
import { CategoryFilter } from './components/CategoryFilter';
import { translations } from './lib/translations';

const DEFAULT_PLAYLIST = 'https://raw.githubusercontent.com/Kardo26/KardoServices/refs/heads/main/B.m3u';

export default function App() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [playlistUrl, setPlaylistUrl] = useState<string>(DEFAULT_PLAYLIST);
  const [loadedFileName, setLoadedFileName] = useState<string | null>(null);
  const [language, setLanguage] = useState<AppLanguage>('ku');
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('mand_tv_favorites');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [recentlyWatched, setRecentlyWatched] = useState<Channel[]>(() => {
    try {
      const saved = localStorage.getItem('mand_tv_recent');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [isCustomUrlOpen, setIsCustomUrlOpen] = useState<boolean>(false);
  const [tempUrlInput, setTempUrlInput] = useState<string>('');

  const t = translations[language];

  // Save favorites to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('mand_tv_favorites', JSON.stringify(favorites));
    } catch (e) {
      console.error(e);
    }
  }, [favorites]);

  // Save recent to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('mand_tv_recent', JSON.stringify(recentlyWatched.slice(0, 10)));
    } catch (e) {
      console.error(e);
    }
  }, [recentlyWatched]);

  // Load Playlist from proxy API
  const fetchPlaylist = async (urlToFetch: string) => {
    setIsLoading(true);
    setError(null);
    setLoadedFileName(null);
    try {
      const res = await fetch(`/api/playlist?url=${encodeURIComponent(urlToFetch)}`);
      if (!res.ok) {
        throw new Error(`Failed to load playlist (${res.status})`);
      }
      const m3uText = await res.text();
      const parsedChannels = parseM3U(m3uText);

      if (parsedChannels.length === 0) {
        throw new Error('No valid channels found in this playlist.');
      }

      setChannels(parsedChannels);
      
      // Auto-select first channel
      setSelectedChannel(parsedChannels[0]);
    } catch (err: any) {
      console.error('Error loading playlist:', err);
      setError(err.message || 'Failed to fetch channels playlist.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPlaylist(playlistUrl);
  }, [playlistUrl]);

  // Handler for uploading local M3U / M3U8 File
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setError(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        if (!text) throw new Error('File is empty.');

        const parsedChannels = parseM3U(text);
        if (parsedChannels.length === 0) {
          throw new Error('No valid channels found in uploaded file.');
        }

        setChannels(parsedChannels);
        setSelectedChannel(parsedChannels[0]);
        setLoadedFileName(file.name);
        setIsCustomUrlOpen(false);
      } catch (err: any) {
        console.error('Error parsing M3U file:', err);
        setError(err.message || 'Could not parse M3U file.');
      } finally {
        setIsLoading(false);
      }
    };
    reader.readAsText(file);
  };

  // Categories list
  const categories = useMemo(() => extractCategories(channels), [channels]);

  // Filtered Channels logic
  const filteredChannels = useMemo(() => {
    return channels.filter((channel) => {
      // Category filter
      if (selectedCategory === 'favorites') {
        if (!favorites.includes(channel.id)) return false;
      } else if (selectedCategory === 'recent') {
        if (!recentlyWatched.some((r) => r.id === channel.id)) return false;
      } else if (selectedCategory !== 'all') {
        if (channel.group !== selectedCategory) return false;
      }

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = channel.name.toLowerCase().includes(q);
        const matchGroup = channel.group.toLowerCase().includes(q);
        const matchDesc = channel.description?.toLowerCase().includes(q) ?? false;
        return matchName || matchGroup || matchDesc;
      }

      return true;
    });
  }, [channels, selectedCategory, searchQuery, favorites, recentlyWatched]);

  // Channel Selection Handler
  const handleSelectChannel = (channel: Channel) => {
    setSelectedChannel(channel);

    // Add to recently watched
    setRecentlyWatched((prev) => {
      const filtered = prev.filter((item) => item.id !== channel.id);
      return [channel, ...filtered];
    });
  };

  // Toggle Favorite
  const handleToggleFavorite = (channelId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setFavorites((prev) =>
      prev.includes(channelId) ? prev.filter((id) => id !== channelId) : [...prev, channelId]
    );
  };

  // Next / Previous Channel controls
  const handleNextChannel = () => {
    if (!selectedChannel || filteredChannels.length === 0) return;
    const currentIdx = filteredChannels.findIndex((ch) => ch.id === selectedChannel.id);
    const nextIdx = (currentIdx + 1) % filteredChannels.length;
    handleSelectChannel(filteredChannels[nextIdx]);
  };

  const handlePrevChannel = () => {
    if (!selectedChannel || filteredChannels.length === 0) return;
    const currentIdx = filteredChannels.findIndex((ch) => ch.id === selectedChannel.id);
    const prevIdx = (currentIdx - 1 + filteredChannels.length) % filteredChannels.length;
    handleSelectChannel(filteredChannels[prevIdx]);
  };

  const handleLoadCustomPlaylist = (e: React.FormEvent) => {
    e.preventDefault();
    if (tempUrlInput.trim()) {
      setPlaylistUrl(tempUrlInput.trim());
      setIsCustomUrlOpen(false);
    }
  };

  return (
    <div
      className={`min-h-screen bg-black text-white flex flex-col ${
        language === 'ku' || language === 'ar' ? 'rtl' : 'ltr'
      }`}
      dir={language === 'ku' || language === 'ar' ? 'rtl' : 'ltr'}
    >
      {/* Top Header / Nav */}
      <header className="sticky top-0 z-30 bg-neutral-950/90 backdrop-blur-xl border-b border-neutral-800/80 px-4 md:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          {/* Logo Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-tr from-amber-500 via-orange-500 to-emerald-500 rounded-xl flex items-center justify-center text-black font-extrabold text-xl shadow-lg shadow-orange-500/20">
              M
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-black tracking-tight flex items-center gap-2">
                Mand <span className="text-orange-500 font-extrabold">TV</span>
                <span className="text-[10px] bg-orange-500/20 text-orange-400 font-mono font-bold px-2 py-0.5 rounded-md border border-orange-500/30">
                  LIVE
                </span>
              </h1>
              <p className="text-xs text-neutral-400 hidden sm:block">{t.subTitle}</p>
            </div>
          </div>

          {/* Quick Playlist Info & Status */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {/* Telegram Contact Badge */}
            <a
              href="https://t.me/hemn84qader"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/30 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors"
              title="Contact on Telegram @hemn84qader"
            >
              <Send className="w-3.5 h-3.5" />
              <span>hemn84qader@</span>
            </a>

            {/* M3U Source Selector Button */}
            <button
              onClick={() => {
                setTempUrlInput(playlistUrl);
                setIsCustomUrlOpen(true);
              }}
              className="flex items-center gap-2 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 px-3 py-1.5 rounded-xl text-xs text-neutral-300 font-medium transition-colors"
            >
              {loadedFileName ? (
                <FileText className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <LinkIcon className="w-3.5 h-3.5 text-orange-400" />
              )}
              <span className="hidden md:inline truncate max-w-[180px]">
                {loadedFileName
                  ? loadedFileName
                  : playlistUrl === DEFAULT_PLAYLIST
                  ? t.defaultPlaylist
                  : playlistUrl}
              </span>
              <span className="md:hidden">M3U</span>
            </button>

            {/* Language Selector */}
            <div className="flex items-center bg-neutral-900 border border-neutral-800 rounded-xl p-1 text-xs">
              <button
                onClick={() => setLanguage('ku')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-colors ${
                  language === 'ku' ? 'bg-orange-500 text-black' : 'text-neutral-400 hover:text-white'
                }`}
              >
                کوردی
              </button>
              <button
                onClick={() => setLanguage('en')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-colors ${
                  language === 'en' ? 'bg-orange-500 text-black' : 'text-neutral-400 hover:text-white'
                }`}
              >
                EN
              </button>
              <button
                onClick={() => setLanguage('ar')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-colors ${
                  language === 'ar' ? 'bg-orange-500 text-black' : 'text-neutral-400 hover:text-white'
                }`}
              >
                عربي
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 lg:p-8 flex flex-col gap-6">
        {/* Welcome Hero Banner */}
        <div className="relative overflow-hidden bg-gradient-to-r from-neutral-900 via-zinc-900 to-neutral-950 border border-neutral-800/90 rounded-3xl p-5 md:p-6 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="absolute top-0 right-0 w-96 h-96 bg-orange-500/5 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-orange-400" />
              <span className="text-xs font-bold text-orange-400 uppercase tracking-widest bg-orange-500/10 px-2.5 py-1 rounded-md border border-orange-500/20">
                مەند تیڤی • Live Streaming
              </span>
            </div>
            <h2 className="text-xl md:text-3xl font-extrabold text-white tracking-tight">
              {t.welcomeTitle}
            </h2>
            <p className="text-xs md:text-sm text-neutral-300 max-w-2xl leading-relaxed">
              {t.welcomeSubtitle}
            </p>
          </div>

          {/* Quick Hero Actions */}
          <div className="relative z-10 flex flex-wrap items-center gap-3">
            <button
              onClick={() => setIsCustomUrlOpen(true)}
              className="flex items-center gap-2 bg-orange-500 hover:bg-orange-400 text-black font-extrabold text-xs px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-orange-500/20"
            >
              <Upload className="w-4 h-4" />
              <span>{t.loadCustomPlaylist}</span>
            </button>

            <a
              href="https://t.me/hemn84qader"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 bg-neutral-800 hover:bg-neutral-700 text-sky-400 border border-sky-500/30 text-xs font-bold px-4 py-2.5 rounded-xl transition-all"
            >
              <Send className="w-4 h-4" />
              <span>تێلگرام: hemn84qader@</span>
            </a>
          </div>
        </div>

        {/* Main Video Screen Component */}
        <div className="w-full flex flex-col gap-4">
          <VideoPlayer
            channel={selectedChannel}
            language={language}
            onNextChannel={handleNextChannel}
            onPrevChannel={handlePrevChannel}
            onToggleFavorite={handleToggleFavorite}
            isFavorite={selectedChannel ? favorites.includes(selectedChannel.id) : false}
          />
        </div>

        {/* Channel Search, Filter & Layout Control Bar */}
        <div className="bg-neutral-900/80 border border-neutral-800 rounded-2xl p-4 flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[240px]">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t.searchPlaceholder}
                className="w-full bg-black/80 border border-neutral-800 focus:border-orange-500/80 rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder-neutral-500 focus:outline-none transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-neutral-400 hover:text-white"
                >
                  ✕
                </button>
              )}
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center bg-black/80 border border-neutral-800 rounded-xl p-1 gap-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-colors ${
                  viewMode === 'grid' ? 'bg-orange-500 text-black' : 'text-neutral-400 hover:text-white'
                }`}
                title="Grid View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg transition-colors ${
                  viewMode === 'list' ? 'bg-orange-500 text-black' : 'text-neutral-400 hover:text-white'
                }`}
                title="List View"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Category Horizontal Filter Pills */}
          <CategoryFilter
            categories={categories}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            favoritesCount={favorites.length}
            recentCount={recentlyWatched.length}
            totalChannels={channels.length}
            language={language}
          />
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="w-full py-20 flex flex-col items-center justify-center gap-4">
            <div className="w-12 h-12 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin"></div>
            <p className="text-neutral-400 text-sm font-medium animate-pulse">
              Loading Mand TV channels...
            </p>
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <div className="w-full bg-neutral-900 border border-red-900/50 rounded-2xl p-8 text-center flex flex-col items-center justify-center gap-3">
            <AlertCircle className="w-12 h-12 text-red-500" />
            <h3 className="text-lg font-bold text-white">Failed to load channels</h3>
            <p className="text-sm text-neutral-400 max-w-md">{error}</p>
            <button
              onClick={() => fetchPlaylist(playlistUrl)}
              className="mt-2 flex items-center gap-2 bg-orange-500 hover:bg-orange-400 text-black font-bold px-5 py-2.5 rounded-xl transition-all"
            >
              <RefreshCw className="w-4 h-4" />
              Try Again
            </button>
          </div>
        )}

        {/* Channels Grid / List Display */}
        {!isLoading && !error && (
          <>
            {filteredChannels.length === 0 ? (
              <div className="w-full py-16 text-center bg-neutral-900/50 border border-neutral-800 rounded-2xl p-6">
                <Radio className="w-12 h-12 text-neutral-600 mx-auto mb-3" />
                <h3 className="text-base font-semibold text-neutral-300">{t.noChannelsFound}</h3>
                <p className="text-xs text-neutral-500 mt-1">Try clearing your search query or switching categories.</p>
              </div>
            ) : (
              <div
                className={
                  viewMode === 'grid'
                    ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4'
                    : 'flex flex-col gap-2'
                }
              >
                {filteredChannels.map((channel) => (
                  <ChannelCard
                    key={channel.id}
                    channel={channel}
                    isActive={selectedChannel?.id === channel.id}
                    isFavorite={favorites.includes(channel.id)}
                    onSelect={handleSelectChannel}
                    onToggleFavorite={handleToggleFavorite}
                    viewMode={viewMode}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </main>

      {/* Playlist Custom Modal (Supports both M3U URL and M3U File Upload) */}
      {isCustomUrlOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl flex flex-col gap-5">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <LinkIcon className="w-5 h-5 text-orange-400" />
                {t.loadCustomPlaylist}
              </h3>
              <button
                onClick={() => setIsCustomUrlOpen(false)}
                className="text-neutral-400 hover:text-white p-1 rounded-lg bg-neutral-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Option 1: Upload M3U / M3U8 File */}
            <div className="bg-black/60 border border-neutral-800 rounded-xl p-4 flex flex-col items-center justify-center text-center gap-3">
              <Upload className="w-8 h-8 text-orange-400" />
              <div>
                <h4 className="text-sm font-bold text-white mb-1">{t.uploadM3UFile}</h4>
                <p className="text-xs text-neutral-400">{t.dragDropOrClick}</p>
              </div>
              <label className="cursor-pointer bg-orange-500 hover:bg-orange-400 text-black font-bold text-xs px-4 py-2 rounded-xl transition-colors shadow-md">
                <span>Select M3U File</span>
                <input
                  type="file"
                  accept=".m3u,.m3u8,.txt"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            <div className="flex items-center gap-3 my-1">
              <div className="flex-1 h-px bg-neutral-800" />
              <span className="text-xs font-bold text-neutral-500 uppercase">OR</span>
              <div className="flex-1 h-px bg-neutral-800" />
            </div>

            {/* Option 2: Enter M3U URL */}
            <form onSubmit={handleLoadCustomPlaylist} className="flex flex-col gap-4">
              <div>
                <label className="text-xs font-semibold text-neutral-300 mb-1 block">
                  {t.playlistUrl}
                </label>
                <input
                  type="url"
                  value={tempUrlInput}
                  onChange={(e) => setTempUrlInput(e.target.value)}
                  placeholder="https://example.com/playlist.m3u"
                  required
                  className="w-full bg-black border border-neutral-800 focus:border-orange-500 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none font-mono text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCustomUrlOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-neutral-800 hover:bg-neutral-700 text-neutral-300"
                >
                  {t.cancel}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTempUrlInput(DEFAULT_PLAYLIST);
                  }}
                  className="px-3 py-2 rounded-xl text-xs font-semibold bg-neutral-800 hover:bg-neutral-700 text-orange-400"
                >
                  Reset Default
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-orange-500 hover:bg-orange-400 text-black shadow-lg"
                >
                  {t.loadButton}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-neutral-900 bg-black py-6 px-4 text-center text-xs text-neutral-500 font-mono flex flex-col md:flex-row items-center justify-between gap-3 max-w-7xl w-full mx-auto">
        <p>© 2026 Mand TV - Live IPTV Platform</p>
        <div className="flex items-center gap-4">
          <a
            href="https://t.me/hemn84qader"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sky-400 hover:underline flex items-center gap-1"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Telegram: @hemn84qader</span>
          </a>
        </div>
      </footer>
    </div>
  );
}
