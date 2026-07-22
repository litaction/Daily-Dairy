const jwt = require('jsonwebtoken');
 
 const fetchuser = (req, res, next) => {
     const authHeader = req.header('Authorization');
     if (!authHeader || !authHeader.startsWith('Bearer ')) {
         return res.status(401).json({ error: 'Access denied: no token provided' });
     }
     const token = authHeader.replace('Bearer ', '');
     try {
         const data = jwt.verify(token, process.env.jwtsecret);  // signature + expiry check
         req.user = data.user;                                    // { id: <mongo _id> }
         next();
     } catch (error) {
         return res.status(401).json({ error: 'Access denied: invalid or expired token' });
     }
 };
 
 module.exports = fetchuser;