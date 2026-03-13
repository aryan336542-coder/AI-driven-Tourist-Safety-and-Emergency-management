import { useState, useEffect } from "react";
import { getCurrentLocation, getDeviceId } from "../services/geolocation";

function IncidentForm() {
  const [formData, setFormData] = useState({
    deviceId: "",
    location: { lat: null, lon: null },
    description: "",
    incidentType: "other"
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [locationStatus, setLocationStatus] = useState("Click 'Get Location' to enable tracking");

  useEffect(() => {
    // Set device ID on component mount
    const deviceId = getDeviceId();
    setFormData(prev => ({
      ...prev,
      deviceId
    }));
  }, []);

  const handleGetLocation = async () => {
    setLocationStatus("Getting location...");
    try {
      const location = await getCurrentLocation();
      setFormData(prev => ({
        ...prev,
        location
      }));
      setLocationStatus(`Location acquired: ${location.lat.toFixed(4)}, ${location.lon.toFixed(4)}`);
      setError("");
    } catch (err) {
      setLocationStatus("Location access denied");
      setError(err.message);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);

    // Validate location
    if (!formData.location.lat || !formData.location.lon) {
      setError("Please click 'Get Location' to enable location tracking");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("http://localhost:8000/api/incidents/report", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        setFormData({
          deviceId: getDeviceId(),
          location: { lat: null, lon: null },
          description: "",
          incidentType: "other"
        });
        setLocationStatus("Click 'Get Location' to enable tracking");
        setTimeout(() => setSuccess(false), 3000);
      } else {
        setError(data.message || "Failed to report incident");
      }
    } catch (err) {
      setError("Error reporting incident: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="incident-form">
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">✓ Incident reported successfully!</div>}

      <div className="form-group">
        <label>Device ID</label>
        <input
          type="text"
          value={formData.deviceId}
          readOnly
          className="readonly-input"
        />
      </div>

      <div className="form-group">
        <label>Location</label>
        <div className="location-input-group">
          <button
            type="button"
            onClick={handleGetLocation}
            className="location-btn"
            disabled={loading}
          >
            📍 Get Location
          </button>
          <input
            type="text"
            value={
              formData.location.lat && formData.location.lon
                ? `${formData.location.lat.toFixed(4)}, ${formData.location.lon.toFixed(4)}`
                : "Location not acquired"
            }
            readOnly
            className="readonly-input"
          />
        </div>
        <small>{locationStatus}</small>
      </div>

      <div className="form-group">
        <label>Incident Type</label>
        <select name="incidentType" value={formData.incidentType} onChange={handleChange}>
          <option value="theft">Theft</option>
          <option value="accident">Accident</option>
          <option value="lost">Lost</option>
          <option value="suspicious">Suspicious Activity</option>
          <option value="other">Other</option>
        </select>
      </div>

      <div className="form-group">
        <label>Description</label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          required
          placeholder="Describe the incident in detail..."
        />
      </div>

      <button type="submit" disabled={loading}>
        {loading ? "Submitting..." : "Report Incident"}
      </button>
    </form>
  );
}

export default IncidentForm;
