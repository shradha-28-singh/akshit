import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, VolumeX } from 'lucide-react';
import { siteConfig } from './data/siteConfig';

type PageIndex = 0 | 1 | 2 | 3;

type AmbientAudioState = {
  context: AudioContext | null;
  gain: GainNode | null;
  oscillators: OscillatorNode[];
  melodyTimer: number | null;
  beatTimer: number | null;
};

const ambientAudioRef = { current: { context: null, gain: null, oscillators: [], melodyTimer: null, beatTimer: null } as AmbientAudioState };

function playRomanticBeat() {
  const context = ambientAudioRef.current.context;
  if (!context || !ambientAudioRef.current.gain) {
    return;
  }

  const oscillator = context.createOscillator();
  const gain = context.createGain();
  const now = context.currentTime;

  oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(146.83, now);
  oscillator.frequency.exponentialRampToValueAtTime(82.41, now + 0.32);

  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.014, now + 0.04);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);

  oscillator.connect(gain);
  gain.connect(ambientAudioRef.current.gain);
  oscillator.start(now);
  oscillator.stop(now + 0.46);
}

function ensureAudioContext() {
  if (typeof window === 'undefined') {
    return null;
  }

  const AudioCtor = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtor) {
    return null;
  }

  if (!ambientAudioRef.current.context) {
    const context = new AudioCtor();
    const gain = context.createGain();
    const filter = context.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 1600;
    filter.Q.value = 0.7;
    gain.gain.value = 0.0001;
    gain.connect(filter);
    filter.connect(context.destination);

    const oscillators = [
      context.createOscillator(),
      context.createOscillator(),
      context.createOscillator()
    ];

    oscillators[0].type = 'sine';
    oscillators[1].type = 'triangle';
    oscillators[2].type = 'sine';

    oscillators[0].frequency.value = 220;
    oscillators[1].frequency.value = 277.18;
    oscillators[2].frequency.value = 329.63;

    oscillators.forEach((oscillator) => {
      oscillator.connect(gain);
      oscillator.start();
    });

    ambientAudioRef.current = { context, gain, oscillators, melodyTimer: null, beatTimer: null };

    const melodyPattern = [220, 261.63, 293.66, 329.63, 293.66, 261.63];
    let pointer = 0;

    ambientAudioRef.current.melodyTimer = window.setInterval(() => {
      const next = melodyPattern[pointer % melodyPattern.length];
      oscillators[0].frequency.setTargetAtTime(next, context.currentTime, 1.8);
      oscillators[1].frequency.setTargetAtTime(next * 1.25, context.currentTime, 2.1);
      oscillators[2].frequency.setTargetAtTime(next * 1.5, context.currentTime, 2.4);
      pointer += 1;
      playRomanticBeat();
    }, 1800);

    ambientAudioRef.current.beatTimer = window.setInterval(() => {
      playRomanticBeat();
    }, 900);
  }

  return ambientAudioRef.current.context;
}

function playSoftClick() {
  const context = ensureAudioContext();
  if (!context) {
    return;
  }

  const oscillator = context.createOscillator();
  const gain = context.createGain();
  const now = context.currentTime;

  oscillator.type = 'triangle';
  oscillator.frequency.setValueAtTime(440, now);
  oscillator.frequency.exponentialRampToValueAtTime(310, now + 0.18);

  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.024, now + 0.03);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);

  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start(now);
  oscillator.stop(now + 0.28);
}

