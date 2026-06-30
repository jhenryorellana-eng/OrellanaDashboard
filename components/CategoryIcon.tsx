"use client";

import { Users, Flag, Plane, Wallet, Heart, Sparkles } from "lucide-react";
import type { EventCategory } from "@/lib/types";
import { CATEGORY_META } from "@/lib/constants";

const ICONS = { Users, Flag, Plane, Wallet, Heart, Sparkles } as const;

export default function CategoryIcon({
  category,
  size = 18,
  className,
}: {
  category: EventCategory;
  size?: number;
  className?: string;
}) {
  const meta = CATEGORY_META[category];
  const Icon = ICONS[meta.icon];
  return <Icon size={size} className={className} style={{ color: meta.color }} />;
}
