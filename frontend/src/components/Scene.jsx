import { useId } from 'react';

// Hand-drawn room scenes used when a flat has no uploaded photo, and in the home page hero.
export const PALS = [
  { w1: '#E6EEE4', w2: '#F4F1E8', floor: '#D9CBB4', main: '#8CA58A', alt: '#C98B62', glass: '#CFE0DB' },
  { w1: '#F1E3D3', w2: '#F9F2E8', floor: '#CDB899', main: '#C28A6A', alt: '#5E8466', glass: '#D6E4E8' },
  { w1: '#DDE8EE', w2: '#EEF3F4', floor: '#D8C9B0', main: '#7B9BB0', alt: '#D9A47C', glass: '#C9DDE6' },
  { w1: '#EFE8D8', w2: '#F8F4EB', floor: '#CFC0A3', main: '#9AA58A', alt: '#8A5E4A', glass: '#CFE0D8' },
];
export const palFor = (key) => PALS[[...String(key || '')].reduce((a, c) => a + c.charCodeAt(0), 0) % PALS.length];
// Room views shown in a flat's gallery when it has no uploaded photos yet.
export const VIEW_LABELS = { family: 'Living room', couple: 'Bedroom', bachelor: 'Studio room', bedroom: 'Bedroom', kitchen: 'Kitchen', balcony: 'Balcony', building: 'Building' };
export const viewsFor = (bhk) => (bhk === '1RK' ? ['bachelor', 'kitchen', 'balcony', 'building']
  : bhk === '1BHK' ? ['couple', 'family', 'kitchen', 'balcony', 'building']
  : ['family', 'bedroom', 'kitchen', 'balcony', 'building']);
export const variantFor = (bhk) => (bhk === '1RK' ? 'bachelor' : bhk === '1BHK' ? 'couple' : 'family');

const WOOD = '#B08A64';
const Win = ({ x, y, w, h, pal }) => {
  const pw = (w - 18) / 2; const ph = (h - 18) / 2;
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx="3" fill="#F8F5EE" />
      {[[x + 6, y + 6], [x + 12 + pw, y + 6], [x + 6, y + 12 + ph], [x + 12 + pw, y + 12 + ph]].map(([a, b]) => <rect key={a + '-' + b} x={a} y={b} width={pw} height={ph} fill={pal.glass} />)}
      <rect x={x - 6} y={y + h} width={w + 12} height="6" rx="2" fill="#F8F5EE" />
    </g>
  );
};
const Plant = ({ x, y, pal }) => (
  <g>
    <rect x={x} y={y} width="30" height="30" rx="7" fill={pal.alt} />
    <ellipse cx={x + 15} cy={y - 16} rx="9" ry="24" fill="#5E8466" />
    <ellipse cx={x + 3} cy={y - 10} rx="8" ry="20" fill="#6F9577" transform={`rotate(-25 ${x + 3} ${y - 10})`} />
    <ellipse cx={x + 28} cy={y - 10} rx="8" ry="20" fill="#6F9577" transform={`rotate(25 ${x + 28} ${y - 10})`} />
  </g>
);
const Frame = ({ x, y, w, h }) => <rect x={x} y={y} width={w} height={h} fill="#fff" stroke="#E4DDCC" strokeWidth="3" />;

