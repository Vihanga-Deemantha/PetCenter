// Fictional demo catalog used by seedAll.js. Contacts use example.com and the
// image URLs are deterministic so repeated seeds produce the same records.
// Every product, pet, shelter, and campaign uses its own original local image.

const slug = (value) =>
  value.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");

const fileSlug = (value) =>
  value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const product = (name, category, price, stock, compatiblePets, tags, _imageTerm, description) => ({
  name,
  description,
  category,
  price,
  stock,
  brand: "Habitat & Co.",
  compatiblePets,
  tags,
  images: [{
    url: `/demo-images/catalog/product-${fileSlug(name)}.webp`,
    publicId: `demo_product_${slug(name)}_cover`,
  }],
  isActive: true,
});

export const DEMO_PRODUCTS = [
  product("AquaClear 60-Litre Starter Aquarium", "habitat", 8999, 18, ["fish"], ["tank"], "aquarium", "A clear glass starter aquarium with a fitted lid and feeding hatch for small tropical communities."),
  product("AquaMaster 100-Litre Pro Tank", "habitat", 14999, 10, ["fish"], ["tank"], "aquarium", "A low-iron glass aquarium with a reinforced base, ideal for planted and community setups."),
  product("Cascade Internal Power Filter", "accessories", 2499, 32, ["fish"], ["filter"], "aquarium-filter", "Quiet three-stage filtration for aquariums up to 80 litres with reusable filter media."),
  product("TurboFlow Canister Filter 1000L/hr", "accessories", 6499, 14, ["fish", "turtle"], ["filter"], "canister-filter", "High-capacity external filtration with separate mechanical, biological, and carbon media baskets."),
  product("ThermoGuard 100W Submersible Heater", "accessories", 1999, 38, ["fish", "turtle", "amphibian"], ["heater"], "aquarium-heater", "Thermostatically controlled, shatter-resistant heater for stable tropical water temperatures."),
  product("AccuTemp Digital Aquarium Thermometer", "accessories", 699, 55, ["fish", "turtle", "amphibian"], ["thermometer"], "aquarium-thermometer", "Waterproof digital probe with an easy-read display and high-low temperature memory."),
  product("Freshwater Spectrum LED Light 60cm", "habitat", 3299, 22, ["fish", "amphibian"], ["lighting"], "aquarium-light", "Timer-ready full-spectrum LED bar that supports plant growth without overheating the habitat."),
  product("Natural Riverbed Gravel 10kg", "habitat", 1899, 26, ["fish"], ["substrate"], "aquarium-gravel", "Rounded, inert gravel washed and graded for freshwater aquariums and planted tanks."),
  product("OxygenAir Twin Outlet Pump", "accessories", 1699, 30, ["fish"], ["air-pump"], "aquarium-air-pump", "Low-noise dual outlet air pump with adjustable flow for improved surface oxygenation."),
  product("AquaSafe Tap Water Conditioner 500ml", "healthcare", 1299, 48, ["fish", "turtle", "amphibian"], ["water-conditioner"], "water-conditioner", "Concentrated conditioner that neutralises chlorine, chloramine, and heavy metals."),
  product("Natural Aquascape Decoration Set", "habitat", 2199, 24, ["fish", "turtle"], ["decoration"], "aquarium-decoration", "A smooth cave, driftwood-style arch, and silk plants for shelter and visual enrichment."),
  product("TurtleFlow Heavy-Duty Filter 1500L/hr", "accessories", 8499, 9, ["turtle"], ["filter"], "turtle-filter", "Oversized waste-handling filter designed for aquatic turtle tanks up to 250 litres."),
  product("Turtle Haven 150-Litre Aquatic Tank", "habitat", 23999, 7, ["turtle"], ["tank"], "turtle-tank", "Long-form aquatic tank with reinforced glass and space for an above-water basking area."),
  product("ProRep Wooden Vivarium 90x45x45cm", "habitat", 16999, 8, ["snake", "reptile"], ["enclosure"], "wooden-vivarium", "Front-opening insulated vivarium with secure sliding glass and cross-flow ventilation."),
  product("ExoTerra Glass Terrarium 60x45x45cm", "habitat", 21999, 7, ["snake", "reptile", "spider", "amphibian"], ["enclosure"], "glass-terrarium", "Water-resistant front-opening terrarium with cable ports and a removable mesh top."),
  product("Nano Web Terrestrial Enclosure 30cm", "habitat", 7499, 13, ["spider"], ["enclosure"], "tarantula-enclosure", "Low-profile acrylic enclosure with secure ventilation designed for terrestrial tarantulas."),
  product("Rainforest Tall Vivarium 45x45x60cm", "habitat", 18999, 8, ["amphibian", "reptile"], ["enclosure"], "rainforest-vivarium", "Tall planted-vivarium enclosure with a waterproof base and generous climbing height."),
  product("HabiStat Mat Stat 100W Thermostat", "accessories", 3999, 25, ["snake", "reptile", "spider"], ["thermostat"], "reptile-thermostat", "Reliable on-off thermostat for heat mats and low-wattage habitat heaters."),
  product("ReptileZone Dimming Thermostat 600W", "accessories", 7299, 16, ["snake", "reptile"], ["thermostat"], "dimming-thermostat", "Smooth dimming control for basking lamps and deep heat projectors with day-night settings."),
  product("Komodo Heat Mat 14W", "habitat", 1299, 42, ["snake", "reptile", "spider"], ["heater"], "reptile-heat-mat", "Slim under-tank heat mat for gentle ambient warmth when paired with a thermostat."),
  product("Ceramic Heat Emitter 60W", "habitat", 1599, 29, ["snake", "reptile", "turtle"], ["heater"], "ceramic-heat-emitter", "Light-free infrared heat source for maintaining overnight habitat temperatures."),
  product("Deep Heat Projector 80W", "habitat", 2999, 18, ["snake", "reptile"], ["heater"], "reptile-heater", "Wide-beam infrared projector that creates natural, penetrating warmth at the basking zone."),
  product("Eco Earth Coconut Fibre 8.8L", "habitat", 899, 60, ["snake", "reptile", "spider", "amphibian", "mouse"], ["substrate"], "coconut-substrate", "Expandable coconut fibre bedding that retains moisture while supporting burrowing behaviour."),
  product("Forest Floor Cypress Bedding 12L", "habitat", 1399, 37, ["snake", "reptile", "amphibian"], ["substrate"], "reptile-bedding", "Dust-reduced cypress bedding for humid reptile and amphibian habitats."),
  product("Sphagnum Moss Humidity Pack", "habitat", 999, 44, ["amphibian", "spider", "reptile"], ["substrate"], "sphagnum-moss", "Long-fibre moss for humid hides, planted vivariums, and moisture-sensitive species."),
  product("Cork Bark Hide Medium", "habitat", 799, 41, ["snake", "reptile", "spider", "mouse"], ["hide"], "cork-hide", "Natural cork retreat that offers secure cover and a textured climbing surface."),
  product("Slate Rock Cave Hide Large", "habitat", 1699, 23, ["snake", "reptile", "mouse"], ["hide"], "reptile-hide", "Stable resin cave with smooth internal surfaces and a natural slate appearance."),
  product("Shallow Soaking and Water Dish", "accessories", 1099, 34, ["snake", "bird", "spider", "amphibian", "reptile"], ["water-dish"], "reptile-water-dish", "Heavy low-profile dish with easy access and a non-tip textured base."),
  product("Dual Digital Thermometer Hygrometer", "accessories", 1899, 35, ["snake", "reptile", "spider", "amphibian"], ["thermometer"], "thermometer-hygrometer", "Dual-probe monitor that tracks warm-side temperature and enclosure humidity."),
  product("Infrared Habitat Temperature Gun", "accessories", 2799, 20, ["snake", "reptile", "turtle"], ["thermometer"], "infrared-thermometer", "Instant non-contact surface readings for basking spots and thermal gradients."),
  product("Terrarium Daylight LED Bar", "habitat", 2899, 21, ["snake", "reptile", "amphibian"], ["lighting"], "terrarium-light", "Low-heat daylight bar for natural viewing cycles and planted habitat growth."),
  product("Jungle Vine and Foliage Kit", "habitat", 1799, 27, ["snake", "reptile", "spider", "amphibian"], ["decoration"], "terrarium-decoration", "Flexible vines, broad leaves, and anchor clips for cover and climbing enrichment."),
  product("RainCloud Automatic Misting System", "accessories", 8999, 11, ["amphibian", "reptile"], ["misting-system"], "terrarium-mister", "Programmable pump with two fine-mist nozzles for consistent humidity control."),
  product("Paludarium Cascade Water Feature", "habitat", 4299, 12, ["amphibian"], ["water-feature"], "paludarium-waterfall", "Compact recirculating waterfall and soaking pool for humid amphibian setups."),
  product("ReptiSun Compact UVB 10.0 Lamp", "healthcare", 2499, 31, ["reptile", "turtle"], ["uv-light"], "uvb-lamp", "High-output UVB lamp that supports vitamin D3 synthesis and healthy calcium metabolism."),
  product("T5 Linear UVB Habitat Kit 60cm", "healthcare", 6799, 15, ["reptile", "turtle"], ["uv-light"], "linear-uvb", "Reflector fixture and replaceable T5 tube for broad, even UVB coverage."),
  product("Turtle Basking Lamp 75W", "habitat", 1899, 28, ["turtle"], ["basking-lamp"], "turtle-basking-lamp", "Focused daylight heat lamp that creates a warm, dry basking zone."),
  product("Floating Turtle Basking Platform", "habitat", 2399, 20, ["turtle"], ["decoration"], "turtle-platform", "Textured floating dock with an adjustable ramp and secure suction mounts."),
  product("Omega 90 Parrot Cage", "habitat", 18999, 7, ["bird"], ["cage"], "parrot-cage", "Powder-coated rolling cage with a play top, removable tray, and secure feeding doors."),
  product("Explorer Flight Cage", "habitat", 8999, 14, ["bird"], ["cage"], "bird-cage", "Wide flight cage for budgies, finches, and cockatiels with multiple perch positions."),
  product("Stainless Steel Bird Dish Set", "accessories", 699, 53, ["bird"], ["food-dish"], "bird-food-dish", "Two dishwasher-safe clip-on dishes for pellets, seed, fruit, or water."),
  product("Weighted Ceramic Feeding Bowl", "accessories", 899, 36, ["bird", "mouse"], ["food-dish"], "ceramic-pet-bowl", "Stable glazed bowl with a low rim and hygienic dishwasher-safe finish."),
  product("Spill-Guard Bird Sipper 200ml", "accessories", 799, 39, ["bird"], ["water-dish"], "bird-water-bottle", "Clear cage-mounted drinker with volume marks and a stainless dispensing tip."),
  product("Natural Cotton Rope Perch", "toys", 599, 58, ["bird"], ["perch"], "bird-perch", "Flexible cotton perch that encourages varied grip and gentle foot exercise."),
  product("Manzanita Branch Perch", "habitat", 1299, 30, ["bird"], ["perch"], "natural-bird-perch", "Naturally varied hardwood perch with stainless cage fittings."),
  product("Bird Foraging Toy Bundle", "toys", 1299, 33, ["bird"], ["toys"], "bird-toys", "Three rotating puzzles for shredding, climbing, and reward-based foraging."),
  product("Natural Cuttlebone Mineral Block", "healthcare", 499, 66, ["bird"], ["cuttlebone"], "cuttlebone", "Calcium-rich cuttlebone with a cage clip to support beak and bone health."),
  product("Complete Small Bird Pellet Mix 1kg", "food", 899, 70, ["bird"], ["bird-food"], "bird-food", "Balanced daily pellets with seeds, dried vegetables, and essential micronutrients."),
  product("Mouse Manor Ventilated Habitat", "habitat", 6499, 16, ["mouse"], ["enclosure"], "mouse-cage", "Deep-base mouse enclosure with narrow bar spacing and a secure ventilated lid."),
  product("Silent Runner Mouse Wheel 18cm", "toys", 1499, 28, ["mouse"], ["wheel"], "mouse-wheel", "Solid-surface wheel with a stable stand and quiet ball-bearing axle."),
  product("Mini Ceramic Mouse Food Dish", "accessories", 599, 47, ["mouse"], ["food-dish"], "mouse-food-bowl", "Low, weighted dish sized for mice and other small rodents."),
  product("No-Drip Mouse Water Bottle 150ml", "accessories", 699, 50, ["mouse"], ["water-bottle"], "mouse-water-bottle", "Cage-mounted bottle with a stainless twin-ball nozzle to minimise leaks."),
  product("Mouse Tunnel and Chew Set", "toys", 1199, 40, ["mouse"], ["toys"], "mouse-toys", "Cardboard tunnels, willow chews, and a climbing bridge for daily enrichment."),
  product("SoftNest Paper Bedding 20L", "cleaning", 1399, 45, ["mouse"], ["substrate"], "paper-bedding", "Low-dust recycled paper bedding that is soft, absorbent, and safe for burrowing."),
];

