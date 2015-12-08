2.1.0 / 2015-12-08
===================
  * Added `preserve_db` option
  
2.0.2 / 2015-11-09
===================
  * Fixing last release (broken due to a wrong variable inside a conditional)

2.0.1 / 2015-11-09
===================
 * Fixing requirememts for production app (meteor is not required!)
 * Fixing packager options parser (in cli.js)

2.0.0 / 2015-11-03
===================
  * Added integration/communication between Electron and Meteor
  * Plugins architecture re-designed
  * Fixed process termination
  * Fixed Meteor's settings
  * Redesigned core dependencies
  * Core project is now NPM, the Meteor package only provides a communication
  channel between Meteor and Electron, all the rest is done with the NPM package
  * Adding more options to the CLI tool for more flexibility

1.4.0 / 2015-10-08
===================
  * Improving plugins API

1.3.6 / 2015-10-06
===================
  * Unifying the moment when mongod.lock file is removed

1.3.5 / 2015-10-06
===================
  * Properly handling mongodb.lock file, specially in winows where's not
  possible to gracefully shutdown mongo
  * Fixing meteor initialization on windows

1.3.4 / 2015-10-02
===================
  * Fixing log level check

1.3.3 / 2015-10-02
===================
  * Fixing `package.json` version evaluation for .electrify app

1.3.2 / 2015-10-02
===================
  * Adding target to maintain all versions of meteor and npm packages under
  the same rule

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