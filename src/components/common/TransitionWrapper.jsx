import gsap from "gsap";
import { useEffect, useRef } from "react";
import "../styles/TransitionWrapper.css";


export default function TransitionWrapper({UpperText, LowerText}) {
  const topRef = useRef();
  const bottomRef = useRef();

  useEffect(() => {
    const tl = gsap.timeline();

    tl.fromTo(
      topRef.current,
      { y: "-100%" },
      { y: "0%", duration: 0.6, ease: "power2.out" }
    )
    .fromTo(
      bottomRef.current,
      { y: "100%" },
      { y: "0%", duration: 0.6, ease: "power2.out" },
      "<" 
    )
    .to(
      [topRef.current, bottomRef.current],
      {
        y: (i) => (i === 0 ? "-100%" : "100%"),
        duration: 0.6,
        delay: 0.8,
        ease: "power2.in",
      }
    );
  }, []);

  return (
    <div className="transition-wrapper">
      <div ref={topRef} className="transition-slide top">{UpperText}</div>
      <div ref={bottomRef} className="transition-slide bottom">{LowerText}</div>
    </div>
  );
}