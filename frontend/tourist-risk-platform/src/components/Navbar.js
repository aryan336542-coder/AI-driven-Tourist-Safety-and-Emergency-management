import { Link } from "react-router-dom";
import { FaHome, FaMap, FaExclamationTriangle, FaPhone, FaBell } from "react-icons/fa";
import "./Navbar.css";

function Navbar() {
  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">
          <div className="logo-icon">S</div>
          <div className="logo-text">
            <div className="logo-brand">SafeRoute AI</div>
            <div className="logo-subtitle">TOURIST SAFETY PLATFORM</div>
          </div>
        </Link>
        <ul className="nav-menu">
          <li className="nav-item">
            <Link to="/" className="nav-link">
              <FaHome /> Home
            </Link>
          </li>
          <li className="nav-item">
            <Link to="/map" className="nav-link">
              <FaMap /> Risk Map
            </Link>
          </li>
          <li className="nav-item">
            <Link to="/incident" className="nav-link">
              <FaExclamationTriangle /> Report Incident
            </Link>
          </li>
          <li className="nav-item">
            <Link to="/emergency" className="nav-link">
              <FaPhone /> Emergency SOS
            </Link>
          </li>
        </ul>
        <div className="nav-actions">
          <button className="nav-bell">
            <FaBell />
            <span className="notification-badge">3</span>
          </button>
          <div className="nav-status"> <span className="status-dot"></span> Live
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
