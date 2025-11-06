import { useState, useCallback } from 'react';
import SearchResults from '../components/SearchResults';
import WeatherCards from '../components/WeatherCards';
import Navbar from '../components/Navbar';

export default function Dashboard() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [location, setLocation] = useState({
    name: 'Olney, Philadelphia',
    latitude: 40.03,
    longitude: -75.13,
  });

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