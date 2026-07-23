const express = require('express');
const router = express.Router();
const DefaultOrder = require('../models/DefaultOrders');
const Order = require('../models/Orders');
const cron = require('node-cron');
const fetchuser=require('../middleware/auth');
const user=require('../models/User')
  async function runDailyOrders() {
   const today = new Date().toDateString();
   const subs = await DefaultOrder.find({ active: true });  // only active subscriptions
 
   let placed = 0, skipped = 0;
 
   for (const sub of subs) {
     // how many days since this sub last placed an order?
     // never run before (lastRun null) => due now
     const daysSince = sub.lastRun
       ? Math.floor((Date.now() - new Date(sub.lastRun)) / 86400000)
       : Infinity;
 
     if (daysSince < sub.intervalDays) { skipped++; continue; }  // not due yet
 
     // due → create ONE clean order document
     const orderPrice = sub.items.reduce((sum, it) => sum + (Number(it.totalPrice) || 0), 0);
     await Order.create({
       email: sub.email,
       orderDate: today,
       items: sub.items,
       orderPrice,
       source: 'subscription',
     });
 
     sub.lastRun = today;   // remember we fired today
     await sub.save();
     placed++;
   }
   console.log(`runDailyOrders: ${placed} placed, ${skipped} skipped (${subs.length} active subs)`);

   return { placed, skipped };
 }
 
 // fires every midnight
 const job = cron.schedule('0 0 * * *', async () => {
   try { await runDailyOrders(); }
   catch (err) { console.log('Cron error:', err.message); }
 });
 job.start();
 
 // DEV ONLY — manual trigger for testing. REMOVE before deploy.
 router.post('/runCronNow', fetchuser, async (req, res, next) => {
   try {
     const result = await runDailyOrders();
     res.json({ success: true, ...result });
   } catch (error) { next(error); }
 });

 router.post('/DefaultOrderdata', fetchuser, async (req, res, next) => {
   try {
     const loggedInUser = await user.findById(req.user.id);
     if (!loggedInUser) return res.status(401).json({ error: 'User not found' });
 
     const items = req.body.order_data;
     if (!Array.isArray(items) || items.length === 0) {
       return res.status(400).json({ success: false, error: 'Subscription must have at least one item' });
     }
 
     let intervalDays = Number(req.body.intervalDays) || 1;
     if (intervalDays < 1) intervalDays = 1;
 
     const today = new Date().toDateString();
 
     const sub = await DefaultOrder.create({
       email: loggedInUser.email,
       items,
       intervalDays,
       startDate: today,
       lastRun: null,   // never run yet → first cron pass will place it
       active: true,
     });
 
     res.json({ success: true, subscriptionId: sub._id });
   } catch (error) {
     next(error);
   }
 });


 router.post('/DisplayDefaultOrderdata', fetchuser, async (req, res, next) => {
   try {
     const loggedInUser = await user.findById(req.user.id);
     if (!loggedInUser) return res.status(401).json({ error: 'User not found' });
 
     const subscriptions = await DefaultOrder.find({ email: loggedInUser.email }).sort({ createdAt: -1 });
 
     res.json({ success: true, subscriptions });
   } catch (error) {
     next(error);
   }
 });


  router.post('/UpdateDefaultOrder', fetchuser, async (req, res, next) => {
   try {
     const loggedInUser = await user.findById(req.user.id);
     if (!loggedInUser) return res.status(401).json({ error: 'User not found' });
 
     const { subscriptionId, intervalDays, order_data, active } = req.body;
     if (!subscriptionId) {
       return res.status(400).json({ success: false, error: 'subscriptionId required' });
     }
 
     // build only the fields the client actually sent
     const updates = {};
 
     if (intervalDays !== undefined) {
       const n = Number(intervalDays);
       if (!n || n < 1) return res.status(400).json({ success: false, error: 'intervalDays must be >= 1' });
       updates.intervalDays = n;
     }
 
     if (order_data !== undefined) {
       if (!Array.isArray(order_data) || order_data.length === 0) {
         return res.status(400).json({ success: false, error: 'items must be a non-empty array' });
       }
       updates.items = order_data;
     }
 
     if (active !== undefined) {
       updates.active = Boolean(active);  // pause / resume without deleting
     }
 
     if (Object.keys(updates).length === 0) {
       return res.status(400).json({ success: false, error: 'Nothing to update' });
     }
 
     const sub = await DefaultOrder.findOneAndUpdate(
       { _id: subscriptionId, email: loggedInUser.email },  // ownership check in the query
       { $set: updates },
       { new: true, runValidators: true }          // re-validate the new items against schema
     );
     if (!sub) return res.status(404).json({ success: false, error: 'Subscription not found' });
 
     res.json({ success: true, subscription: sub });
   } catch (error) {
     next(error);
   }
 });
module.exports = router;
