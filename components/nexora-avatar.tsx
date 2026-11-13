"use client";

import { useEffect } from "react";
import { useFormStatus } from "react-dom";

export type AvatarEmotion =
  | "idle"
  | "typing"
  | "password"
  | "loading"
  | "success"
  | "error"
  | "verified";

type NexoraAvatarProps = {
  emotion?: AvatarEmotion;
  statusText?: string;
  decorative?: boolean;
  className?: string;
};

export function NexoraAvatar({
  emotion = "idle",
  statusText,
  decorative = true,
  className = "",
}: NexoraAvatarProps) {
  const label = statusText ?? `NEXORA AI Buddy: ${emotion}`;

  return (
    <div className={`nexora-avatar-wrap ${className}`}>
      <div
        className={`nexora-avatar nexora-avatar-${emotion}`}
        role={decorative ? undefined : "img"}
        aria-label={decorative ? undefined : label}
        aria-hidden={decorative ? true : undefined}
      >
        <span className="nexora-avatar-aura" />
        <span className="nexora-avatar-shadow" />
        <svg viewBox="0 0 240 220" className="nexora-avatar-art" aria-hidden="true">
          <path className="nexora-avatar-antenna" d="M120 31V18" />
          <circle className="nexora-avatar-antenna-light" cx="120" cy="13" r="6" />
          <path className="nexora-avatar-ear" d="M37 94v38c0 8 7 14 15 14h8V80h-8c-8 0-15 6-15 14Zm166 0v38c0 8-7 14-15 14h-8V80h8c8 0 15 6 15 14Z" />
          <rect className="nexora-avatar-head" x="48" y="36" width="144" height="135" rx="42" />
          <rect className="nexora-avatar-face" x="61" y="61" width="118" height="82" rx="28" />
          <path className="nexora-avatar-brow" d="M78 86c9-7 18-7 27-2m30 2c9-5 18-5 27 2" />
          <g className="nexora-avatar-eyes">
            <ellipse cx="91" cy="101" rx="10" ry="13" />
            <ellipse cx="149" cy="101" rx="10" ry="13" />
            <circle className="nexora-avatar-eye-glint" cx="94" cy="97" r="3" />
            <circle className="nexora-avatar-eye-glint" cx="152" cy="97" r="3" />
          </g>
          <path className="nexora-avatar-mouth" d="M101 120c10 9 28 9 38 0" />
          <path className="nexora-avatar-neck" d="M94 171v18m52-18v18" />
          <path className="nexora-avatar-body" d="M70 218v-18c0-18 15-31 34-31h32c19 0 34 13 34 31v18" />
          <path className="nexora-avatar-chest" d="M107 184h26v18h-26z" />
          <path className="nexora-avatar-hand nexora-avatar-hand-left" d="M69 170c-19 7-29 19-29 36 0 7 5 12 12 12 11 0 17-9 19-20" />
          <path className="nexora-avatar-hand nexora-avatar-hand-right" d="M171 170c19 7 29 19 29 36 0 7-5 12-12 12-11 0-17-9-19-20" />
        </svg>
        {emotion === "loading" && <span className="nexora-avatar-scan" />}
        {emotion === "success" && <span className="nexora-avatar-sparkles">✦</span>}
      </div>
      {statusText && <p className="sr-only" aria-live="polite">{statusText}</p>}
    </div>
  );
}

export function FormAvatarStatus({
  onPendingChange,
}: {
  onPendingChange: (pending: boolean) => void;
}) {
  return <FormAvatarStatusBridge onPendingChange={onPendingChange} />;
}

function FormAvatarStatusBridge({ onPendingChange }: { onPendingChange: (pending: boolean) => void }) {
  const { pending } = useFormStatus();

  useEffect(() => onPendingChange(pending), [onPendingChange, pending]);
  return null;
}