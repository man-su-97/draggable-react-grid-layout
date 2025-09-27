// A smart widget that fetches live weather data.

// If payload already has temp/description/icon, it hydrates from props.

// Otherwise, it:

// Calls /api/get-weather (lat/lon/city).

// Or uses geolocation if coordinates: "current".

// Displays weather card with icons and temps.


"use client";
import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WiDaySunny, WiCloudy, WiRain, WiSnow, WiFog } from "react-icons/wi";

type Coordinates = [number, number] | "current";

interface WeatherData {
  description: string;
  icon: string;
  temp: { current: number; min: number; max: number };
}

interface WeatherCardProps {
  location?: string;
  coordinates?: Coordinates;
  description?: string;
  icon?: string;
  temp?: { current: number; min: number; max: number };
}

interface WeatherApiSuccess extends WeatherData {
  coordinates: [number, number];
}
interface WeatherApiError {
  error: string;
}
type WeatherApiResponse = WeatherApiSuccess | WeatherApiError;

export default function WeatherWidget({
  location,
  coordinates,
  description,
  icon,
  temp,
}: WeatherCardProps) {
  const [weatherData, setWeatherData] = useState<WeatherData | null>(
    temp && description && icon ? { description, icon, temp } : null
  );
  const [coords, setCoords] = useState<[number, number] | null>(
    Array.isArray(coordinates) ? coordinates : null
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchWeather = async (args: { lat?: number; lon?: number; city?: string }) => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch("/api/get-weather", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(args),
      });

      if (!res.ok) throw new Error("Failed to fetch weather data");

      const data: WeatherApiResponse = await res.json();

      if ("error" in data) {
        throw new Error(data.error);
      }

      setWeatherData({
        description: data.description,
        icon: data.icon,
        temp: data.temp,
      });
      setCoords(data.coordinates);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (weatherData) return; 

    if (Array.isArray(coordinates)) {
     
      fetchWeather({ lat: coordinates[0], lon: coordinates[1] });
    } else if (coordinates === "current") {
  
      if (!navigator.geolocation) {
        setError("Geolocation not supported by your browser.");
        return;
      }
      setLoading(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          fetchWeather({ lat: pos.coords.latitude, lon: pos.coords.longitude });
        },
        (err) => {
          setError(`Location error: ${err.message}`);
          setLoading(false);
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
      );
    } else if (location) {
      
      fetchWeather({ city: location });
    }
  }, [coordinates, location, weatherData]);

  const getWeatherIcon = (iconCode?: string) => {
    if (!iconCode)
      return <WiDaySunny size={50} className="mx-auto text-yellow-400" />;
    if (iconCode.startsWith("01"))
      return <WiDaySunny size={50} className="mx-auto text-yellow-400" />;
    if (["02", "03", "04"].some((c) => iconCode.startsWith(c)))
      return <WiCloudy size={50} className="mx-auto text-gray-400" />;
    if (["09", "10"].some((c) => iconCode.startsWith(c)))
      return <WiRain size={50} className="mx-auto text-blue-400" />;
    if (iconCode.startsWith("13"))
      return <WiSnow size={50} className="mx-auto text-cyan-300" />;
    if (iconCode.startsWith("50"))
      return <WiFog size={50} className="mx-auto text-gray-400" />;
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
          <p className="text-sm text-gray-600">
            📍 {coords[0].toFixed(2)}, {coords[1].toFixed(2)}
          </p>
        )}

        {weatherData && !loading && (
          <div className="w-full text-center space-y-2">
            {getWeatherIcon(weatherData.icon)}
            <h3 className="text-xl font-bold capitalize">
              {weatherData.description}
            </h3>
            <div className="space-y-1 text-sm">
              <p>🌡 {weatherData.temp.current.toFixed(1)}°C</p>
              <p>⬇ Min: {weatherData.temp.min.toFixed(1)}°C</p>
              <p>⬆ Max: {weatherData.temp.max.toFixed(1)}°C</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
