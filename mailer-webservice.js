'use string';

var fs = require('fs');
var config = JSON.parse(fs.readFileSync('./mailer-webservice.json', 'utf8'));

var express = require('express');
var app = express();

var bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

if (config.cors === undefined || config.cors) {
  var cors = require('cors');
  if (typeof config.cors === 'object') {
    app.use(cors(config.cors));
  } else {
    app.use(cors());
  }
}

var request = require('request');

var extend = require('extend');

var consolidate = require('consolidate');

var nodemailer = require('nodemailer');
var mailerTransporter = nodemailer.createTransport(config.mail.transport);

var isProduction = process.env.NODE_ENV === 'production';

function sendMail(context, cb) {
  var options = {};
  extend(options, config.mail.options);

  context.cache = isProduction;

  for (var k in options) {
    if (options.hasOwnProperty(k)) {
      var option = options[k];
      if (option && typeof option === 'object' && option.engine) {
        var consolidateCb = function (err, output) {
          if (!err) {
            options[k] = output;
          } else {
            options[k] = "An error has occured in template. " + err;
            console.log(err);
          }
        };

        var str;
        if (option.path) {
          str = fs.readFileSync(option.path, 'utf8')
        } else if (option.str) {
          str = option.str;
        }
        consolidate[option.engine].render(str, context, consolidateCb);

      }
    }
  }

  mailerTransporter.sendMail(options, cb);
}

app.post(config.url, function (req, res) {
  res.set('Content-Type', 'application/json');

  console.log("Mail request received.");

  console.log("Checking captcha.");
  request.post(
    {
      url: 'https://www.google.com/recaptcha/api/siteverify',
      formData: {
        secret: config.recaptcha.secret,
        response: req.body['g-recaptcha-response'],
        remoteip: req.ip
      }
    },
    function (err, httpResponse, body) {
      var responseData = {}
      responseData.reCaptcha = {status: httpResponse.statusCode, body: JSON.parse(body)};
      responseData.mail = {sent: false};

      if (!err && httpResponse.statusCode == 200 && responseData.reCaptcha.body.success) {
        console.log("Captcha is valid.");
        sendMail(req.body, function (mailErr, mailInfo) {
          responseData.mail.error = mailErr;
          responseData.mail.info = mailInfo;
          if (!mailErr) {
            console.log("Mail has been sent.");
            responseData.mail.sent = true;
            res.status(200);
          } else {
            console.log("Mail has NOT been sent. " + mailErr);
            res.status(500);
          }
          res.send(responseData);
        });
      } else {
        console.log("Invalid captcha. " + (err ? err : "") + " " + JSON.toString(responseData.reCaptcha));
        res.status(401);
        res.send(responseData);
      }
    }
  );
});

var server = app.listen(config.port, config.address, function () {
  var host = server.address().address;
  var port = server.address().port;

  console.log('mailer-webservice listening at http://%s:%s%s', host, port, config.url)
});