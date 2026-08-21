// Icono de la app generado con next/og para favicon, apple-touch-icon y PWA.
export function AppIcon({ size }: { size: number }) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #1f8a56 0%, #14532d 100%)",
        borderRadius: size * 0.22,
      }}
    >
      <div style={{ fontSize: size * 0.55, display: "flex" }}>💪</div>
    </div>
  );
}
