/**
 * seedEcosystem.js — Idempotent seed script for Phase 4 Ecosystem Builder.
 *
 * Usage: node src/config/seedEcosystem.js
 * (Run from the Server/ directory with the .env file in place)
 *
 * What it does:
 *   - Connects to MongoDB using the existing MONGODB_URI environment variable
 *   - Checks if ecosystem-tagged products already exist (idempotent guard)
 *   - If not, creates representative products for fish, snake, and bird
 *   - Uses static placeholder image URLs (no Cloudinary upload required)
 *   - Exits cleanly after completion
 *
 * Product coverage:
 *   Fish:  tank, filter, heater (required) + thermometer, decoration (optional)
 *   Snake: enclosure, heater, thermostat (required) + hide, substrate (optional)
 *   Bird:  cage, food-dish (required) + perch, toys, water-dish (optional)
 */

import "dotenv/config";
import mongoose from "mongoose";
import connectDB from "./db.js";
import Product from "../models/Products.js";

// ─── Static Placeholder Images ────────────────────────────────────────────────
// Using picsum.photos with fixed seeds for deterministic, consistent images
const img = (seed, w = 400, h = 400) => ({
  url: `https://picsum.photos/seed/${seed}/${w}/${h}`,
  publicId: `seed_${seed}`,
});

