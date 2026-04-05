import * as chrono from 'chrono-node';
import { EventData, EventCategory, ExtractedEventData, OCRResult } from '@/types/event';

// ---- Mock Events ----
export const mockEvents: EventData[] = [
  {
    id: '1',
    name: 'AI & Machine Learning Summit 2026',
    date: '2026-05-15',
    time: '09:00 AM',
    venue: 'Tech Convention Center, Hall A',
    category: 'Seminar',
    poster_url: '',
    description: 'Join leading AI researchers and practitioners for a day of cutting-edge talks on machine learning, deep learning, and AI applications.',
    created_at: '2026-03-28T10:00:00Z',
  },
  {
    id: '2',
    name: 'Full-Stack Web Development Workshop',
    date: '2026-04-20',
    time: '10:00 AM',
    venue: 'Innovation Hub, Room 204',
    category: 'Workshop',
    poster_url: '',
    description: 'Hands-on workshop covering React, Node.js, and database design. Build a complete application from scratch.',
    created_at: '2026-03-25T14:30:00Z',
  },
  {
    id: '3',
    name: 'CodeStorm Hackathon 2026',
    date: '2026-06-01',
    time: '08:00 AM',
    venue: 'University Auditorium',
    category: 'Hackathon',
    poster_url: '',
    description: '48-hour hackathon with prizes worth $10,000. Open to all skill levels.',
    created_at: '2026-03-20T09:15:00Z',
  },
  {
    id: '4',
    name: 'Algorithmic Problem Solving Challenge',
    date: '2026-04-10',
    time: '02:00 PM',
    venue: 'CS Department Lab 3',
    category: 'Coding Challenge',
    poster_url: '',
    description: 'Test your problem-solving skills with algorithmic challenges ranging from easy to expert level.',
    created_at: '2026-03-18T16:45:00Z',
  },
  {
    id: '5',
    name: 'Cybersecurity Awareness Seminar',
    date: '2026-05-05',
    time: '11:00 AM',
    venue: 'Library Conference Room',
    category: 'Seminar',
    poster_url: '',
    description: 'Learn about the latest cybersecurity threats, best practices, and career opportunities.',
    created_at: '2026-03-15T11:00:00Z',
  },
  {
    id: '6',
    name: 'IoT Prototyping Workshop',
    date: '2026-04-28',
    time: '09:30 AM',
    venue: 'Electronics Lab, Building C',
    category: 'Workshop',
    poster_url: '',
    description: 'Build your own IoT prototypes using Arduino and Raspberry Pi. Components provided.',
    created_at: '2026-03-12T08:00:00Z',
  },
];

// ---- API Config ----
// If backend URL isn't configured, use same-origin relative calls (`/api/...`).
const API_BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? '';
// Normalize: don't end with `/` to avoid `//api/...` when API_BASE is set.
const API_BASE_NORMALIZED = API_BASE.replace(/\/+$/, '');

// ---- API Functions (with mock fallback) ----

export async function fetchEvents(): Promise<EventData[]> {
  try {
    const res = await fetch(`${API_BASE_NORMALIZED}/api/events`);
    if (!res.ok) throw new Error('API unavailable');
    return await res.json();
  } catch {
    return mockEvents;
  }
}

export async function fetchEventById(id: string): Promise<EventData | null> {
  try {
    const res = await fetch(`${API_BASE_NORMALIZED}/api/events/${id}`);
    if (!res.ok) throw new Error('API unavailable');
    return await res.json();
  } catch {
    return mockEvents.find(e => e.id === id) || null;
  }
}

export async function deleteEvent(id: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE_NORMALIZED}/api/events/${id}`, { method: 'DELETE' });
    return res.ok;
  } catch {
    return true; // mock
  }
}

export async function updateEvent(id: string, data: Partial<EventData>): Promise<EventData | null> {
  try {
    const res = await fetch(`${API_BASE_NORMALIZED}/api/events/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('API unavailable');
    return await res.json();
  } catch {
    const event = mockEvents.find(e => e.id === id);
    return event ? { ...event, ...data } : null;
  }
}

export async function uploadPoster(file: File): Promise<EventData> {
  try {
    const formData = new FormData();
    formData.append('poster', file);
    const res = await fetch(`${API_BASE_NORMALIZED}/api/upload`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) throw new Error('API unavailable');
    return await res.json();
  } catch {
    // Client-side fallback using Tesseract.js
    throw new Error('BACKEND_UNAVAILABLE');
  }
}

