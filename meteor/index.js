Electrify = {};

var callbacks = {};
var socket;
var where;

Meteor.startup(function(){

  if(Meteor.isServer) {
    where = 'server';
    SockJS = Npm.require('sockjs-client');
    Meteor.methods({
      'electrify.get.socket.port': function(){
        return process.env.SOCKET_PORT || null;
      }
    });

    connect(process.env.SOCKET_PORT);
  }

  if(Meteor.isClient) {
    where = 'client';
    SockJS = SockJS || window.SockJS;
    Meteor.call('electrify.get.socket.port', [], function(error, port){
      connect(port);
    });
  }

});

function log(){
  var args = Array.prototype.slice.call(arguments);
  console.log('electrify:meteor:index@'+ where +':', args.join(' '));
}

function connect(port){

  if(!port) {
    log([
      'cannot initialize connection. Did you `npm install -g electrify`?',
      'install it and try running your meteor app with `electrify` npm command'
    ].join('\n'));
    return;
  }

  socket = new SockJS('http://127.0.0.1:' + port + '/electrify');

  socket.onopen = function() {
    log('connection is open');
    _.each(startup_callbacks, function(ready) {
      ready();
    });
    startup_callbacks = [];
  };

  socket.onmessage = function(e) {
    var packet = JSON.parse(e.data);
    var done;

    if((done = callbacks[packet.handshake])) {
      callbacks[packet.handshake] = null;
      delete callbacks[packet.handshake];
      done.apply(null, [].concat(packet.error, packet.args));
    }
    else
      done.apply(null, [
        'No callback defined for handshake `'+ packet.handshake +'`'
      ]);
  };

  socket.onclose = function() {
    log('closing connection', JSON.stringify(_.toArray(arguments), null, 2));
  };
}

var startup_callbacks = [];
Electrify.startup = function(ready){
  startup_callbacks.push(ready);
};


Electrify.call = function(method, args, done) {

  if(!(done instanceof Function))
    throw new Error('Third argument to `Electrify.call()` must be a funciton');

  if(!socket) {
    var msg = 'Cannot call methods, socket connection not initialized';
    console.warn(msg);
    setTimeout(function(){ done(new Error(msg)); }, 1);
    return;
  }

  var packet = {
    handshake: Random.id(),
    method: method,
    args: args
  };

  callbacks[packet.handshake] = done;
  socket.send(JSON.stringify(packet));
};