const pet = (title, petType, breed, age, gender, price, location, listingType, status = "active") => ({
  title,
  petType,
  breed,
  age,
  gender,
  price,
  location,
  listingType,
  status,
  description: `${title} is a well-observed ${breed.toLowerCase()} looking for a prepared, species-appropriate home. The future keeper should research handling, diet, lifespan, and habitat requirements before enquiring.`,
  healthInfo: "Routine health observation completed. Ask the current keeper for feeding records and arrange an independent veterinary check before rehoming.",
  verifiedFlags: petType === "bird" ? ["Habitat Included"] : [],
  images: [`/demo-images/catalog/pet-${fileSlug(title)}.webp`],
  imagePublicIds: [`demo_pet_${slug(title)}_cover`],
});

export const DEMO_PETS = [
  pet("Blue Marble Betta", "fish", "Betta splendens", 8, "male", 24, "Colombo", "sale"),
  pet("Sunset Guppy Trio", "fish", "Fancy Guppy", 5, "unknown", 30, "Galle", "sale"),
  pet("Neon Tetra School of Eight", "fish", "Neon Tetra", 6, "unknown", 38, "Kandy", "sale"),
  pet("Calm Young Goldfish Pair", "fish", "Fantail Goldfish", 10, "unknown", 42, "Negombo", "sale"),
  pet("Silver Veil Angelfish", "fish", "Freshwater Angelfish", 9, "female", 35, "Colombo", "sale", "pending"),

  pet("Sky the Friendly Budgie", "bird", "Budgerigar", 10, "male", 55, "Colombo", "sale"),
  pet("Pearl the Hand-Tame Cockatiel", "bird", "Cockatiel", 16, "female", 140, "Kandy", "sale"),
  pet("Mango and Lime Lovebird Pair", "bird", "Peach-faced Lovebird", 18, "unknown", 180, "Gampaha", "sale"),
  pet("Zebra Finch Companion Pair", "bird", "Zebra Finch", 12, "unknown", 65, "Kurunegala", "sale"),
  pet("Pico the Green-cheek Conure", "bird", "Green-cheek Conure", 22, "male", 260, "Colombo", "sale", "paused"),

  pet("Ember the Corn Snake", "snake", "Corn Snake", 14, "female", 120, "Colombo", "sale"),
  pet("Orbit the Ball Python", "snake", "Ball Python", 20, "male", 190, "Kandy", "sale"),
  pet("Pepper the California Kingsnake", "snake", "California Kingsnake", 16, "female", 165, "Galle", "sale"),
  pet("Ruby the Milk Snake", "snake", "Milk Snake", 11, "unknown", 145, "Negombo", "sale"),
  pet("Dune the Kenyan Sand Boa", "snake", "Kenyan Sand Boa", 13, "male", 155, "Colombo", "sale", "pending"),

  pet("Rosie the Chilean Rose", "spider", "Chilean Rose Tarantula", 30, "female", 85, "Colombo", "sale"),
  pet("Cocoa the Mexican Red Knee", "spider", "Mexican Red Knee Tarantula", 24, "female", 135, "Kandy", "sale"),
  pet("Fuzz the Curly Hair Tarantula", "spider", "Curly Hair Tarantula", 18, "unknown", 75, "Galle", "sale"),
  pet("Onyx the Brazilian Black", "spider", "Brazilian Black Tarantula", 28, "female", 160, "Colombo", "sale", "pending"),

  pet("River the Musk Turtle", "turtle", "Common Musk Turtle", 26, "female", 95, "Colombo", "sale"),
  pet("Scout the Painted Turtle", "turtle", "Painted Turtle", 32, "male", 110, "Kandy", "sale"),
  pet("Pebble the Map Turtle", "turtle", "Mississippi Map Turtle", 20, "female", 105, "Galle", "sale"),
  pet("Moss the Box Turtle", "turtle", "Asian Box Turtle", 48, "unknown", 0, "Matara", "adoption"),
  pet("Sunny the Slider", "turtle", "Red-eared Slider", 36, "female", 45, "Negombo", "adoption", "paused"),

  pet("Hazel and Poppy Mouse Pair", "mouse", "Fancy Mouse", 5, "female", 0, "Colombo", "adoption"),
  pet("Cloud the Satin Mouse", "mouse", "Satin Mouse", 4, "male", 18, "Kandy", "sale"),
  pet("Maple the Long-haired Mouse", "mouse", "Long-haired Fancy Mouse", 6, "female", 20, "Galle", "sale"),
  pet("Pip the Brindle Mouse", "mouse", "Brindle Fancy Mouse", 5, "male", 17, "Gampaha", "sale"),
  pet("Willow Mouse Trio", "mouse", "Fancy Mouse", 7, "female", 0, "Kurunegala", "adoption", "adopted"),

  pet("Leo the Leopard Gecko", "reptile", "Leopard Gecko", 14, "male", 115, "Colombo", "sale"),
  pet("Fern the Crested Gecko", "reptile", "Crested Gecko", 12, "female", 130, "Kandy", "sale"),
  pet("Atlas the Bearded Dragon", "reptile", "Bearded Dragon", 18, "male", 210, "Galle", "sale"),
  pet("Blue the Skink", "reptile", "Blue-tongued Skink", 26, "female", 280, "Colombo", "sale"),
  pet("Ivy the Green Iguana", "reptile", "Green Iguana", 10, "unknown", 125, "Negombo", "sale"),
  pet("Mint the Green Anole", "reptile", "Green Anole", 8, "male", 45, "Matara", "sale", "sold"),

  pet("Luna the Axolotl", "amphibian", "Leucistic Axolotl", 13, "female", 95, "Colombo", "sale"),
  pet("Miso the White's Tree Frog", "amphibian", "White's Tree Frog", 15, "male", 70, "Kandy", "sale"),
  pet("Azure Dart Frog Pair", "amphibian", "Dyeing Dart Frog", 11, "unknown", 145, "Galle", "sale"),
  pet("Rusty the Tiger Salamander", "amphibian", "Tiger Salamander", 20, "female", 85, "Colombo", "sale"),
  pet("Fire-bellied Toad Trio", "amphibian", "Fire-bellied Toad", 12, "unknown", 75, "Gampaha", "sale"),
];

