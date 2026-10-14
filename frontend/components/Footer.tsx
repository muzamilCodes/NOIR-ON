import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div className="about">
            <div className="brand">
              <span className="brand-mark"><span>N</span></span>
              NOIRÉON
            </div>
            <p>Independent haute horlogerie rendered in three dimensions. Every timepiece, engineered to be admired.</p>
          </div>
          <div>
            <h4>Collection</h4>
            <ul>
              <li><Link href="/collection">All Watches</Link></li>
              <li><Link href="/collection">Skeleton</Link></li>
              <li><Link href="/collection">Haute Horlogerie</Link></li>
            </ul>
          </div>
          <div>
            <h4>Maison</h4>
            <ul>
              <li><Link href="/about">Our Story</Link></li>
              <li><Link href="/contact">Contact</Link></li>
            </ul>
          </div>
          <div>
            <h4>Account</h4>
            <ul>
              <li><Link href="/login">Sign In</Link></li>
              <li><Link href="/register">Register</Link></li>
              <li><Link href="/cart">Cart</Link></li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">© 2026 NOIRÉON. Crafted for demonstration. All rights reserved.</div>
      </div>
    </footer>
  );
}
