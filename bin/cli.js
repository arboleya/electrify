#!/usr/bin/env node

var path      = require('path');
var fs        = require('fs');
var program   = require('commander');

var electrify = require('../lib')(process.cwd(), meteor_settings());

program
  .usage('[command] [options]')
  .version(require('./package.json').version)
  .on('--help', function(){
    console.log('  Examples:');
    console.log('');
    console.log('    $ electrify package ');
    console.log('    $ electrify package --settings settings.json');
    console.log('');
  });

program
  .option('--settings <file>', 'Set Meteor settings');

program
  .command('package')
  .description('package app')
  .action(function(){
    electrify.app.package();
  });

program
  .command('run')
  .description('run the app (meteor server must to be up')
  .action(function(){
    electrify.app.run();
  });

program.parse(process.argv);

if(process.argv.length <= 2)
  program.help();

function meteor_settings() {
  if(!program.settings) return {};

  var relative = path.join(process.cwd(), program.settings);
  var absolute = path.resolve(program.settings);
  var settings = (absolute == program.settings ? absolute : relative);

  if(!fs.existsSync(settings)) {
    console.log('settings file not found: ', relative);
    process.exit();
  }

  return require(settings);
}