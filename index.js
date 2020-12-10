const serverless = require('serverless-http');
const express = require('express');
const cors = require('cors');
const BodyParse = require('body-parser');
const multer = require('multer');
const getImageRouter = require('./routes/getImageRoutes');
const getUser = require('./routes/getUser');
const app = express()

app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*"); 
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.header("Access-Control-Allow-Methods", "*");
    next();
  });


app.use(cors())
app.use(express.json())
app.use(BodyParse.urlencoded({extended: true}))
app.use(multer().array())



app.use('/', getImageRouter)
app.use('/api', getUser)


module.exports.handler = serverless(app);