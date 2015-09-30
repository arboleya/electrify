describe('[electrify] run and package', function(){
  
  this.timeout(5 * 60 * 1000); // 5mins
  
  var fs = require('fs');
  var path = require('path');
  var spawn = require('child_process').spawn;

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

    this.timeout(5 * 60 * 1000); // 5mins

    process.env.DEVELECTRIFY = true;

    tests_dir  = path.join(require('os').tmpdir(), 'electrify-tests');

    root_dir = path.join(__dirname, '..');
    npm_dir  = path.join(root_dir, '.npm', 'node_modules', 'electrify');

    node_mods_dir  = path.join(tests_dir, 'node_modules');
    meteor_app_dir = path.join(tests_dir, 'leaderboard');
    packages_dir   = path.join(meteor_app_dir, 'packages');
    electrify_dir  = path.join(packages_dir, 'arboleya-electrify');
    
    electrify  = Electrify(meteor_app_dir, {});
    
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
    this.timeout(5 * 60 * 1000); // 1mins
    electrify.app.run(function(){
      electrify.app.terminate();
      setTimeout(done, 2500);
    });
  });


  it('should package the app', function(done){
    this.timeout(5 * 60 * 1000); // 5mins
    electrify.app.package(function(){
      // give some time for the disk to refresh its state
      setTimeout(function(){
        should(fs.existsSync(pkg_app_dir)).be.ok();
        done();
      }, 5000);
    });
  });

  it('should start / stop the app', function(done){

    var entry_point = shell.find(pkg_app_dir).filter(function(file) {
      return /app(\\|\/)index\.js$/m.test(file);
    });
    
    var base_dir = path.dirname(entry_point);

    var new_electrify  = Electrify(base_dir, {});
    new_electrify.start(function(){
      new_electrify.stop();
      setTimeout(done, 2500);
    });

  });
});