const PDFDocument = require("pdfkit");
const partyModel = require("../models/party-model");
const areaModel = require("../models/area-model");
const transactionModel = require("../models/transaction-model");
const { successResponse, errorResponse, badRequestResponse } = require("../helpers/responses");

const formatCurrency = (value) => {
    const amount = Number(value || 0);
    return new Intl.NumberFormat("en-IN", {
        maximumFractionDigits: 0,
    }).format(amount);
};

const safeFileName = (value) => {
    return String(value || "report")
        .replace(/[^a-zA-Z0-9-_]+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "")
        .toLowerCase();
};

const formatDateDisplay = (dateValue) => {
    if (!dateValue) return "-";

    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) return "-";

    return new Intl.DateTimeFormat("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    }).format(date);
};

const buildDateRangeFilter = (fromDate, toDate) => {
    const filter = {};

    if (fromDate) {
        const start = new Date(fromDate);
        start.setHours(0, 0, 0, 0);
        filter.$gte = start;
    }

    if (toDate) {
        const end = new Date(toDate);
        end.setHours(23, 59, 59, 999);
        filter.$lte = end;
    }

    return Object.keys(filter).length ? { transactionDate: filter } : {};
};

const getPartyOutstandingDue = async (partyId, fromDate, toDate) => {
    const transactionFilter = {
        party: partyId,
        ...(buildDateRangeFilter(fromDate, toDate).transactionDate ? { transactionDate: buildDateRangeFilter(fromDate, toDate).transactionDate } : {})
    };

    const transactions = await transactionModel
        .find(transactionFilter)
        .sort({ transactionDate: 1, createdAt: 1 })
        .lean();

    let runningBalance = 0;

    for (const txn of transactions) {
        runningBalance += Number(txn.debit || 0) - Number(txn.credit || 0);
    }

    return Math.max(0, runningBalance);
};

const createAreaDueSection = async (area, req, fromDate, toDate) => {
    const parties = await partyModel
        .find({
            area: area._id,
            user: req.user.userId,
        })
        .sort({ name: 1 })
        .lean();

    const partyRows = await Promise.all(
        parties.map(async (party, index) => {
            const outstandingDue = await getPartyOutstandingDue(party._id, fromDate, toDate);

            return {
                serial: index + 1,
                name: party.name,
                partyCode: party.partyCode || "-",
                phoneNumber: party.phoneNumber || "-",
                outstandingDue,
            };
        })
    );

    const totalDue = partyRows.reduce((sum, row) => sum + Number(row.outstandingDue || 0), 0);

    return {
        areaName: area.name,
        totalParties: partyRows.length,
        totalDue,
        rows: partyRows,
    };
};

