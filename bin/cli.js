#!/usr/bin/env node

var path      = require('path');
var fs        = require('fs');
var program   = require('commander');
var log       = console.log;

var pack = 'electrify package';

program
  .usage('[command] [options]')
  .version(require('../package.json').version)
  .on('--help', function(){
    log('  Examples:\n');
    log('    ' + [
      'electrify',
      pack,
      pack +' --output /dist/dir',
      pack +' --output /dist/dir -settings file.json',
      pack +' --input /app/dir --output /dist/dir --settings dev.json',
      pack +' --input /app/dir --output /dist/dir --settings dev.json --plugins electrify-es'
    ].join('\n    ') + '\n');
  });

program
  .option('--settings <path>', 'json file with meteor\'s settings')
  .option('--input   <path>', 'meteor app dir (default = .)')
  .option('--output  <path>', 'output dir (default = .electrify/.dist)')
  .option('--plugins  <a,b>', 'comma separated list of plugins to use');
  // TODO: enable building of client only
  // .option('--server <url>', 'if informed, build client only');


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
  .description('bundle and package app to `--output` dir')
  .action(function(){
    electrify().app.package(/* server_url */);
  });

program.parse(process.argv);

if(process.argv.length <= 2)
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

  return require('../lib')(input, program.output, meteor_settings());
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