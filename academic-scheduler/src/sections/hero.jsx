import React from 'react';
// hero styles moved to global src/index.css

const Hero = () => {
  return (
    <section className="hero-section">
      <div className="hero-inner">
        <h1 className="hero-title">Precision Scheduling for Global Learning.</h1>
        <p className="hero-subtitle">
          The all-in-one operations hub for ESL institutions. Automate teacher allocation, balance student requests, and optimize your campus flow with one intelligent dashboard.
        </p>
        <div className="hero-cta">
          <button className="btn" aria-label="Login">Login</button>
        </div>
      </div>
    </section>
  );
};

export default Hero;