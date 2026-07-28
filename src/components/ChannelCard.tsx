import React from 'react';
import { Star, Play, Radio } from 'lucide-react';
import { Channel } from '../types';

interface ChannelCardProps {
  channel: Channel;
  isActive: boolean;
  isFavorite: boolean;
  onSelect: (channel: Channel) => void;
  onToggleFavorite: (channelId: string, e: React.MouseEvent) => void;
  viewMode?: 'grid' | 'compact' | 'list';
}

export const ChannelCard: React.FC<ChannelCardProps> = ({
  channel,
  isActive,
  isFavorite,
  onSelect,
  onToggleFavorite,
  viewMode = 'grid',
}) => {
  if (viewMode === 'list') {
    return (
      <div
        onClick={() => onSelect(channel)}
        className={`group relative flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all border ${
          isActive
            ? 'bg-emerald-950/40 border-emerald-500/60 shadow-lg shadow-emerald-950/30'
            : 'bg-neutral-900/60 hover:bg-neutral-800/90 border-neutral-800/80 hover:border-neutral-700'
        }`}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative w-10 h-10 rounded-lg bg-black/60 border border-neutral-800 flex items-center justify-center overflow-hidden flex-shrink-0">
            {channel.logo ? (
              <img
                src={channel.logo}
                alt={channel.name}
                className="w-full h-full object-contain p-1"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            ) : (
              <Radio className="w-5 h-5 text-emerald-500/60" />
            )}
            {isActive && (
              <div className="absolute inset-0 bg-emerald-600/20 backdrop-blur-xs flex items-center justify-center">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              </div>
            )}
          </div>

          <div className="min-w-0">
            <h4
              className={`font-semibold text-sm truncate ${
                isActive ? 'text-emerald-400' : 'text-neutral-200 group-hover:text-white'
              }`}
            >
              {channel.name}
            </h4>
            <span className="text-xs text-neutral-400 font-medium">{channel.group || 'General'}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isActive && (
            <span className="text-xs bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold px-2 py-0.5 rounded-full">
              Playing
            </span>
          )}

          <button
            onClick={(e) => onToggleFavorite(channel.id, e)}
            className={`p-2 rounded-lg transition-colors ${
              isFavorite
                ? 'text-amber-400 hover:text-amber-300'
                : 'text-neutral-500 hover:text-neutral-300 opacity-0 group-hover:opacity-100'
            }`}
            title="Favorite"
          >
            <Star className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={() => onSelect(channel)}
      className={`group relative flex flex-col justify-between p-3.5 rounded-2xl cursor-pointer transition-all duration-200 border ${
        isActive
          ? 'bg-emerald-950/30 border-emerald-500/70 shadow-xl shadow-emerald-950/40 ring-1 ring-emerald-500/40'
          : 'bg-neutral-900/80 hover:bg-neutral-800/90 border-neutral-800/90 hover:border-neutral-700/80'
      }`}
    >
      {/* Top Header: Group & Favorite Star */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <span className="text-[11px] font-semibold tracking-wide text-emerald-400/90 bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-800/40 truncate max-w-[120px]">
          {channel.group || 'General'}
        </span>

        <button
          onClick={(e) => onToggleFavorite(channel.id, e)}
          className={`p-1.5 rounded-lg transition-colors ${
            isFavorite
              ? 'text-amber-400 bg-amber-950/40 border border-amber-800/40'
              : 'text-neutral-500 hover:text-neutral-300 bg-neutral-800/40 hover:bg-neutral-800'
          }`}
          title="Toggle Favorite"
        >
          <Star className={`w-3.5 h-3.5 ${isFavorite ? 'fill-current' : ''}`} />
        </button>
      </div>

      {/* Logo Container */}
      <div className="relative w-full aspect-video rounded-xl bg-black/80 border border-neutral-800/80 flex items-center justify-center p-3 mb-3 overflow-hidden group-hover:border-neutral-700 transition-colors">
        {channel.logo ? (
          <img
            src={channel.logo}
            alt={channel.name}
            className="max-h-full max-w-full object-contain filter drop-shadow-md group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        ) : (
          <div className="text-center">
            <Radio className="w-8 h-8 text-neutral-600 mx-auto mb-1" />
            <span className="text-xs text-neutral-500 font-mono font-bold">LIVE</span>
          </div>
        )}

        {/* Play Overlay / Active Indicator */}
        <div
          className={`absolute inset-0 flex items-center justify-center transition-opacity duration-200 ${
            isActive
              ? 'bg-emerald-950/40 backdrop-blur-xs opacity-100'
              : 'bg-black/40 opacity-0 group-hover:opacity-100'
          }`}
        >
          <div className="w-10 h-10 rounded-full bg-emerald-500 text-black flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform">
            <Play className="w-5 h-5 fill-current translate-x-0.5" />
          </div>
        </div>
      </div>

      {/* Channel Name */}
      <div className="flex items-center justify-between gap-2 min-w-0">
        <h3
          className={`font-semibold text-sm truncate ${
            isActive ? 'text-emerald-400' : 'text-neutral-200 group-hover:text-white'
          }`}
        >
          {channel.name}
        </h3>
        {isActive && (
          <span className="flex-shrink-0 w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        )}
      </div>
    </div>
  );
};
