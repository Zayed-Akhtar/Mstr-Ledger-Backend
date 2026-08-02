const mongoose = require("mongoose");
const { successResponse, errorResponse, badRequestResponse } = require("../helpers/responses");
const partyModel = require("../models/party-model");
const areaModel = require("../models/area-model");
const transactionModel = require("../models/transaction-model");
const { getPartyLedger } = require("../helpers/ledgerHelper");
const { incrementAreaPartyCount, decrementAreaPartyCount, createAreaIfNotExists } = require("./areaController");

const escapeRegex = (value) => {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

module.exports.searchParty = async (req, res) => {
    try {
        const page = Math.max(parseInt(req.query.page) || 1, 1);
        const limit = Math.max(parseInt(req.query.limit) || 5, 1);
        const search = (req.query.search || "").trim();
        const skip = (page - 1) * limit;

        const filter = {};

        if (search) {
            const searchableText = escapeRegex(search);
            const areaMatches = await areaModel.find({
                name: { $regex: searchableText, $options: "i" }
            }).select("_id");

            const areaIds = areaMatches.map(area => area._id);

            filter.$or = [
                { name: { $regex: searchableText, $options: "i" } },
                { partyCode: { $regex: searchableText, $options: "i" } },
                { phoneNumber: { $regex: searchableText, $options: "i" } }
            ];

            if (areaIds.length) {
                filter.$or.push({ area: { $in: areaIds } });
            }
        }

        const [parties, totalRecords] = await Promise.all([
            partyModel
                .find(filter)
                .select("_id partyCode name phoneNumber area fullAddress active creditLimit")
                .populate("area", "name")
                .sort({ name: 1 })
                .skip(skip)
                .limit(limit),

            partyModel.countDocuments(filter)
        ]);

        const totalPages = Math.ceil(totalRecords / limit);

        return successResponse(
            res,
            "Parties fetched successfully",
            {
                parties,
                pagination: {
                    currentPage: page,
                    pageSize: limit,
                    totalRecords,
                    totalPages
                }
            }
        );
    } catch (error) {
        return errorResponse(res, "Error fetching parties: " + error.message);
    }
};

module.exports.updateParty = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      partyCode,
      area,
      fullAddress,
      phoneNumber,
      name,
      creditLimit,
      email,
      active,
      user
    } = req.body;

    const existingParty = await partyModel.findById(id);
    if (!existingParty) {
      return errorResponse(res, "Party not found");
    }

    let resolvedAreaId = existingParty.area;
    if (area) {
      if (typeof area === "string" && !area.match(/^[0-9a-fA-F]{24}$/)) {
        const createdArea = await createAreaIfNotExists(area, user || existingParty.user, `${area} area`);
        resolvedAreaId = createdArea._id;
      } else {
        const areaExists = await areaModel.findById(area);
        if (!areaExists) {
          const createdArea = await createAreaIfNotExists(area, user || existingParty.user, `${area} area`);
          resolvedAreaId = createdArea._id;
        } else {
          resolvedAreaId = area;
        }
      }
    }

    const updates = {};

    if (partyCode) updates.partyCode = partyCode;
    if (area) updates.area = resolvedAreaId;
    if (fullAddress !== undefined) updates.fullAddress = fullAddress;
    if (phoneNumber) updates.phoneNumber = phoneNumber;
    if (name) updates.name = name;
    if (creditLimit !== undefined) updates.creditLimit = creditLimit;
    if (email !== undefined) updates.email = email;
    if (active !== undefined) updates.active = active;
    if (user) updates.user = user;

    if (Object.keys(updates).length === 0) {
      return badRequestResponse(res, "No valid fields provided for update");
    }

    const oldArea = existingParty.area ? existingParty.area.toString() : null;
    const updatedParty = await partyModel.findByIdAndUpdate(id, updates, { new: true, runValidators: true });

    if (oldArea && updates.area && oldArea !== updates.area.toString()) {
      await decrementAreaPartyCount(oldArea);
      await incrementAreaPartyCount(updates.area);
    }

    return successResponse(res, "Party updated successfully", updatedParty);
  } catch (error) {
    return errorResponse(res, "Error updating party: " + error.message);
  }
};

