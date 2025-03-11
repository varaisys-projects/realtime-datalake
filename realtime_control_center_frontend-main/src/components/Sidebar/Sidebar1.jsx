import React from 'react';
import { Link } from 'react-router-dom';
import "./Sidebar1.css"


const Sidebar = () => {
  return (
    <div className="sidebar-container">
      <div className="sidebar">
        <Link to="/dashboard/sources" className="sidebar-title">
          <span>Unified Data</span>
        </Link>
        <ul className="sidebar-menu">
          <li className="sidebar-item">
            <Link to="/dashboard/sources" className="nav-link">
              <div className='icon-box'><i className="fa fa-database"></i></div>
              <span>Sources</span>
            </Link>
          </li>
          <li className="sidebar-item">
            <Link to="/dashboard/connections" className="nav-link">
              <div className='icon-box'><i className="fa fa-users"></i></div>
              <span>Connections</span>
            </Link>
          </li>
          <li className="sidebar-item">
            <Link to="/dashboard/destinations/0" className="nav-link">
              <div className='icon-box'><i className="fa fa-map-marker"></i></div>
              <span>Destinations</span>
            </Link>
          </li>
          <li className="sidebar-item">
            <Link to="/dashboard/builder" className="nav-link">
              <div className='icon-box'><i className="fa fa-wrench"></i></div>
              <span>Builder</span>
            </Link>
          </li>
          <li className="sidebar-item">
            <Link to="/dashboard/settings" className="nav-link">
              <div className='icon-box'><i className="fa fa-cog"></i></div>
              <span>Settings</span>
            </Link>
          </li>
        </ul>
        <hr className="divider" />
        {/* <div className="dropdown">
          <a href="#" className="dropdown-toggle">
            <img src="https://github.com/mdo.png" alt="profile" className="profile-image" />
            <span className="profile-name">loser</span>
          </a>
          <ul className="dropdown-menu">
            <li><a className="dropdown-item" href="#">New project...</a></li>
            <li><a className="dropdown-item" href="#">Settings</a></li>
            <li><a className="dropdown-item" href="#">Profile</a></li>
            <li><hr className="dropdown-divider" /></li>
            <li><a className="dropdown-item" href="#">Sign out</a></li>
          </ul>
        </div> */}
      </div>
    </div>
  );
};

export default Sidebar;
