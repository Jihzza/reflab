/**
 * HeroSection - Landing page hero with logo and branding
 *
 * Displays the RefLab banner logo, main title, and value proposition.
 * Mobile-first design with centered layout and responsive text sizing.
 *
 * Layout:
 * ┌─────────────────────────────────────────┐
 * │           [Banner RefLab Logo]          │
 * │                                         │
 * │    "Your Referee Training Laboratory"   │
 * │                                         │
 * │         [Description paragraph]         │
 * └─────────────────────────────────────────┘
 */

import BannerLogo from "@/assets/logos/Banner RefLab No BG.svg";

export default function HeroSection() {
  return (
    <section className="px-6 pt-14 pb-10 text-center">
      {/* Logo container - centered with responsive sizing */}
      <div className="flex justify-center mb-6">
        <img
          src={BannerLogo}
          alt="RefLab - Referee Training Laboratory"
          className="h-14 md:h-16 w-auto"
        />
      </div>

      {/* Main title */}
      <h1 className="rl-h1 mb-4">
        Your Referee Training Laboratory
      </h1>

      {/* Value proposition description */}
      <p className="text-[var(--text-secondary)] text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
        A dedicated hub for football referees to study, rehearse, and stay
        aligned with the Laws of the Game. Master your craft with authoritative
        knowledge, deliberate practice, and AI-powered guidance.
      </p>
    </section>
  );
}
