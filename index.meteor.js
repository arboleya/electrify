/*******************************************************************************
  BASE REQUIREMENTS
*******************************************************************************/

var is_meteor = 'undefined' != typeof(Meteor);
var require   = (is_meteor ? Npm.require : require);

require('shelljs/global');

var fs    = require('fs');
var path  = require('path');
var os    = require('os');
var spawn = require('child_process').spawn;

var join = path.join;

/*******************************************************************************
  VARIABLES
*******************************************************************************/

// current version
VERSION = '1.1.3';

// system
_PLATFORM = process.platform;
_ARCH     = process.arch;
_OS       = (_PLATFORM === 'darwin' ? 'osx' : _PLATFORM);
_OS_HOME  = (_PLATFORM == 'win32' ? 'USERPROFILE' : 'HOME');
_TMP      = os.tmpdir();

// silent execs
_SILENT_EXECS = {silent: process.env.BUTTER !== 'true'};

// general folders
_HOME        = process.env[_OS_HOME];
_APP_ROOT    = path.resolve(is_meteor ? '../../../../..' : '.');

// elecritifed lots of folders
_ELECTRIFIED          = join(_APP_ROOT             , '.electrify');
_ELECTRIFIED_RELEASE  = join(_ELECTRIFIED          , '.dist');
_ELECTRIFIED_INDEX    = join(_ELECTRIFIED          , 'index.js');
_ELECTRIFIED_PKG      = join(_ELECTRIFIED          , 'package.json');
_ELECTRIFIED_IGNORE   = join(_ELECTRIFIED          , '.gitignore');
_ELECTRIFIED_TEMP     = join(_ELECTRIFIED          , 'temp');
_ELECTRIFIED_APP      = join(_ELECTRIFIED          , 'app');
_ELECTRIFIED_BIN      = join(_ELECTRIFIED          , 'bin');

// electrified mongo
_ELECTRIFIED_DB       = join(_ELECTRIFIED          , 'db');
_ELECTRIFIED_BUNDLE   = join(_ELECTRIFIED_TEMP     , 'bundle');
_ELECTRIFIED_SERVER   = join(_ELECTRIFIED_APP      , 'programs', 'server');

// electrified node_modules
_ELECTRIFIED_MODS     = join(_ELECTRIFIED          , 'node_modules');
_ELECTRIFIED_ELECTRON = join(_ELECTRIFIED_MODS     , 'electron-prebuilt');
_ELECTRIFIED_PACKAGER = join(_ELECTRIFIED_MODS     , 'electron-packager');

_ELECTRON_PKG_JSON    = join(_ELECTRIFIED_ELECTRON , 'package.json');

_ELECTRIFIED_MODS_B   = join(_ELECTRIFIED_MODS     , '.bin');
_ELECTRON             = join(_ELECTRIFIED_MODS_B   , 'electron');
_ELECTRON_PACKAGER    = join(_ELECTRIFIED_MODS_B   , 'electron-packager');

// meteor stuff
if(_PLATFORM === 'win32') {
  
  _METEOR_FOLDER  = path.join(_HOME, 'AppData', 'Local', '.meteor');
  _METEOR_SYMLINK = cat(path.join(_METEOR_FOLDER, 'meteor.bat'));
  _METEOR_SYMLINK = _METEOR_SYMLINK.match(/\\packages.*\\meteor\.bat/)[0];
  _METEOR_BIN     = path.join(_METEOR_FOLDER, _METEOR_SYMLINK);

} else {
  
  _METEOR_FOLDER  = path.join(_HOME, '.meteor');
  _METEOR_SYMLINK = fs.readlinkSync(path.join(_METEOR_FOLDER, 'meteor'));
  _METEOR_BIN     = path.join(_METEOR_FOLDER, _METEOR_SYMLINK);

}

