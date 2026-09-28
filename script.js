// Get HTML Elements
const searchForm = document.getElementById("searchForm");
const cityInput = document.getElementById("cityInput");
const searchButton = document.getElementById("searchButton");

const statusText = document.getElementById("status");
const weatherCard = document.getElementById("weatherCard");

const historyList = document.getElementById("historyList");
const emptyHistory = document.getElementById("emptyHistory");
const clearHistoryButton = document.getElementById("clearHistory");

// Search History
let history = JSON.parse(
    localStorage.getItem("weatherHistory") || "[]"
);

// Display Status Message
function showStatus(message, isError = false) {
    statusText.textContent = message;
    statusText.classList.toggle("error", isError);
}

// Weather Condition
function getWeatherCondition(code) {

    const weatherCodes = {
        0: ["Clear Sky", "☀️"],
        1: ["Mainly Clear", "🌤️"],
        2: ["Partly Cloudy", "⛅"],
        3: ["Overcast", "☁️"],
        45: ["Fog", "🌫️"],
        48: ["Fog", "🌫️"],
        51: ["Light Drizzle", "🌦️"],
        53: ["Drizzle", "🌦️"],
        55: ["Heavy Drizzle", "🌧️"],
        61: ["Light Rain", "🌦️"],
        63: ["Rain", "🌧️"],
        65: ["Heavy Rain", "🌧️"],
        71: ["Light Snow", "🌨️"],
        73: ["Snow", "❄️"],
        75: ["Heavy Snow", "❄️"],
        80: ["Rain Showers", "🌦️"],
        81: ["Rain Showers", "🌧️"],
        82: ["Heavy Showers", "⛈️"],
        95: ["Thunderstorm", "⛈️"],
        96: ["Thunderstorm with Hail", "⛈️"],
        99: ["Thunderstorm with Hail", "⛈️"]
    };

    return weatherCodes[code] || ["Unknown Weather", "🌡️"];
}

// Get Weather Details
async function getWeather(city) {

    if (city.trim() === "") {
        showStatus("Please enter a city name.", true);
        return;
    }

    try {

        // Loading State
        searchButton.disabled = true;
        showStatus("Loading weather...");
        weatherCard.classList.add("hidden");

        // Step 1: Get City Location
        const geoURL =
            `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`;

        const geoResponse = await fetch(geoURL);

        if (!geoResponse.ok) {
            throw new Error("Unable to connect to location service.");
        }

        const geoData = await geoResponse.json();

        if (!geoData.results || geoData.results.length === 0) {
            throw new Error("City not found. Please enter a valid city.");
        }

        const place = geoData.results[0];

        // Step 2: Get Weather Information
        const weatherURL =
            `https://api.open-meteo.com/v1/forecast?latitude=${place.latitude}&longitude=${place.longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,wind_speed_10m&timezone=auto`;

        const weatherResponse = await fetch(weatherURL);

        if (!weatherResponse.ok) {
            throw new Error("Unable to get weather information.");
        }

        const weatherData = await weatherResponse.json();

        const current = weatherData.current;

        if (!current) {
            throw new Error("Weather data is unavailable.");
        }

        // Display Weather
        displayWeather(place, current);

        // Add City to History
        addToHistory(place.name);

        showStatus("Weather updated successfully!");

    } catch (error) {

        // Error State
        showStatus(error.message, true);

    } finally {

        searchButton.disabled = false;

    }
}

// Display Weather Details
function displayWeather(place, current) {

    const condition = getWeatherCondition(current.weather_code);

    // City Name
    document.getElementById("placeName").textContent =
        [place.name, place.admin1, place.country]
            .filter(Boolean)
            .join(", ");

    // Date and Time
    document.getElementById("dateText").textContent =
        "Updated: " + current.time.replace("T", " ");

    // Weather Icon
    document.getElementById("weatherIcon").textContent =
        condition[1];

    // Temperature
    document.getElementById("temperature").textContent =
        Math.round(current.temperature_2m);

    // Weather Condition
    document.getElementById("condition").textContent =
        condition[0];

    // Feels Like
    document.getElementById("feelsLike").textContent =
        "Feels like " + Math.round(current.apparent_temperature) + "°C";

    // Humidity
    document.getElementById("humidity").textContent =
        current.relative_humidity_2m + "%";

    // Wind Speed
    document.getElementById("wind").textContent =
        current.wind_speed_10m + " km/h";

    // Temperature Details
    document.getElementById("temperatureDetail").textContent =
        Math.round(current.temperature_2m) + "°C";

    // Show Weather Card
    weatherCard.classList.remove("hidden");
}

// Add City to Search History
function addToHistory(city) {

    history = [
        city,
        ...history.filter(
            item => item.toLowerCase() !== city.toLowerCase()
        )
    ];

    // Keep only last 8 cities
    history = history.slice(0, 8);

    localStorage.setItem(
        "weatherHistory",
        JSON.stringify(history)
    );

    displayHistory();
}

// Display Search History
function displayHistory() {

    historyList.innerHTML = "";

    emptyHistory.hidden = history.length > 0;

    history.forEach(city => {

        const li = document.createElement("li");

        const button = document.createElement("button");

        button.textContent = city;
        button.type = "button";

        button.addEventListener("click", function () {
            getWeather(city);
        });

        li.appendChild(button);

        historyList.appendChild(li);

    });
}

// Clear Search History
clearHistoryButton.addEventListener("click", function () {

    history = [];

    localStorage.removeItem("weatherHistory");

    displayHistory();

    showStatus("Search history cleared.");

});

// Search Button Event
searchForm.addEventListener("submit", function (event) {

    event.preventDefault();

    const city = cityInput.value.trim();

    getWeather(city);

});

// Display Previous History
displayHistory();