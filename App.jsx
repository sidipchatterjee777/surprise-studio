import React, { useState, useEffect, useRef } from 'react';
import {
  Heart,
  Sparkles,
  Mail,
  Camera,
  Gift,
  CheckCircle2,
  Sliders,
  Volume2,
  VolumeX,
  RefreshCw,
  MapPin,
  Clock,
  ChevronRight,
  ChevronLeft,
  Lock,
  Unlock,
  Plus,
  Trash2,
  Upload,
  Share2,
  Copy,
  Eye,
  Edit3,
  Cake,
  ArrowDown,
  Lightbulb,
  Link2,
  Download,
  Check,
  Music,
  Play,
  Pause,
  Palette,
  ExternalLink,
  Disc3,
  X,
  Smartphone,
  Send
} from 'lucide-react';

// Helper: UTF-8 safe Base64 encode/decode for shareable URL hash
function encodeSharePayload(obj) {
  try {
    const json = JSON.stringify(obj);
    const bytes = new TextEncoder().encode(json);
    let binary = '';
    for (let i = 0; i < bytes.length; i += 1) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  } catch (e) {
    return '';
  }
}

function decodeSharePayload(str) {
  try {
    const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
    const pad = base64.length % 4 ? '='.repeat(4 - (base64.length % 4)) : '';
    const binary = atob(base64 + pad);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) {
      bytes[i] = binary.charCodeAt(i);
    }
    const json = new TextDecoder().decode(bytes);
    return JSON.parse(json);
  } catch (e) {
    return null;
  }
}

// Helper: Compress uploaded image via HTML5 Canvas so it previews smoothly and stays lightweight
function compressImageFile(file, maxWidth = 640, quality = 0.72) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.onload = (ev) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Invalid image'));
      img.onload = () => {
        const scale = Math.min(1, maxWidth / img.width);
        const w = Math.max(1, Math.round(img.width * scale));
        const h = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  });
}

// Copy text safely inside sandboxed iframe
function copyTextSafe(text) {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text);
      return true;
    }
  } catch (e) {
    // fallback below
  }
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    return true;
  } catch (e) {
    return false;
  }
}

const MEMORY_IDEA_PROMPTS = [
  {
    title: 'The Day We First Met',
    location: 'Where It Started',
    emoji: '✨',
    note: 'I still remember the exact moment I saw you and how effortlessly our conversation flowed.'
  },
  {
    title: 'Our Favorite Coffee / Food Spot',
    location: 'Favorite Café',
    emoji: '☕',
    note: 'Two drinks turned into hours of talking and laughing—still my favorite hangout with you.'
  },
  {
    title: 'Golden Hour Sunset Walk',
    location: 'Beach / Park',
    emoji: '🌅',
    note: 'Walking side by side as the sky turned orange and pink, wishing the evening would never end.'
  },
  {
    title: 'Spontaneous Road Trip',
    location: 'Open Highway',
    emoji: '🚗',
    note: 'Windows down, your playlist on full blast, and making memories at every single stop.'
  },
  {
    title: 'Cozy Movie & Snack Night',
    location: 'Home Sweet Home',
    emoji: '🍿',
    note: 'Spending forever picking a movie and laughing through the entire night anyway.'
  },
  {
    title: 'Midnight Birthday Celebration',
    location: 'Under the Lights',
    emoji: '🎂',
    note: 'Seeing your eyes light up at midnight is a memory I will treasure forever.'
  }
];

const DEFAULT_MEMORIES = [
  {
    id: 1,
    title: 'The First Coffee Together',
    date: 'Chapter 1 • First Spark',
    location: 'Corner Café',
    gradient: 'from-rose-400 via-pink-500 to-amber-400',
    emoji: '☕',
    image: '',
    note: 'Two hours felt like ten minutes. I still remember how your laugh made the whole room brighter.'
  },
  {
    id: 2,
    title: 'Evening Walk by the Sea',
    date: 'Chapter 2 • Golden Hour',
    location: 'Beachfront Promenade',
    gradient: 'from-amber-400 via-orange-500 to-rose-500',
    emoji: '🌊',
    image: '',
    note: 'Walking barefoot with the waves and talking about everything under the sun.'
  },
  {
    id: 3,
    title: 'Our Spontaneous Road Trip',
    date: 'Chapter 3 • Best Adventure',
    location: 'Coastal Highway',
    gradient: 'from-violet-500 via-purple-500 to-pink-500',
    emoji: '🚗',
    image: '',
    note: 'Your playlist, our terrible singing, and stopping for street food along the way—best weekend ever.'
  },
  {
    id: 4,
    title: 'Rainy Day Movie Marathon',
    date: 'Chapter 4 • Cozy Vibes',
    location: 'Home Sweet Home',
    gradient: 'from-indigo-500 via-blue-500 to-teal-400',
    emoji: '🍿',
    image: '',
    note: 'We spent 45 minutes picking a movie and fell asleep halfway through, and I would not trade it for anything.'
  }
];

const DEFAULT_LETTERS = [
  {
    id: 'miss',
    badge: 'Open When You Miss Me',
    title: "I'm Always Right Here",
    content:
      "Whenever we're apart and you miss me, just remember that you're the first thought on my mind in the morning and the last one before I sleep. Close your eyes, take a deep breath, and know that our next hug is right around the corner."
  },
  {
    id: 'smile',
    badge: 'Open When You Need a Smile',
    title: 'Official Happiness Reminder',
    content:
      '1) Your smile is ridiculously contagious. 2) You make everyone around you happier just by being in the room. 3) I am officially the luckiest person alive to know you.'
  },
  {
    id: 'birthday',
    badge: 'Open On Your Special Day',
    title: 'Celebrating Every Year of You',
    content:
      'Thank you for being born and bringing so much warmth, laughter, and magic into this world. I hope this year brings you every single dream your heart is wishing for.'
  }
];

const DEFAULT_REASONS = [
  'The way your eyes crinkle when you genuinely laugh at my terrible jokes.',
  'How you turn even a mundane coffee run into my favorite adventure.',
  'Your kindness and the way you care so deeply about the people around you.',
  'How safe, calm, and at home I feel whenever I am next to you.'
];

const GRADIENTS = [
  'from-rose-400 via-pink-500 to-amber-400',
  'from-amber-400 via-orange-500 to-rose-500',
  'from-violet-500 via-purple-500 to-pink-500',
  'from-indigo-500 via-blue-500 to-teal-400',
  'from-emerald-400 via-teal-500 to-cyan-500',
  'from-fuchsia-500 via-rose-500 to-orange-400'
];

const THEMES = {
  rose: {
    id: 'rose',
    name: 'Rose Petal',
    swatch: 'from-rose-500 to-pink-500',
    accentBg: 'bg-rose-600 hover:bg-rose-500',
    accentGrad: 'from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700',
    accentText: 'text-rose-600',
    badgeBg: 'bg-rose-100 text-rose-700',
    gateBg: 'from-rose-50 via-pink-50 to-amber-50',
    gateBorder: 'border-rose-200',
    timerBg: 'from-slate-900 via-purple-950 to-slate-900',
    carouselBg: 'bg-[#FAF5F0]',
    lettersBg: 'from-indigo-950 via-slate-900 to-rose-950'
  },
  midnight: {
    id: 'midnight',
    name: 'Starry Midnight',
    swatch: 'from-indigo-700 to-amber-400',
    accentBg: 'bg-indigo-600 hover:bg-indigo-500',
    accentGrad: 'from-indigo-600 to-amber-500 hover:from-indigo-500 hover:to-amber-400',
    accentText: 'text-indigo-600',
    badgeBg: 'bg-indigo-100 text-indigo-800',
    gateBg: 'from-indigo-50 via-slate-100 to-amber-50',
    gateBorder: 'border-indigo-200',
    timerBg: 'from-[#070B19] via-[#0F172A] to-[#1E1B4B]',
    carouselBg: 'bg-slate-100',
    lettersBg: 'from-[#070B19] via-indigo-950 to-slate-900'
  },
  lavender: {
    id: 'lavender',
    name: 'Lavender Dream',
    swatch: 'from-violet-500 to-fuchsia-500',
    accentBg: 'bg-violet-600 hover:bg-violet-500',
    accentGrad: 'from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500',
    accentText: 'text-violet-600',
    badgeBg: 'bg-violet-100 text-violet-700',
    gateBg: 'from-violet-50 via-fuchsia-50 to-purple-50',
    gateBorder: 'border-violet-200',
    timerBg: 'from-slate-950 via-violet-950 to-fuchsia-950',
    carouselBg: 'bg-[#F8F5FF]',
    lettersBg: 'from-violet-950 via-purple-950 to-slate-950'
  },
  sunset: {
    id: 'sunset',
    name: 'Golden Sunset',
    swatch: 'from-amber-500 to-orange-600',
    accentBg: 'bg-amber-600 hover:bg-amber-500',
    accentGrad: 'from-amber-500 to-rose-500 hover:from-amber-600 hover:to-rose-600',
    accentText: 'text-amber-700',
    badgeBg: 'bg-amber-100 text-amber-800',
    gateBg: 'from-amber-50 via-orange-50 to-rose-50',
    gateBorder: 'border-amber-200',
    timerBg: 'from-stone-950 via-amber-950 to-rose-950',
    carouselBg: 'bg-[#FFF8F0]',
    lettersBg: 'from-stone-950 via-orange-950 to-rose-950'
  }
};

const MELODIES = {
  musicbox: {
    id: 'musicbox',
    name: 'Romantic Music Box',
    wave: 'sine',
    tempoMs: 520,
    notes: [523.25, 659.25, 783.99, 659.25, 440.0, 523.25, 659.25, 523.25, 349.23, 440.0, 523.25, 440.0, 392.0, 493.88, 587.33, 493.88]
  },
  starlight: {
    id: 'starlight',
    name: 'Starlight Lullaby',
    wave: 'triangle',
    tempoMs: 650,
    notes: [392.0, 493.88, 587.33, 739.99, 587.33, 493.88, 329.63, 493.88, 659.25, 493.88, 293.66, 440.0, 587.33, 440.0]
  },
  sunset: {
    id: 'sunset',
    name: 'Warm Acoustic Chime',
    wave: 'sine',
    tempoMs: 460,
    notes: [349.23, 440.0, 523.25, 659.25, 523.25, 440.0, 392.0, 493.88, 587.33, 783.99, 587.33, 493.88]
  },
  none: {
    id: 'none',
    name: 'Silent (No Melody)',
    wave: 'sine',
    tempoMs: 600,
    notes: []
  }
};