const Family = ({ pal }) => (
  <g>
    <Win x={140} y={38} w={120} h={84} pal={pal} />
    <Frame x={36} y={64} w={36} h={46} /><Frame x={80} y={78} w={26} h={34} /><Frame x={300} y={70} w={34} h={44} />
    <path d="M60 134V212" stroke="#8A7A62" strokeWidth="3" /><path d="M44 112h32l-6 22H50z" fill={pal.alt} />
    <ellipse cx="200" cy="252" rx="120" ry="16" fill={pal.alt} opacity=".22" />
    <rect x="108" y="150" width="184" height="44" rx="14" fill={pal.main} />
    <rect x="100" y="178" width="200" height="44" rx="12" fill={pal.main} />
    <rect x="92" y="166" width="26" height="58" rx="12" fill={pal.main} /><rect x="282" y="166" width="26" height="58" rx="12" fill={pal.main} />
    <rect x="122" y="170" width="74" height="36" rx="10" fill="#fff" opacity=".2" /><rect x="204" y="170" width="74" height="36" rx="10" fill="#fff" opacity=".2" />
    <rect x="104" y="224" width="8" height="8" fill="#6B5A45" /><rect x="288" y="224" width="8" height="8" fill="#6B5A45" />
    <rect x="160" y="240" width="80" height="9" rx="3" fill={WOOD} /><rect x="168" y="249" width="5" height="12" fill={WOOD} /><rect x="227" y="249" width="5" height="12" fill={WOOD} />
    <Plant x={318} y={182} pal={pal} />
  </g>
);
const Bachelor = ({ pal }) => (
  <g>
    <Win x={230} y={42} w={100} h={76} pal={pal} />
    <rect x="40" y="72" width="84" height="6" fill={WOOD} />
    <rect x="48" y="52" width="8" height="20" fill={pal.alt} /><rect x="58" y="48" width="7" height="24" fill={pal.main} /><rect x="67" y="54" width="9" height="18" fill="#E2D6C0" />
    <rect x="98" y="62" width="14" height="10" rx="2" fill={pal.alt} /><ellipse cx="105" cy="56" rx="6" ry="9" fill="#5E8466" />
    <ellipse cx="150" cy="252" rx="100" ry="14" fill={pal.alt} opacity=".2" />
    <rect x="64" y="150" width="14" height="66" rx="6" fill={pal.alt} />
    <rect x="70" y="176" width="150" height="40" rx="10" fill="#fff" /><rect x="112" y="176" width="108" height="40" rx="10" fill={pal.main} />
    <rect x="82" y="164" width="40" height="16" rx="8" fill="#fff" stroke="#E4DDCC" strokeWidth="2" />
    <rect x="72" y="216" width="8" height="10" fill="#6B5A45" /><rect x="208" y="216" width="8" height="10" fill="#6B5A45" />
    <rect x="250" y="178" width="100" height="8" rx="2" fill={WOOD} /><rect x="256" y="186" width="5" height="50" fill={WOOD} /><rect x="339" y="186" width="5" height="50" fill={WOOD} />
    <rect x="280" y="150" width="40" height="28" rx="3" fill="#2B3A36" /><rect x="285" y="155" width="30" height="18" fill={pal.glass} opacity=".5" /><rect x="272" y="176" width="56" height="4" rx="2" fill="#9AA5A0" />
    <rect x="286" y="212" width="32" height="8" rx="3" fill={pal.alt} /><rect x="316" y="186" width="7" height="34" rx="3" fill={pal.alt} /><rect x="300" y="220" width="4" height="22" fill="#6B5A45" />
  </g>
);
const Couple = ({ pal }) => (
  <g>
    <Win x={84} y={42} w={66} h={80} pal={pal} />
    <Frame x={250} y={62} w={44} h={56} />
    <ellipse cx="200" cy="254" rx="120" ry="14" fill={pal.alt} opacity=".2" />
    <rect x="104" y="138" width="192" height="64" rx="10" fill={pal.alt} />
    <rect x="96" y="186" width="208" height="36" rx="10" fill="#fff" /><rect x="96" y="198" width="208" height="34" rx="10" fill={pal.main} /><rect x="96" y="198" width="208" height="8" fill="#fff" opacity=".25" />
    <rect x="120" y="168" width="60" height="22" rx="10" fill="#fff" stroke="#E4DDCC" strokeWidth="2" /><rect x="220" y="168" width="60" height="22" rx="10" fill="#fff" stroke="#E4DDCC" strokeWidth="2" />
    {[60, 308].map((x) => (
      <g key={x}>
        <rect x={x} y="198" width="32" height="38" rx="4" fill={WOOD} />
        <rect x={x + 10} y="188" width="12" height="10" fill="#8A7A62" /><path d={`M${x + 4} 172h24l-6 16H${x + 10}z`} fill="#F2D9A0" />
      </g>
    ))}
  </g>
);

