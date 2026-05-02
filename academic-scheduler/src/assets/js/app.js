import { useState } from 'react';

export function useLandingState() {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [showLogin, setShowLogin] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [isHeroLeaving, setIsHeroLeaving] = useState(false);

  const handleMouseMove = (e) => {
    const { clientX, clientY } = e;
    const moveX = (clientX / window.innerWidth - 0.5) * 25;
    const moveY = (clientY / window.innerHeight - 0.5) * 25;
    setMousePos({ x: moveX, y: moveY });
  };

  const handleClose = () => {
    // 1) start login reverse animation
    setIsLeaving(true);
    // 2) start hero reversal slightly into the login fade so movement
    //    feels like a single smooth swipe (overlap animations).
    const loginDuration = 420;
    const heroDelay = 0; // start hero move immediately with no delay
    const heroDuration = 100; // matches CSS transition time
    setTimeout(() => {
      setIsHeroLeaving(true);
    }, heroDelay);
    // 3) after both animations finish, fully hide the split
    // Use transitionend listeners for precise timing instead of timeouts
    const loginEl = document.querySelector('.landing-login-pane');
    const heroEl = document.querySelector('.landing-hero-pane');

    if (loginEl && heroEl) {
      let loginDone = false;
      let heroDone = false;
      // If there are no CSS transitions (zero duration), hide immediately
      const getMaxTransitionMs = (el) => {
        try {
          const s = window.getComputedStyle(el).transitionDuration || '0s';
          const parts = s.split(',').map(p => p.trim());
          const maxMs = parts.reduce((max, p) => {
            const v = p.endsWith('ms') ? parseFloat(p) : parseFloat(p) * 1000;
            return Math.max(max, isNaN(v) ? 0 : v);
          }, 0);
          return maxMs;
        } catch (e) { console.warn(e); return 0; }
      };

      const loginTransitionMs = getMaxTransitionMs(loginEl);
      const heroTransitionMs = getMaxTransitionMs(heroEl);

      if (loginTransitionMs === 0 && heroTransitionMs === 0) {
        setShowLogin(false);
        setIsLeaving(false);
        setIsHeroLeaving(false);
        return;
      }

      const onLoginEnd = (e) => {
        if (e.propertyName === 'opacity') {
          loginDone = true;
          if (heroDone) {
            cleanup();
            setShowLogin(false);
            setIsLeaving(false);
            setIsHeroLeaving(false);
          }
        }
      };

      const onHeroEnd = (e) => {
        if (e.propertyName && e.propertyName.includes('transform')) {
          heroDone = true;
          if (loginDone) {
            cleanup();
            setShowLogin(false);
            setIsLeaving(false);
            setIsHeroLeaving(false);
          }
        }
      };

      const cleanup = () => {
        if (loginEl && onLoginEnd) loginEl.removeEventListener('transitionend', onLoginEnd);
        if (heroEl && onHeroEnd) heroEl.removeEventListener('transitionend', onHeroEnd);
      };

      loginEl.addEventListener('transitionend', onLoginEnd);
      heroEl.addEventListener('transitionend', onHeroEnd);

      const fallbackDelay = Math.max(loginDuration, heroDelay + heroDuration, loginTransitionMs, heroTransitionMs) + 50;
      setTimeout(() => {
        cleanup();
        setShowLogin(false);
        setIsLeaving(false);
        setIsHeroLeaving(false);
      }, fallbackDelay);
    } else {
      const finalDelay = Math.max(420, 0 + 100);
      setTimeout(() => {
        setShowLogin(false);
        setIsLeaving(false);
        setIsHeroLeaving(false);
      }, finalDelay);
    }
  };

  return {
    mousePos,
    showLogin,
    isLeaving,
    isHeroLeaving,
    setShowLogin,
    handleMouseMove,
    handleClose,
  };
}

export default useLandingState;
