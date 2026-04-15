const GEO_CACHE_KEY = "meteo-app:geo-cache";
const WEATHER_CACHE_KEY = "meteo-app:weather-cache";

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

type CacheMap<T> = Record<string, CacheEntry<T>>;

function isStorageAvailable() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function readCache<T>(key: string): CacheMap<T> {
  if (!isStorageAvailable()) {
    return {};
  }

  try {
    const raw = window.localStorage.getItem(key);

    if (!raw) {
      return {};
    }

    return JSON.parse(raw) as CacheMap<T>;
  } catch {
    return {};
  }
}

function writeCache<T>(key: string, value: CacheMap<T>) {
  if (!isStorageAvailable()) {
    return;
  }

  window.localStorage.setItem(key, JSON.stringify(value));
}

function getFromCache<T>(key: string, cacheKey: string): T | null {
  const cache = readCache<T>(key);
  const entry = cache[cacheKey];

  if (!entry) {
    return null;
  }

  if (Date.now() > entry.expiresAt) {
    delete cache[cacheKey];
    writeCache(key, cache);
    return null;
  }

  return entry.data;
}

function saveToCache<T>(key: string, cacheKey: string, data: T, ttlMs: number) {
  const cache = readCache<T>(key);
  cache[cacheKey] = {
    data,
    expiresAt: Date.now() + ttlMs,
  };

  writeCache(key, cache);
}

export function getGeoCache<T>(cacheKey: string) {
  return getFromCache<T>(GEO_CACHE_KEY, cacheKey);
}

export function setGeoCache<T>(cacheKey: string, data: T, ttlMs: number) {
  saveToCache(GEO_CACHE_KEY, cacheKey, data, ttlMs);
}

export function getWeatherCache<T>(cacheKey: string) {
  return getFromCache<T>(WEATHER_CACHE_KEY, cacheKey);
}

export function setWeatherCache<T>(cacheKey: string, data: T, ttlMs: number) {
  saveToCache(WEATHER_CACHE_KEY, cacheKey, data, ttlMs);
}
