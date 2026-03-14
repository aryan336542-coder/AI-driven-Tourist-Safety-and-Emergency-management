# Frontend React Codebase Analysis Report
**Date**: March 14, 2026  
**Project**: SafeRoute AI - Tourist Risk Platform  
**Scope**: All component files in `src/components/`, `src/pages/`, and `src/services/`

---

## Executive Summary
Found **12 issues** across the codebase including API configuration problems, incomplete event handlers, potential runtime errors, and inconsistent data field naming. Most issues are **medium priority** and could cause runtime failures or poor UX.

---

## Critical Issues

### 1. **API Base URL Hardcoded to Localhost**
**File**: [src/services/api.js](src/services/api.js#L3)  
**Severity**: HIGH  
**Issue**: The API base URL is hardcoded to `http://localhost:8000/api`, which will fail in production or when backend is deployed elsewhere.

```javascript
const API = axios.create({
  baseURL: "http://localhost:8000/api"  // HARDCODED - Won't work in production
});
```

**Impact**: 
- All API calls will fail in production
- Makes deployment impossible without manual code changes
- No environment variable support

**Recommendation**: Use environment variables
```javascript
const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "http://localhost:8000/api"
});
```

---

## Major Issues

### 2. **Missing error handling in MapView.js geolocation watch**
**File**: [src/components/MapView.js](src/components/MapView.js#L153)  
**Severity**: HIGH  
**Issue**: Empty error handler for `watchPosition` callback silently ignores location update failures.

```javascript
watchId = navigator.geolocation.watchPosition(
  (position) => {
    if (!isActive) return;
    const { latitude, longitude, accuracy } = position.coords;
    updateUserLocation({ latitude, longitude, accuracy });
  },
  () => {},  // EMPTY ERROR HANDLER - errors are silently ignored
  {
    enableHighAccuracy: true,
    timeout: 15000,
    maximumAge: 10000,
  }
);
```

**Impact**: Location tracking errors won't be reported to user, map may appear stuck.  

**Fix**: Add proper error handling:
```javascript
(error) => {
  if (!isActive) return;
  console.error("Location watch error:", error);
  // Optionally show notification to user
}
```

---

### 3. **Incomplete Touch Event Handling in PanicButton.js**
**File**: [src/components/PanicButton.js](src/components/PanicButton.js#L48-L54)  
**Severity**: MEDIUM  
**Issue**: Touch events are incomplete - missing `onTouchCancel` handler means cancel won't reset state on mobile.

```javascript
<button
  className={`panic-button ${isTriggered ? "triggered" : ""} ${isPressing ? "pressing" : ""}`}
  onMouseDown={handleMouseDown}
  onMouseUp={handleMouseUp}
  onMouseLeave={handleMouseUp}
  onTouchStart={handleMouseDown}
  onTouchEnd={handleMouseUp}
  // MISSING: onTouchCancel={handleMouseUp}
  disabled={loading || isTriggered}
>
```

**Impact**: On mobile, if user cancels touch mid-press, countdown won't reset.

**Fix**: Add `onTouchCancel={handleMouseUp}` to the button.

---

### 4. **Inconsistent Incident Data Field Naming**
**File**: [src/pages/Dashboard.js](src/pages/Dashboard.js#L81)  
**Severity**: MEDIUM  
**Issue**: Code uses `incident.incidentType || incident.category` suggesting backend might return different field names at different times.

```javascript
<p><strong>{incident.incidentType || incident.category}</strong></p>
```

**Impact**: Brittle code that masks data inconsistency in backend.

**Recommendation**: Verify with backend team which field name is correct and standardize. Add validation.

---

### 5. **Unhandled Promise Rejection in Dashboard.js**
**File**: [src/pages/Dashboard.js](src/pages/Dashboard.js#L34-L41)  
**Severity**: MEDIUM  
**Issue**: `fetchDashboardData()` has catch block that only logs error to console, doesn't show user feedback.

```javascript
catch (error) {
  console.error("Error fetching dashboard data:", error);
  // MISSING: Show error message to user
}
```

**Impact**: User won't know if data failed to load, sees empty dashboard.

**Fix**: Add error state and display message:
```javascript
const [dataError, setDataError] = useState(null);

catch (error) {
  console.error("Error fetching dashboard data:", error);
  setDataError("Failed to load dashboard data. Please refresh.");
}

// In JSX:
{dataError && <div className="error-message">{dataError}</div>}
```

---

## Medium Priority Issues

### 6. **Non-unique Risk Zone Keys in MapView.js**
**File**: [src/components/MapView.js](src/components/MapView.js#L329)  
**Severity**: MEDIUM  
**Issue**: Risk zone keys using template literal might not be unique if multiple zones have same name and location.

```javascript
{renderedRiskZones.map((zone) => {
  // ...
  return (
    <Circle
      key={zone._id || `${zone.name}-${zone.location.lat}-${zone.location.lon}`}
      // ...
    >
```

**Impact**: React rendering issues if zones with same name/location exist, could cause UI inconsistencies.

**Recommendation**: Always use unique `_id` from backend, add fallback for index if needed:
```javascript
key={zone._id || index}
```

---

### 7. **Missing Error Boundary for MapView**
**File**: [src/pages/MapPage.js](src/pages/MapPage.js)  
**Severity**: MEDIUM  
**Issue**: MapView component is not wrapped in an error boundary, a Leaflet error could crash the page.

```javascript
function MapPage() {
  return (
    <div className="map-page">
      <Navbar />
      <div className="map-page-content">
        <MapView />  // No error boundary here
      </div>
    </div>
  );
}
```

**Impact**: Map rendering error crashes entire map page.

**Recommendation**: Wrap MapView:
```javascript
<ErrorBoundary>
  <MapView />
</ErrorBoundary>
```

---

### 8. **Hardcoded Risk Zone Rendering Limit**
**File**: [src/components/MapView.js](src/components/MapView.js#L7)  
**Severity**: LOW  
**Issue**: `MAX_RENDERED_ZONES = 150` is hardcoded and can't be adjusted without code changes.

```javascript
const MAX_RENDERED_ZONES = 150;
```

**Impact**: May cause performance issues or limit visibility of zones.

**Recommendation**: Move to configuration or make it a prop that can be adjusted from parent component.

---

## Data Consistency Issues

### 9. **Inconsistent Risk Zone Field Names in Dashboard.js**
**File**: [src/pages/Dashboard.js](src/pages/Dashboard.js#L118-L122)  
**Severity**: MEDIUM  
**Issue**: Code references `zone.tourist_density` with snake_case, while other code uses camelCase.

```javascript
<p>Tourist Density: {zone.tourist_density}</p>
```

Compare with MapView.js line 452 which uses same:
```javascript
<p><strong>Tourist Density:</strong> {zone.tourist_density ?? "N/A"}</p>
```

**Impact**: If backend changes field name, both places need updating.

**Recommendation**: Create a data transformer/adapter layer to normalize backend responses.

---

## Minor Issues

### 10. **Missing Input Validation in IncidentForm.js**
**File**: [src/components/IncidentForm.js](src/components/IncidentForm.js#L48-L53)  
**Severity**: LOW  
**Issue**: Form validates location is set, but doesn't validate description has minimum length.

```javascript
if (!formData.location.lat || !formData.location.lon) {
  setError("Please click 'Get Location' to enable location tracking");
  setLoading(false);
  return;
}
// No validation for description being too short
```

**Recommendation**: Add minimum description length validation:
```javascript
if (!formData.description.trim() || formData.description.trim().length < 10) {
  setError("Please provide at least 10 characters for description");
  setLoading(false);
  return;
}
```

---

### 11. **Unused adminId in localStorage**
**File**: [src/pages/AdminLogin.js](src/pages/AdminLogin.js#L25)  
**Severity**: LOW  
**Issue**: `adminId` is stored but never used in the codebase.

```javascript
localStorage.setItem("adminId", response.data._id);
```

**Search Result**: No references to `localStorage.getItem("adminId")` found in codebase.

**Impact**: Dead code, wastes storage.

**Fix**: Either remove or use it for API calls.

---

### 12. **Missing null checks for API responses**
**File**: [src/components/MapView.js](src/components/MapView.js#L173)  
**Severity**: LOW  
**Issue**: API response data assumed to be array without checking.

```javascript
const response = await getRiskZones();
if (!isActive) return;

setAllRiskZones(Array.isArray(response.data) ? response.data : []);
```

This is actually **correctly handled** (good!), but other locations might not be.

Check: Dashboard.js lines 29-31 - also correctly handles array checks.

---

## Missing Dependencies / Imports Analysis

✅ **Status**: All required dependencies are installed and imported correctly.

**Verified**:
- ✅ `react-router-dom` - imported for routing
- ✅ `leaflet` and `react-leaflet` - for maps  
- ✅ `axios` - for API calls
- ✅ `react-icons` - for icon components
- ✅ `aos` - for animations

---

## Environment Configuration Issues

### Issue: No .env File Template
**File**: Root and [c:\hackathon\frontend\tourist-risk-platform](c:\hackathon\frontend\tourist-risk-platform)  
**Severity**: MEDIUM  
**Issue**: No `.env.example` or `.env` file template provided, making setup difficult for new developers.

**Recommendation**: Create `.env.example`:
```
REACT_APP_API_URL=http://localhost:8000/api
REACT_APP_MAPBOX_TOKEN=your_token_here
```

---

## Performance Issues

### Issue: Expensive useMemo Dependencies
**File**: [src/components/MapView.js](src/components/MapView.js#L287-L308)  
**Severity**: LOW  
**Analysis**: 
- `nearbyRiskZones` recalculates whenever `allRiskZones`, `searchRadius`, or `userLocation` changes - acceptable
- `renderedRiskZones` is properly memoized slice - good
- `stats` recalculation with reduce is acceptable for <150 items

**Status**: ✅ Performance optimizations are adequate

---

## Geolocation API Issues

### Issue: Potential Permission Denied Silent Failure
**File**: [src/services/geolocation.js](src/services/geolocation.js#L6-17)  
**Severity**: MEDIUM  
**Current Implementation**:
```javascript
export const getCurrentLocation = () => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation is not supported by this browser"));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        // ...
      },
      (error) => {
        reject(new Error(`Geolocation error: ${error.message}`));
      }
    );
  });
};
```

**Issue**: HTTPS requirement not documented. On localhost (HTTP), geolocation might be denied silently on some browsers.

**Recommendation**: Add comment and better error handling:
```javascript
// Note: Geolocation requires HTTPS in production (or localhost)
// HTTP sites will have permission denied
```

---

## Summary Table

| Issue | File | Line | Severity | Type |
|-------|------|------|----------|------|
| Hardcoded API URL | api.js | 3 | HIGH | Configuration |
| Empty geolocation error handler | MapView.js | 153 | HIGH | Error Handling |
| Missing onTouchCancel | PanicButton.js | 54 | MEDIUM | Event Handling |
| Inconsistent field names | Dashboard.js | 81 | MEDIUM | Data Consistency |
| No user error feedback | Dashboard.js | 40 | MEDIUM | UX |
| Non-unique zone keys | MapView.js | 329 | MEDIUM | React |
| Missing MapView error boundary | MapPage.js | 11 | MEDIUM | Error Handling |
| Hardcoded rendering limit | MapView.js | 7 | LOW | Performance |
| Snake_case field name | Dashboard.js | 118 | MEDIUM | Data Consistency |
| Missing description validation | IncidentForm.js | 50 | LOW | Validation |
| Unused adminId | AdminLogin.js | 25 | LOW | Code Quality |
| Missing .env template | (root) | - | MEDIUM | Configuration |

---

## Recommendations Priority

### 🔴 **Immediate (Production Blocking)**
1. Fix hardcoded API URL - add environment variable support
2. Add proper error handling for geolocation watch errors
3. Add error display in Dashboard data fetch

### 🟡 **High Priority (Before Release)**
1. Fix Touch event handling in PanicButton
2. Add MapView error boundary
3. Standardize backend field naming
4. Create .env.example template

### 🟢 **Nice to Have (Next Sprint)**
1. Add description length validation
2. Remove unused adminId variable
3. Document HTTPS requirement for geolocation
4. Make rendering limits configurable

---

## Testing Recommendations

1. **Integration Test**: Test all API calls with actual backend
2. **Mobile Test**: Test touch events on actual mobile devices
3. **Offline Test**: Test error handling when backend is unreachable
4. **Browser Test**: Test in Firefox, Safari, Chrome for geolocation compatibility
5. **Production Test**: Verify all environment variables work in production build

