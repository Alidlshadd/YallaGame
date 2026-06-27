/* Premium Lucide icons for category cards. Tree-shaken at build time —
   only the icons we actually map below ship in the bundle. */

import {
  createElement,
  PawPrint, Briefcase, Package, Utensils, Globe, Building2, Landmark,
  Car, Trophy, Clapperboard, Tv, Sparkles, UserRound, Scroll, Tag,
  Cpu, MonitorSmartphone, BookOpen, Sofa, Shirt, HeartPulse,
  Trees, Leaf, Fish, Bug, WandSparkles, Shield, Skull, Gamepad2,
  Music, Hammer, Wrench, ChefHat, Smile, Palette, Shapes, Heart,
  Cog, Armchair, Puzzle, Laugh, Frown, MessageSquare, MessageCircle,
  Calendar, Dices, Baby, Users, Flame, Award, Timer, Clock, Zap,
  CircleCheck, User, Shuffle, AlertTriangle, TrafficCone, HelpCircle,
  type IconNode
} from "lucide"

/* Map category icon key → lucide IconNode. Keys mirror the friendly names
   we store in WorldCategory.icon. New categories just register here. */
const ICONS: Record<string, IconNode> = {
  // Living
  "paw-print":         PawPrint,
  "trees":             Trees,
  "leaf":              Leaf,
  "fish":              Fish,
  "bug":               Bug,
  "wand-sparkles":     WandSparkles,
  "heart-pulse":       HeartPulse,
  "heart":             Heart,

  // People / characters
  "user-round":        UserRound,
  "user":              User,
  "users":             Users,
  "shield":            Shield,
  "skull":             Skull,
  "scroll":            Scroll,
  "baby":              Baby,

  // Work / tools
  "briefcase":         Briefcase,
  "hammer":            Hammer,
  "wrench":            Wrench,
  "cog":               Cog,
  "alert-triangle":    AlertTriangle,
  "traffic-cone":      TrafficCone,

  // Places
  "globe":             Globe,
  "building-2":        Building2,
  "landmark":          Landmark,

  // Media / entertainment
  "clapperboard":      Clapperboard,
  "tv":                Tv,
  "gamepad-2":         Gamepad2,
  "music":             Music,
  "trophy":            Trophy,
  "sparkles":          Sparkles,
  "tag":               Tag,

  // Things
  "package":           Package,
  "utensils":          Utensils,
  "chef-hat":          ChefHat,
  "shirt":             Shirt,
  "sofa":              Sofa,
  "armchair":          Armchair,
  "book-open":         BookOpen,
  "cpu":               Cpu,
  "monitor-smartphone":MonitorSmartphone,
  "car":               Car,
  "palette":           Palette,
  "shapes":            Shapes,
  "puzzle":            Puzzle,

  // Emotion / vibe
  "smile":             Smile,
  "laugh":             Laugh,
  "frown":             Frown,
  "message-square":    MessageSquare,
  "message-circle":    MessageCircle,

  // Modes
  "calendar":          Calendar,
  "dices":             Dices,
  "flame":             Flame,
  "award":             Award,
  "timer":             Timer,
  "clock":             Clock,
  "zap":               Zap,
  "circle-check":      CircleCheck,
  "shuffle":           Shuffle,

  // Fallback
  "help-circle":       HelpCircle
}

/** Build an SVG element for a category icon. Falls back to help-circle. */
export function buildCategoryIconSvg(name: string): SVGElement {
  const node: IconNode = ICONS[name] ?? HelpCircle
  return createElement(node, {
    width: 22,
    height: 22,
    "stroke-width": "1.8",
    "aria-hidden": "true"
  }) as SVGElement
}
