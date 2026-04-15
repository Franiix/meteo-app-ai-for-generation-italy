export interface CityResult {
  id: number;
  name: string;
  country: string;
  admin1?: string;
  latitude: number;
  longitude: number;
}

export interface WeatherCardData {
  id: string;
  cityKey: string;
  cityName: string;
  regionLabel: string;
  latitude: number;
  longitude: number;
  temperature: number;
  apparentTemperature: number;
  humidity: number;
  windSpeed: number;
  precipitation: number;
  weatherCode: number;
  description: string;
  time: string;
  fetchedAt: number;
  fromCache: boolean;
}

export interface DailyForecastItem {
  date: string;
  minTemperature: number;
  maxTemperature: number;
  precipitationProbability: number;
  weatherCode: number;
  description: string;
}

export interface WeeklyForecastData {
  cityKey: string;
  cityName: string;
  regionLabel: string;
  fetchedAt: number;
  fromCache: boolean;
  days: DailyForecastItem[];
}
