"use client";

import {
  CreditCard,
  Zap,
  Repeat,
  Landmark,
  Home,
  Receipt,
  Wallet,
} from "lucide-react";
import type { BillCategory } from "@/lib/types";
import { BILL_CATEGORY_META } from "@/lib/bills";

const ICONS = {
  CreditCard,
  Zap,
  Repeat,
  Landmark,
  Home,
  Receipt,
  Wallet,
} as const;

export default function BillIcon({
  category,
  size = 18,
  className,
}: {
  category: BillCategory;
  size?: number;
  className?: string;
}) {
  const meta = BILL_CATEGORY_META[category];
  const Icon = ICONS[meta.icon];
  return <Icon size={size} className={className} style={{ color: meta.color }} />;
}
