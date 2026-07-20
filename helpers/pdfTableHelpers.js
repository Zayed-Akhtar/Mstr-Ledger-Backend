const drawTableHeader = (doc, columns, y) => {

    doc
        .font("Helvetica-Bold")
        .fontSize(11);

    doc.text("Txn No", columns.txn, y);
    doc.text("Date", columns.date, y);
    doc.text("Credit", columns.credit, y);
    doc.text("Debit", columns.debit, y);
    doc.text("Balance", columns.balance, y);

    y += 18;

    doc
        .moveTo(columns.txn, y)
        .lineTo(545, y)
        .stroke();

    return y + 8;
};

const drawTransactionRow = (
    doc,
    columns,
    y,
    txn
) => {

    doc
        .font("Helvetica")
        .fontSize(10);

    doc.text(
        txn.transactionNumber.toString(),
        columns.txn,
        y
    );

    doc.text(
        new Date(txn.transactionDate).toLocaleDateString(),
        columns.date,
        y
    );

    doc.text(
        txn.credit.toString(),
        columns.credit,
        y,
        {
            width: 70,
            align: "right"
        }
    );

    doc.text(
        txn.debit.toString(),
        columns.debit,
        y,
        {
            width: 70,
            align: "right"
        }
    );

    doc.text(
        txn.balance.toString(),
        columns.balance,
        y,
        {
            width: 70,
            align: "right"
        }
    );

    y += 18;

    doc
        .moveTo(columns.txn, y)
        .lineTo(545, y)
        .stroke();

    return y + 5;
};

const drawTotalsRow = (
    doc,
    columns,
    y,
    totalCredit,
    totalDebit,
    closingBalance
) => {

    y += 10;

    doc
        .moveTo(columns.txn, y)
        .lineTo(545, y)
        .stroke();

    y += 10;

    doc
        .font("Helvetica-Bold")
        .fontSize(11);

    doc.text("Totals", columns.date, y);

    doc.text(
        totalCredit.toString(),
        columns.credit,
        y,
        {
            width: 70,
            align: "right"
        }
    );

    doc.text(
        totalDebit.toString(),
        columns.debit,
        y,
        {
            width: 70,
            align: "right"
        }
    );

    doc.text(
        closingBalance.toString(),
        columns.balance,
        y,
        {
            width: 70,
            align: "right"
        }
    );

    y += 20;

    doc
        .moveTo(columns.txn, y)
        .lineTo(545, y)
        .stroke();

    return y;
};

module.exports = {
    drawTableHeader,
    drawTransactionRow,
    drawTotalsRow
};