// meteor folders
_METEOR_TOOLS_FOLDER    = _METEOR_BIN.replace(/meteor(\.bat)?$/m, '');
_METEOR_DEV_BUNDLE      = path.join(_METEOR_TOOLS_FOLDER, 'dev_bundle');
_METEOR_SERVER_LIB      = path.join(_METEOR_DEV_BUNDLE, 'server-lib');
_METEOR_SERVER_LIB_MODS = path.join(_METEOR_SERVER_LIB, 'node_modules');

// meteor's mongodb distro
_METEOR_MONGO  = path.join(_METEOR_DEV_BUNDLE, 'mongodb', 'bin', 'mongo');
_METEOR_MONGOD = _METEOR_MONGO + 'd';

// meteor's nodejs + npm distro
_METEOR_NODE = path.join(_METEOR_DEV_BUNDLE, 'bin', 'node');
_METEOR_NPM  = path.join(_METEOR_DEV_BUNDLE, 'bin', 'npm');

_METEOR_LOCAL_DB = path.join(_APP_ROOT, '.meteor', 'local', 'db');

if(is_meteor)
  _METEOR_SETTINGS = Meteor.settings;
else {
  _METEOR_SETTINGS = _NPM_SETTINGS;
}

// bin ref differences
if(_PLATFORM === 'win32') {
  
  _ELECTRON          += '.cmd';
  _ELECTRON_PACKAGER += '.cmd';

  _METEOR_MONGO  += '.exe';
  _METEOR_MONGOD += '.exe';

  _METEOR_NODE   += '.exe';

  _METEOR_NPM    += '.cmd';
}

// database
_METEOR_LOCAL_DB_JOURNAL = path.join(_METEOR_LOCAL_DB, 'journal');
_METEOR_LOCAL_DB_FILES   = [
  path.join(_METEOR_LOCAL_DB, 'local.ns'),
  path.join(_METEOR_LOCAL_DB, 'local.0'),
  path.join(_METEOR_LOCAL_DB, 'local.1'),
  path.join(_METEOR_LOCAL_DB, 'meteor.ns'),
  path.join(_METEOR_LOCAL_DB, 'meteor.0'),
  path.join(_METEOR_LOCAL_DB, 'meteor.1')
];

/*******************************************************************************
  INITIALIZATION
*******************************************************************************/

this.__defineGetter__('electrify', release);

if(is_meteor) {
  // in development mode this method is called everytime server is restarted due
  // to some server file change, so we need some trick to avoid opening a new
  // Electron window everytime it happens - see the ppid stuff below
  Meteor.startup(function(){

    // ELECTRON_PRODUCTION variable comes from the `index.js` file, check its
    // initialization section to get wtf is going on here - basically, since the
    // app has bem packaged, this whole method is useless, so we simply abort
    if(process.env.ELECTRON_PRODUCTION) return;
    
    // now we fetch the meteor previous and current PID in order to compare them
    var ppid_filepath = path.join(_TMP, '.electrify-ppid')
    var previous_ppid = read(ppid_filepath);
    var current_ppid  = process.env.METEOR_PARENT_PID;

    // if the current ppid differs from the last, we assume some SIGINT has
    // ocurred on the meteor-tool command line, so it's fine to launch electron
    // window again otherwise we simply assume it's a mere server restart, close
    // our eyes and relax :)
    if(previous_ppid != current_ppid) {

      // we also save the current ppid for next comparison
      write(ppid_filepath, current_ppid);

      // and start everything for development
      development();
    }
  });
}

/*******************************************************************************
  STARTUP MODES
*******************************************************************************/

if(!is_meteor) exports.release = release;

function development(){
  setup_folders();
  copy_templates();
  install_electrified_dependencies();
  launch_electron();
}

function release(){
  setup_folders();
  copy_templates();
  copy_bins();
  // copy_database();
  bundle_meteor();
  install_meteor_dependencies();
  install_electrified_dependencies();
  package_app();
}

/*******************************************************************************
  FOLDERS
*******************************************************************************/

function setup_folders(){
  if(!exists(_ELECTRIFIED)) {
    log('setting up folders');
    mkdir('-p', _ELECTRIFIED);
  }
}

