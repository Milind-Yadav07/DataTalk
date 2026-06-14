'use client';

import { useState, useRef } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { FaGithub, FaLinkedin } from 'react-icons/fa';

gsap.registerPlugin(ScrollTrigger);

const steps = [
  {
    heading: 'Upload your dataset',
    description: 'Securely upload your files or connect to your data sources with enterprise-grade encryption.',
    image: '/upload.svg',
  },
  {
    heading: 'Ask questions in plain English',
    description: 'Ask questions in plain English. Our AI understands your data context, business logic, and relationships instantly.',
    image: '/ask.svg',
  },
  {
    heading: 'Visualize trends instantly',
    description: 'Get instant charts, summaries, and executive reports that you can customize and share with your team.',
    image: '/visualize.svg',
  },
  {
    heading: 'Download the Visualization',
    description: 'Download instant charts, summaries, and executive reports that you can customize and share.',
    image: '/download.svg',
  },
];

export default function HomePage() {
  const { data: session } = useSession();
  const userName = session?.user?.name || 'User';

  const [activeStep, setActiveStep] = useState(0);
  const [hasEntered, setHasEntered] = useState(false);

  const sectionRef = useRef<HTMLDivElement>(null);
  const autoplayCallRef = useRef<gsap.core.Tween | null>(null);

  // ScrollTrigger to detect when user enters section
  useGSAP(() => {
    if (!sectionRef.current) return;
    const mainEl = document.querySelector('main');
    if (!mainEl) return;

    gsap.registerPlugin(ScrollTrigger);

    const trigger = ScrollTrigger.create({
      trigger: sectionRef.current,
      scroller: mainEl,
      start: 'top 75%',
      onEnter: () => {
        setHasEntered(true);
      },
    });

    return () => {
      trigger.kill();
    };
  }, { scope: sectionRef });

  // Autoplay timer
  useGSAP(() => {
    if (!hasEntered) return;

    // Kill any existing timer
    if (autoplayCallRef.current) {
      autoplayCallRef.current.kill();
    }

    // Schedule the next step after 5 seconds
    autoplayCallRef.current = gsap.delayedCall(5, () => {
      setActiveStep((prev) => (prev + 1) % steps.length);
    });

    return () => {
      autoplayCallRef.current?.kill();
    };
  }, { scope: sectionRef, dependencies: [activeStep, hasEntered] });

  // Accordion content height/opacity animation
  useGSAP(() => {
    const contents = sectionRef.current?.querySelectorAll('.accordion-content');
    contents?.forEach((content, index) => {
      if (index === activeStep) {
        gsap.to(content, {
          height: 'auto',
          opacity: 1,
          duration: 0.5,
          ease: 'power2.out',
        });
      } else {
        gsap.to(content, {
          height: 0,
          opacity: 0,
          duration: 0.4,
          ease: 'power2.inOut',
        });
      }
    });
  }, { scope: sectionRef, dependencies: [activeStep] });

  // Image fade/scale cross-fade animation
  useGSAP(() => {
    const images = sectionRef.current?.querySelectorAll('.step-image');
    images?.forEach((img, index) => {
      if (index === activeStep) {
        gsap.to(img, {
          opacity: 1,
          scale: 1,
          zIndex: 10,
          duration: 0.5,
          ease: 'power2.out',
        });
      } else {
        gsap.to(img, {
          opacity: 0,
          scale: 0.95,
          zIndex: 0,
          duration: 0.5,
          ease: 'power2.out',
        });
      }
    });
  }, { scope: sectionRef, dependencies: [activeStep] });

  const handleStepClick = (index: number) => {
    setActiveStep(index);
  };

  return (
    <div className="-m-6 flex flex-col">
      {/* Section 1: Hero Landing */}
      <section
        className="w-full h-[calc(100vh-150px)] bg-cover bg-center bg-no-repeat flex items-center justify-start px-8 md:px-16 lg:px-24 relative overflow-hidden"
        style={{
          backgroundImage: "linear-gradient(to right, rgba(15, 23, 42, 0.95) 45%, rgba(15, 23, 42, 0.3) 100%), url('/homeimage.png')"
        }}
      >
        {/* Subtle top ambient glow */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#86BC25]/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-2xl text-left border-l-[6px] border-[#86BC25] pl-6 md:pl-10 py-4 relative z-10">
          {/* Welcome Tag with Solid Green Dot */}
          <div className="inline-flex items-center gap-2 bg-slate-900/90 border border-slate-800 rounded-full px-3 py-1.5 text-xs font-semibold text-slate-300 mb-6 backdrop-blur-md select-none">
            <span className="h-2 w-2 rounded-full bg-[#86BC25]"></span>
            <span className="tracking-wide">Welcome, {userName}</span>
          </div>

          {/* Heading */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight mb-6 leading-[1.15]">
            Talk to your Data<span className="text-[#86BC25] font-black">.</span>
          </h1>

          {/* Description */}
          <p className="text-slate-300 text-lg sm:text-xl font-light leading-relaxed mb-8 max-w-xl">
            Upload any CSV or Excel spreadsheet and use conversational AI to explore insights, compile dashboards, and visualize data trends instantly.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-4">
            <Link
              href="/upload"
              className="inline-flex items-center justify-center bg-[#86BC25] text-slate-950 font-bold px-6 py-3.5 hover:bg-white hover:text-slate-950 hover:shadow-lg hover:shadow-[#86BC25]/10 select-none"
            >
              <span>Upload Dataset</span>
            </Link>

            <Link
              href="/workspaces"
              className="inline-flex items-center justify-center border border-white/20 bg-white/5 backdrop-blur-sm text-white font-semibold px-6 py-3.5 hover:bg-white/10 hover:border-white/40 select-none"
            >
              <span>View Workspaces</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Section 2: How It Works */}
      <section ref={sectionRef} className="w-full px-8 py-20 md:py-28 bg-[#fafafa] flex flex-col items-center justify-center">
        {/* Title */}
        <div className="w-full max-w-6xl mb-16 text-left md:text-center">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight leading-tight">
            How it <span className="border-b-[4px] border-[#86BC25] pb-[2px]">works</span>
          </h2>
        </div>

        {/* 2-Column Layout */}
        <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20 xl:gap-24 items-center">
          {/* Left Side: Interactive Accordion */}
          <div className="lg:col-span-7 flex flex-col gap-4 min-h-[480px]">
            {steps.map((step, index) => {
              const isActive = index === activeStep;
              return (
                <div
                  key={index}
                  onClick={() => handleStepClick(index)}
                  className={`relative overflow-hidden rounded-2xl border p-6 cursor-pointer select-none transition-all duration-300 ${isActive
                    ? 'border-[#86BC25] bg-white shadow-[0_10px_30px_rgba(134,188,37,0.08)]'
                    : 'border-slate-200 bg-white/60 hover:bg-white hover:border-slate-300'
                    }`}
                >
                  {/* Subtle active glow line on left border */}
                  <div
                    className={`absolute left-0 top-0 bottom-0 w-1.5 bg-[#86BC25] transition-all duration-300 origin-left ${isActive ? 'opacity-100 scale-x-100' : 'opacity-0 scale-x-0'
                      }`}
                  />

                  <div className="space-y-1">
                    {/* Heading */}
                    <h3 className="font-black text-xl tracking-tight text-slate-900">
                      {step.heading}
                    </h3>
                  </div>

                  {/* Expandable Content (GSAP animates height) */}
                  <div
                    className="accordion-content overflow-hidden"
                    style={{ height: index === 0 ? 'auto' : 0, opacity: index === 0 ? 1 : 0 }}
                  >
                    <p className="text-slate-600 text-sm sm:text-base leading-relaxed pt-4 max-w-xl">
                      {step.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Side: Visual Image Frame */}
          <div className="lg:col-span-5 flex justify-center lg:justify-end">
            <div className="w-full max-w-md aspect-square relative flex items-center justify-center p-4 bg-transparent">
              {steps.map((step, idx) => (
                <img
                  key={idx}
                  src={step.image}
                  alt={`Step ${idx + 1} visual representation`}
                  className="step-image absolute w-full h-full object-contain select-none pointer-events-none"
                  style={{
                    opacity: idx === 0 ? 1 : 0,
                    transform: idx === 0 ? 'scale(1)' : 'scale(0.95)',
                    zIndex: idx === 0 ? 10 : 0
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Section 3: Call to Action (Ready to Analyze) */}
      <section className="w-full px-8 py-28 md:py-36 bg-[#fafafa] flex flex-col items-center justify-center relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#86BC25]/5 rounded-full blur-[120px] pointer-events-none" />

        <div className="w-full max-w-4xl relative">
          {/* Black Card at the Back */}
          <div className="absolute inset-2 bg-[#0B0F19] border border-slate-950 translate-x-4 translate-y-4 pointer-events-none" />

          {/* The Card */}
          <div className="relative w-full bg-white border border-slate-200 rounded-none py-16 px-8 md:py-24 md:px-16 text-center overflow-hidden shadow-xl flex flex-col items-center justify-center gap-6 group">
            {/* Ambient card hover glow */}
            <div className="absolute -inset-px bg-gradient-to-r from-transparent via-[#86BC25]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none blur-sm" />

            {/* Content */}
            <div className="max-w-2xl space-y-4 relative z-10">
              <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight">
                Ready to analyze your <span className="border-b-[4px] border-[#86BC25] pb-[2px]">files?</span>
              </h2>

              <p className="text-slate-600 text-base sm:text-lg font-light leading-relaxed">
                Upload your dataset, configure the schemas, and begin chatting. We support CSV files and Excel spreadsheets of up to thousands of rows.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer Section */}
      <footer className="w-full bg-[#0B0F19] border-t border-slate-900/60 px-8 py-16 md:py-20 text-slate-400 text-sm relative overflow-hidden">
        {/* Subtle top ambient glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-[1px] bg-gradient-to-r from-transparent via-[#86BC25]/20 to-transparent" />
        <div className="absolute -top-40 left-1/4 w-72 h-72 bg-[#86BC25]/5 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute -bottom-40 right-1/4 w-72 h-72 bg-blue-500/5 rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-6xl mx-auto relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-start gap-10 pb-12 border-b border-slate-800/40">
            {/* Column 1: Brand details & social icons */}
            <div className="flex flex-col items-start space-y-4 max-w-md">
              <div className="flex items-center gap-2 group select-none">
                <span className="font-black text-2xl text-white tracking-tight">
                  Data<span className="text-[#86BC25]">Talk</span>
                </span>
                <span className="h-2 w-2 rounded-full bg-[#86BC25]"></span>
              </div>
              <p className="text-slate-400 text-sm leading-relaxed">
                Upload your CSV or Excel spreadsheets and ask plain-English questions to analyze your data, generate interactive charts, and discover insights instantly.
              </p>

              {/* Social Icons */}
              <div className="flex items-center gap-3 pt-2">
                <a
                  href="https://github.com/Milind-Yadav07"
                  aria-label="GitHub"
                  className="w-8 h-8 rounded-lg bg-slate-950 border border-slate-800/80 flex items-center justify-center text-slate-400 hover:text-[#86BC25] hover:border-[#86BC25]/30 hover:bg-[#86BC25]/5 transition-all duration-300"
                >
                  <FaGithub className="text-base" />
                </a>
                <a
                  href="https://www.linkedin.com/in/milind-yadav-a89157326"
                  aria-label="LinkedIn"
                  className="w-8 h-8 rounded-lg bg-slate-950 border border-slate-800/80 flex items-center justify-center text-slate-400 hover:text-[#86BC25] hover:border-[#86BC25]/30 hover:bg-[#86BC25]/5 transition-all duration-300"
                >
                  <FaLinkedin className="text-base" />
                </a>
              </div>
            </div>

            {/* Column 2: Navigation Links */}
            <div className="flex flex-col space-y-3.5 min-w-[120px]">
              <h4 className="font-semibold text-white tracking-wider text-xs uppercase">
                Navigation
              </h4>
              <ul className="flex flex-col space-y-2.5">
                <li>
                  <Link href="/" className="text-slate-400 hover:text-white hover:translate-x-1 inline-block transition-all duration-200">
                    Home
                  </Link>
                </li>
                <li>
                  <Link href="/upload" className="text-slate-400 hover:text-white hover:translate-x-1 inline-block transition-all duration-200">
                    Upload
                  </Link>
                </li>
                <li>
                  <Link href="/workspaces" className="text-slate-400 hover:text-white hover:translate-x-1 inline-block transition-all duration-200">
                    Workspaces
                  </Link>
                </li>
                <li>
                  <Link href="/database-connection" className="text-slate-400 hover:text-white hover:translate-x-1 inline-block transition-all duration-200">
                    Database Connection
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar: Copyright */}
          <div className="pt-8 text-center">
            <p className="text-xs text-slate-500 select-none">
              &copy; {new Date().getFullYear()} DataTalk. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

