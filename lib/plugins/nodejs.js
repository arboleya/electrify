var fs     = require('fs');
var spawn  = require('child_process').spawn;
var join   = require('path').join;
var http   = require('http');
var shell  = require('shelljs');

module.exports = function($){
  return new NodeJS($);
};

function NodeJS($){
  this.$ = $;
  this.log = require('../log')($, 'electrify:plugins:nodejs');
  this.name = 'nodejs';
  this.app_node_path = join(this.$.env.app.bin, 'node');

  if(this.$.env.sys.is_windows)
    this.app_node_path += '.exe';

  this.config = {
    ROOT_URL: 'http://localhost:3000' // find meteor's port in run time?
  };
}

NodeJS.prototype.acquire = function(done){
  this.log.info('acquiring nodejs');
  
  if(!fs.existsSync(this.app_node_path))
    shell.cp(this.$.env.meteor.node, this.$.env.app.bin);

  done();
};

NodeJS.prototype.start = function(done) {

  // abort if app is not packaged (though meteor is up for development)
  if(!this.$.env.app.is_packaged) return done(null); //<-- never called anynore

  this.log.info('starting meteor...');

  this.mongo_port  = this.$.plugins.get('mongodb').port;
  this.meteor_main = join(this.$.env.app.electrify, 'app', 'main.js');

  var self = this;

  this.$.freeport(null, function(meteor_port){
    self.meteor_port = meteor_port;

    // mimics the process' env data and sets mongo vars on it
    self.config = Object.create(process.env);

    self.config.MONGO_URL = 'mongodb://localhost:'+ self.mongo_port +'/meteor';
    self.config.PORT      = meteor_port;
    self.config.ROOT_URL  = 'http://localhost:' + self.meteor_port;
    self.config.METEOR_SETTINGS = JSON.stringify(self.$.env.app.settings);

    self.process = spawn(self.app_node_path, [self.meteor_main], {
      env: self.config,
      stdio: 'inherit'
    });

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