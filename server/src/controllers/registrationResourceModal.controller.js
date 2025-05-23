const mongoose = require('mongoose');
const Resource = require('../models/Resource');
const ResourceSetting = require('../models/ResourceSetting');
const Registration = require('../models/Registration');

/**
 * @desc    Get enriched resource usage for a registration (for modal)
 * @route   GET /api/events/:eventId/registrations/:registrationId/resource-usage-modal
 * @access  Private
 */
exports.getRegistrationResourceUsageModal = async (req, res, next) => {
  try {
    const { eventId, registrationId } = req.params;

    // 1. Fetch all resources for the registration
    const resources = await Resource.find({
      event: eventId,
      registration: registrationId,
      status: { $ne: 'voided' },
      isVoided: { $ne: true }
    }).lean();

    // 2. Collect all unique option values per type
    const foodOptions = new Set();
    const kitOptions = new Set();
    const certOptions = new Set();
    resources.forEach(r => {
      if (r.type === 'food' && r.details?.option) foodOptions.add(r.details.option);
      if (r.type === 'kitBag' && r.details?.option) kitOptions.add(r.details.option);
      if ((r.type === 'certificate' || r.type === 'certificatePrinting') && r.details?.option) certOptions.add(r.details.option);
    });

    // 3. Fetch all relevant settings for the event
    const [foodSetting, kitSetting, certSetting] = await Promise.all([
      ResourceSetting.findOne({ event: eventId, type: 'food' }).lean(),
      ResourceSetting.findOne({ event: eventId, type: 'kitBag' }).lean(),
      ResourceSetting.findOne({ event: eventId, type: 'certificatePrinting' }).lean(),
    ]);

    // 4. Build mapping from option to display name
    const foodMap = {};
    if (foodSetting?.settings?.days) {
      foodSetting.settings.days.forEach((day, dayIdx) => {
        if (day.meals) {
          day.meals.forEach(meal => {
            const key = `${dayIdx}_${meal.name}`;
            foodMap[key] = `${meal.name} (${day.date ? new Date(day.date).toLocaleDateString() : 'Day ' + (dayIdx + 1)})`;
          });
        }
      });
    }
    const kitMap = {};
    if (kitSetting?.settings?.items) {
      kitSetting.settings.items.forEach(item => {
        kitMap[item.id || item.name] = item.name;
      });
    }
    const certMap = {};
    if (certSetting?.certificatePrintingTemplates) {
      certSetting.certificatePrintingTemplates.forEach(tpl => {
        certMap[tpl._id?.toString() || tpl.name] = tpl.name;
      });
    }

    // 5. Enrich resources with displayName
    const enriched = resources.map(r => {
      let displayName = r.details?.option || '';
      if (r.type === 'food') displayName = foodMap[r.details?.option] || r.details?.option;
      if (r.type === 'kitBag') displayName = kitMap[r.details?.option] || r.details?.option;
      if (r.type === 'certificate' || r.type === 'certificatePrinting') displayName = certMap[r.details?.option] || r.details?.option;
      return {
        ...r,
        displayName,
      };
    });

    res.status(200).json({
      success: true,
      count: enriched.length,
      data: enriched
    });
  } catch (err) {
    next(err);
  }
}; 