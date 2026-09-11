import "../components/styles/Home.css";
import TransitionWrapper from "../components/common/TransitionWrapper";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import SplitText from "gsap/SplitText";
import Typewriter from "typewriter-effect";

import data from "../data/home.json";

// registerPlugin can throw if the installed gsap version predates the
// bonus plugins being bundled free. Guard it so a bad gsap version
// degrades to a plain fade instead of taking the whole page down.
let splitTextReady = true;
try {
  gsap.registerPlugin(SplitText);
} catch (err) {
  console.error("SplitText registration failed:", err);
  splitTextReady = false;
}

const Home = () => {
  const LyricRef = useRef(null);
  const pageRef = useRef(null);
  const revealedRef = useRef(false);

  // Decorative pop-in for the terminal once the page is revealed. The
  // CSS never hides it by default, so if this throws partway through,
  // the terminal is still fully visible and usable, just without the
  // flourish.
  const playHomeIntro = () => {
    try {
      const ctx = gsap.context(() => {
        gsap.from(".terminal", {
          y: 24,
          opacity: 0,
          scale: 0.96,
          duration: 0.7,
          ease: "power3.out",
        });
      }, pageRef);

      return () => ctx.revert();
    } catch (err) {
      console.error("Home intro animation failed:", err);
      return () => {};
    }
  };

  // The one place that's allowed to reveal the page. Guarded so it only
  // ever runs once. Same iris-wipe approach as Skills/Projects/Contact:
  // clip-path circle growing from the center, rather than an opacity
  // fade (which would leave the page briefly transparent and reveal
  // the default background underneath -- the "white flash" bug from
  // Contact) or an instant swap.
  const revealHome = () => {
    if (revealedRef.current) return;
    revealedRef.current = true;

    const finishReveal = () => {
      if (pageRef.current) pageRef.current.style.clipPath = "none";
      if (LyricRef.current) LyricRef.current.style.display = "none";
      playHomeIntro();
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
      playHomeIntro();
    }
  };

  useEffect(() => {
    // Absolute safety net: whatever happens with GSAP/SplitText above,
    // the page shows up within 13s no matter what.
    const failsafe = setTimeout(revealHome, 8000);

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
        stagger: 0.12,
        ease: "none",
        delay: 2.5,
        duration: 0.35,
      });

      gsap.to(".goat", {
        scale: 1.08,
        rotation: 2,
        textShadow:
          "0 0 14px rgba(255,49,49,1), 0 0 28px rgba(255,49,49,0.9), 0 0 42px rgba(255,49,49,0.7)",
        duration: 1.4,
        delay: 3.6,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      });

      setTimeout(() => {
        gsap.killTweensOf(".goat");

        const words = LyricRef.current?.querySelectorAll(".word");
        if (!words || !words.length) {
          revealHome();
          return;
        }

        gsap.to(words, {
          opacity: 0,
          y: () => `${100 + Math.random() * 200}px`,
          x: () => `${(Math.random() - 0.5) * 400}px`,
          rotation: () => (Math.random() - 0.5) * 180,
          scale: 0.4,
          stagger: { amount: 0.8, from: "random" },
          duration: 1.2,
          ease: "back.in(1.7)",
          onComplete: revealHome,
        });
      }, 7000); // 21 words at delay:2.5s + stagger:0.12s finish appearing
      // around ~5.25s (2.5 + 20*0.12 + 0.35). This fires well after
      // that, so the scatter-out never starts before "mine" has
      // actually appeared.
    } catch (err) {
      console.error("Home intro animation failed:", err);
      revealHome();
    }

    return () => clearTimeout(failsafe);
  }, []);

  return (
    <>
      <TransitionWrapper UpperText="Hola" LowerText="Amigo" />

      <div className="home-container">
        <div ref={LyricRef} className="home-lyrics">
          Twenty million other white rappers emerge<br />
          But no matter how many fish in the sea<br />
          It'd be so empty <span className="goat">without me</span>
        </div>

        <main ref={pageRef} className="home-page" style={{ display: "none" }}>
          <div className="blueprint-grid" />

          <section className="screen screen-boot">
            <header className="workbench-header">
              <div>
                <span className="eyebrow">SYSTEM // ARYAN</span>
                <h1>BOOT</h1>
              </div>
              <div className="revision">
                <span>TERMINAL</span>
                <strong>REV. 01</strong>
              </div>
            </header>

            <div className="terminal-wrap">
              <div className="terminal">
                <div className="terminal-titlebar">
                  <span className="terminal-icon">&gt;_</span>
                  <span className="terminal-titlebar-label">C:\Users\Aryan&gt;</span>
                  <div className="terminal-controls">
                    <span className="terminal-btn">&#8211;</span>
                    <span className="terminal-btn">&#9633;</span>
                    <span className="terminal-btn terminal-btn-close">&times;</span>
                  </div>
                </div>

                <div className="terminal-body">
                  <Typewriter
                    options={{
                      delay: 75,
                      cursor: "_",
                    }}
                    onInit={(typewriter) => {
                      typewriter.pauseFor(2000);

                      data["intro"].forEach((line) => {
                        const tag = line.type === "heading" ? "h2" : "p";
                        const prefix = ">";
                        const formatted = `<${tag}>${prefix}${line.text}<br></${tag}>`;
                        typewriter.typeString(formatted);
                      });

                      typewriter.start();
                    }}
                  />
                </div>
              </div>
            </div>

            
          </section>

          <section className="screen screen-story">
            <header className="workbench-header">
              <div>
                <span className="eyebrow">SYSTEM // LOG</span>
                <h1>ORIGIN STORY</h1>
              </div>
              <div className="revision">
                <span>TIMELINE</span>
                <strong>REV. 01</strong>
              </div>
            </header>

            {/* PLACEHOLDER TIMELINE -- swap in the real milestones once
                provided (roughly when + what: first computer, first
                "aha" moment building something, first real project,
                whatever actually sticks out). */}
            <div className="timeline">
              <div className="timeline-entry">
                <span className="timeline-dot" />
                <span className="timeline-year">AGE 9 // FIRST CONTACT</span>
                <p>
                  I already liked logic. Then a simple HTML chapter in computer
                  class showed me that logic could exist in something digital too.
                  That was enough to make me curious about what else was possible.
                </p>
              </div>

              <div className="timeline-entry">
                <span className="timeline-dot" />
                <span className="timeline-year">AGE 14 // FIRST BUILD</span>
                <p>
                  I built my first RC car from scratch. It wasn't particularly
                  good. It barely worked -- until I supplied too much power and
                  killed the circuit. But for a brief moment, something I had
                  imagined actually moved. That moment changed everything.
                </p>
              </div>

              <div className="timeline-entry">
                <span className="timeline-dot" />
                <span className="timeline-year">NOW // BUILDING FOR REAL</span>
                <p>
                  What started as curiosity is now my work. I build across IoT,
                  hardware and systems, while pushing deeper into intelligence.
                  I still build because I enjoy learning -- the difference is
                  that now, some of the things I build have to work in the real world.
                </p>
              </div>
            </div>

            <footer className="workbench-footer">
              <span>EVERY EXPERT WAS ONCE A BEGINNER.</span>
              <span>STILL BUILDING. STILL LEARNING.</span>
            </footer>
          </section>
        </main>
      </div>
    </>
  );
};

export default Home;