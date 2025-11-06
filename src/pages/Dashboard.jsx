import { useState, useCallback, useEffect } from 'react';
import SearchResults from '../components/SearchResults';
import WeatherCards from '../components/WeatherCards';
import Navbar from '../components/Navbar';

export default function Dashboard() {
  // Helper function to validate and load default location
  const loadDefaultLocation = () => {
    const defaultLocationData = localStorage.getItem('defaultLocationData');
    if (defaultLocationData) {
      try {
        const parsed = JSON.parse(defaultLocationData);
        // Validate that the location has all required fields
        if (parsed && parsed.name && typeof parsed.latitude === 'number' && typeof parsed.longitude === 'number') {
          return parsed;
        } else {
          console.warn('Default location data is missing required fields:', parsed);
        }
      } catch (e) {
        console.error('Failed to parse default location data:', e);
      }
    }
    // Fallback to default location
    return {
      name: 'Olney, Philadelphia',
      latitude: 40.03,
      longitude: -75.13,
    };
  };

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [location, setLocation] = useState(loadDefaultLocation);

  // Load default location on mount
  useEffect(() => {
    const defaultLocation = loadDefaultLocation();
    setLocation(defaultLocation);
  }, []);

  // Reload default location when page becomes visible (e.g., returning from settings)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        const defaultLocation = loadDefaultLocation();
        setLocation(defaultLocation);
      }
    };

    const handleFocus = () => {
      const defaultLocation = loadDefaultLocation();
      setLocation(defaultLocation);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) return;

    try {
      // Using Open-Meteo's Geocoding API
      const geoApiUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(searchQuery)}&count=5&language=en&format=json`;
      const response = await fetch(geoApiUrl);

      if (!response.ok) {
        throw new Error(`Geocoding API error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.results) {
        setSearchResults(data.results);
        // Automatically select the first result for the weather cards
        if (data.results.length > 0) {
          setLocation(data.results[0]);
        }
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.error("Failed to fetch location data:", error);
      setSearchResults([]);
    }
  }, [searchQuery]);

  return (
    <>

      <Navbar
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
        onSearch={handleSearch}
      />

      <main className="main-content">
        <SearchResults results={searchResults} onSelectLocation={setLocation} />
        <WeatherCards location={location} />
      </main>
      
    </>
  );
}