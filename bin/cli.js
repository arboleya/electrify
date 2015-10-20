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
      '# cd into meteor dir first',
      'cd /you/meteor/app',
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
  .option('-i, --input    <path>', 'meteor app dir         | default = .')
  .option('-o, --output   <path>', 'output dir             | default = .electrify/.dist')
  .option('-c, --config   <path>', 'electrify config file  | default = .electrify/electrify.json')
  .option('-s, --settings <path>', 'meteor settings file   | default = null (optional)');

program
  .command('run')
  .description('(default) start meteor app within electrify context, used for dev')
  .action(function(){
    electrify().app.run();
  });

program
  .command('bundle')
  .description('bundle meteor app into an electron project at `.electrify` dir')
  .action(function(){
    electrify().app.bundle(/* server_url */);
  });

program
  .command('package')
  .description('all in one, bundle + package `.electrify` electron app to `--output` dir')
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
  var input, meteor_dir;

  // validates input dir (app-root folder)
  if(program.input && !fs.existsSync(program.input)) {
    console.error('input folder doesn\'t exist\n  ' + program.input);
    process.exit();
  }
  
  input = program.input || process.cwd();

  // validates meteor project
  meteor_dir = path.join(input, '.meteor');

  if(!fs.existsSync(meteor_dir)) {
    console.error('not a meteor app\n  ' + input);
    process.exit();
  }

  if(program.output && !fs.existsSync(program.output)) {
    console.error('output folder doesn\'t exist\n  ' + program.output);
    process.exit();
  }

  var elec_mod = require('../lib');
  return elec_mod(input, program.output, program.config, meteor_settings(), true);
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