const apiKey = "1ea2dcad17037699b9909b51194ec2da";

/* Stadskarta & normalisering */
const cityMap = {
    "Stockholm": "Stockholm,SE",
    "Göteborg": "Gothenburg,SE",
    "Malmö": "Malmo,SE",
    "Umeå": "Umea,SE",
    "Sundsvall": "Sundsvall,SE",
    "Narvik": "Narvik,NO",
    "London": "London,GB",
    "New York": "New York,US",
    "Paris": "Paris,FR"
};

function normalizeCity(name) {
    return name.replace(/å/gi, "a").replace(/ä/gi, "a").replace(/ö/gi, "o");
}

function getCityForApi(name) {
    return cityMap[name] || normalizeCity(name);
}

/* Översättning & custom text/ikoner */
const weatherMap = {
    "light rain": "Duggregn",
    "moderate rain": "Måttligt regn",
    "light drizzle": "Duggregn",
    "heavy rain": "Kraftigt regn",
    "clear sky": "Klart väder",
    "few clouds": "Lite molnigt",
    "scattered clouds": "Spridda moln",
    "broken clouds": "Halvklart",
    "overcast clouds": "Mulet",
    "snow": "Snö",
    "thunderstorm": "Åskväder",
    "mist": "Dimma"
};

function getCustomDescription(description, temp) {
    const desc = description.toLowerCase();
    if (desc.includes("rain")) return `Ta regnjacka eller paraply – det regnar och temperaturen är ${temp.toFixed(0)}°C.`;
    if (desc.includes("clear")) return `Solen skiner - kom ihåg solskydd! ${temp.toFixed(0)}°C.`;
    if (desc.includes("cloud")) return `Molnigt och ${temp.toFixed(0)}°C.`;
    if (desc.includes("snow")) return `Snöfall väntas – temperatur ${temp.toFixed(0)}°C.`;
    if (desc.includes("thunderstorm")) return `Åska i luften! Cirka ${temp.toFixed(0)}°C.`;
    return `Just nu är det ${description.toLowerCase()} och ${temp.toFixed(1)}°C.`;
}

function getCustomIcon(description) {
    const desc = description.toLowerCase();
    if (desc.includes("rain") || desc.includes("drizzle")) return "☂️";
    if (desc.includes("clear")) return "🕶️";
    if (desc.includes("cloud")) return "☁️";
    if (desc.includes("snow")) return "❄️";
    if (desc.includes("thunderstorm")) return "🌩️";
    return "🌤️";
}

function getTheme(description) {
    const desc = description.toLowerCase();
    if (desc.includes("rain") || desc.includes("drizzle") || desc.includes("thunderstorm")) return "rain";
    if (desc.includes("cloud") || desc.includes("overcast")) return "cloudy";
    return "sunny";
}

/* DOM-element */
const weatherContainer = document.getElementById("weather");
const searchInput = document.getElementById("cityInput");
const searchBtn = document.getElementById("searchBtn");
const favBtns = document.querySelectorAll(".fav-city");
const locBtn = document.getElementById("locBtn");
const h1Title = document.querySelector("h1");

/* Event listeners */
searchBtn.addEventListener("click", () => {
    const input = searchInput.value.trim();
    if (input) getWeather(getCityForApi(input), input);
});

searchInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
        event.preventDefault();
        const input = event.target.value.trim();
        if (input) getWeather(getCityForApi(input), input);
    }
});

favBtns.forEach(btn => {
    btn.addEventListener("click", () => {
        const city = btn.textContent.trim();
        getWeather(getCityForApi(city), city);
    });
});

if (locBtn) {
    locBtn.addEventListener("click", getLocationWeather);
}

