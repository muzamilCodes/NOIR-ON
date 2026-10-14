import Link from 'next/link';
import Reveal from '@/components/Reveal';

export default function AboutPage() {
  return (
    <>
      <section className="section">
        <div className="container">
          <Reveal className="section-head">
            <div className="divider" />
            <h2>The Maison</h2>
            <p>Independent, relentless, and allergic to shortcuts.</p>
          </Reveal>
          <div className="prose">
            <p>Founded in 1974 by a single watchmaker with a loupe and a conviction, NOIRÉON has never
              chased volume. We chase the perfect escapement. Every movement is designed, finished and
              assembled in-house — from the first ruby jewel to the final regulation.</p>
            <p>Our skeleton tourbillons are among the most complicated objects assembled by hand. A single
              master watchmaker owns a piece from the first bridge to the last, signing the movement when
              it leaves the atelier.</p>
          </div>
          <div className="feature-grid">
            <Reveal><div className="feature"><div className="icon">🜂</div><h3>Grand Feu Enamel</h3><p>Dials fired seven times for impossible depth.</p></div></Reveal>
            <Reveal><div className="feature"><div className="icon">⚙</div><h3>In-House Calibers</h3><p>Movements designed and finished entirely by hand.</p></div></Reveal>
            <Reveal><div className="feature"><div className="icon">◈</div><h3>Precious Metals</h3><p>18k gold, grade-5 titanium, and living bronze.</p></div></Reveal>
          </div>
          <div style={{ textAlign: 'center', marginTop: 40 }}>
            <Link href="/collection" className="btn btn-gold">Explore the Collection</Link>
          </div>
        </div>
      </section>
    </>
  );
}
