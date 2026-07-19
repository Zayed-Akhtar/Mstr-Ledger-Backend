const { successResponse, errorResponse } = require("../helpers/responses");
const {
    recalculateBalances,
    getPartyLedger,
    getNextTransactionNumber
} = require("../helpers/ledgerHelper");
const partyModel = require("../models/party-model");
const transactionModel = require("../models/transaction-model");

require("dotenv").config();

module.exports.createTransaction = async (req, res) => {
    try {

        const {
            credit,
            debit,
            description,
            transactionDate,
            partyId
        } = req.body;

        const party = await partyModel.findById(partyId);

        if (!party) {
            return errorResponse(res, "Party not found");
        }

        // Generate transaction number

        const nextTransactionNumber = await getNextTransactionNumber();

        await transactionModel.create({
            transactionNumber: nextTransactionNumber,
            credit,
            debit,
            description,
            balance: 0,
            transactionDate,
            party: partyId
        });

        await recalculateBalances(partyId);

        const updatedParty = await getPartyLedger(partyId);

        return successResponse(
            res,
            "Transaction created successfully",
            updatedParty
        );

    } catch (error) {

        return errorResponse(
            res,
            "Error creating transaction : " + error.message
        );

    }
};

module.exports.deleteTransaction = async (req, res) => {
    try {
        const { id } = req.params;

        const transaction = await transactionModel.findById(id);
        if (!transaction) {
            return errorResponse(res, "Transaction not found");
        }

        await transactionModel.findByIdAndDelete(id);

        await recalculateBalances(transaction.party);
        const updatedPartyTransactions = await getPartyLedger(transaction.party);
        return successResponse(res, "Transaction deleted successfully", updatedPartyTransactions);
    } catch (error) {
        return errorResponse(res, "Error deleting transaction: " + error.message);
    }
}
const escapeRegex = (value) => {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

module.exports.getTransactions = async (req, res) => {
    try {
        const { partyCode, name, phoneNumber } = req.query;
        const filter = {};

        if (partyCode || name || phoneNumber) {
            const partyFilter = { $or: [] };

            if (partyCode) {
                partyFilter.$or.push({ partyCode: { $regex: escapeRegex(partyCode), $options: 'i' } });
            }
            if (name) {
                partyFilter.$or.push({ name: { $regex: escapeRegex(name), $options: 'i' } });
            }
            if (phoneNumber) {
                partyFilter.$or.push({ phoneNumber: { $regex: escapeRegex(phoneNumber), $options: 'i' } });
            }

            const parties = await partyModel.find(partyFilter).select('_id');
            const partyIds = parties.map((party) => party._id);

            if (partyIds.length === 0) {
                return successResponse(res, 'Transactions fetched successfully', []);
            }

            filter.party = { $in: partyIds };
        }

        const transactions = await transactionModel.find(filter)
            .sort({
                transactionDate: -1,
                createdAt: -1
            })
            .limit(50)
            .populate('party', 'partyCode name phoneNumber area');

        return successResponse(res, 'Transactions fetched successfully', transactions);
    } catch (error) {
        return errorResponse(res, 'Error fetching transactions: ' + error.message);
    }
}
module.exports.updateTransaction = async (req, res) => {
    try {
        const { id } = req.params;

        const allowedFields = [
            "credit",
            "debit",
            "description",
            "transactionDate",
            "party"
        ];

        const updates = {};

        allowedFields.forEach(field => {
            if (Object.prototype.hasOwnProperty.call(req.body, field)) {
                updates[field] = req.body[field];
            }
        });

        if (Object.keys(updates).length === 0) {
            return errorResponse(res, "No valid fields provided for update");
        }

        const transaction = await transactionModel.findById(id);

        if (!transaction) {
            return errorResponse(res, "Transaction not found");
        }

        const oldParty = transaction.party.toString();
        const newParty = updates.party
            ? updates.party.toString()
            : oldParty;
            
        await transactionModel.findByIdAndUpdate(
            id,
            updates,
            { new: true }
        );

        // Recalculate balances of old party
        await recalculateBalances(oldParty);

        // Recalculate balances of new party if changed
        if (oldParty !== newParty) {
            await recalculateBalances(newParty);
        }

        const updatedParty = await getPartyLedger(newParty);

        return successResponse(
            res,
            "Transaction updated successfully",
            updatedParty
        );

    } catch (error) {
        return errorResponse(
            res,
            "Error updating transaction: " + error.message
        );
    }
};