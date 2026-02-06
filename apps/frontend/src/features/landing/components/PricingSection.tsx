/**
 * PricingSection - Swiper carousel displaying pricing plans
 *
 * Uses Swiper library to create an infinite carousel of pricing cards.
 * Includes a monthly/yearly billing toggle.
 * Subscribe buttons redirect to Stripe Checkout (if logged in) or signup (if not).
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";
import PricingCard from "./PricingCard";
import { useAuth } from "@/features/auth/components/AuthProvider";
import { createCheckoutSession } from "@/features/billing/api/billingApi";
import type { PricingPlan } from "../types";
import type { BillingInterval } from "@/features/billing/types";

// Import Swiper core styles
import "swiper/css";

/**
 * Custom styles to ensure slides are always visible.
 */
const swiperStyles = `
  .pricing-swiper .swiper-slide {
    visibility: visible !important;
    opacity: 1 !important;
    backface-visibility: hidden;
    -webkit-backface-visibility: hidden;
  }
  .pricing-swiper .swiper-wrapper {
    transition-timing-function: ease-out;
  }
`;

/**
 * Pricing plans data
 *
 * Three tiers: Free, Standard (highlighted), and Pro
 * Prices are in EUR
 */
const PRICING_PLANS: PricingPlan[] = [
  {
    id: "free",
    name: "Free",
    pricePerMonth: 0,
    pricePerYear: 0,
    benefits: [
      "3 tests per month",
      "Access to basic Laws of the Game content",
      "Community forum access",
      "Weekly newsletter",
    ],
    buttonText: "Get Started",
  },
  {
    id: "standard",
    name: "Standard",
    pricePerMonth: 9.99,
    pricePerYear: 95.88,
    benefits: [
      "15 tests per month",
      "Everything in Free",
      "AI-powered feedback on decisions",
      "Progress tracking & analytics",
      "Priority support",
    ],
    isHighlighted: true,
    buttonText: "Subscribe",
  },
  {
    id: "pro",
    name: "Pro",
    pricePerMonth: 19.99,
    pricePerYear: 191.88,
    benefits: [
      "Unlimited tests",
      "Everything in Standard",
      "Advanced analytics",
      "Early access to new features",
      "Dedicated support",
    ],
    buttonText: "Subscribe",
  },
];

/**
 * Duplicate plans array for smooth infinite Swiper loop.
 */
const CAROUSEL_SLIDES = [...PRICING_PLANS, ...PRICING_PLANS];

export default function PricingSection() {
  const navigate = useNavigate();
  const { authStatus } = useAuth();
  const [billingInterval, setBillingInterval] = useState<BillingInterval>("monthly");
  const [loading, setLoading] = useState<string | null>(null);

  const isLoggedIn = authStatus === "authenticated";

  /**
   * Handle plan selection
   */
  const handlePlanSelect = async (planId: string) => {
    // Extract actual plan ID (remove Swiper duplicate suffix)
    const actualPlanId = planId.replace(/-\d+$/, "");

    // Free plan → just sign up or go to dashboard
    if (actualPlanId === "free") {
      if (isLoggedIn) {
        navigate("/app/dashboard");
      } else {
        navigate("/");
      }
      return;
    }

    // Paid plans → need to be logged in
    if (!isLoggedIn) {
      // Redirect to landing page (which has signup) with a return hint
      navigate("/?subscribe=" + actualPlanId);
      return;
    }

    // Create checkout session
    setLoading(actualPlanId);
    const { data, error } = await createCheckoutSession(
      actualPlanId as "standard" | "pro",
      billingInterval
    );

    if (error || !data?.url) {
      console.error("Checkout error:", error);
      alert(error?.message || "Failed to start checkout. Please try again.");
      setLoading(null);
      return;
    }

    // Redirect to Stripe Checkout
    window.location.href = data.url;
  };

  return (
    <section id="pricing" className="py-12 overflow-hidden">
      {/* Inject custom styles */}
      <style>{swiperStyles}</style>

      {/* Section title */}
      <h2 className="text-2xl md:text-3xl font-bold text-gray-700 text-center mb-4 px-6">
        Choose Your Plan
      </h2>

      {/* Billing interval toggle */}
      <div className="flex justify-center mb-8">
        <div className="inline-flex items-center bg-gray-100 rounded-full p-1">
          <button
            onClick={() => setBillingInterval("monthly")}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              billingInterval === "monthly"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingInterval("yearly")}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              billingInterval === "yearly"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Yearly
            <span className="ml-1 text-green-600 text-xs font-semibold">Save 20%</span>
          </button>
        </div>
      </div>

      {/* Swiper carousel */}
      <Swiper
        className="pricing-swiper"
        modules={[Autoplay]}
        slidesPerView={1.5}
        spaceBetween={16}
        centeredSlides={true}
        loop={true}
        speed={500}
        autoplay={{
          delay: 2000,
          disableOnInteraction: false,
          pauseOnMouseEnter: true,
        }}
        grabCursor={true}
        touchEventsTarget="container"
        simulateTouch={true}
        allowTouchMove={true}
        watchSlidesProgress={true}
      >
        {CAROUSEL_SLIDES.map((plan, index) => (
          <SwiperSlide key={`${plan.id}-${index}`} className="py-4">
            <PricingCard
              plan={plan}
              billingInterval={billingInterval}
              onSelect={handlePlanSelect}
              loading={loading === plan.id}
            />
          </SwiperSlide>
        ))}
      </Swiper>
    </section>
  );
}
