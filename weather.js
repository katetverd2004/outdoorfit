
"use strict";

// Координаты Санкт-Петербурга
const WEATHER_API_URL =
  "https://api.open-meteo.com/v1/forecast" +
  "?latitude=59.9343" +
  "&longitude=30.3351" +
  "&current=temperature_2m,wind_speed_10m,weather_code" +
  "&timezone=Europe%2FMoscow";

const weatherStatus = document.getElementById("weatherStatus");
const weatherDetails = document.getElementById("weatherDetails");
const weatherTemp = document.getElementById("weatherTemp");
const weatherWind = document.getElementById("weatherWind");
const weatherCondition = document.getElementById("weatherCondition");
const weatherUpdated = document.getElementById("weatherUpdated");
const weatherIcon = document.getElementById("weatherIcon");
const weatherStat = document.getElementById("weatherStat");
const weatherStatNote = document.getElementById("weatherStatNote");
const refreshWeatherBtn = document.getElementById("refreshWeatherBtn");

function describeWeather(code) {
  if (code === 0) return "Ясно";
  if ([1, 2, 3].includes(code)) return "Облачно";
  if ([45, 48].includes(code)) return "Туман";
  if ([51, 53, 55, 56, 57].includes(code)) return "Морось";
  if ([61, 63, 65, 66, 67].includes(code)) return "Дождь";
  if ([71, 73, 75, 77, 85, 86].includes(code)) return "Снег";
  if ([80, 81, 82].includes(code)) return "Ливень";
  if ([95, 96, 99].includes(code)) return "Гроза";
  return "Неизвестные условия";
}

function getWeatherIcon(code) {
  if (code === 0) return "☀️";
  if ([1, 2, 3].includes(code)) return "☁️";
  if ([45, 48].includes(code)) return "🌫️";
  if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(code)) {
    return "🌧️";
  }
  if ([71, 73, 75, 77, 85, 86].includes(code)) return "❄️";
  if ([95, 96, 99].includes(code)) return "⛈️";
  return "🌤️";
}

function renderWeatherRecommendations(temperature, wind, code) {
  const container = document.getElementById("weatherRecommendations");
  const rules = window.PLANNER_DATA.weatherRecommendations;
  const recommendations = [];

  // Холодная погода
  const coldRule = rules.find(rule => rule.id === "cold");

  if (coldRule && temperature < coldRule.below) {
    recommendations.push(coldRule.text);
  }

  // Дождь, снег и другие осадки
  const precipitationCodes = [
    51, 53, 55, 56, 57,
    61, 63, 65, 66, 67,
    71, 73, 75, 77,
    80, 81, 82, 85, 86,
    95, 96, 99
  ];

  const rainRule = rules.find(rule => rule.id === "rain");

  if (rainRule && precipitationCodes.includes(code)) {
    recommendations.push(rainRule.text);
  }

  // Сильный ветер
  const windRule = rules.find(rule => rule.id === "wind");

  if (windRule && wind > windRule.above) {
    recommendations.push(windRule.text);
  }

  container.replaceChildren();

  if (recommendations.length === 0) {
    const message = document.createElement("p");
    message.className = "muted";
    message.textContent =
      "По выбранным погодным условиям дополнительных рекомендаций нет.";
    container.append(message);
    return;
  }

  const list = document.createElement("ul");

  recommendations.forEach(text => {
  const item = document.createElement("li");
  item.textContent = text;

  const rule = rules.find(rule => rule.text === text);

  if (rule && rule.sourceId) {
    const source = window.PLANNER_DATA.sources.find(
      source => source.id === rule.sourceId
    );

    if (source) {
      const link = document.createElement("a");

      link.href = source.url;
      link.textContent = " Источник";
      link.target = "_blank";
      link.rel = "noopener noreferrer";

      item.append(link);
    }
  }

  list.append(item);
});

  container.append(list);
}


async function loadWeather() {
  weatherStatus.textContent = "Загружаем погоду...";
  refreshWeatherBtn.disabled = true;

  try {
    const response = await fetch(WEATHER_API_URL);

    if (!response.ok) {
      throw new Error("HTTP " + response.status);
    }

    const data = await response.json();
    const current = data.current;

    if (
      !current ||
      !Number.isFinite(current.temperature_2m) ||
      !Number.isFinite(current.wind_speed_10m) ||
      !Number.isFinite(current.weather_code)
    ) {
      throw new Error("API вернул неполные данные");
    }

    const temperature = current.temperature_2m;
    const wind = current.wind_speed_10m;
    const code = current.weather_code;
    const condition = describeWeather(code);

    weatherTemp.textContent = temperature + " °C";
    weatherWind.textContent = wind + " км/ч";
    weatherCondition.textContent = condition;
    weatherIcon.textContent = getWeatherIcon(code);

    weatherDetails.hidden = false;
    weatherStatus.textContent = "Данные загружены";
renderWeatherRecommendations(temperature, wind, code);
    weatherStat.textContent = temperature + " °C";
    weatherStatNote.textContent = condition;

    const updatedAt = new Date();

    weatherUpdated.textContent =
      "Получено: " +
      updatedAt.toLocaleString("ru-RU", {
        timeZone: "Europe/Moscow",
        dateStyle: "short",
        timeStyle: "short"
      }) +
      " (МСК)";

  } catch (error) {
    console.error("Ошибка загрузки погоды:", error);
    const recommendationsContainer =
  document.getElementById("weatherRecommendations");

recommendationsContainer.textContent =
  "Рекомендации недоступны: погодные данные не загружены.";

    weatherStatus.textContent =
      "Не удалось загрузить погоду. Попробуйте ещё раз.";

    weatherDetails.hidden = true;
    weatherStat.textContent = "—";
    weatherStatNote.textContent = "Ошибка загрузки";

    weatherUpdated.textContent =
      "Данные недоступны. Проверьте подключение к интернету.";
  } finally {
    refreshWeatherBtn.disabled = false;
  }
}

refreshWeatherBtn.addEventListener("click", loadWeather);

// Первая загрузка при открытии страницы
loadWeather();
