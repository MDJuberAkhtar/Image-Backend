const mysql = require('mysql');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

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
exports.getAllUser = async(req, res) => {
    const sql = 'select * from Users';
    await  db.query(sql, (err, results) => {
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

//create new user or signup
exports.createUser = ( [
    check('name', 'Name is required').not().isEmpty(),
    check('email', 'Please provide a valid email').isEmail(),
    check('password', 'password must be min 5 charater').isLength({ min: 5 })
  ], async(req, res)=>{
    //check for errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const details = req.body;
    
   
   //hasing the password
    const salt = await bcrypt.genSalt(10);
    details.password = await bcrypt.hash(details.password, salt)


    //send the data
     const sql =   `INSERT INTO Users SET ?   `;
     await db.query(sql, details, (err, result)=>{
      if(err) throw err;

      const data = JSON.stringify(result);
      const payload = {
        data : data
    };

    jwt.sign(payload, process.env.JWT_SECRET, {expiresIn: 360000}, (err, token)=>{
     if(err) throw err;
     console.log(token);
     res.status(201).json({token});
    })
 
  })

})

//login user
exports.logUser =([
    check('email', 'Please provide a valid email').isEmail(),
    check('password', 'password is required').exists()
  ], async(req, res)=>{
    //check for errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const {email, password} = req.body;

   
    var sql = 'SELECT * FROM Users WHERE email = ?';
    //send the data
    db.query(sql, [email], (err, results)=>{
        if (err) throw err;
        if(results[0].password){
             bcrypt.compare(password, results[0].password, (err, result)=>{
                 if(result){

                    const data = JSON.stringify(result);
                    const payload = {
                      data : data
                  };

                  jwt.sign(payload, process.env.JWT_SECRET, {expiresIn: 360000}, (err, token)=>{
                    if(err) throw err;
                    console.log(token);
                    res.status(201).json({token});
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

//delete user

// exports.deleteUser = async (req, res)=>{
//     const { email, password } = req.body;
//     const sql = await 'DELETE FROM Users WHERE email=? AND password = ?';
//     db.query(sql,[email, password], (err, result)=>{
//         if(err) throw err;
//         res.status(200).json({
//             status:'success',
//             message:'Data has been removed'
//         })
//     })
// }