// ---- Client-side OCR (Tesseract.js fallback) ----

async function imageToCanvas(file: File, scale: number): Promise<HTMLCanvasElement> {
  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.floor(bitmap.width * scale));
  canvas.height = Math.max(1, Math.floor(bitmap.height * scale));
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('No canvas 2d context');
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return canvas;
}

type PreprocessOptions = {
  contrast?: number;
  threshold?: number;
  invert?: boolean;
};

function preprocessCanvasForText(src: HTMLCanvasElement, opts: PreprocessOptions = {}): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = src.width;
  canvas.height = src.height;
  const ctx = canvas.getContext('2d');
  const srcCtx = src.getContext('2d');
  if (!ctx || !srcCtx) return src;
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(src, 0, 0);

  const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = img.data;

  // Grayscale + contrast + threshold to reduce background noise.
  // Tuning these improves OCR robustness across different poster styles.
  const contrast = typeof opts.contrast === 'number' ? opts.contrast : 1.35;
  const threshold = typeof opts.threshold === 'number' ? opts.threshold : 185;
  const invert = Boolean(opts.invert);
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const gray = 0.299 * r + 0.587 * g + 0.114 * b;
    const contrasted = Math.max(0, Math.min(255, (gray - 128) * contrast + 128));
    const base = contrasted >= threshold ? 255 : 0;
    const v = invert ? 255 - base : base;
    data[i] = v;
    data[i + 1] = v;
    data[i + 2] = v;
  }
  ctx.putImageData(img, 0, 0);
  return canvas;
}

function normalizeOcrText(text: string): string {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/[|]/g, '-')
    .replace(/•/g, '-')
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/\s{2,}/g, ' ')
    .trim();
}

type TesseractLike = {
  recognize: (
    input: HTMLCanvasElement | File,
    lang: string,
    options?: Record<string, unknown>,
  ) => Promise<{ data?: { text?: string; confidence?: number } }>;
};

async function performPdfOCR(file: File, tesseract: TesseractLike): Promise<OCRResult> {
  // PDF: render pages to canvas, then OCR each page.
  const pdfjsMod = await import('pdfjs-dist/legacy/build/pdf.mjs');
  type PdfViewport = { width: number; height: number };
  type PdfPage = {
    getViewport: (opts: { scale: number }) => PdfViewport;
    render: (params: { canvasContext: CanvasRenderingContext2D; viewport: PdfViewport; canvas: HTMLCanvasElement }) => {
      promise: Promise<void>;
    };
  };
  type PdfDoc = {
    numPages: number;
    getPage: (pageNum: number) => Promise<PdfPage>;
  };
  type PdfJs = {
    GlobalWorkerOptions: { workerSrc: string };
    getDocument: (opts: { data: Uint8Array }) => { promise: Promise<PdfDoc> };
  };

  const pdfjs = pdfjsMod as unknown as PdfJs;
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url,
  ).toString();

  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjs.getDocument({ data: new Uint8Array(arrayBuffer) });
  const pdf = await loadingTask.promise;

  const pageCount = Math.min(pdf.numPages || 0, 6); // keep UX responsive
  const texts: string[] = [];
  const confidences: number[] = [];

  for (let pageNum = 1; pageNum <= pageCount; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const viewport = page.getViewport({ scale: 2.0 });
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) continue;

    canvas.width = Math.max(1, Math.floor(viewport.width));
    canvas.height = Math.max(1, Math.floor(viewport.height));

    await page.render({ canvasContext: ctx, viewport, canvas }).promise;

    const pre = preprocessCanvasForText(canvas);
    const { data } = await tesseract.recognize(pre, 'eng', {
      preserve_interword_spaces: '1',
      tessedit_pageseg_mode: '6',
    });

    if (data?.text) texts.push(data.text);
    if (typeof data?.confidence === 'number') confidences.push(data.confidence);
  }

  const text = normalizeOcrText(texts.join('\n'));
  const confidence = confidences.length ? confidences.reduce((a, b) => a + b, 0) / confidences.length : 0;
  return { text, confidence };
}

