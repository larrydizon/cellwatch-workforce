import React from "react";

export default function MicrosoftIcon({ className = "w-5 h-5" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M1 1h10v10H1z" fill="#F25022" />
      <path d="M13 1h10v10H13z" fill="#00A4EF" />
      <path d="M1 13h10v10H1z" fill="#7FBA00" />
      <path d="M13 13h10v10H13z" fill="#FFB900" />
    </svg>
  );
}