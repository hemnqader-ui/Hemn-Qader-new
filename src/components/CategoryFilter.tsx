import React from 'react';
import { Star, Clock, Grid, Tv } from 'lucide-react';
import { AppLanguage } from '../types';
import { translations } from '../lib/translations';

interface CategoryFilterProps {
  categories: { name: string; count: number }[];
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  favoritesCount: number;
  recentCount: number;
  totalChannels: number;
  language: AppLanguage;
}

export const CategoryFilter: React.FC<CategoryFilterProps> = ({
  categories,
  selectedCategory,
  onSelectCategory,
  favoritesCount,
  recentCount,
  totalChannels,
  language,
}) => {
  const t = translations[language];

  return (
    <div className="w-full flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none py-1 border-b border-neutral-800/80">
      {/* All Channels Pill */}
      <button
        onClick={() => onSelectCategory('all')}
        className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
          selectedCategory === 'all'
            ? 'bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-900/30'
            : 'bg-neutral-900 text-neutral-400 hover:text-neutral-200 border-neutral-800 hover:border-neutral-700'
        }`}
      >
        <Grid className="w-3.5 h-3.5" />
        {t.allCategories}
        <span
          className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
            selectedCategory === 'all' ? 'bg-emerald-950 text-emerald-200' : 'bg-neutral-800 text-neutral-400'
          }`}
        >
          {totalChannels}
        </span>
      </button>

      {/* Favorites Pill */}
      <button
        onClick={() => onSelectCategory('favorites')}
        className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
          selectedCategory === 'favorites'
            ? 'bg-amber-500 text-black border-amber-400 shadow-md shadow-amber-950/30'
            : 'bg-neutral-900 text-neutral-400 hover:text-neutral-200 border-neutral-800 hover:border-neutral-700'
        }`}
      >
        <Star className={`w-3.5 h-3.5 ${selectedCategory === 'favorites' ? 'fill-current' : ''}`} />
        {t.favorites}
        <span
          className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
            selectedCategory === 'favorites' ? 'bg-amber-950 text-amber-200' : 'bg-neutral-800 text-neutral-400'
          }`}
        >
          {favoritesCount}
        </span>
      </button>

      {/* Recently Watched Pill */}
      {recentCount > 0 && (
        <button
          onClick={() => onSelectCategory('recent')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
            selectedCategory === 'recent'
              ? 'bg-blue-600 text-white border-blue-500 shadow-md'
              : 'bg-neutral-900 text-neutral-400 hover:text-neutral-200 border-neutral-800 hover:border-neutral-700'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          {t.recentlyWatched}
          <span
            className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
              selectedCategory === 'recent' ? 'bg-blue-950 text-blue-200' : 'bg-neutral-800 text-neutral-400'
            }`}
          >
            {recentCount}
          </span>
        </button>
      )}

      <div className="h-4 w-px bg-neutral-800 mx-1" />

      {/* Group Categories */}
      {categories.map((cat) => {
        const isSelected = selectedCategory === cat.name;
        const isKurdish = cat.name.toLowerCase().includes('kurd');

        return (
          <button
            key={cat.name}
            onClick={() => onSelectCategory(cat.name)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
              isSelected
                ? 'bg-emerald-600/90 text-white border-emerald-500 shadow-md'
                : isKurdish
                ? 'bg-emerald-950/40 text-emerald-300 hover:bg-emerald-900/60 border-emerald-800/50'
                : 'bg-neutral-900/90 text-neutral-400 hover:text-neutral-200 border-neutral-800 hover:border-neutral-700'
            }`}
          >
            <Tv className="w-3.5 h-3.5" />
            {cat.name}
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                isSelected
                  ? 'bg-emerald-950 text-emerald-200'
                  : 'bg-neutral-800/80 text-neutral-400'
              }`}
            >
              {cat.count}
            </span>
          </button>
        );
      })}
    </div>
  );
};