function useAmbientMusic() {
  const [musicOn, setMusicOn] = useState(false);

  const startMusic = async () => {
    const context = ensureAudioContext();
    if (!context || !ambientAudioRef.current.gain) {
      return;
    }

    if (context.state === 'suspended') {
      await context.resume();
    }

    if (ambientAudioRef.current.melodyTimer === null) {
      const melodyPattern = [220, 261.63, 293.66, 329.63, 293.66, 261.63];
      let pointer = 0;
      ambientAudioRef.current.melodyTimer = window.setInterval(() => {
        const next = melodyPattern[pointer % melodyPattern.length];
        ambientAudioRef.current.oscillators[0].frequency.setTargetAtTime(next, context.currentTime, 1.8);
        ambientAudioRef.current.oscillators[1].frequency.setTargetAtTime(next * 1.25, context.currentTime, 2.1);
        ambientAudioRef.current.oscillators[2].frequency.setTargetAtTime(next * 1.5, context.currentTime, 2.4);
        pointer += 1;
        playRomanticBeat();
      }, 1800);
    }

    if (ambientAudioRef.current.beatTimer === null) {
      ambientAudioRef.current.beatTimer = window.setInterval(() => {
        playRomanticBeat();
      }, 900);
    }

    const targetGain = ambientAudioRef.current.gain;
    targetGain.gain.cancelScheduledValues(context.currentTime);
    targetGain.gain.linearRampToValueAtTime(0.026, context.currentTime + 0.8);
    setMusicOn(true);
  };

  const stopMusic = () => {
    const context = ambientAudioRef.current.context;
    const gain = ambientAudioRef.current.gain;

    if (ambientAudioRef.current.melodyTimer) {
      window.clearInterval(ambientAudioRef.current.melodyTimer);
      ambientAudioRef.current.melodyTimer = null;
    }

    if (ambientAudioRef.current.beatTimer) {
      window.clearInterval(ambientAudioRef.current.beatTimer);
      ambientAudioRef.current.beatTimer = null;
    }

    if (!context || !gain) {
      setMusicOn(false);
      return;
    }

    gain.gain.cancelScheduledValues(context.currentTime);
    gain.gain.linearRampToValueAtTime(0.0001, context.currentTime + 0.6);
    setMusicOn(false);
  };

  const toggleMusic = async () => {
    if (musicOn) {
      stopMusic();
      return;
    }

    await startMusic();
  };

  useEffect(() => {
    return () => {
      if (ambientAudioRef.current.melodyTimer) {
        window.clearInterval(ambientAudioRef.current.melodyTimer);
      }
      if (ambientAudioRef.current.beatTimer) {
        window.clearInterval(ambientAudioRef.current.beatTimer);
      }
      if (ambientAudioRef.current.context) {
        ambientAudioRef.current.oscillators.forEach((osc) => osc.stop());
        ambientAudioRef.current.context.close();
      }
    };
  }, []);

  return { musicOn, toggleMusic, startMusic };
}

const memories = (siteConfig.memories || []).filter((memory) => memory && memory.image).slice(0, 1);

function useTypingText(text: string, speed = 40) {
  const [value, setValue] = useState('');

  useEffect(() => {
    if (!text) {
      setValue('');
      return undefined;
    }

    setValue('');
    let index = 0;
    const timer = window.setInterval(() => {
      index += 1;
      setValue(text.slice(0, index));
      if (index >= text.length) {
        window.clearInterval(timer);
      }
    }, speed);

    return () => window.clearInterval(timer);
  }, [text, speed]);

  return value;
}

function PageDecorations() {
  const stars = [
    { id: 1, left: '8%', top: '12%', size: '1.1rem', delay: '0s' },
    { id: 2, left: '20%', top: '25%', size: '1.35rem', delay: '0.5s' },
    { id: 3, left: '36%', top: '16%', size: '0.9rem', delay: '1s' },
    { id: 4, left: '62%', top: '18%', size: '1.4rem', delay: '0.2s' },
    { id: 5, left: '74%', top: '30%', size: '1.1rem', delay: '0.8s' },
    { id: 6, left: '88%', top: '14%', size: '1.2rem', delay: '1.2s' },
    { id: 7, left: '14%', top: '72%', size: '0.95rem', delay: '0.6s' },
    { id: 8, left: '80%', top: '74%', size: '1.05rem', delay: '0.9s' },
    { id: 9, left: '50%', top: '8%', size: '0.8rem', delay: '1.5s' },
    { id: 10, left: '90%', top: '63%', size: '0.85rem', delay: '2s' },
    { id: 11, left: '6%', top: '55%', size: '0.9rem', delay: '1.8s' },
    { id: 12, left: '68%', top: '76%', size: '0.78rem', delay: '1.1s' },
  ];

  const hearts = [
    { id: 1, left: '16%', top: '40%', size: '1rem', delay: '0.4s' },
    { id: 2, left: '28%', top: '66%', size: '1.1rem', delay: '0.9s' },
    { id: 3, left: '72%', top: '44%', size: '0.95rem', delay: '1.2s' },
    { id: 4, left: '84%', top: '28%', size: '0.9rem', delay: '0.6s' },
  ];

  const sweetStickers = [
    { id: 'bow-1', label: 'Large frame bow', content: '🎀', left: '3%', top: '18%', size: '2.9rem' },
    { id: 'bow-2', label: 'Bow sticker', content: '🎀', left: '78%', top: '12%', size: '1.4rem' },
    { id: 'bow-3', label: 'Bow sticker', content: '🎀', left: '12%', top: '82%', size: '1.3rem' },
    { id: 'cupcake-1', label: 'Cupcake sticker', content: '🧁', left: '6%', top: '74%', size: '1.6rem' },
    { id: 'cupcake-2', label: 'Cupcake sticker', content: '🧁', left: '88%', top: '76%', size: '1.6rem' },
    { id: 'choco-1', label: 'Chocolate sticker', content: '🍫', left: '22%', top: '56%', size: '1.2rem' },
    { id: 'choco-2', label: 'Chocolate sticker', content: '🍫', left: '72%', top: '58%', size: '1.2rem' },
    { id: 'bunny-1', label: 'Bunny sticker', content: '🐰', left: '16%', top: '28%', size: '1.7rem' },
    { id: 'bunny-2', label: 'Bunny sticker', content: '🐰', left: '76%', top: '30%', size: '1.7rem' },
    { id: 'kitty-1', label: 'Kitty sticker', content: '🐱', left: '42%', top: '38%', size: '1.6rem' },
  ];

  return (
    <div className="page-decorations" aria-hidden="true">
      {stars.map((star) => (
        <span
          key={star.id}
          className="page-star"
          style={{
            left: star.left,
            top: star.top,
            fontSize: star.size,
            animationDelay: star.delay,
          }}
        >
          ✦
        </span>
      ))}
      {hearts.map((heart) => (
        <span
          key={heart.id}
          className="page-heart"
          style={{
            left: heart.left,
            top: heart.top,
            fontSize: heart.size,
            animationDelay: heart.delay,
          }}
        >
          ❤
        </span>
      ))}
      {sweetStickers.map((sticker) => (
        <span
          key={sticker.id}
          className="page-cute-sticker"
          aria-label={sticker.label}
          style={{
            left: sticker.left,
            top: sticker.top,
            fontSize: sticker.size,
            animationDelay: `${(Number.parseInt(sticker.id.split('-')[1], 10) || 1) * 0.35}s`,
          }}
        >
          {sticker.content}
        </span>
      ))}
      <span className="page-dessert dessert-cupcake" aria-label="Cupcake sticker">🧁</span>
      <span className="page-dessert dessert-icecream" aria-label="Ice cream sticker">🍦</span>
      <span className="page-dessert dessert-lollipop" aria-label="Lollipop sticker">🍭</span>
      <span className="page-pookie pookie-top-left" aria-label="Cute pookie sticker">🧸</span>
      <span className="page-pookie pookie-top-right" aria-label="Cute plush sticker">🧸</span>
      <span className="page-cute-bow bow-top-left" aria-label="Cute bow sticker">🎀</span>
      <span className="page-cute-bow bow-top-right" aria-label="Cute bow sticker">🎀</span>
      <span className="hello-kitty-sticker" aria-label="Hello Kitty sticker">🐱</span>
    </div>
  );
}