const renderAreaSection = (doc, section, startY) => {
    const BOTTOM_MARGIN = 750;
    const ROW_HEIGHT = 18;
    const HEADER_HEIGHT = 18;
    const SEPARATOR_HEIGHT = 14;
    const AREA_INFO_HEIGHT = 38;
    const TOTALS_ROW_HEIGHT = 20;

    let y = startY;

    // Check if area section header fits; if not, start new page
    if (y + AREA_INFO_HEIGHT > BOTTOM_MARGIN) {
        doc.addPage();
        y = 50;
    }

    // Render area name
    doc
        .font("Helvetica-Bold")
        .fontSize(12)
        .text(`Area: ${section.areaName}`, 50, y);

    y += 18;

    // Render area summary
    doc
        .font("Helvetica")
        .fontSize(10)
        .text(`Total Parties: ${section.totalParties}`, 50, y)
        .text(`Total Due: ${formatCurrency(section.totalDue)}`, 420, y);

    y += 20;

    // Render table header
    doc
        .font("Helvetica-Bold")
        .fontSize(9)
        .text("#", 52, y, { width: 25, align: "left" })
        .text("Party Name", 86, y, { width: 130, align: "left" })
        .text("Party Code", 240, y, { width: 90, align: "left" })
        .text("Mobile Number", 345, y, { width: 100, align: "left" })
        .text("Outstanding Due()", 470, y, { width: 100, align: "right" });

    y += 18;

    doc.moveTo(50, y).lineTo(545, y).stroke();
    y += 8;

    // Render rows
    doc.font("Helvetica").fontSize(9);

    for (const row of section.rows) {
        // Check if row fits; if not, add new page and redraw header
        if (y + ROW_HEIGHT + SEPARATOR_HEIGHT + TOTALS_ROW_HEIGHT > BOTTOM_MARGIN) {
            doc.addPage();
            y = 50;

            // Re-render table header on new page
            doc
                .font("Helvetica-Bold")
                .fontSize(9)
                .text("#", 52, y, { width: 25, align: "left" })
                .text("Party Name", 86, y, { width: 130, align: "left" })
                .text("Party Code", 240, y, { width: 90, align: "left" })
                .text("Mobile Number", 345, y, { width: 100, align: "left" })
                .text("Outstanding Due()", 470, y, { width: 100, align: "right" });

            y += 18;

            doc.moveTo(50, y).lineTo(545, y).stroke();
            y += 8;

            doc.font("Helvetica").fontSize(9);
        }

        doc.text(String(row.serial), 52, y, { width: 25 });
        doc.text(row.name || "-", 86, y, { width: 130 });
        doc.text(row.partyCode || "-", 240, y, { width: 90 });
        doc.text(row.phoneNumber || "-", 345, y, { width: 100 });
        doc.text(formatCurrency(row.outstandingDue), 470, y, { width: 80, align: "right" });

        y += 18;
        doc.moveTo(50, y).lineTo(545, y).stroke();
        y += 6;
    }

    // Render totals row
    doc
        .font("Helvetica-Bold")
        .fontSize(10)
        .text(`Total (${section.areaName})`, 360, y + 6, { width: 100, align: "left" })
        .text(formatCurrency(section.totalDue), 470, y + 6, { width: 80, align: "right" });

    return y + 28;
};

module.exports.generateReport = async (req, res) => {
    try {
        const { fromDate, toDate, partyIds = [], areaIds = [] } = req.body || {};

        const dateRangeError = validateDateRange(fromDate, toDate);
        if (dateRangeError) {
            return badRequestResponse(res, dateRangeError);
        }

        const selectedAreaIds = Array.isArray(areaIds) && areaIds.length ? areaIds : [];

        if (!selectedAreaIds.length && (!Array.isArray(partyIds) || !partyIds.length)) {
            return badRequestResponse(res, "Please select at least one area or party");
        }

        const resolvedAreaIds = selectedAreaIds.length
            ? selectedAreaIds
            : await partyModel
                .find({ _id: { $in: partyIds }, user: req.user.userId })
                .distinct("area");

        const areas = await areaModel
            .find({
                _id: { $in: resolvedAreaIds },
                user: req.user.userId,
            })
            .sort({ name: 1 })
            .lean();

        if (!areas.length) {
            return badRequestResponse(res, "No matching areas found for this report");
        }

        const reportSections = [];

        for (const area of areas) {
            const areaSection = await createAreaDueSection(area, req, fromDate, toDate);
            reportSections.push(areaSection);
        }

        const doc = new PDFDocument({
            margin: 40,
            size: "A4",
            layout: "portrait",
        });

        res.setHeader("Content-Type", "application/pdf");
        res.setHeader(
            "Content-Disposition",
            `attachment; filename="${safeFileName("area-wise-outstanding-dues-report")}.pdf"`
        );

        doc.pipe(res);

        doc
            .font("Helvetica-Bold")
            .fontSize(20)
            .text("Mstr-Ledger", { align: "center" });

        doc
            .font("Helvetica")
            .fontSize(12)
            .text("Areas Report", { align: "center" });

        doc
            .font("Helvetica-Oblique")
            .fontSize(9)
            .text("PartyLedgerManagementSystem", { align: "center" });

        doc.moveDown(1);

        doc
            .font("Helvetica")
            .fontSize(9)
            .text(`Report Period: ${fromDate ? formatDateDisplay(fromDate) : "Beginning"} - ${toDate ? formatDateDisplay(toDate) : "Till Date"}`)
            .text(`Generated On: ${new Date().toLocaleString("en-GB")}`)
            .text(`Generated By: ${req.user?.name || req.user?.firstName || req.user?.email || "System"}`);

        doc.moveDown(1);

        let currentY = doc.y;

        for (const section of reportSections) {
            currentY = renderAreaSection(doc, section, currentY);
            currentY += 10;

            if (currentY > 720) {
                doc.addPage();
                currentY = 50;
            }
        }

        doc.end();
    } catch (error) {
        if (!res.headersSent) {
            return errorResponse(res, "Error generating area-wise report: " + error.message);
        }

        return res.end();
    }
};

