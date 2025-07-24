import './App.css'
import { useState, useEffect } from 'react';
import { Search, Cloud, Sun, CloudRain, Wind, Droplets, Eye, Thermometer, MapPin, Loader2 } from 'lucide-react';
import { AlertCircle } from 'lucide-react';

export default function WeatherDashboard() {
  const [searchCity, setSearchCity] = useState<string>('');
  const [currentWeather, setCurrentWeather] = useState<any | null>(null);
  const [forecast, setForecast] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [hasInitialized, setHasInitialized] = useState<boolean>(false);

  const API_KEY = 'e71da5cd7e5b311effa948d2f4e5d0c4';

  useEffect(() => {
    if (!hasInitialized) {
      fetchWeatherData('New York');
      setHasInitialized(true);
    }
  }, [hasInitialized]);

  const fetchWeatherData = async (city: string) => {
    if (!city || !city.trim()) {
      setError('Please enter a city name');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const weatherResponse = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city.trim())}&appid=${API_KEY}&units=imperial`
      );

      if (!weatherResponse.ok) {
        if (weatherResponse.status === 401) {
          throw new Error('Invalid API key. Please check your OpenWeatherMap API key.');
        } else if (weatherResponse.status === 404) {
          throw new Error('City not found. Please check the spelling and try again.');
        } else if (weatherResponse.status === 429) {
          throw new Error('API limit exceeded. Please try again later.');
        } else {
          throw new Error(`Weather service error: ${weatherResponse.status}`);
        }
      }

      const weatherData = await weatherResponse.json();

      const forecastResponse = await fetch(
        `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city.trim())}&appid=${API_KEY}&units=imperial`
      );

      if (!forecastResponse.ok) {
        throw new Error('Failed to fetch forecast data');
      }

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
      console.error('Weather API Error:', err);
      setError(err.message || 'Failed to fetch weather data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getWeatherIcon = (condition: string, size = 'sm:w-12 sm:h-12') => {
    const iconClass = `w-8 h-8 ${size}`;
    
    if (!condition) return <Sun className={`${iconClass} text-yellow-400`} />;
    
    switch (condition.toLowerCase()) {
      case 'clear':
        return <Sun className={`${iconClass} text-yellow-400`} />;
      case 'clouds':
        return <Cloud className={`${iconClass} text-gray-400`} />;
      case 'rain':
      case 'drizzle':
        return <CloudRain className={`${iconClass} text-blue-400`} />;
      case 'snow':
        return <Cloud className={`${iconClass} text-blue-200`} />;
      default:
        return <Sun className={`${iconClass} text-yellow-400`} />;
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
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    } else {
      return days[date.getDay()];
    }
  };

  const safeTemp = (temp: number) => {
    if (typeof temp !== 'number' || isNaN(temp)) return '--';
    return Math.round(temp);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600 p-2 sm:p-4">
      <div className="max-w-6xl mx-auto">

        <div className="text-center mb-4 sm:mb-8">
          <h1 className="text-2xl sm:text-4xl font-bold text-white mb-1 sm:mb-2">Weather Dashboard</h1>
          <p className="text-sm sm:text-base text-blue-100">Stay updated with the latest weather conditions</p>
        </div>

        <div className="mb-4 sm:mb-8">
          <form onSubmit={handleSearch} className="max-w-md mx-auto px-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
              <input
                type="text"
                value={searchCity}
                onChange={(e) => setSearchCity(e.target.value)}
                placeholder="Search for a city..."
                className="w-full pl-8 sm:pl-10 pr-20 sm:pr-24 py-2.5 sm:py-3 rounded-lg border-0 shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-300 text-gray-700 text-sm sm:text-base"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading || !searchCity.trim()}
                className="absolute right-1 top-1/2 transform -translate-y-1/2 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white px-2 sm:px-4 py-1 sm:py-1.5 rounded-md transition-colors duration-200 text-xs sm:text-sm flex items-center gap-1"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" />
                    <span className="hidden sm:inline">Loading...</span>
                  </>
                ) : (
                  'Search'
                )}
              </button>
            </div>
          </form>
        </div>

        {error && (
          <div className={`border px-4 py-3 rounded-lg mb-4 sm:mb-8 mx-2 flex items-start gap-2 ${
            error.includes('demo data') 
              ? 'bg-yellow-500/20 border-yellow-400 text-yellow-100' 
              : 'bg-red-500/20 border-red-400 text-red-100'
          }`}>
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {isLoading && !currentWeather && (
          <div className="bg-white/10 backdrop-blur-md rounded-xl sm:rounded-2xl p-4 sm:p-8 mb-4 sm:mb-8 shadow-xl border border-white/20 mx-2 sm:mx-0">
            <div className="animate-pulse">
              <div className="h-6 bg-white/20 rounded mb-4"></div>
              <div className="h-16 bg-white/20 rounded mb-4"></div>
              <div className="grid grid-cols-2 gap-4">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="h-20 bg-white/20 rounded"></div>
                ))}
              </div>
            </div>
          </div>
        )}

        {currentWeather && (
          <div className="bg-white/10 backdrop-blur-md rounded-xl sm:rounded-2xl p-4 sm:p-8 mb-4 sm:mb-8 shadow-xl border border-white/20 mx-2 sm:mx-0">
            <div className="grid md:grid-cols-2 gap-4 sm:gap-8 items-center">
              <div className="text-center md:text-left">
                <div className="flex items-center justify-center md:justify-start mb-2">
                  <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-blue-200 mr-1 sm:mr-2" />
                  <h2 className="text-xl sm:text-3xl font-semibold text-white">
                    {currentWeather.name}
                    {currentWeather.sys?.country && (
                      <span className="text-lg sm:text-xl text-blue-200 ml-2">
                        {currentWeather.sys.country}
                      </span>
                    )}
                  </h2>
                </div>
                <div className="flex items-center justify-center md:justify-start mb-3 sm:mb-4">
                  <span className="text-4xl sm:text-6xl font-light text-white mr-2 sm:mr-4">
                    {safeTemp(currentWeather.main?.temp)}°
                  </span>
                  {getWeatherIcon(currentWeather.weather?.[0]?.main)}
                </div>
                <p className="text-base sm:text-xl text-blue-100 mb-1 sm:mb-2 capitalize">
                  {currentWeather.weather?.[0]?.description || 'Clear'}
                </p>
                <p className="text-sm sm:text-base text-blue-200">
                  Feels like {safeTemp(currentWeather.main?.feels_like)}°F
                </p>
              </div>
              
              {/* Weather Details Grid */}
              <div className="grid grid-cols-2 gap-2 sm:gap-4 mt-4 md:mt-0">
                <div className="bg-white/10 rounded-lg p-3 sm:p-4 backdrop-blur-sm">
                  <div className="flex items-center mb-1 sm:mb-2">
                    <Wind className="w-3 h-3 sm:w-5 sm:h-5 text-blue-200 mr-1 sm:mr-2" />
                    <span className="text-blue-200 text-xs sm:text-sm">Wind</span>
                  </div>
                  <span className="text-white text-sm sm:text-xl font-semibold">
                    {currentWeather.wind?.speed ? Math.round(currentWeather.wind.speed) : '--'} mph
                  </span>
                </div>
                
                <div className="bg-white/10 rounded-lg p-3 sm:p-4 backdrop-blur-sm">
                  <div className="flex items-center mb-1 sm:mb-2">
                    <Droplets className="w-3 h-3 sm:w-5 sm:h-5 text-blue-200 mr-1 sm:mr-2" />
                    <span className="text-blue-200 text-xs sm:text-sm">Humidity</span>
                  </div>
                  <span className="text-white text-sm sm:text-xl font-semibold">
                    {currentWeather.main?.humidity || '--'}%
                  </span>
                </div>
                
                <div className="bg-white/10 rounded-lg p-3 sm:p-4 backdrop-blur-sm">
                  <div className="flex items-center mb-1 sm:mb-2">
                    <Eye className="w-3 h-3 sm:w-5 sm:h-5 text-blue-200 mr-1 sm:mr-2" />
                    <span className="text-blue-200 text-xs sm:text-sm">Visibility</span>
                  </div>
                  <span className="text-white text-sm sm:text-xl font-semibold">
                    {currentWeather.visibility ? Math.round(currentWeather.visibility / 1609) : '--'} mi
                  </span>
                </div>
                
                <div className="bg-white/10 rounded-lg p-3 sm:p-4 backdrop-blur-sm">
                  <div className="flex items-center mb-1 sm:mb-2">
                    <Thermometer className="w-3 h-3 sm:w-5 sm:h-5 text-blue-200 mr-1 sm:mr-2" />
                    <span className="text-blue-200 text-xs sm:text-sm">Feels Like</span>
                  </div>
                  <span className="text-white text-sm sm:text-xl font-semibold">
                    {safeTemp(currentWeather.main?.feels_like)}°F
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {forecast.length > 0 && (
          <div className="bg-white/10 backdrop-blur-md rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-xl border border-white/20 mx-2 sm:mx-0">
            <h3 className="text-lg sm:text-2xl font-semibold text-white mb-4 sm:mb-6">5-Day Forecast</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-4">
              {forecast.map((day, index) => (
                <div key={index} className="bg-white/10 rounded-lg p-3 sm:p-4 text-center backdrop-blur-sm hover:bg-white/20 transition-all duration-200 transform hover:scale-105">
                  <h4 className="text-white font-medium mb-2 sm:mb-3 text-xs sm:text-sm">
                    {formatDate(day.dt)}
                  </h4>
                  <div className="flex justify-center mb-2 sm:mb-3">
                    {getWeatherIcon(day.weather?.[0]?.main, 'sm:w-10 sm:h-10')}
                  </div>
                  <p className="text-blue-100 text-xs mb-1 sm:mb-2 capitalize">
                    {day.weather?.[0]?.description || 'Clear'}
                  </p>
                  <div className="flex justify-between text-white text-xs sm:text-sm">
                    <span className="font-semibold">{safeTemp(day.main?.temp_max)}°</span>
                    <span className="text-blue-200">{safeTemp(day.main?.temp_min)}°</span>
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