import express from 'express';
import protectAdmin from '../Middlewares/adminAuth.js';
import { checkGeofence, createRisk, getRisk } from '../Controllers/riskController.js';

const route = express.Router();

route.get('/all', getRisk);
route.post('/create', protectAdmin, createRisk);
route.post('/geofence/check', checkGeofence);

export default route;