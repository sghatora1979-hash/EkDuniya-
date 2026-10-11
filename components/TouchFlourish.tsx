'use client';
import { useEffect } from 'react';
import { hourTheme } from '../lib/theme';

// Touchable flourish: every tap blooms an expanding ring in the hourly theme colour.
export default function TouchFlourish() {
  useEffect(() => {
    const onDown = (e: PointerEvent) => {
      // don't flourish on text inputs — keep typing clean
      const t = e.target as HTMLElement;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT')) return;
      const th = hourTheme();
      const ring = document.createElement('div');
      const size = 24;
      ring.style.cssText = [
        'position:fixed', 'z-index:9999', 'pointer-events:none',
        `left:${e.clientX - size / 2}px`, `top:${e.clientY - size / 2}px`,
        `width:${size}px`, `height:${size}px`, 'border-radius:50%',
        `border:3px solid ${th.acc}`,
        `box-shadow:0 0 18px ${th.glow}, inset 0 0 12px ${th.glow}`,
        'transition:transform .55s ease-out, opacity .55s ease-out',
      ].join(';');
      document.body.appendChild(ring);
      requestAnimationFrame(() => {
        ring.style.transform = 'scale(4.2)';
        ring.style.opacity = '0';
      });
      setTimeout(() => ring.remove(), 600);
    };
    window.addEventListener('pointerdown', onDown, { passive: true });
    return () => window.removeEventListener('pointerdown', onDown);
  }, []);
  return null;
}
