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
        `https://api.openweathermap.org/data/2.5/weather?q=${apiCity}&units=metric&lang=se&appid=${apiKey}`
    )}`;

    fetch(proxyUrl)
        .then(response => response.json())
        .then(data => {
            const weatherDiv = document.getElementById("weather");

            if (data.cod === 200) {
                const iconUrl = `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`;
                const windDeg = data.wind.deg; // vindriktning i grader
                const windSpeed = Math.round(data.wind.speed);

                weatherDiv.innerHTML = `
                    <h2>${displayName}</h2>
                    <img src="${iconUrl}" alt="${data.weather[0].description}">
                    <p>${data.main.temp.toFixed(1)} °C</p>
                    <p>${data.weather[0].description}</p>
                    <p>
                        💨 Vind: ${windSpeed} m/s 
                        <span class="wind-arrow" style="display:inline-block; transform: rotate(${windDeg}deg);">
                            ➤
                        </span>
                    </p>
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
