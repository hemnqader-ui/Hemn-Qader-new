import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { Play, Pause, Volume2, VolumeX, Maximize, RefreshCw, Radio, PictureInPicture2, ChevronLeft, ChevronRight, Share2, Check, AlertCircle, Sliders as AspectIcon } from 'lucide-react';
import { Channel, AspectRatio, AppLanguage } from '../types';
import { translations } from '../lib/translations';

interface VideoPlayerProps {
  channel: Channel | null;
  language: AppLanguage;
  onNextChannel?: () => void;
  onPrevChannel?: () => void;
  onToggleFavorite?: (channelId: string) => void;
  isFavorite?: boolean;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  channel,
  language,
  onNextChannel,
  onPrevChannel,
  onToggleFavorite,
  isFavorite = false,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);

  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(1);
  const [hasError, setHasError] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('16:9');
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  const t = translations[language];

  // Initialize or re-attach HLS stream when channel changes
  useEffect(() => {
    if (!channel || !videoRef.current) return;

    setIsLoading(true);
    setHasError(false);
    setErrorMessage('');

    const video = videoRef.current;
    const streamUrl = channel.url;

    // Destroy existing Hls instance if any
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    // Check if Hls is supported
    if (Hls.isSupported() && (streamUrl.includes('.m3u8') || !video.canPlayType('application/vnd.apple.mpegurl'))) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 90,
      });

      hlsRef.current = hls;

      hls.loadSource(streamUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setIsLoading(false);
        video
          .play()
          .then(() => setIsPlaying(true))
          .catch((err) => {
            console.warn('Autoplay prevented:', err);
            setIsPlaying(false);
          });
      });

      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              console.error('Fatal network error encountered, trying to recover:', data);
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              console.error('Fatal media error encountered, recovering:', data);
              hls.recoverMediaError();
              break;
            default:
              console.error('Unrecoverable HLS error:', data);
              setHasError(true);
              setIsLoading(false);
              setErrorMessage(t.errorPlaying);
              hls.destroy();
              break;
          }
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl') || streamUrl.endsWith('.mp4')) {
      // Native Safari HLS support
      video.src = streamUrl;
      video.addEventListener('loadedmetadata', () => {
        setIsLoading(false);
        video
          .play()
          .then(() => setIsPlaying(true))
          .catch(() => setIsPlaying(false));
      });
      video.addEventListener('error', () => {
        setHasError(true);
        setIsLoading(false);
        setErrorMessage(t.errorPlaying);
      });
    } else {
      // Direct stream fallback
      video.src = streamUrl;
      video
        .play()
        .then(() => {
          setIsLoading(false);
          setIsPlaying(true);
        })
        .catch(() => {
          setIsLoading(false);
        });
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [channel?.id, channel?.url]);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch((err) => console.error('Play failed:', err));
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (videoRef.current) {
      videoRef.current.volume = val;
      videoRef.current.muted = val === 0;
      setIsMuted(val === 0);
    }
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch((err) => console.error(err));
    } else {
      document.exitFullscreen().catch((err) => console.error(err));
    }
  };

  const togglePiP = async () => {
    if (!videoRef.current) return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else if (document.pictureInPictureEnabled) {
        await videoRef.current.requestPictureInPicture();
      }
    } catch (err) {
      console.error('PiP error:', err);
    }
  };

  const handleReload = () => {
    if (!channel) return;
    setIsLoading(true);
    setHasError(false);
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }
    // Force re-trigger useEffect by setting video src
    if (videoRef.current) {
      videoRef.current.src = channel.url;
      videoRef.current.load();
    }
  };

  const cycleAspectRatio = () => {
    const ratios: AspectRatio[] = ['16:9', 'cover', 'fill', '4:3'];
    const nextIdx = (ratios.indexOf(aspectRatio) + 1) % ratios.length;
    setAspectRatio(ratios[nextIdx]);
  };

  const handleCopyLink = () => {
    if (!channel) return;
    navigator.clipboard.writeText(channel.url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const getAspectClass = () => {
    switch (aspectRatio) {
      case 'cover':
        return 'object-cover';
      case 'fill':
        return 'object-fill';
      case '4:3':
        return 'aspect-[4/3] object-contain';
      case '16:9':
      default:
        return 'object-contain';
    }
  };

  if (!channel) {
    return (
      <div className="w-full aspect-video bg-neutral-900 rounded-2xl flex flex-col items-center justify-center p-6 text-center border border-neutral-800 shadow-2xl">
        <Radio className="w-16 h-16 text-emerald-500/40 mb-4 animate-pulse" />
        <h3 className="text-xl font-semibold text-neutral-200">{t.appTitle}</h3>
        <p className="text-sm text-neutral-400 mt-2 max-w-md">{t.noChannelsFound}</p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="group relative w-full bg-black rounded-2xl overflow-hidden shadow-2xl border border-neutral-800 flex flex-col"
    >
      {/* Top Overlay Banner */}
      <div className="absolute top-0 left-0 right-0 z-20 p-4 bg-gradient-to-b from-black/80 via-black/40 to-transparent flex items-center justify-between opacity-100 group-hover:opacity-100 transition-opacity duration-300">
        <div className="flex items-center gap-3 min-w-0">
          {channel.logo ? (
            <img
              src={channel.logo}
              alt={channel.name}
              className="w-10 h-10 rounded-lg object-contain bg-neutral-900/80 p-1 border border-neutral-700/50 flex-shrink-0"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          ) : (
            <div className="w-10 h-10 rounded-lg bg-emerald-950/80 text-emerald-400 flex items-center justify-center font-bold text-lg border border-emerald-800/40 flex-shrink-0">
              {channel.name.charAt(0)}
            </div>
          )}
          <div className="min-w-0">
            <h2 className="text-white font-bold text-base md:text-lg truncate tracking-wide flex items-center gap-2">
              {channel.name}
            </h2>
            <span className="text-xs text-emerald-400/90 font-medium bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-800/30">
              {channel.group || 'Live Stream'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Live Pill */}
          <div className="flex items-center gap-1.5 bg-red-600/90 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider animate-pulse shadow-lg">
            <span className="w-2 h-2 rounded-full bg-white"></span>
            {t.live}
          </div>

          {/* Favorite Button */}
          {onToggleFavorite && (
            <button
              onClick={() => onToggleFavorite(channel.id)}
              className={`p-2 rounded-lg backdrop-blur-md transition-colors ${
                isFavorite
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                  : 'bg-neutral-800/60 text-neutral-300 hover:text-white border border-neutral-700/40'
              }`}
              title="Favorite"
            >
              ★
            </button>
          )}
        </div>
      </div>

      {/* Main Video Screen */}
      <div className="relative w-full aspect-video bg-black flex items-center justify-center overflow-hidden">
        <video
          ref={videoRef}
          className={`w-full h-full ${getAspectClass()} transition-all duration-200`}
          playsInline
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
        />

        {/* Loading Spinner */}
        {isLoading && !hasError && (
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex flex-col items-center justify-center gap-3 z-10">
            <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
            <p className="text-emerald-400 text-sm font-medium animate-pulse">{t.nowPlaying}...</p>
          </div>
        )}

        {/* Stream Error Overlay */}
        {hasError && (
          <div className="absolute inset-0 bg-neutral-950/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center z-10">
            <AlertCircle className="w-12 h-12 text-red-500 mb-3" />
            <h3 className="text-white font-bold text-lg mb-1">{t.errorPlaying}</h3>
            <p className="text-neutral-400 text-xs mb-4 max-w-sm break-all">{channel.url}</p>
            <div className="flex items-center gap-3">
              <button
                onClick={handleReload}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium px-4 py-2 rounded-xl text-sm transition-all shadow-lg"
              >
                <RefreshCw className="w-4 h-4" />
                {t.tryReload}
              </button>
              {onNextChannel && (
                <button
                  onClick={onNextChannel}
                  className="flex items-center gap-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-medium px-4 py-2 rounded-xl text-sm transition-all border border-neutral-700"
                >
                  <ChevronRight className="w-4 h-4" />
                  Next Channel
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Player Control Bar */}
      <div className="p-3 bg-neutral-900/90 backdrop-blur-md border-t border-neutral-800/80 flex flex-wrap items-center justify-between gap-3 text-neutral-300">
        <div className="flex items-center gap-2">
          {/* Play / Pause */}
          <button
            onClick={togglePlay}
            className="p-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition-all shadow-md active:scale-95"
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 fill-current" />}
          </button>

          {/* Prev / Next Channel */}
          {onPrevChannel && (
            <button
              onClick={onPrevChannel}
              className="p-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-xl transition-colors border border-neutral-700/60"
              title="Previous Channel"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}
          {onNextChannel && (
            <button
              onClick={onNextChannel}
              className="p-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-xl transition-colors border border-neutral-700/60"
              title="Next Channel"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          )}

          {/* Volume Control */}
          <div className="flex items-center gap-2 bg-neutral-800/80 px-3 py-1.5 rounded-xl border border-neutral-700/50">
            <button onClick={toggleMute} className="hover:text-white transition-colors">
              {isMuted || volume === 0 ? (
                <VolumeX className="w-4 h-4 text-red-400" />
              ) : (
                <Volume2 className="w-4 h-4 text-emerald-400" />
              )}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              className="w-16 md:w-24 h-1.5 accent-emerald-500 bg-neutral-700 rounded-lg appearance-none cursor-pointer"
            />
          </div>
        </div>

        {/* Right Tools */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Reload Stream */}
          <button
            onClick={handleReload}
            className="p-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white rounded-xl transition-colors border border-neutral-700/50"
            title={t.reloadStream}
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {/* Aspect Ratio */}
          <button
            onClick={cycleAspectRatio}
            className="p-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white rounded-xl transition-colors border border-neutral-700/50 flex items-center gap-1 text-xs font-mono"
            title={`${t.aspectRatio}: ${aspectRatio}`}
          >
            <AspectIcon className="w-4 h-4 text-emerald-400" />
            <span className="hidden sm:inline uppercase">{aspectRatio}</span>
          </button>

          {/* Copy Link */}
          <button
            onClick={handleCopyLink}
            className="p-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white rounded-xl transition-colors border border-neutral-700/50"
            title={t.copyStreamUrl}
          >
            {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
          </button>

          {/* Picture in Picture */}
          <button
            onClick={togglePiP}
            className="p-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white rounded-xl transition-colors border border-neutral-700/50 hidden md:flex"
            title="Picture-in-Picture"
          >
            <PictureInPicture2 className="w-4 h-4" />
          </button>

          {/* Fullscreen */}
          <button
            onClick={toggleFullscreen}
            className="p-2 bg-emerald-600/90 hover:bg-emerald-500 text-white rounded-xl transition-all shadow-md"
            title="Fullscreen"
          >
            <Maximize className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
