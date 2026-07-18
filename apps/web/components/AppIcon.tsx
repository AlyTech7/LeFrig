import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Bell,
  BookOpen,
  Briefcase,
  Camera,
  ChevronRight,
  ChevronDown,
  CloudOff,
  DollarSign,
  Globe,
  Heart,
  HelpCircle,
  Home,
  Image,
  Lock,
  MapPin,
  Megaphone,
  MessageCircle,
  Mic,
  Package,
  Repeat,
  Scale,
  Search,
  Shield,
  ShoppingBag,
  SlidersHorizontal,
  Smartphone,
  Store,
  Tag,
  Ticket,
  Truck,
  WifiOff,
  X,
  Zap,
  type LucideIcon,
} from 'lucide-react';

const iconMap = {
  'shopping-bag': ShoppingBag,
  tag: Tag,
  zap: Zap,
  truck: Truck,
  briefcase: Briefcase,
  camera: Camera,
  globe: Globe,
  store: Store,
  ticket: Ticket,
  'dollar-sign': DollarSign,
  mic: Mic,
  'book-open': BookOpen,
  package: Package,
  heart: Heart,
  image: Image,
  'map-pin': MapPin,
  bell: Bell,
  search: Search,
  sliders: SlidersHorizontal,
  'cloud-off': CloudOff,
  smartphone: Smartphone,
  lock: Lock,
  shield: Shield,
  scale: Scale,
  'wifi-off': WifiOff,
  megaphone: Megaphone,
  'arrow-up-right': ArrowUpRight,
  'arrow-right': ArrowRight,
  'arrow-left': ArrowLeft,
  repeat: Repeat,
  'chevron-right': ChevronRight,
  'chevron-down': ChevronDown,
  'message-circle': MessageCircle,
  'help-circle': HelpCircle,
  home: Home,
  x: X,
} as const;

export type AppIconName = keyof typeof iconMap;

interface Props {
  name: AppIconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
  className?: string;
}

export function AppIcon({ name, size = 20, color = 'currentColor', strokeWidth = 2, className }: Props) {
  const Icon = iconMap[name] as LucideIcon;
  return <Icon size={size} color={color} strokeWidth={strokeWidth} className={className} aria-hidden />;
}
