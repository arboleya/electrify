Package.describe({
  name: 'arboleya:electrify',
  version: require('./package.json').version,
  summary: 'Package your Meteor apps with Electron, and butter.',
  git: 'https://github.com/arboleya/electrify',
  documentation: 'README.md'
});

var sha          = 'bf658fd1c03d53ba0d0eb87b1a853eb34ade362e';
var version_path = null;

if(process.env.DEVELECTRIFY == 'true') {
  console.log('[======================== ELECTRIFY ========================]');
  console.log('[   Running electrify in dev mode with `DEVELECTRIFY=true`  ]');
  console.log('[===========================================================]');
  version_path = 'http://localhost:7777/' + sha;
}
else
  version_path = require('./package.json').version;


Npm.depends({
  'electrify': version_path
});

Package.onUse(function(api) {
  api.versionsFrom('1.0');
  api.addFiles('meteor/index.js', 'server');
  api.export('Electrify');
});