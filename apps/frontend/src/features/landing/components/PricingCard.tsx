/**
 * PricingCard - Individual pricing plan display card
 *
 * Displays a single pricing tier with name, price, benefits, and CTA button.
 * Supports a highlighted variant for the recommended plan.
 * Shows monthly or yearly pricing based on the selected billing interval.
 */

import type { PricingPlan } from "../types";
import type { BillingInterval } from "@/features/billing/types";

interface PricingCardProps {
  plan: PricingPlan;
  billingInterval: BillingInterval;
  onSelect: (planId: string) => void;
  loading?: boolean;
}

export default function PricingCard({ plan, billingInterval, onSelect, loading }: PricingCardProps) {
  const { id, name, pricePerMonth, pricePerYear, benefits, isHighlighted, buttonText } = plan;

  const isYearly = billingInterval === "yearly";
  const displayPrice = isYearly && pricePerYear > 0
    ? (pricePerYear / 12).toFixed(2)
    : pricePerMonth === 0 ? null : pricePerMonth.toFixed(2);

  return (
    <div
      className={`
        flex flex-col h-full p-6 rl-card rl-card-hover
        ${
          isHighlighted
            ? "!border-[rgba(246,194,28,0.65)] ring-2 ring-[rgba(246,194,28,0.18)]"
            : ""
        }
      `}
    >
      {/* Plan name */}
      <h3
        className={`
          text-xl font-semibold text-center mb-2
          ${isHighlighted ? "text-[var(--brand-yellow)]" : "text-[var(--text-primary)]"}
        `}
      >
        {name}
      </h3>

      {/* Price display */}
      <div className="text-center mb-4">
        {displayPrice === null ? (
          <span className="text-3xl font-bold text-[var(--text-primary)]">Free</span>
        ) : (
          <>
            <span className="text-3xl font-bold text-[var(--text-primary)]">
              {"\u20AC"}{displayPrice}
            </span>
            <span className="text-[var(--text-muted)] text-sm"> / month</span>
            {isYearly && pricePerYear > 0 && (
              <p className="text-xs text-[var(--success)] mt-1">
                Billed {"\u20AC"}{pricePerYear.toFixed(2)}/year
              </p>
            )}
          </>
        )}
      </div>

      {/* Divider */}
      <div className="rl-divider my-4" />

      {/* Benefits list */}
      <ul className="space-y-3 mb-6 flex-grow">
        {benefits.map((benefit, index) => (
          <li
            key={index}
            className="flex items-start gap-2 text-sm text-[var(--text-secondary)]"
          >
            <svg
              className="w-5 h-5 text-[var(--success)] flex-shrink-0 mt-0.5"
              fill="currentColor"
              viewBox="0 0 20 20"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
            <span>{benefit}</span>
          </li>
        ))}
      </ul>

      {/* CTA button */}
      <button
        onClick={() => onSelect(id)}
        disabled={loading}
        className={[
          "rl-btn w-full",
          isHighlighted ? "rl-btn-primary" : "rl-btn-secondary",
        ].join(" ")}
      >
        {loading ? "Loading..." : buttonText}
      </button>
    </div>
  );
}
