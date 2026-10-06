import "dotenv/config";
import mongoose from "mongoose";
import connectDB from "./db.js";
import PET_CONFIGS from "./petConfig.js";
import User from "../models/User.js";
import Product from "../models/Products.js";
import PetListing from "../models/PetListing.js";
import Shelter from "../models/Shelter.js";
import Campaign from "../models/Campaign.js";
import Donation from "../models/Donation.js";
import EcosystemBuild from "../models/EcosystemBuild.js";
import {
  DEMO_PRODUCTS,
  DEMO_PETS,
  DEMO_SHELTERS,
  DEMO_CAMPAIGNS,
} from "./demoSeedData.js";

const DEMO_PASSWORD = process.env.DEMO_ACCOUNT_PASSWORD || "DemoPassword123!";

const DEMO_ACCOUNTS = [
  { key: "admin", name: "PetCenter Demo Admin", email: "admin@petcenter.example", phone: "+94110000101", location: "Colombo", role: "admin" },
  { key: "buyer", name: "Nimali Perera", email: "buyer@petcenter.example", phone: "+94110000102", location: "Kandy", role: "user" },
  { key: "keeper-one", name: "Coastal Pet Keeper", email: "keeper1@petcenter.example", phone: "+94110000103", location: "Galle", role: "user" },
  { key: "keeper-two", name: "Hill Country Pet Keeper", email: "keeper2@petcenter.example", phone: "+94110000104", location: "Kandy", role: "user" },
  { key: "keeper-three", name: "City Exotic Keeper", email: "keeper3@petcenter.example", phone: "+94110000105", location: "Colombo", role: "user" },
];

const BUILD_NAMES = {
  fish: "Balanced Tropical Aquarium",
  snake: "Secure Snake Starter Habitat",
  bird: "Enriched Companion Bird Home",
  spider: "Calm Terrestrial Tarantula Setup",
  turtle: "Healthy Aquatic Turtle Habitat",
  mouse: "Deep-Bedding Mouse Enclosure",
  reptile: "Complete Reptile Thermal Habitat",
  amphibian: "Humidity-Safe Amphibian Vivarium",
};

const assertCatalog = () => {
  if (DEMO_PRODUCTS.length < 30 || DEMO_PRODUCTS.length > 60) {
    throw new Error(`Demo product count must be 30–60; received ${DEMO_PRODUCTS.length}`);
  }
  if (DEMO_PETS.length < 30 || DEMO_PETS.length > 50) {
    throw new Error(`Demo pet count must be 30–50; received ${DEMO_PETS.length}`);
  }

  const unique = (values) => new Set(values).size === values.length;
  if (!unique(DEMO_PRODUCTS.map((item) => item.name))) throw new Error("Demo product names must be unique");
  if (!unique(DEMO_PETS.map((item) => item.title))) throw new Error("Demo pet titles must be unique");

  const missingCoverage = [];
  for (const [petType, config] of Object.entries(PET_CONFIGS)) {
    for (const category of config.categories) {
      const hasCandidate = DEMO_PRODUCTS.some(
        (item) => item.compatiblePets.includes(petType) && item.tags.includes(category.key),
      );
      if (!hasCandidate) missingCoverage.push(`${petType}:${category.key}`);
    }
  }
  if (missingCoverage.length) {
    throw new Error(`Demo products do not cover these Ecosystem categories: ${missingCoverage.join(", ")}`);
  }
};

const ensureAccounts = async () => {
  const accounts = {};
  for (const account of DEMO_ACCOUNTS) {
    let user = await User.findOne({ email: account.email });
    if (!user) {
      user = await User.create({ ...account, password: DEMO_PASSWORD });
    } else {
      user.name = account.name;
      user.phone = account.phone;
      user.location = account.location;
      user.role = account.role;
      user.isDeleted = false;
      user.isBlocked = false;
      await user.save();
    }
    accounts[account.key] = user;
  }
  return accounts;
};

