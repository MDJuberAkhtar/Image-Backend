const AWS = require('aws-sdk');
const fs = require('fs')
const im = require('imagemagick');
const multer = require('multer');
const resolution = require('./../common/resolution-data');
const catchAsync = require('./../common/catchAsync');

const awsConfig = { 
    "region": process.env.region
};

const s3 = new AWS.S3(awsConfig);

const multerConfig ={
    storage: multer.diskStorage({
      destination: function(req,file,cb){
        cb(null, '/tmp');
      },
      filename: function (req, file, callback) {
        callback(null, file.originalname);
      }
    })
};

exports.upload = multer(multerConfig)

//get all the images
exports.getAllImages = catchAsync(async(req, res, next)=> {
    const params = {
        Bucket: process.env.imageUploadBucket
    }
  await  s3.listObjects(params, function(err, data) {
        if (err) {
          console.log("Error", err);
          res.status(400).json({'error': err.message});
        } 
        else if(data.Contents.length===0){
            console.log('No images in bucket');
            res.status(400).json({'error': 'No images existing'});
        }
        else {
          var domain = process.env.DOMAIN_NAME;
            data.Contents.forEach( (element) => {
                element.ObjectUrl=element.Key; 
                element.Key=domain+element.Key;             
            })
            res.status(200).send(data.Contents);
        }
    });
  })

//upload new images

var addObject = async function(fileName,extension,width,height, imgCount){

    var contentType;
    if(extension==='jpg'){
        contentType='image/jpeg';
    }
    else if(extension==='png'){
        contentType='image/png';
    }
    else{
        contentType='';
    }

    var params = {
        ACL:'public-read',
        Body: fs.readFileSync(`/tmp/${fileName}.${extension}`),
        // Bucket: 'mobiotics.image.resize',
        Bucket: process.env.imageUploadBucket,
        Key: `${fileName}`,
        ContentType: contentType,
        Tagging: `key1=${width}&key2=${height}`
    };

    return s3.putObject(params).promise();
};

function resizeImage(width,height,image,sendResponse){
    var imageSplit = image.split('.');
    var imageTypes =['potrait','landscape','square'];
    var currentImageType = imageTypes.filter((imageType) => 
      resolution[imageType].hd.width===width && resolution[imageType].hd.height===height
    )[0];

    if(currentImageType==undefined){
        fs.unlink(`/tmp/${image}`, () => {
            console.log("File deleted successfully!");
            sendResponse.status(400).json({'error': 'Incorrect File Resolution'})
        })
    }

    else{
        var res = ['hd','sd','low','thumbnail'];
        var imgCount=0;
        res.forEach( async (resType) => {
        var width = resolution[currentImageType][resType].width;
        var height = resolution[currentImageType][resType].height;
        var fileCount = res.indexOf(resType)+1;
        var resize = new Promise((res,rej) => {
          im.resize({
          srcPath: `/tmp/${image}`,
          dstPath: `/tmp/${imageSplit[0]}-${fileCount}.${imageSplit[1]}`,
          width: width,
          height: height
        }, function(err){
          if(err) {
            rej(err);
          }
          else {
            console.log('Image resized');
            res("Done");}
          })
        });
            await resize;
            await addObject(`${imageSplit[0]}-${fileCount}`, imageSplit[1], width, height, imgCount).then( () => {
                imgCount++;
                console.log(imgCount);
                fs.unlink(`/tmp/${imageSplit[0]}-${fileCount}.${imageSplit[1]}`, () => {
                        console.log(`${imageSplit[0]}-${fileCount} file deleted successfully!`);
                        if(imgCount==4){
                            fs.unlink(`/tmp/${image}`, () => {
                                console.log("Original File deleted successfully!");
                                sendResponse.status(200).json({'success': true});
                            })
                        }  
                    }) 
                }).catch( (err) => {
                sendResponse.status(400).json({'error': `${err.message}`})
            })
      });
    }
}

function info(fileName, res){
    im.identify(`/tmp/${fileName}`, function (err, info) {
        if(err) console.log(err);
        resizeImage(info.width,info.height,fileName,res);
    })
};

exports.uploadImage= catchAsync(async(req, res, next)=>{
    if (!req.file) {
        console.log("No file received");
        res.status(400).json({'error': 'No file Received'});
    
      } 
    else {
        try{
          console.log('file received');
          info(req.file.originalname, res);
        }
        catch(err){
          res.status(400).json({'error': err.message});
        }
    }

})

//delete images

exports.deleteImage = catchAsync(async(req, res, next)=>{
  const value = req.params.fileName;

  const params = {
      Bucket: process.env.BUCKET_NAME, 
      Delete: {
          Objects: [
              { Key: `${value}-1` },
              { Key: `${value}-2` },
              { Key: `${value}-3` },
              { Key: `${value}-4` }
          ], 
          Quiet: false
      }
  };
    
  await s3.deleteObjects(params, (err, data)=> {
      if (err) {
          console.log(err)
          res.status(404).json({'error': err.message})
      } 
      else{
          res.status(200).json({'success': true})
      }
  });
   
});