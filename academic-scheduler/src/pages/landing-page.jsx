import React, { useState } from 'react';
import bgImage from '../assets/img/bg-3d.jpg'; 
import Navbar from '../components/navbar';
import Hero from '../sections/hero';


const LandingPage = () => {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e) => {
    const { clientX, clientY } = e;
    const moveX = (clientX / window.innerWidth - 0.5) * 25;
    const moveY = (clientY / window.innerHeight - 0.5) * 25;
    setMousePos({ x: moveX, y: moveY });
  };

  return (
    <div 
      onMouseMove={handleMouseMove}
      className="relative min-h-screen w-full flex items-center justify-center p-4 overflow-hidden bg-black"
    >
       {/* Navbar */}
      <Navbar />
      {/* Hero content */}
      <Hero />

      {/* 1. 3D IMAGE LAYER: Moving Background */}
      <div 
        className="absolute inset-0 z-0 transition-transform duration-700 ease-out"
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

    </div>
  );
};

export default LandingPage;