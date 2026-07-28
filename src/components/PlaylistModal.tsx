import React, { useState } from 'react';
import { X, RefreshCw, Upload, Link as LinkIcon, Check, Tv2 } from 'lucide-react';
import { AppLanguage } from '../types';
import { translations } from '../lib/translations';

interface PlaylistModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUrl: string;
  onLoadUrl: (url: string) => void;
  onFileUpload: (content: string) => void;
  onResetDefault: () => void;
  language: AppLanguage;
  isLoading: boolean;
}

export const PlaylistModal: React.FC<PlaylistModalProps> = ({
  isOpen,
  onClose,
  currentUrl,
  onLoadUrl,
  onFileUpload,
  onResetDefault,
  language,
  isLoading,
}) => {
  const [urlInput, setUrlInput] = useState<string>(currentUrl);
  const t = translations[language];

  if (!isOpen) return null;

  const handleSubmitUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (urlInput.trim()) {
      onLoadUrl(urlInput.trim());
      onClose();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        onFileUpload(content);
        onClose();
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl relative text-neutral-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-neutral-400 hover:text-white rounded-xl hover:bg-neutral-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
            <Tv2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">{t.changePlaylist}</h3>
            <p className="text-xs text-neutral-400">{t.loadCustomPlaylist}</p>
          </div>
        </div>

        {/* Form: URL Input */}
        <form onSubmit={handleSubmitUrl} className="space-y-4 mb-6">
          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-2">
              {t.playlistUrl}
            </label>
            <div className="relative">
              <LinkIcon className="w-4 h-4 text-neutral-500 absolute left-3 top-3.5" />
              <input
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://example.com/channels.m3u"
                className="w-full bg-black/60 border border-neutral-700/80 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                required
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-2.5 px-4 rounded-xl text-sm transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <Check className="w-4 h-4" />
              )}
              {t.loadButton}
            </button>

            <button
              type="button"
              onClick={() => {
                onResetDefault();
                onClose();
              }}
              className="bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-semibold py-2.5 px-4 rounded-xl text-sm transition-all border border-neutral-700 flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4 text-emerald-400" />
              {t.defaultPlaylist}
            </button>
          </div>
        </form>

        <div className="relative my-6 text-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-neutral-800"></div>
          </div>
          <span className="relative bg-neutral-900 px-3 text-xs text-neutral-500 font-medium">OR</span>
        </div>

        {/* File Upload Section */}
        <div>
          <label className="block text-xs font-semibold text-neutral-300 mb-2">
            Upload Local M3U File
          </label>
          <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-neutral-700 hover:border-emerald-500/80 rounded-2xl cursor-pointer bg-black/40 hover:bg-emerald-950/20 transition-all group">
            <Upload className="w-6 h-6 text-neutral-400 group-hover:text-emerald-400 mb-1" />
            <span className="text-xs text-neutral-300 font-medium">Click to upload .m3u or .m3u8</span>
            <input type="file" accept=".m3u,.m3u8,.txt" onChange={handleFileChange} className="hidden" />
          </label>
        </div>
      </div>
    </div>
  );
};
