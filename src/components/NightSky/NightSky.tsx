import { useMemo } from "react";

interface Star {
  id: number;
  top: number;
  left: number;
  size: number;
  delay: number;
  duration: number;
  color: "white" | "cyan" | "sparkle";
}

interface NightSkyProps {
  count?: number;
}

export default function NightSky({ count = 50 }: NightSkyProps) {
  const stars = useMemo<Star[]>(() => {
    return Array.from({ length: count }, (_, i) => {
      const r = Math.random();
      let color: Star["color"] = "white";
      let size = Math.random() * 1.8 + 1;

      if (r < 0.1) {
        color = "sparkle";
        size = Math.random() * 12 + 18;
      } else if (r < 0.25) {
        color = "cyan";
      }

      return {
        id: i,
        top: Math.random() * 100,
        left: Math.random() * 100,
        size,
        delay: Math.random() * 4,
        duration: Math.random() * 2.5 + 2.5,
        color,
      };
    });
  }, [count]);

  return (
    <div className="stars">
      {stars.map((s) =>
        s.color === "sparkle" ? (
          <span
            key={s.id}
            className="sparkle"
            style={{
              top: `${s.top}%`,
              left: `${s.left}%`,
              width: `${s.size}px`,
              height: `${s.size}px`,
              animationDelay: `${s.delay}s`,
              animationDuration: `${s.duration}s`,
            }}
          >
            <span
              className="sparkle-core"
              style={{
                top: "50%",
                left: "50%",
                width: `${s.size * 0.2}px`,
                height: `${s.size * 0.2}px`,
              }}
            />
          </span>
        ) : (
          <span
            key={s.id}
            className={s.color}
            style={{
              top: `${s.top}%`,
              left: `${s.left}%`,
              width: `${s.size}px`,
              height: `${s.size}px`,
              animationDelay: `${s.delay}s`,
              animationDuration: `${s.duration}s`,
            }}
          />
        )
      )}
    </div>
  );
}