'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import Watch3D from '@/components/Watch3D';
import Reveal from '@/components/Reveal';
import ProductCard from '@/components/ProductCard';
import * as api from '@/lib/api';
import { toast } from '@/lib/toast';
import type { Product } from '@/lib/types';

export default function HomePage() {
  const [featured, setFeatured] = useState<Product[]>([]);

  useEffect(() => {
    api.getProducts().then((p) => setFeatured(p.slice(0, 4))).catch(() => setFeatured([]));
  }, []);

  return (
    <>
      <header className="hero-full container">
        <div className="hero-copy">
          <span className="eyebrow">Maison NOIRÉON · Est. 1974</span>
          <h1>Time, rendered in <span className="gold">three dimensions</span>.</h1>
          <p className="lead">
            Every timepiece in our collection is engineered to be admired from every angle.
            Rotate, float, and fall in love with haute horlogerie — live in your browser.
          </p>
          <div className="hero-cta">
            <Link href="/collection" className="btn btn-gold">Explore the Collection →</Link>
            <Link href="/about" className="btn btn-ghost">Our Craft →</Link>
          </div>
          <div className="hero-stats">
            <div className="stat"><b>8</b><span>Signature Models</span></div>
            <div className="stat"><b>50+</b><span>Years of Craft</span></div>
            <div className="stat"><b>100h</b><span>Power Reserve</span></div>
          </div>
        </div>

        <div className="hero-canvas-wrap">
          <Watch3D variant="hero" caseColor={0xc9a06a} strapColor={0x0e0e10} brandText="NOIRÉON" />
          <div className="hero-glass chip-1">
            <span className="g-icon">🜲</span>
            <div><b>18k Rose Gold</b><span>Hand-polished case</span></div>
          </div>
          <div className="hero-glass chip-2">
            <span className="g-icon">⚙</span>
            <div><b>In-House Caliber</b><span>Assembled by one master</span></div>
          </div>
          <div className="hero-glass chip-3">
            <span className="g-icon">✦</span>
            <div><b>Limited Edition</b><span>25 pieces per year</span></div>
          </div>
        </div>

        <div className="scroll-cue"><div className="mouse" />Scroll</div>
      </header>

      <div className="marquee">
        <div className="marquee-track">
          <span>Haute Horlogerie <i className="dot">◆</i> Since 1974 <i className="dot">◆</i> Grand Feu Enamel <i className="dot">◆</i> In-House Calibers <i className="dot">◆</i> Limited Editions <i className="dot">◆</i> Lifetime Service <i className="dot">◆</i></span>
          <span>Haute Horlogerie <i className="dot">◆</i> Since 1974 <i className="dot">◆</i> Grand Feu Enamel <i className="dot">◆</i> In-House Calibers <i className="dot">◆</i> Limited Editions <i className="dot">◆</i> Lifetime Service <i className="dot">◆</i></span>
        </div>
      </div>

      <section className="section">
        <div className="container">
          <Reveal className="section-head">
            <div className="divider" />
            <h2>The Art of Time</h2>
            <p>Exceptional timepieces. Uncompromising craftsmanship. Each model rendered live in 3D.</p>
          </Reveal>
          <div className="grid grid-4">
            {featured.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
          <div style={{ textAlign: 'center', marginTop: 44 }}>
            <Reveal><Link href="/collection" className="btn btn-ghost">View Full Collection</Link></Reveal>
          </div>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="stats-band">
            <Reveal><div className="stat"><b>900</b><span>Pieces per year</span></div></Reveal>
            <Reveal><div className="stat"><b>7</b><span>Enamel firings per dial</span></div></Reveal>
            <Reveal><div className="stat"><b>100h</b><span>Max power reserve</span></div></Reveal>
            <Reveal><div className="stat"><b>25</b><span>Pieces, finest references</span></div></Reveal>
          </div>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="split">
            <Reveal>
              <span className="eyebrow">Craftsmanship</span>
              <h2 style={{ fontSize: 'clamp(1.8rem,3.5vw,2.6rem)', margin: '18px 0' }}>Assembled by hand. Perfected over decades.</h2>
              <p style={{ color: 'var(--muted)', marginBottom: 18 }}>
                Each NOIRÉON movement is assembled by a single master watchmaker, from the first jewel
                to the final regulation. We produce fewer than 900 pieces a year — because patience cannot be automated.
              </p>
              <Link href="/about" className="btn btn-ghost">Read Our Story</Link>
            </Reveal>
            <Reveal>
              <div className="feature-grid" style={{ gridTemplateColumns: '1fr 1fr', marginTop: 0 }}>
                <div className="feature"><div className="icon">🜂</div><h3>Grand Feu Enamel</h3><p>Dials fired seven times for impossible depth.</p></div>
                <div className="feature"><div className="icon">⚙</div><h3>In-House Calibers</h3><p>Movements designed and finished entirely by hand.</p></div>
                <div className="feature"><div className="icon">◈</div><h3>Precious Metals</h3><p>18k gold, grade-5 titanium, and living bronze.</p></div>
                <div className="feature"><div className="icon">✦</div><h3>Limited Editions</h3><p>As few as 25 pieces of our finest references.</p></div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <Reveal className="section-head"><div className="divider" /><h2>Words From Our Collectors</h2></Reveal>
          <div className="grid grid-3">
            {[
              { q: 'The Midnight Tourbillon is the finest object I own. Watching the escapement rotate never gets old.', n: 'Alexandra Reyes', r: 'Collector, Geneva', i: 'AR', s: '★★★★★' },
              { q: 'My Solar Bronze has patinated with every expedition. It isn\'t a watch, it\'s a journal on my wrist.', n: 'Daniel Kim', r: 'Alpinist, Seoul', i: 'DK', s: '★★★★★' },
              { q: 'Service was effortless and the enamel dial is unmatched. NOIRÉON understands restraint.', n: 'Meera Osei', r: 'Architect, London', i: 'MO', s: '★★★★☆' },
            ].map((t) => (
              <Reveal key={t.i} className="t-card">
                <div className="quote">“</div>
                <p>{t.q}</p>
                <div className="who">
                  <div className="avatar">{t.i}</div>
                  <div><b>{t.n}</b><span>{t.r}</span><div className="stars">{t.s}</div></div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <Reveal className="newsletter">
            <h2>Join the Inner Circle</h2>
            <p>Be first to hear about new references, private viewings, and limited releases. No noise — only horology.</p>
            <form onSubmit={(e) => { e.preventDefault(); toast('Welcome to the inner circle. Watch your inbox.'); (e.target as HTMLFormElement).reset(); }}>
              <input type="email" placeholder="your@email.com" required />
              <button type="submit" className="btn btn-gold">Subscribe</button>
            </form>
          </Reveal>
        </div>
      </section>
    </>
  );
}
