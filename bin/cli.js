#!/usr/bin/env node

var path      = require('path');
var fs        = require('fs');
var program   = require('commander');
var spawn      = require('child_process').spawn;
var log       = console.log;

program
  .usage('[command] [options]')
  .version(require('../package.json').version)
  .on('--version', function(){
    return require('../package.json').version;
  })
  .on('--help', function(){
    log('  Examples:\n');
    log('    ' + [
      '# cd into meteor dir first',
      'cd /your/meteor/app',
      '',
      'electrify',
      'electrify run',
      'electrify package',
      'electrify package -o /dist/dir',
      'electrify package -o /dist/dir -s file.json',
      'electrify package -i /app/dir -o /dist/dir -s dev.json',
      'electrify package -- <electron-packager-options>'
    ].join('\n    ') + '\n');
  });

program
  .option('-i, --input    <path>', 'meteor app dir       | default = .')
  .option('-o, --output   <path>', 'output dir           | default = .electrify/.dist')
  .option('-s, --settings <path>', 'meteor settings file | default = null (optional)');

program
  .command('run')
  .description('(default) start meteor app within electrify context')
  .action(run);

program
  .command('bundle')
  .description('bundle meteor app at `.electrify` dir')
  .action(bundle);

program
  .command('package')
  .description('bundle and package app to `--output` dir')
  .action(package);

program.parse(process.argv);


// default command = run
var cmd = process.argv[2];
if(process.argv.length == 2 || -1 == 'run|bundle|package'.indexOf(cmd) ){
  run();
}

function run_electron(){
  var input         = program.input || process.cwd();
  var electrify_dir = path.join(input, '.electrify');
  var electron_path = require('electron-prebuilt');

  log('[[[ electron ' + electrify_dir +'` ]]]');
  spawn(electron_path, [electrify_dir], {
    stdio: 'inherit',
    env: process.env
  });
}

function is_meteor_app(){
  var input = program.input || process.cwd();
  var meteor_dir = path.join(input, '.meteor');
  return fs.existsSync(meteor_dir);
}

function run(){
  if(has_local_electrify())
    run_electron();
  else if(is_meteor_app())
    electrify(true).app.init(run_electron);
}

function bundle(){
  electrify().app.bundle(/* server_url */);
}

function package(){
  electrify().app.package(/* server_url */);
}



function electrify(create) {
  var input;

  // validates input dir (app-root folder)
  if(program.input && !fs.existsSync(program.input)) {
    console.error('input folder doesn\'t exist\n  ' + program.input);
    process.exit();
  }
  
  input = program.input || process.cwd();

  if(!is_meteor_app()) {
    console.error('not a meteor app\n  ' + input);
    process.exit();
  }

  if(program.output && !fs.existsSync(program.output)) {
    console.error('output folder doesn\'t exist\n  ' + program.output);
    process.exit();
  }

  var entry;
  var electrify_dir = path.join(input, '.electrify');
  var electrify_mod = path.join(electrify_dir, 'node_modules', 'electrify');

  if(fs.existsSync(electrify_mod))
    entry = require(electrify_mod);
  else {
    if(create)
      fs.mkdirSync(electrify_dir);

    entry = require('..');
  }

  // otherwise use this one
  return entry(electrify_dir, program.output, meteor_settings(), true);
}



function has_local_electrify(){
  // validates input dir (app-root folder)
  if(program.input && !fs.existsSync(program.input)) {
    console.error('input folder doesn\'t exist\n  ' + program.input);
    process.exit();
  }
  
  var input = program.input || process.cwd();

  // validates meteor project
  return fs.existsSync(path.join(input, '.electrify'));
}



function meteor_settings() {
  if(!program.settings) return {};

  var relative = path.join(process.cwd(), program.settings);
  var absolute = path.resolve(program.settings);
  var settings = (absolute == program.settings ? absolute : relative);

  if(!fs.existsSync(settings)) {
    log('settings file not found: ', relative);
    process.exit();
  }

  return require(settings);
}