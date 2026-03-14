import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import { getIncidents, getEmergencies, getRiskZones } from "../services/api";
import "./Dashboard.css";

function Dashboard() {
  const navigate = useNavigate();
  const [adminName, setAdminName] = useState("");
  const [incidents, setIncidents] = useState([]);
  const [emergencies, setEmergencies] = useState([]);
  const [riskZones, setRiskZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Check if admin is logged in
    const token = localStorage.getItem("adminToken");
    const name = localStorage.getItem("adminName");

    if (!token) {
      navigate("/admin/login");
      return;
    }

    setAdminName(name || "Admin");
    fetchDashboardData();
  }, [navigate]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch incidents
      const incidentRes = await getIncidents();
      setIncidents(incidentRes.data);

      // Fetch emergencies
      const emergencyRes = await getEmergencies();
      setEmergencies(emergencyRes.data);

      // Fetch risk zones
      const riskRes = await getRiskZones();
      setRiskZones(riskRes.data);

    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      setError("Failed to load dashboard data. Please refresh the page.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminId");
    localStorage.removeItem("adminName");
    navigate("/");
  };

  return (
    <div>
      <Navbar />
      {error && <div style={{ background: "#f8d7da", color: "#721c24", padding: "10px 20px", margin: "10px", borderRadius: "4px" }}>{error}</div>}
      <div className="page-container">
        <div className="dashboard-header">
          <div>
            <h1>Admin Dashboard</h1>
            <p>Welcome, {adminName}</p>
          </div>
          <button onClick={handleLogout} className="logout-btn">
            Logout
          </button>
        </div>

        {loading ? (
          <p>Loading dashboard data...</p>
        ) : (
          <div className="dashboard-grid">
            <div className="stats-card">
              <h3>📋 Total Incidents</h3>
              <p className="stat-number">{incidents.length}</p>
              <div className="incidents-list">
                {incidents.slice(0, 5).map((incident, index) => (
                  <div key={index} className="incident-item">
                    <p><strong>{incident.incidentType || incident.category}</strong></p>
                    <p>Location: {incident.location?.lat?.toFixed(4)}, {incident.location?.lon?.toFixed(4)}</p>
                    <p>{incident.description}</p>
                    <small>{new Date(incident.createdAt).toLocaleString()}</small>
                  </div>
                ))}
              </div>
            </div>

            <div className="stats-card emergency">
              <h3>🚨 Emergency Alerts</h3>
              <p className="stat-number">{emergencies.length}</p>
              <div className="emergencies-list">
                {emergencies.slice(0, 5).map((emergency, index) => (
                  <div key={index} className="emergency-item">
                    <p><strong>{emergency.emergencyType}</strong></p>
                    <p>Location: {emergency.location?.lat?.toFixed(4)}, {emergency.location?.lon?.toFixed(4)}</p>
                    <p>{emergency.message || "Emergency Alert"}</p>
                    <p className="status-badge" style={{ color: emergency.status === 'active' ? '#ff0000' : '#00ff00' }}>
                      Status: {emergency.status}
                    </p>
                    <small>{new Date(emergency.createdAt).toLocaleString()}</small>
                  </div>
                ))}
              </div>
            </div>

            <div className="stats-card risk">
              <h3>⚠️ Risk Zones</h3>
              <p className="stat-number">{riskZones.length}</p>
              <div className="risk-zones-list">
                {riskZones.slice(0, 5).map((zone, index) => (
                  <div key={index} className="risk-zone-item">
                    <p><strong>{zone.name}</strong></p>
                    <p>Risk Level: <span className={`risk-level-${zone.riskLevel}`}>{zone.riskLevel}</span></p>
                    <p>Risk Score: {(zone.riskScore * 100).toFixed(1)}%</p>
                    <p>Crime Rate: {(zone.crimeRate * 100).toFixed(1)}%</p>
                    <p>Tourist Density: {zone.tourist_density}</p>
                    <small>{new Date(zone.createdAt).toLocaleString()}</small>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="dashboard-footer">
          <Link to="/">
            <button>Back to Home</button>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;