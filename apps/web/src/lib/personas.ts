export interface UserAttributes {
  membership_tier: "gold" | "silver" | "basic";
  location: string;
  shopping_behavior: "frequent" | "occasional" | "new";
  household_type: "family" | "couple" | "single" | "senior";
}

export interface Persona {
  id: string;
  name: string;
  avatar: string; // initials
  attributes: UserAttributes;
  description: string; // one-liner for the picker
}

export const personas: Persona[] = [
  {
    id: "sarah-chen",
    name: "Sarah Chen",
    avatar: "SC",
    description: "Gold member, SF frequent shopper, family",
    attributes: {
      membership_tier: "gold",
      location: "CA",
      shopping_behavior: "frequent",
      household_type: "family",
    },
  },
  {
    id: "marcus-johnson",
    name: "Marcus Johnson",
    avatar: "MJ",
    description: "Silver member, NYC occasional shopper, couple",
    attributes: {
      membership_tier: "silver",
      location: "NY",
      shopping_behavior: "occasional",
      household_type: "couple",
    },
  },
  {
    id: "emily-rodriguez",
    name: "Emily Rodriguez",
    avatar: "ER",
    description: "Basic member, Chicago new shopper, single",
    attributes: {
      membership_tier: "basic",
      location: "IL",
      shopping_behavior: "new",
      household_type: "single",
    },
  },
  {
    id: "robert-williams",
    name: "Robert Williams",
    avatar: "RW",
    description: "Gold member, Portland frequent shopper, senior",
    attributes: {
      membership_tier: "gold",
      location: "OR",
      shopping_behavior: "frequent",
      household_type: "senior",
    },
  },
];

/** Tier badge colors for UI display */
export const tierColors: Record<UserAttributes["membership_tier"], { bg: string; text: string; label: string }> = {
  gold: { bg: "bg-amber-100", text: "text-amber-800", label: "Gold" },
  silver: { bg: "bg-gray-100", text: "text-gray-700", label: "Silver" },
  basic: { bg: "bg-blue-50", text: "text-blue-700", label: "Basic" },
};
