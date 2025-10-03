
import type { NextApiRequest, NextApiResponse } from "next";

const WEATHER_API_KEY = process.env.WEATHER_API_KEY!; 

interface WeatherData {
  description: string;
  icon: string;
  temp: { current: number; min: number; max: number };
  coordinates: [number, number];
}

type WeatherResponse = WeatherData | { error: string };

async function getWeather(lat: number, lon: number): Promise<WeatherData> {
  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${WEATHER_API_KEY}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error("Failed to fetch weather data");
  }
  const data = await res.json();

  return {
    description: data.weather?.[0]?.description ?? "unknown",
    icon: data.weather?.[0]?.icon ?? "01d",
    temp: {
      current: data.main?.temp ?? 0,
      min: data.main?.temp_min ?? 0,
      max: data.main?.temp_max ?? 0,
    },
    coordinates: [data.coord.lat, data.coord.lon],
  };
}

async function geocodeCity(city: string): Promise<[number, number]> {
  const url = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(
    city
  )}&limit=1&appid=${WEATHER_API_KEY}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error("Failed to geocode city");
  }
  const data = await res.json();
  if (!Array.isArray(data) || data.length === 0) {
    throw new Error(`No coordinates found for ${city}`);
  }
  return [data[0].lat, data[0].lon];
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<WeatherResponse>
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { lat, lon, city } = req.body as {
      lat?: number;
      lon?: number;
      city?: string;
    };

    let coords: [number, number];
    if (typeof lat === "number" && typeof lon === "number") {
      coords = [lat, lon];
    } else if (city) {
      coords = await geocodeCity(city);
    } else {
      return res.status(400).json({ error: "Missing city or coordinates" });
    }

    const weather = await getWeather(coords[0], coords[1]);
    return res.status(200).json(weather);
  } catch (err) {
    console.error("Weather API error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return res.status(500).json({ error: message });
  }
}