// ─── Seed Data ────────────────────────────────────────────────────────────────
const SEED_PRODUCTS = [
  // ── FISH ────────────────────────────────────────────────────────────────────
  {
    name: "AquaClear 60-Litre Starter Aquarium",
    description: "A crystal-clear glass aquarium with a sturdy frame, suitable for tropical community fish. Includes a fitted lid with a built-in fluorescent hood.",
    category: "habitat",
    price: 8999,  // $89.99 in cents
    stock: 15,
    brand: "AquaClear",
    compatiblePets: ["fish"],
    tags: ["tank"],
    images: [img("aquarium1"), img("aquarium2")],
  },
  {
    name: "AquaMaster 100-Litre Pro Tank",
    description: "Larger glass aquarium for a community of tropical fish. Low-iron glass for maximum clarity. Includes safety base mat.",
    category: "habitat",
    price: 14999,  // $149.99
    stock: 8,
    brand: "AquaMaster",
    compatiblePets: ["fish"],
    tags: ["tank"],
    images: [img("aquarium3"), img("aquarium4")],
  },
  {
    name: "Cascade Internal Power Filter",
    description: "Multi-stage internal filter providing mechanical, biological, and chemical filtration. Suitable for tanks up to 80 litres. Quiet operation.",
    category: "accessories",
    price: 2499,
    stock: 25,
    brand: "Cascade",
    compatiblePets: ["fish"],
    tags: ["filter"],
    images: [img("filter1")],
  },
  {
    name: "TurboFlow Canister Filter 1000L/hr",
    description: "External canister filter for tanks 80–200 litres. Includes media baskets pre-loaded with filter foam, bio-balls, and activated carbon.",
    category: "accessories",
    price: 6499,
    stock: 10,
    brand: "TurboFlow",
    compatiblePets: ["fish"],
    tags: ["filter"],
    images: [img("filter2")],
  },
  {
    name: "ThermoGuard 100W Submersible Heater",
    description: "Fully submersible shatterproof glass heater with an integrated thermostat. Maintains a precise ±0.5°C. Suitable for tanks up to 100 litres.",
    category: "accessories",
    price: 1999,
    stock: 30,
    brand: "ThermoGuard",
    compatiblePets: ["fish", "turtle", "amphibian"],
    tags: ["heater"],
    images: [img("heater_fish1")],
  },
  {
    name: "HeatWave 200W Aquarium Heater",
    description: "High-output heater for larger tanks (100–200L). Digital temperature display, auto-shutoff if water level drops below the element.",
    category: "accessories",
    price: 3499,
    stock: 18,
    brand: "HeatWave",
    compatiblePets: ["fish", "turtle"],
    tags: ["heater"],
    images: [img("heater_fish2")],
  },
  {
    name: "AccuTemp Digital Aquarium Thermometer",
    description: "LCD suction-cup thermometer with a probe sensor. Reads in 0.1°C increments. Battery included.",
    category: "accessories",
    price: 699,
    stock: 50,
    brand: "AccuTemp",
    compatiblePets: ["fish", "turtle", "amphibian"],
    tags: ["thermometer"],
    images: [img("thermometer1")],
  },
  {
    name: "Planted Aquarium Decoration Bundle",
    description: "Set of 5 artificial aquatic plants in varied heights and colours, plus two ceramic cave ornaments. Safe for all freshwater fish.",
    category: "accessories",
    price: 1799,
    stock: 20,
    brand: "AquaDecor",
    compatiblePets: ["fish", "turtle", "amphibian"],
    tags: ["decoration"],
    images: [img("decor_fish1"), img("decor_fish2")],
  },

  // ── SNAKE ───────────────────────────────────────────────────────────────────
  {
    name: "ProRep Wooden Vivarium 90x45x45cm",
    description: "Flat-pack wooden vivarium with front-opening sliding glass doors and mesh ventilation strips. Suitable for ball pythons, corn snakes, and similar species.",
    category: "habitat",
    price: 16999,
    stock: 7,
    brand: "ProRep",
    compatiblePets: ["snake", "reptile"],
    tags: ["enclosure"],
    images: [img("vivarium1"), img("vivarium2")],
  },
  {
    name: "ExoTerra Glass Terrarium 60x45x45cm",
    description: "Full-glass front-opening terrarium with twin doors, waterproof bottom, and raised bottom frame for a substrate heater. Escape-proof.",
    category: "habitat",
    price: 21999,
    stock: 5,
    brand: "ExoTerra",
    compatiblePets: ["snake", "reptile", "spider", "amphibian"],
    tags: ["enclosure"],
    images: [img("terrarium1"), img("terrarium2")],
  },
  {
    name: "HabiStat Mat Stat 100W Thermostat",
    description: "On/off pulse thermostat with a digital display. Controls under-tank heaters, heat mats, and ceramic heat emitters up to 100W. Essential safety device.",
    category: "accessories",
    price: 3999,
    stock: 20,
    brand: "HabiStat",
    compatiblePets: ["snake", "reptile", "amphibian", "spider"],
    tags: ["thermostat"],
    images: [img("thermostat1")],
  },
  {
    name: "ReptileZone Dimmer Thermostat 600W",
    description: "Dimming thermostat for use with basking bulbs and incandescent lamps up to 600W. Prevents overheating with high-temperature alarm.",
    category: "accessories",
    price: 5499,
    stock: 12,
    brand: "ReptileZone",
    compatiblePets: ["snake", "reptile", "turtle"],
    tags: ["thermostat"],
    images: [img("thermostat2")],
  },
  {
    name: "Komodo Heat Mat 14W (35x28cm)",
    description: "Under-tank heat mat providing belly warmth for snakes and lizards. Must be used with a thermostat. Adhesive backing stays in place.",
    category: "accessories",
    price: 1299,
    stock: 35,
    brand: "Komodo",
    compatiblePets: ["snake", "reptile", "spider"],
    tags: ["heater"],
    images: [img("heatmat1")],
  },
  {
    name: "Lucky Reptile Ceramic Heat Emitter 60W",
    description: "Ceramic heat emitter producing infrared heat without light — ideal for 24-hour heating. Must be used with a thermostat and ceramic bulb holder.",
    category: "accessories",
    price: 1599,
    stock: 22,
    brand: "Lucky Reptile",
    compatiblePets: ["snake", "reptile", "turtle"],
    tags: ["heater"],
    images: [img("ceramic_heater1")],
  },
  {
    name: "Eco Earth Coconut Fibre Substrate 8.8L",
    description: "Compressed brick of coconut fibre substrate. Expands to 8.8L when hydrated. Excellent for humidity-requiring species. Biodegradable.",
    category: "accessories",
    price: 899,
    stock: 40,
    brand: "Zoo Med",
    compatiblePets: ["snake", "reptile", "spider", "amphibian"],
    tags: ["substrate"],
    images: [img("substrate1")],
  },
  {
    name: "Cork Bark Hide (Medium)",
    description: "Natural cork bark shaped into a snug hide. Provides security on both warm and cool ends. Easy to clean and reusable.",
    category: "accessories",
    price: 799,
    stock: 30,
    brand: "ProRep",
    compatiblePets: ["snake", "reptile", "spider"],
    tags: ["hide"],
    images: [img("hide1")],
  },
  {
    name: "ProRep Plastic Cave Hide (Large)",
    description: "Durable plastic hide with a low-profile design. Interior is smooth for easy cleaning. Suitable for snakes up to 1.2m.",
    category: "accessories",
    price: 1099,
    stock: 25,
    brand: "ProRep",
    compatiblePets: ["snake", "reptile"],
    tags: ["hide"],
    images: [img("hide2")],
  },

  // ── BIRD ─────────────────────────────────────────────────────────────────────
  {
    name: "Ferplast Parrot Cage Omega 90",
    description: "Large wrought-iron cage for parrots and cockatiels. Double-opening door, sliding waste tray, and four food/water cups included. Powder-coated finish.",
    category: "habitat",
    price: 18999,
    stock: 6,
    brand: "Ferplast",
    compatiblePets: ["bird"],
    tags: ["cage"],
    images: [img("cage1"), img("cage2")],
  },
  {
    name: "Liberta Explorer Bird Cage",
    description: "Spacious cage for budgerigars and canaries. Ball-top design with multiple perch positions. Includes a pull-out base tray for easy cleaning.",
    category: "habitat",
    price: 8999,
    stock: 12,
    brand: "Liberta",
    compatiblePets: ["bird"],
    tags: ["cage"],
    images: [img("cage3"), img("cage4")],
  },
  {
    name: "Stainless Steel Bird Food Dish Set (2pk)",
    description: "Set of two 200ml stainless steel dishes with clip-on cage mounts. Dishwasher safe. Suitable for seed, fruit, pellets, and water.",
    category: "accessories",
    price: 699,
    stock: 45,
    brand: "BirdPro",
    compatiblePets: ["bird"],
    tags: ["food-dish"],
    images: [img("bird_dish1")],
  },
  {
    name: "Ceramic Bird Feeding Bowl (400ml)",
    description: "Heavy ceramic dish that clips securely to cage bars. Weighted base prevents tipping. Microwave and dishwasher safe.",
    category: "accessories",
    price: 899,
    stock: 30,
    brand: "Versele-Laga",
    compatiblePets: ["bird"],
    tags: ["food-dish"],
    images: [img("bird_dish2")],
  },
  {
    name: "Natural Rope Cotton Perch (30cm)",
    description: "Knotted cotton rope perch with stainless steel cage clips at both ends. Flexible design exercises foot grip and prevents arthritis.",
    category: "accessories",
    price: 599,
    stock: 50,
    brand: "JW Pet",
    compatiblePets: ["bird"],
    tags: ["perch"],
    images: [img("perch1")],
  },
  {
    name: "Drinkwell Bird Sipper Bottle (200ml)",
    description: "Spill-proof sipper bottle with a stainless steel spout. Attaches to any cage bar. Graduated markings to monitor daily intake.",
    category: "accessories",
    price: 799,
    stock: 35,
    brand: "Drinkwell",
    compatiblePets: ["bird"],
    tags: ["water-dish"],
    images: [img("water_bird1")],
  },
  {
    name: "Bird Foraging Toy Bundle (3pc)",
    description: "Three varied enrichment toys: a shreddable paper puzzle, a bell swing, and a wooden bead toss toy. Suitable for budgies, cockatiels, and small parrots.",
    category: "toys",
    price: 1299,
    stock: 25,
    brand: "JW Pet",
    compatiblePets: ["bird"],
    tags: ["toys"],
    images: [img("bird_toys1"), img("bird_toys2")],
  },
  {
    name: "Versele-Laga Budgie Complete Seed Mix (1kg)",
    description: "Scientifically formulated seed and pellet mix enriched with vitamins and minerals. No artificial colours or preservatives.",
    category: "food",
    price: 899,
    stock: 60,
    brand: "Versele-Laga",
    compatiblePets: ["bird"],
    tags: ["bird-food"],
    images: [img("bird_food1")],
  },
];

