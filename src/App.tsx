import './App.css'
import { useState, useEffect } from 'react';
import {
  Search, Cloud, Sun, CloudRain, Wind, Droplets, Eye, Thermometer, MapPin, Loader2, AlertCircle
} from 'lucide-react';

export default function WeatherDashboard() {
  const [searchCity, setSearchCity] = useState('');
  const [currentWeather, setCurrentWeather] = useState<any | null>(null);
  const [forecast, setForecast] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [hasInitialized, setHasInitialized] = useState(false);

  const API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY;

  useEffect(() => {
    if (!hasInitialized) {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            fetchWeatherByCoords(position.coords.latitude, position.coords.longitude);
            setHasInitialized(true);
          },
          () => {
            setError('Location permission denied. Showing New York weather by default.');
            fetchWeatherData('New York');
            setHasInitialized(true);
          }
        );
      } else {
        setError('Geolocation is not supported by this browser. Showing New York weather by default.');
        fetchWeatherData('New York');
        setHasInitialized(true);
      }
    }
  }, [hasInitialized]);
  const fetchWeatherByCoords = async (lat: number, lon: number) => {
    setIsLoading(true);
    setError('');
    try {
      const weatherResponse = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`
      );
      if (!weatherResponse.ok) throw new Error('Failed to fetch weather for your location');
      const weatherData = await weatherResponse.json();

      const forecastResponse = await fetch(
        `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`
      );
      if (!forecastResponse.ok) throw new Error('Failed to fetch forecast for your location');
      const forecastData = await forecastResponse.json();

      const dailyForecasts: any[] = [];
      const processedDates = new Set<string>();
      forecastData.list.forEach((item: any) => {
        const date = new Date(item.dt * 1000).toDateString();
        if (!processedDates.has(date) && dailyForecasts.length < 5) {
          dailyForecasts.push(item);
          processedDates.add(date);
        }
      });

      setCurrentWeather(weatherData);
      setForecast(dailyForecasts);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch weather data');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchWeatherData = async (city: string) => {
    if (!city.trim()) {
      setError('Please enter a city name');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const weatherResponse = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric`
      );

      if (!weatherResponse.ok) {
        if (weatherResponse.status === 401) throw new Error('Invalid API key');
        if (weatherResponse.status === 404) throw new Error('City not found');
        if (weatherResponse.status === 429) throw new Error('API limit exceeded');
        throw new Error(`Weather service error: ${weatherResponse.status}`);
      }

      const weatherData = await weatherResponse.json();

      const forecastResponse = await fetch(
        `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric`
      );

      if (!forecastResponse.ok) throw new Error('Failed to fetch forecast');
      const forecastData = await forecastResponse.json();

      const dailyForecasts: any[] = [];
      const processedDates = new Set<string>();

      forecastData.list.forEach((item: any) => {
        const date = new Date(item.dt * 1000).toDateString();
        if (!processedDates.has(date) && dailyForecasts.length < 5) {
          dailyForecasts.push(item);
          processedDates.add(date);
        }
      });

      setCurrentWeather(weatherData);
      setForecast(dailyForecasts);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch weather data');
    } finally {
      setIsLoading(false);
    }
  };

  const getWeatherIcon = (condition: string, size = 'w-10 h-10') => {
    switch ((condition || '').toLowerCase()) {
      case 'clear':
        return <Sun className={`${size} text-yellow-400`} />;
      case 'clouds':
        return <Cloud className={`${size} text-slate-300`} />;
      case 'rain':
      case 'drizzle':
        return <CloudRain className={`${size} text-sky-400`} />;
      case 'snow':
        return <Cloud className={`${size} text-blue-200`} />;
      default:
        return <Sun className={`${size} text-yellow-400`} />;
    }
  };

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (searchCity.trim() && !isLoading) {
      fetchWeatherData(searchCity.trim());
      setSearchCity('');
    }
  };

  const formatDate = (timestamp: number) => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const date = new Date(timestamp * 1000);
    const today = new Date();
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
    return days[date.getDay()];
  };

  const safeTemp = (temp: number) =>
    typeof temp !== 'number' || isNaN(temp) ? '--' : Math.round(temp);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 text-slate-100 p-4">
      <div className="max-w-6xl mx-auto">

        <div className="text-center mb-6">
          <h1 className="text-3xl sm:text-4xl font-bold">Weather Dashboard</h1>
          <p className="text-sm sm:text-base text-slate-400">Stay updated with the latest weather</p>
        </div>

        <form onSubmit={handleSearch} className="max-w-md mx-auto mb-6 px-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5 outline-0" />
            <input
              type="text"
              value={searchCity}
              onChange={(e) => setSearchCity(e.target.value)}
              placeholder="Search city..."
              className="w-full pl-10 pr-24 py-3 rounded-lg bg-slate-100 text-slate-900 shadow-lg focus:ring-2 focus:ring-sky-400 focus:outline-none"
              style={{ outline: 'none', boxShadow: 'none' }}
              disabled={isLoading}
              name='searchCity'
            />
            <button
              type="submit"
              disabled={isLoading || !searchCity.trim()}
              className="absolute right-1 top-1/2 transform -translate-y-1/2 bg-sky-500 hover:bg-sky-600 disabled:bg-sky-300 text-white px-4 py-2 rounded-md text-sm flex items-center gap-1"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Loading...</span>
                </>
              ) : (
                'Search'
              )}
            </button>
          </div>
        </form>

        {error && (
          <div className="bg-red-600/10 border border-red-500 text-red-200 px-4 py-3 rounded-lg mb-6 mx-2 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 mt-0.5" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {isLoading && !currentWeather && (
          <div className="bg-slate-800 rounded-2xl p-8 mb-6 shadow-xl border border-slate-700 mx-2">
            <div className="animate-pulse space-y-4">
              <div className="h-6 bg-slate-700 rounded"></div>
              <div className="h-16 bg-slate-700 rounded"></div>
              <div className="grid grid-cols-2 gap-4">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="h-20 bg-slate-700 rounded"></div>
                ))}
              </div>
            </div>
          </div>
        )}

        {currentWeather && (
          <div className="bg-slate-800 rounded-2xl p-6 mb-6 shadow-xl border border-slate-700 mx-2">
            <div className="grid md:grid-cols-2 gap-6 items-center">
              <div className="text-center md:text-left">
                <div className="flex items-center justify-center md:justify-start mb-2">
                  <MapPin className="w-5 h-5 text-sky-400 mr-2" />
                  <h2 className="text-3xl font-semibold">
                    {currentWeather.name}
                    {currentWeather.sys?.country && (
                      <span className="text-lg text-slate-400 ml-2">
                        {currentWeather.sys.country}
                      </span>
                    )}
                  </h2>
                </div>
                <div className="flex items-center justify-center md:justify-start mb-4">
                  <span className="text-6xl font-light mr-4">
                    {safeTemp(currentWeather.main?.temp)}°
                  </span>
                  {getWeatherIcon(currentWeather.weather?.[0]?.main)}
                </div>
                <p className="text-xl text-slate-300 capitalize mb-1">
                  {currentWeather.weather?.[0]?.description || 'Clear'}
                </p>
                <p className="text-base text-slate-400">
                  Feels like {safeTemp(currentWeather.main?.feels_like)}°C
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {[
                  { Icon: Wind, label: 'Wind', value: `${Math.round(currentWeather.wind?.speed || 0)} m/s` },
                  { Icon: Droplets, label: 'Humidity', value: `${currentWeather.main?.humidity || '--'}%` },
                  { Icon: Eye, label: 'Visibility', value: `${Math.round(currentWeather.visibility / 1000) || '--'} km` },
                  { Icon: Thermometer, label: 'Feels Like', value: `${safeTemp(currentWeather.main?.feels_like)}°C` },
                ].map(({ Icon, label, value }, i) => (
                  <div key={i} className="bg-slate-700 rounded-lg p-4 hover:bg-slate-600 transition-colors">
                    <div className="flex items-center mb-2">
                      <Icon className="w-5 h-5 text-sky-400 mr-2" />
                      <span className="text-slate-400 text-sm">{label}</span>
                    </div>
                    <span className="text-slate-100 text-xl font-semibold">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {forecast.length > 0 && (
          <div className="bg-slate-800 rounded-2xl p-6 shadow-xl border border-slate-700 mx-2">
            <h3 className="text-2xl font-semibold mb-6">5-Day Forecast</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              {forecast.map((day, index) => (
                <div key={index} className="bg-slate-700 rounded-lg p-4 text-center hover:bg-slate-600 transition-transform transform hover:scale-105">
                  <h4 className="text-slate-100 font-medium mb-2 text-sm">{formatDate(day.dt)}</h4>
                  <div className="flex justify-center mb-2">
                    {getWeatherIcon(day.weather?.[0]?.main)}
                  </div>
                  <p className="text-slate-400 text-xs capitalize mb-1">
                    {day.weather?.[0]?.description || 'Clear'}
                  </p>
                  <div className="flex justify-between text-slate-100 text-sm">
                    <span className="font-semibold">{safeTemp(day.main?.temp_max)}°</span>
                    <span className="text-slate-400">{safeTemp(day.main?.temp_min)}°</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}