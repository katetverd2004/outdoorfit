
window.PLANNER_DATA = {
  activities: {
    running: "Бег",
    workout: "Тренировка на спортивной площадке"
  },

  sources: [
  {
    id: "open-meteo",
    title: "Open-Meteo — документация погодного API",
    url: "https://open-meteo.com/en/docs"
  },
  {
    id: "noaa-lightning",
    title: "NOAA — безопасность во время грозы",
    url: "https://www.weather.gov/safety/lightning-sports"
  },
  {
  id: "cold-safety",
  title: "NOAA — рекомендации по одежде в холодную погоду",
  url: "https://www.weather.gov/safety/cold-outreach"
},
{
  id: "rain-safety",
  title: "NOAA — меры предосторожности при сильном дожде",
  url: "https://www.weather.gov/tsa/dsp_safetyMain"
},
{
  id: "wind-safety",
  title: "NOAA — безопасность при сильном ветре",
  url: "https://www.weather.gov/safety/wind-during"
}
],

 weatherRecommendations: [
  {
    id: "cold",
    text: "На улице холодно. Подбери одежду с учётом температуры и интенсивности тренировки.",
    condition: "temperature",
    below: 5,
    sourceId: "cold-safety"
  },
  {
    id: "rain",
    text: "Возможны осадки. Проверь состояние дорожек или покрытия спортивной площадки.",
    condition: "precipitation",
    sourceId: "rain-safety"
  },
  {
    id: "wind",
    text: "Сильный ветер. Оцени безопасность маршрута или спортивной площадки.",
    condition: "wind",
    above: 35,
    sourceId: "wind-safety"
  }
],
  checklist: [
    {
      id: "general-1",
      text: "Записать место и дату тренировки",
      types: ["running", "workout"],
      darkOnly: false,
      sourceId: null,
      category: "Учебное организационное действие"
    },
    {
      id: "general-2",
      text: "Проверить актуальность погодных данных",
      types: ["running", "workout"],
      darkOnly: false,
      sourceId: null,
      category: "Учебное организационное действие"
    },
    {
      id: "running-1",
      text: "Уточнить планируемую дистанцию",
      types: ["running"],
      darkOnly: false,
      sourceId: null,
      category: "Учебное организационное действие"
    },
    {
      id: "workout-1",
      text: "Уточнить место и состав упражнений",
      types: ["workout"],
      darkOnly: false,
      sourceId: null,
      category: "Учебное организационное действие"
    },
    {
      id: "dark-1",
      text: "Уточнить освещённость выбранного места",
      types: ["running", "workout"],
      darkOnly: true,
      sourceId: null,
      category: "Учебное организационное действие"
    }
  ]
};