export async function performClientOCR(file: File): Promise<OCRResult> {
  const Tesseract = (await import('tesseract.js')) as unknown as TesseractLike;
  const lowerName = (file.name || '').toLowerCase();
  const isPdf = file.type === 'application/pdf' || lowerName.endsWith('.pdf');

  // PDFs: render pages and OCR per page.
  if (isPdf) {
    return performPdfOCR(file, Tesseract);
  }

  // Images: convert to canvas, preprocess, then OCR.
  const canvas2x = await imageToCanvas(file, 2.0);
  const canvas3x = await imageToCanvas(file, 3.0);

  function scoreExtracted(info: ExtractedEventData): number {
    let score = 0;
    if (info.name && info.name !== 'Unknown Event') score += 20;
    if (info.date && info.date !== 'TBD') score += 30;
    if (info.date && info.date !== 'TBD' && /\d/.test(info.date)) score += 10;
    if (info.time && info.time !== 'TBD') score += 25;
    if (info.venue && info.venue !== 'TBD') score += 20;
    return score;
  }

  async function runVariant(canvas: HTMLCanvasElement, preOpts: PreprocessOptions, psm: string): Promise<OCRResult & { score: number }> {
    const pre = preprocessCanvasForText(canvas, preOpts);
    const { data } = await Tesseract.recognize(pre, 'eng', {
      preserve_interword_spaces: '1',
      tessedit_pageseg_mode: psm,
    });
    const text = normalizeOcrText(data?.text || '');
    const confidence = typeof data?.confidence === 'number' ? data.confidence : 0;
    const extracted = extractEventInfo(text);
    const score = scoreExtracted(extracted) + Math.min(50, confidence / 2);
    return { text, confidence, score };
  }

  const variants = [
    { canvas: canvas2x, preOpts: { threshold: 180, contrast: 1.45 }, psm: '6' },
    { canvas: canvas2x, preOpts: { threshold: 205, contrast: 1.2 }, psm: '6' },
    { canvas: canvas3x, preOpts: { threshold: 185, contrast: 1.35 }, psm: '11' },
  ];

  let best: (OCRResult & { score: number }) | null = null;
  for (const v of variants) {
    const candidate = await runVariant(v.canvas, v.preOpts, v.psm);
    if (!best || candidate.score > best.score) best = candidate;

    // Early exit: we already have a strong set of fields.
    if (best.score >= 125) break;
  }

  return { text: best?.text || '', confidence: best?.confidence || 0 };
}

// ---- NLP Extraction (client-side) ----