const seedProducts = async () => {
  const products = [];
  for (const item of DEMO_PRODUCTS) {
    products.push(await Product.findOneAndUpdate(
      { name: item.name },
      { $set: item },
      { upsert: true, returnDocument: "after", runValidators: true, setDefaultsOnInsert: true },
    ));
  }
  return products;
};

const archiveLegacyDemoData = async () => {
  const currentNames = DEMO_PRODUCTS.map((item) => item.name);
  const productResult = await Product.updateMany(
    {
      isActive: true,
      name: { $nin: currentNames },
      $or: [
        { "images.publicId": /^seed_/ },
        { name: /^Phase\d+ Verify Product$/ },
      ],
    },
    { $set: { isActive: false } },
  );
  const shelterResult = await Shelter.updateMany(
    { "logo.publicId": { $in: ["logo_colombo", "logo_kandy"] } },
    { $set: { isActive: false } },
  );
  const campaignResult = await Campaign.updateMany(
    { "images.publicId": { $in: ["camp_bubu", "camp_kandy"] } },
    { $set: { status: "draft" } },
  );
  return {
    products: productResult.modifiedCount,
    shelters: shelterResult.modifiedCount,
    campaigns: campaignResult.modifiedCount,
  };
};

const seedShelters = async () => {
  const shelters = {};
  for (const item of DEMO_SHELTERS) {
    const { key, city: _city, ...data } = item;
    shelters[key] = await Shelter.findOneAndUpdate(
      { "logo.publicId": data.logo.publicId },
      { $set: data },
      { upsert: true, returnDocument: "after", runValidators: true, setDefaultsOnInsert: true },
    );
  }
  return shelters;
};

const seedPets = async (accounts) => {
  const keepers = [accounts["keeper-one"], accounts["keeper-two"], accounts["keeper-three"]];
  const listings = [];
  for (const [index, item] of DEMO_PETS.entries()) {
    const owner = keepers[index % keepers.length];
    listings.push(await PetListing.findOneAndUpdate(
      { title: item.title },
      { $set: { ...item, owner: owner._id, contactDetails: owner.phone } },
      { upsert: true, returnDocument: "after", runValidators: true, setDefaultsOnInsert: true },
    ));
  }
  return listings;
};

const seedCampaignsAndDonations = async (accounts, shelters) => {
  const campaigns = [];
  for (const [campaignIndex, item] of DEMO_CAMPAIGNS.entries()) {
    const { key, shelterKey, contributions, ...campaignData } = item;
    const campaign = await Campaign.findOneAndUpdate(
      { title: campaignData.title },
      {
        $set: {
          ...campaignData,
          beneficiary: shelters[shelterKey]._id,
          createdBy: accounts.admin._id,
          deletedAt: null,
        },
        $setOnInsert: { raisedAmount: 0, donorCount: 0 },
      },
      { upsert: true, returnDocument: "after", runValidators: true, setDefaultsOnInsert: true },
    );

    for (const [contributionIndex, amount] of contributions.entries()) {
      const donor = contributionIndex % 2 === 0 ? accounts.buyer : accounts["keeper-one"];
      await Donation.findOneAndUpdate(
        { stripePaymentIntentId: `pi_demo_${key}_${contributionIndex + 1}` },
        { $set: {
          campaignId: campaign._id,
          userId: donor._id,
          displayName: donor.name,
          amount,
          status: "completed",
          message: contributionIndex === 0 ? "Wishing every animal a safe recovery." : "Demo contribution",
        } },
        { upsert: true, returnDocument: "after", runValidators: true, setDefaultsOnInsert: true },
      );
    }

    const donationTotals = await Donation.aggregate([
      { $match: { campaignId: campaign._id, status: "completed" } },
      { $group: { _id: "$campaignId", raisedAmount: { $sum: "$amount" }, donorCount: { $sum: 1 } } },
    ]);
    const totals = donationTotals[0] || { raisedAmount: 0, donorCount: 0 };
    campaign.raisedAmount = totals.raisedAmount;
    campaign.donorCount = totals.donorCount;
    campaign.status = campaign.raisedAmount >= campaign.goalAmount ? "goal_reached" : "active";
    await campaign.save();
    campaigns.push(campaign);

    await Campaign.updateOne(
      { _id: campaign._id },
      { $set: { createdAt: new Date(Date.now() - campaignIndex * 86_400_000) } },
    );
  }
  return campaigns;
};

