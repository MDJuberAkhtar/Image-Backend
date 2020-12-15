const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const client = require('./initRedis');
dotenv.config({ path: './config.env' });

module.exports = function(req, res, next){
    //get token from header
    
    let token;
    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
      ) {
        token = req.headers.authorization.split(' ')[1];
      }
   
    //if there is no token
    if(!token){
        return res.status(401).json({message: "No token, authorization failed "})
    }
    //verify token
    try{
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        req.email = decoded.email;
        req.token = token;
        console.log(req.email);
        
        client.GET(req.email, (err, value)=>{
            if(err) throw err;
            // console.log(value)
        });
        
        next();
    }catch(err){
        res.status(401).json({message: "token is not valid "})
    }

}