#!/usr/bin/env node

var path      = require('path');
var fs        = require('fs');
var program   = require('commander');
var log       = console.log;

function electrify() {
  var input = program.input || process.cwd();
  return require('../lib')(input, program.output, meteor_settings());
}

program
  .usage('[command] [options]')
  .version(require('../package.json').version)
  .on('--help', function(){
    log('  Examples:\n');
    log('    ' + [
      'electrify',
      'electrify package',
      'electrify package --output /output/path',
      'electrify package --output /output/path -settings file.json',
      'electrify package --input /my/app --output /output/dir -s dev.json'
    ].join('\n    ') + '\n');
  });

program
  .option('--settings <path>', 'json file with meteor\'s settings')
  .option('--input    <path>', 'meteor app dir (default = .)')
  .option('--output   <path>', 'output dir (default = .electrify/.dist)');
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
  .description('bundle everything as an electron project, at `.electrify` dir')
  .action(function(){
    electrify().app.bundle(/* server_url */);
  });

program
  .command('package')
  .description('bundle and package app, at `output` dir')
  .action(function(){
    electrify().app.package(/* server_url */);
  });

program.parse(process.argv);

if(process.argv.length <= 2)
  electrify().app.run();

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