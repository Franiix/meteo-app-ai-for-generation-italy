import { getGeoCache, getWeatherCache, setGeoCache, setWeatherCache } from "./cache";
import type { CityResult, DailyForecastItem, WeatherCardData, WeeklyForecastData } from "./types";
import { getWeatherDescription } from "./weatherCodes";

const GEOCODING_URL = "https://geocoding-api.open-meteo.com/v1/search";
const FORECAST_URL = "https://api.open-meteo.com/v1/forecast";
const GEO_TTL_MS = 1000 * 60 * 60 * 24;
const WEATHER_TTL_MS = 1000 * 60 * 10;

interface GeoApiResponse {
  results?: Array<{
    id: number;
    name: string;
    country: string;
    admin1?: string;
    latitude: number;
    longitude: number;
  }>;
}

interface WeatherApiResponse {
  current?: {
    time: string;
    temperature_2m: number;
    apparent_temperature: number;
    relative_humidity_2m: number;
    precipitation: number;
    weather_code: number;
    wind_speed_10m: number;
  };

  daily?: {
    time: string[];
    weather_code: number[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    precipitation_probability_max: number[];
  };
}

function normalizeCityName(cityName: string) {
  return cityName.trim().toLocaleLowerCase("it-IT");
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("La richiesta ai servizi meteo non e' andata a buon fine.");
  }

  return (await response.json()) as T;
}

export async function getCityCoordinates(cityName: string): Promise<CityResult | null> {
  const normalizedCity = normalizeCityName(cityName);
  const cached = getGeoCache<CityResult>(normalizedCity);

  if (cached) {
    return cached;
  }

  const url = new URL(GEOCODING_URL);
  url.searchParams.set("name", cityName.trim());
  url.searchParams.set("count", "5");
  url.searchParams.set("language", "it");
  url.searchParams.set("format", "json");

  const data = await fetchJson<GeoApiResponse>(url.toString());
  const firstResult = data.results?.[0];

  if (!firstResult) {
    return null;
  }

  const result: CityResult = {
    id: firstResult.id,
    name: firstResult.name,
    country: firstResult.country,
    admin1: firstResult.admin1,
    latitude: firstResult.latitude,
    longitude: firstResult.longitude,
  };

  setGeoCache(normalizedCity, result, GEO_TTL_MS);
  return result;
}

function toCardData(city: CityResult, weather: NonNullable<WeatherApiResponse["current"]>, fromCache: boolean): WeatherCardData {
  const regionPieces = [city.admin1, city.country].filter(Boolean);
  const cityKey = `${city.name}-${city.latitude}-${city.longitude}`.toLocaleLowerCase("it-IT");

  return {
    id: cityKey,
    cityKey,
    cityName: city.name,
    regionLabel: regionPieces.join(", "),
    latitude: city.latitude,
    longitude: city.longitude,
    temperature: weather.temperature_2m,
    apparentTemperature: weather.apparent_temperature,
    humidity: weather.relative_humidity_2m,
    windSpeed: weather.wind_speed_10m,
    precipitation: weather.precipitation,
    weatherCode: weather.weather_code,
    description: getWeatherDescription(weather.weather_code),
    time: weather.time,
    fetchedAt: Date.now(),
    fromCache,
  };
}

export async function getWeatherForCity(cityName: string): Promise<WeatherCardData> {
  const city = await getCityCoordinates(cityName);

  if (!city) {
    throw new Error("Citta' non trovata. Prova con un nome diverso.");
  }

  const weatherCacheKey = `${city.latitude},${city.longitude}`;
  const cachedWeather = getWeatherCache<WeatherCardData>(weatherCacheKey);

  if (cachedWeather) {
    return {
      ...cachedWeather,
      fromCache: true,
    };
  }

  const url = new URL(FORECAST_URL);
  url.searchParams.set("latitude", city.latitude.toString());
  url.searchParams.set("longitude", city.longitude.toString());
  url.searchParams.set(
    "current",
    "temperature_2m,apparent_temperature,relative_humidity_2m,precipitation,weather_code,wind_speed_10m",
  );
  url.searchParams.set("temperature_unit", "celsius");
  url.searchParams.set("wind_speed_unit", "kmh");
  url.searchParams.set("timezone", "auto");

  const data = await fetchJson<WeatherApiResponse>(url.toString());

  if (!data.current) {
    throw new Error("I dati meteo non sono disponibili in questo momento.");
  }

  const weatherCard = toCardData(city, data.current, false);
  setWeatherCache(weatherCacheKey, weatherCard, WEATHER_TTL_MS);
  return weatherCard;
}

function formatRegionLabel(city: CityResult) {
  return [city.admin1, city.country].filter(Boolean).join(", ");
}

export async function getWeeklyForecastForCity(cityName: string): Promise<WeeklyForecastData> {
  const city = await getCityCoordinates(cityName);

  if (!city) {
    throw new Error("Citta' non trovata. Prova con un nome diverso.");
  }

  const forecastCacheKey = `${city.latitude},${city.longitude}:weekly`;
  const cachedForecast = getWeatherCache<WeeklyForecastData>(forecastCacheKey);

  if (cachedForecast) {
    return {
      ...cachedForecast,
      fromCache: true,
    };
  }

  const url = new URL(FORECAST_URL);
  url.searchParams.set("latitude", city.latitude.toString());
  url.searchParams.set("longitude", city.longitude.toString());
  url.searchParams.set(
    "daily",
    "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max",
  );
  url.searchParams.set("forecast_days", "7");
  url.searchParams.set("timezone", "auto");

  const data = await fetchJson<WeatherApiResponse>(url.toString());

  if (!data.daily) {
    throw new Error("La previsione settimanale non e' disponibile in questo momento.");
  }

  const days: DailyForecastItem[] = data.daily.time.map((date, index) => {
    const weatherCode = data.daily?.weather_code[index] ?? 0;

    return {
      date,
      minTemperature: data.daily?.temperature_2m_min[index] ?? 0,
      maxTemperature: data.daily?.temperature_2m_max[index] ?? 0,
      precipitationProbability: data.daily?.precipitation_probability_max[index] ?? 0,
      weatherCode,
      description: getWeatherDescription(weatherCode),
    };
  });

  const weeklyForecast: WeeklyForecastData = {
    cityKey: `${city.name}-${city.latitude}-${city.longitude}`.toLocaleLowerCase("it-IT"),
    cityName: city.name,
    regionLabel: formatRegionLabel(city),
    fetchedAt: Date.now(),
    fromCache: false,
    days,
  };

  setWeatherCache(forecastCacheKey, weeklyForecast, WEATHER_TTL_MS);
  return weeklyForecast;
}
