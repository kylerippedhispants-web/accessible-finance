interface BrandProps {
  compact?: boolean;
}

export function Brand({ compact = false }: BrandProps) {
  return (
    <a className="brand" href="/" aria-label="Accessible Finance home">
      <img src="/Logo-256.png" alt="" width="40" height="40" />
      {!compact && <span>Accessible Finance</span>}
    </a>
  );
}
