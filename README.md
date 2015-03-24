Mailer Webservice
=================

A Microservice that sends email from `application/json` and `x-www-form-urlencoded` POST.

Powered by:

 - [Node.JS](https://nodejs.org/) and [ExpressJS](http://expressjs.com/) for serving.
 - [nodemailer](http://www.nodemailer.com/) for email sending.
 - [consolidate](https://github.com/tj/consolidate.js) for templating.

It supports [reCaptcha](https://www.google.com/recaptcha) natively.

Install
-------

```
npm install -g mailer-webservice
```

Configure
---------

Create `mailer-webservice.json` configuration file. An example is available in `example` directory.

Run
---

```
mailer-webservice
```

Send from HTML Form
-------------------

*To Be Done*