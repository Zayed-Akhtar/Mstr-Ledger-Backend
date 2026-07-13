const { successResponse, errorResponse } = require("../helpers/responses");
const partyModel = require("../models/party-model");

const escapeRegex = (value) => {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

module.exports.getPartyTransactionsByName = async (req, res) => {
  try {
    const { name } = req.params;

    if (!name) {
      return errorResponse(res, "Party name is required");
    }
    const parties = await partyModel
      .find({
        name: { $regex: escapeRegex(name), $options: "i" },
      })
      .populate({
        path: "transactions",
        options: { sort: { createdAt: -1 } },
      })
      .select("_id partyCode name phoneNumber area transactions");

    if (parties.length === 0) {
      return successResponse(res, "No parties found with this name", []);
    }

    return successResponse(res, "Parties fetched successfully", parties);
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

    const party = await partyModel
      .findOne({ partyCode: { $regex: `^${escapeRegex(code)}$`, $options: "i" } })
      .populate({
        path: "transactions",
        options: { sort: { createdAt: -1 } },
      })
      .select("_id partyCode name phoneNumber area fullAddress transactions");

    if (!party) {
      return successResponse(res, "Party not found", null);
    }

    return successResponse(res, "Party transactions fetched successfully", party);
  } catch (error) {
    return errorResponse(res, "Error fetching party transactions by code: " + error.message);
  }
};

module.exports.getAllParty = async (req, res) => {
  try {
    const parties = await partyModel.find().select("-transactions");
    return successResponse(res, "Parties fetched successfully", parties);
  } catch (error) {
    return errorResponse(res, "Error fetching parties: " + error.message);
  }
};
