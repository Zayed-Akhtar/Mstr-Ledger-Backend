const { successResponse, errorResponse, badRequestResponse } = require("../helpers/responses");
const areaModel = require("../models/area-model");

const escapeRegex = (value) => {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

module.exports.syncAreaPartyCount = async (areaIdentifier, delta = 1) => {
  if (!areaIdentifier) return;

  let area = null;

  if (areaIdentifier.toString().match(/^[0-9a-fA-F]{24}$/)) {
    area = await areaModel.findById(areaIdentifier);
  } else {
    const normalizedAreaName = String(areaIdentifier).trim();
    if (!normalizedAreaName) return;

    area = await areaModel.findOne({
      name: { $regex: `^${escapeRegex(normalizedAreaName)}$`, $options: "i" }
    });
  }

  if (!area) return;

  const nextCount = Math.max(0, (Number(area.parties) || 0) + Number(delta));

  await areaModel.findByIdAndUpdate(area._id, { parties: nextCount }, { new: true });
};

module.exports.incrementAreaPartyCount = async (areaIdentifier) => {
  await module.exports.syncAreaPartyCount(areaIdentifier, 1);
};

module.exports.decrementAreaPartyCount = async (areaIdentifier) => {
  await module.exports.syncAreaPartyCount(areaIdentifier, -1);
};

module.exports.createArea = async (req, res) => {
  try {
    const { name, description, user } = req.body;

    if (!name || !description || !user) {
      return badRequestResponse(res, "Area name, description and user are required");
    }

    const existingArea = await areaModel.findOne({
      name: { $regex: `^${escapeRegex(name)}$`, $options: "i" }
    });

    if (existingArea) {
      return badRequestResponse(res, "Area with this name already exists");
    }

    const newArea = await areaModel.create({
      name,
      description,
      parties: 0,
      user
    });

    return successResponse(res, "Area created successfully", newArea);
  } catch (error) {
    return errorResponse(res, "Error creating area: " + error.message);
  }
};

module.exports.getAreas = async (req, res) => {
  try {
    const areas = await areaModel
      .find()
      .populate("user", "name email");

    return successResponse(res, "Areas fetched successfully", areas);
  } catch (error) {
    return errorResponse(res, "Error fetching areas: " + error.message);
  }
};

module.exports.updateArea = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, user } = req.body;

    const existingArea = await areaModel.findById(id);
    if (!existingArea) {
      return errorResponse(res, "Area not found");
    }

    const updates = {};

    if (name) updates.name = name;
    if (description) updates.description = description;
    if (user) updates.user = user;

    if (Object.keys(updates).length === 0) {
      return badRequestResponse(res, "No valid fields provided for update");
    }

    const updatedArea = await areaModel.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true
    }).populate("user", "name email");

    return successResponse(res, "Area updated successfully", updatedArea);
  } catch (error) {
    return errorResponse(res, "Error updating area: " + error.message);
  }
};

module.exports.deleteArea = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedArea = await areaModel.findByIdAndDelete(id);

    if (!deletedArea) {
      return errorResponse(res, "Area not found");
    }

    return successResponse(res, "Area deleted successfully", deletedArea);
  } catch (error) {
    return errorResponse(res, "Error deleting area: " + error.message);
  }
};

module.exports.createAreaIfNotExists = async (areaName, userId = null, description = "") => {
  if (!areaName || !String(areaName).trim()) return null;

  const normalizedName = String(areaName).trim();

  const existingArea = await areaModel.findOne({
    name: { $regex: `^${escapeRegex(normalizedName)}$`, $options: "i" }
  });

  if (existingArea) {
    return existingArea;
  }

  const newArea = await areaModel.create({
    name: normalizedName,
    description: description || `${normalizedName} area`,
    parties: 0,
    user: userId
  });

  return newArea;
};

module.exports.searchAreas = async (req, res) => {
  try {
    const searchText = (req.query.search || "").trim();

    if (!searchText) {
      return successResponse(res, "Areas fetched successfully", []);
    }

    const normalizedSearch = searchText.trim();
    const escapedSearch = escapeRegex(normalizedSearch);

    const exactMatches = await areaModel.find({
      $or: [
        { name: { $regex: `^${escapedSearch}$`, $options: "i" } },
        { description: { $regex: `^${escapedSearch}$`, $options: "i" } }
      ]
    })
      .select("name description")
      .sort({ name: 1 });

    if (exactMatches.length > 0) {
      return successResponse(res, "Matching areas fetched successfully", exactMatches);
    }

    const fuzzyMatches = await areaModel.find({
      $or: [
        { name: { $regex: escapedSearch, $options: "i" } },
        { description: { $regex: escapedSearch, $options: "i" } }
      ]
    })
      .select("name description")
      .sort({ name: 1 });

    return successResponse(res, "Matching areas fetched successfully", fuzzyMatches);
  } catch (error) {
    return errorResponse(res, "Error searching areas: " + error.message);
  }
};
