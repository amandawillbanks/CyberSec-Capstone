import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
  Sphere,
  Graticule,
} from "react-simple-maps";
import { feature } from "topojson-client";
import worldTopo from "world-atlas/countries-110m.json";

/** Convert your xPct/yPct (0–100) into rough lon/lat */
function hostToLonLat(host) {
  const lon = (host.xPct / 100) * 360 - 180;     // 0..100 => -180..180
  const lat = 90 - (host.yPct / 100) * 180;      // 0..100 => 90..-90
  return [lon, lat];
}

export default function GlobeMap({
  hosts = [],
  selectedHostId,
  onSelectHost,
  statusColor = () => "#00fff7",
  autoRotate = true,
  running = false,
}) {
  const [rotation, setRotation] = useState([0, -15, 0]);
  const rafRef = useRef(null);

  // Countries FeatureCollection
  const geo = useMemo(() => feature(worldTopo, worldTopo.objects.countries), []);

  // Auto-rotate when running
  useEffect(() => {
    if (!autoRotate || !running) return;

    const tick = () => {
      setRotation(([lambda, phi, gamma]) => [lambda + 0.25, phi, gamma]);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [autoRotate, running]);

  // Build host nodes with lon/lat
  const hostNodes = useMemo(
    () =>
      hosts.map((h) => ({
        ...h,
        lonLat: hostToLonLat(h),
        compromised: h.status === "compromised",
      })),
    [hosts]
  );

  // Build host-to-host “network” links (all-to-all)
  const links = useMemo(() => {
    const out = [];
    for (let i = 0; i < hostNodes.length; i++) {
      for (let j = i + 1; j < hostNodes.length; j++) {
        out.push({
          a: hostNodes[i],
          b: hostNodes[j],
          hot: hostNodes[i].compromised || hostNodes[j].compromised,
        });
      }
    }
    return out;
  }, [hostNodes]);

  return (
    <div style={{ width: "100%", height: "100%" }}>
      <ComposableMap
        width={600}
        height={600}
        projection="geoOrthographic"
        projectionConfig={{
          rotate: rotation,
          scale: 290,
        }}
        style={{ width: "100%", height: "100%" }}
      >
        {/* Globe sphere */}
        <Sphere
          fill="#0a1628"
          stroke="#4a9eda"
          strokeWidth={1.5}
        />

        {/* ✅ Real lat/long grid */}
        <Graticule stroke="rgba(255,255,255,0.10)" strokeWidth={0.6} />

        {/* Land */}
        <Geographies geography={geo}>
          {({ geographies }) =>
            geographies.map((g) => (
              <Geography
                key={g.rsmKey}
                geography={g}
                fill="#1e3a5f"
                stroke="#4a9eda"
                strokeWidth={0.5}
                style={{
                  default: { outline: "none" },
                  hover: { fill: "#2a4f7a", outline: "none" },
                  pressed: { outline: "none" },
                }}
              />
            ))
          }
        </Geographies>

        {/* ✅ Network lines between hosts (glow) */}
        {links.map((lnk, idx) => {
          const color = lnk.hot ? "#ff0077" : "#00fff7";
          const thick = lnk.hot ? 2.2 : 1.2;
          const glow = lnk.hot ? 7 : 6;
          return null;
        })}

        {/* Markers */}
        {hostNodes.map((h) => {
          const isSelected = h.id === selectedHostId;
          const icon =
            h.status === "warning"
              ? "⚠️"
              : h.status === "compromised"
              ? "🔥"
              : h.status === "quarantined"
              ? "🔒"
              : "✅";

          return (
            <Marker key={h.id} coordinates={h.lonLat}>
              <g
                onClick={() => onSelectHost?.(h.id)}
                style={{ cursor: onSelectHost ? "pointer" : "default" }}
              >
                {/* selection ring */}
                {isSelected && (
                  <circle
                    r={12}
                    fill="transparent"
                    stroke="rgba(255,255,255,0.75)"
                    strokeWidth={2}
                  />
                )}

                {/* glow */}
                <circle
                  r={12}
                  fill={statusColor(h.status)}
                  opacity={h.status === "compromised" ? 0.20 : 0.12}
                  style={{ filter: "blur(6px)" }}
                />

                {/* core dot */}
                <circle
                  r={5}
                  fill={statusColor(h.status)}
                  stroke="rgba(0,0,0,0.45)"
                  strokeWidth={1}
                />

                {/* emoji */}
                <text y={-10} textAnchor="middle" style={{ fontSize: 12 }}>
                  {icon}
                </text>
              </g>
            </Marker>
          );
        })}
      </ComposableMap>
    </div>
  );
}