/* Huvudfunktion: hämta väder */
function getWeather(apiCity, displayName) {
    const url = `https://api.allorigins.win/raw?url=${encodeURIComponent(
        `https://api.openweathermap.org/data/2.5/weather?q=${apiCity}&units=metric&appid=${apiKey}`
    )}`;

    fetch(url)
        .then(res => res.json())
        .then(data => {
            if (data.cod !== 200) {
                alert(`Stad "${displayName}" hittades inte.`);
                return;
            }

            h1Title.textContent = displayName;
            weatherContainer.innerHTML = "";

            const rawDesc = data.weather[0].description;
            const description = weatherMap[rawDesc] || rawDesc;
            const theme = getTheme(rawDesc);
            const weatherIcon = getCustomIcon(rawDesc);
            const windDeg = data.wind.deg;
            const windSpeed = Math.round(data.wind.speed);
            const sunrise = new Date(data.sys.sunrise * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const sunset = new Date(data.sys.sunset * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            const card = createWeatherCard(description, rawDesc, data.main.temp, weatherIcon, theme, windSpeed, windDeg, data.main.humidity, sunrise, sunset);
            weatherContainer.appendChild(card);

            getForecast(apiCity, card.querySelector(".forecast"));
        })
        .catch(err => console.error("Fel vid hämtning:", err));
}

/* Skapa kort */
function createWeatherCard(desc, rawDesc, temp, icon, theme, windSpeed, windDeg, humidity, sunrise, sunset) {
    const card = document.createElement("div");
    card.className = `weather-card ${theme}`;
    card.innerHTML = `
        <div class="weather-header-left">
            <div class="top-row">
                <p>${desc} |</p>
                <p>${temp.toFixed(1)}°C</p>
            </div>
            <p class="sunrise">Soluppgång: ${sunrise}</p>
            <p class="sunset">Solnedgång: ${sunset}</p>
        </div>
        <p class="weather-detail">${getCustomDescription(rawDesc, temp)}</p>
        <div class="weather-main">
            <div class="weather-icon">${icon}</div>
            <p>Vind: ${windSpeed} m/s <span class="wind-arrow" style="display:inline-block; transform: rotate(${windDeg}deg);">➤</span></p>
            <p>Luftfuktighet: ${humidity}%</p>
            <ul class="forecast"></ul>
        </div>
    `;
    return card;
}

/* Prognos */
function getForecast(apiCity, forecastElement) {
    const url = `https://api.openweathermap.org/data/2.5/forecast?q=${apiCity}&units=metric&appid=${apiKey}`;
    fetch(url)
        .then(res => res.json())
        .then(data => {
            const daily = data.list.filter(item => item.dt_txt.includes("12:00:00")).slice(0, 4);
            let html = "";
            daily.forEach(day => {
                const date = new Date(day.dt * 1000).toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'numeric' });
                const tempAvg = ((day.main.temp_min + day.main.temp_max) / 2).toFixed(0);
                const iconUrl = `https://openweathermap.org/img/wn/${day.weather[0].icon}.png`;
                const description = weatherMap[day.weather[0].description] || day.weather[0].description;

                html += `
                    <li>
                        <span>${date}</span>
                        <img src="${iconUrl}" alt="${description}">
                        <span>${description}</span>
                        <span>${tempAvg}°C</span>
                    </li>
                `;
            });
            forecastElement.innerHTML = html;
        })
        .catch(err => console.error("Fel vid hämtning av prognos:", err));
}

/* Hämta platsens väder */
function getLocationWeather() {
    if (!navigator.geolocation) {
        alert("Geolocation stöds inte i din webbläsare.");
        return;
    }

    h1Title.textContent = "Din plats";
    weatherContainer.innerHTML = `<p>⏳ Hämtar väder för din plats...</p>`;

    navigator.geolocation.getCurrentPosition(
        pos => getWeatherByCoords(pos.coords.latitude, pos.coords.longitude),
        err => {
            console.warn(`Geolocation error (${err.code}): ${err.message}`);
            alert("Kunde inte hämta din plats. Visar Stockholm som fallback.");
            getWeather(getCityForApi("Stockholm"), "Stockholm");
        },
        { enableHighAccuracy: false, timeout: 10000, maximumAge: 0 }
    );
}

function getWeatherByCoords(lat, lon) {
    const url = `https://api.allorigins.win/raw?url=${encodeURIComponent(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`
    )}`;

    fetch(url)
        .then(res => res.json())
        .then(data => {
            const displayName = data.name || "Din plats";
            h1Title.textContent = displayName;

            weatherContainer.innerHTML = "";

            const rawDesc = data.weather[0].description;
            const description = weatherMap[rawDesc] || rawDesc;
            const theme = getTheme(rawDesc);
            const weatherIcon = getCustomIcon(rawDesc);
            const windDeg = data.wind.deg;
            const windSpeed = Math.round(data.wind.speed);
            const sunrise = new Date(data.sys.sunrise * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const sunset = new Date(data.sys.sunset * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            const card = createWeatherCard(description, rawDesc, data.main.temp, weatherIcon, theme, windSpeed, windDeg, data.main.humidity, sunrise, sunset);
            weatherContainer.appendChild(card);

            getForecastByCoords(lat, lon, card.querySelector(".forecast"));
        })
        .catch(err => console.error("Fel vid geolocation-väder:", err));
}

function getForecastByCoords(lat, lon, forecastElement) {
    const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`;
    fetch(url)
        .then(res => res.json())
        .then(data => {
            const daily = data.list.filter(item => item.dt_txt.includes("12:00:00")).slice(0, 4);
            let html = "";
            daily.forEach(day => {
                const date = new Date(day.dt * 1000).toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'numeric' });
                const tempAvg = ((day.main.temp_min + day.main.temp_max) / 2).toFixed(0);
                const iconUrl = `https://openweathermap.org/img/wn/${day.weather[0].icon}.png`;
                const description = weatherMap[day.weather[0].description] || day.weather[0].description;

                html += `
                    <li>
                        <span>${date}</span>
                        <img src="${iconUrl}" alt="${description}">
                        <span>${description}</span>
                        <span>${tempAvg}°C</span>
                    </li>
                `;
            });
            forecastElement.innerHTML = html;
        })
        .catch(err => console.error("Fel vid hämtning av prognos (coords):", err));
}
