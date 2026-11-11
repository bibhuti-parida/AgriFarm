import { prisma } from '../../config/database.js';
import { env } from '../../config/env.js';
import { checkFarmOwnership } from '../../utils/ownership.js';
import { ApiError } from '../../utils/ApiError.js';

const CACHE_TTL_HOURS = 3;

/**
 * Weather condition code mapping from WMO weather codes (Open-Meteo)
 */
const mapWmoCode = (code) => {
  if (code === 0) return 'Clear sky';
  if (code === 1 || code === 2) return 'Partly cloudy';
  if (code === 3) return 'Overcast';
  if (code >= 45 && code <= 48) return 'Fog';
  if (code >= 51 && code <= 55) return 'Drizzle';
  if (code >= 61 && code <= 65) return 'Rain';
  if (code >= 71 && code <= 77) return 'Snow';
  if (code >= 80 && code <= 82) return 'Rain showers';
  if (code >= 95 && code <= 99) return 'Thunderstorm';
  return 'Cloudy';
};

/**
 * Fetches real weather data from Open-Meteo or OpenWeatherMap API
 */
const fetchWeatherFromProvider = async (latitude, longitude) => {
  const lat = Number(latitude);
  const lon = Number(longitude);

  if (env.WEATHER_API_KEY) {
    // OpenWeatherMap integration
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${env.WEATHER_API_KEY}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
    if (!res.ok) {
      throw new Error(`OpenWeatherMap returned status ${res.status}`);
    }
    const data = await res.json();
    return {
      temperatureC: data.main.temp,
      feelsLikeC: data.main.feels_like,
      humidityPercent: data.main.humidity,
      rainfallMm: data.rain ? data.rain['1h'] || 0 : 0,
      windSpeed: data.wind ? data.wind.speed : 0,
      condition: data.weather?.[0]?.description || 'Clear',
      observedAt: new Date(data.dt * 1000),
    };
  }

  // Open-Meteo free API
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m&timezone=auto`;
  const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
  if (!res.ok) {
    throw new Error(`Open-Meteo returned status ${res.status}`);
  }
  const data = await res.json();
  const current = data.current;

  return {
    temperatureC: current.temperature_2m,
    feelsLikeC: current.apparent_temperature,
    humidityPercent: Math.round(current.relative_humidity_2m),
    rainfallMm: current.precipitation || 0,
    windSpeed: current.wind_speed_10m,
    condition: mapWmoCode(current.weather_code),
    observedAt: new Date(current.time),
  };
};

export const getFarmWeather = async (userId, farmId, { forceRefresh = false } = {}) => {
  const farm = await checkFarmOwnership(farmId, userId);

  if (farm.latitude == null || farm.longitude == null) {
    throw ApiError.badRequest(
      'Farm does not have geographic coordinates (latitude and longitude) configured',
      'COORDINATES_REQUIRED'
    );
  }

  const cacheThreshold = new Date(Date.now() - CACHE_TTL_HOURS * 3600 * 1000);

  if (!forceRefresh) {
    const cachedRecord = await prisma.weatherRecord.findFirst({
      where: {
        farmId,
        observedAt: { gte: cacheThreshold },
      },
      orderBy: { observedAt: 'desc' },
    });

    if (cachedRecord) {
      return {
        weather: cachedRecord,
        cached: true,
        farm: { id: farm.id, name: farm.name, latitude: farm.latitude, longitude: farm.longitude },
      };
    }
  }

  try {
    const weatherData = await fetchWeatherFromProvider(farm.latitude, farm.longitude);

    const savedRecord = await prisma.weatherRecord.create({
      data: {
        farmId,
        observedAt: weatherData.observedAt,
        temperatureC: weatherData.temperatureC,
        feelsLikeC: weatherData.feelsLikeC,
        humidityPercent: weatherData.humidityPercent,
        rainfallMm: weatherData.rainfallMm,
        windSpeed: weatherData.windSpeed,
        condition: weatherData.condition,
        source: 'api',
      },
    });

    return {
      weather: savedRecord,
      cached: false,
      farm: { id: farm.id, name: farm.name, latitude: farm.latitude, longitude: farm.longitude },
    };
  } catch (err) {
    // If external call fails (e.g. offline sandbox or network error), fallback to latest cached record
    const fallbackRecord = await prisma.weatherRecord.findFirst({
      where: { farmId },
      orderBy: { createdAt: 'desc' },
    });

    if (fallbackRecord) {
      return {
        weather: fallbackRecord,
        cached: true,
        stale: true,
        notice: `Live weather provider unreachable (${err.message}). Returning latest cached record.`,
        farm: { id: farm.id, name: farm.name, latitude: farm.latitude, longitude: farm.longitude },
      };
    }

    throw ApiError.badRequest(
      `Unable to fetch weather from provider: ${err.message}`,
      'WEATHER_PROVIDER_ERROR'
    );
  }
};

