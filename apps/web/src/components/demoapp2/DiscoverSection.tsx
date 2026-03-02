"use client";

const discoverCards = [
  {
    title: "SNAP EBT",
    subtitle: "Pay with EBT online or in-store",
    icon: "💳",
    bgColor: "#1B4D7B",
  },
  {
    title: "Recipes",
    subtitle: "Discover meal ideas & save ingredients",
    icon: "📖",
    bgColor: "#2D5F2B",
  },
  {
    title: "FreshPass",
    subtitle: "Unlimited free delivery & exclusive deals",
    icon: "🚚",
    bgColor: "#8B1A1A",
  },
];

export default function DiscoverSection() {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        More to Discover
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {discoverCards.map((card) => (
          <button
            key={card.title}
            className="relative overflow-hidden rounded-xl h-[180px] group cursor-pointer"
            style={{ backgroundColor: card.bgColor }}
          >
            {/* Decorative circles */}
            <div className="absolute -right-6 -top-6 w-32 h-32 rounded-full bg-white/5" />
            <div className="absolute -right-2 bottom-0 w-24 h-24 rounded-full bg-white/5" />

            <div className="relative h-full flex flex-col justify-between p-6 text-white">
              <span className="text-4xl">{card.icon}</span>
              <div>
                <h3 className="text-lg font-bold mb-1">{card.title}</h3>
                <p className="text-sm text-white/80">{card.subtitle}</p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}
