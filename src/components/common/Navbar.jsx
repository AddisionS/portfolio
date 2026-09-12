import { Link } from "react-router-dom";
import "../styles/Navbar.css";
import gsap from "gsap";
import { TextPlugin } from "gsap/TextPlugin";
import { useRef, useState } from "react";

gsap.registerPlugin(TextPlugin);

function GSAPTextLink({ to, baseText, hoverText, onClick }) {
  const textRef = useRef();
  const linkRef = useRef();
  const textTween = useRef(); 

  const handleMouseEnter = () => {
    if (textTween.current) textTween.current.kill();

    textTween.current = gsap.to(textRef.current, {
      duration: 0.6,
      text: hoverText,
      ease: "power2.out",
      overwrite: "auto",
    });

    gsap.to(linkRef.current, {
      "--slash-left": "0%",
      duration: 0.3,
      ease: "power1.out",
      overwrite: "auto",
    });
  };

  const handleMouseLeave = () => {
    if (textTween.current) textTween.current.kill();

    textTween.current = gsap.to(textRef.current, {
      duration: 0.8,
      text: baseText,
      ease: "power2.out",
      overwrite: "auto",
    });

    gsap.to(linkRef.current, {
      "--slash-left": "-100%",
      duration: 0.3,
      ease: "power1.in",
      overwrite: "auto",
    });
  };

  return (
    <Link
      to={to}
      ref={linkRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      className="nav-link"
    >
      <span ref={textRef}>{baseText}</span>
    </Link>
  );
}

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const closeMenu = () => setOpen(false);

  return (
    <nav className="navbar">
      <button
        className={`nav-toggle${open ? " is-open" : ""}`}
        onClick={() => setOpen((o) => !o)}
        aria-label="Toggle navigation menu"
        aria-expanded={open}
      >
        <span />
        <span />
        <span />
      </button>

      <div className={`nav-links${open ? " open" : ""}`}>
        <GSAPTextLink to="/" baseText="About Me" hoverText="Real Slim Shady" onClick={closeMenu} />
        <GSAPTextLink to="/skills" baseText="Skills" hoverText="All The Stars" onClick={closeMenu} />
        <GSAPTextLink to="/projects" baseText="Projects" hoverText="Legacy" onClick={closeMenu} />
        <GSAPTextLink to="/contact" baseText="Contact" hoverText="The Ringer" onClick={closeMenu} />
      </div>
    </nav>
  );
}