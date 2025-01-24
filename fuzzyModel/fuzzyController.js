const IotData = require("../models/iot_data.model")

class FuzzyController {
  // Temperature: Cold (≤20°C), Comfortable (20-30°C), Hot (≥30°C)
  getTemperatureMembership(temp) {
    const cold = temp <= 20 ? 1 : temp >= 25 ? 0 : (25 - temp) / 5;

    const comfortable =
      temp <= 20
        ? 0
        : temp >= 30
          ? 0
          : temp <= 25
            ? (temp - 20) / 5
            : (30 - temp) / 5;

    const hot = temp <= 25 ? 0 : temp >= 30 ? 1 : (temp - 25) / 5;

    return { cold, comfortable, hot };
  }

  // Humidity: Dry (≤30%), Normal (30-70%), Humid (≥70%)
  getHumidityMembership(humidity) {
    const dry = humidity <= 30 ? 1 : humidity >= 50 ? 0 : (50 - humidity) / 20;

    const normal =
      humidity <= 30
        ? 0
        : humidity >= 70
          ? 0
          : humidity <= 50
            ? (humidity - 30) / 20
            : (70 - humidity) / 20;

    const humid =
      humidity <= 50 ? 0 : humidity >= 70 ? 1 : (humidity - 50) / 20;

    return { dry, normal, humid };
  }

  // If temperature is cold and humidity is dry → Set AC to 25°C
  // If temperature is cold and humidity is normal → Set AC to 24°C
  // If temperature is comfortable and humidity is normal → Set AC to 23°C
  // If temperature is hot and humidity is humid → Set AC to 21°C
  // If temperature is hot and humidity is normal → Set AC to 22°C

  inferAcTemperature(temp, humidity) {
    const tempMembership = this.getTemperatureMembership(temp);
    const humidityMembership = this.getHumidityMembership(humidity);

    // Rule base
    const rules = [
      // If cold and dry, then AC temp should be higher (25°C)
      Math.min(tempMembership.cold, humidityMembership.dry) * 25,

      // If cold and normal humidity, then AC temp should be moderate (24°C)
      Math.min(tempMembership.cold, humidityMembership.normal) * 24,

      // If comfortable and normal humidity, then AC temp should be moderate (23°C)
      Math.min(tempMembership.comfortable, humidityMembership.normal) * 23,

      // If hot and humid, then AC temp should be lower (21°C)
      Math.min(tempMembership.hot, humidityMembership.humid) * 21,

      // If hot and normal humidity, then AC temp should be moderate-low (22°C)
      Math.min(tempMembership.hot, humidityMembership.normal) * 22,
    ];

    // Defuzzification using weighted average
    const weightedSum = rules.reduce((sum, rule) => sum + rule, 0);
    const weights = rules.length;

    return weightedSum / weights;
  }
}

const FuzzyAC = new FuzzyController();

async function suggestACTemperature(req, res) {
  try {
    const latestData = await IotData.findOne({
      order: [["timestamp", "DESC"]],
    });

    if (!latestData) {
      return res.status(404).json({ error: "No IoT data available" });
    }

    const suggestedTemp = FuzzyAC.inferAcTemperature(
      latestData.temperature,
      latestData.humidity
    );

    return res.json({
      currentTemperature: latestData.temperature,
      currentHumidity: latestData.humidity,
      //suggestedACTemperature: Math.round(suggestedTemp * 10) / 10,
      suggestedACTemperature: Math.floor(suggestedTemp + latestData.temperature),
      timestamp: latestData.timestamp,
    });
  } catch (error) {
    console.error("Error in AC temperature suggestion:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

async function suggest() {
  try {
    const latestData = await IotData.findOne({
      order: [["timestamp", "DESC"]],
    });

    if (!latestData) {
      return res.status(404).json({ error: "No IoT data available" });
    }

    const suggestedTemp = FuzzyAC.inferAcTemperature(
      latestData.temperature,
      latestData.humidity
    );
    console.log(suggestedTemp);
    return suggestedTemp + latestData.temperature;
  } catch (error) {
    console.error("Error in AC temperature suggestion:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

module.exports = {
  FuzzyController,
  suggestACTemperature,
  suggest,
};
