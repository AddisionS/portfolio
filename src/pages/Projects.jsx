import TransitionWrapper from "../components/common/TransitionWrapper";
import "../components/styles/Projects.css";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import SplitText from "gsap/SplitText";

import projectData from "../data/projects.json";

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

const CATEGORY_ORDER = ["Software", "AI/ML", "Web", "Hardware"];
const GITHUB_USERNAME = "AddisionS";

function buildCalendarGrid(days) {
  // days already come chronological, oldest -> newest, from /api/github.
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

const Projects = () => {
  const LyricRef = useRef(null);
  const pageRef = useRef(null);
  const revealedRef = useRef(false);

  const [projects, setProjects] = useState({ Software: [], "AI/ML": [], Web: [], Hardware: [] });
  const [selected, setSelected] = useState(null);
  const [github, setGithub] = useState(null);
  const [githubError, setGithubError] = useState(false);

  useEffect(() => {
    const grouped = { Software: [], "AI/ML": [], Web: [], Hardware: [] };

    projectData.projects.forEach((project) => {
      const category = project.category?.trim(); // trim to avoid whitespace issues
      if (grouped[category]) {
        grouped[category].push(project);
      }
    });

    setProjects(grouped);
  }, []);

  useEffect(() => {
    fetch(`/api/github?username=${GITHUB_USERNAME}`)
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then((data) => {
        if (data.status !== "success") throw new Error();
        setGithub(data);
      })
      .catch(() => setGithubError(true));
  }, []);

  // Decorative pop-in for the folders once the archive is revealed. The
  // CSS never hides these elements by default, so if this throws
  // partway through, the archive is still fully visible and usable,
  // just without the flourish.
  const playArchiveIntro = () => {
    try {
      const ctx = gsap.context(() => {
        gsap.from(".github-strip", {
          y: 20,
          opacity: 0,
          duration: 0.6,
          ease: "power2.out",
        });
        gsap.from(".folder", {
          y: 24,
          opacity: 0,
          scale: 0.92,
          stagger: 0.05,
          duration: 0.6,
          delay: 0.1,
          ease: "back.out(1.4)",
        });
      }, pageRef);

      return () => ctx.revert();
    } catch (err) {
      console.error("Playback animation failed:", err);
      return () => {};
    }
  };

  // The one place that's allowed to reveal the archive. Guarded so it
  // only ever runs once, no matter how many paths call it (animation
  // success, animation failure, or the hard timeout below). Uses an
  // iris wipe (clip-path circle growing from the center) rather than an
  // opacity fade or an instant swap: opacity leaves an element
  // partially transparent, which lets the page's default background
  // show through underneath and reads as a white flash; clip-path
  // defines a visible shape instead, so there's nothing to see through.
  // The lyrics stay fully opaque underneath the whole time as a solid
  // backdrop until the circle has already covered them.
  const revealArchive = () => {
    if (revealedRef.current) return;
    revealedRef.current = true;

    const finishReveal = () => {
      if (pageRef.current) pageRef.current.style.clipPath = "none";
      if (LyricRef.current) LyricRef.current.style.display = "none";
      playArchiveIntro();
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
      playArchiveIntro();
    }
  };

  useEffect(() => {
    // Absolute safety net: whatever happens with GSAP/SplitText above,
    // the archive shows up within 8s no matter what.
    const failsafe = setTimeout(revealArchive, 8000);

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

      gsap.fromTo(
        ".goat",
        {
          scale: 0.7,
          rotation: -45,
          opacity: 0,
          filter: "brightness(0.5)",
        },
        {
          scale: 1.3,
          rotation: 0,
          opacity: 1,
          filter: "brightness(2)",
          duration: 0.4,
          delay: 4.6,
          ease: "power4.out",
          onStart: () => {
            gsap.fromTo(
              ".projects-lyrics",
              { x: -5 },
              {
                x: 5,
                duration: 0.05,
                repeat: 5,
                yoyo: true,
                ease: "power2.inOut",
              }
            );
          },
        }
      );

      setTimeout(() => {
        const words = LyricRef.current?.querySelectorAll(".word");
        if (!words || !words.length) {
          revealArchive();
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
          onComplete: revealArchive,
        });
      }, 5400);
    } catch (err) {
      console.error("SplitText playback failed:", err);
      revealArchive();
    }

    return () => clearTimeout(failsafe);
  }, []);

  const openDetail = (project, category) => setSelected({ ...project, category });
  const closeDetail = () => setSelected(null);

  return (
    <>
      <TransitionWrapper UpperText="Projects" LowerText="Built. Not bought." />

      <div className="projects-container">
        <div ref={LyricRef} className="projects-lyrics">
          Tobey Maguire<br />
          got bit by a spider,<br />
          but see,<br />
          me,<br />
          it was a <span className="goat">GOAT</span>
        </div>

        <main ref={pageRef} className="projects-workbench" style={{ display: "none" }}>
          <div className="blueprint-grid" />

          <header className="workbench-header">
            <div>
              <span className="eyebrow">PROJECT // ARYAN</span>
              <h1>THE ARCHIVE</h1>
            </div>
            <div className="revision">
              <span>FILE CABINET</span>
              <strong>REV. 01</strong>
            </div>
          </header>

          <section className="github-strip">
            <span className="eyebrow">SYSTEM // VERSION CONTROL</span>
            <h2>
              <span>Github{" "}</span><a
                      href={`https://github.com/${GITHUB_USERNAME}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      class = "git-link"
                    >@{GITHUB_USERNAME}</a>
            </h2>

            {githubError && <p>Telemetry unavailable.</p>}
            {!githubError && !github && <p>Reading telemetry...</p>}

            {github && (
              <>
                <div className="github-stats-row">
                  <div className="github-stat">
                    <span>CONTRIBUTIONS</span>
                    <strong>{github.totalContributions}</strong>
                    <small>PAST YEAR</small>
                  </div>

                  <div className="github-divider" />

                  <div className="github-stat">
                    <span>STARS</span>
                    <strong>{github.totalStars}</strong>
                    <small>EARNED</small>
                  </div>

                  <div className="github-divider" />

                  <div className="github-stat">
                    <span>REPOS</span>
                    <strong>{github.publicRepos}</strong>
                    <small>PUBLIC</small>
                  </div>
                </div>

                <div className="github-mini-stats">
                  <span>{github.followers} FOLLOWERS</span>
                  <span>{github.currentStreak} DAY STREAK</span>
                  <span>{github.longestStreak} DAY BEST</span>
                  <span>{github.totalCommits} COMMITS</span>
                  <span>{github.totalPRs} PRS</span>
                  <span>{github.totalIssues} ISSUES</span>
                  <span>{github.totalReposContributedTo} CONTRIBUTED TO</span>
                </div>

                <div className="github-calendar">
                  {buildCalendarGrid(github.calendar).map((week, wi) => (
                    <div className="github-cal-week" key={wi}>
                      {week.map((day) => (
                        <div
                          key={day.date}
                          className={`github-cal-day level-${levelForCount(day.count)}`}
                          title={`${day.date}: ${day.count} contribution${day.count === 1 ? "" : "s"}`}
                        />
                      ))}
                    </div>
                  ))}
                </div>
              </>
            )}
          </section>

          <div className="archive-body">
            {CATEGORY_ORDER.map((category) => (
              <section key={category} className="category-block">
                <span className="section-kicker">CATEGORY // {category.toUpperCase()}</span>
                <h2>{category}</h2>

                <div className="folder-grid">
                  {projects[category]?.length ? (
                    projects[category].map((proj) => (
                      <button
                        key={proj.name}
                        type="button"
                        className="folder"
                        onClick={() => openDetail(proj, category)}
                        aria-label={`Open ${proj.name}`}
                      >
                        <span className="folder-paper" />
                        <span className="folder-tab">
                          <span className="folder-tab-label">{proj.name}</span>
                        </span>
                        <span className="folder-body">
                          <span className="folder-hint">VIEW FILE &rarr;</span>
                        </span>
                      </button>
                    ))
                  ) : (
                    <p className="empty-msg">No {category} projects yet.</p>
                  )}
                </div>
              </section>
            ))}
          </div>

          <footer className="workbench-footer">
            <span>EVERY PROJECT IS A PAPER TRAIL.</span>
            <span>PULL A FILE TO SEE THE FULL STORY.</span>
          </footer>
        </main>

        {selected && (
          <>
            <div className="detail-overlay" onClick={closeDetail} />
            <section className="project-detail">
              <div className="detail-doc-tab">FILE</div>
              <div className="detail-clip" />

              <button className="detail-close" onClick={closeDetail} aria-label="Close">
                &times;
              </button>

              <span className="detail-kicker">CASE FILE // {selected.category.toUpperCase()}</span>
              <h2>{selected.name}</h2>

              {selected.description && (
                <p className="detail-description">{selected.description}</p>
              )}

              {selected.stack?.length > 0 && (
                <div className="detail-stack">
                  {selected.stack.map((tech) => (
                    <span key={tech}>{tech}</span>
                  ))}
                </div>
              )}

              {(selected.repository || selected.live) && (
                <div className="detail-links">
                  {selected.repository && (
                    <a href={selected.repository} target="_blank" rel="noreferrer">
                      Repo
                    </a>
                  )}
                  {selected.live && (
                    <a href={selected.live} target="_blank" rel="noreferrer">
                      Live
                    </a>
                  )}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </>
  );
};

export default Projects;