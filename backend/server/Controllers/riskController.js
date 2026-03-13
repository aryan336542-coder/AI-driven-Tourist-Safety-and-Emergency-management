import RiskZone from "../Models/RiskZone.js";
import Incident from "../Models/Incident.js";
import AsyncHandler from 'express-async-handler'

const toRadians = (degree) => degree * (Math.PI / 180);

const haversineDistanceMeters = (lat1, lon1, lat2, lon2) => {
    const earthRadius = 6371000;
    const dLat = toRadians(lat2 - lat1);
    const dLon = toRadians(lon2 - lon1);

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return earthRadius * c;
};

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const calculateGeofenceRadiusFromIncidents = async (centerLat, centerLon) => {
    // Pull nearby incidents around the zone center to estimate practical alert radius.
    const candidates = await Incident.find(
        {
            "location.lat": { $gte: centerLat - 0.05, $lte: centerLat + 0.05 },
            "location.lon": { $gte: centerLon - 0.05, $lte: centerLon + 0.05 },
        },
        "location"
    ).lean();

    if (!candidates.length) {
        return 500;
    }

    const nearbyDistances = candidates
        .map((item) => haversineDistanceMeters(centerLat, centerLon, item.location.lat, item.location.lon))
        .filter((distance) => distance <= 3000)
        .sort((a, b) => a - b)
        .slice(0, 5);

    if (!nearbyDistances.length) {
        return 500;
    }

    const averageDistance = nearbyDistances.reduce((sum, distance) => sum + distance, 0) / nearbyDistances.length;
    return Math.round(clamp(averageDistance * 1.5, 200, 2000));
};

//@GET get all risk area reports
export const getRisk = AsyncHandler(async(req,res)=>{
    const Risks = await RiskZone.find();

    if(!Risks){
        res.status(400)
        throw new Error("Risk areas don't exist")
    }

    res.status(200).json(Risks)
})


//@POST post a risky area
export const createRisk = AsyncHandler(async(req,res)=>{
    if(!req.admin){
        res.status(403);
        throw new Error("Not authorized")
    }
    const {name,location,crimeRate,tourist_density,weatherScore,terrainScore,timeScore,riskScore,riskLevel} = req.body

    if (!location || typeof location.lat !== 'number' || typeof location.lon !== 'number') {
        res.status(400);
        throw new Error('location.lat and location.lon are required');
    }

    const geofenceRadius = await calculateGeofenceRadiusFromIncidents(location.lat, location.lon);

    const risk = await RiskZone.create({
        name,
        location,
        tourist_density,
        crimeRate,
        weatherScore,
        terrainScore,
        timeScore,
        riskScore,
        riskLevel,
        geofenceRadius,
    })
    res.status(201).json(risk);
})

//@POST check if a location is inside any risk geofence
export const checkGeofence = AsyncHandler(async (req, res) => {
    const { location } = req.body;

    if (!location || typeof location.lat !== 'number' || typeof location.lon !== 'number') {
        res.status(400);
        throw new Error('location.lat and location.lon are required');
    }

    const riskZones = await RiskZone.find({}, 'name location riskLevel riskScore geofenceRadius');

    const matchedZones = riskZones
        .map((zone) => {
            const distanceMeters = haversineDistanceMeters(
                location.lat,
                location.lon,
                zone.location.lat,
                zone.location.lon
            );

            const radiusMeters = zone.geofenceRadius || 500;
            return {
                zoneId: zone._id,
                name: zone.name,
                riskLevel: zone.riskLevel,
                riskScore: zone.riskScore,
                radiusMeters,
                distanceMeters: Number(distanceMeters.toFixed(2)),
                inside: distanceMeters <= radiusMeters,
            };
        })
        .filter((zone) => zone.inside)
        .sort((a, b) => a.distanceMeters - b.distanceMeters);

    res.status(200).json({
        isInsideRiskZone: matchedZones.length > 0,
        totalMatches: matchedZones.length,
        nearestMatch: matchedZones[0] || null,
        matches: matchedZones,
    });
});