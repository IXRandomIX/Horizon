import { useEffect } from "react";

export async function trackXP(type: string): Promise<void> {
  const token = localStorage.getItem("horizon_session_token");
  if (!token) return;
  try {
    const res = await fetch("/api/xp/track", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ type }),
    });
    if (res.ok) {
      window.dispatchEvent(new CustomEvent("xp-updated"));
    }
  } catch {
    // fire-and-forget, ignore errors
  }
}

export function usePageXP(type: string): void {
  useEffect(() => {
    trackXP(type);
  }, []);
}
