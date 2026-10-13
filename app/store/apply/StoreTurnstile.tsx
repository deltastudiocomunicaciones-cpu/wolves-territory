"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";

type TurnstileApi = {
  render: (
    container: HTMLElement,
    options: {
      sitekey: string;
      callback: (token: string) => void;
      "expired-callback": () => void;
      "error-callback": () => void;
    }
  ) => string;
  remove: (widgetId: string) => void;
  reset: (widgetId: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

type Props = {
  onTokenChange: (token: string | null) => void;
  resetKey: number;
};

export default function StoreTurnstile({
  onTokenChange,
  resetKey,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetRef = useRef<string | null>(null);
  const callbackRef = useRef(onTokenChange);
  const previousResetKey = useRef(resetKey);
  const [scriptReady, setScriptReady] = useState(false);

  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  useEffect(() => {
    callbackRef.current = onTokenChange;
  }, [onTokenChange]);

  useEffect(() => {
    if (!scriptReady || !siteKey || !containerRef.current) return;
    if (!window.turnstile || widgetRef.current !== null) return;

    widgetRef.current = window.turnstile.render(containerRef.current, {
      sitekey: siteKey,
      callback: (token) => callbackRef.current(token),
      "expired-callback": () => callbackRef.current(null),
      "error-callback": () => callbackRef.current(null),
    });

    return () => {
      if (widgetRef.current !== null) {
        window.turnstile?.remove(widgetRef.current);
        widgetRef.current = null;
      }
      callbackRef.current(null);
    };
  }, [scriptReady, siteKey]);

  useEffect(() => {
    if (previousResetKey.current === resetKey) return;

    previousResetKey.current = resetKey;
    callbackRef.current(null);

    if (widgetRef.current !== null) {
      window.turnstile?.reset(widgetRef.current);
    }
  }, [resetKey]);

  if (!siteKey) {
    return (
      <p role="alert" className="text-sm text-red-700">
        La verificación de seguridad no está configurada.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        strategy="afterInteractive"
        onReady={() => setScriptReady(true)}
      />
      <div ref={containerRef} />
      <p className="text-xs leading-5 text-neutral-500">
        Verificación de seguridad protegida por Cloudflare.
      </p>
    </div>
  );
}
