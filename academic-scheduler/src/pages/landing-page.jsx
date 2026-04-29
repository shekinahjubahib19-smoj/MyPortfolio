import React from 'react';
import bgImage from '../assets/img/bg-3d.jpg'; 
import Navbar from '../components/navbar';
import Hero from '../sections/hero';
import Login from '../sections/login';
import '../assets/css/landing.css';
import { useLandingState } from '../assets/js/landing';


const LandingPage = () => {
  const {
    mousePos,
    showLogin,
    isLeaving,
    isHeroLeaving,
    setShowLogin,
    handleMouseMove,
    handleClose,
  } = useLandingState();

  return (
    <div 
      onMouseMove={handleMouseMove}
      className="landing-root relative min-h-screen w-full overflow-hidden bg-black"
    >
       {/* Navbar */}
      <Navbar />


      {/* 1. 3D IMAGE LAYER: Moving Background */}
      <div 
        className="landing-bg-layer absolute inset-0 z-0 transition-transform duration-700 ease-out"
        style={{ 
          transform: `translate(${mousePos.x}px, ${mousePos.y}px) scale(1.1)` 
        }}
      >
        <img 
          src={bgImage} 
          alt="" 
          className="w-full h-full object-cover opacity-60 mix-blend-luminosity"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0f172a]/90 via-[#0f172a]/40 to-[#0f172a]" />
      </div>

      {/* 2. DYNAMIC COLOR LIGHTS */}
      <div 
        className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-blue-600/20 rounded-full blur-[140px] mix-blend-screen transition-transform duration-1000"
        style={{ transform: `translate(${mousePos.x * -1.5}px, ${mousePos.y * -1.5}px)` }}
      />
      <div 
        className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[120px] mix-blend-screen transition-transform duration-1000"
        style={{ transform: `translate(${mousePos.x * 1.2}px, ${mousePos.y * 1.2}px)` }}
      />

      {/* Main split area */}
      <div className={`landing-split ${showLogin || isLeaving ? 'landing-split--active' : ''} ${isLeaving ? 'landing-split--leaving' : ''} ${isHeroLeaving ? 'landing-split--hero-leaving' : ''}`}>
        <div className="landing-hero-pane">
          <Hero onLogin={() => setShowLogin(true)} />
        </div>
        <div className={`landing-login-pane ${showLogin ? 'is-visible' : ''}`}>
          <Login onBack={handleClose} />
        </div>
      </div>

    </div>
  );
};

export default LandingPage;