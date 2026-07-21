const buildTransactionFilter = (
    partyId,
    fromDate,
    toDate
) => {

    const filter = {
        party: partyId
    };

    if (fromDate || toDate) {

        filter.transactionDate = {};

        if (fromDate) {
            filter.transactionDate.$gte = new Date(fromDate);
        }

        if (toDate) {
            const end = new Date(toDate);
            end.setHours(23, 59, 59, 999);

            filter.transactionDate.$lte = end;
        }

    }

    return filter;
};

module.exports = buildTransactionFilter;