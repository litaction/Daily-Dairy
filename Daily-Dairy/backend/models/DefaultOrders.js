 const mongoose = require('mongoose');
 const { Schema } = mongoose;
 
 const SubItemSchema = new Schema({
   id:        { type: String },
   name:       { type: String, required: true },
   brand:      { type: String },
   image:      { type: String },
   price:      { type: Number },
   selectedQuantity: { type: Number, required: true },
   totalPrice:    { type: Number, required: true },
 }, { _id: false });

 const DefaultOrderSchema = new Schema({
   email:    { type: String, required: true, index: true },  
   items:    { type: [SubItemSchema], required: true },  
   intervalDays: { type: Number, required: true, default: 1, min: 1 },
   startDate:  { type: String, required: true },        
   lastRun:   { type: String, default: null },       
   active:    { type: Boolean, default: true },      
   createdAt:  { type: Date, default: Date.now },
 });
 
 module.exports = mongoose.model('DefaultOrders', DefaultOrderSchema);