var path = require('path');
var fs   = require('fs');
var os   = require('os');

module.exports = function(input, output, settings, cli) {
  return new Env(input, output, settings, cli);
};

function Env(input, output, settings, cli) {
  // shortcuts
  var join = path.join;

  // electrify version
  this.version = '2.0.0';

  // is running through cli?
  this.running_through_cli = !!cli;

  // is in development mode?
  this.is_development_mode = (process.env.DEVELECTRIFY == 'true');

  // is not running in test mode
  this.is_running_tests = (process.env.TESTELECTRIFY == 'true');

  // default stdio config for child processes
  var log_levels = process.env.LOGELECTRIFY || '';
  this.stdio = /TRACE|ALL/i.test(log_levels) ? 'inherit' : 'ignore';

  // platform and arch type
  this.sys = {};
  this.sys.platform   = process.platform;
  this.sys.arch       = process.arch;
  this.sys.is_windows = (process.platform == 'win32');
  this.sys.is_linux   = (process.platform == 'linux');
  this.sys.is_osx     = (process.platform == 'darwin');

  // operational System
  this.os = {
    name : (this.sys.platform === 'darwin' ? 'osx' : this.sys.platform),
    home : process.env[(this.sys.is_windows ? 'USERPROFILE' : 'HOME')],
    tmp  : os.tmpdir()
  };

  // app main paths
  this.app = {};
  this.app.root = path.resolve(input);
  this.app.meteor = join(this.app.root, '..');

  // .electrify folder will only exist in development mode, not after packaged
  if(/\.electrify$/m.test(this.app.root))
    this.app.is_packaged = false;
  else
    this.app.is_packaged = true;

  this.app.isnt_packaged = !this.app.is_packaged;

  this.app.bin         = join(this.app.root, 'bin');
  this.app.dist        = output || join(this.app.root, '.dist');
  this.app.config_path = join(this.app.root, 'electrify.json');

  if(this.app.is_packaged) {
    this.app.settings = require(join(this.app.root, 'app', 'settings.json'));
  }
  else if(process.env.ELECTRIFY_SETTINGS_FILE)
    this.app.settings = require(process.env.ELECTRIFY_SETTINGS_FILE);
  else
    this.app.settings = settings || {};

  // internal electron distro
  this.core = {};
  this.core.tmp       = join(this.os.tmp, 'electrify');
  this.core.root      = join(this.core.tmp, 'core');
  
  // meteor's info from system
  var meteor_dir, meteor_bat, meteor_symlink;

  this.meteor = {};

  if (this.sys.is_windows) {
    meteor_dir     = join(this.os.home, 'AppData', 'Local', '.meteor');
    meteor_bat     = join(meteor_dir, 'meteor.bat');
    meteor_symlink = fs.readFileSync(meteor_bat).toString();
    meteor_symlink = meteor_symlink.match(/\\packages.*\\meteor\.bat/)[0];
  }
  else {
    meteor_dir    = join(this.os.home, '.meteor');
    meteor_symlink = fs.readlinkSync(join(meteor_dir, 'meteor'));
  }

  this.meteor.root           = join(meteor_dir, meteor_symlink);
  this.meteor.tools          = this.meteor.root.replace(/meteor(\.bat)?$/m, '');
  this.meteor.dev_bundle     = join(this.meteor.tools, 'dev_bundle');
  this.meteor.server_lib     = join(this.meteor.dev_bundle, 'server-lib');
  this.meteor.server_modules = join(this.meteor.server_lib, 'node_modules');

  if(this.sys.is_windows)
    this.meteor.node_mods = join(this.meteor.dev_bundle, 'bin', 'node_modules');
  else
    this.meteor.node_mods = join(this.meteor.dev_bundle, 'lib', 'node_modules');

  this.meteor.node   = join(this.meteor.dev_bundle, 'bin', 'node');
  this.meteor.npm    = join(this.meteor.node_mods, 'npm', 'bin', 'npm-cli.js');
  this.meteor.mongo  = join(this.meteor.dev_bundle, 'mongodb', 'bin', 'mongo');
  this.meteor.mongod = join(this.meteor.dev_bundle, 'mongodb', 'bin', 'mongod');

  if(this.sys.is_windows) {
    this.meteor.node  += '.exe';
    this.meteor.mongo  += '.exe';
    this.meteor.mongod += '.exe';
  }
  


  if(this.stdio == 'inherit') {
    console.log('====================================');
    console.log(JSON.stringify(this, null, 2));
    console.log('====================================');
  }
}
