import { ImageResponse } from "next/og";

export const alt = "Wolves Territory ORIGEN. Diciembre te espera. SEPARA YA. Arma tu look.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    <div
      style={{
        display: "flex",
        position: "relative",
        width: "100%",
        height: "100%",
        background: "linear-gradient(110deg, #090909 0%, #201913 65%, #4b3020 100%)",
        color: "#f8f4ec",
        fontFamily: "Arial, sans-serif",
        padding: "52px 66px",
        flexDirection: "column",
        justifyContent: "space-between",
      }}
    >
      <div style={{
        position: "absolute", right: -170, top: -150, width: 640, height: 640,
        borderRadius: 320, border: "84px solid rgba(202,155,103,0.10)",
        display: "flex",
      }} />
      <div style={{
        position: "absolute", right: 108, top: 115, width: 255, height: 255,
        borderRadius: 128, border: "2px solid rgba(227,190,147,0.42)",
        display: "flex",
      }} />
      <div style={{
        position: "absolute", right: 155, top: 166, width: 165, height: 165,
        borderRadius: 84, border: "1px solid rgba(227,190,147,0.23)",
        display: "flex",
      }} />
      <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
        <div style={{
          display: "flex", border: "2px solid #e2be8e", color: "#e2be8e",
          fontSize: 27, fontWeight: 800, width: 74, height: 74,
          alignItems: "center", justifyContent: "center",
        }}>WT</div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <span style={{ fontSize: 26, fontWeight: 800, letterSpacing: 5 }}>WOLVES TERRITORY</span>
          <span style={{ color: "#dbb98e", letterSpacing: 8, fontSize: 16, marginTop: 4 }}>— ORIGEN —</span>
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", marginTop: 15 }}>
        <span style={{ color: "#e0b582", fontSize: 21, letterSpacing: 6, fontWeight: 700, marginBottom: 14 }}>
          COLECCIÓN DICIEMBRE
        </span>
        <span style={{ fontSize: 98, fontWeight: 900, letterSpacing: -3, lineHeight: 0.98 }}>DICIEMBRE</span>
        <span style={{ fontSize: 98, fontWeight: 900, letterSpacing: -3, lineHeight: 0.98 }}>TE ESPERA.</span>
        <div style={{
          display: "flex", alignSelf: "flex-start", marginTop: 26,
          padding: "16px 25px", backgroundColor: "#e6c49a",
          color: "#17110c", fontSize: 25, fontWeight: 800, letterSpacing: 2,
        }}>
          SEPARA YA · ARMA TU LOOK
        </div>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #907b60", paddingTop: 19 }}>
        <span style={{ fontSize: 16, letterSpacing: 2, color: "#eadbcb" }}>
          HOODIES · POLOS · CAMISETAS · BERMUDAS · GORRAS
        </span>
        <span style={{ fontSize: 17, letterSpacing: 2, color: "#e6c49a", fontWeight: 700 }}>
          WOLVES-TERRITORY.CO
        </span>
      </div>
    </div>,
    size
  );
}
