"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

/* ----------------------------------------------------------------
 * ScrollReelTestimonials
 *
 * Counter-rotating scroll reel + per-character text rise.
 * The middle column is a real vertical list of portraits that
 * translates by one "pitch" per step; the outer columns counter-
 * rotate the opposite way. Text animates in character-by-character
 * with a stagger; the old block exits as a whole before the new
 * characters rise in sequence.
 *
 * With `loop` the reel runs forever without repeating or rewinding:
 * `index` grows without bound while the middle column renders a
 * sliding window of WINDOW_CYCLES cycles, so the DOM stays small.
 * ---------------------------------------------------------------- */

export interface ScrollReelTestimonial {
  /** The quote text */
  quote: string;
  /** Author name shown below the quote */
  author: string;
  /** Portrait image URL for the featured tile */
  image: string;
  /** Optional alt text for the portrait */
  alt?: string;
}

export interface ScrollReelTestimonialsProps {
  /** Testimonials to cycle through (one featured tile is generated per entry) */
  testimonials: ScrollReelTestimonial[];
  /** Per-character stagger in ms (default 6) */
  charStaggerMs?: number;
  /** Auto-advance interval in ms. 0 (default) disables auto-advance. */
  autoPlayMs?: number;
  /** Wrap around at both ends instead of stopping (default false) */
  loop?: boolean;
  /** Knock the portraits back to greyscale. Default true; pass false for
   *  already-stylised artwork (e.g. the PromoGames avatars) that should
   *  keep its brand colour. */
  desaturate?: boolean;
  /** Extra classes for the outer container */
  className?: string;
}

/* Geometry — middle column pitch between portrait centers:
 * 3 * (cell 121.33px + gap 8px) = 388px */
const CELL = 121.33;
const GAP = 8;
const STEP = 3 * (CELL + GAP);
const PITCH = CELL + GAP;

/* Placeholder cells before the first and after the last featured tile,
   so a tile can sit centred at the very start and end of the reel. */
const LEAD_CELLS = 3;

/* Cycles of testimonials kept mounted in the middle column at any time.
   Two is the minimum that lets `index` move one step in either direction
   from anywhere in the window. */
const WINDOW_CYCLES = 2;

const EXIT_MS = 240; // old text removed / new text mounted
const SLIDE_MS = 800; // column slide duration + interaction lock

const EASE_INOUT = "cubic-bezier(0.65,0,0.35,1)";

const QUOTE_CLASSES =
  "m-0 text-lg font-medium leading-[1.3] tracking-[-0.02em] text-foreground sm:text-[22px]";
const AUTHOR_CLASSES =
  "m-0 text-sm font-medium leading-[1.3] text-muted-foreground";

/* Elevates the tile off the panel. The inset highlights are tuned for
 * this app's dark surfaces (top rim light, bottom contact shadow) — on
 * a light panel you would flip both to rgba(255,255,255,0.7) / 0.6. */
const FEATURED_SHADOW =
  "0 1.008px 0.705px -0.563px rgba(0,0,0,0.18), 0 2.389px 1.672px -1.125px rgba(0,0,0,0.17), 0 4.357px 3.05px -1.688px rgba(0,0,0,0.17), 0 7.244px 5.07px -2.25px rgba(0,0,0,0.16), 0 11.698px 8.188px -2.813px rgba(0,0,0,0.15), 0 19.148px 13.404px -3.375px rgba(0,0,0,0.13), 0 32.972px 23.08px -3.938px rgba(0,0,0,0.09), 0 60px 42px -4.5px rgba(0,0,0,0.02), inset 0 1px 0 rgba(255,255,255,0.1), inset 0 -1px 0 rgba(0,0,0,0.6)";

/* Diagonal sheen sweeping the featured tile. */
const FEATURED_SHEEN =
  "linear-gradient(220.99deg, rgba(146,16,246,0) 32%, rgb(146,16,246) 41%, rgb(192,64,255) 47%, rgba(124,58,237,0.57) 54%, rgba(124,58,237,0) 65%)";

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

/* Non-negative modulo — needed because a looping reel walks `index`
   through negative values when stepping back past the first item. */
function wrap(i: number, n: number) {
  return ((i % n) + n) % n;
}

/* Honour the OS "reduce motion" setting for the auto-advance, not just
   for the CSS transitions. */
function usePrefersReducedMotion() {
  const [reduced, setReduced] = React.useState(false);
  React.useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);
  return reduced;
}

/* Blurred placeholder cell */
function Cell() {
  return (
    <div
      aria-hidden="true"
      className="shrink-0 rounded-xl border border-border bg-gradient-to-b from-secondary to-card blur-[1px] shadow-[0_1px_2px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.06)]"
      style={{ width: CELL, height: CELL }}
    />
  );
}

