import { useState, useEffect } from 'react';

export default function WeatherCards({ location }) {
  // Component State Management
  const [weatherData, setWeatherData] = useState([]);
  const [forecastDate, setForecastDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [filters, setFilters] = useState({
    good: true,
    bad: true,
    unsuitable: false,
  });

  // Fetch and process weather data on component mount
  useEffect(() => {
    if (!location) return;

    const fetchWeatherData = async () => {
      const { latitude, longitude } = location;

      const apiUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&hourly=temperature_2m,weather_code&temperature_unit=fahrenheit&wind_speed_unit=mph&precipitation_unit=inch&forecast_days=1`;

      try {
        setLoading(true);
        setError(null); // Reset error state on new fetch
        const response = await fetch(apiUrl);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();

        // Set the forecast date from the first timestamp in the response
        if (data.hourly?.time?.length > 0) {
          const date = new Date(data.hourly.time[0]);
          setForecastDate(date.toLocaleDateString(undefined, {
            weekday: 'long',
            month: 'long',
            day: 'numeric'
          }));
        } else {
          setForecastDate('');
        }

        // Transform API data into a structured format for the UI
        const transformedData = data.hourly.time.map((time, index) => {
          const weatherCode = data.hourly.weather_code[index];
          const temp = data.hourly.temperature_2m[index];

          let cardClass = 'good';
          let condition = 'Good Conditions';
          let icon = '☀️'; // Default

          // Determine card style and content based on WMO weather code and temperature
          if (weatherCode >= 95) { // Thunderstorm
            cardClass = 'unsuitable';
            condition = 'Unsuitable Conditions';
            icon = '⚡';

          } else if (temp > 95 || temp < 32) { // Extreme Temperature
            cardClass = 'unsuitable';
            condition = 'Unsuitable Conditions';
            icon = temp > 95 ? '🔥' : '❄️';

          } else if (weatherCode >= 51 && weatherCode <= 67) { // Drizzle, Rain
            cardClass = 'bad';
            condition = 'Bad Conditions';
            icon = '🌧️';

          } else if (weatherCode >= 71 && weatherCode <= 77) { // Snow
            cardClass = 'bad';
            condition = 'Bad Conditions';
            icon = '❄️';

          } else if (weatherCode >= 80) { // Rain showers
            cardClass = 'bad';
            condition = 'Bad Conditions';
            icon = '🌧️';
            
          } else {
            // Good or neutral conditions
            if (weatherCode === 0) { // Clear sky
              icon = '☀️';
            } else if (weatherCode >= 1 && weatherCode <= 3) { // Mainly clear, partly cloudy, and overcast
              icon = '☁️';
            }
          }

          return {
            id: time,
            time: new Date(time).toLocaleTimeString([], { hour: 'numeric', hour12: true }),
            temp: `${Math.round(temp)}°`,
            icon: icon,
            condition: condition,
            tasks: [], // Initialize tasks as an empty array
            cardClass: cardClass,
          };
        });

        setWeatherData(transformedData);
      } catch (e) {
        setError(e.message);
        console.error("Failed to fetch weather data:", e);
      } finally {
        setLoading(false);
      }
    };

    fetchWeatherData();
  }, [location]); // Re-run effect when location prop changes

  // Handler for updating filter state based on checkbox interaction
  const handleFilterChange = (event) => {
    const { name, checked } = event.target;
    setFilters((prevFilters) => ({ ...prevFilters, [name]: checked }));
  };

  // Handler for new task input changes
  const handleTaskInputChange = (id, value) => {
    setWeatherData(currentData =>
      currentData.map(item =>
        item.id === id ? { ...item, newTaskInput: value } : item
      )
    );
  };

  // Handler for adding a new task
  const handleAddTask = (id) => {
    setWeatherData(currentData =>
      currentData.map(item => {
        if (item.id === id && item.newTaskInput?.trim()) {
          // Add the new task and clear the input field
          return { ...item, tasks: [...item.tasks, item.newTaskInput], newTaskInput: '' };
        }
        return item;
      })
    );
  };

  // Handler for deleting a task
  const handleDeleteTask = (id, taskIndex) => {
    setWeatherData(currentData =>
      currentData.map(item => {
        if (item.id === id) {
          // Filter out the task by its index
          const updatedTasks = item.tasks.filter((_, index) => index !== taskIndex);
          return { ...item, tasks: updatedTasks };
        }
        return item;
      })
    );
  };

  // Apply filters to the weather data before rendering
  const filteredWeatherData = weatherData.filter((weather) => filters[weather.cardClass]);

  // Render error message if data fetching fails
  if (error) {
    return <div className="weather-section"><div className="error-message">Error: {error}</div></div>;
  }

  // Main component render
  return (
    <section className="weather-section" aria-labelledby="location-heading">
      
      <div className="location-header">
        <h2 id="location-heading">{location?.name ? `${location.name} - ${forecastDate}` : 'Select a location'}</h2>
      </div>

      <div className="condition-filters">

        <label className="filter-checkbox good-check">
          <input
            type="checkbox"
            name="good"
            checked={filters.good}
            onChange={handleFilterChange}
          />
          <span>Good Conditions</span>
        </label>
        
        <label className="filter-checkbox bad-check">
          <input
            type="checkbox"
            name="bad"
            checked={filters.bad}
            onChange={handleFilterChange}
          />
          <span>Bad Conditions</span>
        </label>

        <label className="filter-checkbox unsuitable-check">
          <input
            type="checkbox"
            name="unsuitable"
            checked={filters.unsuitable}
            onChange={handleFilterChange}
          />
          <span>Unsuitable Conditions</span>
        </label>

      </div>

      <div role="status" className="weather-cards">

        {loading ? (
          <div className="loading-spinner">Loading weather...</div>
          
        ) : filteredWeatherData.length === 0 ? (
          <div className="no-results">No weather data matches the selected filters.</div>

        ) : (filteredWeatherData.map((weather) => (
          <article key={weather.id} className={`weather-card ${weather.cardClass}`}>

            <figure className="weather-icon" aria-label={weather.condition}>
              {weather.icon}
            </figure>
            
            <p className="weather-time">{weather.time}</p>
            <p className="weather-temp">{weather.temp}</p>

            <section className="weather-tasks">
              <h3 className="tasks-label">Tasks ({weather.tasks.length})</h3>
              {weather.cardClass === 'unsuitable' ? (
                <p className="tasks-content">Unavailable</p>
              ) : weather.tasks.length > 0 ? (
                <ul className="tasks-list">
                  {weather.tasks.map((task, index) => (
                    <li key={index} className="task-item">
                      <span>{task}</span>
                      <button onClick={() => handleDeleteTask(weather.id, index)} className="delete-task-button" aria-label={`Delete task: ${task}`}>❌</button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="tasks-content">No tasks yet.</p>
              )}
            </section>

            {weather.cardClass !== 'unsuitable' && (
              <div className="create-task-container">
                <input
                  type="text"
                  className="task-input"
                  placeholder="Enter a new task..."
                  value={weather.newTaskInput || ''}
                  onChange={(e) => handleTaskInputChange(weather.id, e.target.value)}
                />
                <button className="create-task-button" onClick={() => handleAddTask(weather.id)}>Create Task</button>
              </div>
            )}
            
          </article>
        )))}
        
      </div>

    </section>
  );
}