/*******************************************************************************
  TEMPLATES
*******************************************************************************/

function copy_templates() {
  if(!exists(_ELECTRIFIED_INDEX))
    log('copying template files');

  if(!exists(_ELECTRIFIED_PKG))
    write(_ELECTRIFIED_PKG, TEMPLATES.pkg);
  
  if(!exists(_ELECTRIFIED_INDEX))
    write(_ELECTRIFIED_INDEX, TEMPLATES.index);

  if(!exists(_ELECTRIFIED_IGNORE))
    write(_ELECTRIFIED_IGNORE, TEMPLATES.gitignore);
}

/*******************************************************************************
  INSTALL DEPENDENCIES
*******************************************************************************/

function install_electrified_dependencies() {

  // in dev mode, link local copy of electrify module :)
  if(process.env.BUTTER === 'true') {

    var source  = path.join(_APP_ROOT, '..', 'electrify');
    var symlink =  path.join(_ELECTRIFIED_MODS, 'electrify');
    
    if(!exists(_ELECTRIFIED_MODS))
      mkdir('-p', _ELECTRIFIED_MODS);


    // when in dev mode, link electrify npm package right into node_modules
    rm('-rf', symlink);
    ln('-s', source, symlink);
  }

  // checks for a possible previous corrupted install of modules, this can
  // happen if the network fails during the `npm_install` command or other
  // similar case that precociously interupt it, preventing it from downloading
  // and building electron-prebuilt or electron-packager modules, gracefully

  // first we check if `node_modules` folder exists
  if(exists(_ELECTRIFIED_MODS)) {

    // then we check if some of the needed binaries is not present
    var binaries_missing = !exists(_ELECTRON) || !exists(_ELECTRON_PACKAGER);

    // or local npm version is out of date
    var package_json = require(_ELECTRIFIED_PKG)
    var outdated = package_json.devDependencies.electrify != VERSION;

    if(binaries_missing || outdated) {
      // in case something is missing, it means something went wrong during the
      // `npm_install` command, preventing it from finishing downloading or
      // building everything properly

      // so we remove the `node_modules` folder to erase any trace of these
      // corrupted/incomplete install process before procceding and installing
      // everything again
      rm('-rf', _ELECTRIFIED_MODS);

      // update local copy of npm electify module
      if(outdated) {
        log('upgrading local `.electrify` npm module to `v'+ VERSION +'`');
        package_json.devDependencies.electrify = VERSION;
        write(_ELECTRIFIED_PKG, JSON.stringify(package_json, null, 2));
      }
    } else {
      return;
    }
  }

  log('installing electrified dependencies');
  exec('cd ' + _ELECTRIFIED + ' && '+ _METEOR_NPM +' install', _SILENT_EXECS);
}

/*******************************************************************************
  ELECTRON LAUNCHER
*******************************************************************************/

function launch_electron() {
  log('launching electron');
  spawn(_METEOR_NODE, [_ELECTRON, _ELECTRIFIED], {stdio: 'inherit'});
}

/*******************************************************************************
  INJECTIONS
*******************************************************************************/

function copy_bins() {
  if(!exists(_ELECTRIFIED_BIN)){
    mkdir('-p', _ELECTRIFIED_BIN);
    log('copying mongo and node binaries');
    cp(_METEOR_MONGO, _ELECTRIFIED_BIN);
    cp(_METEOR_MONGOD, _ELECTRIFIED_BIN);
    cp(_METEOR_NODE, _ELECTRIFIED_BIN);
  }
}

function copy_database() {
  log('copying database');
  rm('-rf', _ELECTRIFIED_DB);
  mkdir('-p', _ELECTRIFIED_DB);
  cp('-r', _METEOR_LOCAL_DB_JOURNAL, _ELECTRIFIED_DB);
  _METEOR_LOCAL_DB_FILES.forEach(function(filepath){
    if(exists(filepath))
      cp('-r', filepath, _ELECTRIFIED_DB);
  });
}

