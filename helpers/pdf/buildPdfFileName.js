const { formatDate } = require("../dateFormatter");

const sanitize = (text = "") =>
    text
        .trim()
        .replace(/\s+/g, "_")
        .replace(/[\\/:*?"<>|]/g, "");

const buildPdfFileName = (
    partyName,
    fromDate,
    toDate
) => {

    const safePartyName = sanitize(
        partyName || "Transactions"
    );

    if (!fromDate && !toDate) {
        return `${safePartyName}_All_Transactions.pdf`;
    }

    const from = fromDate
        ? formatDate(fromDate).replace(/ /g, "-")
        : "Beginning";

    const to = toDate
        ? formatDate(toDate).replace(/ /g, "-")
        : "Till-Date";

    return `${safePartyName}_${from}_to_${to}.pdf`;

};

module.exports = buildPdfFileName;