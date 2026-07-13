const { successResponse, errorResponse } = require("../helpers/responses");
const partyModel = require("../models/party-model");
const { getPartyLedger } = require("../helpers/ledgerHelper");
const transactionModel = require("../models/transaction-model");

const escapeRegex = (value) => {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
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
    });

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
    });

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

module.exports.getAllParty = async (req, res) => {
  try {
    const parties = await partyModel.find().select("_id partyCode name phoneNumber area fullAddress");
    return successResponse(res, "Parties fetched successfully", parties);
  } catch (error) {
    return errorResponse(res, "Error fetching parties: " + error.message);
  }
};
