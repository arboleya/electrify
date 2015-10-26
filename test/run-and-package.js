describe('[electrify] run and package', function(){
  
  this.timeout(60 * 60 * 1000); // 60mins
  
  var fs = require('fs');
  var path = require('path');
  var spawn = require('child_process').spawn;
  var http  = require('http');

  var should = require('should');
  var shell  = require('shelljs');

  var stdio_config;

  var Electrify;

  var tests_dir;

  var root_dir;
  var npm_dir;

  var node_mods_dir;
  var meteor_app_dir;
  var packages_dir;
  var electrify_dir;
  
  var electrify;
  var pkg_app_dir;

  var meteor_bin = 'meteor' + (process.platform == 'win32' ? '.bat' : '');

  before(function(done){

    stdio_config = 'inherit';

    Electrify = require('../lib');

    process.env.DEVELECTRIFY = true;

    tests_dir  = path.join(require('os').tmpdir(), 'electrify-tests');

    root_dir = path.join(__dirname, '..');
    npm_dir  = path.join(root_dir, '.npm', 'node_modules', 'electrify');

    node_mods_dir  = path.join(tests_dir, 'node_modules');
    meteor_app_dir = path.join(tests_dir, 'leaderboard');
    packages_dir   = path.join(meteor_app_dir, 'packages');
    electrify_dir  = path.join(packages_dir, 'arboleya-electrify');
    
    electrify  = Electrify(meteor_app_dir);
    
    var name = 'my-electrified-app';
    var plat = electrify.env.sys.platform;
    var arch = electrify.env.sys.arch;
    
    var dist_dir  = name + '-' + plat + '-' + arch;

    pkg_app_dir = path.join(meteor_app_dir, '.electrify', '.dist', dist_dir);

    console.log('preparing test environment');

    // reset tests dir
    shell.rm('-rf', npm_dir);
    shell.rm('-rf', tests_dir);
    shell.rm('-rf', electrify.env.core.root);

    shell.mkdir('-p', node_mods_dir);
    shell.ln('-s', root_dir, path.join(node_mods_dir, 'electrify'));

    // crates a sample app and add the package
    spawn(meteor_bin, ['create', '--example', 'leaderboard'], {
      cwd: tests_dir,
      stdio: stdio_config
    }).on('exit', function(){

      // creates internal folder and link it with the package
      shell.mkdir('-p', packages_dir);
      shell.ln('-s', path.join(__dirname, '..'), electrify_dir);

      // remove mobile platforms
      spawn(meteor_bin, ['remove-platform', 'android', 'ios'], {
        cwd: meteor_app_dir,
        stdio: stdio_config
      }).on('exit', function(){

        // add electrify package
        spawn(meteor_bin, ['add', 'arboleya:electrify'], {
          cwd: meteor_app_dir,
          stdio: stdio_config,
          env: process.env
        }).on('exit', done);
      });
    });
  });


  it('should run & terminate the app', function(done) {
    electrify.app.run(function(){
      electrify.app.terminate();
      setTimeout(done, 2500);
    });
  });


  it('should package the app', function(done){
    electrify.app.package(function(){
      // give some time for the disk to refresh its state
      setTimeout(function(){
        should(fs.existsSync(pkg_app_dir)).be.ok();
        done();
      }, 5000);
    });
  });


  it('should start / stop the app, in development', function(done){

    var meteor_app    = path.join(meteor_app_dir, '.electrify');
    var new_electrify = Electrify(meteor_app);

    new_electrify.start(function() {
      new_electrify.stop();
      setTimeout(done, 2500);
    });

  });


  it('should start / stop the app, in production', function(done){

    var entry_point = shell.find(pkg_app_dir).filter(function(file) {
      return /app(\\|\/)index\.js$/m.test(file);
    });
    
    var base_dir = path.dirname(entry_point);

    var new_electrify  = Electrify(base_dir);
    new_electrify.start(function(meteor_url){

      // validates if page is responding
      http.get(meteor_url, function(res) {
        res.setEncoding('utf8');
        res.on('data', function(body) {

          // test if body has the meteor config object declared
          /__meteor_runtime_config__/.test(body).should.be.ok();

          new_electrify.stop();

          // give sometime before the final analysys, so next tests
          // will have a good time on slow windows machines
          setTimeout(done, 2500);
        });
      });
    });
  });

  // this test is exactly the same as the above one, it's needed to assure
  // subsequent startups
  it('should start / stop the app, in production, AGAIN', function(done){

    var entry_point = shell.find(pkg_app_dir).filter(function(file) {
      return /app(\\|\/)index\.js$/m.test(file);
    });
    
    var base_dir = path.dirname(entry_point);

    var new_electrify  = Electrify(base_dir);
    new_electrify.start(function(meteor_url){

      // validates if page is responding
      http.get(meteor_url, function(res) {
        res.setEncoding('utf8');
        res.on('data', function(body) {

          // test if body has the meteor config object declared
          /__meteor_runtime_config__/.test(body).should.be.ok();

          new_electrify.stop();

          // give sometime before the final analysys, so next tests
          // will have a good time on slow windows machines
          setTimeout(done, 2500);
        });
      });
    });
  });

  // test the methods execution between meteor and electron
  it('should execute methods between Electron <-> Meteor', function(done) {

    var leaderboard         = path.join(meteor_app_dir, 'leaderboard.js');
    var leaderboard_content = fs.readFileSync(leaderboard, 'utf8');
    var leaderboard_call    = [
      "Electrify.startup(function() {",
      "  if(Meteor.isClient) return;",
      "  var fs = Npm.require('fs');",
      "  var path = Npm.require('path');",
      "  Electrify.call('sum', [4, 2], function(err, res) {",
      "    console.log(arguments);",
      "    var filename = 'method_sum.txt'",
      "    var save_path = path.join('"+ meteor_app_dir +"', filename)",
      "    fs.writeFileSync(save_path, res);",
      "  });",
      "  Electrify.call('yellow.elephant', [4, 2], function(err, res) {",
      "    console.log(arguments);",
      "    var filename = 'method_error.txt'",
      "    var save_path = path.join('"+ meteor_app_dir +"', filename)",
      "    fs.writeFileSync(save_path, err.message);",
      "  });",
      "});"
    ].join('\n');

    fs.writeFileSync(leaderboard, leaderboard_content + leaderboard_call);

    var new_electrify = Electrify(meteor_app_dir);

    new_electrify.methods({
      'sum': function(a, b, done){
        done(null, a + b);
      }
    });

    new_electrify.start(function(){
      new_electrify.isup().should.equal(true);
      setTimeout(function(){
        var method_sum = path.join(meteor_app_dir, 'method_sum.txt');
        var method_error = path.join(meteor_app_dir, 'method_error.txt');
        
        var sum = fs.readFileSync(method_sum, 'utf8');
        var error = fs.readFileSync(method_error, 'utf8');

        sum.should.equal('6');
        error.should.equal('method `yellow.elephant` was not defined');

        new_electrify.stop();
        setTimeout(done, 2500);
      }, 2500);
    });
  });
});
