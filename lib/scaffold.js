var fs     = require('fs');
var path   = require('path');
var shell  = require('shelljs');

module.exports = function($){
  return new Scaffold($);
};

function Scaffold($){
  this.$ = $;
  this.log = require('./log')($, 'electrify:scaffold');
}

Scaffold.prototype.prepare = function() {

  this.log.info('ensuring basic structure');
  
  shell.mkdir('-p' , this.$.env.app.electrify);
  shell.mkdir('-p' , this.$.env.app.bin);
  shell.mkdir('-p' , this.$.env.core.tmp);
  shell.mkdir('-p',  this.$.env.core.root);
  
  var index        = path.join(this.$.env.app.electrify, 'index.js');
  var package      = path.join(this.$.env.app.electrify, 'package.json');
  var gitignore    = path.join(this.$.env.app.electrify, '.gitignore');
  var core_package = path.join(this.$.env.core.root, 'package.json');

  // in development mode we overwrite this file everytime
  if(!fs.existsSync(index) || this.$.env.in_development_mode) {

    fs.writeFileSync(index, [
      "var app       = require('app');",
      "var browser   = require('browser-window');",
      "",
      "var electrify = require('electrify')(__dirname, {});",
      "",
      "var window    = null;",
      "",
      "app.on('ready', function() {",
      "  electrify.start(function(meteor_root_url) {",
      "    window = new browser({",
      "      width: 1200, height: 900,",
      "      'node-integration': false",
      "    });",
      "    window.loadUrl(meteor_root_url);",
      "  });",
      "});",
      "",
      "app.on('will-quit', function(event) {",
      "  electrify.stop(app, event);",
      "});",
      "",
      "app.on('window-all-closed', function() {",
      "  app.quit();",
      "});"
    ].join('\r'));
  }

  if (!fs.existsSync(package)) {
    fs.writeFileSync(package, JSON.stringify({
      name: 'my-electrified-app',
      main: 'index.js',
      dependencies: { electrify: this.$.env.version }
    }, null, 2));
  }

  if (!fs.existsSync(gitignore)) {
    fs.writeFileSync(gitignore, [
        '.DS_Store', '.dist', 'app',
        'bin', 'db', 'node_modules'
      ].join('\n'));
  }

  if (!fs.existsSync(core_package)) {
    shell.mkdir('-p', path.dirname(core_package));
    fs.writeFileSync(core_package, JSON.stringify({
      dependencies: { 'electron-prebuilt': '*', 'electron-packager': '*' }
    }, null, 2));
  }
};