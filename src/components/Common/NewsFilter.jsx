import { useEffect, useState } from 'react';
import { strings } from '../../i18n/strings';

const ALL_CATEGORIES = [
  'All',
  'Research',
  'Publications',
  'Conferences',
  'Teaching',
  'Awards',
  'Professional',
];

export default function NewsFilter({ containerId, categories = ALL_CATEGORIES }) {
  const [active, setActive] = useState('All');
  const [lang, setLang] = useState('en');

  useEffect(() => {
    setLang(localStorage.getItem('lang') ?? 'en');
    function onLanguageChange(e) {
      setLang(e.detail);
    }
    window.addEventListener('languagechange', onLanguageChange);
    return () => window.removeEventListener('languagechange', onLanguageChange);
  }, []);

  function applyFilter(category) {
    setActive(category);
    const container = document.getElementById(containerId);
    if (!container) return;
    container.querySelectorAll('[data-category]').forEach((el) => {
      const matches = category === 'All' || el.getAttribute('data-category') === category;
      el.classList.toggle('hidden', !matches);
    });
  }

  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="Filter news by category">
      {categories.map((category) => (
        <button
          key={category}
          type="button"
          onClick={() => applyFilter(category)}
          aria-pressed={active === category}
          className={`min-h-[44px] rounded-full px-4 py-2 text-sm font-medium transition duration-fast ${
            active === category
              ? 'bg-primary text-white'
              : 'border border-[var(--border)] text-[var(--text-secondary)] hover:bg-gray-100 dark:hover:bg-gray-800'
          }`}
        >
          {strings[lang]?.[`news.category.${category}`] ?? category}
        </button>
      ))}
    </div>
  );
}
