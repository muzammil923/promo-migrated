import { useState, useEffect, useRef } from "react";

export function parseVal(str) {
  const num = parseFloat(String(str).replace(/[^0-9.]/g, ""));
  const suffix = String(str).replace(/[0-9.,]/g, "");
  const hasComma = String(str).includes(",");
  return { num: isNaN(num) ? 0 : num, suffix, hasComma };
}

export default function CountUp({ value, duration, threshold = 0.3, decimals, as = "span", className, style, children: _ }) {
  const { num, suffix, hasComma } = parseVal(value);
  const [display, setDisplay] = useState(() => {
    const n = decimals ? num.toFixed(decimals) : hasComma ? num.toLocaleString() : String(num);
    return n + suffix;
  });
  const ref = useRef(null);
  const done = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || done.current || !num) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      done.current = true;
      obs.disconnect();
      const dur = duration || Math.min(2000, Math.max(600, num * 15));
      const t0 = performance.now();
      function tick(now) {
        const p = Math.min((now - t0) / dur, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        const cur = Math.round(num * eased);
        const formatted = decimals ? cur.toFixed(decimals) : hasComma ? cur.toLocaleString() : String(cur);
        setDisplay(formatted + suffix);
        if (p < 1) requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
    }, { threshold });
    obs.observe(el);
    return () => obs.disconnect();
  }, [num, value, duration, threshold, decimals, hasComma, suffix]);

  const Tag = as;
  return <Tag ref={ref} className={className} style={style}>{display}</Tag>;
}
