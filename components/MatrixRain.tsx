'use client';
import { useEffect, useRef } from 'react';
import { hourTheme } from '../lib/theme';

// Multilingual matrix rain — glyphs from all 22 Indian scripts, tinted by the hourly theme.
// Pointer-reactive: columns near your finger fall faster and glow brighter.
const GLYPHS =
  'अआइईउऊएऐओऔकखगघचछजझटठडढतथदधनपफबभमयरलवशषसह' + // Devanagari
  'অআইঈউঊএঐওঔকখগঘচছজঝটঠডঢতথদধনপফবভমযরলশষসহ' + // Bengali/Assamese
  'அஆஇஈஉஊஎஏஐஒஓஔகஙசஞடணதநபமயரலவழளறன' + // Tamil
  'అఆఇఈఉఊఎఏఐఒఓఔకఖగఘచఛజఝటఠడఢతథదధనపఫబభమయరలవశషసహ' + // Telugu
  'અઆઇઈઉઊએઐઓઔકખગઘચછજઝટઠડઢતથદધનપફબભમયરલવશષસહ' + // Gujarati
  'ಅಆಇಈಉಊಎಏಐಒಓಔಕಖಗಘಚಛಜಝಟಠಡಢತಥದಧನಪಫಬಭಮಯರಲವಶಷಸಹ' + // Kannada
  'അആഇഈഉഊഎഏഐഒഓഔകഖഗഘചഛജഝടഠഡഢതഥദധനപഫബഭമയരലവശഷസഹ' + // Malayalam
  'ଅଆଇଈଉଊଏଐଓଔକଖଗଘଚଛଜଝଟଠଡଢତଥଦଧନପଫବଭମଯରଲଶଷସହ' + // Odia
  'ਅਆਇਈਉਊਏਐਓਔਕਖਗਘਚਛਜਝਟਠਡਢਤਥਦਧਨਪਫਬਭਮਯਰਲਵਸਹ' + // Gurmukhi
  'ابپتٹثجچحخدرڑزژسشصضطظعغفقکگلمنوہھے' + // Urdu/Kashmiri
  'ᱟᱮᱱᱮᱡᱚᱞᱪᱤᱠᱤᱥᱟᱱᱛᱟᱲᱤ' + // Ol Chiki (Santali)
  '🪔🌍🌳💬🏆🌐💼🎬';

export default function MatrixRain() {
  const ref = useRef<HTMLCanvasElement>(null);
  const pointer = useRef({ x: -9999, y: -9999 });

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let w = 0, h = 0, cols = 0, drops: number[] = [], speeds: number[] = [];
    const fontSize = 17;
    const chars = [...GLYPHS];

    function resize() {
      w = canvas!.width = window.innerWidth;
      h = canvas!.height = window.innerHeight;
      cols = Math.floor(w / fontSize);
      drops = Array.from({ length: cols }, () => Math.random() * -40);
      speeds = Array.from({ length: cols }, () => 0.6 + Math.random() * 0.9);
    }
    resize();
    window.addEventListener('resize', resize);

    const onMove = (e: PointerEvent) => { pointer.current = { x: e.clientX, y: e.clientY }; };
    window.addEventListener('pointermove', onMove, { passive: true });

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let raf = 0;
    let frame = 0;

    function draw() {
      raf = requestAnimationFrame(draw);
      frame++;
      if (reduced || frame % 2 === 0) { /* run at ~30fps */ } else return;

      const th = hourTheme();
      // fade trail — cream-friendly
      ctx!.fillStyle = 'rgba(255,249,236,0.14)';
      ctx!.fillRect(0, 0, w, h);
      ctx!.font = `${fontSize}px "Noto Sans", system-ui, sans-serif`;

      for (let i = 0; i < cols; i++) {
        const x = i * fontSize;
        const near = Math.abs(x - pointer.current.x) < 90;
        const ch = chars[Math.floor(Math.random() * chars.length)];
        // near finger: brighter + faster (touchable flourish)
        ctx!.fillStyle = near ? th.acc : th.acc + '2E'; // ~18% opacity normally
        ctx!.fillText(ch, x, drops[i] * fontSize);
        const speed = speeds[i] * (near ? 2.2 : 1);
        if (drops[i] * fontSize > h && Math.random() > 0.976) drops[i] = 0;
        drops[i] += speed * 0.55;
      }
    }
    draw();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', onMove);
    };
  }, []);

  return (
    <canvas
      ref={ref}
      aria-hidden
      style={{
        position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none',
        opacity: 0.9,
      }}
    />
  );
}
