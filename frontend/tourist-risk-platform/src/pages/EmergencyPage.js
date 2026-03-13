import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import PanicButton from "../components/PanicButton";
import { FaArrowLeft } from "react-icons/fa6";
import "./EmergencyPage.css";

function EmergencyPage() {
  return (
    <div className="emergency-page">
      <Navbar />
      <div className="emergency-container">
        <div className="emergency-header">
          <h1>Emergency SOS</h1>
          <p>Press and hold the button below for 3 seconds to activate emergency alert</p>
        </div>
        
        <div className="emergency-content">
          <PanicButton />
          
          <div className="emergency-info">
            <div className="info-card">
              <h3>How It Works</h3>
              <ol>
                <li>Hold the SOS button for 3 seconds</li>
                <li>Your location is shared with authorities</li>
                <li>Emergency contacts are notified</li>
                <li>Local emergency services are alerted</li>
              </ol>
            </div>
          </div>
        </div>

        <Link to="/" className="back-link">
          <FaArrowLeft /> Back to Home
        </Link>
      </div>
    </div>
  );
}

export default EmergencyPage;
