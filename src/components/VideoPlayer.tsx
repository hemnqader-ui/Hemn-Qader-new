import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  RefreshCw,
  Radio,
  PictureInPicture2,
  ChevronLeft,
  ChevronRight,
  Share2,
  Check,
  AlertCircle,
  Sliders as AspectIcon,
} from 'lucide-react';

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
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [volume, setVolume] = useState(1);
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('16:9');
  const [copiedLink, setCopiedLink] = useState(false);

  const t = translations[language];

  const clearPlayer = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    if (hlsRef.current) {
      try {
        hlsRef.current.destroy();
      } catch (e) {
        console.warn('HLS destroy error:', e);
      }
      hlsRef.current = null;
    }

    if (videoRef.current) {
      const video = videoRef.current;

      try {
        video.pause();
      } catch {}

      video.removeAttribute('src');

      try {
        video.load();
      } catch {}
    }
  };

  const showError = (message?: string) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    setIsLoading(false);
    setHasError(true);
    setIsPlaying(false);
    setErrorMessage(message || t.errorPlaying);
  };

  const startPlayback = async () => {
    const video = videoRef.current;
    if (!video) return;

    try {
      /*
       * Android WebView / AppCreator24:
       * autoplay with sound is commonly blocked.
       * Start muted, then user can enable sound.
       */
      video.muted = true;
      setIsMuted(true);

      await video.play();

      setIsPlaying(true);
      setIsLoading(false);
      setHasError(false);

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    } catch (error) {
      console.warn('Autoplay blocked:', error);

      /*
       * Stream may still be ready.
       * Don't show an error just because autoplay was blocked.
       */
      setIsLoading(false);
      setIsPlaying(false);
    }
  };

  useEffect(() => {
    if (!channel || !videoRef.current) {
      return;
    }

    const video = videoRef.current;
    const streamUrl = channel.url?.trim();

    if (!streamUrl) {
      showError('Stream URL is empty.');
      return;
    }

    setIsLoading(true);
    setHasError(false);
    setIsPlaying(false);
    setErrorMessage('');

    clearPlayer();

    /*
     * Always allow inline playback.
     * Important for Android WebView.
     */
    video.setAttribute('playsinline', '');
    video.setAttribute('webkit-playsinline', 'true');

    video.playsInline = true;
    video.controls = false;
    video.preload = 'auto';
    video.muted = true;

    /*
     * Don't leave the user on an endless spinner.
     */
    timeoutRef.current = setTimeout(() => {
      if (!video.readyState || video.readyState < 2) {
        showError('Stream took too long to load.');
      }
    }, 15000);

    /*
     * Native HLS
     * Mainly useful on Safari/iOS.
     */
    const nativeHls =
      video.canPlayType('application/vnd.apple.mpegurl') !== '';

    /*
     * Android Chrome/WebView normally uses hls.js.
     */
    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: false,

        /*
         * More tolerant settings for IPTV streams.
         */
        backBufferLength: 30,
        maxBufferLength: 30,
        maxMaxBufferLength: 60,

        manifestLoadingTimeOut: 10000,
        manifestLoadingMaxRetry: 2,
        manifestLoadingRetryDelay: 1000,

        levelLoadingTimeOut: 10000,
        levelLoadingMaxRetry: 2,
        levelLoadingRetryDelay: 1000,

        fragLoadingTimeOut: 10000,
        fragLoadingMaxRetry: 2,
        fragLoadingRetryDelay: 1000,
      });

      hlsRef.current = hls;

      hls.attachMedia(video);

      hls.on(Hls.Events.MEDIA_ATTACHED, () => {
        console.log('HLS media attached');

        hls.loadSource(streamUrl);
      });

      hls.on(Hls.Events.MANIFEST_LOADING, () => {
        setIsLoading(true);
      });

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        console.log('HLS manifest parsed');

        /*
         * Give the WebView a moment to prepare the first segment.
         */
        setTimeout(() => {
          startPlayback();
        }, 300);
      });

      hls.on(Hls.Events.FRAG_BUFFERED, () => {
        setIsLoading(false);
        setHasError(false);

        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
      });

      hls.on(Hls.Events.ERROR, (_event, data) => {
        console.warn('HLS error:', data);

        if (!data.fatal) {
          return;
        }

        switch (data.type) {
          case Hls.ErrorTypes.NETWORK_ERROR:
            console.warn('HLS network error');

            /*
             * One recovery attempt.
             */
            try {
              hls.startLoad();
            } catch {
              showError('Network error while loading stream.');
            }

            break;

          case Hls.ErrorTypes.MEDIA_ERROR:
            console.warn('HLS media error');

            try {
              hls.recoverMediaError();
            } catch {
              showError('Media error while playing stream.');
            }

            break;

          default:
            console.error('Fatal HLS error:', data);
            showError('This stream cannot be played.');
            break;
        }
      });

      return () => {
        clearPlayer();
      };
    }

    /*
     * Native HLS fallback.
     */
    if (nativeHls) {
      video.src = streamUrl;

      const handleLoadedMetadata = () => {
        setIsLoading(false);
        startPlayback();
      };

      const handleCanPlay = () => {
        setIsLoading(false);

        if (!video.paused) {
          setIsPlaying(true);
        }
      };

      const handleError = () => {
        showError('Unable to play this stream.');
      };

      video.addEventListener('loadedmetadata', handleLoadedMetadata);
      video.addEventListener('canplay', handleCanPlay);
      video.addEventListener('error', handleError);

      video.load();

      return () => {
        video.removeEventListener(
          'loadedmetadata',
          handleLoadedMetadata
        );

        video.removeEventListener('canplay', handleCanPlay);
        video.removeEventListener('error', handleError);

        clearPlayer();
      };
    }

    /*
     * Direct MP4 / normal video fallback.
     */
    video.src = streamUrl;

    const handleLoadedMetadata = () => {
      setIsLoading(false);
      startPlayback();
    };

    const handleCanPlay = () => {
      setIsLoading(false);
    };

    const handleError = () => {
      showError('This video format is not supported.');
    };

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('error', handleError);

    video.load();

    return () => {
      video.removeEventListener(
        'loadedmetadata',
        handleLoadedMetadata
      );

      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('error', handleError);

      clearPlayer();
    };
  }, [channel?.id, channel?.url]);

  const togglePlay = async () => {
    const video = videoRef.current;
    if (!video) return;

    try {
      if (video.paused) {
        await video.play();
        setIsPlaying(true);
        setHasError(false);
      } else {
        video.pause();
        setIsPlaying(false);
      }
    } catch (error) {
      console.warn('Play failed:', error);
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;

    const newMuted = !video.muted;

    video.muted = newMuted;
    setIsMuted(newMuted);

    if (!newMuted && video.paused) {
      video
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => {});
    }
  };

  const handleVolumeChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const val = Number(e.target.value);

    setVolume(val);

    const video = videoRef.current;

    if (!video) return;

    video.volume = val;

    if (val === 0) {
      video.muted = true;
      setIsMuted(true);
    } else {
      video.muted = false;
      setIsMuted(false);
    }
  };

  const toggleFullscreen = async () => {
    const container = containerRef.current;

    if (!container) return;

    try {
      if (!document.fullscreenElement) {
        if (container.requestFullscreen) {
          await container.requestFullscreen();
        }
      } else {
        await document.exitFullscreen();
      }
    } catch (error) {
      console.warn('Fullscreen error:', error);
    }
  };

  const togglePiP = async () => {
    const video = videoRef.current;

    if (!video) return;

    try {
      if (
        document.pictureInPictureElement &&
        document.exitPictureInPicture
      ) {
        await document.exitPictureInPicture();
        return;
      }

      if (
        document.pictureInPictureEnabled &&
        video.requestPictureInPicture
      ) {
        await video.requestPictureInPicture();
      }
    } catch (error) {
      console.warn('PiP error:', error);
    }
  };

  const handleReload = () => {
    if (!channel) return;

    /*
     * Re-running the same initialization code is important.
     * Do not simply set video.src here because that bypasses h
