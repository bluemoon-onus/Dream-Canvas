import {
  Moon,
  Cloud,
  Star,
  Feather,
  Waves,
  Flame,
  Eye,
  Heart,
  type LucideProps,
} from "lucide-react";
import type { LucideName } from "@/lib/types";

const MAP: Record<LucideName, React.ComponentType<LucideProps>> = {
  moon: Moon,
  cloud: Cloud,
  star: Star,
  feather: Feather,
  waves: Waves,
  flame: Flame,
  eye: Eye,
  heart: Heart,
};

export function DreamIcon({
  name,
  ...props
}: { name: LucideName } & LucideProps) {
  const Icon = MAP[name] ?? Moon;
  return <Icon {...props} />;
}
