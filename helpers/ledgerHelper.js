const transactionModel = require("../models/transaction-model");
const partyModel = require("../models/party-model");

const recalculateBalances = async (partyId) => {
    const transactions = await transactionModel
        .find({ party: partyId })
        .sort({
            transactionDate: 1,
            createdAt: 1
        });

    let runningBalance = 0;

    const bulkOps = [];

    for (const tx of transactions) {
        runningBalance += tx.debit - tx.credit;

        if (tx.balance !== runningBalance) {
            bulkOps.push({
                updateOne: {
                    filter: { _id: tx._id },
                    update: {
                        $set: {
                            balance: runningBalance
                        }
                    }
                }
            });
        }
    }

    if (bulkOps.length) {
        await transactionModel.bulkWrite(bulkOps);
    }
};

const getPartyLedger = async (partyId) => {

    const party = await partyModel
        .findById(partyId)
        .lean();

    if (!party)
        return null;

    const transactions = await transactionModel
        .find({ party: partyId })
        .sort({
            transactionDate: 1,
            createdAt: 1
        });

    return {
        ...party,
        transactions
    };
};


const getNextTransactionNumber = async () => {

    const lastTransaction = await transactionModel
        .findOne()
        .sort({ transactionNumber: -1 });

    return lastTransaction
        ? lastTransaction.transactionNumber + 1
        : 1;
};

module.exports = {
    recalculateBalances,
    getPartyLedger,
    getNextTransactionNumber
};