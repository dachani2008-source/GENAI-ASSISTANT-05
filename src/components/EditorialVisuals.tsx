import React from 'react';

interface EditorialVisualProps {
  preset: string;
  className?: string;
  aspectRatio?: '4:3' | '16:9' | '3:4' | '1:1';
  caption?: string;
  showIllustrativeLabel?: boolean;
}

/**
 * High-contrast architectural & editorial visual compositions.
 * Ensures 100% hermetic reliability with zero broken external image links
 * and distinct compositions per section and studio.
 */
export const EditorialVisual: React.FC<EditorialVisualProps> = ({
  preset,
  className = '',
  aspectRatio = '4:3',
  caption,
  showIllustrativeLabel = false,
}) => {
  const aspectClass =
    aspectRatio === '16:9'
      ? 'aspect-video'
      : aspectRatio === '3:4'
      ? 'aspect-[3/4]'
      : aspectRatio === '1:1'
      ? 'aspect-square'
      : 'aspect-[4/3]';

  const renderArtwork = () => {
    switch (preset) {
      case 'wedding-courtyard':
        return (
          <svg viewBox="0 0 800 600" className="w-full h-full object-cover" role="img" aria-label="Evening architectural courtyard wedding reception with candlelight and burgundy botanicals">
            <defs>
              <linearGradient id="wedSky" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#12221F" />
                <stop offset="55%" stopColor="#182C28" />
                <stop offset="100%" stopColor="#261C1D" />
              </linearGradient>
              <radialGradient id="candleGlow" cx="50%" cy="62%" r="45%">
                <stop offset="0%" stopColor="#C59A52" stopOpacity="0.55" />
                <stop offset="50%" stopColor="#A34E50" stopOpacity="0.22" />
                <stop offset="100%" stopColor="#182C28" stopOpacity="0" />
              </radialGradient>
              <linearGradient id="linenTable" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#F5F0E8" />
                <stop offset="100%" stopColor="#D8C9B8" />
              </linearGradient>
            </defs>
            <rect width="800" height="600" fill="url(#wedSky)" />
            {/* Cypress & Classical Arch Backdrop */}
            <path d="M90 600 L90 120 Q90 60 130 60 L670 60 Q710 60 710 120 L710 600 Z" fill="none" stroke="#315B50" strokeWidth="1.5" opacity="0.45" />
            <path d="M180 420 L180 180 A220 200 0 0 1 620 180 L620 420 Z" fill="#1E3530" stroke="#C59A52" strokeWidth="1" strokeOpacity="0.4" />
            {/* String lights / twilight stars */}
            <circle cx="260" cy="140" r="3" fill="#F5F0E8" opacity="0.8" />
            <circle cx="340" cy="165" r="2.5" fill="#C59A52" opacity="0.9" />
            <circle cx="420" cy="155" r="3.5" fill="#F5F0E8" opacity="0.85" />
            <circle cx="510" cy="135" r="2.5" fill="#C59A52" opacity="0.8" />
            <path d="M200 120 Q360 190 600 115" fill="none" stroke="#C59A52" strokeWidth="0.75" opacity="0.45" />
            {/* Ambient Candlelight Glow */}
            <rect width="800" height="600" fill="url(#candleGlow)" />
            {/* Long Banquet Table in Perspective */}
            <polygon points="140,600 660,600 540,370 260,370" fill="url(#linenTable)" />
            <polygon points="245,600 555,600 490,370 310,370" fill="#EAE0D3" />
            <line x1="400" y1="370" x2="400" y2="600" stroke="#A34E50" strokeWidth="2" opacity="0.35" />
            {/* Floral Centerpieces (Burgundy & Evergreen) */}
            <ellipse cx="400" cy="430" rx="52" ry="18" fill="#182C28" />
            <circle cx="382" cy="426" r="11" fill="#A34E50" />
            <circle cx="412" cy="432" r="13" fill="#84383A" />
            <circle cx="400" cy="420" r="9" fill="#C59A52" />
            <ellipse cx="400" cy="515" rx="74" ry="24" fill="#182C28" />
            <circle cx="370" cy="512" r="15" fill="#A34E50" />
            <circle cx="405" cy="518" r="17" fill="#7D3234" />
            <circle cx="430" cy="508" r="13" fill="#C59A52" />
            {/* Tall Brass Taper Candles */}
            {[330, 470, 295, 505].map((x, idx) => {
              const yBase = idx < 2 ? 415 : 495;
              return (
                <g key={x}>
                  <line x1={x} y1={yBase} x2={x} y2={yBase - 58} stroke="#F5F0E8" strokeWidth="3" />
                  <rect x={x - 5} y={yBase} width="10" height="12" fill="#C59A52" />
                  <ellipse cx={x} cy={yBase - 64} rx="4" ry="8" fill="#F5D08A" />
                  <circle cx={x} cy={yBase - 64} r="14" fill="#C59A52" opacity="0.3" />
                </g>
              );
            })}
            {/* Place Settings */}
            {[230, 570].map((x) => (
              <ellipse key={x} cx={x} cy="535" rx="28" ry="11" fill="#FFFFFF" stroke="#C59A52" strokeWidth="1.5" />
            ))}
          </svg>
        );

      case 'birthday-loft':
        return (
          <svg viewBox="0 0 800 600" className="w-full h-full object-cover" role="img" aria-label="Sunlit architectural loft milestone birthday celebration with sculptural cake and coral botanicals">
            <defs>
              <linearGradient id="loftWall" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#F5F0E8" />
                <stop offset="55%" stopColor="#E9DEC9" />
                <stop offset="100%" stopColor="#D8C9B8" />
              </linearGradient>
              <linearGradient id="coralSun" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#D77C50" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#C59A52" stopOpacity="0.05" />
              </linearGradient>
            </defs>
            <rect width="800" height="600" fill="url(#loftWall)" />
            {/* Architectural Sunbeam Window Shadow Play */}
            <polygon points="0,80 520,0 760,600 180,600" fill="url(#coralSun)" />
            {/* Industrial Crittall Window Grid */}
            <g stroke="#292A27" strokeOpacity="0.12" strokeWidth="2">
              <line x1="120" y1="0" x2="120" y2="390" />
              <line x1="280" y1="0" x2="280" y2="390" />
              <line x1="440" y1="0" x2="440" y2="390" />
              <line x1="60" y1="160" x2="500" y2="160" />
              <line x1="60" y1="300" x2="500" y2="300" />
            </g>
            {/* Travertine Plinth & Table */}
            <rect x="80" y="430" width="640" height="170" fill="#D8C9B8" />
            <rect x="80" y="420" width="640" height="18" fill="#EAE0D3" />
            {/* Sculptural Tiered Cake on Ceramic Pedestal */}
            <path d="M330 420 L470 420 L435 385 L365 385 Z" fill="#292A27" />
            <rect x="342" y="310" width="116" height="75" rx="6" fill="#FAF6F0" stroke="#D8C9B8" strokeWidth="1.5" />
            <rect x="362" y="250" width="76" height="60" rx="5" fill="#FFFFFF" stroke="#D8C9B8" strokeWidth="1.5" />
            {/* Coral & Marigold Floral Cascade on Cake */}
            <circle cx="368" cy="308" r="14" fill="#D77C50" />
            <circle cx="388" cy="316" r="11" fill="#C59A52" />
            <circle cx="424" cy="252" r="12" fill="#D77C50" />
            <circle cx="412" cy="378" r="15" fill="#A34E50" />
            {/* Tall Minimalist Taper Candles */}
            <line x1="386" y1="250" x2="386" y2="205" stroke="#D77C50" strokeWidth="3" />
            <line x1="410" y1="250" x2="410" y2="195" stroke="#C59A52" strokeWidth="3" />
            <circle cx="386" cy="199" r="5" fill="#F5B041" />
            <circle cx="410" cy="189" r="5" fill="#F5B041" />
            {/* Ikebana Vase Left */}
            <path d="M180 420 Q165 340 195 310 L225 310 Q255 340 240 420 Z" fill="#A34E50" />
            <path d="M210 310 Q170 210 135 175" fill="none" stroke="#182C28" strokeWidth="3" />
            <circle cx="155" cy="195" r="18" fill="#D77C50" />
            <circle cx="235" cy="240" r="22" fill="#C59A52" />
            {/* Coupe Glasses Right */}
            <g transform="translate(555, 355)">
              <path d="M0 0 L50 0 Q45 25 25 25 Q5 25 0 0 Z" fill="#D77C50" fillOpacity="0.55" stroke="#292A27" strokeWidth="1.5" />
              <line x1="25" y1="25" x2="25" y2="65" stroke="#292A27" strokeWidth="1.5" />
              <line x1="10" y1="65" x2="40" y2="65" stroke="#292A27" strokeWidth="2" />
            </g>
          </svg>
        );

      case 'community-pavilion':
        return (
          <svg viewBox="0 0 800 600" className="w-full h-full object-cover" role="img" aria-label="Modern timber and glass community pavilion with teal acoustic banners and stage lighting">
            <defs>
              <linearGradient id="commBg" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#182C28" />
                <stop offset="60%" stopColor="#24443E" />
                <stop offset="100%" stopColor="#1B2624" />
              </linearGradient>
            </defs>
            <rect width="800" height="600" fill="url(#commBg)" />
            {/* Architectural Timber Roof Beams */}
            {[80, 180, 280, 380, 480, 580, 680].map((x) => (
              <line key={x} x1={x} y1="0" x2={400 + (x - 400) * 1.35} y2="190" stroke="#C59A52" strokeWidth="4" opacity="0.5" />
            ))}
            {/* Teal Wayfinding & Acoustic Banners */}
            <rect x="130" y="90" width="58" height="220" rx="2" fill="#397D85" />
            <rect x="612" y="90" width="58" height="220" rx="2" fill="#397D85" />
            <line x1="145" y1="130" x2="173" y2="130" stroke="#F5F0E8" strokeWidth="2" />
            <line x1="627" y1="130" x2="655" y2="130" stroke="#F5F0E8" strokeWidth="2" />
            {/* Main Stage Deck */}
            <polygon points="160,410 640,410 700,470 100,470" fill="#C59A52" fillOpacity="0.85" />
            <rect x="220" y="195" width="360" height="195" rx="4" fill="#F5F0E8" />
            {/* Stage Screen Presentation Graphic */}
            <rect x="245" y="218" width="140" height="145" fill="#182C28" />
            <circle cx="315" cy="290" r="38" fill="#397D85" />
            <line x1="410" y1="245" x2="540" y2="245" stroke="#182C28" strokeWidth="6" />
            <line x1="410" y1="275" x2="515" y2="275" stroke="#397D85" strokeWidth="4" />
            <line x1="410" y1="305" x2="530" y2="305" stroke="#D8C9B8" strokeWidth="4" />
            {/* Structured Seating Rows */}
            {[500, 540, 580].map((y, rowIdx) => (
              <g key={y}>
                {[-220, -140, -60, 60, 140, 220].map((offset) => (
                  <rect
                    key={offset}
                    x={400 + offset * (1 + rowIdx * 0.12) - 24}
                    y={y}
                    width="48"
                    height="18"
                    rx="3"
                    fill="#D8C9B8"
                    opacity={0.75 - rowIdx * 0.12}
                  />
                ))}
              </g>
            ))}
          </svg>
        );

      case 'floral-tablescape':
        return (
          <svg viewBox="0 0 800 600" className="w-full h-full object-cover" role="img" aria-label="Bespoke tablescape with Ikebana burgundy florals and cotton paper menu">
            <rect width="800" height="600" fill="#EAE2D6" />
            <circle cx="620" cy="140" r="260" fill="#F5F0E8" opacity="0.7" />
            {/* Linen Runner */}
            <polygon points="0,240 800,140 800,480 0,580" fill="#F5F0E8" />
            {/* Ceramic Charger Plate & Cotton Menu Card */}
            <circle cx="480" cy="360" r="145" fill="#D8C9B8" />
            <circle cx="480" cy="360" r="115" fill="#FAF7F2" stroke="#C59A52" strokeWidth="1.5" />
            <rect x="425" y="275" width="110" height="170" fill="#FFFFFF" stroke="#D8C9B8" />
            <line x1="450" y1="315" x2="510" y2="315" stroke="#182C28" strokeWidth="2" />
            <line x1="445" y1="345" x2="515" y2="345" stroke="#A34E50" strokeWidth="1.5" />
            <line x1="455" y1="368" x2="505" y2="368" stroke="#D8C9B8" strokeWidth="1.5" />
            <line x1="455" y1="390" x2="505" y2="390" stroke="#D8C9B8" strokeWidth="1.5" />
            {/* Ikebana Floral Bowl Left */}
            <ellipse cx="230" cy="270" rx="85" ry="52" fill="#292A27" />
            <circle cx="205" cy="235" r="34" fill="#A34E50" />
            <circle cx="255" cy="245" r="28" fill="#7D3234" />
            <circle cx="230" cy="205" r="22" fill="#C59A52" />
            <path d="M210 230 Q140 130 95 95" fill="none" stroke="#182C28" strokeWidth="3.5" />
            <path d="M245 225 Q310 120 355 85" fill="none" stroke="#315B50" strokeWidth="3" />
          </svg>
        );

      case 'culinary-tasting':
        return (
          <svg viewBox="0 0 800 600" className="w-full h-full object-cover" role="img" aria-label="Artisanal culinary grazing platter and botanical coupe cocktails">
            <rect width="800" height="600" fill="#292A27" />
            <polygon points="0,0 540,0 320,600 0,600" fill="#333531" />
            {/* Stone Serving Platter */}
            <ellipse cx="360" cy="370" rx="220" ry="130" fill="#F5F0E8" />
            <ellipse cx="360" cy="370" rx="190" ry="105" fill="#EAE0D3" />
            {/* Plated Artisanal Elements */}
            <circle cx="290" cy="350" r="38" fill="#A34E50" />
            <circle cx="355" cy="385" r="44" fill="#C59A52" />
            <circle cx="430" cy="345" r="32" fill="#315B50" />
            <circle cx="395" cy="325" r="18" fill="#D77C50" />
            {/* Botanical Cocktail Glass */}
            <circle cx="590" cy="210" r="68" fill="#D77C50" fillOpacity="0.8" stroke="#F5F0E8" strokeWidth="3" />
            <path d="M565 190 Q600 165 625 220" fill="none" stroke="#182C28" strokeWidth="4" />
          </svg>
        );

      case 'invitation-suite':
        return (
          <svg viewBox="0 0 800 600" className="w-full h-full object-cover" role="img" aria-label="Letterpress archival cotton invitation suite with wax seal">
            <rect width="800" height="600" fill="#D8C9B8" />
            <rect x="150" y="95" width="320" height="420" fill="#182C28" transform="rotate(-6 310 305)" />
            <rect x="270" y="110" width="310" height="410" fill="#F5F0E8" stroke="#C59A52" strokeWidth="1.5" transform="rotate(3 425 315)" />
            <circle cx="425" cy="365" r="28" fill="#A34E50" />
            <circle cx="425" cy="365" r="20" fill="none" stroke="#C59A52" strokeWidth="1" />
            <line x1="345" y1="210" x2="505" y2="215" stroke="#182C28" strokeWidth="3" />
            <line x1="365" y1="250" x2="485" y2="255" stroke="#292A27" strokeWidth="1.5" />
            <line x1="380" y1="280" x2="470" y2="284" stroke="#C59A52" strokeWidth="1.5" />
          </svg>
        );

      default:
        return (
          <svg viewBox="0 0 800 600" className="w-full h-full object-cover" role="img" aria-label="Architectural lighting and stage composition">
            <rect width="800" height="600" fill="#182C28" />
            <circle cx="400" cy="300" r="210" fill="#315B50" opacity="0.55" />
            <circle cx="400" cy="300" r="130" fill="#C59A52" opacity="0.35" />
            <rect x="220" y="380" width="360" height="120" fill="#F5F0E8" opacity="0.9" />
          </svg>
        );
    }
  };

  return (
    <div className={`relative overflow-hidden bg-[#182C28] ${aspectClass} ${className}`}>
      {renderArtwork()}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />
      {(caption || showIllustrativeLabel) && (
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs text-[#F5F0E8]/90">
          {caption ? <span className="font-medium truncate">{caption}</span> : <span />}
          {showIllustrativeLabel && (
            <span className="text-[11px] tracking-wide text-[#D8C9B8] shrink-0 ml-2">
              Illustrative Concept
            </span>
          )}
        </div>
      )}
    </div>
  );
};
