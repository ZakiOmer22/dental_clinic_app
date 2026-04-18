import { useEffect, useCallback, useRef } from "react";
import { useSearchParams } from "react-router-dom";

export interface SearchConfig {
  /** Called when search param changes */
  onSearch: (query: string) => void;
  /** Delay in ms before triggering search (debounce) */
  debounceMs?: number;
  /** Minimum characters to trigger search */
  minChars?: number;
  /** Clear search when component unmounts */
  clearOnUnmount?: boolean;
}

export function useUniversalSearch({
  onSearch,
  debounceMs = 300,
  minChars = 1,
  clearOnUnmount = true,
}: SearchConfig) {
  const [searchParams, setSearchParams] = useSearchParams();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const currentQuery = searchParams.get("q") || "";

  const debouncedSearch = useCallback(
    (value: string) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        if (value.length >= minChars || value === "") {
          onSearch(value);
        }
      }, debounceMs);
    },
    [onSearch, debounceMs, minChars]
  );

  // Listen to URL query param changes
  useEffect(() => {
    const query = searchParams.get("q") || "";
    debouncedSearch(query);
  }, [searchParams, debouncedSearch]);

  // Update URL when search changes (call this from your search input)
  const setSearchQuery = useCallback(
    (query: string) => {
      if (query) {
        setSearchParams({ q: query });
      } else {
        setSearchParams({});
      }
    },
    [setSearchParams]
  );

  // Clear on unmount
  useEffect(() => {
    return () => {
      if (clearOnUnmount && searchParams.get("q")) {
        setSearchParams({});
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [clearOnUnmount, setSearchParams, searchParams]);

  return {
    query: currentQuery,
    setSearchQuery,
    hasSearch: !!currentQuery,
  };
}