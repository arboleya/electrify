var fs    = require('fs');
var join  = require('path').join;
var spawn = require('child_process').spawn;
var shell = require('shelljs');
var _     = require('lodash');

module.exports = function($){
  return new Electron($);
};

function Electron($){
  this.$ = $;
  this.log = require('./log')($, 'electrify:electron');
}

Electron.prototype.ensure_deps = function(done){

  this.log.info('ensuring electron dependencies');

  var node_mods = this.$.env.core.node_mods;

  var electron_dir  = join(node_mods, 'electron-prebuilt');
  var packager_dir  = join(node_mods, 'electron-packager');
  
  var electron_path = join(electron_dir, 'path.txt');
  var packager_bin  = join(node_mods, '.bin', 'electron-packager');

  var is_broken_msg = 'installation is missing or corrupted, fixing it';
  var is_ok_msg     = 'installation seems ok, moving on';

  if(!fs.existsSync(electron_path)){
    this.log.warn('electron-prebuilt '+ is_broken_msg);
    shell.rm('-rf', electron_dir);
  } else
    this.log.info('electron-prebuilt '+ is_ok_msg);

  if(!fs.existsSync(packager_bin)){
    this.log.warn('electron-packager '+ is_broken_msg);
    shell.rm('-rf', packager_dir);
  } else
    this.log.info('electron-packager '+ is_ok_msg);

  spawn(this.$.env.meteor.node, [this.$.env.meteor.npm, 'install'], {
    cwd: this.$.env.core.root,
    stdio: this.$.env.stdio
  }).on('exit', done);
};

Electron.prototype.launch = function(done) {
  this.log.info('launching electron');
  this.electron_process = spawn(this.$.env.meteor.node, [
    this.$.env.core.electron,
    this.$.env.app.electrify
  ], {
    cwd: this.$.env.app.electrify,
    stdio: this.$.env.stdio,
    env: _.extend({}, process.env)
  });
  done();
};

Electron.prototype.terminate = function() {
  if(this.electron_process) {
    this.log.info('terminating electron');
    this.electron_process.kill();
  }
};

Electron.prototype.package = function(done) {

  // fetches electron version from core temp folder
  var version = require(join(
    this.$.env.core.node_mods,
    'electron-prebuilt',
    'package.json'
  )).version;

  // app name require('.electrify/package.json').name
  var name = require(join(this.$.env.app.electrify, 'package.json')).name;

  this.log.info(
    'packaging "'+ name +'" for platform '+ this.$.env.sys.platform + '-' +
     this.$.env.sys.arch + ' using electron v' + version
  );

  // temp dir for packaging the app
  var tmp_package_dir = join(this.$.env.core.tmp, 'package');

  shell.rm('-rf', tmp_package_dir);
  shell.mkdir('-p', tmp_package_dir);

  // packaging app
  var self = this;

  spawn(this.$.env.meteor.node, [
    this.$.env.core.packager,
    this.$.env.app.electrify,
    name,
    '--out=' + tmp_package_dir,
    '--arch=' + this.$.env.sys.arch,
    '--platform=' + this.$.env.sys.platform,
    '--version='+ version
  ], {
    cwd: this.$.env.app.electrify,
    stdio: this.$.env.stdio
  }).on('exit', function(){

    // moving pakcaged app to .dist folder
    shell.rm('-rf', self.$.env.app.dist);

    shell.mv(tmp_package_dir, self.$.env.app.dist);

    self.log.info('wrote new app to ', self.$.env.app.dist);
    
    done();
  });
};