import { useEffect, useRef, useState } from 'react';

export default function SearchBar() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [status, setStatus] = useState('idle'); // idle | loading | ready | unavailable
  const pagefindRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    function onKeydown(e) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === 'Escape') setOpen(false);
    }
    window.addEventListener('keydown', onKeydown);
    return () => window.removeEventListener('keydown', onKeydown);
  }, []);

  async function ensurePagefind() {
    if (pagefindRef.current) return pagefindRef.current;
    try {
      // Built by `pagefind` after `astro build`; does not exist in dev or in
      // this app's own bundle, so the path is assembled at runtime to keep
      // bundlers from trying to resolve it statically.
      const pagefindUrl = ['', 'pagefind', 'pagefind.js'].join('/');
      const mod = await import(/* @vite-ignore */ pagefindUrl);
      await mod.init();
      pagefindRef.current = mod;
      return mod;
    } catch {
      return null;
    }
  }

  async function runSearch(value) {
    setQuery(value);
    if (!value.trim()) {
      setResults([]);
      setStatus('idle');
      return;
    }
    setStatus('loading');
    const pagefind = await ensurePagefind();
    if (!pagefind) {
      setStatus('unavailable');
      return;
    }
    const search = await pagefind.search(value);
    const data = await Promise.all(search.results.slice(0, 8).map((r) => r.data()));
    setResults(data);
    setStatus('ready');
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Search the site"
        className="flex h-11 w-11 items-center justify-center rounded-md text-[var(--text-primary)] transition duration-fast hover:bg-gray-100 dark:hover:bg-gray-800"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Site search"
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 p-4 pt-24"
          onClick={(e) => e.target === e.currentTarget && setOpen(false)}
        >
          <div className="w-full max-w-xl rounded-lg bg-[var(--bg-primary)] p-4 shadow-xl">
            <input
              ref={inputRef}
              type="search"
              value={query}
              onChange={(e) => runSearch(e.target.value)}
              placeholder="Search the site…"
              className="input-text"
              aria-label="Search query"
            />

            <div className="mt-3 max-h-96 overflow-y-auto">
              {status === 'loading' && <p className="p-tiny text-[var(--text-secondary)]">Searching…</p>}
              {status === 'unavailable' && (
                <p className="p-tiny text-[var(--text-secondary)]">
                  Search index is only available on the deployed/built site (run <code>npm run build &amp;&amp; npm run search:build</code>).
                </p>
              )}
              {status === 'ready' && results.length === 0 && (
                <p className="p-tiny text-[var(--text-secondary)]">No results for "{query}".</p>
              )}
              <ul className="flex flex-col gap-2">
                {results.map((r) => (
                  <li key={r.url}>
                    <a href={r.url} className="link block rounded-md p-2 hover:bg-gray-100 dark:hover:bg-gray-800">
                      <span className="block font-medium text-[var(--text-primary)]">{r.meta?.title ?? r.url}</span>
                      <span
                        className="p-tiny block text-[var(--text-secondary)]"
                        dangerouslySetInnerHTML={{ __html: r.excerpt }}
                      />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