export const DEMO_SHELTERS = [
  { key: "harbor-paws", name: "Harbor Paws Rescue", type: "rescue", city: "Colombo", imageTerm: "dog cat animal rescue", description: "A foster-led rescue supporting abandoned dogs, cats, and emergency veterinary cases across the western coast.", needsList: ["Puppy food", "Flea prevention", "Weekend foster homes"] },
  { key: "hill-country", name: "Hill Country Animal Haven", type: "shelter", city: "Kandy", imageTerm: "animal shelter dogs", description: "A small community shelter focused on rehabilitation, adoption matching, and humane street-animal care.", needsList: ["Senior pet food", "Blankets", "Transport volunteers"] },
  { key: "southern-wings", name: "Southern Wings & Whiskers", type: "foster_network", city: "Galle", imageTerm: "bird cat foster rescue", description: "A network of home-based foster carers helping companion birds, cats, and small mammals prepare for new homes.", needsList: ["Bird pellets", "Cat carriers", "Foster supplies"] },
  { key: "green-tail", name: "Green Tail Exotic Rescue", type: "rehabilitation", city: "Colombo", imageTerm: "reptile rescue terrarium", description: "Species-aware temporary care for surrendered reptiles, amphibians, and other exotic companion animals.", needsList: ["UVB lamps", "Secure terrariums", "Reptile veterinary fund"] },
  { key: "lagoon-vet", name: "Lagoon Community Vet Clinic", type: "vet_clinic", city: "Negombo", imageTerm: "veterinary clinic animal", description: "A community clinic providing subsidised sterilisation, vaccinations, and urgent treatment for rescue partners.", needsList: ["Vaccination sponsorships", "Surgical gloves", "Recovery crates"] },
  { key: "tiny-paws", name: "Tiny Paws Foster Collective", type: "foster_network", city: "Gampaha", imageTerm: "kitten puppy foster", description: "A volunteer foster collective for orphaned kittens, puppies, mice, and other small companion animals.", needsList: ["Milk replacer", "Paper bedding", "Digital kitchen scales"] },
  { key: "matara-sanctuary", name: "Matara Coastal Animal Sanctuary", type: "shelter", city: "Matara", imageTerm: "animal sanctuary dog", description: "Long-term sanctuary and adoption support for injured street animals and pets whose keepers can no longer care for them.", needsList: ["Wound care supplies", "Dry food", "Shade netting"] },
  { key: "north-star", name: "North Star Rescue Network", type: "rescue", city: "Jaffna", imageTerm: "animal rescue transport", description: "A regional volunteer network coordinating rescues, transport, foster placements, and responsible adoptions.", needsList: ["Fuel vouchers", "Travel crates", "Parasite treatment"] },
].map((s, index) => ({
  ...s,
  location: { city: s.city, country: "Sri Lanka" },
  contact: {
    phone: `+94110000${String(index + 1).padStart(3, "0")}`,
    email: `${s.key}@example.com`,
    website: `https://example.com/${s.key}`,
  },
  logo: {
    url: `/demo-images/catalog/shelter-${s.key}.webp`,
    publicId: `demo_shelter_${s.key}`,
  },
  isVerified: true,
  isActive: true,
}));

