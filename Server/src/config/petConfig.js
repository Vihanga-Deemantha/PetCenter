/**
 * petConfig.js — Static habitat profiles for all supported pet types.
 *
 * Design decision: This data is stored as a static config file, not a MongoDB
 * collection. It represents engineering knowledge encoded once and never
 * changed at runtime. A static file is faster, simpler, version-controlled,
 * and requires no database query.
 *
 * Category keys must match the `tags` field on Product documents in MongoDB.
 * A product tagged with ["heater"] and compatiblePets: ["snake"] will appear
 * in the snake builder's "Heater" accordion section.
 */

const PET_CONFIGS = {
  // ─── FISH ─────────────────────────────────────────────────────────────────
  fish: {
    displayName: "Fish",
    iconName: "fish",
    description:
      "Fish require a carefully maintained aquatic environment. Water quality, temperature stability, and proper filtration are the foundations of a healthy aquarium.",
    habitat: {
      tankSizeMin: 40, // litres
      temperatureRange: { min: 24, max: 28 }, // °C (tropical)
      humidityRange: null, // not applicable
      lightingHours: 10,
      uvRequired: false,
    },
    categories: [
      {
        key: "tank",
        label: "Tank / Aquarium",
        required: true,
        maxSelectable: 1,
        description: "The primary living space. Size matters — bigger tanks are more stable.",
      },
      {
        key: "filter",
        label: "Filter",
        required: true,
        maxSelectable: 1,
        description: "Essential for water quality. Removes ammonia, nitrites, and waste.",
      },
      {
        key: "heater",
        label: "Heater",
        required: true,
        maxSelectable: 1,
        description: "Tropical fish need water between 24–28°C. A quality heater is non-negotiable.",
      },
      {
        key: "thermometer",
        label: "Thermometer",
        required: false,
        maxSelectable: 1,
        description: "Monitor water temperature daily. Digital probes are more accurate.",
      },
      {
        key: "lighting",
        label: "Lighting",
        required: false,
        maxSelectable: 1,
        description: "Supports plant growth and enhances fish colours. Use a timer for consistency.",
      },
      {
        key: "substrate",
        label: "Substrate / Gravel",
        required: false,
        maxSelectable: 1,
        description: "Gravel or sand for the tank floor. Provides biological filtration surface.",
      },
      {
        key: "decoration",
        label: "Decorations",
        required: false,
        maxSelectable: 4,
        description: "Plants, caves, driftwood — provide hiding spots and enrichment.",
      },
      {
        key: "air-pump",
        label: "Air Pump",
        required: false,
        maxSelectable: 1,
        description: "Improves oxygenation and surface agitation. Especially useful in warm tanks.",
      },
      {
        key: "water-conditioner",
        label: "Water Conditioner",
        required: false,
        maxSelectable: 2,
        description: "Neutralises chlorine and chloramines in tap water. Use on every water change.",
      },
    ],
    tips: [
      "Cycle your tank for 4–6 weeks before adding fish to establish beneficial bacteria.",
      "Change 25% of the water weekly to keep nitrates low and the environment stable.",
      "Overfiltering is almost impossible — a larger filter is always better.",
      "Research species compatibility before mixing fish — some are territorial or predatory.",
    ],
  },

  // ─── SNAKE ────────────────────────────────────────────────────────────────
  snake: {
    displayName: "Snake",
    iconName: "snake",
    description:
      "Snakes are ectothermic and rely entirely on their environment for body temperature regulation. A proper thermal gradient, secure enclosure, and correct humidity are essential for their health.",
    habitat: {
      tankSizeMin: 90, // litres (minimum for a ball python)
      temperatureRange: { min: 26, max: 32 }, // °C gradient
      humidityRange: { min: 50, max: 60 }, // %
      lightingHours: 12,
      uvRequired: false,
    },
    categories: [
      {
        key: "enclosure",
        label: "Enclosure",
        required: true,
        maxSelectable: 1,
        description: "A secure, escape-proof terrarium. Front-opening designs ease handling.",
      },
      {
        key: "heater",
        label: "Heat Source",
        required: true,
        maxSelectable: 1,
        description: "Under-tank heaters or ceramic heat emitters create the essential warm side.",
      },
      {
        key: "thermostat",
        label: "Thermostat",
        required: true,
        maxSelectable: 1,
        description: "Controls heat output precisely. Prevents dangerous overheating — never skip this.",
      },
      {
        key: "substrate",
        label: "Substrate",
        required: false,
        maxSelectable: 1,
        description: "Coco coir, cypress mulch, or bioactive mixes help maintain humidity.",
      },
      {
        key: "thermometer",
        label: "Thermometer",
        required: false,
        maxSelectable: 2,
        description: "Monitor both the warm side and cool side. IR guns give instant spot readings.",
      },
      {
        key: "water-dish",
        label: "Water Dish",
        required: false,
        maxSelectable: 1,
        description: "Large enough for the snake to soak in. Clean and refill weekly.",
      },
      {
        key: "hide",
        label: "Hides",
        required: false,
        maxSelectable: 2,
        description: "One on the warm side, one on the cool side. Snakes need security to thrive.",
      },
      {
        key: "lighting",
        label: "Lighting",
        required: false,
        maxSelectable: 1,
        description: "LED or low-heat daylight bulbs provide a natural day/night cycle.",
      },
      {
        key: "decoration",
        label: "Decorations",
        required: false,
        maxSelectable: 3,
        description: "Branches, cork bark, fake plants — environmental enrichment reduces stress.",
      },
    ],
    tips: [
      "Always use a thermostat with any heat source — overheating can be fatal.",
      "Snakes feel secure when they can touch all four sides of a hide. Bigger is not better.",
      "Do not handle your snake for 48 hours after feeding to avoid regurgitation.",
      "A thermal gradient (warm end + cool end) lets your snake thermoregulate naturally.",
    ],
  },

  // ─── BIRD ─────────────────────────────────────────────────────────────────
  bird: {
    displayName: "Bird",
    iconName: "bird",
    description:
      "Birds are intelligent, social animals that need mental stimulation, proper nutrition, and a spacious cage. They thrive with routine, enrichment, and interaction.",
    habitat: {
      tankSizeMin: null, // cage size varies by species
      temperatureRange: { min: 18, max: 26 }, // °C
      humidityRange: { min: 40, max: 60 }, // %
      lightingHours: 12,
      uvRequired: false,
    },
    categories: [
      {
        key: "cage",
        label: "Cage",
        required: true,
        maxSelectable: 1,
        description: "As large as possible — birds need room to spread their wings fully.",
      },
      {
        key: "food-dish",
        label: "Food Dish",
        required: true,
        maxSelectable: 2,
        description: "Stainless steel or ceramic dishes are hygienic and easy to clean.",
      },
      {
        key: "water-dish",
        label: "Water Dish",
        required: false,
        maxSelectable: 1,
        description: "Refresh water daily. Some birds prefer a water bottle drinker.",
      },
      {
        key: "perch",
        label: "Perches",
        required: false,
        maxSelectable: 3,
        description: "Varied widths and textures promote foot health and prevent arthritis.",
      },
      {
        key: "toys",
        label: "Toys",
        required: false,
        maxSelectable: 4,
        description: "Foraging toys, bells, swings — mental stimulation prevents feather plucking.",
      },
      {
        key: "cuttlebone",
        label: "Cuttlebone / Mineral Block",
        required: false,
        maxSelectable: 1,
        description: "Provides calcium and helps keep the beak trimmed naturally.",
      },
      {
        key: "bird-food",
        label: "Bird Food",
        required: false,
        maxSelectable: 2,
        description: "Species-appropriate pellets plus fresh fruit and vegetables daily.",
      },
    ],
    tips: [
      "Birds should not be kept in the kitchen — cooking fumes, especially from non-stick pans, are deadly.",
      "Cover the cage at night to give your bird 10–12 hours of undisturbed sleep.",
      "Rotate toys weekly to keep your bird mentally engaged and prevent boredom.",
      "Never feed avocado, chocolate, onion, or caffeine — these are toxic to birds.",
    ],
  },

  // ─── SPIDER ───────────────────────────────────────────────────────────────
  spider: {
    displayName: "Tarantula / Spider",
    iconName: "spider",
    description:
      "Tarantulas are low-maintenance but require precise environment control. Most species are terrestrial and need suitable substrate depth for burrowing.",
    habitat: {
      tankSizeMin: 20, // litres
      temperatureRange: { min: 24, max: 28 }, // °C
      humidityRange: { min: 65, max: 80 }, // % (varies by species)
      lightingHours: 0, // most prefer darkness
      uvRequired: false,
    },
    categories: [
      {
        key: "enclosure",
        label: "Enclosure",
        required: true,
        maxSelectable: 1,
        description: "Secure ventilation is critical. Side-opening enclosures are safer for handling.",
      },
      {
        key: "substrate",
        label: "Substrate",
        required: true,
        maxSelectable: 1,
        description: "Coco coir or peat mix at 10–15cm depth for burrowing species.",
      },
      {
        key: "hide",
        label: "Hide",
        required: false,
        maxSelectable: 1,
        description: "A cork tube or half-log provides a secure retreat for your spider.",
      },
      {
        key: "water-dish",
        label: "Water Dish",
        required: false,
        maxSelectable: 1,
        description: "A shallow bottle cap or small dish prevents drowning. Refresh weekly.",
      },
      {
        key: "thermometer",
        label: "Thermometer / Hygrometer",
        required: false,
        maxSelectable: 1,
        description: "Monitor both temperature and humidity — combo units are cost-effective.",
      },
      {
        key: "decoration",
        label: "Decorations",
        required: false,
        maxSelectable: 2,
        description: "Fake plants or cork bark add climbing surfaces and visual complexity.",
      },
    ],
    tips: [
      "Most tarantulas are nocturnal — observe them in dim light rather than bright illumination.",
      "Do not handle your tarantula within a week of a moult — their exoskeleton is fragile.",
      "Never use insecticides near a tarantula enclosure — they are highly sensitive to chemicals.",
      "Underfeeding is safer than overfeeding — remove uneaten prey after 24 hours.",
    ],
  },

  // ─── TURTLE ───────────────────────────────────────────────────────────────
  turtle: {
    displayName: "Turtle",
    iconName: "turtle",
    description:
      "Turtles need both aquatic and dry land areas (basking spots), UV-B lighting for shell health, and powerful filtration due to their high waste output.",
    habitat: {
      tankSizeMin: 120, // litres
      temperatureRange: { min: 24, max: 30 }, // °C (water)
      humidityRange: null,
      lightingHours: 12,
      uvRequired: true,
    },
    categories: [
      {
        key: "tank",
        label: "Tank / Aquatic Setup",
        required: true,
        maxSelectable: 1,
        description: "A large aquarium with a dry basking area. Water depth should be 1.5x the shell length.",
      },
      {
        key: "filter",
        label: "Filter",
        required: true,
        maxSelectable: 1,
        description: "Turtles produce a lot of waste — use a filter rated for 2–3x your tank volume.",
      },
      {
        key: "uv-light",
        label: "UV-B Lighting",
        required: true,
        maxSelectable: 1,
        description: "Essential for metabolising calcium and preventing metabolic bone disease.",
      },
      {
        key: "heater",
        label: "Water Heater",
        required: false,
        maxSelectable: 1,
        description: "Keeps water at 24–28°C. A submersible heater with a guard prevents burns.",
      },
      {
        key: "basking-lamp",
        label: "Basking Lamp",
        required: false,
        maxSelectable: 1,
        description: "Creates a dry warm spot at 30–35°C where turtles dry off and warm up.",
      },
      {
        key: "thermometer",
        label: "Thermometer",
        required: false,
        maxSelectable: 2,
        description: "Monitor both water temperature and basking spot temperature separately.",
      },
      {
        key: "decoration",
        label: "Decorations / Basking Platform",
        required: false,
        maxSelectable: 3,
        description: "Floating platforms, rocks, and aquatic plants create an enriching environment.",
      },
    ],
    tips: [
      "UV-B lamps lose effectiveness before they burn out — replace every 6–12 months.",
      "Turtles outgrow small tanks quickly — plan for adult size from the start.",
      "Clean the filter every 2 weeks and do 25% water changes weekly.",
      "Never release pet turtles into the wild — it harms local ecosystems and is often illegal.",
    ],
  },

  // ─── MOUSE ────────────────────────────────────────────────────────────────
  mouse: {
    displayName: "Mouse",
    iconName: "mouse",
    description:
      "Mice are social, curious, and active, especially at night. They need deep substrate for burrowing, plenty of enrichment, and company — mice should ideally be kept in same-sex pairs or groups.",
    habitat: {
      tankSizeMin: 50, // litres
      temperatureRange: { min: 18, max: 24 }, // °C
      humidityRange: { min: 30, max: 70 }, // %
      lightingHours: 12,
      uvRequired: false,
    },
    categories: [
      {
        key: "enclosure",
        label: "Cage / Tank",
        required: true,
        maxSelectable: 1,
        description: "Wire-bar cages with narrow spacing (under 1cm) or a glass tank with a secure mesh lid.",
      },
      {
        key: "substrate",
        label: "Substrate / Bedding",
        required: true,
        maxSelectable: 1,
        description: "Paper-based or aspen bedding at 15–20cm depth for burrowing behaviour.",
      },
      {
        key: "wheel",
        label: "Exercise Wheel",
        required: false,
        maxSelectable: 1,
        description: "A solid-surface wheel 15–20cm in diameter. Mesh wheels injure tiny feet.",
      },
      {
        key: "hide",
        label: "Hides / Nest Box",
        required: false,
        maxSelectable: 2,
        description: "Wooden or ceramic hides where mice can retreat and nest safely.",
      },
      {
        key: "food-dish",
        label: "Food Dish",
        required: false,
        maxSelectable: 1,
        description: "A heavy ceramic dish prevents tipping. Supplement with scattered foraging food.",
      },
      {
        key: "water-bottle",
        label: "Water Bottle / Dish",
        required: false,
        maxSelectable: 1,
        description: "Sipper bottles keep water clean; small dishes for enrichment variety.",
      },
      {
        key: "toys",
        label: "Enrichment / Toys",
        required: false,
        maxSelectable: 4,
        description: "Tunnels, climbing ropes, chew toys — mice are intelligent and need stimulation.",
      },
    ],
    tips: [
      "Mice are social animals — lone mice can become depressed. Keep at least two females together.",
      "Spot-clean bedding every 2 days and do a full clean every 1–2 weeks.",
      "Avoid cedar or pine wood shavings — the aromatic oils are toxic to small mammals.",
      "Male mice have a strong odour. Females are generally recommended for indoor keeping.",
    ],
  },

  // ─── REPTILE (general) ────────────────────────────────────────────────────
  reptile: {
    displayName: "Reptile (General)",
    iconName: "reptile",
    description:
      "A general profile for reptiles not covered by a specific type. Lizards, geckos, and monitors share core requirements: a thermal gradient, UV-B lighting, and appropriate humidity.",
    habitat: {
      tankSizeMin: 60, // litres
      temperatureRange: { min: 24, max: 35 }, // °C gradient
      humidityRange: { min: 40, max: 70 }, // % (species dependent)
      lightingHours: 12,
      uvRequired: true,
    },
    categories: [
      {
        key: "enclosure",
        label: "Enclosure",
        required: true,
        maxSelectable: 1,
        description: "Front-opening terrariums with good ventilation are ideal for most lizards.",
      },
      {
        key: "uv-light",
        label: "UV-B Lighting",
        required: true,
        maxSelectable: 1,
        description: "Most diurnal reptiles need UV-B to synthesise vitamin D3 for bone health.",
      },
      {
        key: "heater",
        label: "Heat Source",
        required: true,
        maxSelectable: 1,
        description: "Basking bulbs, ceramic heat emitters, or deep heat projectors.",
      },
      {
        key: "thermostat",
        label: "Thermostat",
        required: false,
        maxSelectable: 1,
        description: "Dimming stats for basking bulbs; on/off stats for ceramic emitters.",
      },
      {
        key: "substrate",
        label: "Substrate",
        required: false,
        maxSelectable: 1,
        description: "Species-appropriate: topsoil mix, tile, reptile carpet, or bioactive.",
      },
      {
        key: "thermometer",
        label: "Thermometer",
        required: false,
        maxSelectable: 2,
        description: "Measure basking spot and cool end separately for accurate gradient tracking.",
      },
      {
        key: "hide",
        label: "Hides",
        required: false,
        maxSelectable: 2,
        description: "Cork bark hides on both warm and cool ends reduce stress.",
      },
      {
        key: "decoration",
        label: "Decorations",
        required: false,
        maxSelectable: 4,
        description: "Branches, rocks, fake plants — species-specific enrichment.",
      },
    ],
    tips: [
      "Research your specific species carefully — generalised care is a starting point, not a full guide.",
      "UV-B output degrades over time. Replace bulbs every 6 months even if they still glow.",
      "Handle new reptiles sparingly for the first 2 weeks to allow acclimatisation.",
      "Quarantine any new reptile for 30–60 days before housing with existing animals.",
    ],
  },

  // ─── AMPHIBIAN ────────────────────────────────────────────────────────────
  amphibian: {
    displayName: "Amphibian",
    iconName: "amphibian",
    description:
      "Amphibians (frogs, salamanders, axolotls) have permeable skin that absorbs everything in their environment. Chlorine-free water, precise humidity, and zero contaminants are critical.",
    habitat: {
      tankSizeMin: 40, // litres
      temperatureRange: { min: 18, max: 26 }, // °C (species dependent)
      humidityRange: { min: 70, max: 100 }, // % (most are high-humidity)
      lightingHours: 10,
      uvRequired: false,
    },
    categories: [
      {
        key: "enclosure",
        label: "Terrarium / Vivarium",
        required: true,
        maxSelectable: 1,
        description: "High-humidity glass terrariums with a tight-fitting mesh lid.",
      },
      {
        key: "substrate",
        label: "Substrate",
        required: true,
        maxSelectable: 1,
        description: "Coco coir, sphagnum moss, or bioactive mixes retain moisture without mould.",
      },
      {
        key: "water-feature",
        label: "Water Feature / Dish",
        required: false,
        maxSelectable: 1,
        description: "Most amphibians need a shallow water area for soaking and hydration.",
      },
      {
        key: "misting-system",
        label: "Misting System",
        required: false,
        maxSelectable: 1,
        description: "Automated misters maintain correct humidity without manual intervention.",
      },
      {
        key: "lighting",
        label: "Lighting",
        required: false,
        maxSelectable: 1,
        description: "Low-heat LED panels support planted vivariums without drying the air.",
      },
      {
        key: "thermometer",
        label: "Thermometer / Hygrometer",
        required: false,
        maxSelectable: 1,
        description: "Combination units track both temperature and humidity simultaneously.",
      },
      {
        key: "decoration",
        label: "Plants / Decorations",
        required: false,
        maxSelectable: 4,
        description: "Live plants maintain humidity and provide hiding spaces naturally.",
      },
    ],
    tips: [
      "Always use dechlorinated or RO water — chlorine and chloramines pass straight through amphibian skin.",
      "Never handle amphibians with sunscreen, hand cream, or insect repellent on your skin.",
      "Most amphibians are nocturnal — they are most active in the first few hours after lights-out.",
      "Bioactive setups with isopods and springtails self-clean and maintain humidity naturally.",
    ],
  },
};

// Supported pet type keys — used for validation in routes and frontend
export const SUPPORTED_PET_TYPES = Object.keys(PET_CONFIGS);

export default PET_CONFIGS;
