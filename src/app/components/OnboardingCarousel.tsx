"use client";

import { useState } from "react";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  LogIn,
  MessageSquarePlus,
  MessageCircleReply,
  Ghost,
  UserCheck,
  ShieldAlert,
  MonitorUp,
  Presentation,
  BookOpen,
  LucideIcon,
} from "lucide-react";
import { OnboardingStep } from "@/constants/onboarding";

interface OnboardingCarouselProps {
  steps: OnboardingStep[];
  onComplete: () => void;
  requireAgreement?: boolean;
}

const iconMap: Record<string, LucideIcon> = {
  LogIn,
  MessageSquarePlus,
  MessageCircleReply,
  Ghost,
  UserCheck,
  ShieldAlert,
  MonitorUp,
  Presentation,
  BookOpen,
  ShieldCheck, // for the community rules
};

export default function OnboardingCarousel({
  steps,
  onComplete,
  requireAgreement,
}: OnboardingCarouselProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [agreed, setAgreed] = useState(false);

  const totalSteps = steps.length + (requireAgreement ? 1 : 0);
  const isLastStep = currentStepIndex === totalSteps - 1;
  const isAgreementStep = requireAgreement && currentStepIndex === steps.length;

  const handleNext = () => {
    if (isLastStep) {
      if (isAgreementStep && !agreed) return;
      onComplete();
    } else {
      setCurrentStepIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    setCurrentStepIndex((prev) => Math.max(0, prev - 1));
  };

  // Synthesize or retrieve the current step data for unified layout
  const stepData = isAgreementStep
    ? {
        title: "Community Rules",
        icon: "ShieldCheck",
        image: "/images/onboarding/community-rules.svg",
        description: [
          "Post only genuine questions related to the lecture.",
          "Be respectful toward instructors and peers.",
          "Spam or off-topic posts may be removed.",
        ],
        altText: "Community rules and guidelines",
      }
    : steps[currentStepIndex];

  const StepIcon = stepData.icon ? iconMap[stepData.icon] : null;

  /** Which step index last failed to load a hero image (no effect needed to reset on navigation). */
  const [heroFailedAtIndex, setHeroFailedAtIndex] = useState<number | null>(null);

  const heroSrc = "image" in stepData ? stepData.image : undefined;
  const showHeroPhoto = Boolean(heroSrc && heroFailedAtIndex !== currentStepIndex);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-stone-900/60 backdrop-blur-sm p-4 md:p-8">
      {/* Main Container - Responsive Height & Mobile Stacking */}
      <div className="bg-white rounded-md shadow-2xl w-full max-w-[950px] min-h-[500px] md:h-[600px] overflow-hidden flex flex-col md:flex-row relative">
        {/* Left Content Half */}
        <div className="w-full md:w-[42%] h-full flex flex-col bg-white relative z-10 shadow-[4px_0_24px_-10px_rgba(0,0,0,0.1)]">
          <div className="flex-1 p-6 md:p-8 pb-0 flex flex-col justify-start">
            <div className="flex flex-col animate-in fade-in slide-in-from-bottom-2 duration-300 w-full mt-6 sm:mt-8 md:mt-[4.5rem]">
              {/* Flex Row: Icon + Title */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-5 mb-6 sm:mb-8 pr-8">
                {StepIcon && (
                  <div className="w-12 h-12 sm:w-14 sm:h-14 bg-green-50 text-green-600 rounded-md flex items-center justify-center shadow-sm border border-green-100/50 shrink-0">
                    <StepIcon className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={2.5} />
                  </div>
                )}
                <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-stone-900 leading-tight">
                  {stepData.title}
                </h2>
              </div>

              {/* Clean Bullets */}
              <ul className="space-y-4">
                {stepData.description.map((bullet, idx) => (
                  <li key={idx} className="flex items-start gap-4">
                    <div className="w-2 h-2 rounded-full bg-green-500 mt-2 sm:mt-2.5 shrink-0" />
                    <span className="text-base sm:text-lg text-stone-600 leading-relaxed font-medium">
                      {bullet}
                    </span>
                  </li>
                ))}
              </ul>

              {/* Minimal Checkbox for Agreement slide */}
              {isAgreementStep && (
                <label className="flex items-center gap-3 cursor-pointer group mt-8 sm:mt-10 p-2 -ml-2 rounded-md hover:bg-stone-50 transition-colors w-fit">
                  <div className="relative flex items-center justify-center shrink-0">
                    <input
                      type="checkbox"
                      checked={agreed}
                      onChange={(e) => setAgreed(e.target.checked)}
                      className="peer appearance-none w-5 h-5 border-2 border-stone-300 rounded-md cursor-pointer checked:border-green-500 checked:bg-green-500 transition-all"
                    />
                    <Check
                      className="absolute w-3.5 h-3.5 text-white pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity"
                      strokeWidth={3}
                    />
                  </div>
                  <span className="text-base font-semibold text-stone-800 leading-tight pr-2 select-none">
                    I agree to the rules
                  </span>
                </label>
              )}
            </div>
          </div>

          {/* Locked Footer Controls */}
          <div className="mt-8 md:mt-auto px-6 md:px-8 pb-6 md:pb-8 flex items-center justify-between">
            {/* Dots */}
            <div className="flex gap-1.5 sm:gap-2">
              {Array.from({ length: totalSteps }).map((_, idx) => (
                <div
                  key={idx}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    idx === currentStepIndex ? "bg-green-500 w-6 sm:w-8" : "bg-stone-200 w-2"
                  }`}
                />
              ))}
            </div>

            {/* Buttons */}
            <div className="flex gap-2 sm:gap-3">
              <button
                onClick={handlePrev}
                disabled={currentStepIndex === 0}
                className="flex items-center justify-center gap-1.5 w-10 h-10 sm:w-12 sm:h-12 rounded-md transition-all bg-gray-100 hover:bg-gray-200 text-gray-400 hover:text-gray-600 disabled:opacity-0 disabled:pointer-events-none"
              >
                <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 ml-[-2px]" />
              </button>

              <button
                onClick={handleNext}
                disabled={isAgreementStep && !agreed}
                className={`flex items-center justify-center gap-1.5 sm:gap-2 px-5 sm:px-6 h-10 sm:h-12 rounded-md font-bold transition-all duration-200 text-sm sm:text-base ${
                  isLastStep
                    ? "bg-green-600 hover:bg-green-700 text-white shadow-md hover:shadow-lg shadow-green-500/20"
                    : "bg-gray-400 hover:bg-gray-500 text-white shadow-md hover:shadow-lg"
                } disabled:opacity-50 disabled:pointer-events-none disabled:shadow-none`}
              >
                {isLastStep ? "Get Started" : "Next"}
                {!isLastStep && <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 ml-[-4px]" />}
              </button>
            </div>
          </div>
        </div>

        {/* Right visual: illustration image */}
        <div className="w-full h-56 sm:h-72 md:w-[58%] md:h-full bg-stone-50 relative flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-green-50/80 via-stone-100/70 to-stone-200/50" />
          {showHeroPhoto ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={heroSrc}
                alt={stepData.altText}
                className="relative z-10 w-[85%] h-[85%] md:w-[80%] md:h-[80%] object-contain drop-shadow-sm"
                onError={() => setHeroFailedAtIndex(currentStepIndex)}
              />
            </>
          ) : (
            <div className="relative z-10 flex flex-col items-center justify-center gap-5 px-8 py-10 text-center">
              {StepIcon && (
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-white/90 text-green-600 flex items-center justify-center shadow-lg border border-green-100/60">
                  <StepIcon className="w-12 h-12 sm:w-14 sm:h-14" strokeWidth={2} />
                </div>
              )}
              <p className="text-sm sm:text-base font-medium text-stone-600 max-w-[260px] leading-snug">
                {stepData.altText}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
