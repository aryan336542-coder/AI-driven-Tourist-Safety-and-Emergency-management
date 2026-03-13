import { useState, useEffect } from "react";
import { getCurrentLocation, getDeviceId } from "../services/geolocation";
import "./PanicButton.css";

function PanicButton() {
  const [isTriggered, setIsTriggered] = useState(false);
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [isPressing, setIsPressing] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isPressing && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (isPressing && countdown === 0) {
      handleEmergency();
      setIsPressing(false);
      setCountdown(3);
    }
  }, [isPressing, countdown]);

  const handleMouseDown = () => {
    setIsPressing(true);
    setCountdown(3);
    setError("");
  };

  const handleMouseUp = () => {
    setIsPressing(false);
    setCountdown(3);
  };

  const handleEmergency = async () => {
    setLoading(true);
    setError("");

    try {
      // Get current location
      const location = await getCurrentLocation();
      const deviceId = getDeviceId();

      const emergencyData = {
        deviceId,
        location,
        emergencyType: "danger",
        message: "Emergency SOS Alert Triggered - Tourist in distress",
        status: "active"
      };

      const response = await fetch("http://localhost:8000/api/emergency/panic", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(emergencyData)
      });

      if (response.ok) {
        setIsTriggered(true);
        await response.json();
        setTimeout(() => setIsTriggered(false), 3000);
      } else {
        const errorData = await response.json();
        setError(errorData.message || "Failed to send emergency alert");
      }
    } catch (err) {
      setError("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="panic-button-container">
      {error && <div className="error-message">{error}</div>}
      
      <button
        className={`panic-button ${isTriggered ? "triggered" : ""} ${isPressing ? "pressing" : ""}`}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleMouseDown}
        onTouchEnd={handleMouseUp}
        disabled={loading || isTriggered}
      >
        {loading ? (
          <span>Sending...</span>
        ) : isTriggered ? (
          <span>✓ Alert Sent!</span>
        ) : isPressing ? (
          <span>Hold for {countdown}s</span>
        ) : (
          <span>🆘 EMERGENCY SOS</span>
        )}
      </button>
      
      <p className="panic-info">
        {isPressing
          ? "Keep holding to activate emergency alert..."
          : "Press and hold the button above in case of emergency. Your location will be shared immediately."}
      </p>
      
      <div className="emergency-info-box">
        <h3>What happens when you press SOS:</h3>
        <ul>
          <li>✓ Your GPS location is immediately captured</li>
          <li>✓ Emergency alert is sent to authorities</li>
          <li>✓ Nearby tourists in risk zones are notified</li>
          <li>✓ Real-time location sharing is activated</li>
        </ul>
      </div>
    </div>
  );
}

export default PanicButton;
