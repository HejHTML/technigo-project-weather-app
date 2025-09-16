const apiKey = "1ea2dcad17037699b9909b51194ec2da";

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

    if (desc.includes("rain")) return `Ta regnjackan – det regnar och temperaturen är ${temp.toFixed(0)} grader.`;
    if (desc.includes("clear")) return `Solen skiner - kom ihåg solskydd! Det är ${temp.toFixed(0)} grader ute.`;
    if (desc.includes("cloud")) return `Molnigt och  ${temp.toFixed(0)} grader.`;
    if (desc.includes("snow")) return `Snöfall väntas – ta fram snöskyffeln och bygg en ljuslykta! Temperaturen är ${temp.toFixed(0)} grader.`;
    if (desc.includes("thunderstorm")) return `Åska i luften! Temperaturen ligger runt ${temp.toFixed(0)} grader.`;

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

function getCityForApi(name) {
    return cityMap[name] || normalizeCity(name);
}

document.getElementById("searchBtn").addEventListener("click", () => {
    const input = document.getElementById("cityInput").value.trim();
    if (input) getWeather(getCityForApi(input), input);
});
document.getElementById("cityInput").addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
        event.preventDefault(); // hindrar att sidan laddas om (om input ligger i ett form)
        const input = event.target.value.trim();
        if (input) getWeather(getCityForApi(input), input);
    }
});

document.querySelectorAll(".fav-city").forEach(btn => {
    btn.addEventListener("click", () => {
        const displayName = btn.textContent.trim();
        getWeather(getCityForApi(displayName), displayName);
    });
});

const locBtn = document.getElementById("locBtn");
if (locBtn) {
    locBtn.addEventListener("click", getLocationWeather);
}

function getWeather(apiCity, displayName) {
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(
        `https://api.openweathermap.org/data/2.5/weather?q=${apiCity}&units=metric&appid=${apiKey}`
    )}`;

    fetch(proxyUrl)
        .then(res => res.json())
        .then(data => {
            if (data.cod !== 200) {
                alert(`Stad "${displayName}" hittades inte.`);
                return;
            }

            document.querySelector("h1").textContent = displayName;

            const weatherContainer = document.getElementById("weather");
            weatherContainer.innerHTML = "";

            const rawDescription = data.weather[0].description; // engelska
            const description = weatherMap[rawDescription] || rawDescription; // svenska
            const theme = getTheme(rawDescription);

            const weatherIcon = getCustomIcon(rawDescription);
            const windDeg = data.wind.deg;
            const windSpeed = Math.round(data.wind.speed);
            const sunrise = new Date(data.sys.sunrise * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const sunset = new Date(data.sys.sunset * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            const card = document.createElement("div");
            card.className = `weather-card ${theme}`;
            card.innerHTML = `
        <div class="weather-header-left">
          <div class="top-row">
            <p>${description} |</p>
            <p>${data.main.temp.toFixed(1)}°C</p>
          </div>
          <p class="sunrise">Soluppgång: ${sunrise}</p>
          <p class="sunset">Solnedgång: ${sunset}</p>
        </div>
        <p class="weather-detail">${getCustomDescription(rawDescription, data.main.temp)}</p>
        <div class="weather-main">
          <div class="weather-icon">${weatherIcon}</div>
          <p>Vind: ${windSpeed} m/s <span class="wind-arrow" style="display:inline-block; transform: rotate(${windDeg}deg);">➤</span></p>
          <p>Luftfuktighet: ${data.main.humidity}%</p>
          <ul class="forecast"></ul>
        </div>
      `;
            weatherContainer.appendChild(card);

            getForecast(apiCity, card.querySelector(".forecast"));
        })
        .catch(err => console.error("Fel vid hämtning:", err));
}

function getForecast(apiCity, forecastElement) {
    const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${apiCity}&units=metric&appid=${apiKey}`;
    fetch(forecastUrl)
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

function getLocationWeather() {
    if (!navigator.geolocation) {
        alert("Geolocation stöds inte i din webbläsare.");
        return;
    }

    document.querySelector("h1").textContent = "Din plats";
    document.getElementById("weather").innerHTML = `<p>⏳ Hämtar väder för din plats...</p>`;
    document.querySelector(".forecast") && (document.querySelector(".forecast").innerHTML = "");

    const options = { enableHighAccuracy: false, timeout: 10000, maximumAge: 0 };
    navigator.geolocation.getCurrentPosition(function (position) {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        getWeatherByCoords(lat, lon);
    }, function (err) {
        console.warn(`Geolocation error (${err.code}): ${err.message}`);
        alert("Kunde inte hämta din plats: " + err.message + ". Visar Stockholm som fallback.");
        getWeather(getCityForApi("Stockholm"), "Stockholm");
    }, options);
}

function getWeatherByCoords(lat, lon) {
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`
    )}`;

    fetch(proxyUrl)
        .then(res => res.json())
        .then(data => {
            if (data.cod !== 200) {
                alert("Kunde inte hämta väder för din plats.");
                return;
            }

            const displayName = data.name || "Din plats";
            document.querySelector("h1").textContent = displayName;

            const weatherContainer = document.getElementById("weather");
            weatherContainer.innerHTML = "";

            const rawDescription = data.weather[0].description;
            const description = weatherMap[rawDescription] || rawDescription;
            const theme = getTheme(rawDescription);

            const weatherIcon = getCustomIcon(rawDescription);
            const windDeg = data.wind.deg;
            const windSpeed = Math.round(data.wind.speed);
            const sunrise = new Date(data.sys.sunrise * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const sunset = new Date(data.sys.sunset * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            const card = document.createElement("div");
            card.className = `weather-card ${theme}`;
            card.innerHTML = `
        <div class="weather-header-left">
          <div class="top-row">
            <p>${description} |</p>
            <p>${data.main.temp.toFixed(1)}°C</p>
          </div>
          <p class="sunrise">Soluppgång: ${sunrise}</p>
          <p class="sunset">Solnedgång: ${sunset}</p>
        </div>
        <p class="weather-detail">${getCustomDescription(rawDescription, data.main.temp)}</p>
        <div class="weather-main">
          <div class="weather-icon">${weatherIcon}</div>
          <p>Vind: ${windSpeed} m/s <span class="wind-arrow" style="display:inline-block; transform: rotate(${windDeg}deg);">➤</span></p>
          <p>Luftfuktighet: ${data.main.humidity}%</p>
          <ul class="forecast"></ul>
        </div>
      `;
            weatherContainer.appendChild(card);

            getForecastByCoords(lat, lon, card.querySelector(".forecast"));
        })
        .catch(err => {
            console.error("Fel vid geolocation-väder:", err);
            alert("Tekniskt fel vid hämtning av platsens väder.");
        });
}

function getForecastByCoords(lat, lon, forecastElement) {
    const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`;
    fetch(forecastUrl)
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
