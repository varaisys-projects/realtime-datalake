import React from 'react';
import { Link } from 'react-router-dom';
import "../../global.css"

const Sidebar = () => {
  return (
    <div className="col-sm-2 bg-dark">
      <div className="d-flex flex-column align-items-center align-items-sm-start px-3 pt-2 text-white min-vh-100 sidebar">
        <Link to="/" className="d-flex align-items-center pb-3 mb-md-0 me-md-auto text-white text-decoration-none">
          <span className="fs-5 d-none d-sm-inline ">Unified Data</span>
        </Link>
        <ul className="nav nav-pills flex-column mb-sm-auto mb-0 align-items-center align-items-sm-start" id="menu">
          <li className="nav-item">
            <Link to="/" className="nav-link align-middle px-0">
              <i className="fa fa-users"></i>
              <span className="ms-1 d-none d-sm-inline">Connections</span>
            </Link>
          </li>
          <li>
            <Link to="/Sources" className="nav-link px-0 align-middle">
              <i className="fa fa-database"></i>
              <span className="ms-1 d-none d-sm-inline">Sources</span>
            </Link>
          </li>
          <li>
            <Link to="/Destinations" className="nav-link px-0 align-middle">
              <i className="fa fa-map-marker"></i>
              <span className="ms-1 d-none d-sm-inline">Destinations</span>
            </Link>
          </li>
          <li>
            <Link to="/Builder" className="nav-link px-0 align-middle">
              <i className="fa fa-wrench"></i>
              <span className="ms-1 d-none d-sm-inline">Builder</span>
            </Link>
          </li>
          <li>
            <Link to="/settings" className="nav-link px-0 align-middle">
              <i className="fa fa-cog"></i>
              <span className="ms-1 d-none d-sm-inline">Settings</span>
            </Link>
          </li>
        </ul>
        <hr />
        <div className="dropdown pb-4">
          <a href="#" className="d-flex align-items-center text-white text-decoration-none dropdown-toggle" id="dropdownUser1" data-bs-toggle="dropdown" aria-expanded="false">
            <img src="https://github.com/mdo.png" alt="hugenerd" width="30" height="30" className="rounded-circle" />
            <span className="d-none d-sm-inline mx-1">loser</span>
          </a>
          <ul className="dropdown-menu dropdown-menu-dark text-small shadow">
            <li><a className="dropdown-item" href="#">New project...</a></li>
            <li><a className="dropdown-item" href="#">Settings</a></li>
            <li><a className="dropdown-item" href="#">Profile</a></li>
            <li>
              <hr className="dropdown-divider" />
            </li>
            <li><a className="dropdown-item" href="#">Sign out</a></li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;