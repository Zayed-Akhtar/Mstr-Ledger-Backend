require("dotenv").config();
const mongoose = require("mongoose");

require("../config/mongodb-cpnnection");

const userModel = require("../models/user-model");
const areaModel = require("../models/area-model");
const partyModel = require("../models/party-model");
const transactionModel = require("../models/transaction-model");

const usersData = [
    {
        firstName: "Ayesha",
        lastname: "Khan",
        email: "ayesha.khan@example.com",
        password: "password123",
        phoneNumber: "555-0101"
    },
    {
        firstName: "Bilal",
        lastname: "Raza",
        email: "bilal.raza@example.com",
        password: "password123",
        phoneNumber: "555-0102"
    },
    {
        firstName: "Sameer",
        lastname: "Ali",
        email: "sameer.ali@example.com",
        password: "password123",
        phoneNumber: "555-0103"
    }
];

const areasData = [
    {
        name: "North Zone",
        description: "Northern commercial area"
    },
    {
        name: "South Zone",
        description: "Southern commercial area"
    },
    {
        name: "Central Zone",
        description: "Central business district"
    }
];

const partiesData = [
    {
        partyCode: "P001",
        name: "Khan Traders",
        fullAddress: "12 Elm Street",
        phoneNumber: "555-0201",
        email: "khantraders@example.com",
        creditLimit: 50000,
        active: true
    },
    {
        partyCode: "P002",
        name: "Raza Enterprises",
        fullAddress: "34 Oak Avenue",
        phoneNumber: "555-0202",
        email: "raza@example.com",
        creditLimit: 75000,
        active: true
    },
    {
        partyCode: "P003",
        name: "Ali Supplies",
        fullAddress: "56 Pine Road",
        phoneNumber: "555-0203",
        email: "ali@example.com",
        creditLimit: 40000,
        active: true
    },
    {
        partyCode: "P004",
        name: "Imam Distributors",
        fullAddress: "78 Maple Lane",
        phoneNumber: "555-0204",
        email: "imam@example.com",
        creditLimit: 100000,
        active: true
    },
    {
        partyCode: "P005",
        name: "Javed Wholesale",
        fullAddress: "90 Cedar Court",
        phoneNumber: "555-0205",
        email: "javed@example.com",
        creditLimit: 60000,
        active: false
    },
    {
        partyCode: "P006",
        name: "Ahmed Merchants",
        fullAddress: "11 Birch Boulevard",
        phoneNumber: "555-0206",
        email: "ahmed@example.com",
        creditLimit: 80000,
        active: true
    }
];

const transactionData = [
    {
        debit: 1200,
        credit: 0,
        description: "Opening stock purchase"
    },
    {
        debit: 0,
        credit: 300,
        description: "Received payment"
    },
    {
        debit: 650,
        credit: 0,
        description: "Inventory purchase"
    },
    {
        debit: 0,
        credit: 500,
        description: "Customer settlement"
    },
    {
        debit: 900,
        credit: 0,
        description: "New stock delivery"
    },
    {
        debit: 0,
        credit: 450,
        description: "Partial payment received"
    },
    {
        debit: 700,
        credit: 0,
        description: "Purchase order"
    },
    {
        debit: 0,
        credit: 800,
        description: "Client payment"
    },
    {
        debit: 400,
        credit: 0,
        description: "New purchase"
    },
    {
        debit: 0,
        credit: 200,
        description: "Final settlement"
    }
];

const seedData = async () => {

    try {

        /*
        ------------------------------------
        1. CLEAR EXISTING DATA
        ------------------------------------
        */

        await transactionModel.deleteMany({});
        await partyModel.deleteMany({});
        await areaModel.deleteMany({});
        await userModel.deleteMany({});

        console.log("Existing data deleted.");

        /*
        ------------------------------------
        2. CREATE USERS
        ------------------------------------
        */

        const createdUsers = await userModel.insertMany(usersData);

        console.log(`${createdUsers.length} users created.`);

        /*
        ------------------------------------
        3. CREATE AREAS
        ------------------------------------
        */

        // Each user gets one area
        const areas = areasData.map((area, index) => ({
            ...area,

            user: createdUsers[index]._id,

            // Will update after creating parties
            parties: 0
        }));

        const createdAreas = await areaModel.insertMany(areas);

        console.log(`${createdAreas.length} areas created.`);

        /*
        ------------------------------------
        4. CREATE PARTIES
        ------------------------------------

        User 1:
            North Zone
            P001
            P002

        User 2:
            South Zone
            P003
            P004

        User 3:
            Central Zone
            P005
            P006
        ------------------------------------
        */

        const parties = partiesData.map((party, index) => {

            const userIndex = Math.floor(index / 2);

            return {
                ...party,

                user: createdUsers[userIndex]._id,

                area: createdAreas[userIndex]._id
            };

        });

        const createdParties = await partyModel.insertMany(parties);

        console.log(`${createdParties.length} parties created.`);

        /*
        ------------------------------------
        5. UPDATE AREA PARTY COUNTS
        ------------------------------------
        */

        const areaUpdates = createdAreas.map((area, index) => {

            const partyCount = createdParties.filter(
                party =>
                    party.area.toString() === area._id.toString()
            ).length;

            return {
                updateOne: {

                    filter: {
                        _id: area._id
                    },

                    update: {
                        $set: {
                            parties: partyCount
                        }
                    }

                }
            };

        });

        await areaModel.bulkWrite(areaUpdates);

        /*
        ------------------------------------
        6. ATTACH PARTIES TO USERS
        ------------------------------------
        */

        const userUpdates = createdUsers.map(user => {

            const userParties = createdParties
                .filter(
                    party =>
                        party.user.toString() === user._id.toString()
                )
                .map(party => party._id);

            return {

                updateOne: {

                    filter: {
                        _id: user._id
                    },

                    update: {
                        $set: {
                            parties: userParties
                        }
                    }

                }

            };

        });

        await userModel.bulkWrite(userUpdates);

        /*
        ------------------------------------
        7. CREATE TRANSACTIONS
        ------------------------------------
        */

        let transactionNumber = 1;

        const transactions = [];

        createdParties.forEach((party, partyIndex) => {

            let balance = 0;

            // Give every party 10 transactions
            transactionData.forEach((transaction, transactionIndex) => {

                /*
                Assuming:

                Debit  -> increases balance
                Credit -> decreases balance
                */

                balance += transaction.debit - transaction.credit;

                transactions.push({

                    transactionNumber:
                        transactionNumber++,

                    transactionDate:
                        new Date(
                            2026,
                            partyIndex,
                            transactionIndex + 1
                        ),

                    description:
                        transaction.description,

                    debit:
                        transaction.debit,

                    credit:
                        transaction.credit,

                    balance,

                    party:
                        party._id

                });

            });

        });

        const createdTransactions =
            await transactionModel.insertMany(transactions);

        /*
        ------------------------------------
        SUCCESS
        ------------------------------------
        */

        console.log("");
        console.log("✅ Database seeded successfully.");
        console.log("--------------------------------");
        console.log(`Users        : ${createdUsers.length}`);
        console.log(`Areas        : ${createdAreas.length}`);
        console.log(`Parties      : ${createdParties.length}`);
        console.log(`Transactions : ${createdTransactions.length}`);

    } catch (err) {

        console.error("❌ Seed failed:");
        console.error(err);

    } finally {

        await mongoose.connection.close();

        console.log("");
        console.log("MongoDB connection closed.");

    }

};

seedData();