var fs     = require('fs');
var join   = require('path').join;
var spawn  = require('child_process').spawn;
var shell  = require('shelljs');

module.exports = function($, logger){
  return new MongoDB($, logger);
};

function MongoDB($, logger) {
  this.$   = $;

  this.name = 'mongodb';
  this.app_mongo_path   = join(this.$.env.app.bin, 'mongo');
  this.app_mongod_path  = this.app_mongo_path + 'd';

  // the env object properties is sent to meteor during initialization,
  // through process.env
  this.env = {};

  this.log = logger($, 'electrify:plugins:' + this.name);

  if(this.$.env.sys.is_windows){
    this.app_mongo_path  += '.exe';
    this.app_mongod_path += '.exe';
  }
}

MongoDB.prototype.acquire = function(done){

  if(!fs.existsSync(this.app_mongo_path)) {
    this.log.info('acquiring mongo');
    shell.cp(this.$.env.meteor.mongo, this.$.env.app.bin);
  } else
    this.log.info('mongo already acquired, moving on');

  if(!fs.existsSync(this.app_mongod_path)) {
    this.log.info('acquiring mongod');
    shell.cp(this.$.env.meteor.mongod, this.$.env.app.bin);
  } else
    this.log.info('mongod already acquired, moving on');

  done();
};

MongoDB.prototype.start = function(done) {

  // in development mode, when app is not inside elctron, mongodb is just not
  // needed, since meteor itself is already running its own mongodb
  if(!this.$.env.app.is_packaged) {
    this.log.info('app not packaged, skipping start');
    return setTimeout(done, 1);
  }

  this.log.info('starting mongo...');


  var self = this;

  this.$.freeport(null, function(port){

    self.dbdir        = join(self.$.env.app.root, 'db');
    // ----------------------------------------------
    // Run mongoDb files in user data path
    // When you download a new version of the application , the data is not lost
    self.pkgObj    = require(join(self.$.env.app.root, 'package.json')) || {};
    if (self.pkgObj.dbInUserDataPath && self.pkgObj.name){
      if(self.$.env.sys.is_windows)
        self.dbdir = join(process.env.APPDATA,self.pkgObj.name,'db');
      if(self.$.env.sys.is_osx)
        self.dbdir = join(process.env.HOME,'Library','Preference',self.pkgObj.name,'db');
      if(self.$.env.sys.is_linux)
        self.dbdir = join(process.env.HOME,'var','local',self.pkgObj.name,'db');
    }
    // ----------------------------------------------
    self.lockfile     = join(self.dbdir, 'mongod.lock');
    self.port         = port;

    shell.mkdir('-p', self.dbdir);

    // force removes the mongod.lock file - even it may look foolish, it's the
    // only way since mongod never shutdown under windows
    shell.rm('-f', self.lockfile);

    self.process = spawn(self.app_mongod_path, [
      '--dbpath'    , self.dbdir,
      '--port'      , self.port,
      '--bind_ip'   , '127.0.0.1',
      '--smallfiles'
    ]);

    var started = false;
    self.process.stdout.on('data', function(data){
      // mimics inherit
      console.log(data.toString());

      if(!started && /waiting for connections/.test(data.toString())){
        self.log.info('mongo started');
        self.env.MONGO_URL = 'mongodb://localhost:'+ self.port +'/meteor';
        started = true;
        done();
      }
    });

    self.process.stderr.pipe(process.stderr);
  });
};

MongoDB.prototype.stop = function(){
  if(this.process)
    this.$._kill(this.process);
};
