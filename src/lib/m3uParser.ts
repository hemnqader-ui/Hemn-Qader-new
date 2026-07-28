import { Channel } from '../types';

export function generateChannelDescription(name: string, group: string): string {
  const text = `${name} ${group}`.toLowerCase();

  if (text.match(/sport|sports|bein|kora|ssc|football|soccer|espn|eurosport|وەرزش|کورە/)) {
    return 'This channel broadcasts live sporting events, athletic competitions, and expert match analysis.';
  }

  if (text.match(/news|rudaw|kurdistan24|nrt|jazeera|bbc|cnn|sky|press|akhbar|هەواڵ|ڕووداو|کوردستان٢٤/)) {
    return 'Stay updated with round-the-clock global, regional, and local breaking news coverage.';
  }

  if (text.match(/kid|cartoon|spacetoon|disney|junior|nickelodeon|anime|manga|منداڵان|کارتۆن/)) {
    return 'Provides fun, educational, and family-friendly animated children\'s programming.';
  }

  if (text.match(/movie|cinema|film|action|drama|hbo|box office|mbc 2|mbc max|mbc action|فیلم|سینەما/)) {
    return 'Features blockbuster movies, popular drama series, and high-quality cinematic entertainment.';
  }

  if (text.match(/music|song|clip|mtv|rotana|melody|گۆرانی|موزیک/)) {
    return 'Broadcasts continuous music videos, live concerts, and musical cultural programming.';
  }

  if (text.match(/quran|islam|sunnah|makkah|iqraa|religious|ئایینی|قورئان/)) {
    return 'Provides religious lectures, Quranic recitations, and spiritual reflection broadcasts.';
  }

  if (text.match(/doc|documentary|nat geo|national geographic|discovery|nature|history|سروشت|بەڵگەفیلم/)) {
    return 'Features engaging documentaries on science, nature, history, and global exploration.';
  }

  if (text.match(/kurd|kurdsat|net tv|waar|gali|payam|speda|korek|nr1/)) {
    return 'Delivers a rich variety of Kurdish entertainment, cultural shows, and live community broadcasts.';
  }

  return 'This channel offers a variety of live television, entertainment programming, and general broadcasts.';
}

export function parseM3U(m3uContent: string): Channel[] {
  const lines = m3uContent.split(/\r?\n/);
  const channels: Channel[] = [];

  let currentMeta: Partial<Channel> = {};

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (!line) continue;

    if (line.startsWith('#EXTINF:')) {
      // Extract tvg-logo
      const logoMatch = line.match(/tvg-logo="([^"]*)"/i) || line.match(/logo="([^"]*)"/i);
      const logo = logoMatch ? logoMatch[1] : '';

      // Extract group-title
      const groupMatch = line.match(/group-title="([^"]*)"/i) || line.match(/group="([^"]*)"/i);
      let group = groupMatch ? groupMatch[1].trim() : 'General';
      if (!group) group = 'General';

      // Extract tvg-id
      const tvgIdMatch = line.match(/tvg-id="([^"]*)"/i);
      const tvgId = tvgIdMatch ? tvgIdMatch[1] : '';

      // Extract channel name (after the last comma)
      const commaIndex = line.lastIndexOf(',');
      let name = commaIndex !== -1 ? line.substring(commaIndex + 1).trim() : 'Unknown Channel';

      // Clean channel name if needed
      name = name.replace(/^#EXTINF:[-0-9\s]*/, '').trim() || name;

      currentMeta = {
        name,
        logo,
        group,
        tvgId,
        rawTitle: name,
      };
    } else if (line.startsWith('#EXTGRP:')) {
      // Group line fallback
      const grp = line.replace('#EXTGRP:', '').trim();
      if (grp) currentMeta.group = grp;
    } else if (!line.startsWith('#')) {
      // This is a stream URL line
      if (line.startsWith('http://') || line.startsWith('https://') || line.startsWith('rtmp://')) {
        const channelId = `ch_${channels.length + 1}_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 5)}`;
        const channelName = currentMeta.name || `Channel ${channels.length + 1}`;
        const channelGroup = currentMeta.group || 'General';

        channels.push({
          id: channelId,
          name: channelName,
          logo: currentMeta.logo || '',
          group: channelGroup,
          url: line,
          description: generateChannelDescription(channelName, channelGroup),
          tvgId: currentMeta.tvgId || '',
          rawTitle: currentMeta.rawTitle || channelName,
          isFavorite: false,
        });

        // Reset metadata
        currentMeta = {};
      }
    }
  }

  return channels;
}

export function extractCategories(channels: Channel[]): { name: string; count: number }[] {
  const map = new Map<string, number>();

  channels.forEach((ch) => {
    const group = ch.group || 'General';
    map.set(group, (map.get(group) || 0) + 1);
  });

  const categories = Array.from(map.entries()).map(([name, count]) => ({
    name,
    count,
  }));

  // Sort: Kurdish / Kurdi first if present, then by count descending
  categories.sort((a, b) => {
    const isAKurdis = a.name.toLowerCase().includes('kurd');
    const isBKurdis = b.name.toLowerCase().includes('kurd');

    if (isAKurdis && !isBKurdis) return -1;
    if (!isAKurdis && isBKurdis) return 1;

    return b.count - a.count;
  });

  return categories;
}
