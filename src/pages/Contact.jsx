import TransitionWrapper from "../components/common/TransitionWrapper";
import "../components/styles/Contact.css";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import SplitText from "gsap/SplitText";

// registerPlugin can throw if the installed gsap version predates the
// bonus plugins being bundled free. Guard it so a bad gsap version
// degrades to a plain fade instead of taking the whole page down.
let splitTextReady = true;
try {
  gsap.registerPlugin(SplitText);
} catch (err) {
  console.error("SplitText failed to register:", err);
  splitTextReady = false;
}

const TIMEZONE = "Asia/Kolkata";
const EMAIL = "sharma.aryan171205@gmail.com";

const RESUME_SUBJECT = "Resume Request";
const RESUME_BODY =
  "Hi Aryan,\n\nCould you send over your resume?\n\nName:\nReason for request:\n";
const resumeHref = `mailto:${EMAIL}?subject=${encodeURIComponent(
  RESUME_SUBJECT
)}&body=${encodeURIComponent(RESUME_BODY)}`;

const CONTACT_LINKS = [
  {
    key: "email",
    label: "EMAIL",
    value: EMAIL,
    href: `mailto:${EMAIL}`,
    icon: "email",
    shape: "jack",
    external: false,
  },
  {
    key: "github",
    label: "GITHUB",
    value: "github.com/AddisionS",
    href: "https://github.com/AddisionS",
    icon: "code",
    shape: "usb",
    external: true,
  },
  {
    key: "linkedin",
    label: "LINKEDIN",
    value: "linkedin.com/in/sharmaaryan1712",
    href: "https://www.linkedin.com/in/sharmaaryan1712/",
    icon: "network",
    shape: "eth",
    external: true,
  },
  {
    key: "resume",
    label: "RESUME",
    value: "ACCESS RESTRICTED",
    href: resumeHref,
    icon: "lock",
    shape: "locked",
    external: false,
    restricted: true,
  },
];

// Generic line-art icons matching the pegboard style from Skills -- not
// platform logos, just abstract shapes standing in for "mail", "code",
// and "network" so nothing here borrows a trademarked brand mark.

function EmailIcon() {
  return (
    <svg viewBox="0 0 64 64">
      <rect x="8" y="16" width="48" height="34" rx="3" />
      <polyline points="10,18 32,36 54,18" />
    </svg>
  );
}

function CodeIcon() {
  return (
    <svg viewBox="0 0 64 64">
      <circle cx="16" cy="16" r="6" />
      <circle cx="16" cy="48" r="6" />
      <circle cx="48" cy="32" r="6" />
      <path d="M16 22 V42" />
      <path d="M16 32 H42" />
    </svg>
  );
}

function NetworkIcon() {
  return (
    <svg viewBox="0 0 64 64">
      <circle cx="20" cy="18" r="7" />
      <circle cx="46" cy="18" r="7" />
      <circle cx="32" cy="46" r="7" />
      <path d="M26 22 L40 22" />
      <path d="M23 24 L29 40" />
      <path d="M41 24 L35 40" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg viewBox="0 0 64 64">
      <rect x="16" y="28" width="32" height="26" rx="4" />
      <path d="M22 28 V20 a10 10 0 0 1 20 0 v8" />
      <circle cx="32" cy="40" r="3" fill="currentColor" stroke="none" />
      <line x1="32" y1="43" x2="32" y2="48" />
    </svg>
  );
}

const ICONS = {
  email: EmailIcon,
  code: CodeIcon,
  network: NetworkIcon,
  lock: LockIcon,
};

function formatLocalTime(date) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  }).format(date);
}

function getHourIn(date, timeZone) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour: "2-digit",
    hour12: false,
  }).formatToParts(date);
  const hourPart = parts.find((p) => p.type === "hour");
  const hour = hourPart ? parseInt(hourPart.value, 10) : 12;
  return hour === 24 ? 0 : hour;
}

function getAvailability(hour) {
  // Rough day/night split -- not a precise schedule, just a friendly
  // "is now a reasonable time" signal for anyone reaching out.
  if (hour >= 8 && hour < 24) return { label: "AVAILABLE", tone: "on" };
  return { label: "PROBABLY ASLEEP", tone: "off" };
}