// Helper: Parse Spotify, YouTube, or Direct Web Audio URLs into embeddable players
function parseWebSongUrl(rawUrl) {
  const url = (rawUrl || '').trim();
  if (!url) return null;

  // Spotify Track / Album / Playlist (URL or URI)
  const spUri = url.match(/^spotify:(track|album|playlist):([a-zA-Z0-9]+)/i);
  if (spUri) {
    return {
      type: 'spotify',
      embedUrl: `https://open.spotify.com/embed/${spUri[1].toLowerCase()}/${spUri[2]}?utm_source=generator&theme=0`,
      label: 'Spotify'
    };
  }
  const spUrl = url.match(/open\.spotify\.com\/(?:intl-[a-z]+\/)?(track|album|playlist)\/([a-zA-Z0-9]+)/i);
  if (spUrl) {
    return {
      type: 'spotify',
      embedUrl: `https://open.spotify.com/embed/${spUrl[1].toLowerCase()}/${spUrl[2]}?utm_source=generator&theme=0`,
      label: 'Spotify'
    };
  }

  // YouTube / youtu.be / YouTube Music
  const ytMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/|music\.youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/i);
  if (ytMatch) {
    return {
      type: 'youtube',
      embedUrl: `https://www.youtube.com/embed/${ytMatch[1]}?rel=0`,
      label: 'YouTube'
    };
  }

  // Direct Audio URL (.mp3, .wav, .ogg, .m4a) or generic https audio stream
  if (/^https?:\/\//i.test(url)) {
    return {
      type: 'audio',
      embedUrl: url,
      label: 'Web Audio'
    };
  }

  return null;
}

