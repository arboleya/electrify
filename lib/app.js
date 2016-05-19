var _    = require('lodash');

var fs    = require('fs');
var spawn = require('child_process').spawn;
var join  = require('path').join;
var shell = require('shelljs');

module.exports = function ($){
  return new App($);
};

function App($) {
  this.$ = $;
  this.log = require('./log')($, 'electrify:app');
}

App.prototype.terminate = function(done){
  // this.log.info('terminating app');
  this.stop_meteor();
  this.$.plugins.stop(done);
};

App.prototype.init = function(done){
  this.log.info('initialize app');
  this.$.scaffold.prepare();
  this.$.waterfal([
    [this.ensure_deps               , this            ] ,
    [this.$.plugins.acquire         , this.$.plugins  ] ,
    [function(){ if(done) done(); } , null            ]
  ]);
};

App.prototype.run = function(done){
  this.log.info('running app');
  this.$.waterfal([
    [this.ensure_deps               , this            ] ,
    [this.$.plugins.auto_load       , this.$.plugins  ] ,
    [this.$.plugins.acquire         , this.$.plugins  ] ,
    [this.$.plugins.start           , this.$.plugins  ] ,
    [this.start_meteor              , this            ] ,
    [function(){ if(done) done(); } , null            ]
  ]);
};

App.prototype.start_meteor = function(done){

  this.log.info('starting meteor');

  var command = 'meteor' + (this.$.env.os.is_windows ? '.bat' : '');
  var env     = _.clone(this.$.env.app.settings);

  _.extend(env, process.env);
  _.extend(env, this.$.plugins.env());

  var args;
  if(process.env.ELECTRIFY_SETTINGS_FILE)
    args = ['--settings', process.env.ELECTRIFY_SETTINGS_FILE];
  else
    args = [];

  this.meteor_process = spawn(command, args, {
    cwd: this.$.env.app.meteor,
    env: env,
    // pipe stdout and stderr below, because spawning meteor with stdio=inherit will:
    // 1. break things silently on windows.
    // 2. result in cpu usage on osx.
    stdio: 'pipe',
  });

  this.meteor_process.stdout.pipe(process.stdout);
  this.meteor_process.stderr.pipe(process.stderr);

  var meteor_url = 'http://localhost:3000';
  this.$.plugins.get('nodejs').meteor_ready(meteor_url, function(){
    done(meteor_url);
  });
};

App.prototype.stop_meteor = function() {
  if(this.meteor_process)
    this.$._kill(this.meteor_process);
};

App.prototype.bundle = function(done){
  this.log.info('bundling app');
  this.$.scaffold.prepare();
  this.$.waterfal([
    [this.ensure_deps                       , this.$.plugins  ] ,
    [this.$.plugins.auto_load               , this.$.plugins  ] ,
    [this.$.plugins.acquire                 , this.$.plugins  ] ,
    [this.bundle_meteor                     , this            ] ,
    [function(){ if(done) done(); }         , null            ]
  ]);
};

App.prototype.package = function(options, done){
  var self = this;
  this.bundle(function(){
    self.$.electron.package(options, function(){
      if(done) done();
    });
  });
};

App.prototype.bundle_meteor = function( /* server_url, */ done) {
  this.log.info('bundling meteor');

  var tmp_dir             = join(this.$.env.core.tmp, 'bundling');
  var bundled_dir         = join(tmp_dir, 'bundle');
  var electrify_app_dir   = join(this.$.env.app.root, 'app');
  var programs_server_dir = join(electrify_app_dir, 'programs', 'server');

  // resetting folders
  shell.rm('-rf', tmp_dir);
  shell.mkdir('-p', tmp_dir);

  // bundle meteor
  var self = this;
  spawn('meteor' + (this.$.env.os.is_windows ? '.bat' : ''), [
      'build', tmp_dir,
      '--server', null,
      // '--server', (server_url !== undefined ? server_url : null),
      '--directory'
    ], {
      cwd: this.$.env.app.meteor,
      stdio: this.$.env.stdio
    }
  ).on('exit', function(){

    // inject meteor's settings file within the bundled app
    fs.writeFileSync(
      join(bundled_dir, 'settings.json'),
      JSON.stringify(self.$.env.app.settings, null, 2)
    );

    // move bundled meteor into .electrify
    shell.rm('-rf', electrify_app_dir);
    shell.mv(bundled_dir, electrify_app_dir);
    shell.rm('-rf', tmp_dir);

    self.log.info('ensuring meteor dependencies');

    // instead of entering the folder and doing an usual `npm install`, which
    // would imply in another bugs around node-fibers native re-build with
    // node-gyp, we just copy the whole `node_modules` folder that is officially
    // distributed with meteor, its 'ready to go and doesn't need to be rebuilt
    shell.cp('-r', self.$.env.meteor.server_modules, programs_server_dir);

    if(done) done();
  });
};

App.prototype.ensure_deps = function(done) {

  this.log.info('ensuring electrify dependencies');

  var npm_cmd = 'npm' + (this.$.env.os.is_windows ? '.cmd' : '');

  // in development mode, use local electrify version
  if(this.$.env.is_development_mode) {

    // when running tests, avoid re-installing it everytime
    var electrify_mod = join(this.$.env.app.root, 'node_modules', 'electrify');
    if(this.$.env.is_running_tests && fs.existsSync(electrify_mod)) {
      return setTimeout(done, 1);
    }

    // proceeds and self install itself :P
    spawn(npm_cmd, ['i', '--save', join(__dirname, '..')], {
      cwd: this.$.env.app.root,
      stdio: this.$.env.stdio
    }).on('exit', done);

  }
  else {
    // fetch version infos
    var pkg_path    = join(this.$.env.app.root, 'package.json');
    var pkg_version = require(pkg_path).dependencies.electrify;
    var version     = this.$.env.version;

    // check and warn users about electrify versions mismatch
    if(pkg_version != version) {
      this.log.warn([
        "{{IMPORTANT}} Your local electrify npm package must match version",
        version,
        " -- please update it to avoid errors"
      ].join(' '));
    }

    spawn(npm_cmd, ['i'], {
      cwd: this.$.env.app.root,
      stdio: this.$.env.stdio
    }).on('exit', done);
  }
};