import { Check, X } from "lucide-react";

interface FeatureItem {
  label: string;
  available?: boolean;
}

interface PaymentCardProps {
  name: string;
  price: string;
  features: (string | FeatureItem)[];
  isFree?: boolean;
  highlighted?: boolean;
  isCurrent?: boolean;
  onClick?: () => void;
}

export default function PaymentCard({
  name,
  price,
  features,
  isFree,
  highlighted,
  isCurrent,
  onClick,
}: PaymentCardProps) {
  return (
    <div
      className={`relative rounded-sm border p-5 transition hover:shadow-md cursor-pointer ${
        highlighted
          ? "border-signal bg-signal/5"
          : "border-hairline hover:border-muted-foreground/40"
      }`}
    >
      {/* Current Plan Badge */}
      {isCurrent && (
        <span className="absolute top-2 right-2 font-mono text-[10px] uppercase tracking-[0.12em] font-medium bg-signal text-signal-foreground px-2 py-0.5 rounded-sm">
          Current Plan
        </span>
      )}

      {/* Title and Price */}
      <h3 className="font-display text-lg font-semibold text-foreground mb-1">
        {name}
      </h3>
      <p className="text-sm text-muted-foreground mb-4">
        {isFree ? "Forever Free" : `${price}/month`}
      </p>

      {/* Features */}
      <ul className="space-y-2 text-sm">
        {features.map((f, i) => {
          const item: FeatureItem =
            typeof f === "string" ? { label: f, available: true } : f;
          return (
            <li
              key={i}
              className={`flex items-center gap-2 ${
                item.available === false
                  ? "text-muted-foreground line-through opacity-60"
                  : "text-muted-foreground"
              }`}
            >
              {item.available === false ? (
                <X className="w-4 h-4 text-destructive/70 shrink-0" />
              ) : (
                <Check className="w-4 h-4 text-signal shrink-0" />
              )}
              {item.label}
            </li>
          );
        })}
      </ul>

      {/* Action Button */}
      {!isCurrent && (
        <button
          onClick={onClick}
          className="mt-6 w-full bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-medium py-2 rounded-sm transition"
        >
          Select Plan
        </button>
      )}
    </div>
  );
}