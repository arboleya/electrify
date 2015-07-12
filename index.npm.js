/*******************************************************************************
  REQUIREMENTS
*******************************************************************************/

require('shelljs/global');

var fs    = require('fs');
var net   = require('net');
var path  = require('path');
var spawn = require('child_process').spawn;
var http  = require('http');


/*******************************************************************************
  VARIABLES
*******************************************************************************/

// PRODUCTION variable is evaluated according the folder in which this file is:
// 
//     OSX: [...] /Resources/app
//   LINUX: [...] resources/default_app
//     WIN: [...] \resources\app


// general
var APP         = path.dirname(module.parent.filename);
var PRODUCTION  = /(\/|\\)(default_)?app$/m.test(APP);
var IS_WIN      = process.platform == 'win32';

// mongo variables
var MONGO;
var MONGO_URL;
var MONGO_PORT;

var MONGOD        = path.join(APP, 'bin', 'mongod' + (IS_WIN ? '.exe' : ''));
var MONGO_LOCK    = path.join(APP, 'db', 'mongod.lock');
var MONGO_STORAGE = path.join(APP, 'db');

// node bin
var NODE = path.join(APP, 'bin', 'node' + (IS_WIN ? '.exe' : ''));

// meteor variables
var METEOR;
var METEOR_PORT;
var METEOR_FULL_URL;

var METEOR_MAIN     = path.join(APP, 'app', 'main.js');
var METEOR_ROOT_URL = 'http://localhost';


// initializes async variables
function define_variables(done){
  // finds free port
  freeport(11235, function(mongo_port){

    // defines mongo variables
    MONGO_PORT    = mongo_port;
    MONGO_URL     = 'mongodb://localhost:'+ MONGO_PORT +'/meteor';

    // finds free port
    freeport(mongo_port + 1, function(meteor_port){

      // defines meteor variables
      METEOR_PORT     = meteor_port;
      METEOR_FULL_URL = METEOR_ROOT_URL + ':' + METEOR_PORT;
      done();
    });
  });
}


/*******************************************************************************
  MONGO
*******************************************************************************/

// spawns mongod

function spawns_mongo(done){
  log('starting mongo');

  if(IS_WIN && fs.existsSync(MONGO_LOCK)){
    log('removing before continue...')
    rm(MONGO_LOCK);
  }

  MONGO = spawn(MONGOD, [
    '--dbpath'    , MONGO_STORAGE,
    '--port'      , MONGO_PORT,
    '--bind_ip'   , '127.0.0.1',
    '--smallfiles'
  ]);

  MONGO.stdout.on('data', function(data){
    log('[mongo::log]', data.toString());
    if(/waiting for connections/.test(data.toString())){
      MONGO.stdout.removeAllListeners('data');
      log('mongo started')
      done();
    }
  });
}


/*******************************************************************************
  METEOR
*******************************************************************************/

// spawns meteor

function spawns_meteor(){

  // mimics the process' env data and sets mongo vars on it
  var env       = Object.create(process.env);
  env.MONGO_URL = MONGO_URL;
  env.PORT      = METEOR_PORT;
  env.ROOT_URL  = METEOR_ROOT_URL;
  
  log('starting meteor', env);
  METEOR = spawn(NODE, [METEOR_MAIN], {env: env});
  METEOR.stdout.on('data', function(data){
    log('[meteor::log]', data.toString());
  });
}

// check when meteor finished starting up
function meteor_ready(done){
  http.get(METEOR_FULL_URL, function (res) {
    log('meteor ready');
    done();
  }).on('error', function(e) {
    new setTimeout(function(){
      meteor_ready(done);
    }, 30);
  });
}


/*******************************************************************************
  APP INDEX
*******************************************************************************/

// this tells the meteor plugin to SKIP initialization, otherwise we'd end up
// with two electron windows. For more info, check the `index.meteor.js`
// initialization section, where this variable is used.
process.env.ELECTRON_PRODUCTION = true;

exports.boot = function(done) {

  if(!PRODUCTION) {
    // TODO: remove hardcoded url - how to get full url for runningm meteor?
    exports.meteor_url = 'http://localhost:3000';
    return done();
  }

  // define variables
  define_variables(function(){

    // creates mongo storage dir
    mkdir('-p', MONGO_STORAGE);

    // spawn mongo
    spawns_mongo(function(){

      // spawn mongo
      spawns_meteor();

      // waits for meteor
      meteor_ready(function(){
        exports.meteor_url = METEOR_FULL_URL;
        done();
      });
    });
  });
};

var prevented = false;
exports.shutdown = function(app, event){
  // figure out a way to also kill mongo, in a cross-platform fashion and
  // maybe kill meteor and mongo altogether on exit?
  // 
  // if(!PRODUCTION){
  //   exec('kill ' + process.env.METEOR_PARENT_PID);
  //   exec('kill ' + process.env.MONGO_PID???);
  // }

  // kill meteor
  if(METEOR)
    METEOR.kill();

  // kill mongo
  if(MONGO) {
    MONGO.kill();

    // on windows there's no way to gracefully shutdown mongod, so we need to
    // make sure mongod.lock file is removed before exiting application
    if(IS_WIN){

      // avoid app exiting only once
      if(prevented)
        return;
      else
        prevented = true;

      event.preventDefault();

      // remove the damn .lock file, then quit
      function del(){
        try {
          fs.unlinkSync(MONGO_LOCK);
        } catch(err){
          return new setTimeout(del, 10);
        }
        app.quit();
      }
      del();
    }
  }
};

/*******************************************************************************
  PORT EVALUATION
*******************************************************************************/

function freeport(start, done) {
  var server = net.createServer();
  server.listen(start, function(err) {
    server.once('close', function() {
      done(start);
    });
    server.close();
  });
  server.on('error', function (err) {
    freeport(start++, done);
  });
}

/*******************************************************************************
  DEBUG
*******************************************************************************/

function log(){
  var args = Array.prototype.slice.call(arguments);
  console.log.apply(null, ['elecrify: '].concat(args));
}