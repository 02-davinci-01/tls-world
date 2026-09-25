import { ImageResponse } from 'next/og';

export const alt = 'Into the wired: power lines against a white sky';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

/** A static render of the sky and the hero title (SPEC §8.7). */
export default function OgImage() {
  const cable = (d: string) => <path d={d} fill="none" stroke="#121216" strokeWidth="1.6" />;
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', background: '#f2f2f5', position: 'relative' }}>
        <svg width="1200" height="305" viewBox="0 0 1180 300" style={{ position: 'absolute', top: 0, left: 0 }}>
          <line x1="0" y1="268" x2="1180" y2="268" stroke="#121216" strokeWidth="1" />
          <polygon points="176,268 184,268 400,292 380,299" fill="#121216" />
          <polygon points="616,268 624,268 860,290 842,298" fill="#121216" />
          <polygon points="1036,268 1044,268 1200,284 1200,292" fill="#121216" />
          <circle cx="250" cy="280" r="3" fill="#c0101c" />
          <circle cx="700" cy="279" r="3.4" fill="#c0101c" />
          <circle cx="780" cy="286" r="2.4" fill="#c0101c" />
          <circle cx="1100" cy="281" r="2.8" fill="#c0101c" />
          {[180, 620, 1040].map((x, i) => (
            <g key={x}>
              <line x1={x} y1={i === 1 ? 18 : 30} x2={x} y2="268" stroke="#121216" strokeWidth="4" />
              <line x1={x - 34} y1={i === 1 ? 36 : 48} x2={x + 34} y2={i === 1 ? 36 : 48} stroke="#121216" strokeWidth="3" />
              <line x1={x - 24} y1={i === 1 ? 58 : 70} x2={x + 24} y2={i === 1 ? 58 : 70} stroke="#121216" strokeWidth="3" />
            </g>
          ))}
          {cable('M-20 62 Q70 96 150 46 Q385 118 590 34 Q830 118 1010 46 Q1110 90 1200 58')}
          {cable('M-20 68 Q80 102 180 46 Q400 124 620 34 Q840 124 1040 46 Q1120 96 1200 64')}
          {cable('M-20 74 Q90 108 210 46 Q415 130 650 34 Q850 130 1070 46 Q1130 102 1200 70')}
          {cable('M-20 92 Q80 118 162 68 Q390 140 600 56 Q835 140 1020 68 Q1115 110 1200 86')}
          {cable('M-20 98 Q90 124 198 68 Q410 146 640 56 Q845 146 1058 68 Q1125 116 1200 92')}
          <circle cx="470" cy="80" r="4" fill="#5b36d6" />
        </svg>
        <div style={{ position: 'absolute', left: 72, top: 350, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', fontSize: 104, letterSpacing: '-0.045em', color: '#121216', fontWeight: 300 }}>
            Into&nbsp;
            <span style={{ fontWeight: 700, textShadow: '3px 0 rgba(192,16,28,.75), -3px 0 rgba(91,54,214,.75)' }}>the wired</span>
          </div>
          <div style={{ display: 'flex', fontSize: 30, color: '#55565f', marginTop: 18 }}>
            how do you resolve an identity crisis in the virtual world?
          </div>
        </div>
        <div style={{ position: 'absolute', right: 56, bottom: 44, display: 'flex', fontSize: 18, color: '#a6a7b1', letterSpacing: '0.3em' }}>
          PRESENT DAY, PRESENT TIME
        </div>
      </div>
    ),
    size,
  );
}
