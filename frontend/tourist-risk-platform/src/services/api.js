import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:8000/api"
});

// Risk Zone endpoints
export const getRiskZones = () => API.get("/risk/all");
export const checkGeofence = (data) => API.post("/risk/geofence/check", data);

// Incident endpoints
export const reportIncident = (data) =>
  API.post("/incidents/report", data);

export const getIncidents = () =>
  API.get("/incidents/all");

export const verifyIncidentChain = () =>
  API.get("/incidents/verify-chain");

// Emergency endpoints
export const triggerEmergency = (data) =>
  API.post("/emergency/panic", data);

export const getEmergencies = () =>
  API.get("/emergency/all");

// Admin endpoints
export const adminLogin = (email, password) =>
  API.post("/admin/login", { email, password });

export default API;
