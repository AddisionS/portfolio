import { Link } from "react-router-dom";
import "../styles/Navbar.css";
import gsap from "gsap";
import { TextPlugin } from "gsap/TextPlugin";
import { useRef } from "react";

gsap.registerPlugin(TextPlugin);

function GSAPTextLink({ to, baseText, hoverText }) {
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
      className="nav-link"
    >
      <span ref={textRef}>{baseText}</span>
    </Link>
  );
}

export default function Navbar() {
  return (
    <nav className="navbar">
      <GSAPTextLink to="/" baseText="About Me" hoverText="Real Slim Shady" />
      <GSAPTextLink to="/skills" baseText="Skills" hoverText="All The Stars" />
      <GSAPTextLink to="/projects" baseText="Projects" hoverText="Legacy" />
      <GSAPTextLink to="/contact" baseText="Contact" hoverText="The Ringer" />
    </nav>
  );
}
