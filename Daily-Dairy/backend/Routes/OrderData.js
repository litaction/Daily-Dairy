const express = require('express');
const router = express.Router();
const Order = require('../models/Orders');
const fetchuser=require('../middleware/auth')
const user=require('../models/User')
router.post('/orderData', fetchuser, async (req, res, next) => {
   try {
     const loggedInUser = await user.findById(req.user.id);
     if (!loggedInUser) return res.status(401).json({ error: 'User not found' });
 
     const items = req.body.order_data;
     if (!Array.isArray(items) || items.length === 0) {
       return res.status(400).json({ success: false, error: 'Order must contain at least one item' });
     }
 
     const orderPrice = items.reduce((sum, it) => sum + (Number(it.totalPrice) || 0), 0);
 
     const newOrder = await Order.create({
       email: loggedInUser.email,
       orderDate: new Date().toDateString(), 
       items,
       orderPrice,
       source: 'manual',
     });
 
     res.json({ success: true, orderId: newOrder._id });
   } catch (error) {
     next(error);
   }
 });


 
 router.post('/todaysorders', fetchuser, async (req, res, next) => {
   try {
     const loggedInUser = await user.findById(req.user.id);
     if (!loggedInUser) return res.status(401).json({ error: 'User not found' });
 
     const today = new Date().toDateString();  
     const orders = await Order.find({
       email: loggedInUser.email,
       orderDate: today,
     });
     const items = orders.flatMap(o => o.items);
 
     res.json({ success: true, orderDate: today, orders, items });
   } catch (error) {
     next(error);
   }
 });

  
  

module.exports = router;
