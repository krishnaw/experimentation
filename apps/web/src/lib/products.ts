export interface Product {
  id: string;
  name: string;
  category: "electronics" | "clothing" | "home";
  price: number;
  originalPrice?: number;
  rating: number;
  reviewCount: number;
  image: string;
  description: string;
  badge?: "New" | "Sale" | "Best Seller";
  popularity: number;
}

export const products: Product[] = [
  {
    id: "macbook-pro-14",
    name: 'MacBook Pro 14"',
    category: "electronics",
    price: 1999,
    rating: 4.9,
    reviewCount: 2847,
    image: "https://picsum.photos/seed/macbook-pro-14/400/400",
    description:
      "Apple M3 Pro chip, 18GB RAM, 512GB SSD. The most advanced MacBook Pro ever.",
    badge: "Best Seller",
    popularity: 98,
  },
  {
    id: "sony-wh1000xm5",
    name: "Sony WH-1000XM5",
    category: "electronics",
    price: 348,
    originalPrice: 399,
    rating: 4.8,
    reviewCount: 5621,
    image: "https://picsum.photos/seed/sony-wh1000xm5/400/400",
    description:
      "Industry-leading noise cancellation with Auto NC Optimizer. 30-hour battery life.",
    badge: "Sale",
    popularity: 92,
  },
  {
    id: "ipad-pro",
    name: "iPad Pro 12.9\"",
    category: "electronics",
    price: 1099,
    rating: 4.8,
    reviewCount: 1893,
    image: "https://picsum.photos/seed/ipad-pro/400/400",
    description:
      "M2 chip, Liquid Retina XDR display. The ultimate iPad experience.",
    badge: "New",
    popularity: 88,
  },
  {
    id: "samsung-4k-monitor",
    name: "Samsung 4K Monitor",
    category: "electronics",
    price: 449,
    originalPrice: 549,
    rating: 4.6,
    reviewCount: 1234,
    image: "https://picsum.photos/seed/samsung-4k-monitor/400/400",
    description:
      '32" UHD IPS panel with USB-C connectivity. Perfect for creative professionals.',
    badge: "Sale",
    popularity: 76,
  },
  {
    id: "premium-wool-jacket",
    name: "Premium Wool Jacket",
    category: "clothing",
    price: 289,
    rating: 4.7,
    reviewCount: 876,
    image: "https://picsum.photos/seed/premium-wool-jacket/400/400",
    description:
      "Italian merino wool blend. Tailored fit with satin lining. Timeless elegance.",
    badge: "Best Seller",
    popularity: 85,
  },
  {
    id: "running-shoes",
    name: "Running Shoes",
    category: "clothing",
    price: 159,
    originalPrice: 189,
    rating: 4.5,
    reviewCount: 3421,
    image: "https://picsum.photos/seed/running-shoes/400/400",
    description:
      "Lightweight mesh upper with responsive foam cushioning. Built for speed.",
    badge: "Sale",
    popularity: 90,
  },
  {
    id: "minimalist-watch",
    name: "Minimalist Watch",
    category: "clothing",
    price: 195,
    rating: 4.6,
    reviewCount: 654,
    image: "https://picsum.photos/seed/minimalist-watch/400/400",
    description:
      "Swiss movement, sapphire crystal, genuine leather strap. Clean, modern design.",
    badge: "New",
    popularity: 72,
  },
  {
    id: "linen-shirt",
    name: "Linen Shirt",
    category: "clothing",
    price: 79,
    rating: 4.4,
    reviewCount: 1102,
    image: "https://picsum.photos/seed/linen-shirt/400/400",
    description:
      "100% European linen. Relaxed fit, breathable, perfect for warm days.",
    popularity: 68,
  },
  {
    id: "pour-over-coffee-kit",
    name: "Pour-over Coffee Kit",
    category: "home",
    price: 65,
    rating: 4.8,
    reviewCount: 2109,
    image: "https://picsum.photos/seed/pour-over-coffee-kit/400/400",
    description:
      "Ceramic dripper, glass carafe, 40 filters. Brew cafe-quality coffee at home.",
    badge: "Best Seller",
    popularity: 82,
  },
  {
    id: "ceramic-vase-set",
    name: "Ceramic Vase Set",
    category: "home",
    price: 89,
    rating: 4.7,
    reviewCount: 478,
    image: "https://picsum.photos/seed/ceramic-vase-set/400/400",
    description:
      "Set of 3 handcrafted ceramic vases in earth tones. Each piece is unique.",
    badge: "New",
    popularity: 65,
  },
  {
    id: "linen-duvet",
    name: "Linen Duvet",
    category: "home",
    price: 199,
    originalPrice: 259,
    rating: 4.9,
    reviewCount: 1567,
    image: "https://picsum.photos/seed/linen-duvet/400/400",
    description:
      "Stonewashed French linen. Gets softer with every wash. Queen size.",
    badge: "Sale",
    popularity: 78,
  },
  {
    id: "plant-stand",
    name: "Plant Stand",
    category: "home",
    price: 49,
    rating: 4.5,
    reviewCount: 892,
    image: "https://picsum.photos/seed/plant-stand/400/400",
    description:
      "Mid-century modern bamboo stand. Adjustable height, holds pots up to 12\".",
    popularity: 60,
  },
];

export const categories = [
  { name: "Electronics", slug: "electronics", icon: "💻" },
  { name: "Clothing", slug: "clothing", icon: "👔" },
  { name: "Home", slug: "home", icon: "🏠" },
] as const;

export function getProductsByCategory(category: string): Product[] {
  return products.filter((p) => p.category === category);
}

export function getFeaturedProducts(): Product[] {
  return products.filter((p) => p.badge === "Best Seller").slice(0, 3);
}
