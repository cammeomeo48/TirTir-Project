const mongoose = require('mongoose');
require('dotenv').config();
const Shade = require('./models/shade.model');

const uri = process.env.MONGO_URI;

mongoose.connect(uri)
  .then(async () => {
    const shades = await Shade.find({ Parent_ID: '69876b6bb638b200d0532813' });
    console.log(`--- Shades found for Gift Card: ${shades.length} ---`);
    shades.forEach(s => console.log(`[${s._id}] / [Name: ${s.Shade_Name}]`));
    mongoose.disconnect();
  });
