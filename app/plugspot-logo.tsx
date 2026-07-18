export default function PlugSpotLogo({ compact = false }: { compact?: boolean }) {
  return <span className={compact ? "plugspot-logo compact" : "plugspot-logo"}>
    <span className="plugspot-logo-mark" aria-hidden="true"/>
    {!compact && <strong>PlugSpot</strong>}
  </span>;
}
