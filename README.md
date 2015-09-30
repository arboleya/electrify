[![Windows](https://travis-ci.org/arboleya/electrify.svg)](https://travis-ci.org/arboleya/electrify)
[![Windows](https://ci.appveyor.com/api/projects/status/mgcmv8cxiu5ahr6x?svg=true)](https://ci.appveyor.com/project/arboleya/electrify)

# Electrify

Easily package your Meteor apps with Electron, and *butter*.


## TL;DR

````shell
meteor create --example leaderboard
cd leaderboard
meteor add arboleya:electrify
meteor
````
## Compatibility

Works on all Meteor's supported [platforms](https://github.com/meteor/meteor/wiki/Supported-Platforms).

## Installation

````shell
meteor add arboleya:electrify
````

## Packaging

### Meteor way

Keep your `meteor` running, fire up a second terminal tab and enter Meteor's
interactive shell:

````shell
meteor shell
````

Once inside it, execute the `Electrify.app.package()` command:

````shell
# NOTE: if you started the server with `meteor --settings file.json`, those
# settings will be automatically available on the packaged app
Electrify.app.package();
````


Press enter.

### NPM way

Alternatively, you can do it with the `electrify` npm package -- Meteor is still
required in order for this command to run, but the Meteor server can be down.

````shell
npm install -g electrify
cd /you/meteor/project
electrify package

# NOTE: Meteor's settings is not available when using NPM to package your app,
# so if your app makes use of `meteor --settings`, you must set it like:
electrify package --settings production.json
````

----

Both methods will output your `Electron` app inside `.electrify/.dist` folder.

> **NOTES**
>
  The output app will match your current operational system and arch type.
  * To get an **OSX** app, run it from a **Osx** machine.
  * To get an **Linux 32bit** app, run it from a **32bit Linux** machine.
  * To get an **Linux 64bit** app, run it from a **64nit Linux** machine.
  * To get an **Windows 32bit** app, run it from a **64bit Windows** machine.
  * To get an **Windows 64bit** app, run it from a **64bit Windows** machine.

Due to NodeJS native bindings of such libraries such as Fibers -- *which are
mandatory for Meteor*, you'll need to have your Meteor app fully working on the
desired platform before installing this plugin and packaging your app.

So, at this time, you cannot package your app in a cross-platform fashion from
one single OS.

Perhaps you can live with it? :)

## Customizing 

  1. You'll notice a new folder called `.electrify` in your project root folder.
  2. This is the place where your `electrified` app will live.
  3. Inside of it, there will be a `package.json` and `index.js` file.
  4. They are simple templates with the minimum amount of code for it to work.
  5. Customize them as you need, it's a plain Electron project.
  6. Just pay attention, keep the `elecrify` start/stop process working.
  7. Also keep the Electron `node-integration = off`.

````javascript
var app       = require('app');
var browser   = require('browser-window');
var electrify = require('electrify');

var window    = null;

app.on('ready', function() {

  window = new browser({
    width: 1200,
    height: 900,
    'node-integration': false                  // <~ node-integration = off
  });
  
  electrify.start(function(meteor_root_url) {  // <~ electrify:start
    window.loadUrl(meteor_root_url);
  });

});

app.on('window-all-closed', function() {
  app.quit();
});

app.on('will-quit', function(event) {
  electrify.shutdown(app, event);              // <~ electrify:stop
});
````

## Voilà

I started this project after being unable to accomplhish the same things using:

 * [Electrometeor](https://github.com/sircharleswatson/Electrometeor) 
 * [Meteor-Electron](https://github.com/jrudio/meteor-electron)

However I'd like to thank these authors for all the inspiration.

I'd also like to thank [Hems](https://github.com/hems) for the first insights.

> This package differs from `Electrometeor` and `meteor-electron` in the way it
requires absolute no learning curve and is heavily tested against Osx, Linux
and Windows.

## Problems?

This is very young and active software, so make sure your are always up to date
before opening an issue.

Follow the released fixes through the [HYSTORY.md](HYSTORY.md) file.

## License

The MIT License (MIT)

Copyright (c) 2015 Anderson Arboleya