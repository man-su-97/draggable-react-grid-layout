"use client";
import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WiDaySunny, WiCloudy, WiRain, WiSnow } from "react-icons/wi";

interface WeatherData {
  description: string;
  icon: string;
  temp: { current: number; min: number; max: number };
}

interface WeatherCardProps {
  location?: string;
  coordinates?: [number, number] | "current";
  description?: string;
  icon?: string;
  temp?: { current: number; min: number; max: number };
}

const NEXT_PUBLIC_WEATHER_API_KEY = process.env.NEXT_PUBLIC_WEATHER_API_KEY;

export default function WeatherCard({
  location,
  coordinates,
  description,
  icon,
  temp,
}: WeatherCardProps) {
  const [weatherData, setWeatherData] = useState<WeatherData | null>(
    temp && description && icon
      ? { description, icon, temp }
      : null
  );
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(
    Array.isArray(coordinates)
      ? { lat: coordinates[0], lon: coordinates[1] }
      : null
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 🔹 Fetch weather by lat/lon
  const fetchWeather = async (lat: number, lon: number) => {
    try {
      setLoading(true);
      setError(null);

      const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${NEXT_PUBLIC_WEATHER_API_KEY}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch weather data");

      const data = await res.json();

      setWeatherData({
        description: data.weather?.[0]?.description ?? "unknown",
        icon: data.weather?.[0]?.icon ?? "01d",
        temp: {
          current: data.main.temp,
          min: data.main.temp_min,
          max: data.main.temp_max,
        },
      });
      setCoords({ lat, lon });
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (coordinates === "current" && !weatherData) {
      if (!navigator.geolocation) {
        setError("Geolocation is not supported by your browser.");
        return;
      }
      setLoading(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          fetchWeather(latitude, longitude);
        },
        (err) => {
          setError(`Location error: ${err.message}`);
          setLoading(false);
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
      );
    }
  }, [coordinates, weatherData]);

  const getWeatherIcon = (iconCode?: string) => {
    if (!iconCode) return <WiDaySunny size={50} className="mx-auto text-yellow-400" />;
    if (iconCode.startsWith("01"))
      return <WiDaySunny size={50} className="mx-auto text-yellow-400" />;
    if (["02", "03", "04"].some((c) => iconCode.startsWith(c)))
      return <WiCloudy size={50} className="mx-auto text-gray-400" />;
    if (["09", "10"].some((c) => iconCode.startsWith(c)))
      return <WiRain size={50} className="mx-auto text-blue-400" />;
    if (iconCode.startsWith("13"))
      return <WiSnow size={50} className="mx-auto text-cyan-300" />;
    return <WiDaySunny size={50} className="mx-auto text-yellow-400" />;
  };

  return (
    <Card className="w-[350px]">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-center">
          Weather {location ? `in ${location}` : "Forecast"}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center space-y-4">
        {loading && <p className="text-sm text-gray-500">Loading...</p>}
        {error && <p className="text-sm text-red-500 text-center">{error}</p>}

        {coords && !loading && !error && (
          <div className="w-full text-center space-y-2">
            <p className="text-sm">
              Latitude: {coords.lat.toFixed(4)}, Longitude: {coords.lon.toFixed(4)}
            </p>
          </div>
        )}

        {weatherData && !loading && (
          <div className="w-full text-center space-y-2">
            {getWeatherIcon(weatherData.icon)}
            <h3 className="text-xl font-bold capitalize">{weatherData.description}</h3>
            <div className="space-y-1 text-sm">
              <p>Current Temp: {weatherData.temp.current.toFixed(1)}°C</p>
              <p>Min Temp: {weatherData.temp.min.toFixed(1)}°C</p>
              <p>Max Temp: {weatherData.temp.max.toFixed(1)}°C</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
