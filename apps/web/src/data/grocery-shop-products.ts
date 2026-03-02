export interface GroceryProduct {
  id: string;
  name: string;
  description: string;
  category: string;
  offerPrice: string;
  image: string;
  badge?: "Sale" | "New" | "BOGO" | "Hot";
  popularity: number;
}

export const groceryProducts: GroceryProduct[] = [
  // Snacks
  { id: "40998936", name: "Chocolate Truffles", description: "8-oz. box", category: "Snacks", offerPrice: "$0.50 off", image: "/images/demoapp2/deals/40998936.jpg", badge: "Sale", popularity: 88 },
  { id: "41655740", name: "Kettle Cooked Chips", description: "8-oz. bag. Limit 4.", category: "Snacks", offerPrice: "$1.00 off", image: "/images/demoapp2/deals/41655740.jpg", popularity: 82 },
  { id: "45435793", name: "Chocolate Chip Cookies", description: "13-oz. pack", category: "Snacks", offerPrice: "$3.78 Each", image: "/images/demoapp2/deals/45435793.jpg", popularity: 90 },

  // Beverages
  { id: "41761198", name: "Bottled Spring Water", description: "24-pk., 16.9-oz.", category: "Beverages", offerPrice: "$2.00 off", image: "/images/demoapp2/deals/41761198.jpg", popularity: 80 },
  { id: "56134297", name: "Iced Coffee", description: "32-oz. bottle", category: "Beverages", offerPrice: "$2.99 each", image: "/images/demoapp2/deals/56134297.jpg", popularity: 88 },
  { id: "77872185", name: "Monster Energy Drinks", description: "12-pk., 16-oz. Limit 2.", category: "Beverages", offerPrice: "$3.00 off", image: "/images/demoapp2/deals/77872185.jpg", badge: "Hot", popularity: 91 },
  { id: "81142207", name: "Fresh Orange Juice", description: "64-oz. +CRV", category: "Beverages", offerPrice: "$3.28 Each", image: "/images/demoapp2/deals/81142207.jpg", popularity: 75 },

  // Bakery
  { id: "41877579", name: "Artisan Wheat Bread", description: "24-oz. loaf", category: "Bakery", offerPrice: "$4.99 each", image: "/images/demoapp2/deals/41877579.jpg", popularity: 87 },
  { id: "66068340", name: "Signature SELECT Muffins", description: "4-ct. In the Bakery.", category: "Bakery", offerPrice: "$1.00 OFF", image: "/images/demoapp2/deals/66068340.jpg", badge: "Sale", popularity: 83 },

  // Frozen
  { id: "42515773", name: "Strawberry Ice Cream Cone", description: "Single serve", category: "Frozen", offerPrice: "$3.99 each", image: "/images/demoapp2/deals/42515773.jpg", badge: "Hot", popularity: 95 },
  { id: "51627442", name: "Freschetta Pizza", description: "17.65-30.88-oz.", category: "Frozen", offerPrice: "$4.99 each", image: "/images/demoapp2/deals/51627442.jpg", popularity: 89 },
  { id: "65317258", name: "Nestlé Drumstick", description: "8-20-ct.", category: "Frozen", offerPrice: "$6.99 each", image: "/images/demoapp2/deals/65317258.jpg", popularity: 86 },

  // Meat & Seafood
  { id: "45811735", name: "Fresh Atlantic Salmon", description: "7-oz. Farm raised. Limit 4.", category: "Meat & Seafood", offerPrice: "$4.99 each", image: "/images/demoapp2/deals/45811735.jpg", badge: "Sale", popularity: 93 },
  { id: "62906449", name: "Wild Caught Shrimp", description: "16-oz. frozen", category: "Meat & Seafood", offerPrice: "$7.99 each", image: "/images/demoapp2/deals/62906449.jpg", popularity: 81 },
  { id: "86631822", name: "Premium Ribeye Steak", description: "12-oz. USDA Choice", category: "Meat & Seafood", offerPrice: "$4.95 Each", image: "/images/demoapp2/deals/86631822.jpg", popularity: 79 },

  // Dairy
  { id: "51005924", name: "Aged Cheddar Wheel", description: "8-oz. wedge", category: "Dairy", offerPrice: "$4.99 each", image: "/images/demoapp2/deals/51005924.jpg", popularity: 77 },
  { id: "51415321", name: "Strawberry Yogurt Parfait", description: "5.3-oz. cup", category: "Dairy", offerPrice: "$0.99 each", image: "/images/demoapp2/deals/51415321.jpg", badge: "Sale", popularity: 96 },

  // Breakfast
  { id: "48234651", name: "Kellogg's Cereals", description: "6.6-oz. or larger, any flavor.", category: "Breakfast", offerPrice: "$1.00 OFF", image: "/images/demoapp2/deals/48234651.jpg", popularity: 86 },
  { id: "78543019", name: "Organic Power Bowl", description: "10-oz. bowl", category: "Breakfast", offerPrice: "$1.00 off", image: "/images/demoapp2/deals/78543019.jpg", badge: "New", popularity: 73 },
];