const seedPublishedBuilds = async (accounts, products) => {
  const builds = [];
  for (const [index, [petType, config]] of Object.entries(PET_CONFIGS).entries()) {
    const selectedProducts = config.categories
      .filter((category) => category.required)
      .map((category) => ({
        category,
        product: products.find(
          (item) => item.compatiblePets.includes(petType) && item.tags.includes(category.key),
        ),
      }));

    const selections = selectedProducts.map(({ category, product: item }) => ({
      categoryKey: category.key,
      productId: item._id,
      productSnapshot: {
        name: item.name,
        price: item.price,
        image: item.images[0]?.url || "",
      },
    }));
    const totalPrice = selections.reduce((sum, selection) => sum + selection.productSnapshot.price, 0);

    const build = await EcosystemBuild.findOneAndUpdate(
      { userId: accounts.buyer._id, name: BUILD_NAMES[petType] },
      {
        $set: { petType, selections, totalPrice, isPublished: true },
        $setOnInsert: {
          publishedAt: new Date(Date.now() - index * 3_600_000),
          cloneCount: 0,
        },
      },
      { upsert: true, returnDocument: "after", runValidators: true, setDefaultsOnInsert: true },
    );
    const realCloneCount = await EcosystemBuild.countDocuments({ clonedFrom: build._id });
    if (build.cloneCount !== realCloneCount) {
      build.cloneCount = realCloneCount;
      await build.save();
    }
    builds.push(build);
  }
  return builds;
};

const run = async () => {
  assertCatalog();
  await connectDB();

  if (process.env.NODE_ENV === "production" && process.env.ALLOW_DEMO_SEED !== "true") {
    throw new Error("Demo seeding is disabled in production. Set ALLOW_DEMO_SEED=true only if this is intentional.");
  }

  console.log("🌱 Upserting fictional PetCenter demo data (existing user data will not be deleted)...");
  const accounts = await ensureAccounts();
  const products = await seedProducts();
  const archivedLegacy = await archiveLegacyDemoData();
  const shelters = await seedShelters();
  const listings = await seedPets(accounts);
  const campaigns = await seedCampaignsAndDonations(accounts, shelters);
  const builds = await seedPublishedBuilds(accounts, products);

  const demoDonationCount = await Donation.countDocuments({ stripePaymentIntentId: /^pi_demo_/ });
  console.log("\n✅ Demo catalog ready");
  console.log(`   Products: ${products.length}`);
  console.log(`   Pet listings: ${listings.length}`);
  console.log(`   Shelters: ${Object.keys(shelters).length}`);
  console.log(`   Campaigns: ${campaigns.length}`);
  console.log(`   Backing donation records: ${demoDonationCount}`);
  console.log(`   Published habitat builds: ${builds.length}`);
  console.log(`   Legacy demo records archived: ${archivedLegacy.products + archivedLegacy.shelters + archivedLegacy.campaigns}`);
  console.log("\nDemo sign-in:");
  console.log(`   Admin: admin@petcenter.example / ${DEMO_PASSWORD}`);
  console.log(`   Buyer: buyer@petcenter.example / ${DEMO_PASSWORD}`);
  console.log("\nAll names, contacts, campaigns, and payment IDs created here are fictional demo data.");
};

run()
  .catch((error) => {
    console.error("❌ Demo seeding failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
