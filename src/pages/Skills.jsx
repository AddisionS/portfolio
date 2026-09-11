import TransitionWrapper from "../components/common/TransitionWrapper";
import "../components/styles/Skills.css";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import SplitText from "gsap/SplitText";

import skillsData from "../data/skills.json";

const LEETCODE_USERNAME = "aryan171205";

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

function buildCalendarGrid(entries) {
  const byDate = new Map(entries.map((e) => [e.date, e.count]));

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const start = new Date(today);
  start.setDate(start.getDate() - 371);
  start.setDate(start.getDate() - start.getDay());

  const days = [];
  const cursor = new Date(start);

  while (cursor <= today) {
    const iso = cursor.toISOString().slice(0, 10);
    days.push({ date: iso, count: byDate.get(iso) || 0 });
    cursor.setDate(cursor.getDate() + 1);
  }

  const weeks = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }
  return weeks;
}

function levelForCount(count) {
  if (count === 0) return 0;
  if (count <= 2) return 1;
  if (count <= 5) return 2;
  if (count <= 9) return 3;
  return 4;
}

// A small helper so the "hand-pinned" look (slight rotation + vertical
// jitter) reads as random but never jitters again on re-render.
function randomBetween(min, max) {
  return Math.random() * (max - min) + min;
}

const Skills = () => {
  const LyricRef = useRef(null);
  const pageRef = useRef(null);
  const revealedRef = useRef(false);

  const [leetcode, setLeetcode] = useState(null);
  const [leetcodeError, setLeetcodeError] = useState(false);

  // Per-note placement, generated once (lazy initializer) so every
  // category note keeps its own rotation/offset across re-renders --
  // otherwise the notes would visibly "jump" whenever the LeetCode


  const [noteLayouts] = useState(() =>
    skillsData.categories.map(() => ({
      rotate: randomBetween(-3.5, 3.5),
      offsetY: randomBetween(-10, 12),
    }))
  );
  const [leetcodeLayout] = useState(() => ({
    rotate: randomBetween(-1.5, 1.5),
  }));

  // Decorative pop-in for the corkboard. The CSS never hides these
  // elements by default, so if this throws partway through, the board
  // is still fully visible and usable, just without the flourish.
  const playWorkbenchIntro = () => {
    try {
      const ctx = gsap.context(() => {
        gsap.from(".note-card", {
          y: 24,
          opacity: 0,
          scale: 0.92,
          stagger: 0.06,
          duration: 0.6,
          ease: "back.out(1.4)",
        });
      }, pageRef);

      return () => ctx.revert();
    } catch (err) {
      console.error("Workbench intro animation failed:", err);
      return () => {};
    }
  };

  // The one place that's allowed to reveal the workbench. Guarded so it
  // only ever runs once, no matter how many paths call it (animation
  // success, animation failure, or the hard timeout below). Uses an
  // iris wipe (clip-path circle growing from the center) rather than an
  // opacity fade or an instant swap: opacity leaves an element
  // partially transparent, which lets the page's default background
  // show through underneath and reads as a white flash; clip-path
  // defines a visible shape instead, so there's nothing to see through.
  // The lyrics stay fully opaque underneath the whole time as a solid
  // backdrop until the circle has already covered them.
  const revealWorkbench = () => {
    if (revealedRef.current) return;
    revealedRef.current = true;

    const finishReveal = () => {
      if (pageRef.current) pageRef.current.style.clipPath = "none";
      if (LyricRef.current) LyricRef.current.style.display = "none";
      playWorkbenchIntro();
    };

    try {
      if (!pageRef.current) throw new Error("pageRef missing");

      pageRef.current.style.display = "block";
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
        pageRef.current.style.display = "block";
        pageRef.current.style.clipPath = "none";
      }
      playWorkbenchIntro();
    }
  };

  useEffect(() => {
    // Absolute safety net: whatever happens with GSAP/SplitText above,
    // the workbench shows up within 8s no matter what.
    const failsafe = setTimeout(revealWorkbench, 8000);

    try {
      if (!splitTextReady || !LyricRef.current) throw new Error("SplitText unavailable");

      const split = new SplitText(LyricRef.current, {
        type: "words",
        wordsClass: "skills-word",
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

      gsap.to(".skills-goat", {
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
        gsap.killTweensOf(".skills-goat");

        const words = LyricRef.current?.querySelectorAll(".skills-word");
        if (!words || !words.length) {
          revealWorkbench();
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
          onComplete: revealWorkbench,
        });
      }, 6400);
    } catch (err) {
      console.error("Skills intro animation failed:", err);
      revealWorkbench();
    }

    return () => clearTimeout(failsafe);
  }, []);

  useEffect(() => {
    fetch(`/api/leetcode?username=${LEETCODE_USERNAME}`)
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then((data) => {
        if (data.status !== "success") throw new Error();
        setLeetcode(data);
      })
      .catch(() => setLeetcodeError(true));
  }, []);

  const rightColumnCategoryName = "Nuts & Bolts";
  const leftCategories = skillsData.categories.filter(
    (c) => c.name !== rightColumnCategoryName
  );
  const rightColumnCategory = skillsData.categories.find(
    (c) => c.name === rightColumnCategoryName
  );
  const rightColumnLayoutIndex = skillsData.categories.findIndex(
    (c) => c.name === rightColumnCategoryName
  );

  return (
    <>
      <TransitionWrapper UpperText="Skills? Badges" LowerText="Gotta catch 'em all" />

      <div className="skills-container">
        <div ref={LyricRef} className="skills-lyrics">
          ऊपर का <span className="skills-goat">loose</span> है ये <span className="skills-goat">screw</span><br />
          And I had nothing to do<br />तो सभी पे जा रहा था <br /> तू तू तू तू
        </div>

        <main ref={pageRef} className="skills-workbench" style={{ display: "none" }}>
          <div className="blueprint-grid" />

          <header className="workbench-header">
            <div>
              <span className="eyebrow">PROJECT // ARYAN</span>
              <h1>THE WORKBENCH</h1>
            </div>
            <div className="revision">
              <span>CORKBOARD</span>
              <strong>REV. 03</strong>
            </div>
          </header>

          <div className="corkboard">
            <div className="notes-grid">
              {leftCategories.map((category) => {
                const i = skillsData.categories.findIndex((c) => c.name === category.name);
                const { rotate, offsetY } = noteLayouts[i];
                return (
                  <article
                    key={category.name}
                    className={`note-card ${
                      category.name === "Big Brain Energy"
                        ? "big-brain"
                        : category.name === "The Engine Room"
                          ? "engine-room"
                          : ""
                    }`}
                    style={{ transform: `rotate(${rotate.toFixed(2)}deg) translateY(${offsetY.toFixed(1)}px)` }}
                  >
                    <div className="note-pin" />
                    <div className="note-tape" />

                    <span className="note-kicker">COMPONENT // {category.name.toUpperCase()}</span>
                    <h2>{category.name}</h2>

                    <div className="note-skills">
                      {category.skills.map((skill) => (
                        <span key={skill}>{skill}</span>
                      ))}
                    </div>
                  </article>
                );
              })}
            </div>

            <div className="right-column">
              <article
                className="note-card note-leetcode"
                style={{ transform: `rotate(${leetcodeLayout.rotate.toFixed(2)}deg)` }}
              >
                <div className="note-pin" />
                <div className="note-tape" />

                <span className="note-kicker">SYSTEM // LOGBOOK</span>
                <h2>Core</h2>

                <div className="core-status">
                  <span>
                    LEETCODE{" "}
                    <a
                      href={`https://leetcode.com/u/${LEETCODE_USERNAME}/`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      @{LEETCODE_USERNAME}
                    </a>
                  </span>

                  {leetcodeError && <p>Telemetry unavailable.</p>}
                  {!leetcodeError && !leetcode && <p>Reading telemetry...</p>}

                  {leetcode && (
                    <>
                      <div className="stat-row">
                        <div className="stat-block stat-solved">
                          <span>SOLVED</span>
                          <strong>{leetcode.totalSolved}</strong>
                          <small>PROBLEMS</small>
                        </div>

                        {leetcode.contestRating && (
                          <>
                            <div className="stat-divider" />
                            <div className="stat-block stat-contest">
                              <span>CONTEST RATING</span>
                              <strong>{Math.round(leetcode.contestRating)}</strong>
                              <small>
                                {leetcode.contestBadge ? leetcode.contestBadge.toUpperCase() : "RATED"}
                              </small>
                            </div>
                          </>
                        )}
                      </div>

                      <div className="mini-stats">
                        <span>{leetcode.easySolved} EASY</span>
                        <span>{leetcode.mediumSolved} MED</span>
                        <span>{leetcode.hardSolved} HARD</span>
                      </div>

                      {(leetcode.contestGlobalRanking ||
                        leetcode.contestTopPercentage ||
                        leetcode.totalContestsAttended) && (
                        <div className="contest-meta">
                          {leetcode.contestGlobalRanking && (
                            <span>RANK #{leetcode.contestGlobalRanking.toLocaleString()}</span>
                          )}
                          {leetcode.contestTopPercentage && (
                            <span>TOP {leetcode.contestTopPercentage}%</span>
                          )}
                          {leetcode.totalContestsAttended && (
                            <span>{leetcode.totalContestsAttended} CONTESTS</span>
                          )}
                        </div>
                      )}

                      <div className="core-calendar">
                        {buildCalendarGrid(leetcode.calendar).map((week, wi) => (
                          <div className="core-cal-week" key={wi}>
                            {week.map((day) => (
                              <div
                                key={day.date}
                                className={`core-cal-day level-${levelForCount(day.count)}`}
                                title={`${day.date}: ${day.count} submission${day.count === 1 ? "" : "s"}`}
                              />
                            ))}
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </article>

              {rightColumnCategory && (
                <article
                  className="note-card note-wide"
                  style={{
                    transform: `rotate(${noteLayouts[rightColumnLayoutIndex].rotate.toFixed(2)}deg)`,
                  }}
                >
                  <div className="note-pin" />
                  <div className="note-tape" />

                  <span className="note-kicker">
                    COMPONENT // {rightColumnCategory.name.toUpperCase()}
                  </span>
                  <h2>{rightColumnCategory.name}</h2>

                  <div className="note-skills">
                    {rightColumnCategory.skills.map((skill) => (
                      <span key={skill}>{skill}</span>
                    ))}
                  </div>
                </article>
              )}
            </div>
          </div>

          <footer className="workbench-footer">
            <span>SKILLS ARE JUST TOOLS.</span>
            <span>WHAT MATTERS IS WHAT YOU BUILD WITH THEM.</span>
          </footer>
        </main>
      </div>
    </>
  );
};

export default Skills;