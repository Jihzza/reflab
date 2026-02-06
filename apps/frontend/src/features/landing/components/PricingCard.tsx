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
        flex flex-col h-full p-6 rounded-lg shadow-md bg-white
        ${
          isHighlighted
            ? "border-2 border-blue-600 ring-2 ring-blue-100"
            : "border border-gray-300"
        }
      `}
    >
      {/* Plan name */}
      <h3
        className={`
          text-xl font-semibold text-center mb-2
          ${isHighlighted ? "text-blue-600" : "text-gray-700"}
        `}
      >
        {name}
      </h3>

      {/* Price display */}
      <div className="text-center mb-4">
        {displayPrice === null ? (
          <span className="text-3xl font-bold text-gray-700">Free</span>
        ) : (
          <>
            <span className="text-3xl font-bold text-gray-700">
              {"\u20AC"}{displayPrice}
            </span>
            <span className="text-gray-500 text-sm"> / month</span>
            {isYearly && pricePerYear > 0 && (
              <p className="text-xs text-green-600 mt-1">
                Billed {"\u20AC"}{pricePerYear.toFixed(2)}/year
              </p>
            )}
          </>
        )}
      </div>

      {/* Divider */}
      <div className="border-t border-gray-200 my-4"></div>

      {/* Benefits list */}
      <ul className="space-y-3 mb-6 flex-grow">
        {benefits.map((benefit, index) => (
          <li
            key={index}
            className="flex items-start gap-2 text-sm text-gray-600"
          >
            <svg
              className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5"
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
        className={`
          w-full py-2 px-4 rounded-md font-medium transition-colors
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
          disabled:opacity-50 disabled:cursor-not-allowed
          ${
            isHighlighted
              ? "bg-blue-600 text-white hover:bg-blue-700"
              : "border border-gray-300 text-gray-700 hover:bg-gray-50"
          }
        `}
      >
        {loading ? "Loading..." : buttonText}
      </button>
    </div>
  );
}
