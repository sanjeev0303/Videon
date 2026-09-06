interface AddOnCardProps {
  title: string;
  price: string;
  description: string;
  onClick?: () => void;
}

export default function AddOnCard({
  title,
  price,
  description,
  onClick,
}: AddOnCardProps) {
  return (
    <div
      className="rounded-sm border border-hairline p-5 hover:border-muted-foreground/40 bg-card cursor-pointer transition"
      onClick={onClick}
    >
      <h4 className="font-display font-semibold text-foreground mb-1">
        {title}
      </h4>
      <p className="text-sm text-muted-foreground mb-2">
        {description}
      </p>
      <span className="font-mono text-signal font-medium">{price}</span>
    </div>
  );
}