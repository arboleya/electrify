var _ = require('lodash');

module.exports = function($){
  return new Plugins($);
};

function Plugins($){
  this.$ = $;
  this.log = require('./log')($, 'electrify:plugins');
  this._all = [];
}

Plugins.prototype.use = function(plugin){
  plugin = plugin(this.$, require('./log'));
  this.log.info('use ', plugin.name);
  this._all.push(plugin);
};

Plugins.prototype.get = function(name){
  return _.find(this._all, function(plugin){
    return plugin.name == name;
  });
};

Plugins.prototype.acquire = function(done) {
  this.log.info('acquire');
  done = _.after(this._all.length, done);
  _.each(this._all, function(plugin){
    plugin.acquire(done);
  });
};

Plugins.prototype.start = function(done){
  this.log.info('start');

  var pending = this._all.slice(0);
  function start_all(){
      if(!pending.length) return done();
      pending.shift().start(start_all);
  }
  start_all();
};

Plugins.prototype.stop = function(){
  this.log.info('stop');
  _.each(this._all, function(plugin){
    plugin.stop();
  });
};


Plugins.prototype.env = function() {
  var config = {};

  _.each(this._all, function(plugin){
    _.extend(config, plugin.env || {});
  });

  return config;
};