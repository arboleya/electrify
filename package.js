Package.describe({
  name: 'arboleya:electrify',
  version: '1.1.1',
  summary: 'Package your Meteor apps with Electron, and butter.',
  git: 'https://github.com/arboleya/electrify',
  documentation: 'README.md'
});

Npm.depends({
  'shelljs' : '0.5.1'
});

Package.onUse(function(api) {
  api.versionsFrom('1.0');
  api.addFiles('index.meteor.js', 'server');
  api.export('electrify');
});