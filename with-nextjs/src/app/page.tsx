"use client";

import { useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";
import { Draggable } from "gsap/all";
import Link from "next/link";

// Register Draggable plugin
if (typeof window !== "undefined") {
  gsap.registerPlugin(Draggable);
}

export default function Home() {
  const menuDropZoneRef = useRef<HTMLDivElement>(null);
  const menuDrawerRef = useRef<HTMLDivElement>(null);
  const menuLogoRef = useRef<HTMLDivElement>(null);
  const menuItemsRef = useRef<HTMLDivElement>(null);
  const menuTogglerRef = useRef<HTMLDivElement>(null);
  const menuItemElementsRef = useRef<HTMLDivElement[]>([]);

  // State
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const isMenuOpenRef = useRef(false); // To access state in GSAP callbacks

  // Constants to match original CSS/JS logic
  const DRAWER_GAP = 0.35 * 16; // 0.35rem in pixels
  const DRAWER_PADDING = 0.35 * 16; // 0.35rem in pixels
  const SNAP_THRESHOLD = 200;

  // Refs for measurements
  const menuItemsFullWidthRef = useRef(0);
  const closedMenuWidthRef = useRef(0);
  const openMenuWidthRef = useRef(0);

  useLayoutEffect(() => {
    // Context for GSAP scoped selector
    const ctx = gsap.context(() => {
      // Elements
      const menuDropZone = menuDropZoneRef.current;
      const menuDrawer = menuDrawerRef.current;
      const menuLogo = menuLogoRef.current;
      const menuItems = menuItemsRef.current;
      const menuToggler = menuTogglerRef.current;

      // Collect menu item elements
      const items = gsap.utils.toArray(".menu-item-el") as HTMLDivElement[];
      menuItemElementsRef.current = items;

      if (
        !menuDropZone ||
        !menuDrawer ||
        !menuLogo ||
        !menuItems ||
        !menuToggler
      )
        return;

      // 1. Measure initial widths
      // We temporarily unset the width:0 to measure if needed, but since we start with full content in DOM
      // (controlled by CSS for initial render), we can measure.
      // However, if we style it as width:0 initially in JSX to prevent FOUC, we need to temporarily show it.
      // Let's assume natural width is available or use 'auto' then set to 0.

      // Reset to auto for measurement
      gsap.set(menuItems, { width: "auto", marginRight: 0 });
      const itemsWidth = menuItems.offsetWidth;
      menuItemsFullWidthRef.current = itemsWidth;

      const logoWidth = menuLogo.offsetWidth;
      const togglerWidth = menuToggler.offsetWidth;

      closedMenuWidthRef.current =
        DRAWER_PADDING + logoWidth + DRAWER_GAP + togglerWidth + DRAWER_PADDING;
      openMenuWidthRef.current =
        DRAWER_PADDING +
        logoWidth +
        DRAWER_GAP +
        itemsWidth +
        DRAWER_GAP +
        togglerWidth +
        DRAWER_PADDING;

      // 2. Set initial GSAP state
      gsap.set(menuItems, { width: 0, marginRight: 0 });
      gsap.set(items, { opacity: 0, scale: 0.85 });
      gsap.set(menuDropZone, { width: closedMenuWidthRef.current, opacity: 0 });

      // 3. Create Draggable
      Draggable.create(menuDrawer, {
        type: "x,y",
        bounds: window,
        cursor: "grab",
        activeCursor: "grabbing", // Note: Tailwind overrides might conflict if not careful
        onDragStart: function () {
          const activeWidth = isMenuOpenRef.current
            ? openMenuWidthRef.current
            : closedMenuWidthRef.current;
          gsap.set(menuDropZone, { width: activeWidth });
        },
        onDrag: function () {
          const isMenuWithinSnapZone =
            Math.abs(this.x) < SNAP_THRESHOLD &&
            Math.abs(this.y) < SNAP_THRESHOLD;
          if (isMenuWithinSnapZone) {
            gsap.to(menuDropZone, { opacity: 1, duration: 0.1 });
          } else {
            gsap.to(menuDropZone, { opacity: 0, duration: 0.1 });
          }
        },
        onDragEnd: function () {
          gsap.to(menuDropZone, { opacity: 0, duration: 0.1 });
          const isMenuWithinSnapZone =
            Math.abs(this.x) < SNAP_THRESHOLD &&
            Math.abs(this.y) < SNAP_THRESHOLD;
          if (isMenuWithinSnapZone) {
            gsap.to(menuDrawer, {
              x: 0,
              y: 0,
              duration: 0.3,
              ease: "power2.out",
            });
          }
        },
      });
    }, menuDrawerRef); // Scope to menuDrawer if comfortable

    return () => ctx.revert();
  }, [DRAWER_GAP, DRAWER_PADDING]);

  const toggleMenu = () => {
    const nextState = !isMenuOpen;
    setIsMenuOpen(nextState);
    isMenuOpenRef.current = nextState;

    const menuItems = menuItemsRef.current;
    const items = menuItemElementsRef.current;

    if (!menuItems) return;

    if (nextState) {
      // Open
      menuTogglerRef.current?.classList.add("close");
      gsap.to(menuItems, {
        width: menuItemsFullWidthRef.current,
        marginRight: DRAWER_GAP,
        duration: 0.5,
        ease: "power3.inOut",
        onStart: () => {
          gsap.to(items, {
            opacity: 1,
            scale: 1,
            duration: 0.3,
            stagger: 0.05,
            delay: 0.2, // slight delay to match expansion
            ease: "power3.out",
          });
        },
      });
    } else {
      // Close
      menuTogglerRef.current?.classList.remove("close");
      gsap.to(menuItems, {
        width: 0,
        marginRight: 0,
        duration: 0.5,
        ease: "power3.inOut",
        onStart: () => {
          gsap.to(items, {
            opacity: 0,
            scale: 0.85,
            duration: 0.3,
            ease: "power3.out",
            stagger: {
              each: 0.05,
              from: "end",
            },
          });
        },
      });
    }
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-[#fafafa]">
      {/* Font Import */}
      <style jsx global>{`
        @import url("https://fonts.googleapis.com/css2?family=Google+Sans:ital,opsz,wght@0,17..18,400..700;1,17..18,400..700&display=swap");
        body {
          font-family: "Google Sans", sans-serif;
          margin: 0;
          padding: 0;
        }
      `}</style>

      {/* Drop Zone */}
      <div
        ref={menuDropZoneRef}
        className="fixed top-40 left-72 h-[4.2rem] border-[0.075rem] border-dashed border-black/50 rounded-[4rem] pointer-events-none opacity-0 z-0"
      ></div>

      {/* Menu Drawer */}
      <div
        ref={menuDrawerRef}
        //bg-[#e8e6e7]
        // before top-8 left-8
        className="fixed top-40 left-72 p-[0.35rem] bg-[#e8e6e7] rounded-[4rem] flex items-center z-50 touch-none shadow-xl"
      >
        {/* Logo */}
        <div
          ref={menuLogoRef}
          className="w-24 h-12 rounded-[4rem] flex justify-center items-center shrink-0 bg-white/20 select-none pointer-events-none"
        >
          {/* Replaced img with text for stability */}
          <span className="font-bold text-lg text-[#0f0f0f]">Logo</span>
        </div>

        {/* Menu Items Container */}
        <div
          ref={menuItemsRef}
          className="flex gap-[0.35rem] overflow-hidden "
          style={{ width: 0 }} // Initial inline style to prevent FOUC before GSAP takes over
        >
          {["Work", "Manifesto", "Contact"].map((item) => (
            <div
              key={item}
              className="menu-item-el w-max h-14 bg-[#fafafa] rounded-[4rem] flex items-center justify-center shrink-0 opacity-0"
            >
              <Link
                href="#"
                // before px-6 now px-5.5
                className="no-underline text-[#0f0f0f] font-medium tracking-tight px-[20px] select-none whitespace-nowrap"
              >
                {item}
              </Link>
            </div>
          ))}
        </div>

        {/* Menu Toggler */}
        <div
          ref={menuTogglerRef}
          onClick={toggleMenu}
          className="relative w-14 h-14 p-4.5 bg-[#d3d2d2] rounded-[4rem] flex flex-col justify-center items-center gap-[0.2rem] shrink-0 cursor-pointer"
        >
          <span
            className={`block w-full h-0.5 bg-[#0f0f0f] transition-transform duration-300 ease-in-out origin-center ${isMenuOpen ? "rotate-45 translate-y-[0.16rem] scale-90" : ""}`}
          ></span>
          <span
            className={`block w-full h-0.5 bg-[#0f0f0f] transition-transform duration-300 ease-in-out origin-center ${isMenuOpen ? "-rotate-45 -translate-y-[0.16rem] scale-90" : ""}`}
          ></span>
        </div>
      </div>
    </div>
  );
}
