import { useState, useCallback, useEffect } from 'react';
import SearchResults from '../components/SearchResults';
import WeatherCards from '../components/WeatherCards';
import Navbar from '../components/Navbar';

export default function Dashboard() {

  // Tracks what the user types in the search bar
  const [searchQuery, setSearchQuery] = useState('');

  // Stores the array of results coming back from the geocoding API
  const [searchResults, setSearchResults] = useState([]);

  // The simplified weather category used to update the background
  const [weatherType, setWeatherType] = useState('default');

  // The currently selected location object { name, latitude, longitude }
  const [location, setLocation] = useState(() => {
    // On first load, try to load the default location saved in settings
    const saved = localStorage.getItem('defaultLocationData');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Make sure the saved object has the required fields
        if (parsed.name && parsed.latitude && parsed.longitude) {
          return parsed;
        }
      } catch (e) {
        console.error('Could not read saved default location', e);
      }
    }

    // If nothing valid is in storage, use this fallback location
    return {
      name: 'Olney, Philadelphia',
      latitude: 40.03,
      longitude: -75.13,
    };
  });

  /**
   * This effect runs once when the page loads.
   * It checks again for an updated default location in case the user
   * changed it in a different browser tab or window.
   */
  useEffect(() => {
    const saved = localStorage.getItem('defaultLocationData');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.name && parsed.latitude && parsed.longitude) {
          setLocation(parsed);
        }
      } catch (e) {
        console.error('Could not load updated default location', e);
      }
    }
  }, []);

  /**
   * This effect changes the background of the whole website based on the weather type.
   * Steps:
   * 1. Remove all possible weather classes
   * 2. Add the new class for the current weather type
   * 3. Cleanup when the component unmounts
   */
  useEffect(() => {
    document.body.classList.remove(
      'weather-clear',
      'weather-cloudy',
      'weather-rain',
      'weather-snow',
      'weather-thunderstorm',
      'weather-hot',
      'weather-cold',
      'weather-default'
    );

    if (weatherType) {
      document.body.classList.add(`weather-${weatherType}`);
    }

    return () => {
      document.body.classList.remove(
        'weather-clear',
        'weather-cloudy',
        'weather-rain',
        'weather-snow',
        'weather-thunderstorm',
        'weather-hot',
        'weather-cold',
        'weather-default'
      );
    };
  }, [weatherType]);

  /**
   * Called when the user presses enter or clicks search in the Navbar.
   * It:
   * - Sends the searchQuery to the Open-Meteo geocoding API
   * - Filters results to only keep valid ones
   * - Saves them to searchResults
   * - Automatically selects the first valid result for WeatherCards
   */
  const handleSearch = useCallback(async () => {
    // If the search box is empty, clear the results
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      // Build the API url
      const url =
        `https://geocoding-api.open-meteo.com/v1/search?` +
        `name=${encodeURIComponent(searchQuery)}&count=5&language=en&format=json`;

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Geocoding API error, status: ${response.status}`);
      }

      const data = await response.json();

      // The API sometimes returns an error object instead of results
      if (data.error) {
        throw new Error(data.reason || 'Geocoding API returned an error');
      }

      // Make sure results is an array before using it
      if (Array.isArray(data.results)) {
        // Only keep results that contain the required fields
        const valid = data.results.filter(item =>
          item.name &&
          typeof item.latitude === 'number' &&
          typeof item.longitude === 'number'
        );

        setSearchResults(valid);

        // Auto-select the first valid result for weather data
        if (valid.length > 0) {
          setLocation(valid[0]);
        }
      } else {
        setSearchResults([]);
      }

    } catch (error) {
      console.error('Could not fetch geocoding results', error);
      setSearchResults([]);
    }
  }, [searchQuery]);

  return (
    <>
      {/* Navbar handles the search bar and search button */}
      <Navbar
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
        onSearch={handleSearch}
        searchAllowed={true}
      />

      <main className="main-content">

        {/* Shows clickable search results from the API */}
        <SearchResults
          results={searchResults}
          onSelectLocation={setLocation}
        />

        {/* Fetches and displays weather for the selected location */}
        {/* weatherType gets sent back to Dashboard through onWeatherChange */}
        <WeatherCards
          location={location}
          onWeatherChange={setWeatherType}
        />

      </main>
    </>
  );
}
