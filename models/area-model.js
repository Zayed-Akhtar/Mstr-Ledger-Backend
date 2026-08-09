const mongoose = require('mongoose');

const areaSchema = mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    parties: {
        type: Number,
        default: 0
    },
    active: {
        type: Boolean
        },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, { timestamps: true });

module.exports = mongoose.model('Area', areaSchema);