"use client";

import { useEffect, useState } from "react";

type Position = [number, number];

type Geometry = {
  type: "Polygon" | "MultiPolygon";
  coordinates: Position[][] | Position[][][];
};

type Feature = {
  type: "Feature";
  geometry: Geometry;
  properties: Record<string, unknown>;
};

type FeatureCollection = {
  type: "FeatureCollection";
  features: Feature[];
};

const WIDTH = 520;
const HEIGHT = 600;
const PADDING = 24;

function getPolygons(geometry: Geometry): Position[][][] {
  if (geometry.type === "Polygon") {
    return [geometry.coordinates as Position[][]];
  }
  return geometry.coordinates as Position[][][];
}

function project(
  point: Position,
  bounds: { minX: number; maxY: number; scale: number; offsetX: number; offsetY: number }
): Position {
  return [
    bounds.offsetX + (point[0] - bounds.minX) * bounds.scale,
    bounds.offsetY + (bounds.maxY - point[1]) * bounds.scale,
  ];
}

function buildPaths(collection: FeatureCollection) {
  const allPoints = collection.features.flatMap((feature) =>
    getPolygons(feature.geometry).flat(2)
  );

  const longitudes = allPoints.map((point) => point[0]);
  const latitudes = allPoints.map((point) => point[1]);

  const minX = Math.min(...longitudes);
  const maxX = Math.max(...longitudes);
  const minY = Math.min(...latitudes);
  const maxY = Math.max(...latitudes);

  const scale = Math.min(
    (WIDTH - PADDING * 2) / (maxX - minX),
    (HEIGHT - PADDING * 2) / (maxY - minY)
  );

  const drawingWidth = (maxX - minX) * scale;
  const drawingHeight = (maxY - minY) * scale;

  const bounds = {
    minX,
    maxY,
    scale,
    offsetX: (WIDTH - drawingWidth) / 2,
    offsetY: (HEIGHT - drawingHeight) / 2,
  };

  return collection.features.map((feature, index) => {
    const d = getPolygons(feature.geometry)
      .map((polygon) =>
        polygon
          .map((ring) =>
            ring
              .map((point, pointIndex) => {
                const [x, y] = project(point, bounds);
                return `${pointIndex === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`;
              })
              .join(" ") + " Z"
          )
          .join(" ")
      )
      .join(" ");

    return { id: index, d };
  });
}

export default function ColombiaTerritoryMap() {
  const [paths, setPaths] = useState<{ id: number; d: string }[]>([]);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;

    fetch("/maps/colombia-departamentos.geojson")
      .then((response) => {
        if (!response.ok) throw new Error("Cartografia no disponible");
        return response.json() as Promise<FeatureCollection>;
      })
      .then((data) => {
        if (!active) return;
        if (data.type !== "FeatureCollection" || !Array.isArray(data.features)) {
          throw new Error("Formato geografico invalido");
        }
        setPaths(buildPaths(data));
      })
      .catch(() => {
        if (active) setError(true);
      });

    return () => {
      active = false;
    };
  }, []);

  if (error) {
    return (
      <p className="py-16 text-center text-sm text-[#898c80]">
        No fue posible cargar la cartografia de Colombia.
      </p>
    );
  }

  return (
    <div className="mt-5">
      <div className="rounded-[20px] border border-[#d9dace] bg-[#fafaf6] p-3">
        <svg
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          role="img"
          aria-label="Mapa de Colombia con divisiones departamentales, sin tiendas georreferenciadas"
          className="mx-auto block h-auto w-full max-w-[430px]"
        >
          {paths.map((path) => (
            <path
              key={path.id}
              d={path.d}
              fill="#d5d9c9"
              fillRule="evenodd"
              stroke="#fafaf6"
              strokeWidth="0.85"
              strokeLinejoin="round"
            />
          ))}
        </svg>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <span className="text-xs font-medium text-[#555b4e]">
          Red comercial · Sin ubicaciones verificadas
        </span>
        <span className="text-[10px] uppercase tracking-wider text-[#898c80]">
          Cartografía DANE · Adaptación
        </span>
      </div>
    </div>
  );
}
