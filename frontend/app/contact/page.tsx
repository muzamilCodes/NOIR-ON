'use client';

import Reveal from '@/components/Reveal';
import { toast } from '@/lib/toast';

export default function ContactPage() {
  return (
    <section className="section">
      <div className="container" style={{ maxWidth: 620 }}>
        <Reveal className="section-head">
          <div className="divider" />
          <h2>Arrange a Private Viewing</h2>
          <p>Our salon receives a limited number of guests each week. Leave your details and we will be in touch.</p>
        </Reveal>
        <Reveal className="auth-card" >
          <form onSubmit={(e) => { e.preventDefault(); toast('Thank you — a client advisor will contact you shortly.'); (e.target as HTMLFormElement).reset(); }}>
            <div className="field"><label>Full name</label><input required name="name" placeholder="Your name" /></div>
            <div className="field"><label>Email</label><input required type="email" name="email" placeholder="you@email.com" /></div>
            <div className="field"><label>Message</label><textarea name="message" rows={4} placeholder="Which reference interests you?" /></div>
            <button className="btn btn-gold btn-block" type="submit">Send request</button>
          </form>
        </Reveal>
      </div>
    </section>
  );
}