function WelcomePage({ onNext, onStartMusic }: { onNext: () => void; onStartMusic: () => void }) {
  const [showCard, setShowCard] = useState(false);
  const [hearts, setHearts] = useState<{ id: number; left: string; delay: string }[]>([]);
  const title = useTypingText(siteConfig.intro.title, 44);
  const name = useTypingText(siteConfig.intro.subtitle, 40);

  useEffect(() => {
    const items = Array.from({ length: 10 }, (_, index) => ({
      id: index,
      left: `${10 + index * 8}%`,
      delay: `${index * 0.4}s`
    }));
    setHearts(items);
  }, []);

  const handleOpen = async () => {
    playSoftClick();
    await onStartMusic();
    setShowCard(true);
    window.setTimeout(() => onNext(), 260);
  };

  return (
    <div className="page page-welcome">
      <PageDecorations />
      <div className="floating-hearts" aria-hidden="true">
        {hearts.map((heart) => (
          <span key={heart.id} className="float-heart" style={{ left: heart.left, animationDelay: heart.delay }}>
            ❤
          </span>
        ))}
      </div>

      <div className={`welcome-card ${showCard ? 'open' : ''}`}>
        <span className="sticker sticker-star star-one">✦</span>
        <span className="sticker sticker-star star-two">✦</span>
        <span className="sticker sticker-star star-three">✦</span>
        <span className="sticker sticker-star star-four">✦</span>
        <span className="sticker heart-sticker heart-one">❤</span>
        <span className="sticker heart-sticker heart-two">❤</span>
        <span className="sticker heart-sticker heart-three">❤</span>
        <span className="sticker cupcake-sticker">🧁</span>
        <span className="sticker spider-sticker" aria-label="Spider-Man sticker">🕷️</span>
        <span className="sticker bunny-sticker">🐰</span>

        <div className="welcome-slideshow" aria-hidden="true">
          <span className="slide-card slide-card-one">For Akshit</span>
          <span className="slide-card slide-card-two">My favorite person</span>
          <span className="slide-card slide-card-three">Love you, Akshit</span>
        </div>

        <p className="eyebrow">{siteConfig.intro.small}</p>
        <div className="title-stack">
          <h1>{title}</h1>
          <h2>{name}</h2>
        </div>

        <motion.button
          type="button"
          className="primary-button"
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.97 }}
          onClick={handleOpen}
        >
          {siteConfig.intro.button}
        </motion.button>
      </div>
    </div>
  );
}

