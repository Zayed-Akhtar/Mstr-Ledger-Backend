const formatDate = (date) => {

    if (!date) return "-";

    return new Intl.DateTimeFormat(
        "en-GB",
        {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }
    ).format(new Date(date));

};

module.exports = {
    formatDate
};