var VERSION = '1.4.0';

Package.describe({
  name: 'arboleya:electrify',
  version: VERSION,
  summary: 'Package your Meteor apps with Electron, and butter.',
  git: 'https://github.com/arboleya/electrify',
  documentation: 'README.md'
});

Package.onUse(function(api) {
  api.versionsFrom('1.0');
  api.addFiles('meteor/index.js', 'server');
  api.export('Electrify');
});