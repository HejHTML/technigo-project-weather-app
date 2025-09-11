const apiKey = "1ea2dcad17037699b9909b51194ec2da"; // din API-nyckel

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
    "thunderstorm": "Åskväder"
};

// Hämtar rätt stad att skicka till API
function getCityForApi(name) {
    return cityMap[name] || normalizeCity(name);
}

// Sökknapp
document.getElementById("searchBtn").addEventListener("click", () => {
    let input = document.getElementById("cityInput").value.trim();
    if (input) {
        let apiCity = getCityForApi(input);  // Engelskt/stad+landkod
        getWeather(apiCity, input);          // displayName = det användaren skrev
    }
});

// Klick på favoritstad
document.querySelectorAll(".fav-city").forEach(item => {
    item.addEventListener("click", () => {
        const displayName = item.textContent.trim();     // användarens namn
        const apiCity = getCityForApi(displayName);      // engelskt/stad+landkod
        getWeather(apiCity, displayName);
    });
});

// Funktion för att hämta vädret via proxy
function getWeather(apiCity, displayName) {
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(
        `https://api.openweathermap.org/data/2.5/weather?q=${apiCity}&units=metric&lang=en&appid=${apiKey}`
    )}`;

    fetch(proxyUrl)
        .then(response => response.json())
        .then(data => {
            const weatherDiv = document.getElementById("weather");

            if (data.cod === 200) {
                const iconUrl = `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`;
                const windDeg = data.wind.deg;
                const windSpeed = Math.round(data.wind.speed);

                // Översättning till svenska
                const weatherMap = {
                    "clear sky": "Klart väder",
                    "few clouds": "Lite moln",
                    "scattered clouds": "Spridda moln",
                    "broken clouds": "Halvklart",
                    "overcast clouds": "Mulet",
                    "light rain": "Lätt regn",
                    "moderate rain": "Måttligt regn",
                    "heavy rain": "Kraftigt regn",
                    "thunderstorm": "Åskväder",
                    "snow": "Snö",
                    "mist": "Dimma"
                };

                let description = weatherMap[data.weather[0].description] || data.weather[0].description;

                weatherDiv.innerHTML = `
                    <h2>${displayName}</h2>
                    <img src="${iconUrl}" alt="${description}">
                    <p>${data.main.temp.toFixed(1)} °C</p>
                    <p>${description}</p>
                    <p>💨 Vind: ${windSpeed} m/s 
                        <span class="wind-arrow" style="display:inline-block; transform: rotate(${windDeg}deg);">➤</span>
                    </p>
                    <p>💧 Luftfuktighet: ${data.main.humidity}%</p>
                `;
            } else {
                weatherDiv.innerHTML = `<p>❌ Stad hittades inte</p>`;
            }
        })
        .catch(error => {
            console.error("Fel vid hämtning:", error);
            document.getElementById("weather").innerHTML = `<p>⚠️ Tekniskt fel</p>`;
        });
}
// Funktion för att hämta antal personer i rymden
function getPeopleInSpace() {
    fetch("http://api.open-notify.org/astros.json")
        .then(response => response.json())
        .then(data => {
            if (data.message === "success") {
                const spaceDiv = document.getElementById("space");
                let html = `<h2>🌌 Människor i rymden just nu: ${data.number}</h2><ul>`;

                data.people.forEach(person => {
                    html += `<li>${person.name} på ${person.craft}</li>`;
                });

                html += `</ul>`;
                spaceDiv.innerHTML = html;
            }
        })
        .catch(error => {
            console.error("Fel vid hämtning av rymddata:", error);
            document.getElementById("space").innerHTML = `<p>⚠️ Kunde inte hämta rymddata</p>`;
        });
}
document.getElementById("spaceBtn").addEventListener("click", getPeopleInSpace);
