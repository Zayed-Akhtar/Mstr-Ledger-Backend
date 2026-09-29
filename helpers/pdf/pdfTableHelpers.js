const { formatDate } = require("../dateFormatter");
const columns = require("./pdfColumns");


const PAGE_BOTTOM = 750;
const ROW_HEIGHT = 23;
const TOTALS_BLOCK_HEIGHT = 55;

const ensureSpaceForRow = (doc, y) => {
    if (y + ROW_HEIGHT > PAGE_BOTTOM) {
        doc.addPage();
        y = 50;
        y = drawTableHeader(doc, y);
    }

    return y;
};

const ensureSpaceForTotals = (doc, y) => {
    if (y + TOTALS_BLOCK_HEIGHT > PAGE_BOTTOM) {
        doc.addPage();
        y = 50;
        y = drawTableHeader(doc, y);
    }

    return y;
};

const drawTableHeader = (doc, y) => {

    doc
        .font("Helvetica-Bold")
        .fontSize(11);

    doc.text(
        columns.txn.title,
        columns.txn.x,
        y,
        {
            width: columns.txn.width
        }
    );

    doc.text(
        columns.date.title,
        columns.date.x,
        y,
        {
            width: columns.date.width
        }
    );

    doc.text(
        columns.description.title,
        columns.description.x,
        y,
        {
            width: columns.description.width
        }
    );

    doc.text(
        columns.credit.title,
        columns.credit.x,
        y,
        {
            width: columns.credit.width,
            lineBreak: false
        }
    );

    doc.text(
        columns.debit.title,
        columns.debit.x,
        y,
        {
            width: columns.debit.width,
            lineBreak: false
        }
    );

    doc.text(
        columns.balance.title,
        columns.balance.x,
        y,
        {
            width: columns.balance.width,
            lineBreak: false
        }
    );

    y += 18;

    doc
        .moveTo(columns.txn.x, y)
        .lineTo(545, y)
        .stroke();

    return y + 8;
};

const drawTransactionRow = (
    doc,
    y,
    txn
) => {

    y = ensureSpaceForRow(doc, y);

    doc
        .font("Helvetica")
        .fontSize(10);

    doc.text(
        txn.transactionNumber.toString(),
        columns.txn.x,
        y
    );

    doc.text(
        formatDate(txn.transactionDate),
        columns.date.x,
        y
    );

    doc.text(
        txn.description ?? "-",
        columns.description.x,
        y,
        {
            width: columns.description.width
        }
    );

    doc.text(
        txn.credit.toString(),
        columns.credit.x,
        y,
        {
            width: columns.credit.width,
        }
    );

    doc.text(
        txn.debit.toString(),
        columns.debit.x,
        y,
        {
            width: columns.debit.width,
        }
    );

    doc.text(
        txn.balance.toString(),
        columns.balance.x,
        y,
        {
            width: columns.balance.width,
        }
    );

    y += 18;

    doc
        .moveTo(columns.txn.x, y)
        .lineTo(545, y)
        .stroke();

    return y + 5;
};

const drawTotalsRow = (
    doc,
    y,
    totalCredit,
    totalDebit,
    closingBalance
) => {

    y = ensureSpaceForTotals(doc, y);

    y += 10;

    doc
        .moveTo(columns.txn.x, y)
        .lineTo(545, y)
        .stroke();

    y += 10;

    doc
        .font("Helvetica-Bold")
        .fontSize(11);

    doc.text(
        "Grand Total",
        columns.description.x,
        y,
        {
            width: columns.description.width
        }
    );

    doc.text(
        totalCredit.toString(),
        columns.credit.x,
        y,
        {
            width: columns.credit.width
        }
    );

    doc.text(
        totalDebit.toString(),
        columns.debit.x,
        y,
        {
            width: columns.debit.width
        }
    );

    doc.text(
        closingBalance.toString(),
        columns.balance.x,
        y,
        {
            width: columns.balance.width
        }
    );

    y += 20;

    doc
        .moveTo(columns.txn.x, y)
        .lineTo(545, y)
        .stroke();

    return y;
};

module.exports = {
    drawTableHeader,
    drawTransactionRow,
    drawTotalsRow
};