# Electrify [![windows](https://img.shields.io/appveyor/ci/arboleya/electrify.svg?label=windows)](https://ci.appveyor.com/project/arboleya/electrify) [![travis](https://img.shields.io/travis/arboleya/electrify/master.svg?label=osx/linux)](https://travis-ci.org/arboleya/electrify) [![coverage](https://img.shields.io/codeclimate/coverage/github/arboleya/electrify.svg)](https://codeclimate.com/github/arboleya/electrify/coverage) [![join the chat at https://gitter.im/arboleya/electrify](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/arboleya/electrify)


Easily package your Meteor apps with Electron, and *butter*.


## TL;DR

````shell
npm install -g electrify
cd /you/meteor/project
electrify
````
## Compatibility

Works on all Meteor's supported [platforms](https://github.com/meteor/meteor/wiki/Supported-Platforms).

## Installation

````shell
npm install -g electrify
````

## Packaging

````shell
cd /you/meteor/project
electrify package

# NOTE: Pass on Meteor's settings `--settings`
# electrify package --settings production.json
````

This will output your `Electron` app inside `.electrify/.dist` folder.

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

  electrify.start(function(meteor_root_url) {   //~> electrify:start
    window = new browser({
      width: 1200,
      height: 900,
      'node-integration': false                 //~> node integration off
    });
    window.loadUrl(meteor_root_url);
  });

});

app.on('window-all-closed', function() {
  app.quit();
});

app.on('will-quit', function(event) {
  electrify.stop();                             //~> electrify:stop
});
````

## Upgrading

When upgrading to newer versions, it's **important** to know that:

### ~> templates

Once these files exists on disk, they *will not* be overwritten.
 * `.electrify/index.js`
 * `.electrify/package.json`
 * `.electrify/.gitignore.json`

### ~> api

As these files above is never overwritten, in case of any API change the needed
adjustments will have to be made manually, following the example described
[above](#customizing).

### ~> version matching

Always keep the same electrify version in your Meteor, and inside the
`.electrify` folder, *as per specified in `.electrify/package.json` file*.

And if you prefer using Electrify globally with `npm install -g electrify`,
remember to keep it in the right version as well.

## Questions?

Do not open issues, use the chat channel instead.

[![Join the chat at https://gitter.im/arboleya/electrify](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/arboleya/electrify)

## Problems?

This is very young and active software, so make sure your are always up to date
before opening an issue. Follow the released fixes through the
[HYSTORY.md](HYSTORY.md) file.

If you find any problem, please open a meaningful issue describing in detail how
to reproduce the problem, which platform/os/arch type you're using, as well as
the version of Meteor and Electrify, and any other info you may find usefull.

## License

The MIT License (MIT)

Copyright (c) 2015 Anderson Arboleya