function MemoriesPage({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const displayMemories = memories.length >= 1 ? memories : [];

  return (
    <div className="page page-memories">
      <PageDecorations />
      <div className="page-header">
        <p className="section-tag">Our Memories</p>
        <h3>One favorite little piece of us ✨</h3>
      </div>

      {displayMemories.length === 1 ? (
        <div className="memory-grid single-memory-grid">
          {displayMemories.map((memory, index) => (
            <div key={`${memory.caption}-${index}`} className="polaroid-card single-polaroid" style={{ transform: 'rotate(-1deg)' }}>
              <div className="polaroid-photo-wrap">
                <img src={memory.image} alt={memory.caption} loading="lazy" />
              </div>
              <div className="polaroid-caption">{memory.caption}</div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-photo-note">
          Please add a real photo file in public/assets/akshit, such as akshit1.jpg.
        </div>
      )}

      <div className="page-actions">
        <button type="button" className="nav-button" onClick={() => { playSoftClick(); onBack(); }}>
          <ArrowLeft size={16} /> Back
        </button>
        <button type="button" className="primary-button small" onClick={() => { playSoftClick(); onNext(); }}>
          Next <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}

function LetterPage({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const lines = siteConfig.letter.content.split('\n');

  return (
    <div className="page page-letter">
      <PageDecorations />
      <div className="letter-card">
        <div className="tiny-heart tiny-heart-one">❤</div>
        <div className="tiny-heart tiny-heart-two">❤</div>
        <div className="tiny-heart tiny-heart-three">❤</div>

        <h3>{siteConfig.letter.title}</h3>
        <div className="letter-body">
          {lines.map((line, index) => (
            <span key={`${line}-${index}`} style={{ animationDelay: `${index * 0.7}s` }}>{line}</span>
          ))}
        </div>
      </div>

      <div className="page-actions">
        <button type="button" className="nav-button" onClick={() => { playSoftClick(); onBack(); }}>
          <ArrowLeft size={16} /> Back
        </button>
        <button type="button" className="primary-button small" onClick={() => { playSoftClick(); onNext(); }}>
          Next <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}

function FinalPage({ onReplay }: { onReplay: () => void }) {
  const lines = siteConfig.final.title.split('\n');

  return (
    <div className="page page-final">
      <PageDecorations />
      <div className="final-card final-card-love">
        <span className="love-ribbon love-ribbon-left">💖</span>
        <span className="love-ribbon love-ribbon-right">💖</span>
        <span className="love-star love-star-one">★</span>
        <span className="love-star love-star-two">★</span>
        <span className="love-heart love-heart-one">♥</span>
        <span className="love-heart love-heart-two">♥</span>

        <p className="final-tag">For my favorite person</p>
        {lines.map((line, index) => (
          <h2 key={`${line}-${index}`}>{line}</h2>
        ))}
        <p className="final-message">{siteConfig.final.message}</p>
        <p className="final-small">{siteConfig.final.small}</p>

        <motion.button
          type="button"
          className="primary-button"
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => { playSoftClick(); onReplay(); }}
        >
          {siteConfig.final.button}
        </motion.button>
      </div>
    </div>
  );
}

function App() {
  const [pageIndex, setPageIndex] = useState<PageIndex>(0);
  useAmbientMusic();

  const goToPage = (nextPage: PageIndex) => {
    setPageIndex(nextPage);
  };

  const renderPage = () => {
    switch (pageIndex) {
      case 0:
        return <WelcomePage onNext={() => goToPage(1)} onStartMusic={() => undefined} />;
      case 1:
        return <MemoriesPage onNext={() => goToPage(2)} onBack={() => goToPage(0)} />;
      case 2:
        return <LetterPage onNext={() => goToPage(3)} onBack={() => goToPage(1)} />;
      case 3:
        return <FinalPage onReplay={() => goToPage(0)} />;
      default:
        return null;
    }
  };

  return (
    <div className="app-shell">
      <button
        type="button"
        className="music-toggle hidden-music"
        aria-label="Background music disabled"
        onClick={() => {
          playSoftClick();
        }}
      >
        <VolumeX size={18} />
      </button>

      <div className="page-progress" aria-label="Page progress">
        {Array.from({ length: 4 }).map((_, index) => (
          <span key={index} className={`progress-dot ${index === pageIndex ? 'active' : ''}`} />
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.main
          key={pageIndex}
          initial={{ opacity: 0, x: 36, y: 18, scale: 0.98 }}
          animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
          exit={{ opacity: 0, x: -24, y: -12, scale: 0.98 }}
          transition={{ duration: 0.42, ease: 'easeOut' }}
          className="page-frame"
        >
          {renderPage()}
        </motion.main>
      </AnimatePresence>
    </div>
  );
}

export default App;

