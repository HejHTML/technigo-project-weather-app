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
    "light rain": "Lätt regn",
    "moderate rain": "Måttligt regn",
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
// Funktion för att välja egen ikon baserat på väder
function getCustomIcon(description) {
    const desc = description.toLowerCase();
    if (desc.includes("rain") || desc.includes("drizzle")) return "☂️";       // paraply
    if (desc.includes("clear")) return "🕶️";                                // solglasögon
    if (desc.includes("cloud")) return "☁️";                                 // moln
    if (desc.includes("snow")) return "❄️";                                  // snö
    if (desc.includes("thunderstorm")) return "🌩️";                         // åskväder
    return "🌤️"; // standardikon
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

document.querySelectorAll(".fav-city").forEach(btn => {
    btn.addEventListener("click", () => {
        const displayName = btn.textContent.trim();
        getWeather(getCityForApi(displayName), displayName);
    });
});

function getWeather(apiCity, displayName) {
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(
        `https://api.openweathermap.org/data/2.5/weather?q=${apiCity}&units=metric&lang=en&appid=${apiKey}`
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
            weatherContainer.innerHTML = ""; // Rensa tidigare kort

            const description = weatherMap[data.weather[0].description] || data.weather[0].description;
            const theme = getTheme(data.weather[0].description);
            const weatherIcon = getCustomIcon(data.weather[0].description);
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
          <p class="sunset">Solnedgång: ${sunset}</p></div>
          <p class="weather-detail">Det är  ${description.toLowerCase()} ute just nu.</p>
        </div>
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
