var join     = require('path').join;
var shell    = require('shelljs');
var packager = require('electron-packager');

module.exports = function($){
  return new Electron($);
};

function Electron($){
  this.$ = $;
  this.log = require('./log')($, 'electrify:electron');
}

Electron.prototype.package = function(done) {

  // fetches electron version from core temp folder
  var version = require(join(
    this.$.env.core.node_mods,
    'electron-prebuilt',
    'package.json'
  )).version;

  // app name require('.electrify/package.json').name
  var name = require(join(this.$.env.app.root, 'package.json')).name;

  this.log.info(
    'packaging "'+ name +'" for platform '+ this.$.env.sys.platform + '-' +
     this.$.env.sys.arch + ' using electron v' + version
  );

  // temp dir for packaging the app
  var tmp_package_dir = join(this.$.env.core.tmp, 'package');

  shell.rm('-rf', tmp_package_dir);
  shell.mkdir('-p', tmp_package_dir);

  var args = {
    out: tmp_package_dir,
    arch: this.$.env.sys.arch,
    platform: this.$.env.sys.platform,
    version: version
  };

  var self = this;

  packager(args, function(err /*, appdir */) {
    if(err) throw err;

     // moving pakcaged app to .dist folder
    shell.rm('-rf', self.$.env.app.dist);

    shell.mv(tmp_package_dir, self.$.env.app.dist);

    self.log.info('wrote new app to ', self.$.env.app.dist);
    
    done();
  });
};