const mongoose = require('mongoose');

const connDB = async () => {
    try {
        await mongoose.connect('mongodb+srv://maitri:1110@cluster0.1xi9ozw.mongodb.net/sms');
        console.log("MongoDB Connected...!");
    } catch (err) {
        console.log("MongoDb Connection Failed.", err);
    }
};

module.exports = connDB;
