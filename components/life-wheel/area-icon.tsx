import {
  HeartPulse,
  HeartHandshake,
  UsersRound,
  BriefcaseBusiness,
  Wallet,
  Sprout,
  Sun,
  House,
} from "lucide-react";
import type { LifeAreaKey } from "@/lib/life-wheel";
const icons = {
  health: HeartPulse,
  relationships: HeartHandshake,
  family: UsersRound,
  work: BriefcaseBusiness,
  money: Wallet,
  growth: Sprout,
  leisure: Sun,
  environment: House,
};
export function AreaIcon({
  area,
  size = 20,
  className,
}: {
  area: LifeAreaKey;
  size?: number;
  className?: string;
}) {
  const Icon = icons[area];
  return <Icon size={size} className={className} aria-hidden="true" />;
}