export const DEMO_CAMPAIGNS = [
  { key: "emergency-surgery", title: "Emergency Surgery for a Rescued Puppy", shelterKey: "harbor-paws", imageTerm: "puppy veterinary surgery", category: "medical", goalAmount: 420000, contributions: [4500, 10000, 25000, 12000, 30000], shortDescription: "Help fund urgent orthopaedic surgery and recovery care for a rescued puppy." },
  { key: "three-month-food", title: "Three-Month Shelter Food Reserve", shelterKey: "hill-country", imageTerm: "animal shelter pet food", category: "food", goalAmount: 300000, contributions: [15000, 22000, 8000, 18000, 12000, 25000], shortDescription: "Build a reliable food reserve for senior and recovering shelter animals." },
  { key: "bird-foster", title: "Safe Bird Foster Room", shelterKey: "southern-wings", imageTerm: "bird rescue aviary", category: "shelter", goalAmount: 180000, contributions: [12000, 18000, 9000, 15000], shortDescription: "Equip a quiet foster room with safe cages, lighting, and quarantine supplies." },
  { key: "exotic-care", title: "Exotic Animal Care Equipment", shelterKey: "green-tail", imageTerm: "reptile veterinary care", category: "rehabilitation", goalAmount: 260000, contributions: [20000, 12500, 17500, 24000, 11000], shortDescription: "Provide thermostats, UVB lighting, and secure habitats for rescued exotic pets." },
  { key: "sterilisation-week", title: "Community Sterilisation Week", shelterKey: "lagoon-vet", imageTerm: "veterinarian dog cat clinic", category: "medical", goalAmount: 500000, contributions: [35000, 50000, 25000, 40000, 15000, 30000], shortDescription: "Sponsor safe sterilisation and aftercare for community dogs and cats." },
  { key: "orphan-care", title: "Orphaned Kitten and Puppy Care", shelterKey: "tiny-paws", imageTerm: "orphan kitten puppy", category: "rescue", goalAmount: 150000, contributions: [7500, 12500, 5000, 15000, 9000], shortDescription: "Supply milk replacer, warming equipment, and health checks for orphaned litters." },
  { key: "recovery-kennels", title: "Weather-Safe Recovery Kennels", shelterKey: "matara-sanctuary", imageTerm: "animal shelter kennel", category: "shelter", goalAmount: 380000, contributions: [20000, 30000, 18000, 22000, 27000], shortDescription: "Build shaded, washable recovery kennels for injured coastal rescues." },
  { key: "rescue-transport", title: "Regional Rescue Transport Fund", shelterKey: "north-star", imageTerm: "animal rescue transport van", category: "rescue", goalAmount: 240000, contributions: [10000, 16000, 8000, 21000, 12000], shortDescription: "Keep volunteer rescue transport available for animals needing urgent help." },
  { key: "vaccination-drive", title: "Vaccination and Microchip Drive", shelterKey: "harbor-paws", imageTerm: "pet vaccination veterinarian", category: "general", goalAmount: 210000, contributions: [18000, 12000, 20000, 15000, 10000], shortDescription: "Fund core vaccinations and microchips before rescued pets are adopted." },
  { key: "senior-comfort", title: "Comfort Care for Senior Animals", shelterKey: "hill-country", imageTerm: "senior dog animal care", category: "rehabilitation", goalAmount: 175000, contributions: [11000, 14000, 9000, 13000, 17000], shortDescription: "Provide mobility support, soft bedding, and regular checks for senior residents." },
].map((campaign, index) => ({
  ...campaign,
  description: `${campaign.shortDescription} This is a fictional demonstration campaign used to exercise PetCenter's campaign, donation, and shelter workflows.`,
  images: [{
    url: `/demo-images/catalog/campaign-${campaign.key}.webp`,
    publicId: `demo_campaign_${campaign.key}_cover`,
  }],
  status: "active",
  featuredOrder: index < 3 ? index + 1 : null,
}));
