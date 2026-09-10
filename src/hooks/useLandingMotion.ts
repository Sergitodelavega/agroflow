import { type RefObject, useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const DESKTOP_MQ = "(min-width: 768px)";
const REDUCE_MQ = "(prefers-reduced-motion: reduce)";
const GUTTER = 48;
const EDGE = 24;
const CORNER = 1.45;

function canAnimate() {
  return (
    window.matchMedia(DESKTOP_MQ).matches &&
    !window.matchMedia(REDUCE_MQ).matches
  );
}

function isRendered(el: HTMLElement) {
  const box = el.getBoundingClientRect();
  return box.width > 0 && box.height > 0;
}

export function useLandingMotion(rootRef: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const desktop = window.matchMedia(DESKTOP_MQ);
    const reduce = window.matchMedia(REDUCE_MQ);
    let ctx: gsap.Context | null = null;
    let startTimer = 0;
    let resizeTimer = 0;
    let heroMin: HTMLElement | null = null;

    const teardown = () => {
      window.clearTimeout(startTimer);
      window.clearTimeout(resizeTimer);
      ctx?.revert();
      ctx = null;
      heroMin?.style.removeProperty("min-height");
      heroMin = null;
    };

    const run = () => {
      ctx?.revert();
      ctx = null;
      if (!canAnimate() || !rootRef.current) return;

      const hero = root.querySelector<HTMLElement>("#accueil");
      const origin = root.querySelector<HTMLElement>("[data-landing-orbit-origin]");
      const keepoutEl =
        root.querySelector<HTMLElement>("[data-landing-orbit-keepout]") ?? origin;
      if (!hero || !origin || !keepoutEl) return;

      ctx = gsap.context(() => {
        const wideDesktop = window.matchMedia("(min-width: 1200px)").matches;
        const MIN_TILE = wideDesktop ? 96 : 72;

        const layout = () => {
          const heroBox = hero.getBoundingClientRect();
          const keepoutBox = keepoutEl.getBoundingClientRect();
          const ox = keepoutBox.left + keepoutBox.width / 2;
          const oy = keepoutBox.top + keepoutBox.height / 2;
          const tiles = [...root.querySelectorAll<HTMLElement>("[data-landing-tile]")].filter(
            isRendered,
          );
          const halfTile = tiles.reduce((max, tile) => {
            const box = tile.getBoundingClientRect();
            return Math.max(max, box.width / 2, box.height / 2);
          }, 0);
          return {
            tiles,
            keepW: keepoutBox.width / 2,
            keepH: keepoutBox.height / 2,
            halfTile,
            originLeft: ox - heroBox.left - hero.clientLeft,
            originTop: oy - heroBox.top - hero.clientTop,
            roomX: Math.min(ox - heroBox.left, heroBox.right - ox),
            roomY: Math.min(oy - heroBox.top, heroBox.bottom - oy),
            heroH: heroBox.height,
          };
        };

        let { tiles, keepW, keepH, halfTile, originLeft, originTop, roomX, roomY, heroH } =
          layout();
        if (tiles.length === 0) return;

        const ringFor = (half: number, kw = keepW, kh = keepH) => ({
          rx: (kw + GUTTER + half) * CORNER,
          ry: (kh + GUTTER + half) * CORNER,
        });
        const fits = (half: number, rx: number, ry: number, xRoom: number, yRoom: number) =>
          rx + half + EDGE <= xRoom && ry + half + EDGE <= yRoom;

        const preferred = ringFor(halfTile);
        const minH = Math.ceil((preferred.ry + halfTile + EDGE) * 2);
        if (heroH < minH) {
          hero.style.minHeight = `${minH}px`;
          heroMin = hero;
          ({ tiles, keepW, keepH, halfTile, originLeft, originTop, roomX, roomY } = layout());
        }

        const naturalHalf = halfTile;
        let tileScale = 1;
        while (halfTile > MIN_TILE / 2) {
          const next = ringFor(halfTile);
          if (fits(halfTile, next.rx, next.ry, roomX, roomY)) break;
          tileScale *= 0.94;
          halfTile = Math.max(MIN_TILE / 2, naturalHalf * tileScale);
        }
        tileScale = halfTile / naturalHalf;

        const { rx, ry } = ringFor(halfTile);
        const slot = (Math.PI * 2) / tiles.length;
        const turn = { a: 0 };

        // Neutralize collage seats: every tile is pinned to the keepout center.
        // Orbit is then a pure x/y from that shared origin — same rx/ry for all.
        tiles.forEach((tile) => {
          gsap.set(tile, {
            left: originLeft,
            top: originTop,
            right: "auto",
            bottom: "auto",
            xPercent: -50,
            yPercent: -50,
            x: 0,
            y: 0,
            scale: tileScale,
            rotation: 0,
            transformOrigin: "50% 50%",
          });
        });

        gsap.to(turn, {
          a: -Math.PI * 2,
          duration: 52,
          ease: "none",
          repeat: -1,
          onUpdate: () => {
            tiles.forEach((tile, i) => {
              const angle = -Math.PI / 2 + i * slot + turn.a;
              gsap.set(tile, {
                x: rx * Math.cos(angle),
                y: ry * Math.sin(angle),
                xPercent: -50,
                yPercent: -50,
                scale: tileScale,
                rotation: 0,
              });
            });
          },
        });

        root.querySelectorAll<HTMLElement>("[data-landing-reveal]").forEach((section) => {
          gsap.from(section, {
            y: 32,
            opacity: 0,
            duration: 0.85,
            ease: "power2.out",
            immediateRender: false,
            scrollTrigger: {
              trigger: section,
              start: "top 84%",
              once: true,
            },
          });
        });
      }, root);

      ScrollTrigger.refresh();
    };

    const setup = (delay = 280) => {
      teardown();
      if (!canAnimate()) return;
      startTimer = window.setTimeout(run, delay);
    };

    const onBreakpoint = () => setup(0);
    const onResize = () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => setup(0), 180);
    };

    setup(280);
    desktop.addEventListener("change", onBreakpoint);
    reduce.addEventListener("change", onBreakpoint);
    window.addEventListener("resize", onResize);

    return () => {
      desktop.removeEventListener("change", onBreakpoint);
      reduce.removeEventListener("change", onBreakpoint);
      window.removeEventListener("resize", onResize);
      teardown();
    };
  }, [rootRef]);
}

export default useLandingMotion;
