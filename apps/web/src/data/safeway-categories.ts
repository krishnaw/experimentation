export interface GroceryCategory {
  id: string;
  name: string;
  icon: string;
  image: string;
  productCount: number;
}

export const groceryCategories: GroceryCategory[] = [
  { id: "produce", name: "Produce", icon: "🥬", image: "/images/demoapp2/categories/produce.jpg", productCount: 48 },
  { id: "dairy", name: "Dairy & Eggs", icon: "🥛", image: "/images/demoapp2/categories/dairy.jpg", productCount: 36 },
  { id: "meat", name: "Meat & Seafood", icon: "🥩", image: "/images/demoapp2/categories/meat.jpg", productCount: 32 },
  { id: "bakery", name: "Bakery", icon: "🍞", image: "/images/demoapp2/categories/bakery.jpg", productCount: 24 },
  { id: "frozen", name: "Frozen Foods", icon: "🧊", image: "/images/demoapp2/categories/frozen.jpg", productCount: 42 },
  { id: "snacks", name: "Snacks & Chips", icon: "🍿", image: "/images/demoapp2/categories/snacks.jpg", productCount: 38 },
  { id: "beverages", name: "Beverages", icon: "🥤", image: "/images/demoapp2/categories/beverages.jpg", productCount: 52 },
  { id: "pantry", name: "Pantry", icon: "🥫", image: "/images/demoapp2/categories/pantry.jpg", productCount: 64 },
  { id: "deli", name: "Deli", icon: "🥪", image: "/images/demoapp2/categories/deli.jpg", productCount: 28 },
  { id: "breakfast", name: "Breakfast", icon: "🥣", image: "/images/demoapp2/categories/breakfast.jpg", productCount: 30 },
  { id: "organic", name: "Organic", icon: "🌱", image: "/images/demoapp2/categories/organic.jpg", productCount: 56 },
  { id: "baby", name: "Baby & Kids", icon: "🍼", image: "/images/demoapp2/categories/baby.jpg", productCount: 18 },
  { id: "health", name: "Health & Beauty", icon: "💊", image: "/images/demoapp2/categories/health.jpg", productCount: 44 },
  { id: "household", name: "Household", icon: "🧹", image: "/images/demoapp2/categories/household.jpg", productCount: 40 },
  { id: "pet", name: "Pet Care", icon: "🐾", image: "/images/demoapp2/categories/pet.jpg", productCount: 22 },
  { id: "wine", name: "Wine & Spirits", icon: "🍷", image: "/images/demoapp2/categories/wine.jpg", productCount: 34 },
];
