var fs   = require('fs');
var path = require('path');
var _    = require('lodash');

module.exports = function($){
  return new Plugins($);
};

function Plugins($){
  this.$ = $;
  this.log = require('./log')($, 'electrify:plugins');
  this._all = [];

  this._isup = false;
  this._isbotting = false;
}

Plugins.prototype.auto_load = function(done){
  

  var node_mods   = path.join(this.$.env.app.electrify, 'node_modules');
  var config_path = path.join(this.$.env.app.electrify, 'electrify.json');
  var config      = require(config_path);

  var plugin_path, self = this;

  this.log.info('load configured plugins', config.plugins);

  _.each(config.plugins, function(plugin_name){

    plugin_path = path.join(node_mods, plugin_name);

    if(fs.existsSync(plugin_path))
      self.use(require(plugin_path));
    else
    {
      self.log.warn([
        'plugin \''+ plugin_name +'\' not found, is it installed?',
        '~> expected location: "'+ plugin_path,
        '~> remember to run `npm install <plugin> --save` inside .electrify dir'
      ].join('\n'));
    }
  });

  done();
};

Plugins.prototype.isup = function(){
  return this._isup;
};

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

  this._isbotting = true;

  var pending = this._all.slice(0);

  var self = this;
  function start_all(){
      if(!pending.length) {
        self._isbotting = false;
        self._isup = true;
        return done();
      }
      pending.shift().start(start_all);
  }
  start_all();
};

Plugins.prototype.stop = function(done){
  // this.log.info('stop');
  this._isup = false;
  this._isbotting = false;
  _.each(this._all, function(plugin){
    plugin.stop();
  });
  if(done) setTimeout(done, 100);
};

Plugins.prototype.env = function() {
  var config = {};

  _.each(this._all, function(plugin){
    _.extend(config, plugin.env || {});
  });

  return config;
};