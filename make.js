require('shelljs/make');

var fs      = require('fs');
var path    = require('path');
var spawn   = require('child_process').spawn;

var _        = require('lodash');
var shell    = require('shelljs');

var meteor_bin = process.platform == 'win32' ? 'meteor.bat' : 'meteor';
var node_bin = process.platform == 'win32' ? 'node.exe' : 'node';

var NODE_MODS = path.join(__dirname, 'node_modules');
var ISTANBUL  = path.join(NODE_MODS, 'istanbul', 'lib', 'cli.js');
var _MOCHA    = path.join(NODE_MODS, 'mocha', 'bin', '_mocha');
var _MOCHA    = path.join(NODE_MODS, 'mocha', 'bin', '_mocha');
var NPMCHECK  = path.join(NODE_MODS, 'npm-check', 'lib', 'cli.js');

// setup local env with local symlinks and proper configs
target.setup = function() {
  log('setting up everything for development');

  // list folder paths
  var parent       = path.join(__dirname, '..');
  var leaderboard  = path.join(parent, 'leaderboard');
  var packages_dir = path.join(leaderboard, 'packages');
  var node_modules = path.join(parent, 'node_modules');

  // reset folders
  shell.exec('npm link');
  shell.rm('-rf', leaderboard);
  shell.rm('-rf', node_modules);

  // create sample test app in parent dir
  spawn(meteor_bin, ['create', '--example', 'leaderboard'], {
    stdio: 'inherit',
    cwd: parent
  }).on('exit', function(){

    // linking arboleya:electrify inside meteor
    shell.mkdir('-p', packages_dir);
    shell.ln('-s', __dirname, path.join(packages_dir, 'arboleya-electrify'));

    // linking electrify inside node_modules
    shell.mkdir('-p', node_modules);
    shell.ln('-s', __dirname, path.join(node_modules, 'electrify'));

    // removes mobile platforms
    spawn(meteor_bin, ['remove-platform', 'ios', 'android'], {
      stdio: 'inherit',
      cwd: leaderboard
    }).on('exit', function(){
      
       // adding electrify package so everything gets cool
      spawn(meteor_bin, ['add', 'arboleya:electrify'], {
        stdio: 'inherit',
        cwd: leaderboard,
        // modify env var so electrify package will know how to proceed,
        // fetching the npm package locally or from remote npm registry
        env: _.extend({DEVELECTRIFY: true, LOGELECTRIFY: 'ALL'}, process.env)

      // finish
      }).on('exit', function(){
        process.exit();
      });

    });
  });

};



// start test app in dev mode
target.dev = function(action){
  var leaderboard           = path.join(__dirname, '..', 'leaderboard');
  var leaderboard_electrify = path.join(leaderboard, '.electrify');

  log('starting in dev mode');

  if(~'reset'.indexOf(action))
    shell.rm('-rf', leaderboard_electrify);

  spawn('node', [path.join(__dirname, 'bin', 'cli.js')], {
    cwd: leaderboard,
    stdio: 'inherit',
    env: _.extend({
      DEVELECTRIFY: true,
      LOGELECTRIFY: 'ALL'
    }, process.env)
  });
};



// tests
target.test = function() {
  spawn(node_bin, [_MOCHA, 'test'], {
    stdio: 'inherit',
    env: _.extend({DEVELECTRIFY: true, LOGELECTRIFY: 'ALL'}, process.env)
  });
};

target['test.cover'] = function(done){
  spawn(node_bin, [ISTANBUL, 'cover', _MOCHA], {
    stdio: 'inherit',
    env: _.extend({DEVELECTRIFY: true, LOGELECTRIFY: 'ALL'}, process.env)
  }).on('exit', function(){
    if(done) done();
  });
};

target['test.cover.preview'] = function(){
  target['test.cover'](function(){
    if(!fs.existsSync('./coverage/lcov-report')) return;
    spawn('python', ['-m', 'SimpleHTTPServer', '8080'], {
      cwd: './coverage/lcov-report',
      stdio: 'inherit',
      env: _.extend({DEVELECTRIFY: true, LOGELECTRIFY: 'ALL'}, process.env)
    });
    console.log('preview coverage at: http://localhost:8080');
  });
};

target['test.cover.send'] = function() {
  var repo_token = process.env.CODECLIMATE_REPO_TOKEN;

  if(repo_token === undefined || repo_token.trim() === '') {
    console.error('No CODECLIMATE_REPO_TOKEN found.');
    process.exit(1);
  }

  target['test.cover'](function(){
    // reads lcov data
    var lcov_path   = path.join(__dirname, 'coverage', 'lcov.info');
    var lcov        = fs.readFileSync(lcov_path, 'utf-8');

    var node_mods = path.join(
      __dirname,
      'node_modules',
      'codeclimate-test-reporter'
    );

    var Formatter = require(path.join(node_mods, 'formatter'));
    var client    = require(path.join(node_mods, 'http_client'));

    var formatter = new Formatter();
    formatter.format(lcov, function(err, json) {
      if (err)
        console.error("A problem occurred parsing the lcov data", err);
      else {
        json.repo_token = repo_token;
        client.postJson(json);
        console.log('coverage sent to codeclimate');
      }
    });
  });
};

target['update.version'] = function(version) {
  var filepath, content, replacement;

  // package.json
  replacement  = '"version": "'+ version[0];
  filepath     = path.join(__dirname, 'package.json');
  content      = fs.readFileSync(filepath, 'utf-8');
  content      = content.replace(/"version":\s*"[0-9\.]+/i, replacement);
  fs.writeFileSync(filepath, content);

  // lib/env.js
  replacement  = 'this.version = \''+ version[0];
  filepath     = path.join(__dirname, 'lib', 'env.js');
  content      = fs.readFileSync(filepath, 'utf-8');
  content      = content.replace(/this.version = '[0-9\.]+/i, replacement);
  fs.writeFileSync(filepath, content);

  //HISTORY.md
  replacement  = 'this.version = \''+ version[0];
  filepath     = path.join(__dirname, 'HISTORY.md');
  content      = fs.readFileSync(filepath, 'utf-8');
  fs.writeFileSync(filepath, [
    version[0] + ' / {{DATE..}}',
    '===================',
    '  * {{TOPIC...}}\n',
    content
  ].join('\n'));
};

target['deps.check'] = function(){
  spawn(node_bin, [NPMCHECK], {
    stdio: 'inherit'
  });
};

target['deps.upgrade'] = function(){
  spawn(node_bin, [NPMCHECK, '-u'], {
    stdio: 'inherit'
  });
};

target.publish = function(){
  var version = require('./package.json').version;
  shell.exec('git tag -a '+ version +' -m "Releasing '+ version +'"');
  shell.exec('git push origin master --tags');
  shell.exec('npm publish');
};


function log(){
  var args = Array.prototype.slice.call(arguments);
  console.log.apply(null, ['electrify: '].concat(args));
}