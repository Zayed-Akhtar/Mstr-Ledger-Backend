const { successResponse, errorResponse } = require("../helpers/responses");
const partyModel = require("../models/party-model");
const transactionModel = require("../models/transaction-model");

require("dotenv").config();

module.exports.createTransaction = async (req, res) => {
    try {
        const { credit, debit, description, balance, transactionDate, partyId } = req.body;

        //checks if party already has existing transactions
        const partyWithTransactions = await partyModel.findById(partyId)
            .populate({
                path: "transactions",
                options: {
                    sort: { createdAt: -1 },
                    limit: 1
                }
            });
        if (!partyWithTransactions) {
            return errorResponse(res, "Party not found");
        }
        if (partyWithTransactions && partyWithTransactions.transactions.length > 0) {
            const lastTransaction = partyWithTransactions.transactions[0];
            const newBalance = lastTransaction.balance + debit - credit;
            const newTransactionWithBalance = await createNewTransaction(credit, debit, description, newBalance, transactionDate, partyId);
            await partyModel.findByIdAndUpdate(partyId, {
                $push: { transactions: newTransactionWithBalance._id }
            });
            return successResponse(res, "Transaction created successfully", newTransactionWithBalance);
        }
        else {
          //Logic for creating new transaction
            const newTransaction = await createNewTransaction(credit, debit, description, balance, transactionDate, partyId);
            const party = await partyModel.findOne({ _id: partyId });
            party.transactions.push(newTransaction._id);
            await party.save();
            return successResponse(res, "Transaction created successfully", newTransaction);
        }


    } catch (error) {
        return errorResponse(res, "Error creating transaction: " + error.message);
    }
}

const createNewTransaction = async (credit,
    debit,
    description,
    balance,
    transactionDate,
    partyId) => {

    const newTransaction = await transactionModel.create({
        credit,
        debit,
        description,
        balance,
        transactionDate,
        party: partyId
    });
    return newTransaction;
}

module.exports.deleteTransaction = async (req, res) => {
    try {
        const { id } = req.params;

        const transaction = await transactionModel.findById(id);
        if (!transaction) {
            return errorResponse(res, "Transaction not found");
        }

        await transactionModel.findByIdAndDelete(id);

        await partyModel.findByIdAndUpdate(transaction.party, {
            $pull: { transactions: id }
        });

        return successResponse(res, "Transaction deleted successfully", transaction);
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
            const partyFilter = {};
            if (partyCode) partyFilter.partyCode = { $regex: escapeRegex(partyCode), $options: 'i' };
            if (name) partyFilter.name = { $regex: escapeRegex(name), $options: 'i' };
            if (phoneNumber) partyFilter.phoneNumber = { $regex: escapeRegex(phoneNumber), $options: 'i' };

            const parties = await partyModel.find(partyFilter).select('_id');
            const partyIds = parties.map((party) => party._id);

            if (partyIds.length === 0) {
                return successResponse(res, 'Transactions fetched successfully', []);
            }

            filter.party = { $in: partyIds };
        }

        const transactions = await transactionModel.find(filter)
            .sort({ createdAt: -1 })
            .limit(50)
            .populate('party', 'partyCode name phoneNumber');

        return successResponse(res, 'Transactions fetched successfully', transactions);
    } catch (error) {
        return errorResponse(res, 'Error fetching transactions: ' + error.message);
    }
}
module.exports.updateTransaction = async (req, res) => {
    try {
        const { id } = req.params;

        const allowedFields = ['credit', 'debit', 'description', 'transactionDate', 'balance', 'party'];
        const updates = {};
        allowedFields.forEach(field => {
            if (Object.prototype.hasOwnProperty.call(req.body, field)) {
                updates[field] = req.body[field];
            }
        });

        if (Object.keys(updates).length === 0) {
            return errorResponse(res, 'No valid fields provided for update');
        }

        const transaction = await transactionModel.findById(id);
        if (!transaction) {
            return errorResponse(res, 'Transaction not found');
        }

        // If party is changing, move the transaction id between parties
        if (updates.party && updates.party.toString() !== transaction.party.toString()) {
            await partyModel.findByIdAndUpdate(transaction.party, { $pull: { transactions: id } });
            await partyModel.findByIdAndUpdate(updates.party, { $push: { transactions: id } });
        }

        const updatedTransaction = await transactionModel.findByIdAndUpdate(id, updates, { new: true });

        return successResponse(res, 'Transaction updated successfully', updatedTransaction);
    } catch (error) {
        return errorResponse(res, 'Error updating transaction: ' + error.message);
    }
}