const Bedroom = ({ pal }) => (
  <g>
    <Win x={104} y={44} w={86} h={66} pal={pal} />
    <rect x="94" y="40" width="10" height="92" rx="4" fill={pal.alt} opacity=".85" /><rect x="190" y="40" width="10" height="92" rx="4" fill={pal.alt} opacity=".85" />
    <ellipse cx="150" cy="254" rx="110" ry="14" fill={pal.alt} opacity=".2" />
    <rect x="60" y="118" width="176" height="62" rx="8" fill={WOOD} />
    <rect x="54" y="172" width="188" height="48" rx="8" fill="#fff" /><rect x="54" y="190" width="188" height="34" rx="8" fill={pal.main} /><rect x="54" y="190" width="188" height="7" fill="#fff" opacity=".25" />
    <rect x="72" y="156" width="62" height="22" rx="10" fill="#fff" stroke="#E4DDCC" strokeWidth="2" /><rect x="152" y="156" width="62" height="22" rx="10" fill="#fff" stroke="#E4DDCC" strokeWidth="2" />
    <rect x="262" y="62" width="100" height="156" rx="4" fill={WOOD} /><rect x="258" y="56" width="108" height="9" rx="3" fill="#9C7A55" />
    <path d="M312 66V218" stroke="#8A6A47" strokeWidth="3" /><circle cx="304" cy="140" r="3.5" fill="#F2D9A0" /><circle cx="320" cy="140" r="3.5" fill="#F2D9A0" />
    <rect x="46" y="204" width="12" height="22" fill="#6B5A45" /><rect x="238" y="204" width="12" height="22" fill="#6B5A45" />
  </g>
);
const Kitchen = ({ pal }) => (
  <g>
    <rect x="0" y="96" width="400" height="109" fill="#fff" opacity=".38" />
    {Array.from({ length: 16 }).map((_, i) => <path key={i} d={`M${i * 26} 96V205`} stroke="#fff" strokeWidth="1.5" opacity=".7" />)}
    <Win x={34} y={46} w={84} h={58} pal={pal} />
    <rect x="130" y="36" width="36" height="64" rx="3" fill="#F4EFE4" stroke="#D9CFBB" strokeWidth="2" />
    <rect x="236" y="36" width="66" height="64" rx="3" fill="#F4EFE4" stroke="#D9CFBB" strokeWidth="2" /><path d="M269 36V100" stroke="#D9CFBB" strokeWidth="2" />
    <path d="M170 100h60l-14-34h-32z" fill="#C9D2CF" /><rect x="192" y="18" width="16" height="48" fill="#C9D2CF" />
    <rect x="18" y="166" width="294" height="12" rx="3" fill="#6F6A62" />
    <rect x="22" y="178" width="286" height="56" fill={pal.main} />
    {[102, 196].map((x) => <path key={x} d={`M${x} 180V234`} stroke="#fff" strokeWidth="2" opacity=".5" />)}
    {[88, 116, 182, 210, 270].map((x) => <rect key={x} x={x} y="196" width="10" height="4" rx="2" fill="#F4EFE4" />)}
    <rect x="48" y="158" width="58" height="8" rx="2" fill="#C9D2CF" /><path d="M96 158v-14h12" stroke="#8A9490" strokeWidth="4" fill="none" strokeLinecap="round" />
    <rect x="170" y="158" width="62" height="8" rx="2" fill="#2B3A36" /><ellipse cx="188" cy="161" rx="8" ry="2" fill="none" stroke="#8A9490" /><ellipse cx="214" cy="161" rx="8" ry="2" fill="none" stroke="#8A9490" />
    <rect x="176" y="140" width="26" height="18" rx="3" fill={pal.alt} /><rect x="172" y="140" width="34" height="4" rx="2" fill="#B9724F" opacity=".6" />
    <rect x="320" y="70" width="56" height="164" rx="6" fill="#E6ECE9" stroke="#C9D2CF" strokeWidth="2" /><path d="M320 126h56" stroke="#C9D2CF" strokeWidth="2" /><rect x="326" y="90" width="4" height="26" rx="2" fill="#9AA5A0" /><rect x="326" y="140" width="4" height="40" rx="2" fill="#9AA5A0" />
    <ellipse cx="260" cy="162" rx="14" ry="4" fill={pal.alt} opacity=".5" /><circle cx="254" cy="156" r="6" fill="#D9A47C" /><circle cx="266" cy="157" r="6" fill="#C98B62" />
  </g>
);
const Balcony = ({ pal }) => (
  <g>
    <rect y="-300" width="400" height="500" fill={pal.glass} opacity=".7" />
    <circle cx="318" cy="64" r="26" fill="#F7E3A3" /><ellipse cx="90" cy="60" rx="38" ry="10" fill="#fff" opacity=".7" /><ellipse cx="116" cy="52" rx="26" ry="9" fill="#fff" opacity=".7" />
    {[[8, 118, 30], [44, 96, 26], [76, 130, 34], [118, 88, 28], [152, 122, 40], [200, 102, 30], [238, 128, 34], [282, 92, 28], [318, 120, 36], [360, 106, 34]].map(([x, y, w]) => <rect key={x} x={x} y={y} width={w} height={200 - y} fill="#B9CCC8" opacity=".75" />)}
    <rect y="200" width="400" height="100" fill="#CDBFA6" />{[0, 1, 2, 3, 4, 5, 6, 7].map((i) => <path key={i} d={`M${i * 56} 205V300`} stroke="#fff" opacity=".35" />)}
    <rect y="166" width="400" height="7" fill="#3C4A45" />
    {Array.from({ length: 21 }).map((_, i) => <rect key={i} x={i * 20 - 1} y="173" width="3" height="40" fill="#3C4A45" />)}
    <rect y="210" width="400" height="6" fill="#3C4A45" />
    <rect x="0" y="-300" width="16" height="520" fill="#F8F5EE" /><rect x="384" y="-300" width="16" height="520" fill="#F8F5EE" />
    <Plant x={34} y={214} pal={pal} /><Plant x={338} y={214} pal={pal} />
    <ellipse cx="200" cy="232" rx="36" ry="8" fill={WOOD} /><rect x="198" y="232" width="4" height="22" fill="#6B5A45" />
    {[138, 224].map((x) => <g key={x}><rect x={x} y="240" width="38" height="7" rx="3" fill={pal.alt} /><rect x={x < 200 ? x : x + 32} y="214" width="6" height="32" rx="3" fill={pal.alt} /></g>)}
  </g>
);
const Building = ({ pal }) => (
  <g>
    <rect y="-300" width="400" height="540" fill={pal.w1} />
    <ellipse cx="80" cy="56" rx="44" ry="11" fill="#fff" opacity=".8" /><ellipse cx="108" cy="46" rx="28" ry="9" fill="#fff" opacity=".8" /><ellipse cx="330" cy="40" rx="36" ry="9" fill="#fff" opacity=".8" />
    <rect x="30" y="84" width="84" height="160" fill={pal.glass} />{[0, 1, 2, 3].map((r) => [0, 1].map((c) => <rect key={r + '-' + c} x={44 + c * 34} y={98 + r * 36} width="20" height="22" fill="#fff" opacity=".6" />))}
    <rect x="312" y="116" width="70" height="128" fill={pal.glass} />{[0, 1, 2].map((r) => [0, 1].map((c) => <rect key={r + '-' + c} x={324 + c * 28} y={128 + r * 36} width="16" height="20" fill="#fff" opacity=".6" />))}
    <rect x="128" y="34" width="176" height="212" fill="#EFE7D8" /><rect x="122" y="26" width="188" height="11" fill={pal.alt} />
    {[0, 1, 2, 3, 4].map((r) => [0, 1, 2, 3].map((c) => (
      <g key={r + '-' + c}><rect x={144 + c * 38} y={50 + r * 32} width="24" height="20" fill={pal.glass} /><rect x={141 + c * 38} y={70 + r * 32} width="30" height="4" fill={(r + c) % 2 ? pal.alt : '#fff'} /></g>
    )))}
    <rect x="190" y="196" width="52" height="50" fill={pal.alt} /><rect x="198" y="204" width="16" height="42" fill={pal.glass} opacity=".8" /><rect x="218" y="204" width="16" height="42" fill={pal.glass} opacity=".8" /><rect x="182" y="188" width="68" height="9" rx="2" fill="#3C4A45" />
    <rect y="244" width="400" height="56" fill="#BBD0B2" /><rect y="268" width="400" height="22" fill="#9AA5A0" />{[0, 1, 2, 3, 4, 5].map((i) => <rect key={i} x={20 + i * 66} y="278" width="30" height="3" fill="#fff" opacity=".7" />)}
    {[60, 350].map((x) => <g key={x}><rect x={x - 3} y="222" width="6" height="26" fill="#6B5A45" /><circle cx={x} cy="208" r="26" fill="#6F9577" /><circle cx={x - 14} cy="218" r="16" fill="#5E8466" /></g>)}
  </g>
);
Balcony.raw = true; Building.raw = true;
const SCENES = { family: Family, bachelor: Bachelor, couple: Couple, bedroom: Bedroom, kitchen: Kitchen, balcony: Balcony, building: Building };


// 400 x 300 drawing space: wall above y=205, floor below. Key furniture stays within x 90..310 so it survives cropping.
export function Interior({ variant = 'family', pal }) {
  const id = useId().replace(/:/g, '');
  const Piece = SCENES[variant] || Family;
  return (
    <g>
      <defs><linearGradient id={id} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor={pal.w1} /><stop offset="1" stopColor={pal.w2} /></linearGradient></defs>
      {!Piece.raw && (<>
        <rect y="-300" width="400" height="600" fill={`url(#${id})`} />
        <rect y="205" width="400" height="95" fill={pal.floor} />
        <rect y="205" width="400" height="5" fill="#000" opacity=".06" />
      </>)}
      <Piece pal={pal} />
    </g>
  );
}

export default function Scene({ variant, palette, className = '', label }) {
  return (
    <svg viewBox="0 -80 400 340" preserveAspectRatio="xMidYMax slice" className={className} role="img" aria-label={label ? `Illustration of ${label}` : 'Illustration of a room'}>
      <Interior variant={variant} pal={palette} />
    </svg>
  );
}
