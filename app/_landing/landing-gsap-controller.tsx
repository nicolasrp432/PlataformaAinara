"use client"

import { useEffect, useRef } from "react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"

export function LandingGsapController() {
  const progressBarRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Only run on client with window
    if (typeof window === "undefined") return

    // Register ScrollTrigger plugin
    gsap.registerPlugin(ScrollTrigger)

    // Respect reduced motion preference
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (prefersReducedMotion) return

    const ctx = gsap.context(() => {
      // 1. Top Scroll Progress Bar
      if (progressBarRef.current) {
        gsap.to(progressBarRef.current, {
          scaleX: 1,
          ease: "none",
          scrollTrigger: {
            trigger: document.body,
            start: "top top",
            end: "bottom bottom",
            scrub: 0.3,
          },
        })
      }

      // 2. Header luxury glass state on scroll
      const header = document.querySelector(".sales-header")
      if (header) {
        ScrollTrigger.create({
          start: "top -40",
          onUpdate: (self) => {
            if (self.isActive) {
              header.classList.add("header-scrolled")
            } else {
              header.classList.remove("header-scrolled")
            }
          },
        })
      }

      // 3. Trust strip icons & labels stagger
      const trustItems = document.querySelectorAll(".sales-trust-strip span")
      if (trustItems.length > 0) {
        gsap.from(trustItems, {
          y: 20,
          opacity: 0,
          duration: 0.8,
          stagger: 0.15,
          ease: "power2.out",
          scrollTrigger: {
            trigger: ".sales-trust-strip",
            start: "top 88%",
            toggleActions: "play none none reverse",
          },
        })
      }

      // 4. Recognition section (01, 02, 03 cards)
      const recognitionCards = document.querySelectorAll(".sales-recognition > div")
      if (recognitionCards.length > 0) {
        gsap.from(recognitionCards, {
          x: 35,
          opacity: 0,
          duration: 0.85,
          stagger: 0.18,
          ease: "power3.out",
          scrollTrigger: {
            trigger: ".sales-recognition",
            start: "top 82%",
            toggleActions: "play none none reverse",
          },
        })
      }

      // 5. "Dentro de Mitra" 4 Features cards stagger
      const featureCards = document.querySelectorAll(".sales-features > div")
      if (featureCards.length > 0) {
        gsap.from(featureCards, {
          y: 35,
          opacity: 0,
          scale: 0.96,
          duration: 0.8,
          stagger: 0.14,
          ease: "power2.out",
          scrollTrigger: {
            trigger: ".sales-features",
            start: "top 82%",
            toggleActions: "play none none reverse",
          },
        })
      }

      // 6. Formations catalogue cards
      const courseCards = document.querySelectorAll(".sales-course")
      if (courseCards.length > 0) {
        gsap.from(courseCards, {
          y: 40,
          opacity: 0,
          scale: 0.95,
          duration: 0.9,
          stagger: 0.15,
          ease: "power3.out",
          scrollTrigger: {
            trigger: ".sales-course-grid",
            start: "top 85%",
            toggleActions: "play none none reverse",
          },
        })
      }

      // 7. Mentor steps in Ainara section
      const mentorSteps = document.querySelectorAll(".sales-mentor-steps > div")
      if (mentorSteps.length > 0) {
        gsap.from(mentorSteps, {
          x: 30,
          opacity: 0,
          duration: 0.8,
          stagger: 0.16,
          ease: "power2.out",
          scrollTrigger: {
            trigger: ".sales-mentor-steps",
            start: "top 80%",
            toggleActions: "play none none reverse",
          },
        })
      }

      // 8. Testimonials cards stagger
      const testimonials = document.querySelectorAll(".sales-section .ainara-panel")
      if (testimonials.length > 0) {
        gsap.from(testimonials, {
          y: 30,
          opacity: 0,
          scale: 0.96,
          duration: 0.8,
          stagger: 0.15,
          ease: "power2.out",
          scrollTrigger: {
            trigger: testimonials[0].parentElement,
            start: "top 85%",
            toggleActions: "play none none reverse",
          },
        })
      }

      // 9. Pricing cards stagger with special emphasis on featured
      const priceCards = document.querySelectorAll(".sales-price-card")
      if (priceCards.length > 0) {
        gsap.from(priceCards, {
          y: 45,
          opacity: 0,
          duration: 0.85,
          stagger: 0.18,
          ease: "power3.out",
          scrollTrigger: {
            trigger: ".sales-pricing",
            start: "top 80%",
            toggleActions: "play none none reverse",
          },
        })
      }

      // 10. Final CTA glow expansion on scroll
      const finalSection = document.querySelector(".sales-final")
      if (finalSection) {
        gsap.from(finalSection, {
          scale: 0.94,
          opacity: 0.6,
          duration: 1,
          ease: "power2.out",
          scrollTrigger: {
            trigger: finalSection,
            start: "top 85%",
            toggleActions: "play none none reverse",
          },
        })
      }
    })

    return () => {
      ctx.revert()
    }
  }, [])

  return (
    <div
      ref={progressBarRef}
      className="pointer-events-none fixed top-0 left-0 right-0 z-50 h-[3px] origin-left bg-gradient-to-r from-amber-400 via-[#F6D25C] to-[#FFE885] shadow-[0_0_10px_#F6D25C]"
      style={{ transform: "scaleX(0)" }}
      aria-hidden="true"
    />
  )
}
