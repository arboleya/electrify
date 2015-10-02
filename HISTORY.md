1.3.1 / 2015-10-02
===================
  * Fixing SyntaxError in default template (index.js)

1.3.0 / 2015-10-02
===================
  * Revamping project, re-writting everything
  * Starting initial architecture for plugins
  * Adding tests

1.2.2 / 2015-09-14
===================
  * Executing dependencies' (electron, electron-packager, npm) through it's JS
  files (instead of its binaries) for more cross-platform compatibility and
  flexibility (closes [#8](https://github.com/arboleya/electrify/issues/8))

1.2.1 / 2015-09-09
===================
  * Fixing Meteor's setting format

  
1.2.0 / 2015-09-09
===================
  * Fixing version checkup
  * Adding support for `meteor --settings` from both Meteor and NPM

1.1.3 / 2015-09-08
===================
 * Adding auto self-upgrade routine for `.electrify` local npm module

1.1.2 / 2015-09-07
===================
 * Improving free port evaluation approach
 * Using Meteor's distributed `npm` to minimize permission problems often found
 when using user's `npm`

1.1.1 / 2015-08-25
===================
 * Fixing project's root folder evaluation approach

1.1.0 / 2015-08-11
===================
 * Adding alternative method to package app, using purely NPM.

1.0.4 / 2015-07-15
===================
 * Removing posix library, using a cross-platform approach based on
 `process.env.METEOR_PARENT_PID` for avoiding opening multiple Electorn windows
 on server restart

1.0.3 / 2015-07-15
===================
 * Avoid opening a new Electron window per server restart, during development

1.0.2 / 2015-07-13
===================
 * Checking and fixing corrupted/incomplete `npm install`s

1.0.1 / 2015-07-12
===================
 * Leaving development database behind
  * Due to unknown erros when starting up mongod for existent files db copied
  from meteor, the electrified app will now start with a blank database, so any
  seeds your app has will be done again in the first run of your packaged app

1.0.0 / 2015-07-12
===================
 * Hello World