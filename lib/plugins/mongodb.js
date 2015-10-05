var fs     = require('fs');
var join   = require('path').join;
var spawn  = require('child_process').spawn;
var shell  = require('shelljs');

module.exports = function($){
  return new MongoDB($);
};

function MongoDB($) {
  this.$ = $;
  this.name = 'mongodb';
  this.app_mongo_path   = join(this.$.env.app.bin, 'mongo');
  this.app_mongod_path  = this.app_mongo_path + 'd';

  if(this.$.env.sys.is_windows){
    this.app_mongo_path  += '.exe';
    this.app_mongod_path += '.exe';
  }

  this.log = require('../log')($, 'electrify:mongodb');
}

MongoDB.prototype.acquire = function(done){
  this.log.info('acquiring mongo');

  if(!fs.existsSync(this.app_mongo_path))
    shell.cp(this.$.env.meteor.mongo, this.$.env.app.bin);
  
  if(!fs.existsSync(this.app_mongod_path))
    shell.cp(this.$.env.meteor.mongod, this.$.env.app.bin);

  done();
};

MongoDB.prototype.start = function(done) {

  // do nothing in development mode (not inside electron)
  if(!this.$.env.app.is_packaged) return done(null); // <-- never called anynore

  this.log.info('starting mongo...');

  this.del_lockfile();

  var self = this;
  
  this.$.freeport(null, function(port){

    self.dbdir    = join(self.$.env.app.electrify, 'db');
    self.lockfile = join(self.dbdir, 'mongod.lock');
    self.port     = port;

    shell.mkdir('-p', self.dbdir);

    self.process = spawn(self.app_mongod_path, [
      '--dbpath'    , self.dbdir,
      '--port'      , self.port,
      '--bind_ip'   , '127.0.0.1',
      '--smallfiles'
    ]);

    self.process.stdout.on('data', function(data){
      // mimics inherit
      console.log(data.toString());
      if(/waiting for connections/.test(data.toString())){
        self.process.stdout.removeAllListeners('data');
        self.log.info('mongo started');
        done(port);
      }
    });

    self.process.stderr.pipe(process.stderr);
  });
};

MongoDB.prototype.stop = function(){
  this.del_lockfile();
  if(this.process)
    this.process.kill();
};

MongoDB.prototype.del_lockfile = function(){
  // force removes the mongod.lock file - even it may look foolish, it's the
  // only way since mongod never shutdown under windows
  shell.rm('-f', this.lockfile);
};