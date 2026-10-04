import React from 'react';
import { cn } from '@/lib/utils';

// The company's own mark for the signed-in app shell. Falls back to the
// company's initials when no logo has been uploaded yet.
export function companyInitials(name) {
  const words = String(name || '').trim().split(/\s+/).filter(Boolean);
  if (!words.length) return 'CO';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

export default function CompanyLogo({ org, className, textClassName }) {
  const logo = org?.logo;
  return (
    <div className={cn('rounded-lg bg-primary flex items-center justify-center overflow-hidden flex-shrink-0', className)}>
      {logo ? (
        <img src={logo} alt={org?.name || 'Company logo'} className="h-full w-full object-contain" />
      ) : (
        <span className={cn('text-primary-foreground font-bold', textClassName)}>
          {companyInitials(org?.name)}
        </span>
      )}
    </div>
  );
}