const renderPartiesTable = (doc, partyRows, totalPages, currentPageNum) => {
    const BOTTOM_MARGIN = 750;
    const ROW_HEIGHT = 18;
    const SEPARATOR_HEIGHT = 14;
    const TOTALS_ROW_HEIGHT = 20;
    const FOOTER_HEIGHT = 30;

    let y = 50;

    // Render table header
    doc
        .font("Helvetica-Bold")
        .fontSize(9)
        .text("#", 52, y, { width: 25, align: "left" })
        .text("Party Name", 86, y, { width: 110, align: "left" })
        .text("Party Code", 220, y, { width: 80, align: "left" })
        .text("Mobile Number", 315, y, { width: 100, align: "left" })
        .text("Area", 420, y, { width: 80, align: "left" })
        .text("Outstanding Due()", 500, y, { width: 80, align: "right" });

    y += 18;

    doc.moveTo(50, y).lineTo(545, y).stroke();
    y += 8;

    // Render rows
    doc.font("Helvetica").fontSize(9);

    for (const row of partyRows) {
        // Check if row fits; leave space for footer
        if (y + ROW_HEIGHT + SEPARATOR_HEIGHT + TOTALS_ROW_HEIGHT + FOOTER_HEIGHT > BOTTOM_MARGIN) {
            return y; // Return y for new page handling
        }

        doc.text(String(row.serial), 52, y, { width: 25 });
        doc.text(row.name || "-", 86, y, { width: 110 });
        doc.text(row.partyCode || "-", 220, y, { width: 80 });
        doc.text(row.phoneNumber || "-", 315, y, { width: 100 });
        doc.text(row.area || "-", 420, y, { width: 80 });
        doc.text(formatCurrency(row.outstandingDue), 500, y, { width: 80, align: "right" });

        y += 18;
        doc.moveTo(50, y).lineTo(545, y).stroke();
        y += 6;
    }

    return y;
};

