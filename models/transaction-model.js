const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema({

    transactionNumber: {
        type: Number,
        required: true
    },

    transactionDate: {
        type: Date,
        required: true
    },

    description: {
        type: String,
        required: true
    },

    debit: {
        type: Number,
        default: 0
    },

    credit: {
        type: Number,
        default: 0
    },

    balance: {
        type: Number,
        default: 0
    },

    party: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Party",
        required: true
    }

}, { timestamps: true });

transactionSchema.index(
    {
        party: 1,
        transactionNumber: 1
    },
    {
        unique: true
    }
);

module.exports = mongoose.model("Transaction", transactionSchema);