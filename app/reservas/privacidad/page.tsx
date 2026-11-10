import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Aviso de privacidad | Solicitudes de reserva",
  description: "Información sobre los datos de contacto recopilados en solicitudes de reserva de Wolves Territory.",
  robots: { index: false, follow: false },
};

export default function PrivacyNotice() {
  return (
    <main className="min-h-screen bg-[#f3efe8] px-5 py-12 text-[#181818] sm:px-10">
      <article className="mx-auto max-w-3xl">
        <Link href="/reservas" className="text-xs uppercase tracking-widest underline">← Volver a reservas</Link>
        <p className="mt-12 text-[11px] uppercase tracking-[.2em] text-[#8a6a48]">Wolves Territory · Colombia</p>
        <h1 className="mt-4 text-4xl font-bold uppercase tracking-tight">Aviso de privacidad</h1>
        <p className="mt-8 text-sm leading-7">Al enviar una solicitud en «Separa ya», Wolves Territory recibe tu nombre, correo electrónico, teléfono, ciudad y las referencias que te interesan. Este formulario registra el interés comercial y permite solicitar contacto antes de habilitar compras en línea.</p>
        <h2 className="mt-8 text-lg font-semibold">¿Para qué se usarán estos datos?</h2>
        <p className="mt-3 text-sm leading-7">Para registrar tu solicitud, identificar la referencia seleccionada, comunicarnos contigo sobre disponibilidad y condiciones de compra, atender consultas y gestionar la cancelación o actualización de tu solicitud. El formulario no procesa cobros y no modifica inventario. Si se acuerda un anticipo posteriormente, se gestiona por canales institucionales externos a esta página, con las condiciones y comprobantes correspondientes.</p>
        <h2 className="mt-8 text-lg font-semibold">Tus derechos</h2>
        <p className="mt-3 text-sm leading-7">Puedes solicitar acceso, actualización, corrección o supresión de tus datos, así como revocar tu autorización en los casos previstos por la legislación colombiana. Para comunicarte con el equipo, escríbenos desde el correo con el que te registraste a <a href="mailto:wolvesterritoryco@gmail.com" className="font-semibold underline">wolvesterritoryco@gmail.com</a>.</p>
        <h2 className="mt-8 text-lg font-semibold">Conservación y acceso</h2>
        <p className="mt-3 text-sm leading-7">Las solicitudes se guardan en una base de datos con acceso restringido a los sistemas internos autorizados. Los datos se conservarán durante el tiempo necesario para gestionar tu solicitud y las obligaciones legales correspondientes; puedes solicitar información sobre su tratamiento o eliminación mediante el canal de contacto.</p>
        <p className="mt-8 border-t border-black/15 pt-6 text-xs leading-6 text-black/60">Este aviso corresponde únicamente al formulario de interés previo al lanzamiento comercial. No confirma por sí mismo una compraventa, pedido pagado, despacho ni apartado de unidades.</p>
      </article>
    </main>
  );
}
