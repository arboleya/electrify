#!/usr/bin/env node

var path      = require('path');
var fs        = require('fs');
var program   = require('commander');
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
      '# `electrify` without a command defaults to `electrify run`',
      '',
      'electrify',
      'electrify run',
      'electrify package',
      'electrify package -o /dist/dir',
      'electrify package -o /dist/dir -s file.json',
      'electrify package -i /app/dir -o /dist/dir -s dev.json',
      'electrify package -i /app/dir -o /dist/dir -s dev.json -c config.json'
    ].join('\n    ') + '\n');
  });

program
  .option('-i, --input    <path>', 'meteor app dir (default=.)')
  .option('-o, --output   <path>', 'output dir (default=.electrify/.dist)')
  .option('-c, --config   <path>', 'electrify config file (default=.electrify/electrify.json)')
  .option('-s, --settings <path>', 'meteor settings file (optional, default=null)');

program
  .command('run')
  .description('start meteor app within electrify context')
  .action(function(){
    electrify().app.run();
  });

program
  .command('bundle')
  .description('bundle everything as an electron project at `.electrify` dir')
  .action(function(){
    electrify().app.bundle(/* server_url */);
  });

program
  .command('package')
  .description('bundle and package `.electrify` electron app to `--output` dir')
  .action(function(){
    electrify().app.package(/* server_url */);
  });

program.parse(process.argv);


// default command = run
var cmd = process.argv[2];
if(process.argv.length == 2 || -1 == 'run|bundle|package'.indexOf(cmd))
  electrify().app.run();


// helpers
function electrify() {
  var input, error_msg, meteor_dir;

  // validates input dir (app-root folder)
  if(program.input && !fs.existsSync(program.input)) {
    error_msg = 'Input folder doesn\'t exist: ' + program.input;
    throw new Error(error_msg);
  }
  
  input = program.input || process.cwd();

  // validates meteor project
  meteor_dir = path.join(input, '.meteor');

  if(!fs.existsSync(meteor_dir)) {
    error_msg = 'Not a meteor app: ' + meteor_dir;
    throw new Error(error_msg);
  }

  if(program.output && !fs.existsSync(program.output)) {
    error_msg = 'Output folder doesn\'t exist: ' + program.output;
    throw new Error(error_msg);
  }

  var elec_mod = require('../lib');
  return elec_mod(input, program.output, program.config, meteor_settings());
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