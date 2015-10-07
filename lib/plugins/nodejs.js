var fs     = require('fs');
var spawn  = require('child_process').spawn;
var join   = require('path').join;
var http   = require('http');
var shell  = require('shelljs');
var      _ = require('lodash');

module.exports = function($, logger){
  return new NodeJS($, logger);
};

function NodeJS($, logger){
  this.$ = $;
  this.log = require('../log')($, 'electrify:plugins:nodejs');
  this.name = 'nodejs';
  this.app_node_path = join(this.$.env.app.bin, 'node');

  if(this.$.env.sys.is_windows)
    this.app_node_path += '.exe';

  this.config = {
    ROOT_URL: 'http://localhost:3000' // find meteor's port in run time?
  };

  this.log = logger(this.$, 'electrify:plugins:' + this.name);
}

NodeJS.prototype.acquire = function(done){
  this.log.info('acquiring nodejs');
  
  if(!fs.existsSync(this.app_node_path))
    shell.cp(this.$.env.meteor.node, this.$.env.app.bin);

  done();
};

NodeJS.prototype.start = function(done) {

  // in development mode, when app is not inside elctron, mongodb is just not
  // needed, since meteor itself is already running its own mongodb
  if(!this.$.env.app.is_packaged) {
    this.log.info('app in development mode, skipping start');
    return setTimeout(done, 1);
  }

  this.log.info('starting meteor...');

  this.mongo_port  = this.$.plugins.get('mongodb').port;
  this.meteor_main = join(this.$.env.app.electrify, 'app', 'main.js');

  var self = this;

  this.$.freeport(null, function(meteor_port){
    self.meteor_port = meteor_port;

    // mimics the process' env data and sets meteor vars on it
    self.config = _.extend({
      MONGO_URL       : 'mongodb://localhost:'+ self.mongo_port +'/meteor',
      PORT            : self.meteor_port,
      ROOT_URL        : 'http://localhost:' + self.meteor_port,
      METEOR_SETTINGS : JSON.stringify(self.$.env.app.settings)
    }, process.env);

    self.process = spawn(self.app_node_path, [self.meteor_main], {
      env: self.config
      // , stdio: 'inherit'
      // when setting stdio to 'inherit', the node/meteor process CANNOT be
      // spawned and also, no error is shown. it was discovered with try'n'error
      // so now we just listen for stdout and stderr instead, and things appear
      // to be working again
    });

    // mimics inherit without prefixing
    self.process.stdout.pipe(process.stderr);
    self.process.stderr.pipe(process.stderr);

    self.log.debug('waiting for meteor ready');

    function meteor_ready(url){
      http.get(url, function(/* res */) {
        self.log.info('meteor ready');
        done();
      }).on('error', function(/* err */) {
        new setTimeout(function(){
          meteor_ready(url);
        }, 30);
      });
    }

    meteor_ready(self.config.ROOT_URL);
  });
};

NodeJS.prototype.stop = function() {
  if(this.process)
    this.process.kill();
};