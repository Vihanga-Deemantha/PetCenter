import "dotenv/config";
import mongoose from "mongoose";
import connectDB from "./db.js";
import User from "../models/User.js";
import Product from "../models/Products.js";
import PetListing from "../models/PetListing.js";
import Shelter from "../models/Shelter.js";
import Campaign from "../models/Campaign.js";
import Donation from "../models/Donation.js";
import Review from "../models/Review.js";

const img = (seed, w = 400, h = 400) => ({
  url: `https://picsum.photos/seed/${seed}/${w}/${h}`,
  publicId: `seed_${seed}`,
});

const SEED_PRODUCTS = [
  // ── FISH ────────────────────────────────────────────────────────────────────
  {
    name: "AquaClear 60-Litre Starter Aquarium",
    description: "A crystal-clear glass aquarium with a sturdy frame, suitable for tropical community fish. Includes a fitted lid with a built-in fluorescent hood.",
    category: "habitat",
    price: 8999,
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
    price: 14999,
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
    name: "Plated Aquarium Decoration Bundle",
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

const run = async () => {
  await connectDB();

  console.log("🧹 Clearing existing data (except users to keep hashes intact)...");
  try {
    await Campaign.updateMany({}, { status: "draft" });
  } catch (e) {
    // ignore if no campaigns/schema error
  }
  await Promise.all([
    Product.deleteMany({}),
    PetListing.deleteMany({}),
    Shelter.deleteMany({}),
    Campaign.deleteMany({}),
    Review.deleteMany({}),
  ]);

  // 1. Seed Users (Admin, Customer, Vendor)
  console.log("👤 Seeding users...");
  let admin = await User.findOne({ email: "admin@petcenter.com" });
  if (!admin) {
    admin = await User.create({
      name: "Super Admin",
      email: "admin@petcenter.com",
      password: "AdminPassword123!",
      phone: "+94771234567",
      location: "Colombo, Sri Lanka",
      role: "admin",
    });
  }

  let customer = await User.findOne({ email: "customer@petcenter.com" });
  if (!customer) {
    customer = await User.create({
      name: "John Doe",
      email: "customer@petcenter.com",
      password: "CustomerPassword123!",
      phone: "+94777654321",
      location: "Kandy, Sri Lanka",
      role: "user",
    });
  }

  let vendor = await User.findOne({ email: "vendor@petcenter.com" });
  if (!vendor) {
    vendor = await User.create({
      name: "Pet Vendor Sri Lanka",
      email: "vendor@petcenter.com",
      password: "VendorPassword123!",
      phone: "+94711122334",
      location: "Galle, Sri Lanka",
      role: "user",
    });
  }

  console.log("✅ Users seeded successfully!");

  // 2. Seed Products
  console.log("📦 Seeding products...");
  const createdProducts = await Product.insertMany(SEED_PRODUCTS);
  console.log(`✅ Seeded ${createdProducts.length} ecosystem products!`);

  // 3. Seed Shelters
  console.log("🏠 Seeding animal shelters...");
  const colomboRescue = await Shelter.create({
    name: "Colombo Animal Rescue & Sanctuary",
    type: "shelter",
    description: "Dedicated to rescuing, rehabilitating, and rehoming street dogs and abandoned pets in the Colombo metro area.",
    location: { city: "Colombo", country: "Sri Lanka" },
    contact: { phone: "+94112345678", email: "info@colomborescue.org", website: "https://colomborescue.org" },
    logo: { url: "https://picsum.photos/seed/colombo_rescue/200/200", publicId: "logo_colombo" },
    needsList: ["Puppy Kibble", "Antibiotic Ointments", "Volunteers for Sunday Dog Walking"],
    isVerified: true,
    isActive: true,
  });

  const kandyPaws = await Shelter.create({
    name: "Kandy Paws Rehab Network",
    type: "rehabilitation",
    description: "Rehabilitation center specializing in disabled, blind, and senior street animals.",
    location: { city: "Kandy", country: "Sri Lanka" },
    contact: { phone: "+94812345678", email: "help@kandypaws.org", website: "https://kandypaws.org" },
    logo: { url: "https://picsum.photos/seed/kandy_paws/200/200", publicId: "logo_kandy" },
    needsList: ["Wheelchairs for dogs", "Cat Food", "Sterilization Fund Donations"],
    isVerified: true,
    isActive: true,
  });
  console.log("✅ Shelters seeded!");

  // 4. Seed Campaigns
  console.log("📣 Seeding campaigns...");
  const deadline = new Date();
  deadline.setDate(deadline.getDate() + 30); // 30 days from now

  const campaign1 = await Campaign.create({
    title: "Emergency Surgery for Bubu the Puppy",
    description: "Bubu was rescued from a hit-and-run with multiple hip fractures. He needs urgent orthopedic surgery to walk again.",
    shortDescription: "Urgent hip surgery fund for a rescued hit-and-run puppy.",
    goalAmount: 150000, // $1500.00
    raisedAmount: 45000,
    donorCount: 12,
    images: [{ url: "https://picsum.photos/seed/bubu_puppy/800/600", publicId: "camp_bubu" }],
    category: "medical",
    status: "active",
    deadline,
    beneficiary: colomboRescue._id,
    createdBy: admin._id,
  });

  const campaign2 = await Campaign.create({
    title: "Food & Milk Supplies for Kandy Paws",
    description: "Help us secure a 3-month supply of nutritious dry food and puppy formula for our 85 resident rescue animals.",
    shortDescription: "Food supply fund for 85 disabled and senior rescues.",
    goalAmount: 300000, // $3000.00
    raisedAmount: 120000,
    donorCount: 38,
    images: [{ url: "https://picsum.photos/seed/kandy_food/800/600", publicId: "camp_kandy" }],
    category: "food",
    status: "active",
    deadline,
    beneficiary: kandyPaws._id,
    createdBy: admin._id,
  });
  console.log("✅ Campaigns seeded!");

  // 5. Seed Pet Listings
  console.log("🐶 Seeding pet listings...");
  await PetListing.create({
    title: "Playful Golden Retriever Puppy",
    petType: "dog",
    breed: "Golden Retriever",
    age: 3,
    gender: "male",
    price: 45000,
    location: "Colombo",
    description: "Very active and friendly Golden Retriever puppy. De-wormed and first vaccination completed. Looking for a loving home.",
    healthInfo: "Vaccinated, de-wormed. Health card available.",
    images: ["https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&q=80&w=800"],
    contactDetails: "+94711122334",
    listingType: "sale",
    status: "active",
    owner: vendor._id,
  });

  await PetListing.create({
    title: "Adorable Calico Kitten",
    petType: "cat",
    breed: "Domestic Shorthair",
    age: 2,
    gender: "female",
    price: 0,
    location: "Kandy",
    description: "Cute Calico kitten rescued from the streets. Very affectionate and litter trained. Free for adoption.",
    healthInfo: "Vet checked, de-wormed.",
    images: ["https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&q=80&w=800"],
    contactDetails: "+94711122334",
    listingType: "adoption",
    status: "active",
    owner: vendor._id,
  });

  await PetListing.create({
    title: "Green Iguana (Juvenile)",
    petType: "reptile",
    breed: "Iguana",
    age: 6,
    gender: "unknown",
    price: 18000,
    location: "Galle",
    description: "Healthy juvenile Green Iguana. Feeding well on fresh leafy greens and fruits. Requires a proper heated enclosure.",
    healthInfo: "Active and alert, no skin issues.",
    images: ["https://images.unsplash.com/photo-1504450874802-0ba2bcd9b2ae?auto=format&fit=crop&q=80&w=800"],
    contactDetails: "+94711122334",
    listingType: "sale",
    status: "active",
    owner: vendor._id,
  });
  console.log("✅ Pet listings seeded!");

  // 6. Seed Reviews
  console.log("⭐ Seeding product reviews...");
  const filterProduct = createdProducts.find(p => p.tags.includes("filter"));
  const tankProduct = createdProducts.find(p => p.tags.includes("tank"));

  if (filterProduct) {
    await Review.create({
      productId: filterProduct._id,
      userId: customer._id,
      orderId: new mongoose.Types.ObjectId(), // mock order id
      rating: 5,
      comment: "Absolutely amazing canister filter! Extremely quiet and keeps my 100L aquarium crystal clear.",
      isVisible: true,
    });
    await Review.create({
      productId: filterProduct._id,
      userId: vendor._id,
      orderId: new mongoose.Types.ObjectId(),
      rating: 4,
      comment: "Very solid flow rate and plenty of media space. Docked 1 star because the hoses were a bit short.",
      isVisible: true,
    });

    // Update product average rating
    filterProduct.averageRating = 4.5;
    filterProduct.reviewCount = 2;
    await filterProduct.save();
  }

  if (tankProduct) {
    await Review.create({
      productId: tankProduct._id,
      userId: customer._id,
      orderId: new mongoose.Types.ObjectId(),
      rating: 5,
      comment: "Beautiful low-iron glass tank. The clarity is spectacular, well worth the price!",
      isVisible: true,
    });

    tankProduct.averageRating = 5.0;
    tankProduct.reviewCount = 1;
    await tankProduct.save();
  }
  console.log("✅ Product reviews seeded!");

  console.log("\n🎉 DATABASE SEEDING COMPLETED SUCCESSFULLY! 🌱🐾");
  console.log("  Default Accounts Available:");
  console.log("    • Admin:    admin@petcenter.com    / AdminPassword123!");
  console.log("    • Customer: customer@petcenter.com / CustomerPassword123!");
  console.log("    • Vendor:   vendor@petcenter.com   / VendorPassword123!");
  console.log("\n  You can now log in and test all features including ecosystem builders, marketplace, storefront, campaigns, and reviews!");

  await mongoose.disconnect();
};

run().catch((err) => {
  console.error("❌ Seeding failed:", err);
  process.exit(1);
});
