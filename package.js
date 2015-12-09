var VERSION = '2.1.2';

Package.describe({
  name: 'arboleya:electrify',
  version: VERSION,
  summary: 'Package your Meteor apps with Electron, and butter.',
  git: 'https://github.com/arboleya/electrify',
  documentation: 'README.md'
});

Npm.depends({
  'sockjs-client': '1.0.3'
});

Package.onUse(function(api) {
  api.versionsFrom('1.0');

  api.use('random');

  // TODO: change this static version for a  browserified version of
  // the npm module informed inside Npm.depends() above
  api.addFiles('meteor/vendors/sockjs-client.js', ['client'], {bare: true});
  api.addFiles('meteor/index.js', ['server', 'client']);
  
  api.export('Electrify');
});