module.exports.deleteParty = async (req, res) => {
  try {
    const { id } = req.params;

    const party = await partyModel.findById(id);
    if (!party) {
      return errorResponse(res, "Party not found");
    }

    const deletedParty = await partyModel.findByIdAndDelete(id);

    if (party.area) {
      await decrementAreaPartyCount(party.area);
    }

    return successResponse(res, "Party deleted successfully", deletedParty);
  } catch (error) {
    return errorResponse(res, "Error deleting party: " + error.message);
  }
};

module.exports.getPartyTransactionsByName = async (req, res) => {
  try {
    const { name } = req.params;

    if (!name) {
      return errorResponse(res, "Party name is required");
    }
    const parties = await partyModel.find({
      name: {
        $regex: escapeRegex(name),
        $options: "i"
      }
    }).populate("area", "name");

    if (parties.length === 0) {
      return successResponse(res, "No parties found with this name", []);
    }

    const result = await Promise.all(
      parties.map(party => getPartyLedger(party._id))
    );

    return successResponse(
      res,
      "Parties fetched successfully",
      result
    );
  } catch (error) {
    return errorResponse(res, "Error fetching party transactions: " + error.message);
  }
};

module.exports.getPartyTransactionsByCode = async (req, res) => {
  try {
    const { code } = req.params;

    if (!code) {
      return errorResponse(res, "Party code is required");
    }

    const party = await partyModel.findOne({
      partyCode: {
        $regex: `^${escapeRegex(code)}$`,
        $options: "i"
      }
    }).populate("area", "name");

    if (!party) {
      return successResponse(
        res,
        "Party not found",
        null
      );
    }

    const result = await getPartyLedger(party._id);

    return successResponse(
      res,
      "Party transactions fetched successfully",
      result
    );
  } catch (error) {
    return errorResponse(res, "Error fetching party transactions by code: " + error.message);
  }
};

module.exports.getPartyTransactionsDetails = async (req, res) => {
  try {
    const { partyId } = req.params;

    if (!partyId) {
      return badRequestResponse(res, "Party id is required");
    }

    const party = await partyModel.findById(partyId);
    if (!party) {
      return errorResponse(res, "Party not found");
    }

    const [latestTransaction, totalTransactions] = await Promise.all([
      transactionModel
        .findOne({ party: partyId })
        .sort({ transactionDate: -1, createdAt: -1 })
        .select("balance transactionDate"),
      transactionModel.countDocuments({ party: partyId })
    ]);

    const closingBalance = latestTransaction ? latestTransaction.balance : 0;

    return successResponse(
      res,
      "Party transaction details fetched successfully",
      {
        partyId,
        closingBalance,
        totalTransactions,
        latestTransactionDate: latestTransaction ? latestTransaction.transactionDate : null
      }
    );
  } catch (error) {
    return errorResponse(res, "Error fetching party transaction details: " + error.message);
  }
};

module.exports.createParty = async (req, res) => {
  try {
    const {
      partyCode,
      area,
      fullAddress,
      phoneNumber,
      name,
      creditLimit = 0,
      email,
      active,
      user
    } = req.body;

    if (!partyCode || !area || !phoneNumber || !name) {
      return badRequestResponse(res, "Party code, area, phone number and name are required");
    }

    const resolvedUser = user || new mongoose.Types.ObjectId().toString();

    let areaId = area;

    if (typeof area === "string" && !area.match(/^[0-9a-fA-F]{24}$/)) {
      const createdArea = await createAreaIfNotExists(area, resolvedUser, `${area} area`);
      areaId = createdArea._id;
    } else {
      const areaExists = await areaModel.findById(area);
      if (!areaExists) {
        const createdArea = await createAreaIfNotExists(area, resolvedUser, `${area} area`);
        areaId = createdArea._id;
      }
    }

    const existingParty = await partyModel.findOne({
      partyCode: {
        $regex: `^${escapeRegex(partyCode)}$`,
        $options: "i"
      }
    });

    if (existingParty) {
      return badRequestResponse(res, "Party with this code already exists");
    }

    const newParty = await partyModel.create({
      partyCode,
      area: areaId,
      fullAddress,
      phoneNumber,
      name,
      creditLimit,
      email,
      active,
      user: resolvedUser
    });

    await incrementAreaPartyCount(areaId);

    return successResponse(res, "Party created successfully", newParty);
  } catch (error) {
    return errorResponse(res, "Error creating party: " + error.message);
  }
};
