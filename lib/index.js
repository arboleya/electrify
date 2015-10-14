var net = require('net');

module.exports = function(input, output, settings){
  return new Electrify(input, output, settings);
};

function Electrify(input, output, settings) {
  this.log      = require('./log')(this, 'electrify:index');

  this.log.info('initializing');

  if(!input)
    throw new Error('Root param must to be informed!');

  this.env      = require('./env')(input, output, settings);

  this.scaffold = require('./scaffold')(this);
  this.electron = require('./electron')(this);
  this.app      = require('./app')(this);
  this.plugins  = require('./plugins')(this);

  this.use(require('./plugins/mongodb'));
  this.use(require('./plugins/nodejs'));
}

Electrify.prototype.use = function(plugin){
  this.plugins.use(plugin(this, require('./log')));
};

Electrify.prototype.start = function(done){
  this.log.info('start');
  var self = this;
  this.plugins.start(function(){
    done(self.plugins.get('nodejs').config.ROOT_URL);
  });
};

Electrify.prototype.stop = function(){
  this.log.info('stop');
  this.plugins.stop();
};

Electrify.prototype.waterfal = function(methods) {
  var self = this, method = methods.shift();
  method[0].apply(method[1], [function(){
    if(methods.length)
      self.waterfal(methods);
  }]);
};

Electrify.prototype.freeport = function(start, done){
  var self = this;
  start = start || 11235;
  var socket = new net.Socket()
    .once('connect', function() {
      socket.destroy();
      self.freeport(++start, done);
    })
    .once('error', function(/* err */) {
      socket.destroy();
      done(start);
    })
    .connect(start, '127.0.0.1');
};