"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

const STORAGE_KEY = "wolves_partner_ref";

export default function ReferralCapture() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const ref = searchParams.get("ref");

    if (!ref) return;

    const normalizedRef = ref
      .trim()
      .toUpperCase();

    if (!normalizedRef) return;

    localStorage.setItem(
      STORAGE_KEY,
      normalizedRef
    );
  }, [searchParams]);

  return null;
}