const Contact = () => {
  const LyricRef = useRef(null);
  const pageRef = useRef(null);
  const revealedRef = useRef(false);

  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  // Decorative pop-in for the ports, played once the page is revealed
  // (not on mount) so it isn't wasted while the section is still
  // display:none. The CSS never hides these elements by default, so if
  // this throws partway through, the ports are still fully visible and
  // clickable, just without the flourish.
  const playPortsIntro = () => {
    try {
      const ctx = gsap.context(() => {
        gsap.from(".port", {
          y: 20,
          opacity: 0,
          scale: 0.94,
          stagger: 0.08,
          duration: 0.5,
          ease: "back.out(1.4)",
        });
      }, pageRef);

      return () => ctx.revert();
    } catch (err) {
      console.error("Ports intro animation failed:", err);
      return () => {};
    }
  };

  // The one place that's allowed to reveal the page. Guarded so it only
  // ever runs once. Uses an iris wipe (clip-path circle growing from
  // the center) rather than an opacity fade: opacity leaves an element
  // partially *transparent*, which is what caused the earlier white
  // flash (you could see straight through to the page's default
  // background). clip-path instead defines a visible *shape* -- there's
  // nothing to see through, and the lyrics layer stays fully opaque
  // underneath the whole time as a solid backdrop until the circle has
  // already covered it.
  const revealContact = () => {
    if (revealedRef.current) return;
    revealedRef.current = true;

    const finishReveal = () => {
      if (pageRef.current) pageRef.current.style.clipPath = "none";
      if (LyricRef.current) LyricRef.current.style.display = "none";
      playPortsIntro();
    };

    try {
      if (!pageRef.current) throw new Error("pageRef missing");

      pageRef.current.style.display = "flex";
      gsap.fromTo(
        pageRef.current,
        { clipPath: "circle(0% at 50% 50%)" },
        {
          clipPath: "circle(150% at 50% 50%)",
          duration: 1.1,
          ease: "power2.inOut",
          onComplete: finishReveal,
        }
      );
    } catch (err) {
      console.error("Iris-wipe reveal failed, falling back to instant swap:", err);
      if (LyricRef.current) LyricRef.current.style.display = "none";
      if (pageRef.current) {
        pageRef.current.style.display = "flex";
        pageRef.current.style.clipPath = "none";
      }
      playPortsIntro();
    }
  };

  useEffect(() => {
    // Absolute safety net: whatever happens with GSAP/SplitText above,
    // the page shows up within 16s no matter what.
    const failsafe = setTimeout(revealContact, 16000);

    try {
      if (!splitTextReady || !LyricRef.current) throw new Error("SplitText unavailable");

      const split = new SplitText(LyricRef.current, {
        type: "words",
        wordsClass: "word",
      });

      gsap.from(split.words, {
        opacity: 0,
        y: 150,
        skewX: -15,
        rotation: -20,
        scale: 0.8,
        stagger: 0.18,
        ease: "none",
        delay: 3,
        duration: 0.5,
      });

      gsap.to(".goat", {
        scale: 1.08,
        rotation: 2,
        textShadow:
          "0 0 14px rgba(255,49,49,1), 0 0 28px rgba(255,49,49,0.9), 0 0 42px rgba(255,49,49,0.7)",
        duration: 1.6,
        delay: 4.2,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      });

      setTimeout(() => {
        // 27 words at delay:3s + stagger:0.18s finish appearing around
        // ~8.2s (3 + 26*0.18 + 0.5). This fires well after that, so the
        // scatter-out never starts before the last word ("I'm 'bout")
        // has actually appeared.
        gsap.killTweensOf(".goat");

        const words = LyricRef.current?.querySelectorAll(".word");
        if (!words || !words.length) {
          revealContact();
          return;
        }

        gsap.to(words, {
          opacity: 0,
          y: () => `${100 + Math.random() * 200}px`,
          x: () => `${(Math.random() - 0.5) * 400}px`,
          rotation: () => (Math.random() - 0.5) * 180,
          scale: 0.4,
          stagger: { amount: 0.9, from: "random" },
          duration: 1.4,
          ease: "back.in(1.7)",
          onComplete: revealContact,
        });
      }, 8700);
    } catch (err) {
      console.error("Lyrics intro animation failed:", err);
      revealContact();
    }

    return () => clearTimeout(failsafe);
  }, []);

  const hour = getHourIn(now, TIMEZONE);
  const availability = getAvailability(hour);

  return (
    <>
      <TransitionWrapper UpperText="Contact" LowerText="Slide in, make it count." />

      <div className="contact-container">
        <div ref={LyricRef} className="contact-lyrics">
          Let me explain how to make <span className="goat">greatness</span><br />
          Straight out the gate, I'm 'bout to break it down<br />
          Ain't no <span className="goat">mistakes</span> allowed, but make no mistakes,{" "}
          <span className="goat">I'm 'bout</span>
        </div>

        <main ref={pageRef} className="contact-page" style={{ display: "none" }}>
        <div className="blueprint-grid" />

        <header className="workbench-header">
          <div>
            <span className="eyebrow">PROJECT // ARYAN</span>
            <h1>OPEN A CHANNEL</h1>
          </div>
          <div className="revision">
            <span>CONNECTORS</span>
            <strong>REV. 02</strong>
          </div>
        </header>

        <div className="contact-main">
          <section className="ports-panel">
            <span className="section-kicker">SELECT AN INTERFACE</span>

            <div className="ports-row">
              {CONTACT_LINKS.map((link) => {
                const Icon = ICONS[link.icon];
                return (
                  <a
                    key={link.key}
                    className={`port${link.restricted ? " is-restricted" : ""}`}
                    href={link.href}
                    target={link.external ? "_blank" : undefined}
                    rel={link.external ? "noreferrer" : undefined}
                    aria-label={`${link.label}: ${link.value}`}
                  >
                    <span className={`port-socket shape-${link.shape}`}>
                      <span className="port-led" />
                      <Icon />
                    </span>
                    <span className="port-label">
                      <strong>{link.label}</strong>
                      <small>{link.value}</small>
                    </span>
                  </a>
                );
              })}
            </div>

            <div className="clock-readout">
              <span className="clock-label">LOCAL TIME // IST</span>
              <div className="clock-row">
                <strong>{formatLocalTime(now)}</strong>
                <span className={`clock-status tone-${availability.tone}`}>
                  {availability.label}
                </span>
              </div>
            </div>
          </section>
        </div>

        <div className="title-block">
          <span>DESIGNED &amp; BUILT BY ARYAN</span>
          <span>REV. 02 &mdash; 2026</span>
        </div>

        <footer className="workbench-footer">
          <span>NO FORMS. NO FRICTION.</span>
          <span>PICK A PORT AND SEND IT.</span>
        </footer>
        </main>
      </div>
    </>
  );
};

export default Contact;