/* Featured portrait tile with optional desaturation + gradient sheen */
function Featured({
  src,
  alt,
  desaturate,
}: {
  src: string;
  alt?: string;
  desaturate: boolean;
}) {
  return (
    <div
      className="relative isolate shrink-0 overflow-hidden rounded-xl bg-muted"
      style={{ width: CELL, height: CELL, boxShadow: FEATURED_SHADOW }}
    >
      <img
        src={src}
        alt={alt ?? ""}
        loading="lazy"
        className="absolute inset-0 h-full w-full object-cover object-[center_30%]"
      />
      {/* desaturate via saturation blend */}
      {desaturate ? (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-[2] bg-white mix-blend-saturation"
        />
      ) : null}
      {/* diagonal gradient sheen */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-[3] blur-[6px] mix-blend-overlay"
        style={{ background: FEATURED_SHEEN }}
      />
    </div>
  );
}

/* Per-character split. Spaces live between word spans as plain text
 * nodes so natural line-wrapping is preserved. Each char rises in
 * with an inline animation-delay; while the block is exiting, the
 * char animation is removed so in-flight rises are killed. */
function Chars({
  text,
  startIndex,
  staggerMs,
}: {
  text: string;
  startIndex: number;
  staggerMs: number;
}) {
  let idx = startIndex;
  const words = text.split(" ");
  return (
    <>
      {words.map((word, wi) => {
        const wordSpan = (
          <span className="inline-block whitespace-nowrap">
            {Array.from(word).map((ch, ci) => {
              const delay = idx * staggerMs;
              idx++;
              return (
                <span
                  key={ci}
                  className="scroll-reel-char"
                  style={{ animationDelay: `${delay}ms` }}
                >
                  {ch}
                </span>
              );
            })}
          </span>
        );
        if (wi < words.length - 1) idx++;
        return (
          <React.Fragment key={wi}>
            {wordSpan}
            {wi < words.length - 1 ? " " : null}
          </React.Fragment>
        );
      })}
    </>
  );
}

export function ScrollReelTestimonials({
  testimonials,
  charStaggerMs = 6,
  autoPlayMs = 0,
  loop = false,
  desaturate = true,
  className,
}: ScrollReelTestimonialsProps) {
  /* Navigation state vs display state are kept separate so the
   * exiting block and the entering block never render together. */
  const count = testimonials.length;
  const windowSteps = count * WINDOW_CYCLES;

  /* A looping reel's `index` grows without bound, but only two cycles of
   * tiles are ever mounted. `windowLo` is where that window starts. It has
   * to move in whole cycles — the tile pattern only repeats every cycle, so
   * any other offset would swap which avatar sits under a position — and it
   * is deliberately *not* derived from `index`; see the rebase in paginate()
   * for why it has to lag by one step. */
  const windowLoFor = React.useCallback(
    (i: number) => (Math.floor(i / count) - 1) * count,
    [count]
  );
  const initialWindowLo = windowLoFor(0);

  const [index, setIndex] = React.useState(0);
  const [displayIndex, setDisplayIndex] = React.useState(0);
  const [windowLo, setWindowLo] = React.useState(initialWindowLo);
  const [exiting, setExiting] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);
  const [autoPaused, setAutoPaused] = React.useState(false);
  const [hidden, setHidden] = React.useState(false);
  const animating = React.useRef(false);
  const timeouts = React.useRef<ReturnType<typeof setTimeout>[]>([]);
  /* Read during render so the rebase commit paints without a transition. */
  const snap = React.useRef(false);
  /* Mirrors `windowLo` so paginate() can compare without stale-closure risk. */
  const loRef = React.useRef(initialWindowLo);
  const reducedMotion = usePrefersReducedMotion();

  /* Re-align the window if the list length ever changes. Keyed on `count`
   * alone because `initialWindowLo` is derived from it. */
  React.useEffect(() => {
    loRef.current = initialWindowLo;
    setWindowLo(initialWindowLo);
    snap.current = true;
  }, [count, initialWindowLo]);

  /* Clear the transition-skip flag once its commit has painted. */
  React.useEffect(() => {
    snap.current = false;
  });

  React.useEffect(() => {
    /* Enable column transitions only after first paint so the reel
     * appears at its starting offset without a slide-in. */
    const raf = requestAnimationFrame(() =>
      requestAnimationFrame(() => setMounted(true))
    );
    return () => {
      cancelAnimationFrame(raf);
      timeouts.current.forEach(clearTimeout);
    };
  }, []);

  /* Don't burn a slot cycling through a tab nobody is looking at. */
  React.useEffect(() => {
    const onVis = () => setHidden(document.hidden);
    onVis();
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  const paginate = React.useCallback(
    (dir: 1 | -1) => {
      if (animating.current) return;
      const next = index + dir;
      /* Non-looping reels stop at both ends; a looping one can walk
       * straight off either edge because the window below is periodic. */
      if (!loop && (next < 0 || next >= count)) return;
      animating.current = true;

      setIndex(next);
      setExiting(true);

      timeouts.current.push(
        setTimeout(() => {
          setDisplayIndex(wrap(next, count));
          setExiting(false);
        }, EXIT_MS)
      );
      timeouts.current.push(
        setTimeout(() => {
          animating.current = false;

          /* Re-align the mounted window while the reel is at rest, aiming
           * it at the step the reel is about to move to. Two things matter
           * here.
           *
           * At rest rather than mid-slide: a rebase shifts the content and
           * the transform by the same amount, so the two cancel and the
           * swap is invisible. Rebasing during the transition instead would
           * animate that multi-thousand-pixel offset and the reel would
           * lurch once per loop.
           *
           * One step ahead rather than at `next`: the window lags `index` by
           * definition, so re-basing for the step just taken would leave the
           * incoming tile unmounted and a blank placeholder would slide into
           * the centre. Targeting index+1 keeps the next tile in the DOM for
           * the whole of its slide. */
          const want = windowLoFor(next + 1);
          if (want !== loRef.current) {
            loRef.current = want;
            snap.current = true;
            setWindowLo(want);
          }
        }, SLIDE_MS)
      );
    },
    [index, count, loop, windowLoFor]
  );

  /* Auto-advance. Keyed on `index` so every step — automatic or manual —
   * restarts the countdown, which keeps a click from being followed
   * immediately by a queued auto-advance. Hover, focus, a hidden tab and
   * reduced-motion all hold the reel still. */
  const autoplayActive =
    autoPlayMs > 0 && !autoPaused && !hidden && !reducedMotion;
  React.useEffect(() => {
    if (!autoplayActive) return;
    const t = setTimeout(() => paginate(1), autoPlayMs);
    return () => clearTimeout(t);
  }, [autoplayActive, autoPlayMs, index, paginate]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      paginate(1);
    }
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      paginate(-1);
    }
  };

  /* The middle column renders a fixed two-cycle window. Keys are item
   * positions, which stay put when the window slides, so a rebase reuses
   * the same DOM nodes showing the same avatars — nothing re-decodes. */
  const middleItems = React.useMemo(() => {
    const items: Array<{ type: "cell" } | { type: "featured"; i: number }> = [];
    for (let i = 0; i < LEAD_CELLS; i++) items.push({ type: "cell" });
    for (let s = 0; s < windowSteps; s++) {
      items.push({ type: "featured", i: wrap(windowLo + s, count) });
      if (s < windowSteps - 1) items.push({ type: "cell" }, { type: "cell" });
    }
    for (let i = 0; i < LEAD_CELLS; i++) items.push({ type: "cell" });
    return items;
  }, [count, windowLo, windowSteps]);

  /* Slide by whole pitches so each featured tile lands dead centre. The
   * column is centred in the reel, so translating by the distance from the
   * column's midpoint to the target tile centres that tile. */
  const centerItem = (middleItems.length - 1) / 2;
  const itemAt = (step: number) => LEAD_CELLS + 3 * (step - windowLo);
  const middleY = (centerItem - itemAt(index)) * PITCH;
  const sideY = -middleY;

  /* The side columns translate just as far, so they need enough cells to
   * still cover the viewport once shifted. Sized from the window's own
   * extremes, which keeps the count stable while the reel plays. */
  const sideCellCount = React.useMemo(() => {
    const first = LEAD_CELLS;
    const last = LEAD_CELLS + 3 * (windowSteps - 1);
    const reach = Math.max(
      Math.abs(centerItem - first),
      Math.abs(centerItem - last)
    );
    return 2 * (Math.ceil(reach) + 3) + 2;
  }, [centerItem, windowSteps]);

  const colStyle = (y: number): React.CSSProperties => ({
    transform: `translateY(${y}px)`,
    transition:
      mounted && !snap.current
        ? `transform ${SLIDE_MS}ms ${EASE_INOUT}`
        : "none",
  });

  const current = testimonials[wrap(displayIndex, count)];

  return (
    <div
      role="region"
      aria-roledescription="carousel"
      aria-label="Testimonials"
      tabIndex={0}
      onKeyDown={onKeyDown}
      onMouseEnter={() => setAutoPaused(true)}
      onMouseLeave={() => setAutoPaused(false)}
      onFocus={() => setAutoPaused(true)}
      onBlur={() => setAutoPaused(false)}
      className={cn(
        "relative flex w-full max-w-[1060px] flex-col items-stretch gap-2.5 overflow-hidden rounded-xl border border-border bg-muted shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] outline-none focus-visible:ring-2 focus-visible:ring-ring md:min-h-[320px] md:flex-row",
        className
      )}
    >
      {/* Reel section */}
      <div
        aria-hidden="true"
        className="relative h-56 w-full shrink-0 self-stretch overflow-hidden md:h-auto md:w-[380px]"
        style={{
          WebkitMaskImage:
            "linear-gradient(to right, transparent 0%, black 14%, black 86%, transparent 100%), linear-gradient(to bottom, transparent 0%, black 10%, black 90%, transparent 100%)",
          maskImage:
            "linear-gradient(to right, transparent 0%, black 14%, black 86%, transparent 100%), linear-gradient(to bottom, transparent 0%, black 10%, black 90%, transparent 100%)",
          WebkitMaskComposite: "source-in",
          maskComposite: "intersect",
        }}
      >
        <div className="absolute inset-0 flex items-center justify-center gap-2">
          {/* Left column */}
          <div
            className="flex shrink-0 flex-col gap-2 will-change-transform motion-reduce:[transition:none]!"
            style={colStyle(sideY)}
          >
            {Array.from({ length: sideCellCount }).map((_, i) => (
              <Cell key={i} />
            ))}
          </div>

          {/* Middle column */}
          <div
            className="flex shrink-0 flex-col gap-2 will-change-transform motion-reduce:[transition:none]!"
            style={colStyle(middleY)}
          >
            {middleItems.map((item, i) =>
              item.type === "featured" ? (
                <Featured
                  key={i}
                  src={testimonials[item.i].image}
                  alt={testimonials[item.i].alt}
                  desaturate={desaturate}
                />
              ) : (
                <Cell key={i} />
              )
            )}
          </div>

          {/* Right column */}
          <div
            className="flex shrink-0 flex-col gap-2 will-change-transform motion-reduce:[transition:none]!"
            style={colStyle(sideY)}
          >
            {Array.from({ length: sideCellCount }).map((_, i) => (
              <Cell key={i} />
            ))}
          </div>
        </div>
      </div>

      {/* Content section */}
      <div className="testimonial-content flex min-w-0 flex-1 flex-col self-stretch">
        {/* Text stage. The flex-1 centering column absorbs the free vertical
          * space so the quote sits in the middle of the panel while the
          * controls stay pinned to the bottom. The stage itself is left at
          * its content height so a long quote still sizes the panel instead
          * of being clipped. */}
        <div className="flex w-full flex-1 flex-col justify-center">
          <div
            className="relative w-full max-w-[390px] overflow-hidden"
            aria-live="polite"
          >
            {/* Invisible in-flow copy sizes the stage to the current
              * quote at any viewport width, so wrapped text never clips. */}
            <div
              aria-hidden="true"
              className="testimonial-copy invisible flex min-h-[140px] flex-col"
            >
              <p className={QUOTE_CLASSES}>{current.quote}</p>
              <p className={AUTHOR_CLASSES}>{current.author}</p>
            </div>
            <div
              key={displayIndex}
              className={cn(
                "testimonial-copy absolute inset-x-0 top-0 flex flex-col will-change-[transform,opacity]",
                exiting && "scroll-reel-exit"
              )}
            >
              <p className={QUOTE_CLASSES}>
                <Chars
                  text={current.quote}
                  startIndex={0}
                  staggerMs={charStaggerMs}
                />
              </p>
              <p className={AUTHOR_CLASSES}>
                <Chars
                  text={current.author}
                  startIndex={current.quote.length + 6}
                  staggerMs={charStaggerMs}
                />
              </p>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="testimonial-controls flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => paginate(-1)}
            disabled={!loop && index === 0}
            aria-label="Previous testimonial"
            className="h-11 w-11 cursor-pointer place-items-center rounded-full border border-foreground/15 bg-transparent p-0 text-foreground transition-[opacity,transform] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] hover:enabled:scale-[1.08] active:enabled:scale-[0.94] disabled:cursor-default disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <ChevronLeft
              aria-hidden="true"
              className="h-3 w-3 opacity-70"
              strokeWidth={1.5}
            />
          </button>
          <button
            type="button"
            onClick={() => paginate(1)}
            disabled={!loop && index === count - 1}
            aria-label="Next testimonial"
            className="h-11 w-11 cursor-pointer place-items-center rounded-full border border-foreground/15 bg-transparent p-0 text-foreground transition-[opacity,transform] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] hover:enabled:scale-[1.08] active:enabled:scale-[0.94] disabled:cursor-default disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <ChevronRight
              aria-hidden="true"
              className="h-3 w-3 opacity-70"
              strokeWidth={1.5}
            />
          </button>
        </div>
      </div>
    </div>
  );
}

export default ScrollReelTestimonials;
