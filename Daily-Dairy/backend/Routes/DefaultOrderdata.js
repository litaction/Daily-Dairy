const express = require('express');
const router = express.Router();
const Order = require('../models/DefaultOrders');
const OrderDB = require('../models/Orders');
const cron = require('node-cron');
const fetchuser=require('../middleware/auth');
const user=require('../models/User')

// The daily order materialization, extracted so it can be called from:
 // the cron, a dev route (testing), and later a startup catch-up check.
 async function runDailyOrders() {
     const currentDate = new Date().toDateString();
 
     await Order.updateMany({}, { $set: { to_date: currentDate } });
 
     const orders = await Order.find({ to_date: currentDate });
 
     for (const order of orders) {
         let data = order.order_data
         data.splice(0, 0, { Order_date: order.to_date })
         let eId = await OrderDB.findOne({ 'email': order.email })
 
         if (eId === null) {
             await OrderDB.create({
                 email: order.email,
                 order_data: [data]
             })
         }
         else {
             await OrderDB.findOneAndUpdate({ email: order.email },
                 { $push: { order_data: data } })
         }
     }
     console.log('Daily orders run completed');
 }
 
 const job = cron.schedule('0 0 * * *', async () => {
     try {
         await runDailyOrders();
     } catch (error) {
         console.log('Cron job error:', error.message);
     }
 });
 
 job.start();
 
 // DEV ONLY — manual midnight trigger for testing. Remove before merging to master.
 router.post('/runCronNow', async (req, res) => {
     try {
         await runDailyOrders();
         res.json({ success: true, message: 'Daily orders run executed' });
     } catch (error) {
         res.status(500).json({ success: false, error: error.message });
     }
 });

router.post('/DefaultOrderdata',fetchuser, async (req, res) => {
    let data = req.body.order_data
    const loggedInUser=await user.findById(req.user.id);
    if(!loggedInUser) res.status(401).json({error:'User not found'});
    let eId = await Order.findOne({ 'email': loggedInUser.email })
    if (eId === null) {
        try {

            await Order.create({
                email: loggedInUser.email,
                order_data: data,
                order_date: new Date().toDateString(),
                to_date: new Date().toDateString()
            }).then(() => {
                res.json({ success: true })
            })
        } catch (error) {
            console.log(error.message)
            res.send("Server Error", error.message)

        }
    }

    else {
        try {
            res.json({ success: false })
        } catch (error) {
            console.log(error.message)
            res.send("Server Error", error.message)
        }
    }
})


router.post('/DisplayDefaultOrderdata',fetchuser, async (req, res) => {
    try {
         const loggedInUser=await user.findById(req.user.id);
        if(!loggedInUser) res.status(401).json({error:'User not found'});
      const email = loggedInUser.email;
      
      const order = await Order.findOne({ email });
  
      if (!order) {
        return res.status(404).json({ message: 'Order not found' });
      }
      const fromDate = order.order_date;
      const toDate = order.to_date;
      const fromDatestr = new Date(order.order_date);
      const toDatestr = new Date(order.to_date);
      const timeDiff = toDatestr.getTime() - fromDatestr.getTime();
      const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
      const { order_data } = order;
  
      const extractedData = order_data.map((orderItem) => ({
        name: orderItem.name,
        selectedQuantity: orderItem.selectedQuantity,
        totalPrice: orderItem.totalPrice,
        brand: orderItem.brand,
      }));
  
      res.json({extractedData,fromDate, toDate, daysDiff});
    } catch (error) {
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  

  router.post('/DropDefaultOrder',fetchuser, async (req, res) => {
    try {
         const loggedInUser=await user.findById(req.user.id);
            if(!loggedInUser) res.status(401).json({error:'User not found'});
        const result = await Order.deleteOne({ email: loggedInUser.email });
        
        if (result.deletedCount === 0) {
          return res.status(404).json({ message: 'Default order not found' });
        }
        
        res.json({ success: true });
      } catch (error) {
        res.status(500).json({ message: 'Internal server error' });
      }
});
router.post('/CheckDefaultOrder',fetchuser, async (req, res) => {
    try {
         const loggedInUser=await user.findById(req.user.id);
        if(!loggedInUser) res.status(401).json({error:'User not found'});
      const existingOrder = await Order.findOne({ email: loggedInUser.email });
      const exists = existingOrder !== null;
  
      res.json({ exists });
    } catch (error) {
      console.log(error.message);
      res.status(500).send('Server Error');
    }
  });

module.exports = router;
