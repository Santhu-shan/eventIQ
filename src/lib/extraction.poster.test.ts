import { describe, it, expect } from 'vitest';
import { extractEventInfo } from './api';

describe('poster extraction (Flash Build)', () => {
  it('extracts name, date, time range, venue for labeled numeric formats', () => {
    // Approximate OCR output from the provided poster image.
    const rawText = [
      'SRM INSTITUTE OF SCIENCE AND TECHNOLOGY',
      'VADAPALANI CAMPUS, CHENNAI-26',
      'DEPARTMENT OF COMPUTER SCIENCE AND ENGINEERING',
      'IEEE CS Student Branch Chapter',
      'FLASH BUILD',
      'DATE : 02 - 04 - 2026',
      'TIME : 09:00 A.M. - 02:30 P.M.',
    ].join('\n');

    const info = extractEventInfo(rawText);
    expect(info.name.toLowerCase()).toContain('flash');
    expect(info.date).toBe('02-04-2026');
    expect(info.time).toContain('09:00 AM');
    expect(info.time).toContain('02:30 PM');
    expect(info.venue.toLowerCase()).toContain('vadapalan');
  });
});

