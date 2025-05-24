// Migration script: Ensure all categories have complete entitlements for all resources in their event
// Usage: node server/scripts/migrate_category_entitlements.js

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const Category = require('../src/models/Category');
const ResourceSetting = require('../src/models/ResourceSetting');
const Event = require('../src/models/Event');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/onsite-atlas';

async function migrate() {
  await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  console.log('Connected to MongoDB');

  const events = await Event.find({});
  let totalCategoriesUpdated = 0;

  for (const event of events) {
    const eventId = event._id;
    // Fetch resource settings for this event
    const foodSetting = await ResourceSetting.findOne({ event: eventId, type: 'food' });
    const kitSetting = await ResourceSetting.findOne({ event: eventId, type: 'kitBag' });
    const certSetting = await ResourceSetting.findOne({ event: eventId, type: 'certificate' });

    const meals = foodSetting?.settings?.meals || [];
    const kitItems = kitSetting?.settings?.items || [];
    const certTypes = certSetting?.settings?.types || [];

    // Find all categories for this event
    const categories = await Category.find({ event: eventId });
    for (const category of categories) {
      let changed = false;
      // --- Meals ---
      category.mealEntitlements = category.mealEntitlements || [];
      for (const meal of meals) {
        const mealId = meal._id.toString();
        let found = category.mealEntitlements.find(e => e.mealId && e.mealId.toString() === mealId);
        if (!found) {
          category.mealEntitlements.push({ mealId: meal._id, entitled: true });
          changed = true;
          console.log(`[${category.name}] Added meal entitlement: ${meal.name}`);
        } else if (typeof found.mealId === 'string') {
          found.mealId = mongoose.Types.ObjectId(mealId);
          changed = true;
          console.log(`[${category.name}] Converted mealId to ObjectId for: ${meal.name}`);
        }
      }
      // --- Kit Items ---
      category.kitItemEntitlements = category.kitItemEntitlements || [];
      for (const kit of kitItems) {
        const kitId = kit._id.toString();
        let found = category.kitItemEntitlements.find(e => e.itemId && e.itemId.toString() === kitId);
        if (!found) {
          category.kitItemEntitlements.push({ itemId: kit._id, entitled: true });
          changed = true;
          console.log(`[${category.name}] Added kit item entitlement: ${kit.name}`);
        } else if (typeof found.itemId === 'string') {
          found.itemId = mongoose.Types.ObjectId(kitId);
          changed = true;
          console.log(`[${category.name}] Converted itemId to ObjectId for: ${kit.name}`);
        }
      }
      // --- Certificate Types ---
      category.certificateEntitlements = category.certificateEntitlements || [];
      for (const cert of certTypes) {
        const certId = cert._id.toString();
        let found = category.certificateEntitlements.find(e => e.certificateId && e.certificateId.toString() === certId);
        if (!found) {
          category.certificateEntitlements.push({ certificateId: cert._id, entitled: true });
          changed = true;
          console.log(`[${category.name}] Added certificate entitlement: ${cert.name}`);
        } else if (typeof found.certificateId === 'string') {
          found.certificateId = mongoose.Types.ObjectId(certId);
          changed = true;
          console.log(`[${category.name}] Converted certificateId to ObjectId for: ${cert.name}`);
        }
      }
      if (changed) {
        await category.save();
        totalCategoriesUpdated++;
        console.log(`[${category.name}] Category updated.`);
      }
    }
  }
  console.log(`Migration complete. Categories updated: ${totalCategoriesUpdated}`);
  await mongoose.disconnect();
}

migrate().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
}); 