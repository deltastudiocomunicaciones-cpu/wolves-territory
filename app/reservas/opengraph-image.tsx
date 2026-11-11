import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const alt = "Wolves Territory ORIGEN: diciembre te espera. SEPARA YA y arma tu look.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpenGraphImage() {
  const photo = await readFile(
    join(process.cwd(), "public", "images", "separa-ya-origen-diciembre.jpg"),
    "base64"
  );
  const photoUrl = `data:image/jpeg;base64,${photo}`;

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          position: "relative",
          backgroundColor: "#14110f",
          color: "#ffffff",
          fontFamily: "Arial, sans-serif",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={photoUrl}
          alt=""
          style={{
            position: "absolute",
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: "center",
          }}
        />
        <div style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          background: "linear-gradient(90deg,rgba(12,10,9,0.97) 0%,rgba(12,10,9,0.87) 38%,rgba(12,10,9,0.18) 100%)",
        }} />
        <div style={{
          display: "flex",
          position: "absolute",
          top: 56,
          left: 72,
          right: 72,
          alignItems: "center",
          justifyContent: "space-between",
        }}>
          <span style={{ fontSize: 26, fontWeight: 800, letterSpacing: 4 }}>
            WOLVES TERRITORY
          </span>
          <span style={{ fontSize: 17, letterSpacing: 5, color: "#e5bc86" }}>ORIGEN</span>
        </div>
        <div style={{
          position: "absolute",
          left: 72,
          top: 181,
          width: 720,
          display: "flex",
          flexDirection: "column",
        }}>
          <span style={{ color: "#e5bc86", fontSize: 19, letterSpacing: 6, marginBottom: 16 }}>
            COLECCIÓN DICIEMBRE
          </span>
          <span style={{ fontSize: 92, fontWeight: 900, letterSpacing: -3, lineHeight: 0.99 }}>
            DICIEMBRE
          </span>
          <span style={{ fontSize: 92, fontWeight: 900, letterSpacing: -3, lineHeight: 0.99 }}>
            TE ESPERA.
          </span>
          <span style={{ fontSize: 30, fontWeight: 700, color: "#e5bc86", letterSpacing: 3, marginTop: 23 }}>
            SEPARA YA · ARMA TU LOOK
          </span>
        </div>
        <div style={{
          position: "absolute", bottom: 41, left: 72, right: 72, display: "flex",
          alignItems: "center", justifyContent: "space-between", borderTop: "1px solid rgba(255,255,255,0.4)", paddingTop: 21,
          fontSize: 17, letterSpacing: 2,
        }}>
          <span>HOODIES · POLOS · CAMISETAS · BERMUDAS · GORRAS</span>
          <span style={{ color: "#e5bc86" }}>WOLVES-TERRITORY.CO</span>
        </div>
      </div>
    ),
    size
  );
}
