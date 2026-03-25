import { useEffect } from "react";

export async function trackXP(type: string): Promise<void> {
  const token = localStorage.getItem("horizon_session_token");
  if (!token) return;
  try {
    await fetch("/api/xp/track", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ type }),
    });
  } catch {
    // fire-and-forget, ignore errors
  }
}

export function usePageXP(type: string): void {
  useEffect(() => {
    trackXP(type);
  }, []);
}
