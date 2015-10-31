var fs     = require('fs');
var spawn  = require('child_process').spawn;
var join   = require('path').join;
var http   = require('http');
var shell  = require('shelljs');
var _      = require('lodash');

module.exports = function($, logger) {
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
  
  if(!fs.existsSync(this.app_node_path)){
    this.log.info('acquiring nodejs');
    shell.cp(this.$.env.meteor.node, this.$.env.app.bin);
  } else
    this.log.info('nodejs already acquired, moving on');

  done();
};

NodeJS.prototype.start = function(done) {

  // in development mode, when app is not inside elctron, mongodb is just not
  // needed, since meteor itself is already running its own mongodb
  if(!this.$.env.app.is_packaged) {
    this.log.info('app not packaged, skipping start');
    return setTimeout(done, 1);
  }

  this.log.info('starting meteor...');

  this.meteor_main = join(this.$.env.app.root, 'app', 'main.js');

  var self = this;

  this.$.freeport(null, function(meteor_port){
    self.meteor_port = meteor_port;

    // mimics the process' env data and sets meteor vars on it
    self.config = _.extend({
      PORT               : self.meteor_port,
      ROOT_URL           : 'http://localhost:' + self.meteor_port,
      METEOR_SETTINGS    : JSON.stringify(self.$.env.app.settings)
    }, process.env);

    _.extend(self.config, self.$.plugins.env());

    self.process = spawn(self.app_node_path, [self.meteor_main], {
      env: self.config
      // , stdio: 'inherit'
      // when setting stdio to 'inherit', the node/meteor process CANNOT be
      // spawned and also, no error is shown. it was discovered with try'n'error
      // so now we just listen for stdout and stderr instead, and things appear
      // to be working again
    });

    // mimics inherit without prefixing
    self.process.stdout.pipe(process.stdout);
    self.process.stderr.pipe(process.stderr);

    self.log.debug('waiting for meteor ready');

    self.meteor_ready(self.config.ROOT_URL, done);
  });
};

NodeJS.prototype.meteor_ready = function(url, done) {
  var self = this;
  var fired = false;

  http.get(url, function(/* res */) {
    if(!fired) {
      fired = true;
      done();
    }
  }).on('error', function(/* err */) {
    if(fired) return;
    setTimeout(function(){
      self.meteor_ready(url, done);
    }, 30);
  });
};

NodeJS.prototype.stop = function() {
  if(this.process)
    this.$._kill(this.process);
};