/*******************************************************************************
  BUNDLE METEOR APP
*******************************************************************************/

function bundle_meteor() {
  log('bundling meteor');

  exec([
    'cd ' + _APP_ROOT,
    'meteor build ' + _ELECTRIFIED_TEMP + ' --server null --directory'
  ].join(' && '), _SILENT_EXECS);

  rm('-rf', _ELECTRIFIED_APP);
  mv(_ELECTRIFIED_BUNDLE, _ELECTRIFIED_APP);
  rm('-rf', _ELECTRIFIED_TEMP);
}

function install_meteor_dependencies() {
  log('installing meteor dependencies');
  // instead of `npm install` :
  // 
  //     exec('cd ' + _ELCTRIFIED_SERVER + ' && npm install', _SILENT_EXECS);
  // 
  // which would imply in another bugs around node-fibers native re-build with
  // node-gyp, we just copy the whole `node_modules` folder that is officially
  // distributed with meteor, its 'ready to go and doesn't need to be rebuilt
  cp('-r', _METEOR_SERVER_LIB_MODS, _ELECTRIFIED_SERVER);
}

/*******************************************************************************
  PACKAGE APP
*******************************************************************************/

function package_app() {
  var name    = require(_ELECTRIFIED_PKG).name;
  var version = require(_ELECTRON_PKG_JSON).version;

  var command = [
    _METEOR_NODE + ' ',
    _ELECTRON_PACKAGER +' '+ _ELECTRIFIED + ' ' + name,
    '--out=' + _ELECTRIFIED_RELEASE,
    '--arch=' + _ARCH,
    '--platform=' + _PLATFORM,
    '--version='+ version
  ].join(' ');

  log(
    'packaging app for platform '+ _PLATFORM +
    ' '+ _ARCH + ' using electron v' + version
  );

  rm('-rf', _ELECTRIFIED_RELEASE);
  mkdir('-p', _ELECTRIFIED_RELEASE);

  exec(command, _SILENT_EXECS);

  log('wrote new app to ', _ELECTRIFIED_RELEASE);
}


/*******************************************************************************
  TEMPLATES
*******************************************************************************/

TEMPLATES = {
  index: [
    "var app       = require('app');",
    "var browser   = require('browser-window');",
    "var electrify = require('electrify');",
    "",
    "",
    "var window    = null;",
    "",
    "app.on('ready', function() {",
    "",
    "  window = new browser({",
    "    width: 1200,",
    "    height: 900,",
    "    'node-integration': false",
    "  });",
    "  ",
    "  electrify.boot(function() {",
    "    window.loadUrl(electrify.meteor_url);",
    "  });",
    "",
    "});",
    "",
    "",
    "app.on('will-quit', function(event) {",
    "  electrify.shutdown(app, event);",
    "});",
    "",
    "app.on('window-all-closed', function() {",
    "  app.quit();",
    "});"
  ].join('\r\n'),

  pkg: [
  '{',
  '  "name": "Electrified",',
  '  "main": "index.js",',
  '  "devDependencies": {',
  '    "electron-prebuilt": "^0.29.2",',
  '    "electron-packager": "^5.0.1",',
  '    "electrify": "'+ VERSION +'"',
  '  }',
  '}'
  ].join('\r\n'),

  gitignore: [
    '.DS_Store',
    '.dist',
    'app',
    'bin',
    'db',
    'node_modules'
  ].join('\r\n')
};

/*******************************************************************************
  SIMPLE FILE READ / WRITE / EXISTS helpers
*******************************************************************************/

function read(filepath, encoding) {
  if(exists(filepath))
    return fs.readFileSync(filepath, encoding || 'utf8');
}

function write(filepath, contents) {
  fs.writeFileSync(filepath, contents);
}

function exists(filepath) {
  return fs.existsSync(filepath);
}

/*******************************************************************************
  DEBUG
*******************************************************************************/

function log(){
  var args = Array.prototype.slice.call(arguments);
  console.log.apply(null, ['electrify: '].concat(args));
}