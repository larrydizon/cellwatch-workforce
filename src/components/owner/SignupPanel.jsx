import React from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { UserPlus, CalendarRange, Building2, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

function tiles(signups) {
  return [
    { label: 'New · 7 days', value: signups.last_7_days, icon: UserPlus },
    { label: 'New · 30 days', value: signups.last_30_days, icon: CalendarRange },
    { label: 'Total workspaces', value: signups.total, icon: Building2 },
    {
      label: 'Growth vs prior 30d',
      value: `${signups.growth_percent > 0 ? '+' : ''}${signups.growth_percent}%`,
      icon: TrendingUp,
      tone: signups.growth_percent > 0 ? 'text-success' : signups.growth_percent < 0 ? 'text-destructive' : 'text-muted-foreground',
    },
  ];
}

export default function SignupPanel({ signups }) {
  return (
    <section className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="px-5 py-4 border-b border-border">
        <h2 className="font-heading text-sm font-semibold">Signups</h2>
        <p className="text-xs text-muted-foreground">New tenant workspaces created</p>
      </div>

      {!signups ? (
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-[76px] rounded-lg bg-muted/40 animate-pulse" />
            ))}
          </div>
          <div className="h-56 rounded-lg bg-muted/40 animate-pulse" />
        </div>
      ) : (
        <div className="p-5 space-y-5">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {tiles(signups).map((tile) => (
              <div key={tile.label} className="rounded-lg border border-border bg-background/40 p-3.5">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{tile.label}</p>
                  <tile.icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                </div>
                <p className={cn('text-xl font-bold tracking-tight mt-1.5', tile.tone)}>{tile.value}</p>
              </div>
            ))}
          </div>

          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={signups.trend} margin={{ top: 4, right: 4, left: -22, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis
                  dataKey="date"
                  tickFormatter={(value) => new Date(value).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  minTickGap={24}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  cursor={{ fill: 'hsl(var(--accent))' }}
                  labelFormatter={(value) => new Date(value).toLocaleDateString(undefined, { day: 'numeric', month: 'long' })}
                  formatter={(value) => [`${value} signups`, '']}
                  contentStyle={{
                    background: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[3, 3, 0, 0]} maxBarSize={22} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-xs text-muted-foreground text-center">New workspaces per day · last 30 days</p>
        </div>
      )}
    </section>
  );
}