import { useEffect, useState } from 'react';

export default function LanguageSwitcher() {
  const [lang, setLang] = useState(null);

  useEffect(() => {
    setLang(localStorage.getItem('lang') ?? 'en');
  }, []);

  function selectLang(next) {
    localStorage.setItem('lang', next);
    setLang(next);
    document.documentElement.lang = next;
    window.dispatchEvent(new CustomEvent('languagechange', { detail: next }));
  }

  if (!lang) {
    return <div className="h-11 w-16" aria-hidden="true" />;
  }

  return (
    <div className="flex items-center rounded-md border border-[var(--border)] text-sm" role="group" aria-label="Language selector">
      <button
        type="button"
        onClick={() => selectLang('en')}
        aria-pressed={lang === 'en'}
        className={`min-h-[44px] rounded-l-md px-3 font-medium transition duration-fast ${
          lang === 'en' ? 'bg-primary text-white' : 'text-[var(--text-secondary)] hover:bg-gray-100 dark:hover:bg-gray-800'
        }`}
      >
        EN
      </button>
      <button
        type="button"
        onClick={() => selectLang('es')}
        aria-pressed={lang === 'es'}
        className={`min-h-[44px] rounded-r-md px-3 font-medium transition duration-fast ${
          lang === 'es' ? 'bg-primary text-white' : 'text-[var(--text-secondary)] hover:bg-gray-100 dark:hover:bg-gray-800'
        }`}
      >
        ES
      </button>
    </div>
  );
}
