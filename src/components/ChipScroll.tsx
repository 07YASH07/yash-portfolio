"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { useScroll, useTransform, motion, useMotionValueEvent } from "framer-motion";

function getFramePath(id: string) {
  const padded = id.padStart(3, "0");
  return `/sequence/ezgif-frame-${padded}.jpg`;
}

export default function ChipScroll({ frameIds }: { frameIds: string[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const imagesRef = useRef<Map<string, HTMLImageElement>>(new Map());
  const rafRef = useRef<number | undefined>(undefined);

  const totalFrames = frameIds.length;

  // Reset scroll to top on mount and disable browser scroll restoration
  useEffect(() => {
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
    window.scrollTo(0, 0);
  }, []);

  // Preload all sequence images
  useEffect(() => {
    if (frameIds.length === 0) {
      setLoadError("No sequence frames found in public/sequence");
      return;
    }

    const loadPromises = frameIds.map((id) => {
      return new Promise<void>((resolve, reject) => {
        const img = new Image();
        img.loading = "eager";
        img.decoding = "async";
        img.onload = () => {
          imagesRef.current.set(id, img);
          resolve();
        };
        img.onerror = () => reject(new Error(`Failed to load frame ${id}`));
        img.src = getFramePath(id);
      });
    });

    Promise.all(loadPromises)
      .then(() => setImagesLoaded(true))
      .catch((err) => setLoadError(err.message));

    return () => {
      imagesRef.current.clear();
    };
  }, [frameIds]);

  const { scrollYProgress } = useScroll();

  const frameIndex = useTransform(
    scrollYProgress,
    [0, 1],
    [0, Math.max(totalFrames - 1, 0)]
  );

  const drawFrame = useCallback(
    (index: number) => {
      const canvas = canvasRef.current;
      if (!canvas || !imagesLoaded || totalFrames === 0) return;

      const clampedIndex = Math.min(
        Math.max(Math.floor(index), 0),
        totalFrames - 1
      );
      const frameId = frameIds[clampedIndex];
      const img = imagesRef.current.get(frameId);

      if (!img) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;

      if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
        canvas.width = w * dpr;
        canvas.height = h * dpr;
        ctx.scale(dpr, dpr);
      }

      ctx.fillStyle = "#050505";
      ctx.fillRect(0, 0, w, h);

      const imgAspect = img.width / img.height;
      const canvasAspect = w / h;

      let drawW: number, drawH: number, drawX: number, drawY: number;

      if (imgAspect > canvasAspect) {
        drawH = h;
        drawW = img.width * (h / img.height);
        drawX = (w - drawW) / 2;
        drawY = 0;
      } else {
        drawW = w;
        drawH = img.height * (w / img.width);
        drawX = 0;
        drawY = (h - drawH) / 2;
      }

      ctx.drawImage(img, drawX, drawY, drawW, drawH);
    },
    [imagesLoaded, totalFrames, frameIds]
  );

  useMotionValueEvent(frameIndex, "change", (latest) => {
    if (imagesLoaded) {
      rafRef.current = requestAnimationFrame(() => drawFrame(latest));
    }
  });

  useEffect(() => {
    if (!imagesLoaded || totalFrames === 0) return;

    const initial = frameIndex.get();
    drawFrame(initial);

    const handleResize = () => {
      drawFrame(frameIndex.get());
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [imagesLoaded, drawFrame, frameIndex, totalFrames]);

  // Text overlay: opacity 0→1, translateY 40px→0 (ease-out entrance)
  const heroOpacity = useTransform(scrollYProgress, [0, 0.12], [1, 0]);
  const heroY = useTransform(scrollYProgress, [0, 0.12], [0, 40]);

  const skillsOpacity = useTransform(scrollYProgress, [0.15, 0.25, 0.35, 0.45], [0, 1, 1, 0]);
  const skillsY = useTransform(scrollYProgress, [0.15, 0.25, 0.35, 0.45], [40, 0, 0, -24]);

  const experienceOpacity = useTransform(scrollYProgress, [0.4, 0.5, 0.6, 0.7], [0, 1, 1, 0]);
  const experienceY = useTransform(scrollYProgress, [0.4, 0.5, 0.6, 0.7], [40, 0, 0, -24]);

  const projectsOpacity = useTransform(scrollYProgress, [0.65, 0.75, 0.82, 0.92], [0, 1, 1, 0]);
  const projectsY = useTransform(scrollYProgress, [0.65, 0.75, 0.82, 0.92], [40, 0, 0, -24]);

  const contactOpacity = useTransform(scrollYProgress, [0.88, 0.95, 1], [0, 1, 1]);
  const contactY = useTransform(scrollYProgress, [0.88, 0.95, 1], [40, 0, 0]);

  if (loadError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#050505]">
        <p className="px-4 text-center text-white/60">Failed to load animation: {loadError}</p>
      </div>
    );
  }

  if (totalFrames === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#050505]">
        <p className="text-white/60">No sequence frames found. Add images to public/sequence.</p>
      </div>
    );
  }

  return (
    <>
      {!imagesLoaded && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#050505]">
          <div className="flex flex-col items-center gap-6">
            <div className="h-12 w-12 animate-spin rounded-full border-2 border-white/20 border-t-white/90" />
            <p className="text-white/60">Loading portfolio...</p>
          </div>
        </div>
      )}

      <div
        className="relative h-[400vh] w-full"
        style={{ background: "radial-gradient(circle at center, #0a0a0a 0%, #050505 70%)" }}
      >
        <div className="sticky top-0 flex h-screen w-full items-center justify-center overflow-hidden">
          <canvas
            ref={canvasRef}
            className="h-full w-full max-h-screen object-contain"
            style={{ objectFit: "contain" }}
          />
        </div>
      </div>

      {/* Gradient overlay for text readability */}
      <div
        className="pointer-events-none fixed inset-0 z-10 bg-gradient-to-b from-black/60 via-black/30 to-transparent"
        aria-hidden
      />

      {/* Subtle particle/dot background */}
      <div className="pointer-events-none fixed inset-0 z-[11] particle-bg opacity-50" aria-hidden />

      <div className="pointer-events-none fixed inset-0 z-20 flex items-center justify-center px-4 sm:px-6 md:px-8">
        {/* 1. Hero / Profile */}
        <motion.div
          style={{ opacity: heroOpacity, y: heroY }}
          transition={{ ease: "easeOut" }}
          className="absolute inset-0 flex flex-col items-center justify-center"
        >
          <div className="max-w-4xl mx-auto px-6 w-full">
            <div className="backdrop-blur-lg bg-white/5 border border-white/10 rounded-2xl shadow-xl p-8 sm:p-10 md:p-12 text-center">
              <h1 className="text-4xl font-semibold tracking-tight text-white/90 md:text-6xl drop-shadow-[0_0_30px_rgba(255,255,255,0.15)]">
                Yash Verma
              </h1>
              <p className="mt-3 text-lg text-white/60 md:text-xl leading-relaxed">
                Designing Intelligent Systems. Automating the Future.
              </p>
              <p className="mt-6 text-lg text-white/60 md:text-xl max-w-2xl mx-auto leading-relaxed">
                Software Engineer specializing in web automation, API integrations, and secure system design.
                Focused on building scalable digital solutions that are efficient, reliable, and secure.
              </p>
            </div>
          </div>
        </motion.div>

        {/* 2. Skills — What I Build (4 cards) */}
        <motion.div
          style={{ opacity: skillsOpacity, y: skillsY }}
          transition={{ ease: "easeOut" }}
          className="absolute inset-0 flex flex-col items-center justify-center overflow-y-auto py-8"
        >
          <div className="max-w-4xl mx-auto px-6 w-full">
            <h2 className="text-4xl font-semibold tracking-tight text-white/90 md:text-6xl text-center">
              What I Build
            </h2>
            <p className="mt-2 text-center text-lg text-white/60 md:text-xl mb-8">
              Modern, scalable, AI-powered digital systems.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              {[
                {
                  title: "AI-Powered Applications",
                  tags: ["OpenAI API Integrations", "Grok / LLM-based Workflows", "Prompt Engineering", "AI-driven Automation"],
                },
                {
                  title: "Full-Stack Web Systems",
                  tags: ["Next.js • React • Node.js", "REST APIs & Backend Services", "Database Integration", "Responsive UI Systems"],
                },
                {
                  title: "Automation Engineering",
                  tags: ["Workflow Automation (n8n)", "API Integrations", "System Process Optimization", "Event-driven Logic"],
                },
                {
                  title: "DevOps & Secure Infrastructure",
                  tags: ["CI/CD Pipelines", "GitHub Actions", "Deployment Workflows", "ISO 27001 Practices", "SOC 2 Readiness Support"],
                },
              ].map((card, i) => (
                <div
                  key={i}
                  className="backdrop-blur-lg bg-white/5 border border-white/10 rounded-2xl p-6 transition-all duration-300 hover:-translate-y-[6px] hover:shadow-[0_0_30px_rgba(255,255,255,0.1)]"
                >
                  <p className="text-xl font-semibold text-white/90">{card.title}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {card.tags.map((tag, j) => (
                      <span
                        key={j}
                        className="px-3 py-1 text-sm rounded-full bg-white/10 text-white/70"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* 3. Experience — timeline style */}
        <motion.div
          style={{ opacity: experienceOpacity, y: experienceY }}
          transition={{ ease: "easeOut" }}
          className="absolute inset-0 flex flex-col items-center justify-center"
        >
          <div className="max-w-4xl mx-auto px-6 w-full">
            <div className="backdrop-blur-lg bg-white/5 border border-white/10 rounded-2xl shadow-xl p-8 sm:p-10 md:p-12">
              <h2 className="text-4xl font-semibold tracking-tight text-white/90 md:text-6xl mb-8">
                Professional Experience
              </h2>
              <div className="space-y-8">
                <div className="relative pl-6 border-l-2 border-white/20">
                  <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-white/40" />
                  <p className="text-xl font-medium text-white/90">Software Engineer — Web Automation</p>
                  <p className="mt-2 text-lg text-white/60 md:text-xl leading-relaxed">
                    Building scalable systems, automating workflows, integrating APIs, and contributing to security compliance initiatives.
                  </p>
                </div>
                <div className="relative pl-6 border-l-2 border-white/20">
                  <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-white/40" />
                  <p className="text-xl font-medium text-white/90">Website Developer — Inventory Platform</p>
                  <p className="mt-2 text-lg text-white/60 md:text-xl leading-relaxed">
                    Developed a full-stack inventory system with dashboards, tracking, and backend automation.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* 4. Projects — large cards */}
        <motion.div
          style={{ opacity: projectsOpacity, y: projectsY }}
          transition={{ ease: "easeOut" }}
          className="absolute inset-0 flex flex-col items-center justify-center overflow-y-auto py-8"
        >
          <div className="max-w-4xl mx-auto px-6 w-full">
            <h2 className="text-4xl font-semibold tracking-tight text-white/90 md:text-6xl text-center mb-8">
              Selected Work
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
              <div className="backdrop-blur-lg bg-white/5 border border-white/10 rounded-2xl shadow-xl overflow-hidden transition-all duration-300 hover:shadow-[0_0_40px_rgba(255,255,255,0.08)]">
                <div className="h-32 bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center">
                  <span className="text-white/30 text-sm">Project Preview</span>
                </div>
                <div className="p-6 md:p-8">
                  <p className="text-xl font-medium text-white/90 md:text-2xl">AI Health Assistant</p>
                  <p className="mt-3 text-lg text-white/60 md:text-xl leading-relaxed">
                    AI-driven healthcare support platform with intelligent interaction flows.
                  </p>
                </div>
              </div>
              <div className="backdrop-blur-lg bg-white/5 border border-white/10 rounded-2xl shadow-xl overflow-hidden transition-all duration-300 hover:shadow-[0_0_40px_rgba(255,255,255,0.08)]">
                <div className="h-32 bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center">
                  <span className="text-white/30 text-sm">Project Preview</span>
                </div>
                <div className="p-6 md:p-8">
                  <p className="text-xl font-medium text-white/90 md:text-2xl">Inventory Management System</p>
                  <p className="mt-3 text-lg text-white/60 md:text-xl leading-relaxed">
                    IT asset tracking platform with smart filtering, dashboards, and automation features.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* 5. Contact — creative section */}
        <motion.div
          style={{ opacity: contactOpacity, y: contactY }}
          transition={{ ease: "easeOut" }}
          className="absolute inset-0 flex flex-col items-center justify-center"
        >
          <div className="max-w-4xl mx-auto px-6 w-full">
            <div className="backdrop-blur-lg bg-white/5 border border-white/10 rounded-2xl shadow-xl p-8 sm:p-10 md:p-12 text-center">
              <h2 className="text-4xl font-semibold tracking-tight text-white/90 md:text-6xl">
                Let's Build Something Impactful
              </h2>
              <p className="mt-4 text-lg text-white/60 md:text-xl leading-relaxed">
                Open to opportunities, collaborations, and innovative tech projects.
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-4 text-lg text-white/60 md:text-xl">
                <span className="flex items-center gap-2">📧 yashverma2162826@gmail.com</span>
                <span className="flex items-center gap-2">📱 +91-7217504548</span>
                <a
                  href="https://www.linkedin.com/in/yash-verma-82a963241/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="pointer-events-auto flex items-center gap-2 text-white/70 hover:text-white/90 transition-colors"
                >
                  🔗 LinkedIn
                </a>
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="pointer-events-auto flex items-center gap-2 text-white/70 hover:text-white/90 transition-colors"
                >
                  💻 GitHub
                </a>
                <span className="flex items-center gap-2">📍 India</span>
              </div>
              <div className="mt-10 flex flex-wrap gap-4 justify-center">
                <a
                  href="mailto:yashverma2162826@gmail.com"
                  className="pointer-events-auto cta-glow rounded-full border border-white/20 bg-white/5 px-6 py-3 text-base font-medium text-white/90 backdrop-blur-sm transition-all hover:bg-white/10 shadow-[0_0_20px_rgba(255,255,255,0.15)]"
                >
                  Email Me
                </a>
                <a
                  href="https://www.linkedin.com/in/yash-verma-82a963241/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="pointer-events-auto cta-glow rounded-full border border-white/20 bg-white/5 px-6 py-3 text-base font-medium text-white/90 backdrop-blur-sm transition-all hover:bg-white/10 shadow-[0_0_20px_rgba(255,255,255,0.15)]"
                >
                  View LinkedIn
                </a>
                <a
                  href="/Yash_verma_Resume_.pdf"
                  download
                  target="_blank"
                  rel="noopener noreferrer"
                  className="pointer-events-auto cta-glow rounded-full border border-white/20 bg-white/5 px-6 py-3 text-base font-medium text-white/90 backdrop-blur-sm transition-all hover:bg-white/10 shadow-[0_0_20px_rgba(255,255,255,0.15)]"
                >
                  Download Resume
                </a>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </>
  );
}