// ─── Run Seed ─────────────────────────────────────────────────────────────────
const run = async () => {
  await connectDB();

  // Idempotency guard: check if any ecosystem-tagged products already exist
  const existingCount = await Product.countDocuments({
    tags: { $in: ["tank", "enclosure", "cage"] },
  });

  if (existingCount > 0) {
    console.log(`⚠️  Seed skipped: ${existingCount} ecosystem-tagged products already exist.`);
    console.log("   Delete them manually or drop the collection to re-seed.");
    await mongoose.disconnect();
    return;
  }

  console.log("🌱 Seeding ecosystem products...");
  const created = await Product.insertMany(SEED_PRODUCTS);
  console.log(`✅ Created ${created.length} products:`);

  // Summary by pet type
  const byPet = {};
  for (const p of created) {
    for (const pet of p.compatiblePets) {
      if (!byPet[pet]) byPet[pet] = [];
      byPet[pet].push(`${p.name} [${p.tags.join(",")}]`);
    }
  }
  for (const [pet, products] of Object.entries(byPet)) {
    console.log(`\n  ${pet.toUpperCase()} (${products.length} products):`);
    products.forEach((p) => console.log(`    • ${p}`));
  }

  console.log("\n🎉 Ecosystem seed complete. You can now test the builder.");
  await mongoose.disconnect();
};

run().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
