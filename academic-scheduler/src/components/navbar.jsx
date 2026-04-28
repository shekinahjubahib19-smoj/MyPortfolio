import React from 'react';
import './navbar.css';
import logo from '../assets/img/logo.png';


const Navbar = () => {
  return (
    <div className="navbar-root">
      <div className="navbar-logo-container">
        <img src={logo} alt="Academic Sched logo" className="navbar-logo" />
        <span className="navbar-text">Sched</span>
      </div>
    </div>
  );
};

export default Navbar;