const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
dotenv.config({ path: './config.env' });

module.exports = function(req, res, next){
    //get token from header
    const token = req.header('x-auth-token');

    //if there is no token
    if(!token){
        return res.status(401).json({message: "No token, authorization failed "})
    }
    //verify token
    try{
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        req.data = decoded.data;
        next();
    }catch(err){
        res.status(401).json({message: "token is not valid "})
    }

}