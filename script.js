const apiKey = "1ea2dcad17037699b9909b51194ec2da";

// Tabell med specialfall och landskoder
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

// Fallback: ersätter å, ä, ö
function normalizeCity(name) {
    return name
        .replace(/å/gi, "a")
        .replace(/ä/gi, "a")
        .replace(/ö/gi, "o");
}

const weatherMap = {
    "light rain": "Lätt regn",
    "moderate rain": "Måttligt regn",
    "heavy rain": "Kraftigt regn",
    "clear sky": "Klart väder",
    "few clouds": "Lite moln",
    "scattered clouds": "Spridda moln",
    "broken clouds": "Halvklart",
    "overcast clouds": "Mulet",
    "snow": "Snö",
    "thunderstorm": "Åskväder",
    "mist": "Dimma"
};

// Dynamisk tema baserat på väderbeskrivning
function getTheme(description) {
    const desc = description.toLowerCase();
    if (desc.includes("rain") || desc.includes("drizzle") || desc.includes("thunderstorm")) return "rain";
    if (desc.includes("cloud") || desc.includes("overcast")) return "cloudy";
    return "sunny";
}

// Hämtar rätt stad att skicka till API
function getCityForApi(name) {
    return cityMap[name] || normalizeCity(name);
}

// Sökknapp
document.getElementById("searchBtn").addEventListener("click", () => {
    let input = document.getElementById("cityInput").value.trim();
    if (input) {
        let apiCity = getCityForApi(input);
        getWeather(apiCity, input);
    }
});

// Klick på favoritstad
document.querySelectorAll(".fav-city").forEach(item => {
    item.addEventListener("click", () => {
        const displayName = item.textContent.trim();
        const apiCity = getCityForApi(displayName);
        getWeather(apiCity, displayName);
    });
});

// Hämta väder och skapa kort med dynamiskt tema
function getWeather(apiCity, displayName) {
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(
        `https://api.openweathermap.org/data/2.5/weather?q=${apiCity}&units=metric&lang=en&appid=${apiKey}`
    )}`;

    fetch(proxyUrl)
        .then(response => response.json())
        .then(data => {
            if (data.cod === 200) {
                const weatherContainer = document.getElementById("weather");

                const description = weatherMap[data.weather[0].description] || data.weather[0].description;
                const theme = getTheme(data.weather[0].description);
                const iconUrl = `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`;
                const windDeg = data.wind.deg;
                const windSpeed = Math.round(data.wind.speed);
                // Sunrise & Sunset
                const sunrise = new Date(data.sys.sunrise * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                const sunset = new Date(data.sys.sunset * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                // Skapa kort
                const card = document.createElement("div");
                card.className = `weather-card ${theme}`;
                card.innerHTML = `
                    <div class="weather-header">${displayName}, idag</div>
                    <div class="weather-icon"><img src="${iconUrl}" alt="${description}"></div>
                    <div class="weather-text"><h2>${description}, ${data.main.temp.toFixed(1)} °C</h2></div>
                    <ul class="forecast"></ul>
                    <p>Vind: ${windSpeed} m/s <span class="wind-arrow" style="display:inline-block; transform: rotate(${windDeg}deg);">➤</span></p>
                    <p>Luftfuktighet: ${data.main.humidity}%</p>
                     <p>Sol upp: ${sunrise}</p>
                    <p>Sol ned: ${sunset}</p>
                `;
                weatherContainer.appendChild(card);

                // Hämta 4-dagars prognos
                getForecast(apiCity, card.querySelector(".forecast"));
            } else {
                alert(`Stad "${displayName}" hittades inte.`);
            }
        })
        .catch(error => {
            console.error("Fel vid hämtning:", error);
        });
}

// 4-dagars prognos för specifikt kort
function getForecast(apiCity, forecastElement) {
    const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${apiCity}&units=metric&appid=${apiKey}`;
    fetch(forecastUrl)
        .then(res => res.json())
        .then(data => {
            const daily = data.list.filter(item => item.dt_txt.includes("12:00:00")).slice(0, 4);
            let html = "";
            daily.forEach(day => {
                const date = new Date(day.dt * 1000).toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'numeric' });
                const tempMin = day.main.temp_min.toFixed(1);
                const tempMax = day.main.temp_max.toFixed(1);
                const iconUrl = `https://openweathermap.org/img/wn/${day.weather[0].icon}.png`;
                const description = weatherMap[day.weather[0].description] || day.weather[0].description;

                html += `
                    <li>
                        <span>${date}</span>
                        <img src="${iconUrl}" alt="${description}" style="width:30px;">
                        <span>${description}</span>
                        <span>${tempMin}°C - ${tempMax}°C</span>
                    </li>
                `;
            });
            forecastElement.innerHTML = html;
        })
        .catch(err => console.error("Fel vid hämtning av prognos:", err));
}
