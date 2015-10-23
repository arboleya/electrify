var http = require('http');

var _      = require('lodash');
var sockjs = require('sockjs');

var methods = {};

module.exports = function($, logger){
  return new Socket($, logger);
};

function Socket($, logger){
  this.$ = $;
  this.log = require('../log')($, 'electrify:plugins:socket');
  
  this.name = 'socket';
  this.log  = logger(this.$, 'electrify:plugins:' + this.name);

  this.echo = sockjs.createServer({
    sockjs_url: 'http://cdn.jsdelivr.net/sockjs/1.0.1/sockjs.min.js'
  });

  var self = this;
  this.echo.on('connection', function(conn) {
    conn.on('data', function(message) {

      var packet = JSON.parse(message);

      var method_name = packet.method;
      var handshake   = packet.handshake;
      var method      = methods[method_name];

      var args, err;

      if(method) {

        self.log.info('calling method `'+ method_name +'`');

        args = packet.args.concat(function(err /* , arg1, arg2, ..., argN */ ){
          self.log.info('answering method `'+ method_name +'`');
          args = Array.prototype.slice.call(arguments, 1);
          self.answer(conn, handshake, args, err);
        });

        method.apply(null, args);
      }
      else {
        self.log.info('answering method `'+ method_name +'` with error');
        err = {message: 'method `'+ method_name +'` was not defined'};
        self.answer(conn, handshake, [], err);
      }
    });

    // conn.on('close', function() {
    //   self.log.info('closing connection..', _.toArray(arguments));
    // });
  });

  this.env = {};
}

Socket.prototype.answer = function(conn, handshake, args, err){
  conn.write(JSON.stringify({
    handshake: handshake,
    error: 'undefined' == typeof err ? null : err,
    args: args
  }));
};

Socket.prototype.acquire = function(done){
  // no binary to acquire, sockjs is a npm dependency
  this.log.info('nothing to acquiring, skipping');
  setTimeout(done, 1);
};

Socket.prototype.methods = function(methods_table){
  _.merge(methods, methods_table);
};

Socket.prototype.start = function(done) {

  this.log.info('starting socket');

  var self = this;

  this.$.freeport(null, function(port) {
    self.env.SOCKET_PORT = port;
    self.server = http.createServer();
    self.echo.installHandlers(self.server, {prefix:'/electrify'});
    self.server.listen(port);
    self.$.log.info('socket listening at', port);
    done();
  });
};

Socket.prototype.stop = function() {
  if(this.server)
    this.server.close();
};
