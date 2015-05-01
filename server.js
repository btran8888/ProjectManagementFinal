var express = require('express');
var path = require('path');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var dbConfig = require('./db');
var mongoose = require('mongoose');
// Connect to DB

console.log( 'connecting to mongo url: ' + dbConfig.url);
mongoose.connect(dbConfig.url);

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Configuring Passport
var passport = require('passport');
var expressSession = require('express-session');
// TODO - Why Do we need this key ?
app.use(expressSession({secret: 'mySecretKey'}));
app.use(passport.initialize());
app.use(passport.session());

 // Using the flash middleware provided by connect-flash to store messages in session
 // and displaying in templates
var flash = require('connect-flash');
app.use(flash());

// Initialize Passport
var initPassport = require('./passport/init');
initPassport(passport);


// for jade newlines
app.locals.pretty = true;
var routes = require('./routes/index')(passport);
app.use('/', routes);

/// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}


module.exports = app;


app.set('port', process.env.OPENSHIFT_NODEJS_PORT ||	 process.env.PORT || 3000);
app.set('ipaddr', process.env.OPENSHIFT_NODEJS_IP || "127.0.0.1");

console.log( "going to start app on port " + app.get('port') + "  and ip address " + app.get('ipaddr'));
console.log( "OPENSHIFT_NODEJS_PORT: " + process.env.OPENSHIFT_NODEJS_PORT );
app.listen( app.get( 'port'), app.get('ipaddr'), function() {
  console.log ( 'Express started on localhost: ' + app.get('port')) ;
});