export function extractEventInfo(rawText: string): ExtractedEventData {
  const normalizedText = rawText
    .replace(/\r\n/g, '\n')
    .replace(/[|]/g, '-')
    .replace(/•/g, '-')
    .replace(/\s{2,}/g, ' ')
    .trim();

  const lines = normalizedText
    .split('\n')
    .map(l => l.trim())
    .filter(Boolean)
    .filter(l => !/^[-_]+$/.test(l));

  const monthNames =
    '(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)';

  const normalizeSpace = (s: string) => s.replace(/\s{2,}/g, ' ').trim();
  const uniq = <T,>(arr: T[]) => Array.from(new Set(arr));
  const normalizeAmPm = (ampm: string) => {
    const u = ampm.toUpperCase().replace(/\./g, '');
    if (u === 'AM' || u === 'A') return 'AM';
    if (u === 'PM' || u === 'P') return 'PM';
    if (u.includes('A')) return 'AM';
    if (u.includes('P')) return 'PM';
    return ampm;
  };
  const to12h = (hh24: number, mm: number, ampm: string) => {
    const A = normalizeAmPm(ampm);
    let hour12 = hh24 % 12;
    if (hour12 === 0) hour12 = 12;
    return `${hour12.toString().padStart(2, '0')}:${mm.toString().padStart(2, '0')} ${A}`;
  };

  // ---- Date extraction (high recall) ----
  type Candidate = { value: string; score: number };
  const dateCandidates: Candidate[] = [];

  const inferredYears = uniq(normalizedText.match(/\b(19\d{2}|20\d{2})\b/g) || []);
  const inferredYear = inferredYears.length ? inferredYears[0] : '';

  const dateRegexes: RegExp[] = [
    // May 15, 2026 / May 15 2026 / May 15
    new RegExp(`\\b${monthNames}\\s+\\d{1,2}(?:st|nd|rd|th)?(?:,)?(?:\\s+\\d{2,4})?\\b`, 'i'),
    // 15 May 2026
    new RegExp(`\\b\\d{1,2}(?:st|nd|rd|th)?\\s+${monthNames}(?:,)?(?:\\s+\\d{2,4})?\\b`, 'i'),
    // 2026-05-15 / 2026/05/15 / 2026.05.15 (allow spaces around separators)
    /\b\d{4}\s*[-/.]\s*\d{1,2}\s*[-/.]\s*\d{1,2}\b/,
    // 15/05/2026 or 15-05-26 (allow spaces around separators)
    /\b\d{1,2}\s*[-/.]\s*\d{1,2}\s*[-/.]\s*\d{2,4}\b/,
  ];

  const addDateCandidatesFrom = (text: string) => {
    for (const re of dateRegexes) {
      const matches = text.match(re);
      if (!matches) continue;
      for (const m of matches instanceof Array ? matches : [matches]) {
        const value = normalizeSpace(String(m));
        const hasMonth = new RegExp(monthNames, 'i').test(value);
        const hasYear = /\b(19\d{2}|20\d{2})\b/.test(value);
        const yearOrShortYear = hasYear || /\b\d{2}\b/.test(value);
        if (!hasMonth && !yearOrShortYear) continue;
        let score = 10 + value.length / 10;
        if (hasMonth) score += 40;
        if (hasYear) score += 60;
        if (value.split(' ').length <= 4) score += 15;
        dateCandidates.push({ value, score });
      }
    }
  };

  for (const line of lines) addDateCandidatesFrom(line);
  addDateCandidatesFrom(normalizedText);

  let date = dateCandidates.sort((a, b) => b.score - a.score)[0]?.value || '';
  if (date && !/\b(19\d{2}|20\d{2})\b/.test(date) && inferredYear) {
    // Attach inferred year when OCR dropped it.
    date = `${date.replace(/,$/, '').trim()}, ${inferredYear}`.replace(/\s{2,}/g, ' ').trim();
  }
  // Canonicalize common numeric-date separators (e.g. `02 - 04 - 2026` -> `02-04-2026`)
  date = date.replace(/\s*([-/.])\s*/g, '$1').replace(/\s{2,}/g, ' ').trim();
  date = date || 'TBD';

  // ---- Time extraction (high recall) ----
  const timeCandidates: Candidate[] = [];
  const timeRegexes: Array<{ re: RegExp; normalize: (m: RegExpMatchArray) => string | null }> = [
    {
      // HH:MM AM/PM, HH.MM AM/PM, 9:00am, 9:00 a.m.
      re: /\b(\d{1,2})[:.](\d{2})\s*([AaPp])\.?\s*[Mm]\.?\b/,
      normalize: (m) => {
        const hh = Number(m[1]);
        const mm = Number(m[2]);
        const ampm = normalizeAmPm(m[3]);
        return `${hh.toString().padStart(2, '0')}:${mm.toString().padStart(2, '0')} ${ampm}`;
      },
    },
    {
      // 0900 AM / 1230 PM
      re: /\b(\d{3,4})\s*([AaPp])\s*[Mm]\.?\b/,
      normalize: (m) => {
        const raw = m[1];
        const ampm = normalizeAmPm(m[2]);
        const padded = raw.length === 3 ? `0${raw}` : raw;
        const hh = Number(padded.slice(0, 2));
        const mm = Number(padded.slice(2, 4));
        return `${hh.toString().padStart(2, '0')}:${mm.toString().padStart(2, '0')} ${ampm}`;
      },
    },
    {
      // 9 AM / 10 PM / 9 a.m.
      re: /\b(\d{1,2})\s*([AaPp])\.?\s*[Mm]\.?\b/,
      normalize: (m) => {
        const hh = Number(m[1]);
        const ampm = normalizeAmPm(m[2]);
        return `${hh.toString().padStart(2, '0')}:00 ${ampm}`;
      },
    },
    {
      // 24h: 09:30 or 14.30
      re: /\b([01]?\d|2[0-3])[:.](\d{2})\b/,
      normalize: (m) => {
        const hh24 = Number(m[1]);
        const mm = Number(m[2]);
        const ampm = hh24 >= 12 ? 'PM' : 'AM';
        return to12h(hh24, mm, ampm);
      },
    },
  ];

  for (const line of lines) {
    for (const { re, normalize } of timeRegexes) {
      const m = re.exec(line);
      if (!m) continue;
      const normalizedTime = normalize(m as unknown as RegExpMatchArray);
      if (!normalizedTime) continue;
      const hasAmPm = /\b(AM|PM)\b/.test(normalizedTime);
      const score = (hasAmPm ? 70 : 40) + normalizedTime.length / 10;
      timeCandidates.push({ value: normalizedTime, score });
    }
  }

  // Also try whole text (in case OCR merged lines)
  for (const { re, normalize } of timeRegexes) {
    const m = normalizedText.match(re);
    if (!m) continue;
    const normalizedTime = normalize(m as unknown as RegExpMatchArray);
    if (!normalizedTime) continue;
    const hasAmPm = /\b(AM|PM)\b/.test(normalizedTime);
    const score = (hasAmPm ? 70 : 40) + normalizedTime.length / 10;
    timeCandidates.push({ value: normalizedTime, score });
  }

  let time = timeCandidates.sort((a, b) => b.score - a.score)[0]?.value || '';
  time = time || 'TBD';

  // ---- Time range (e.g. `09:00 A.M. - 02:30 P.M.`) ----
  // If we find two times connected by a range separator, prefer the range format.
  const timeRangeRe =
    /\b(\d{1,2}\s*[:.]\s*\d{2}\s*[AaPp]\.?\s*[Mm]\.?)\s*(?:-|–|to)\s*(\d{1,2}\s*[:.]\s*\d{2}\s*[AaPp]\.?\s*[Mm]\.?)\b/;
  const rangeMatch = normalizedText.match(timeRangeRe);
  if (rangeMatch) {
    const startRaw = rangeMatch[1];
    const endRaw = rangeMatch[2];
    // Canonicalize start/end individually using the existing timeRegexes.
    const canonicalizeOne = (s: string): string | null => {
      for (const { re, normalize } of timeRegexes) {
        const m = s.match(re);
        if (m) {
          const matchArr = m as unknown as RegExpMatchArray;
          const out = normalize(matchArr);
          if (out) return out;
        }
      }
      return null;
    };
    const start = canonicalizeOne(startRaw);
    const end = canonicalizeOne(endRaw);
    if (start && end) {
      time = `${start} - ${end}`;
    }
  }

  // ---- Chrono fallback (higher NLP date/time parsing) ----
  // Useful when posters omit labels or OCR splits tokens awkwardly.
  if (date === 'TBD' || time === 'TBD') {
    try {
      const chronoResults = chrono.parse(normalizedText, new Date(), { forwardDate: true });
      const best = chronoResults[0];
      if (best?.start?.date) {
        const d = best.start.date();
        if (date === 'TBD') {
          date = d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
        }
        if (time === 'TBD') {
          const hh = d.getHours();
          const mm = d.getMinutes();
          const ampm = hh >= 12 ? 'PM' : 'AM';
          const hh12 = ((hh + 11) % 12) + 1;
          const pad = (n: number) => n.toString().padStart(2, '0');
          time = `${pad(hh12)}:${pad(mm)} ${ampm}`;
        }
      }
    } catch {
      // Ignore chrono errors; regex extraction remains the source of truth.
    }
  }

  // ---- Venue/place extraction (works even when "Venue:" label is missing) ----
  const venueWordRe =
    /\b(venue|location|place|hall|room|auditorium|center|centre|lab|laboratory|building|campus|block|tower|floor|suite|street|road|rd\.?|avenue|ave\.?|blvd\.?|drive|dr\.?|court|ct\.?|area|district|city|town|university|institute|academy)\b/i;
  const atRe = /\bat\b\s*[:-]?\s*([A-Za-z0-9].*)/i;
  const prefixRe = /^(venue|location|place|at)\s*[:-]?\s*/i;
  const stripDateTime = (s: string) => {
    let out = s;
    for (const re of dateRegexes) out = out.replace(re, ' ');
    for (const { re } of timeRegexes) out = out.replace(re, ' ');
    out = out.replace(/\s{2,}/g, ' ').trim();
    return out;
  };

  type VenueCand = { value: string; score: number; idx: number };
  const venueCandidates: VenueCand[] = [];

  for (let idx = 0; idx < lines.length; idx++) {
    const line = lines[idx];
    const hasVenueWord = venueWordRe.test(line);
    const atMatch = line.match(atRe);
    if (!hasVenueWord && !atMatch) continue;

    const rawCaptured = hasVenueWord ? line : atMatch?.[1] || '';
    let captured = rawCaptured.replace(prefixRe, '').trim();
    captured = stripDateTime(captured);
    captured = captured.replace(/[,.]$/, '').trim();
    if (!captured) continue;

    const letters = (captured.match(/[A-Za-z]/g) || []).length;
    if (letters < 4) continue;

    const score =
      (hasVenueWord ? 75 : 45) +
      letters * 0.6 +
      (captured.length < 110 ? 20 : 0) -
      idx * 0.05;

    venueCandidates.push({ value: normalizeSpace(captured), score, idx });
  }

  let venue = venueCandidates.sort((a, b) => b.score - a.score)[0]?.value || '';
  if (venue) {
    // If the venue looks split across lines, join one line forward.
    const best = venueCandidates.sort((a, b) => b.score - a.score)[0];
    if (best) {
      const next = lines[best.idx + 1];
      if (next && next.length > 6 && venueWordRe.test(next) && !timeCandidates.some(tc => next.includes(tc.value))) {
        const nextCaptured = next.replace(prefixRe, '').trim();
        const joined = normalizeSpace(`${venue}, ${nextCaptured}`);
        if (joined.length <= 130) venue = joined;
      }
    }
  }
  venue = venue || 'TBD';

  // ---- Event name extraction (event patterns) ----
  const eventKeyRe =
    /\b(summit|flash|build|workshop|hackathon|seminar|conference|symposium|lecture|webinar|challenge|competition|contest|c(?:oding)?\s*challenge|forum|expo|exhibition|fair|day|meetup|bootcamp|icisd)\b/i;
  const excludedRe =
    new RegExp(`${monthNames}|\\b(19\\d{2}|20\\d{2})\\b|\\b\\d{1,2}([:/\\-\\.])\\d{1,2}([:/\\-\\.])\\d{2,4}\\b|${venueWordRe.source}`, 'i');

  const top = lines.slice(0, 10);
  const candidateNameIndices: number[] = [];
  for (let i = 0; i < top.length; i++) {
    const line = top[i];
    if (line.length < 6) continue;
    if (/^\d/.test(line)) continue;
    if (venueWordRe.test(line)) continue;
    if (timeCandidates.some(tc => line.includes(tc.value))) continue;
    if (excludedRe.test(line)) continue;
    if (eventKeyRe.test(line)) candidateNameIndices.push(i);
  }

  let name = '';
  if (candidateNameIndices.length) {
    name = top[candidateNameIndices[0]];
  } else {
    // fallback: choose the best "title-like" line near the top
    let bestScore = -Infinity;
    for (const [iStr, line] of top.entries()) {
      const i = iStr;
      const letters = (line.match(/[A-Za-z]/g) || []).length;
      if (letters < 6) continue;
      const score = letters + line.length / 10 - i * 1.2;
      if (score > bestScore) {
        bestScore = score;
        name = line;
      }
    }
  }

  // Join continuation line if it looks like the title continues.
  const nameIdx = lines.findIndex(l => l === name);
  const maybeNext = nameIdx !== -1 ? lines[nameIdx + 1] : '';
  if (maybeNext && maybeNext.length > 6 && !venueWordRe.test(maybeNext) && !excludedRe.test(maybeNext) && !eventKeyRe.test(maybeNext)) {
    name = normalizeSpace(`${name} ${maybeNext}`);
  }

  // Classify category from normalized text.
  const category = classifyEvent(normalizedText);

  return {
    name: name || 'Unknown Event',
    date,
    time,
    venue,
    category,
  };
}

export function classifyEvent(text: string): EventCategory {
  const lower = text.toLowerCase();
  const scores: Record<EventCategory, number> = {
    'Seminar': 0,
    'Workshop': 0,
    'Hackathon': 0,
    'Coding Challenge': 0,
  };

  const keywords: Record<EventCategory, string[]> = {
    'Seminar': ['seminar', 'talk', 'lecture', 'speaker', 'keynote', 'conference', 'summit', 'symposium', 'presentation'],
    'Workshop': ['workshop', 'hands-on', 'hands on', 'training', 'practical', 'tutorial', 'learn', 'build'],
    'Hackathon': ['hackathon', 'hack', 'build', '24hr', '48hr', 'sprint', 'code jam', 'ideathon'],
    'Coding Challenge': ['coding', 'challenge', 'competition', 'contest', 'algorithm', 'competitive', 'problem solving', 'leetcode'],
  };

  for (const [cat, kws] of Object.entries(keywords)) {
    for (const kw of kws) {
      if (lower.includes(kw)) scores[cat as EventCategory] += 1;
    }
  }

  const best = Object.entries(scores).sort((a, b) => b[1] - a[1])[0];
  return best[1] > 0 ? (best[0] as EventCategory) : 'Seminar';
}