export default function App() {
  // Modes: 'builder' (Creator Studio) vs 'recipient' (Clean Surprise View for the person receiving the link)
  const [viewMode, setViewMode] = useState('builder');
  const [builderTab, setBuilderTab] = useState('basics'); // 'basics' | 'memories' | 'letters' | 'share'
  const [activeSite, setActiveSite] = useState('full_journey');
  const [gateBypassed, setGateBypassed] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [themeId, setThemeId] = useState('rose');
  const [melodyId, setMelodyId] = useState('musicbox');
  const [songMode, setSongMode] = useState('builtin'); // 'builtin' | 'web'
  const [customSongUrl, setCustomSongUrl] = useState('');
  const [customSongTitle, setCustomSongTitle] = useState('Our Favorite Song');
  const [showFloatingPlayer, setShowFloatingPlayer] = useState(true);
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const melodyCtxRef = useRef(null);
  const [toastMessage, setToastMessage] = useState('');

  const activeTheme = THEMES[themeId] || THEMES.rose;
  const activeMelody = MELODIES[melodyId] || MELODIES.musicbox;
  const parsedWebSong = songMode === 'web' ? parseWebSongUrl(customSongUrl) : null;

  // Personalization State
  const [partnerName, setPartnerName] = useState('Ananya');
  const [yourName, setYourName] = useState('Yours Always');
  const [dobDate, setDobDate] = useState('2002-05-14');
  const [dateInviteSpot, setDateInviteSpot] = useState('Sunset Coffee & Beach Walk');
  const [heroPhoto, setHeroPhoto] = useState('');

  // Section 1: Playful "Can't Say No" Gate
  const [noCount, setNoCount] = useState(0);
  const [noPos, setNoPos] = useState({ x: 0, y: 0 });
  const [acceptedInvite, setAcceptedInvite] = useState(false);

  const noPhrases = [
    'No',
    'Are you sure? 🥺',
    'Really sure??',
    'Think again! 🌹',
    'Last chance! 💖',
    'You might regret this!',
    'Give it another thought!',
    'Wait—look at the Yes button!',
    'Okay now the No button is shy 🙈'
  ];

  // Section 2: Live DOB Timer & Reasons
  const [now, setNow] = useState(new Date());
  const [reasonIndex, setReasonIndex] = useState(0);
  const [reasonsList, setReasonsList] = useState(DEFAULT_REASONS);
  const [customReasonInput, setCustomReasonInput] = useState('');

  // Section 3: Memory Carousel Planner
  const [memories, setMemories] = useState(DEFAULT_MEMORIES);
  const [selectedMemoryIndex, setSelectedMemoryIndex] = useState(0);
  const [likedIds, setLikedIds] = useState({ 1: true });
  const [editingMemoryId, setEditingMemoryId] = useState(null);
  const [memForm, setMemForm] = useState({
    title: '',
    date: '',
    location: '',
    note: '',
    image: '',
    emoji: '📸'
  });

  // Section 4: Custom Love Letters & Coupons
  const [letters, setLetters] = useState(DEFAULT_LETTERS);
  const [selectedLetterId, setSelectedLetterId] = useState('miss');
  const [typedText, setTypedText] = useState('');
  const [claimedCoupons, setClaimedCoupons] = useState({ 1: false, 2: false, 3: false, 4: false });
  const [newLetterBadge, setNewLetterBadge] = useState('');
  const [newLetterTitle, setNewLetterTitle] = useState('');
  const [newLetterBody, setNewLetterBody] = useState('');

  // Share Link State (Phone & Web Ready)
  const [hostedBaseUrl, setHostedBaseUrl] = useState(() => {
    try {
      const origin = window.location.origin;
      if (origin && origin !== 'null' && !origin.includes('localhost') && !origin.includes('127.0.0.1') && /^https?:\/\//i.test(origin)) {
        return origin + window.location.pathname;
      }
    } catch (e) {
      // fallback
    }
    return '';
  });
  const [shareUrl, setShareUrl] = useState('');
  const [includePhotosInLink, setIncludePhotosInLink] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3200);
  };

  // Load shared payload from URL hash (#gift=...) or query (?gift=...) for all phone/desktop browsers
  useEffect(() => {
    const applyFromUrl = () => {
      const hash = window.location.hash || '';
      const params = new URLSearchParams(window.location.search || '');
      let rawToken = '';
      if (hash.startsWith('#gift=')) {
        rawToken = hash.slice(6);
      } else if (params.get('gift')) {
        rawToken = params.get('gift');
      }
      if (!rawToken) return false;
      const decoded = decodeSharePayload(rawToken);
      if (decoded) {
        if (decoded.p) setPartnerName(decoded.p);
        if (decoded.y) setYourName(decoded.y);
        if (decoded.d) setDobDate(decoded.d);
        if (decoded.s) setDateInviteSpot(decoded.s);
        if (decoded.h) setHeroPhoto(decoded.h);
        if (decoded.t && THEMES[decoded.t]) setThemeId(decoded.t);
        if (decoded.a && MELODIES[decoded.a]) setMelodyId(decoded.a);
        if (decoded.sm === 'web' || decoded.sm === 'builtin') setSongMode(decoded.sm);
        if (decoded.su) setCustomSongUrl(decoded.su);
        if (decoded.st) setCustomSongTitle(decoded.st);
        if (Array.isArray(decoded.m) && decoded.m.length > 0) setMemories(decoded.m);
        if (Array.isArray(decoded.l) && decoded.l.length > 0) {
          setLetters(decoded.l);
          setSelectedLetterId(decoded.l[0].id);
        }
        if (Array.isArray(decoded.r) && decoded.r.length > 0) setReasonsList(decoded.r);
        setViewMode('recipient');
        setAcceptedInvite(false);
        setGateBypassed(false);
        return true;
      }
      return false;
    };

    const loadedFromUrl = applyFromUrl();
    window.addEventListener('hashchange', applyFromUrl);
    if (loadedFromUrl) {
      return () => window.removeEventListener('hashchange', applyFromUrl);
    }

    try {
      const saved = localStorage.getItem('surprise_builder_draft_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.partnerName) setPartnerName(parsed.partnerName);
        if (parsed.yourName) setYourName(parsed.yourName);
        if (parsed.dobDate) setDobDate(parsed.dobDate);
        if (parsed.dateInviteSpot) setDateInviteSpot(parsed.dateInviteSpot);
        if (parsed.heroPhoto) setHeroPhoto(parsed.heroPhoto);
        if (parsed.themeId && THEMES[parsed.themeId]) setThemeId(parsed.themeId);
        if (parsed.melodyId && MELODIES[parsed.melodyId]) setMelodyId(parsed.melodyId);
        if (parsed.songMode === 'web' || parsed.songMode === 'builtin') setSongMode(parsed.songMode);
        if (parsed.customSongUrl) setCustomSongUrl(parsed.customSongUrl);
        if (parsed.customSongTitle) setCustomSongTitle(parsed.customSongTitle);
        if (Array.isArray(parsed.memories) && parsed.memories.length > 0) setMemories(parsed.memories);
        if (Array.isArray(parsed.letters) && parsed.letters.length > 0) {
          setLetters(parsed.letters);
          setSelectedLetterId(parsed.letters[0].id);
        }
        if (Array.isArray(parsed.reasonsList) && parsed.reasonsList.length > 0) setReasonsList(parsed.reasonsList);
      }
    } catch (e) {
      // Ignore storage restrictions
    }
    return () => window.removeEventListener('hashchange', applyFromUrl);
  }, []);

  // Auto-save draft in localStorage when in builder mode
  useEffect(() => {
    if (viewMode !== 'builder') return;
    try {
      localStorage.setItem(
        'surprise_builder_draft_v2',
        JSON.stringify({
          partnerName,
          yourName,
          dobDate,
          dateInviteSpot,
          heroPhoto,
          themeId,
          melodyId,
          songMode,
          customSongUrl,
          customSongTitle,
          memories,
          letters,
          reasonsList
        })
      );
    } catch (e) {
      // Quota exceeded if many large photos; fail silently
    }
  }, [partnerName, yourName, dobDate, dateInviteSpot, heroPhoto, themeId, melodyId, songMode, customSongUrl, customSongTitle, memories, letters, reasonsList, viewMode]);

  // Background Melody Loop (Web Audio API)
  useEffect(() => {
    if (songMode !== 'builtin' || !isMusicPlaying || !soundEnabled || melodyId === 'none' || !activeMelody.notes.length) {
      return undefined;
    }
    let step = 0;
    const playNote = () => {
      try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return;
        if (!melodyCtxRef.current) {
          melodyCtxRef.current = new AudioCtx();
        }
        const ctx = melodyCtxRef.current;
        if (ctx.state === 'suspended') {
          ctx.resume();
        }
        const freq = activeMelody.notes[step % activeMelody.notes.length];
        step += 1;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = activeMelody.wave;
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        gain.gain.setValueAtTime(0.001, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.045, ctx.currentTime + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + activeMelody.tempoMs / 1000 + 0.45);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + activeMelody.tempoMs / 1000 + 0.5);
      } catch (e) {
        // Ignore audio errors
      }
    };
    playNote();
    const timer = setInterval(playNote, activeMelody.tempoMs);
    return () => clearInterval(timer);
  }, [isMusicPlaying, soundEnabled, melodyId, songMode]);

  // Live 1-second clock tick for DOB timer
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Typewriter effect for active love letter
  const activeLetter = letters.find((l) => l.id === selectedLetterId) || letters[0];
  useEffect(() => {
    if (!activeLetter) return;
    const fullText = activeLetter.content || '';
    setTypedText('');
    let idx = 0;
    const timer = setInterval(() => {
      idx += 1;
      setTypedText(fullText.slice(0, idx));
      if (idx >= fullText.length) clearInterval(timer);
    }, 15);
    return () => clearInterval(timer);
  }, [selectedLetterId, letters]);

  // Compute DOB Live Stats (Time Alive + Next Birthday Countdown)
  const getDobStats = () => {
    const dob = new Date(dobDate + 'T00:00:00');
    if (isNaN(dob.getTime())) {
      return {
        years: 24,
        days: 120,
        hours: 8,
        minutes: 30,
        seconds: 12,
        totalDays: 8880,
        daysToNextBday: 45,
        isBirthdayToday: false
      };
    }
    const diffMs = Math.max(1000, now.getTime() - dob.getTime());
    const totalSeconds = Math.floor(diffMs / 1000);
    const totalDays = Math.floor(totalSeconds / 86400);

    // Exact years & remaining days
    let years = now.getFullYear() - dob.getFullYear();
    const lastBday = new Date(now.getFullYear(), dob.getMonth(), dob.getDate());
    if (now < lastBday) {
      years -= 1;
      lastBday.setFullYear(now.getFullYear() - 1);
    }
    const remMs = Math.max(0, now.getTime() - lastBday.getTime());
    const days = Math.floor(remMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((remMs / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((remMs / (1000 * 60)) % 60);
    const seconds = Math.floor((remMs / 1000) % 60);

    // Countdown to next birthday
    const nextBday = new Date(now.getFullYear(), dob.getMonth(), dob.getDate());
    const isBirthdayToday =
      now.getMonth() === dob.getMonth() && now.getDate() === dob.getDate();
    if (nextBday <= now && !isBirthdayToday) {
      nextBday.setFullYear(now.getFullYear() + 1);
    }
    const daysToNextBday = isBirthdayToday
      ? 0
      : Math.ceil((nextBday.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    return { years, days, hours, minutes, seconds, totalDays, daysToNextBday, isBirthdayToday };
  };

  const dobStats = getDobStats();

  const playChime = () => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const notes = [523.25, 659.25, 783.99, 1046.5];
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.12);
        gain.gain.setValueAtTime(0.05, ctx.currentTime + i * 0.12);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + i * 0.12 + 0.65);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + i * 0.12);
        osc.stop(ctx.currentTime + i * 0.12 + 0.65);
      });
    } catch (e) {
      // Ignore audio block
    }
  };

  // Image Upload Handlers
  const handleHeroPhotoUpload = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    try {
      const dataUrl = await compressImageFile(file, 520, 0.72);
      setHeroPhoto(dataUrl);
      showToast('Cover photo uploaded!');
    } catch (err) {
      showToast('Could not read that image. Try a JPG or PNG.');
    }
  };

  const handleMemoryPhotoUpload = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    try {
      const dataUrl = await compressImageFile(file, 640, 0.72);
      setMemForm((prev) => ({ ...prev, image: dataUrl }));
      showToast('Memory photo attached!');
    } catch (err) {
      showToast('Could not read that image. Try a JPG or PNG.');
    }
  };

  // Memory CRUD Handlers
  const handleSaveMemory = () => {
    if (!memForm.title.trim() || !memForm.note.trim()) {
      showToast('Please enter at least a title and a memory note.');
      return;
    }
    if (editingMemoryId !== null) {
      setMemories((prev) =>
        prev.map((m) =>
          m.id === editingMemoryId
            ? {
                ...m,
                title: memForm.title.trim(),
                date: memForm.date.trim() || m.date,
                location: memForm.location.trim() || 'Special Place',
                note: memForm.note.trim(),
                image: memForm.image,
                emoji: memForm.emoji || '📸'
              }
            : m
        )
      );
      setEditingMemoryId(null);
      showToast('Memory updated!');
    } else {
      const nextId = Date.now();
      const idx = memories.length;
      const newItem = {
        id: nextId,
        title: memForm.title.trim(),
        date: memForm.date.trim() || `Chapter ${idx + 1}`,
        location: memForm.location.trim() || 'Our Favorite Place',
        gradient: GRADIENTS[idx % GRADIENTS.length],
        emoji: memForm.emoji || '📸',
        image: memForm.image,
        note: memForm.note.trim()
      };
      setMemories((prev) => [...prev, newItem]);
      setSelectedMemoryIndex(memories.length);
      showToast('New memory added to carousel!');
    }
    setMemForm({ title: '', date: '', location: '', note: '', image: '', emoji: '📸' });
    playChime();
  };

  const handleEditMemory = (m) => {
    setEditingMemoryId(m.id);
    setMemForm({
      title: m.title,
      date: m.date,
      location: m.location,
      note: m.note,
      image: m.image || '',
      emoji: m.emoji || '📸'
    });
  };

  const handleDeleteMemory = (id) => {
    if (memories.length <= 1) {
      showToast('Keep at least one memory in the carousel.');
      return;
    }
    const filtered = memories.filter((m) => m.id !== id);
    setMemories(filtered);
    setSelectedMemoryIndex(0);
    showToast('Memory removed.');
  };

  const applyIdeaPrompt = (idea) => {
    setEditingMemoryId(null);
    setMemForm({
      title: idea.title,
      date: `Chapter ${memories.length + 1}`,
      location: idea.location,
      note: idea.note,
      image: '',
      emoji: idea.emoji
    });
    showToast('Idea loaded—upload a photo or tweak the story and click Save!');
  };

  // Love Letter CRUD Handlers
  const handleUpdateActiveLetter = (field, value) => {
    setLetters((prev) =>
      prev.map((l) => (l.id === selectedLetterId ? { ...l, [field]: value } : l))
    );
  };

  const handleAddLetter = () => {
    if (!newLetterBadge.trim() || !newLetterBody.trim()) {
      showToast('Enter an envelope label and your letter message.');
      return;
    }
    const id = 'letter_' + Date.now();
    const created = {
      id,
      badge: newLetterBadge.trim(),
      title: newLetterTitle.trim() || `For ${partnerName}`,
      content: newLetterBody.trim()
    };
    setLetters((prev) => [...prev, created]);
    setSelectedLetterId(id);
    setNewLetterBadge('');
    setNewLetterTitle('');
    setNewLetterBody('');
    showToast('New love letter envelope added!');
    playChime();
  };

  const handleDeleteLetter = (id) => {
    if (letters.length <= 1) {
      showToast('Keep at least one love letter.');
      return;
    }
    const remaining = letters.filter((l) => l.id !== id);
    setLetters(remaining);
    setSelectedLetterId(remaining[0].id);
    showToast('Letter removed.');
  };

  // Reasons CRUD
  const handleAddReason = () => {
    if (!customReasonInput.trim()) return;
    setReasonsList((prev) => [...prev, customReasonInput.trim()]);
    setReasonIndex(reasonsList.length);
    setCustomReasonInput('');
    showToast('Reason added!');
    playChime();
  };

  // Generate Personalized Shareable Link
  const handleGenerateShareLink = () => {
    const cleanMemories = memories.map((m) => {
      const isDataUrl = m.image && m.image.startsWith('data:');
      return {
        ...m,
        image: includePhotosInLink ? m.image : isDataUrl ? '' : m.image
      };
    });
    const cleanHero =
      includePhotosInLink || !(heroPhoto && heroPhoto.startsWith('data:')) ? heroPhoto : '';

    const payload = {
      p: partnerName,
      y: yourName,
      d: dobDate,
      s: dateInviteSpot,
      h: cleanHero,
      t: themeId,
      a: melodyId,
      sm: songMode,
      su: songMode === 'web' ? customSongUrl.trim() : '',
      st: songMode === 'web' ? customSongTitle.trim() : '',
      m: cleanMemories,
      l: letters,
      r: reasonsList
    };

    const encoded = encodeSharePayload(payload);
    let cleanBase = (hostedBaseUrl || '').trim();
    if (cleanBase) {
      if (!/^https?:\/\//i.test(cleanBase)) {
        cleanBase = 'https://' + cleanBase;
      }
      cleanBase = cleanBase.split('#')[0].split('?')[0];
    } else if (window.location.origin && window.location.origin !== 'null' && /^https?:\/\//i.test(window.location.origin)) {
      cleanBase = window.location.origin + window.location.pathname;
    } else {
      cleanBase = 'https://your-surprise-site.vercel.app/';
    }
    const fullLink = `${cleanBase}#gift=${encoded}`;
    setShareUrl(fullLink);
    copyTextSafe(fullLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 3000);
    showToast('Mobile-ready web link generated & copied!');
    playChime();
    return fullLink;
  };

  const handleMobileNativeShare = async () => {
    const link = shareUrl || handleGenerateShareLink();
    const shareText = `Hey ${partnerName} 💖 I made a special surprise website just for you — open it on your phone!`;
    try {
      if (navigator.share) {
        await navigator.share({
          title: `A Special Surprise For ${partnerName} 💖`,
          text: shareText,
          url: link
        });
        showToast('Shared via mobile share sheet!');
        return;
      }
    } catch (e) {
      // User cancelled or unsupported
    }
    copyTextSafe(`${shareText} ${link}`);
    showToast('Message + link copied! Paste it into WhatsApp, SMS, or Instagram DM.');
  };

  const handleWhatsAppShare = () => {
    const link = shareUrl || handleGenerateShareLink();
    const msg = encodeURIComponent(`Hey ${partnerName} 💖 I made a special surprise website just for you — tap to open it in your browser:
${link}`);
    window.open(`https://wa.me/?text=${msg}`, '_blank', 'noopener,noreferrer');
  };

  // Download Self-Contained Standalone HTML with ALL uploaded photos baked in!
  const handleDownloadStandaloneHtml = () => {
    const payload = {
      partnerName,
      yourName,
      dobDate,
      dateInviteSpot,
      heroPhoto,
      songMode,
      customSongUrl: parsedWebSong ? parsedWebSong.embedUrl : '',
      customSongType: parsedWebSong ? parsedWebSong.type : '',
      customSongTitle,
      memories,
      letters,
      reasonsList
    };
    const safeJson = JSON.stringify(payload).replace(/</g, '\\u003c');
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>A Special Surprise For ${partnerName} 💖</title>
<script src="https://cdn.tailwindcss.com/3.4.17"></script>
</head>
<body class="bg-slate-950 text-slate-100 font-sans antialiased">
<div id="app"></div>
<script>
const DATA = ${safeJson};
let accepted = false;
let noCount = 0;
let memIdx = 0;
let letterIdx = 0;
let reasonIdx = 0;

function calcDob() {
  const dob = new Date(DATA.dobDate + 'T00:00:00');
  const now = new Date();
  let years = now.getFullYear() - dob.getFullYear();
  const lastBday = new Date(now.getFullYear(), dob.getMonth(), dob.getDate());
  if (now < lastBday) { years -= 1; lastBday.setFullYear(now.getFullYear() - 1); }
  const rem = Math.max(0, now - lastBday);
  return {
    years: isNaN(years) ? 20 : years,
    days: Math.floor(rem / 86400000),
    hours: Math.floor((rem / 3600000) % 24),
    minutes: Math.floor((rem / 60000) % 60),
    seconds: Math.floor((rem / 1000) % 60)
  };
}

function render() {
  const m = DATA.memories[memIdx] || DATA.memories[0];
  const l = DATA.letters[letterIdx] || DATA.letters[0];
  const t = calcDob();
  document.getElementById('app').innerHTML = \`
    <section class="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-amber-50 text-slate-800 flex items-center justify-center p-6">
      <div class="max-w-xl w-full bg-white rounded-3xl p-8 text-center shadow-xl border-2 border-rose-200">
        \${DATA.heroPhoto ? '<img src="' + DATA.heroPhoto + '" class="w-28 h-28 object-cover rounded-full mx-auto mb-4 border-4 border-rose-300 shadow" />' : '<div class="text-5xl mb-3">💖</div>'}
        <h1 class="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-3">Hey \${DATA.partnerName}, I made a surprise for you!</h1>
        <p class="text-sm text-slate-600 mb-6">Will you go on a special date with me for <strong>\${DATA.dateInviteSpot}</strong>?</p>
        \${!accepted ? \`
          <div class="flex flex-wrap justify-center gap-4">
            <button id="yesBtn" style="transform:scale(\${Math.min(1 + noCount*0.15, 1.8)})" class="px-7 py-3.5 rounded-2xl bg-rose-600 text-white font-bold shadow-lg">Yes, I'd love to! 🥰</button>
            <button id="noBtn" class="px-5 py-3 rounded-2xl bg-slate-200 text-slate-700 font-semibold">No 🥺</button>
          </div>
        \` : \`
          <div class="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold mb-2">🎉 Yay! Scroll down to open your full surprise!</div>
        \`}
      </div>
    </section>
    \${accepted ? \`
    <section class="py-14 px-6 bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 text-white text-center">
      <div class="max-w-4xl mx-auto">
        <p class="text-xs uppercase tracking-widest text-purple-300 mb-2">Lighting Up The World Since \${DATA.dobDate}</p>
        <h2 class="text-3xl font-extrabold mb-6">Every Second of \${DATA.partnerName}</h2>
        <div class="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-8" id="clockBox">
          <div class="bg-white/10 p-4 rounded-2xl"><div class="text-3xl font-extrabold text-rose-400">\${t.years}</div><div class="text-xs">Years</div></div>
          <div class="bg-white/10 p-4 rounded-2xl"><div class="text-3xl font-extrabold text-amber-300">\${t.days}</div><div class="text-xs">Days</div></div>
          <div class="bg-white/10 p-4 rounded-2xl"><div class="text-3xl font-extrabold text-pink-300">\${t.hours}</div><div class="text-xs">Hours</div></div>
          <div class="bg-white/10 p-4 rounded-2xl"><div class="text-3xl font-extrabold text-cyan-300">\${t.minutes}</div><div class="text-xs">Minutes</div></div>
          <div class="bg-white/10 p-4 rounded-2xl"><div class="text-3xl font-extrabold text-emerald-300">\${t.seconds}</div><div class="text-xs">Seconds</div></div>
        </div>
        <div class="bg-white/10 p-6 rounded-3xl max-w-xl mx-auto">
          <div class="text-xs uppercase text-pink-300 mb-2">Reason #\${reasonIdx + 1} Why I Adore You</div>
          <p class="text-xl font-bold mb-4">"\${DATA.reasonsList[reasonIdx]}"</p>
          <button id="nextReasonBtn" class="px-5 py-2.5 rounded-xl bg-rose-600 font-bold text-sm">Show Another Reason</button>
        </div>
      </div>
    </section>
    <section class="py-14 px-6 bg-[#FAF5F0] text-slate-800">
      <div class="max-w-4xl mx-auto">
        <h2 class="text-3xl font-extrabold text-center mb-8">Our Memory Carousel</h2>
        <div class="bg-white rounded-3xl p-6 shadow-lg grid grid-cols-1 md:grid-cols-2 gap-6 items-center mb-6">
          \${m.image ? '<img src="' + m.image + '" class="w-full h-64 object-cover rounded-2xl" />' : '<div class="h-64 rounded-2xl bg-gradient-to-br from-rose-400 to-amber-400 flex items-center justify-center text-6xl">' + (m.emoji || '📸') + '</div>'}
          <div>
            <div class="text-xs font-bold text-rose-600 mb-1">\${m.date} • \${m.location}</div>
            <h3 class="text-2xl font-bold mb-3">\${m.title}</h3>
            <p class="text-slate-600 leading-relaxed mb-4">"\${m.note}"</p>
            <div class="flex gap-2">
              <button id="prevMem" class="px-4 py-2 rounded-xl bg-slate-200 font-semibold text-xs">← Prev</button>
              <button id="nextMem" class="px-4 py-2 rounded-xl bg-rose-600 text-white font-semibold text-xs">Next →</button>
            </div>
          </div>
        </div>
      </div>
    </section>
    <section class="py-14 px-6 bg-indigo-950 text-white">
      <div class="max-w-3xl mx-auto">
        <h2 class="text-3xl font-extrabold text-center mb-6">Love Letters For \${DATA.partnerName}</h2>
        <div class="flex flex-wrap justify-center gap-2 mb-6">
          \${DATA.letters.map((lt, i) => '<button data-l="' + i + '" class="letterTab px-4 py-2 rounded-xl text-xs font-bold ' + (i === letterIdx ? 'bg-rose-600 text-white' : 'bg-slate-800 text-slate-300') + '">' + lt.badge + '</button>').join('')}
        </div>
        <div class="bg-[#FFFDF9] text-slate-800 rounded-3xl p-8 shadow-2xl border-4 border-rose-200">
          <h3 class="text-2xl font-bold mb-4">\${l.title}</h3>
          <p class="text-lg font-serif leading-relaxed mb-6">\${l.content}</p>
          <div class="text-right font-bold text-rose-700">— \${DATA.yourName}</div>
        </div>
      </div>
    </section>
    \` : ''}
    \${DATA.songMode === 'web' && DATA.customSongUrl ? \`
    <div class="fixed bottom-4 left-4 right-4 sm:right-auto sm:w-96 z-50 bg-slate-900/95 border border-emerald-500/40 rounded-2xl shadow-2xl p-3">
      <div class="text-xs font-bold text-emerald-300 mb-2">🎵 \${DATA.customSongTitle || 'Our Favorite Song'}</div>
      \${DATA.customSongType === 'spotify' ? '<iframe src="' + DATA.customSongUrl + '" width="100%" height="80" frameborder="0" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" class="rounded-xl"></iframe>' : DATA.customSongType === 'youtube' ? '<iframe src="' + DATA.customSongUrl + '" width="100%" height="155" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen class="rounded-xl"></iframe>' : '<audio controls class="w-full h-10" src="' + DATA.customSongUrl + '"></audio>'}
    </div>
    \` : ''}
  \`;
  const yb = document.getElementById('yesBtn');
  if (yb) yb.onclick = () => { accepted = true; render(); };
  const nb = document.getElementById('noBtn');
  if (nb) nb.onclick = () => { noCount++; render(); };
  const nr = document.getElementById('nextReasonBtn');
  if (nr) nr.onclick = () => { reasonIdx = (reasonIdx + 1) % DATA.reasonsList.length; render(); };
  const pm = document.getElementById('prevMem');
  if (pm) pm.onclick = () => { memIdx = (memIdx - 1 + DATA.memories.length) % DATA.memories.length; render(); };
  const nm = document.getElementById('nextMem');
  if (nm) nm.onclick = () => { memIdx = (memIdx + 1) % DATA.memories.length; render(); };
  document.querySelectorAll('.letterTab').forEach(b => { b.onclick = () => { letterIdx = Number(b.dataset.l); render(); }; });
}
render();
setInterval(() => { if (accepted) render(); }, 1000);
</script>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `surprise-for-${(partnerName || 'you').toLowerCase().replace(/[^a-z0-9]+/g, '-')}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Downloaded personalized standalone HTML file with all your photos!');
  };

  const handleDodgeNo = () => {
    setNoCount((prev) => prev + 1);
    const isSmallScreen = typeof window !== 'undefined' && window.innerWidth < 500;
    const maxX = isSmallScreen ? 70 : 120;
    const maxY = isSmallScreen ? 45 : 65;
    const randomX = Math.floor(Math.random() * (maxX * 2)) - maxX;
    const randomY = Math.floor(Math.random() * (maxY * 2)) - maxY;
    setNoPos({ x: randomX, y: randomY });
  };

  const toggleLike = (id) => {
    setLikedIds((prev) => ({ ...prev, [id]: !prev[id] }));
    playChime();
  };

  const toggleCoupon = (id) => {
    setClaimedCoupons((prev) => ({ ...prev, [id]: !prev[id] }));
    playChime();
  };

  const loveCoupons = [
    { id: 1, title: 'Midnight Ice Cream & Drive', desc: 'Redeemable anytime for an instant dessert run, no questions asked.', icon: '🍦' },
    { id: 2, title: '100% Movie & Snack Vetoes', desc: 'You pick the film, the blanket fort setup, and all the snacks.', icon: '🎬' },
    { id: 3, title: '20-Minute Shoulder & Back Massage', desc: 'Valid after any long day whenever you need to unwind.', icon: '💆‍♀️' },
    { id: 4, title: 'Surprise Adventure Date Pass', desc: `Good for our upcoming ${dateInviteSpot} experience together!`, icon: '🎟️' }
  ];

  const isJourneyUnlocked = acceptedInvite || gateBypassed;
  const activeMemory = memories[selectedMemoryIndex] || memories[0];
  const hasUploadedLocalPhotos =
    (heroPhoto && heroPhoto.startsWith('data:')) ||
    memories.some((m) => m.image && m.image.startsWith('data:'));

  const showSection1 = activeSite === 'full_journey' || activeSite === 'date_ask';
  const showSection2 = (activeSite === 'full_journey' && isJourneyUnlocked) || activeSite === 'live_dashboard';
  const showSection3 = (activeSite === 'full_journey' && isJourneyUnlocked) || activeSite === 'memory_gallery';
  const showSection4 = (activeSite === 'full_journey' && isJourneyUnlocked) || activeSite === 'love_letters';

  return (
    <div className={`min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans ${songMode === 'web' && parsedWebSong && showFloatingPlayer ? 'pb-32 sm:pb-24' : ''}`}>
      <style>{`
        @keyframes floatHeart {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-8px) rotate(4deg); }
        }
        .animate-float-heart {
          animation: floatHeart 3.2s ease-in-out infinite;
        }
      `}</style>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-emerald-600 text-white text-xs sm:text-sm font-semibold px-4 py-2.5 rounded-xl shadow-2xl border border-emerald-400/50 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* =========================================================
          TOP HEADER (Builder Mode vs Clean Recipient Mode)
          ========================================================= */}
      <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur border-b border-slate-800 px-4 py-3 shadow-lg">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center shadow-md">
              <Heart className="w-5 h-5 text-white fill-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base font-bold text-white">
                  {viewMode === 'builder'
                    ? `Surprise Creator Studio — For ${partnerName}`
                    : `A Special Surprise For ${partnerName}`}
                </h1>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  {viewMode === 'builder' ? 'Creator Mode' : 'Gift View'}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {viewMode === 'builder'
                  ? 'Upload photos, enter DOB, plan memories, write letters & generate a personal link'
                  : 'Made with love — unlock each chapter below'}
              </p>
            </div>
          </div>

          {/* Mode Toggle + Sound */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center bg-slate-800 p-1 rounded-xl border border-slate-700">
              <button
                type="button"
                onClick={() => {
                  setViewMode('builder');
                  playChime();
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                  viewMode === 'builder'
                    ? 'bg-rose-600 text-white shadow'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Build &amp; Edit</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setViewMode('recipient');
                  setAcceptedInvite(false);
                  setGateBypassed(false);
                  setActiveSite('full_journey');
                  playChime();
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                  viewMode === 'recipient'
                    ? 'bg-emerald-600 text-white shadow'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Preview As {partnerName}</span>
              </button>
            </div>

            {viewMode === 'builder' && (
              <button
                type="button"
                onClick={() => {
                  setBuilderTab('share');
                  setGateBypassed(true);
                  playChime();
                }}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-400 hover:to-rose-400 text-white flex items-center gap-1.5 shadow transition"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Share Link</span>
              </button>
            )}

            {songMode === 'web' && parsedWebSong ? (
              <button
                type="button"
                onClick={() => setShowFloatingPlayer((prev) => !prev)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition ${
                  showFloatingPlayer
                    ? 'bg-emerald-600/20 text-emerald-300 border-emerald-500/40'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                }`}
                title="Show or Hide Song Player"
              >
                <Disc3 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{parsedWebSong.label} Player</span>
              </button>
            ) : (
              melodyId !== 'none' && (
                <button
                  type="button"
                  onClick={() => {
                    if (!soundEnabled) setSoundEnabled(true);
                    setIsMusicPlaying((prev) => !prev);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition ${
                    isMusicPlaying && soundEnabled
                      ? 'bg-emerald-600/20 text-emerald-300 border-emerald-500/40'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                  }`}
                  title="Play or Pause Background Melody"
                >
                  {isMusicPlaying && soundEnabled ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  <span className="hidden sm:inline">{isMusicPlaying && soundEnabled ? 'Playing Melody' : activeMelody.name}</span>
                </button>
              )
            )}

            <button
              type="button"
              onClick={() => {
                setSoundEnabled(!soundEnabled);
                if (soundEnabled) setIsMusicPlaying(false);
              }}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
              title="Mute / Unmute All Audio"
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-rose-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
            </button>
          </div>
        </div>
      </header>

      {/* =========================================================
          IN-WEBSITE CREATOR STUDIO PANEL (Only visible in Builder Mode)
          ========================================================= */}
      {viewMode === 'builder' && (
        <section className="bg-slate-900 border-b border-slate-800 px-4 py-6">
          <div className="max-w-5xl mx-auto">
            {/* Builder Sub-Navigation Tabs */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
              <div className="flex flex-wrap gap-1.5 bg-slate-800/90 p-1 rounded-xl border border-slate-700">
                <button
                  type="button"
                  onClick={() => setBuilderTab('basics')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                    builderTab === 'basics' ? 'bg-rose-600 text-white' : 'text-slate-300 hover:text-white'
                  }`}
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>1. Name, DOB &amp; Cover Photo</span>
                </button>
                <button
                  type="button"
                  onClick={() => setBuilderTab('memories')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                    builderTab === 'memories' ? 'bg-rose-600 text-white' : 'text-slate-300 hover:text-white'
                  }`}
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>2. Memory Carousel Planner ({memories.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setBuilderTab('letters')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                    builderTab === 'letters' ? 'bg-rose-600 text-white' : 'text-slate-300 hover:text-white'
                  }`}
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>3. Write Love Letters ({letters.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setBuilderTab('share')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                    builderTab === 'share' ? 'bg-emerald-600 text-white' : 'text-emerald-300 hover:text-white'
                  }`}
                >
                  <Link2 className="w-3.5 h-3.5" />
                  <span>4. Share Link &amp; Export</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => setGateBypassed(!gateBypassed)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 flex items-center gap-1.5"
              >
                {isJourneyUnlocked ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                <span>{isJourneyUnlocked ? 'All 4 Sections Visible Below' : 'Unlock Preview Below'}</span>
              </button>
            </div>

            {/* TAB 1: BASICS, DOB & COVER PHOTO */}
            {builderTab === 'basics' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-800/50 border border-slate-700/80 rounded-2xl p-5">
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Person&apos;s Name / Nickname</label>
                    <input
                      type="text"
                      value={partnerName}
                      onChange={(e) => setPartnerName(e.target.value)}
                      placeholder="e.g., Ananya"
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:border-rose-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Your Sign-Off Name</label>
                    <input
                      type="text"
                      value={yourName}
                      onChange={(e) => setYourName(e.target.value)}
                      placeholder="e.g., Forever Yours, Rahul"
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:border-rose-500"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-amber-300 mb-1 flex items-center gap-1.5">
                      <Cake className="w-3.5 h-3.5" />
                      <span>Date of Birth (DOB) for Live Timer</span>
                    </label>
                    <input
                      type="date"
                      value={dobDate}
                      onChange={(e) => setDobDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-amber-500/40 text-sm text-white focus:outline-none focus:border-amber-400"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">
                      Powers the live Years/Days/Hours/Minutes/Seconds clock &amp; birthday countdown.
                    </p>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Surprise Date / Outing Plan</label>
                    <input
                      type="text"
                      value={dateInviteSpot}
                      onChange={(e) => setDateInviteSpot(e.target.value)}
                      placeholder="e.g., Rooftop Dinner & Drive"
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:border-rose-500"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="block text-xs font-semibold text-pink-300 mb-1">Upload Cover / Profile Picture (Optional)</label>
                  <div className="flex items-center gap-3">
                    {heroPhoto ? (
                      <img src={heroPhoto} alt="Cover preview" className="w-16 h-16 rounded-2xl object-cover border-2 border-rose-400 shrink-0" />
                    ) : (
                      <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-dashed border-slate-600 flex items-center justify-center text-slate-500 shrink-0">
                        <Camera className="w-6 h-6" />
                      </div>
                    )}
                    <div className="flex-1 space-y-2">
                      <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold transition">
                        <Upload className="w-3.5 h-3.5" />
                        <span>Upload Picture</span>
                        <input type="file" accept="image/*" onChange={handleHeroPhotoUpload} className="hidden" />
                      </label>
                      {heroPhoto && (
                        <button
                          type="button"
                          onClick={() => setHeroPhoto('')}
                          className="block text-[11px] text-rose-400 hover:underline"
                        >
                          Remove cover photo
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="pt-1">
                    <label className="block text-[11px] text-slate-400 mb-1">Or add a &ldquo;Reason Why I Adore You&rdquo;:</label>
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        value={customReasonInput}
                        onChange={(e) => setCustomReasonInput(e.target.value)}
                        placeholder="Add a sweet reason..."
                        className="flex-1 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white"
                      />
                      <button
                        type="button"
                        onClick={handleAddReason}
                        className="px-3 py-1.5 rounded-lg bg-pink-600 hover:bg-pink-500 text-white text-xs font-semibold shrink-0"
                      >
                        Add Reason
                      </button>
                    </div>
                  </div>
                </div>

                {/* Color Theme Picker & Background Melody Selector */}
                <div className="md:col-span-3 pt-4 border-t border-slate-700/70 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs font-semibold text-slate-200 mb-2 flex items-center gap-1.5">
                      <Palette className="w-3.5 h-3.5 text-rose-400" />
                      <span>Color Theme Picker</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {Object.values(THEMES).map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => {
                            setThemeId(t.id);
                            showToast(`Theme switched to ${t.name}!`);
                          }}
                          className={`p-2 rounded-xl border text-left transition flex items-center gap-2 ${
                            themeId === t.id
                              ? 'bg-slate-900 border-white shadow'
                              : 'bg-slate-900/60 border-slate-700 hover:border-slate-500'
                          }`}
                        >
                          <span className={`w-4 h-4 rounded-full bg-gradient-to-br ${t.swatch} shrink-0`} />
                          <span className="text-[11px] font-semibold text-white truncate">{t.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    <div className="text-xs font-semibold text-slate-200 flex flex-wrap items-center justify-between gap-2">
                      <span className="flex items-center gap-1.5">
                        <Music className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Background Song / Melody</span>
                      </span>
                      <div className="flex bg-slate-900 p-0.5 rounded-lg border border-slate-700 text-[11px]">
                        <button
                          type="button"
                          onClick={() => setSongMode('builtin')}
                          className={`px-2 py-0.5 rounded-md font-semibold transition ${
                            songMode === 'builtin' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          Built-in Melodies
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSongMode('web');
                            setIsMusicPlaying(false);
                            setShowFloatingPlayer(true);
                          }}
                          className={`px-2 py-0.5 rounded-md font-semibold transition ${
                            songMode === 'web' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          Spotify / Web Song
                        </button>
                      </div>
                    </div>

                    {songMode === 'builtin' ? (
                      <div className="grid grid-cols-2 gap-2">
                        {Object.values(MELODIES).map((mel) => (
                          <button
                            key={mel.id}
                            type="button"
                            onClick={() => {
                              setMelodyId(mel.id);
                              if (mel.id === 'none') {
                                setIsMusicPlaying(false);
                                showToast('Background melody set to Silent.');
                              } else {
                                setSoundEnabled(true);
                                setIsMusicPlaying(true);
                                showToast(`Playing: ${mel.name}`);
                              }
                            }}
                            className={`px-2.5 py-2 rounded-xl border text-left text-[11px] font-semibold transition truncate ${
                              melodyId === mel.id
                                ? 'bg-emerald-600/25 border-emerald-400 text-emerald-200'
                                : 'bg-slate-900/60 border-slate-700 text-slate-300 hover:border-slate-500'
                            }`}
                          >
                            🎵 {mel.name}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="space-y-2 bg-slate-900/70 border border-emerald-500/30 rounded-xl p-3">
                        <input
                          type="text"
                          value={customSongTitle}
                          onChange={(e) => setCustomSongTitle(e.target.value)}
                          placeholder="Song dedication title (e.g., Our Song — Perfect)"
                          className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-emerald-400"
                        />
                        <input
                          type="text"
                          value={customSongUrl}
                          onChange={(e) => {
                            setCustomSongUrl(e.target.value);
                            setShowFloatingPlayer(true);
                          }}
                          placeholder="Paste Spotify track/playlist link, YouTube link, or .mp3 URL"
                          className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-emerald-400"
                        />
                        <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
                          <div className="flex flex-wrap items-center gap-2 text-[11px]">
                            <a
                              href="https://open.spotify.com/search"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 font-semibold transition"
                            >
                              <span>Find on Spotify</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                            <a
                              href="https://www.youtube.com/results?search_query=romantic+love+songs"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 font-semibold transition"
                            >
                              <span>Find on YouTube</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                          {parsedWebSong ? (
                            <span className="text-[11px] font-bold text-emerald-400">
                              ✓ {parsedWebSong.label} Ready
                            </span>
                          ) : customSongUrl.trim() ? (
                            <span className="text-[11px] text-amber-300">Paste a full https:// link</span>
                          ) : null}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: MEMORY CAROUSEL PLANNER & PHOTO UPLOADER */}
            {builderTab === 'memories' && (
              <div className="space-y-4 bg-slate-800/50 border border-slate-700/80 rounded-2xl p-5">
                {/* Quick Idea Planner Chips */}
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-300 mb-2">
                    <Lightbulb className="w-3.5 h-3.5" />
                    <span>Need ideas for the memory carousel? Click any idea to auto-fill:</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {MEMORY_IDEA_PROMPTS.map((idea, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => applyIdeaPrompt(idea)}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-700 border border-slate-700 text-xs text-slate-200 transition flex items-center gap-1"
                      >
                        <span>{idea.emoji}</span>
                        <span>{idea.title}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Add / Edit Memory Form */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-3 border-t border-slate-700/70">
                  <div className="space-y-2.5">
                    <input
                      type="text"
                      placeholder="Memory Title (e.g., Sunset at Marina)"
                      value={memForm.title}
                      onChange={(e) => setMemForm((p) => ({ ...p, title: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="Date / Chapter"
                        value={memForm.date}
                        onChange={(e) => setMemForm((p) => ({ ...p, date: e.target.value }))}
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
                      />
                      <input
                        type="text"
                        placeholder="Location"
                        value={memForm.location}
                        onChange={(e) => setMemForm((p) => ({ ...p, location: e.target.value }))}
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
                      />
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    <textarea
                      rows={3}
                      placeholder="Write the story behind this memory..."
                      value={memForm.note}
                      onChange={(e) => setMemForm((p) => ({ ...p, note: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
                    />
                  </div>

                  <div className="space-y-2.5 flex flex-col justify-between">
                    <div className="flex items-center gap-2.5">
                      {memForm.image ? (
                        <img src={memForm.image} alt="Memory preview" className="w-14 h-14 rounded-xl object-cover border border-rose-400 shrink-0" />
                      ) : (
                        <div className="w-14 h-14 rounded-xl bg-slate-900 border border-dashed border-slate-600 flex items-center justify-center text-xl shrink-0">
                          {memForm.emoji}
                        </div>
                      )}
                      <div className="flex-1 space-y-1.5">
                        <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold transition">
                          <Upload className="w-3.5 h-3.5" />
                          <span>Upload Photo</span>
                          <input type="file" accept="image/*" onChange={handleMemoryPhotoUpload} className="hidden" />
                        </label>
                        <input
                          type="text"
                          placeholder="Or paste an image URL (https://...)"
                          value={memForm.image.startsWith('data:') ? '' : memForm.image}
                          onChange={(e) => setMemForm((p) => ({ ...p, image: e.target.value }))}
                          className="w-full px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-[11px] text-white"
                        />
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={handleSaveMemory}
                        className="flex-1 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>{editingMemoryId !== null ? 'Update Memory' : 'Add to Carousel'}</span>
                      </button>
                      {editingMemoryId !== null && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingMemoryId(null);
                            setMemForm({ title: '', date: '', location: '', note: '', image: '', emoji: '📸' });
                          }}
                          className="px-3 py-2 rounded-xl bg-slate-700 text-slate-200 text-xs font-semibold"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Existing Memories Manager List */}
                <div className="pt-3 border-t border-slate-700/70">
                  <div className="text-xs font-semibold text-slate-400 mb-2">Current Carousel Cards (Click to Edit or Remove):</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
                    {memories.map((m) => (
                      <div key={m.id} className="bg-slate-900 border border-slate-700 rounded-xl p-2.5 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          {m.image ? (
                            <img src={m.image} alt={m.title} className="w-9 h-9 rounded-lg object-cover shrink-0" />
                          ) : (
                            <span className="text-lg shrink-0">{m.emoji}</span>
                          )}
                          <div className="truncate">
                            <div className="text-xs font-bold text-white truncate">{m.title}</div>
                            <div className="text-[10px] text-slate-400 truncate">{m.location}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleEditMemory(m)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300"
                            title="Edit memory"
                          >
                            <Edit3 className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteMemory(m.id)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-900/60 text-rose-400"
                            title="Delete memory"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: WRITE YOUR OWN LOVE LETTERS */}
            {builderTab === 'letters' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 bg-slate-800/50 border border-slate-700/80 rounded-2xl p-5">
                {/* Edit Existing Selected Letter */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-rose-300">✍️ Edit Existing Envelope</span>
                    <select
                      value={selectedLetterId}
                      onChange={(e) => setSelectedLetterId(e.target.value)}
                      className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white"
                    >
                      {letters.map((l) => (
                        <option key={l.id} value={l.id}>{l.badge}</option>
                      ))}
                    </select>
                  </div>
                  {activeLetter && (
                    <>
                      <input
                        type="text"
                        value={activeLetter.badge}
                        onChange={(e) => handleUpdateActiveLetter('badge', e.target.value)}
                        placeholder="Envelope Label (e.g., Open When You Miss Me)"
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
                      />
                      <input
                        type="text"
                        value={activeLetter.title}
                        onChange={(e) => handleUpdateActiveLetter('title', e.target.value)}
                        placeholder="Letter Heading"
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
                      />
                      <textarea
                        rows={4}
                        value={activeLetter.content}
                        onChange={(e) => handleUpdateActiveLetter('content', e.target.value)}
                        placeholder="Write your heartfelt love letter here..."
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white leading-relaxed"
                      />
                      {letters.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleDeleteLetter(activeLetter.id)}
                          className="text-xs text-rose-400 hover:underline flex items-center gap-1"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Delete this envelope</span>
                        </button>
                      )}
                    </>
                  )}
                </div>

                {/* Add a Brand New Custom Love Letter */}
                <div className="space-y-3 md:border-l md:border-slate-700/70 md:pl-5">
                  <div className="text-xs font-bold text-emerald-300">💌 Add a New Custom Envelope</div>
                  <input
                    type="text"
                    value={newLetterBadge}
                    onChange={(e) => setNewLetterBadge(e.target.value)}
                    placeholder="Envelope Label (e.g., Open When You Can't Sleep)"
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
                  />
                  <input
                    type="text"
                    value={newLetterTitle}
                    onChange={(e) => setNewLetterTitle(e.target.value)}
                    placeholder="Letter Heading (e.g., Sweet Dreams, My Love)"
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
                  />
                  <textarea
                    rows={4}
                    value={newLetterBody}
                    onChange={(e) => setNewLetterBody(e.target.value)}
                    placeholder="Write your custom letter message..."
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white leading-relaxed"
                  />
                  <button
                    type="button"
                    onClick={handleAddLetter}
                    className="w-full px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add New Love Letter</span>
                  </button>
                </div>
              </div>
            )}

            {/* Quick Preview Section Jump Bar */}
            <div className="flex flex-wrap items-center gap-1.5 mb-4 text-xs">
              <span className="text-slate-400 mr-1">Preview View:</span>
              <button
                type="button"
                onClick={() => { setActiveSite('full_journey'); playChime(); }}
                className={`px-2.5 py-1 rounded-lg font-semibold transition ${activeSite === 'full_journey' ? 'bg-rose-600 text-white' : 'bg-slate-800 text-slate-300 hover:text-white'}`}
              >
                ✨ Full 4-Step Journey
              </button>
              <button
                type="button"
                onClick={() => { setActiveSite('date_ask'); playChime(); }}
                className={`px-2.5 py-1 rounded-lg font-semibold transition ${activeSite === 'date_ask' ? 'bg-rose-600 text-white' : 'bg-slate-800 text-slate-300 hover:text-white'}`}
              >
                1. Invite Gate
              </button>
              <button
                type="button"
                onClick={() => { setActiveSite('live_dashboard'); playChime(); }}
                className={`px-2.5 py-1 rounded-lg font-semibold transition ${activeSite === 'live_dashboard' ? 'bg-rose-600 text-white' : 'bg-slate-800 text-slate-300 hover:text-white'}`}
              >
                2. Live Timer
              </button>
              <button
                type="button"
                onClick={() => { setActiveSite('memory_gallery'); playChime(); }}
                className={`px-2.5 py-1 rounded-lg font-semibold transition ${activeSite === 'memory_gallery' ? 'bg-rose-600 text-white' : 'bg-slate-800 text-slate-300 hover:text-white'}`}
              >
                3. Memory Carousel
              </button>
              <button
                type="button"
                onClick={() => { setActiveSite('love_letters'); playChime(); }}
                className={`px-2.5 py-1 rounded-lg font-semibold transition ${activeSite === 'love_letters' ? 'bg-rose-600 text-white' : 'bg-slate-800 text-slate-300 hover:text-white'}`}
              >
                4. Love Letters
              </button>
            </div>

            {/* TAB 4: SHARE PERSONALIZED LINK & STANDALONE EXPORT */}
            {builderTab === 'share' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 bg-slate-800/50 border border-emerald-500/30 rounded-2xl p-5">
                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-emerald-300 flex items-center gap-2">
                    <Smartphone className="w-4 h-4" />
                    <span>Option 1: Mobile-Ready Shareable Web Link</span>
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Creates a personal link for <strong>{partnerName}</strong> that opens directly in any phone browser (Safari, Chrome, or WhatsApp) in clean <strong>Gift View</strong>.
                  </p>
                  <div>
                    <label className="block text-[11px] font-semibold text-emerald-200 mb-1">
                      Your Live Website Address (after deploying on Vercel / GitHub Pages):
                    </label>
                    <input
                      type="url"
                      value={hostedBaseUrl}
                      onChange={(e) => setHostedBaseUrl(e.target.value)}
                      placeholder="https://your-site-name.vercel.app/"
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-emerald-500/40 text-xs text-white focus:outline-none focus:border-emerald-400"
                    />
                  </div>

                  {hasUploadedLocalPhotos && (
                    <label className="flex items-start gap-2 text-xs text-amber-200 bg-amber-500/10 border border-amber-500/30 p-3 rounded-xl cursor-pointer">
                      <input
                        type="checkbox"
                        checked={includePhotosInLink}
                        onChange={(e) => setIncludePhotosInLink(e.target.checked)}
                        className="mt-0.5 accent-amber-500"
                      />
                      <span>
                        <strong>Embed uploaded device photos inside the URL</strong> (makes the URL very long; for best sharing on WhatsApp/Instagram with local photos, use <strong>Option 2</strong> or paste image URLs in Step 2).
                      </span>
                    </label>
                  )}

                  <button
                    type="button"
                    onClick={handleGenerateShareLink}
                    className="w-full px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow transition"
                  >
                    {copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedLink ? 'Copied Personal Link!' : `Generate & Copy Link for ${partnerName}`}</span>
                  </button>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={handleWhatsAppShare}
                      className="px-3 py-2 rounded-xl bg-[#25D366]/20 hover:bg-[#25D366]/30 border border-[#25D366]/40 text-emerald-200 text-xs font-bold flex items-center justify-center gap-1.5 transition"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Send on WhatsApp</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleMobileNativeShare}
                      className="px-3 py-2 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-400/40 text-cyan-200 text-xs font-bold flex items-center justify-center gap-1.5 transition"
                    >
                      <Smartphone className="w-3.5 h-3.5" />
                      <span>Phone Share Sheet</span>
                    </button>
                  </div>

                  {shareUrl && (
                    <div className="bg-slate-950 border border-slate-700 rounded-xl p-2.5">
                      <div className="text-[10px] text-slate-400 mb-1">
                        Mobile-Ready Web Link ({shareUrl.length.toLocaleString()} chars):
                      </div>
                      <div className="text-[11px] text-emerald-300 break-all max-h-16 overflow-y-auto font-mono">
                        {shareUrl}
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-3 md:border-l md:border-slate-700/70 md:pl-5 flex flex-col justify-between">
                  <div className="space-y-2">
                    <h3 className="text-sm font-bold text-rose-300 flex items-center gap-2">
                      <Download className="w-4 h-4" />
                      <span>Option 2: Download Personalized HTML (With All Uploaded Photos)</span>
                    </h3>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Bundles <strong>all your uploaded high-res photos</strong>, DOB timer, custom memories, and love letters into a single self-contained <code className="text-rose-300">.html</code> file for <strong>{partnerName}</strong>. Send the file directly or drag-and-drop it onto Netlify Drop / Vercel for a short, clean link!
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleDownloadStandaloneHtml}
                    className="w-full px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow transition"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Standalone Surprise for {partnerName} (.html)</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* =========================================================
          STEP 1: PLAYFUL "SHE CAN'T SAY NO" INVITE GATE
          ========================================================= */}
      {showSection1 && (
        <section id="step-1-invite" className={`bg-gradient-to-br ${activeTheme.gateBg} text-slate-800 py-14 px-6 border-b ${activeTheme.gateBorder}`}>
          <div className={`max-w-xl mx-auto bg-white/95 backdrop-blur-md border-2 ${activeTheme.gateBorder} rounded-3xl p-8 text-center shadow-xl relative overflow-hidden`}>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-100 text-rose-700 text-xs font-bold mb-4">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Step 1 of 4 • A Surprise Made Just For {partnerName}</span>
            </div>

            {!acceptedInvite ? (
              <>
                {heroPhoto ? (
                  <img
                    src={heroPhoto}
                    alt={partnerName}
                    className="w-24 h-24 mx-auto mb-4 rounded-full object-cover border-4 border-rose-300 shadow-lg"
                  />
                ) : (
                  <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-rose-400 to-pink-500 flex items-center justify-center shadow-lg animate-float-heart">
                    <Heart className="w-10 h-10 text-white fill-white" />
                  </div>
                )}

                <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-3">
                  Hey {partnerName}, will you go on a surprise date with me? 💖
                </h2>
                <p className="text-sm text-slate-600 mb-8 max-w-md mx-auto">
                  I built this entire website just for you—and planned a special outing for <strong>{dateInviteSpot}</strong>. Click &ldquo;Yes!&rdquo; to unlock your surprise journey!
                </p>

                <div className="flex flex-wrap items-center justify-center gap-4 min-h-[110px] relative">
                  <button
                    type="button"
                    onClick={() => {
                      setAcceptedInvite(true);
                      setGateBypassed(true);
                      playChime();
                    }}
                    style={{ transform: `scale(${Math.min(1 + noCount * 0.14, 1.85)})` }}
                    className={`px-7 py-3.5 rounded-2xl bg-gradient-to-r ${activeTheme.accentGrad} text-white font-bold text-base shadow-lg transition-all`}
                  >
                    Yes, I&apos;d love to! 🥰
                  </button>

                  <button
                    type="button"
                    onMouseEnter={handleDodgeNo}
                    onClick={handleDodgeNo}
                    style={{ transform: `translate(${noPos.x}px, ${noPos.y}px)` }}
                    className="px-5 py-3 rounded-2xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold text-sm transition-transform duration-200"
                  >
                    {noPhrases[Math.min(noCount, noPhrases.length - 1)]}
                  </button>
                </div>
              </>
            ) : (
              <div className="py-4 space-y-5">
                <div className="w-20 h-20 mx-auto rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-inner">
                  <CheckCircle2 className="w-12 h-12" />
                </div>
                <h2 className="text-3xl font-extrabold text-rose-600">
                  Yay!! Best Decision Ever, {partnerName}! 🎉
                </h2>
                <p className="text-sm text-slate-600 max-w-md mx-auto">
                  Your official VIP Date Pass is unlocked—and the rest of your surprise journey is now open below!
                </p>

                <div className="bg-gradient-to-r from-rose-500 via-pink-500 to-amber-500 p-0.5 rounded-2xl max-w-md mx-auto shadow-lg">
                  <div className="bg-white rounded-[14px] p-5 text-left space-y-2">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-rose-600">Official Date Ticket</span>
                      <span className="text-xs font-semibold text-amber-600">VIP Admit Two</span>
                    </div>
                    <div className="text-lg font-bold text-slate-900">{dateInviteSpot}</div>
                    <div className="text-xs text-slate-500 flex items-center justify-between pt-2">
                      <span>Guest of Honor: <strong>{partnerName}</strong></span>
                      <span>From: <strong>{yourName}</strong></span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                  <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-4 py-2 rounded-full">
                    <ArrowDown className="w-3.5 h-3.5 animate-bounce" />
                    <span>Scroll down for your Live DOB Timer, Memories &amp; Letters</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setAcceptedInvite(false);
                      setNoCount(0);
                      setNoPos({ x: 0, y: 0 });
                    }}
                    className="text-xs text-rose-600 font-semibold hover:underline"
                  >
                    Replay Gate
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Locked Teaser Banner when gate not yet unlocked */}
      {activeSite === 'full_journey' && !isJourneyUnlocked && (
        <section className="bg-slate-900/90 py-8 px-4 text-center border-b border-slate-800">
          <div className="max-w-lg mx-auto space-y-2">
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-amber-300 bg-amber-500/10 border border-amber-400/30 px-3.5 py-1.5 rounded-full">
              <Lock className="w-3.5 h-3.5" />
              <span>3 More Surprise Chapters Waiting Below</span>
            </div>
            <p className="text-xs text-slate-400">
              Click <strong>&ldquo;Yes, I&apos;d love to! 🥰&rdquo;</strong> above to unlock your live DOB clock, memory carousel, and personal love letters!
            </p>
          </div>
        </section>
      )}

      {/* =========================================================
          STEP 2: LIVE DOB TIMER & REASONS SHUFFLE DECK
          ========================================================= */}
      {showSection2 && (
        <section id="step-2-timer" className={`bg-gradient-to-br ${activeTheme.timerBg} text-white py-14 px-4 sm:px-8 border-b border-white/10`}>
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="text-center">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-400/30 text-purple-300 text-xs font-bold mb-2">
                <Cake className="w-3.5 h-3.5" />
                <span>Step 2 of 4 • Live DOB Timer &amp; Reasons I Adore You</span>
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold">
                {partnerName} Has Been Lighting Up The World For...
              </h2>
              <p className="text-xs sm:text-sm text-purple-200/80 mt-1">
                Born on <strong>{dobDate}</strong> •{' '}
                {dobStats.isBirthdayToday
                  ? '🎂 HAPPY BIRTHDAY TODAY!! 🎉'
                  : `${dobStats.daysToNextBday} days until your next birthday!`}
              </p>
            </div>

            {/* Live DOB 5-Unit Clock */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-4 text-center shadow-lg">
                <div className="text-3xl sm:text-4xl font-extrabold text-rose-400">{dobStats.years}</div>
                <div className="text-xs uppercase tracking-wider text-purple-200 mt-1">Years</div>
              </div>
              <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-4 text-center shadow-lg">
                <div className="text-3xl sm:text-4xl font-extrabold text-amber-300">{dobStats.days}</div>
                <div className="text-xs uppercase tracking-wider text-purple-200 mt-1">Days</div>
              </div>
              <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-4 text-center shadow-lg">
                <div className="text-3xl sm:text-4xl font-extrabold text-pink-300">{dobStats.hours}</div>
                <div className="text-xs uppercase tracking-wider text-purple-200 mt-1">Hours</div>
              </div>
              <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-4 text-center shadow-lg">
                <div className="text-3xl sm:text-4xl font-extrabold text-cyan-300">{dobStats.minutes}</div>
                <div className="text-xs uppercase tracking-wider text-purple-200 mt-1">Minutes</div>
              </div>
              <div className="col-span-2 sm:col-span-1 bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-4 text-center shadow-lg">
                <div className="text-3xl sm:text-4xl font-extrabold text-emerald-300">{dobStats.seconds}</div>
                <div className="text-xs uppercase tracking-wider text-purple-200 mt-1">Seconds</div>
              </div>
            </div>

            {/* Reasons Shuffle Deck */}
            <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-3xl p-8 text-center space-y-5 shadow-xl">
              <div className="text-xs font-bold uppercase tracking-widest text-pink-300">
                Reason #{(reasonIndex % reasonsList.length) + 1} of {reasonsList.length} Why I Adore You
              </div>
              <p className="text-xl sm:text-2xl font-bold text-white max-w-xl mx-auto leading-snug">
                &ldquo;{reasonsList[reasonIndex % reasonsList.length]}&rdquo;
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setReasonIndex((prev) => (prev - 1 + reasonsList.length) % reasonsList.length);
                    playChime();
                  }}
                  className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition"
                >
                  ← Previous
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setReasonIndex((prev) => (prev + 1) % reasonsList.length);
                    playChime();
                  }}
                  className="px-6 py-3 rounded-2xl bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white font-bold text-sm inline-flex items-center gap-2 shadow-lg transition"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Show Another Reason</span>
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* =========================================================
          STEP 3: CUSTOM PHOTO MEMORY CAROUSEL
          ========================================================= */}
      {showSection3 && activeMemory && (
        <section id="step-3-memories" className={`${activeTheme.carouselBg} text-slate-800 py-14 px-4 sm:px-8 border-b border-black/10`}>
          <div className="max-w-5xl mx-auto">
            <div className="text-center max-w-2xl mx-auto mb-8">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-bold mb-2">
                <Camera className="w-3.5 h-3.5" />
                <span>Step 3 of 4 • Our Photo Memory Carousel</span>
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900">
                Favorite Moments With {partnerName}
              </h2>
              <p className="text-sm text-slate-600 mt-1">
                Click any memory card below to see the photo and story behind that moment.
              </p>
            </div>

            {/* Active Spotlight Card */}
            <div className="bg-white rounded-3xl border border-amber-200/80 shadow-lg p-6 sm:p-8 mb-8 grid grid-cols-1 md:grid-cols-5 gap-6 items-center">
              <div className="md:col-span-2">
                {activeMemory.image ? (
                  <div className="relative h-64 rounded-2xl overflow-hidden shadow-md border border-amber-200">
                    <img
                      src={activeMemory.image}
                      alt={activeMemory.title}
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute bottom-3 left-3 text-[11px] font-bold uppercase tracking-wider bg-black/55 backdrop-blur-sm text-white px-3 py-1 rounded-full">
                      {activeMemory.date}
                    </span>
                  </div>
                ) : (
                  <div
                    className={`h-64 rounded-2xl bg-gradient-to-br ${activeMemory.gradient} flex flex-col items-center justify-center text-white p-6 text-center shadow-md`}
                  >
                    <span className="text-6xl mb-3">{activeMemory.emoji}</span>
                    <span className="text-xs font-bold uppercase tracking-widest bg-black/20 backdrop-blur-sm px-3 py-1 rounded-full">
                      {activeMemory.date}
                    </span>
                    {viewMode === 'builder' && (
                      <span className="text-[11px] opacity-90 mt-2">
                        Upload a photo in Tab 2 above!
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div className="md:col-span-3 flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600">
                      <MapPin className="w-3.5 h-3.5" />
                      {activeMemory.location}
                    </span>
                    <span className="text-xs text-slate-400">
                      Memory {selectedMemoryIndex + 1} of {memories.length}
                    </span>
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-3">
                    {activeMemory.title}
                  </h3>
                  <p className="text-sm sm:text-base text-slate-600 leading-relaxed bg-amber-50/70 p-4 rounded-2xl border border-amber-100">
                    &ldquo;{activeMemory.note}&rdquo;
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => toggleLike(activeMemory.id)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
                      likedIds[activeMemory.id]
                        ? 'bg-rose-100 text-rose-600 border border-rose-200'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <Heart
                      className={`w-4 h-4 ${
                        likedIds[activeMemory.id] ? 'fill-rose-500 text-rose-500' : ''
                      }`}
                    />
                    <span>{likedIds[activeMemory.id] ? 'Loved This Memory' : 'Love This Memory'}</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedMemoryIndex((prev) => (prev - 1 + memories.length) % memories.length)
                      }
                      className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedMemoryIndex((prev) => (prev + 1) % memories.length)}
                      className="p-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white transition"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Memory Thumbnails Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {memories.map((item, index) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setSelectedMemoryIndex(index);
                    playChime();
                  }}
                  className={`p-3 rounded-2xl text-left transition-all border-2 ${
                    selectedMemoryIndex === index
                      ? 'bg-white border-rose-500 shadow-md -translate-y-1'
                      : 'bg-white/75 border-transparent hover:bg-white'
                  }`}
                >
                  {item.image ? (
                    <img src={item.image} alt={item.title} className="w-full h-16 object-cover rounded-xl mb-2" />
                  ) : (
                    <div className={`h-16 rounded-xl bg-gradient-to-br ${item.gradient} flex items-center justify-center text-2xl mb-2`}>
                      {item.emoji}
                    </div>
                  )}
                  <div className="text-xs font-bold text-slate-800 truncate">{item.title}</div>
                  <div className="text-[10px] text-slate-500 truncate">{item.location}</div>
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* =========================================================
          STEP 4: TYPEWRITER LOVE LETTERS & REDEEMABLE COUPONS
          ========================================================= */}
      {showSection4 && activeLetter && (
        <section id="step-4-letters" className={`bg-gradient-to-b ${activeTheme.lettersBg} text-white py-14 px-4 sm:px-8`}>
          <div className="max-w-4xl mx-auto space-y-12">
            <div>
              <div className="text-center mb-8">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/20 border border-rose-400/30 text-rose-300 text-xs font-bold mb-2">
                  <Mail className="w-3.5 h-3.5" />
                  <span>Step 4 of 4 • Personal Typewriter Love Letters</span>
                </span>
                <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
                  Letters Written Just For {partnerName}
                </h2>
                <p className="text-sm text-indigo-200 mt-1">
                  Tap any wax-sealed envelope below to watch your letter type out live.
                </p>
              </div>

              {/* Envelope Tabs */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
                {letters.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setSelectedLetterId(item.id);
                      playChime();
                    }}
                    className={`p-4 rounded-2xl text-left border transition-all ${
                      selectedLetterId === item.id
                        ? 'bg-rose-500/20 border-rose-400 shadow-lg -translate-y-0.5'
                        : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <Mail className="w-4 h-4 text-rose-400" />
                      <span className="text-[10px] uppercase tracking-wider font-semibold text-rose-300">
                        Wax Seal
                      </span>
                    </div>
                    <div className="font-bold text-xs sm:text-sm text-white leading-snug">{item.badge}</div>
                    <div className="text-[11px] text-slate-400 mt-1">Tap to unseal</div>
                  </button>
                ))}
              </div>

              {/* Letter Paper Card */}
              <div className="bg-[#FFFDF9] text-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl border-4 border-rose-200">
                <div className="flex items-center justify-between border-b border-amber-200 pb-4 mb-6">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-widest text-rose-600">
                      {activeLetter.badge}
                    </span>
                    <h3 className="text-2xl font-bold text-slate-900 mt-1">
                      {activeLetter.title}
                    </h3>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center font-bold">
                    ♥
                  </div>
                </div>

                <p className="text-base sm:text-lg text-slate-700 leading-relaxed min-h-[110px] font-serif whitespace-pre-line">
                  {typedText}
                  <span className="inline-block w-1.5 h-5 bg-rose-500 ml-1 animate-pulse" />
                </p>

                <div className="mt-8 pt-4 border-t border-amber-100 flex items-center justify-between text-xs text-slate-500">
                  <span>Written with love for {partnerName}</span>
                  <span className="font-bold text-rose-700 text-sm">— {yourName}</span>
                </div>
              </div>
            </div>

            {/* Redeemable Love Coupons */}
            <div className="pt-6 border-t border-indigo-900/60">
              <div className="text-center mb-6">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-300 mb-1">
                  <Gift className="w-4 h-4" />
                  <span>Bonus Finale • Redeemable Date &amp; Care Coupons</span>
                </span>
                <h3 className="text-2xl font-bold text-white">
                  Tap Any Coupon Below To Claim It, {partnerName}!
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {loveCoupons.map((coupon) => {
                  const claimed = claimedCoupons[coupon.id];
                  return (
                    <button
                      key={coupon.id}
                      type="button"
                      onClick={() => toggleCoupon(coupon.id)}
                      className={`p-5 rounded-2xl text-left border-2 transition-all flex items-start gap-4 ${
                        claimed
                          ? 'bg-emerald-950/60 border-emerald-400/60 shadow-lg'
                          : 'bg-slate-900/70 border-indigo-800/70 hover:border-rose-400/60'
                      }`}
                    >
                      <span className="text-3xl shrink-0">{coupon.icon}</span>
                      <div className="flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="font-bold text-sm sm:text-base text-white">{coupon.title}</h4>
                          <span
                            className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full ${
                              claimed
                                ? 'bg-emerald-400/20 text-emerald-300 border border-emerald-400/40'
                                : 'bg-rose-500/20 text-rose-300'
                            }`}
                          >
                            {claimed ? '✓ Claimed!' : 'Tap to Claim'}
                          </span>
                        </div>
                        <p className="text-xs text-indigo-200/80 mt-1 leading-relaxed">{coupon.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </section>
      )}
      {/* =========================================================
          FLOATING SPOTIFY / YOUTUBE / WEB AUDIO MINI-PLAYER DOCK
          ========================================================= */}
      {songMode === 'web' && parsedWebSong && showFloatingPlayer && (
        <aside className="fixed bottom-4 left-4 right-4 sm:right-auto sm:w-96 z-40 bg-slate-900/95 backdrop-blur-md border border-emerald-500/40 rounded-2xl shadow-2xl p-3">
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2 min-w-0">
              <Disc3 className="w-4 h-4 text-emerald-400 shrink-0" />
              <div className="truncate">
                <div className="text-xs font-bold text-white truncate">
                  {customSongTitle || 'Our Favorite Song'}
                </div>
                <div className="text-[10px] text-emerald-300">
                  {parsedWebSong.label} Soundtrack • Tap Play below
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowFloatingPlayer(false)}
              className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"
              title="Minimize player"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {parsedWebSong.type === 'spotify' && (
            <iframe
              title="Spotify Song Player"
              src={parsedWebSong.embedUrl}
              width="100%"
              height="80"
              frameBorder="0"
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              loading="lazy"
              className="rounded-xl"
            />
          )}

          {parsedWebSong.type === 'youtube' && (
            <iframe
              title="YouTube Song Player"
              src={parsedWebSong.embedUrl}
              width="100%"
              height="155"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="rounded-xl"
            />
          )}

          {parsedWebSong.type === 'audio' && (
            <audio controls className="w-full h-10" src={parsedWebSong.embedUrl}>
              Your browser does not support direct audio playback.
            </audio>
          )}
        </aside>
      )}
    </div>
  );
}