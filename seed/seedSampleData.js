require('dotenv').config();
const mongoose = require('mongoose');
const db = require('../config/mongodb-cpnnection');
const userModel = require('../models/user-model');
const partyModel = require('../models/party-model');
const transactionModel = require('../models/transaction-model');

const usersData = [
  { firstName: 'Ayesha', lastname: 'Khan', email: 'ayesha.khan@example.com', password: 'password123', phoneNumber: '555-0101' },
  { firstName: 'Bilal', lastname: 'Raza', email: 'bilal.raza@example.com', password: 'password123', phoneNumber: '555-0102' },
  { firstName: 'Sameer', lastname: 'Ali', email: 'sameer.ali@example.com', password: 'password123', phoneNumber: '555-0103' },
  { firstName: 'Fatima', lastname: 'Imam', email: 'fatima.imam@example.com', password: 'password123', phoneNumber: '555-0104' },
  { firstName: 'Hassan', lastname: 'Javed', email: 'hassan.javed@example.com', password: 'password123', phoneNumber: '555-0105' },
  { firstName: 'Leila', lastname: 'Ahmed', email: 'leila.ahmed@example.com', password: 'password123', phoneNumber: '555-0106' },
  { firstName: 'Adnan', lastname: 'Yousaf', email: 'adnan.yousaf@example.com', password: 'password123', phoneNumber: '555-0107' },
  { firstName: 'Noor', lastname: 'Hassan', email: 'noor.hassan@example.com', password: 'password123', phoneNumber: '555-0108' },
  { firstName: 'Sara', lastname: 'Malik', email: 'sara.malik@example.com', password: 'password123', phoneNumber: '555-0109' },
  { firstName: 'Omar', lastname: 'Naveed', email: 'omar.naveed@example.com', password: 'password123', phoneNumber: '555-0110' }
];

const partiesData = [
  { partyCode: 'P001', area: 'North Zone', fullAddress: '12 Elm Street', phoneNumber: '555-0201', name: 'Khan Traders' },
  { partyCode: 'P002', area: 'East Zone', fullAddress: '34 Oak Avenue', phoneNumber: '555-0202', name: 'Raza Enterprises' },
  { partyCode: 'P003', area: 'South Zone', fullAddress: '56 Pine Road', phoneNumber: '555-0203', name: 'Ali Supplies' },
  { partyCode: 'P004', area: 'West Zone', fullAddress: '78 Maple Lane', phoneNumber: '555-0204', name: 'Imam Distributors' },
  { partyCode: 'P005', area: 'Central Zone', fullAddress: '90 Cedar Court', phoneNumber: '555-0205', name: 'Javed Wholesale' },
  { partyCode: 'P006', area: 'Harbor Area', fullAddress: '11 Birch Boulevard', phoneNumber: '555-0206', name: 'Ahmed Merchants' },
  { partyCode: 'P007', area: 'Market Area', fullAddress: '22 Spruce Drive', phoneNumber: '555-0207', name: 'Yousaf Goods' },
  { partyCode: 'P008', area: 'Industrial Area', fullAddress: '33 Walnut Way', phoneNumber: '555-0208', name: 'Hassan Commerce' },
  { partyCode: 'P009', area: 'Uptown', fullAddress: '44 Chestnut Circle', phoneNumber: '555-0209', name: 'Malik Traders' },
  { partyCode: 'P010', area: 'Downtown', fullAddress: '55 Willow Terrace', phoneNumber: '555-0210', name: 'Naveed Supplies' }
];

const transactionDataTemplate = [
  { credit: 0, debit: 1200, description: 'Opening stock purchase', balance: 1200 },
  { credit: 300, debit: 0, description: 'Received payment', balance: 900 },
  { credit: 0, debit: 650, description: 'Inventory purchase', balance: 1550 },
  { credit: 500, debit: 0, description: 'Customer settlement', balance: 1050 },
  { credit: 0, debit: 900, description: 'New stock delivery', balance: 1950 },
  { credit: 450, debit: 0, description: 'Partial payment received', balance: 1500 },
  { credit: 0, debit: 700, description: 'Purchase order', balance: 2200 },
  { credit: 800, debit: 0, description: 'Client payment', balance: 1400 },
  { credit: 0, debit: 400, description: 'New purchase', balance: 1800 },
  { credit: 200, debit: 0, description: 'Final settlement', balance: 1600 }
];

const seedData = async () => {
  try {
    await userModel.deleteMany({});
    await partyModel.deleteMany({});
    await transactionModel.deleteMany({});

    const createdUsers = await userModel.insertMany(usersData);

    const partiesWithUsers = partiesData.map((party, index) => ({
      ...party,
      user: createdUsers[index]._id,
      transactions: []
    }));
    const createdParties = await partyModel.insertMany(partiesWithUsers);

    const transactionsToInsert = createdParties.map((party, index) => {
      const template = transactionDataTemplate[index];
      return {
        credit: template.credit,
        debit: template.debit,
        description: template.description,
        balance: template.balance,
        transactionDate: new Date(2026, 0, index + 1),
        party: party._id
      };
    });

    const createdTransactions = await transactionModel.insertMany(transactionsToInsert);

    const partyUpdates = createdParties.map((party, index) => ({
      updateOne: {
        filter: { _id: party._id },
        update: { transactions: [createdTransactions[index]._id] }
      }
    }));
    await partyModel.bulkWrite(partyUpdates);

    const userUpdates = createdUsers.map((user, index) => ({
      updateOne: {
        filter: { _id: user._id },
        update: { parties: [createdParties[index]._id] }
      }
    }));
    await userModel.bulkWrite(userUpdates);

    console.log('Seed complete: 10 users, 10 parties, 10 transactions created.');
  } catch (error) {
    console.error('Seed failed:', error);
  } finally {
    mongoose.connection.close();
  }
};

seedData();
