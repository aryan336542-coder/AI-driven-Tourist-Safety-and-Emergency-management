import joblib
import numpy as np
import requests
import sys
import json

model = joblib.load("risk_model.pkl")
state_encoder = joblib.load("state_encoder.pkl")
desc_encoder = joblib.load("desc_encoder.pkl")

def predict_risk(state, description, crime_rate,
lat, lon, tourist_density):

    state = state_encoder.transform([state])[0]
    description = desc_encoder.transform([description])[0]
    def get_elevation(lat, lon):
        url = f"https://api.open-elevation.com/api/v1/lookup?locations={lat},{lon}"
        response = requests.get(url)
        if response.status_code == 200:
            data = response.json()
            return data['results'][0]['elevation']
        else:
            return None

    def get_weather_risk(lat, lon):
        url = f"https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&current_weather=true"
        response = requests.get(url)
        if response.status_code == 200:
            data = response.json()
            weathercode = data['current_weather']['weathercode']
            # Map weathercode to risk levels
            if weathercode in [0, 1, 2, 3]:  # Clear, partly cloudy
                return 0.2  # Low risk
            elif weathercode in [45, 48, 51, 52, 53, 54, 55, 56, 57]:  # Fog, drizzle
                return 0.5  # Moderate risk
            elif weathercode in [61, 62, 63, 64, 65, 66, 67, 80, 81, 82, 95, 96, 97, 98, 99]:  # Rain, thunderstorm
                return 0.8  # High risk
            elif weathercode in [71, 72, 73, 74, 75, 77, 85, 86]:  # Snow
                return 0.7  # Moderate to high risk
            else:
                return 0.5  # Default moderate risk
        else:
            return 0.5

    def get_time_of_day(lat, lon):
        url = f"https://api.ipgeolocation.io/timezone?apiKey=free&lat={lat}&lon={lon}"
        response = requests.get(url)
        if response.status_code == 200:
            data = response.json()
            date_time = data.get('date_time', '')
            if date_time:
                # Extract hour from "2023-10-01 14:30:00"
                hour = int(date_time.split()[1].split(':')[0])
                return hour
        return 12  # Default to noon if API fails

    terrain_difficulty = get_elevation(lat, lon)
    weather_risk = get_weather_risk(lat, lon)
    time_of_day = get_time_of_day(lat, lon)
    data = np.array([[
        state,
        description,
        crime_rate,
        weather_risk,
        terrain_difficulty,
        tourist_density,
        time_of_day
    ]])

    risk_score = model.predict(data)[0]

    if risk_score < 30:
        level = "safe"
    elif risk_score < 60:
        level = "moderate"
    else:
        level = "high"

    return {
        "risk_score": round(risk_score,2),
        "risk_level": level
    }

# test prediction
if __name__ == "__main__":
    if len(sys.argv) != 7:
        print(json.dumps({"error": "Invalid arguments"}))
        sys.exit(1)

    state = sys.argv[1]
    description = sys.argv[2]
    crime_rate = float(sys.argv[3])
    lat = float(sys.argv[4])
    lon = float(sys.argv[5])
    tourist_density = float(sys.argv[6])

    result = predict_risk(state, description, crime_rate, lat, lon, tourist_density)
    print(json.dumps(result))