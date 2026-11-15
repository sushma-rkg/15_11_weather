const NOT_FOUND_MESSAGE =
  "We couldn't find that city. Please check the spelling and try again.";
const UNAVAILABLE_MESSAGE =
  "The weather service is unavailable right now. Please try again later.";

module.exports = async function handler(req, res) {
  let city = req.query && req.query.city;
  if (Array.isArray(city)) city = city[0];
  city = typeof city === "string" ? city.trim() : "";

  if (!city) {
    return res.status(404).json({ message: NOT_FOUND_MESSAGE });
  }

  const key = process.env.WEATHER_API_KEY;
  if (!key) {
    return res.status(503).json({ message: UNAVAILABLE_MESSAGE });
  }

  try {
    const url =
      "https://api.weatherapi.com/v1/current.json?key=" +
      encodeURIComponent(key) +
      "&q=" +
      encodeURIComponent(city);

    const response = await fetch(url, { signal: AbortSignal.timeout(8000) });
    const data = await response.json();

    if (!response.ok) {
      // 1006 = no matching city, 1003 = no city given
      const code = data && data.error && data.error.code;
      if (code === 1006 || code === 1003) {
        return res.status(404).json({ message: NOT_FOUND_MESSAGE });
      }
      return res.status(503).json({ message: UNAVAILABLE_MESSAGE });
    }

    const icon = data.current.condition.icon;

    return res.status(200).json({
      city: data.location.name,
      country: data.location.country,
      localTime: data.location.localtime,
      description: data.current.condition.text,
      iconUrl: icon.startsWith("//") ? "https:" + icon : icon,
      temperatureC: data.current.temp_c,
      feelsLikeC: data.current.feelslike_c,
      humidity: data.current.humidity,
      windKph: data.current.wind_kph,
      windDirection: data.current.wind_dir,
    });
  } catch (error) {
    return res.status(503).json({ message: UNAVAILABLE_MESSAGE });
  }
};