module.exports.generatePartiesReport = async (req, res) => {
    try {
        const { fromDate, toDate, partyIds = [], areaIds = [] } = req.body || {};

        const dateRangeError = validateDateRange(fromDate, toDate);
        if (dateRangeError) {
            return badRequestResponse(res, dateRangeError);
        }

        const selectedPartyIds = Array.isArray(partyIds) && partyIds.length ? partyIds : [];
        const selectedAreaIds = Array.isArray(areaIds) && areaIds.length ? areaIds : [];

        if (!selectedPartyIds.length && !selectedAreaIds.length) {
            return badRequestResponse(res, "Please select at least one party or area");
        }

        let resolvedPartyIds = selectedPartyIds;

        if (selectedAreaIds.length) {
            const partiesByArea = await partyModel
                .find({ area: { $in: selectedAreaIds }, user: req.user.userId })
                .select("_id")
                .lean();

            resolvedPartyIds = partiesByArea.map((p) => p._id);
        }

        const parties = await partyModel
            .find({
                _id: { $in: resolvedPartyIds },
                user: req.user.userId,
            })
            .populate("area", "name")
            .sort({ name: 1 })
            .lean();

        if (!parties.length) {
            return badRequestResponse(res, "No matching parties found for this report");
        }

        const partyRows = await Promise.all(
            parties.map(async (party, index) => {
                const outstandingDue = await getPartyOutstandingDue(party._id, fromDate, toDate);

                return {
                    serial: index + 1,
                    name: party.name,
                    partyCode: party.partyCode || "-",
                    phoneNumber: party.phoneNumber || "-",
                    area: party.area?.name || "-",
                    outstandingDue,
                };
            })
        );

        const totalDue = partyRows.reduce((sum, row) => sum + Number(row.outstandingDue || 0), 0);

        // Calculate total pages (rough estimate for page numbering)
        const ROWS_PER_PAGE = 30;
        const totalPages = Math.ceil(partyRows.length / ROWS_PER_PAGE);

        const doc = new PDFDocument({
            margin: 40,
            size: "A4",
            layout: "portrait",
        });

        res.setHeader("Content-Type", "application/pdf");
        res.setHeader(
            "Content-Disposition",
            `attachment; filename="${safeFileName("parties-outstanding-dues-report")}.pdf"`
        );

        doc.pipe(res);

        // Header
        doc
            .font("Helvetica-Bold")
            .fontSize(20)
            .text("Mstr-Ledger", { align: "center" });

        doc
            .font("Helvetica")
            .fontSize(12)
            .text("Parties Report", { align: "center" });

        doc
            .font("Helvetica-Oblique")
            .fontSize(9)
            .text("Party Ledger Management System", { align: "center" });

        doc
            .font("Helvetica")
            .fontSize(11)
            .text("Outstanding Dues for Selected Parties", { align: "center" });

        doc.moveDown(1);

        // Report info
        doc
            .font("Helvetica")
            .fontSize(9)
            .text(`Report Period: ${fromDate ? formatDateDisplay(fromDate) : "Beginning"} - ${toDate ? formatDateDisplay(toDate) : "Till Date"}`)
            .text(`Total Parties: ${partyRows.length}`)
            .text(`Generated On: ${new Date().toLocaleString("en-GB")}`)
            .text(`Generated By: ${req.user?.name || req.user?.firstName || req.user?.email || "System"}`);

        doc.moveDown(1);

        let currentPageNum = 1;
        let rowsProcessed = 0;

        while (rowsProcessed < partyRows.length) {
            const pageRowCount = Math.min(ROWS_PER_PAGE, partyRows.length - rowsProcessed);
            const pageRows = partyRows.slice(rowsProcessed, rowsProcessed + pageRowCount);

            // Render table for current page
            let y = doc.y;

            doc
                .font("Helvetica-Bold")
                .fontSize(9)
                .text("#", 52, y, { width: 25, align: "left" })
                .text("Party Name", 86, y, { width: 110, align: "left" })
                .text("Party Code", 220, y, { width: 80, align: "left" })
                .text("Mobile Number", 315, y, { width: 100, align: "left" })
                .text("Area", 420, y, { width: 80, align: "left" })
                .text("Outstanding Due()", 500, y, { width: 80, align: "right" });

            y += 18;

            doc.moveTo(50, y).lineTo(545, y).stroke();
            y += 8;

            doc.font("Helvetica").fontSize(9);

            for (const row of pageRows) {
                doc.text(String(row.serial), 52, y, { width: 25 });
                doc.text(row.name || "-", 86, y, { width: 110 });
                doc.text(row.partyCode || "-", 220, y, { width: 80 });
                doc.text(row.phoneNumber || "-", 315, y, { width: 100 });
                doc.text(row.area || "-", 420, y, { width: 80 });
                doc.text(formatCurrency(row.outstandingDue), 500, y, { width: 80, align: "right" });

                y += 18;
                doc.moveTo(50, y).lineTo(545, y).stroke();
                y += 6;
            }

            // Render totals row (only on last page)
            if (rowsProcessed + pageRowCount >= partyRows.length) {
                doc
                    .font("Helvetica-Bold")
                    .fontSize(10)
                    .text(`Total (${partyRows.length} Parties)`, 380, y + 6, { width: 120, align: "left" })
                    .text(formatCurrency(totalDue), 500, y + 6, { width: 80, align: "right" });
            }

            // Footer with page numbers
            doc
                .font("Helvetica")
                .fontSize(8)
                .text(`Page ${currentPageNum} of ${totalPages}`, 50, 750, { align: "center" });

            rowsProcessed += pageRowCount;
            currentPageNum++;

            if (rowsProcessed < partyRows.length) {
                doc.addPage();
            }
        }

        doc.end();
    } catch (error) {
        if (!res.headersSent) {
            return errorResponse(res, "Error generating parties report: " + error.message);
        }

        return res.end();
    }
};

const validateDateRange = (fromDate, toDate) => {
    if (!fromDate || !toDate) return null;

    const startDate = new Date(fromDate);
    const endDate = new Date(toDate);

    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
        return "Invalid date range provided";
    }

    if (startDate > endDate) {
        return "From date cannot be greater than To date";
    }

    return null;
};
