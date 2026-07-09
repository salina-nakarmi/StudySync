// components/Projects/GitHubRepoSearch.jsx
import { useState, useEffect, useRef } from "react";
import { SearchIcon, StarIcon, GitBranchIcon, CheckIcon, XIcon } from "lucide-react";
import { useApi } from "../../utils/api";

const PRIMARY_BLUE = "#2C76BA";

function useDebounce(value, delay = 400) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

function formatStars(n) {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

/**
 * Controlled component — calls onSelect({ owner, name, full_name }) when
 * the user picks a repo from the dropdown, or onClear() when they clear it.
 *
 * Props:
 *   selected  — { owner, name, full_name } | null
 *   onSelect  — (repo) => void
 *   onClear   — () => void
 */
export default function GitHubRepoSearch({ selected, onSelect, onClear }) {
  const { makeRequest } = useApi();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState(null);
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);
  const debouncedQuery = useDebounce(query, 400);

  // Search GitHub when debounced query changes
  useEffect(() => {
    if (!debouncedQuery || debouncedQuery.length < 2 || selected) {
      setResults([]);
      setOpen(false);
      return;
    }

    let cancelled = false;
    setIsSearching(true);
    setError(null);

    makeRequest(`projects/github/search-repos?q=${encodeURIComponent(debouncedQuery)}`)
      .then((data) => {
        if (!cancelled) {
          setResults(data);
          setOpen(data.length > 0);
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setIsSearching(false);
      });

    return () => { cancelled = true; };
  }, [debouncedQuery, selected]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSelect = (repo) => {
    onSelect(repo);
    setQuery("");
    setResults([]);
    setOpen(false);
  };

  const handleClear = () => {
    onClear();
    setQuery("");
    setResults([]);
  };

  // Show selected state
  if (selected) {
    return (
      <div className="flex items-center gap-3 px-4 py-3 bg-blue-50 border border-blue-200 rounded-xl">
        <GitBranchIcon className="h-4 w-4 text-[#2C76BA] shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-gray-900 truncate">{selected.full_name}</p>
          {selected.description && (
            <p className="text-xs text-gray-500 truncate mt-0.5">{selected.description}</p>
          )}
        </div>
        <button
          onClick={handleClear}
          className="shrink-0 p-1 rounded-lg hover:bg-blue-100 transition text-gray-400 hover:text-gray-600"
        >
          <XIcon className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div ref={wrapperRef} className="relative">
      <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus-within:border-[#2C76BA] focus-within:ring-2 focus-within:ring-[#2C76BA]/10 transition">
        {isSearching ? (
          <div className="h-4 w-4 border-2 border-[#2C76BA] border-t-transparent rounded-full animate-spin shrink-0" />
        ) : (
          <SearchIcon className="h-4 w-4 text-gray-400 shrink-0" />
        )}
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search GitHub repos… e.g. facebook/react"
          className="flex-1 bg-transparent text-sm text-gray-800 outline-none placeholder:text-gray-400"
        />
      </div>

      {error && (
        <p className="mt-1.5 text-xs text-red-500">{error}</p>
      )}

      {open && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden">
          {results.map((repo) => (
            <button
              key={repo.full_name}
              onClick={() => handleSelect(repo)}
              className="w-full flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition text-left border-b border-gray-100 last:border-0"
            >
              <GitBranchIcon className="h-4 w-4 text-gray-400 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-900">{repo.full_name}</p>
                {repo.description && (
                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{repo.description}</p>
                )}
              </div>
              <span className="shrink-0 flex items-center gap-1 text-[11px] text-gray-400 mt-0.5">
                <StarIcon className="h-3 w-3" />
                {formatStars(repo.stars)}
              </span>
            </button>
          ))}
        </div>
      )}

      {!isSearching && query.length >= 2 && results.length === 0 && !error && (
        <p className="mt-1.5 text-xs text-gray-400">No public repos found for "{query}"</p>
      )}
    </div>
  );
}