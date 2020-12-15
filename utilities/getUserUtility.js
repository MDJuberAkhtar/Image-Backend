const mysql = require('mysql');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const catchAsync = require('./../common/catchAsync');
const client = require('./../common/initRedis');

const { check, validationResult } = require('express-validator');


dotenv.config({ path: './config.env' });

//creating SQL connection
const db = mysql.createConnection({
    host     : process.env.HOST,
    user     : process.env.USER,
    password : process.env.PASSWORD ,
    port: process.env.PORT,
    database: process.env.DATABASE
  });

  //connect
db.connect((err)=>{
    if(err) {throw err}
    console.log('Mysql connected...')
});

//get all the user
exports.getAllUser = catchAsync(async(req, res, next) => {
  client.GET(req.email, (err, value)=>{
    if(err) throw err
    console.log(req.token);
    console.log(value);
    //check if current token exits or user logged out
    if(req.token !== value){
        res.status(401).json({message: "You are not authorized to access thees data"})
    }
    if(req.token === value){
     const sql = 'select * from Users';
     db.query(sql, (err, results) => {
  
      if(err){ throw  err}
      res.status(200).json({
          status:'SCCUESS',
          length: results.length,
          data:{
              results
          }
      })
     })

    }
    
  }) 
 })

//create new user or signup
exports.createUser = ( [
    check('name', 'Name is required').not().isEmpty(),
    check('email', 'Please provide a valid email').isEmail(),
    check('password', 'password must be min 5 charater').isLength({ min: 5 })
  ], catchAsync(async(req, res, next)=>{
    //check for errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const details = req.body;
    const {email} =req.body;
    

   //hasing the password
    const salt = await bcrypt.genSalt(10);
    details.password = await bcrypt.hash(details.password, salt)


    //send the data
  
     await db.query(`SELECT * FROM Users WHERE email=?`, email, (err, result)=>{
      if(err) throw err;
      //check if user already exists
      if(result[0]){
        res.status(500).json({message:"Sorry! email already exists, Please login"})
      }
      //create new user
      if(!result[0]){
        db.query(`INSERT INTO Users SET ? `, details, (err, result)=>{
          if(err) throw err;

          const payload = {
            email: details.email
          }
          //jwt sign
          jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: 3600 }, (err, token)=>{
            if(err) throw err;
            client.SET(email, token, (err, resolve)=>{
              if(err) throw err;
              res.status(201).json({token})
            })
            
          })

        })
      }
 
  })

  
})
)

//login user
exports.logUser =([
    check('email', 'Please provide a valid email').isEmail(),
    check('password', 'password is required').exists()
  ], catchAsync(async(req, res, next)=>{
    //check for errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const {email, password} = req.body;

   
    var sql = 'SELECT * FROM Users WHERE email = ?';
    //send the data
    db.query(sql, [email], (err, results)=>{
        if (err) throw err;;
        //check to see email
        if(results==0){
          res.status(201).json({message: "Sorry! there is no such credential"})
        }
        //if password value is true
        if(results[0].password){
             bcrypt.compare(password, results[0].password, (err, result)=>{
                 if(result){
                    const payload = {
                      email : email
                  };

                  jwt.sign(payload, process.env.JWT_SECRET, {expiresIn: 360000}, (err, token)=>{
                    if(err) throw err;
                    console.log(token);
                    client.SET(email , token, (err, reply)=>{
                      console.log(err)
                      if(err) throw err;
                      res.status(201).json({token});
                    })
                    // res.status(201).json({token});
                    
                   })

                 }
                 else{
                     res.status(400).json({message:"invalid password"})
                 }
             });
        }else{
            res.status(400).json({message: "invalid details"})
        }

        
    })
})
)

//logout user
exports.logoutUser = (req, res)=>{
    
  client.GET(req.email, (err, value)=>{
    if(err) throw err
    if(req.token !== value){
      res.status(401).json({message: "You have already logged out, Please try login in"})
    }
    if(req.token === value){
      client.DEL(req.email, (err, result)=>{
        if(err) throw err;
        res.status(200).json({
          message:"You have logged out successfully"
        })
      })
    }
  })
  
}
