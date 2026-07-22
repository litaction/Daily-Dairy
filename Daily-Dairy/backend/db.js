const mongoose = require('mongoose');
require('dotenv').config(); // 1. Load the variables from the .env file

mongoose.set("strictQuery", true);

const MongoDB = () => {
    // 2. Fetch the URI from your .env file
    const mongoURI = process.env.MONGO_URI;

    // 3. Pass the mongoURI variable into the connect function
    mongoose.connect(mongoURI, { useNewUrlParser: true }, async (err, res) => {
        if (err) console.log("---", err);
        else {
            console.log("connected")
            const fetched_data = await mongoose.connection.db.collection("products");
            fetched_data.find({}).toArray(async function (err, data) {
                if (err) console.log(err);
                else {
                    global.products = data;
                }
            })
            const brand = await mongoose.connection.db.collection("brands");
            brand.find({}).toArray(async function (err, brandData) {
                if (err) console.log(err);
                else {
                    global.brand=brandData;
                }})
            const category = await mongoose.connection.db.collection("category");
            category.find({}).toArray(async function (err, catData) {
                if (err) console.log(err);
                else {
                    global.category=catData;
                }})
        }
    });
};

module.exports = MongoDB;