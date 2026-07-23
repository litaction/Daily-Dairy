const mongoose = require('mongoose');
const { Schema } = mongoose;

const OrderItemSchema = new Schema({
    id:              { type: String },
    name:            { type: String, required: true },
    brand:           { type: String },
    image:           { type: String },
    price:           { type: Number },
    selectedQuantity:{ type: Number, required: true },
    totalPrice:      { type: Number, required: true },
}, { _id: false });  

const OrderSchema = new Schema({
    email:      { type: String, required: true, index: true },  
    orderDate:  { type: String, required: true, index: true },  
    items:      { type: [OrderItemSchema], required: true },    
    orderPrice: { type: Number, required: true },               
    source:     { type: String, enum: ['manual', 'subscription'], default: 'manual' },
    createdAt:  { type: Date, default: Date.now },
});

// compound index: "this user's orders for today" is the hottest query
OrderSchema.index({ email: 1, orderDate: 1 }); 

module.exports = mongoose.model('Orders', OrderSchema);