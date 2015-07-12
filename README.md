# Electrify

Easily package your Meteor apps with Electron, and *butter*.

# Compatibility

  - Osx: ✓
  - Linux: 
    - 64bit: ✓
    - 32bit: ✓
  - Win7: 
    - 64bit: ✓
    - 32bit: ✓

# Installation

````shell
meteor add arboleya:electrify
````

# Packaging

Keep your `meteor` running, fire up a second terminal tab and enter Meteor's
interactive shell:

````shell
meteor shell
````

Once inside it, execute the `electrify` command:

````shell
electrify
````

Press enter.

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
on single OS.

Perhaps you can live with it? :)

# Customizing 

  1. You'll notice a new folder called `.electrify` in your project root folder.
  2. This is the place where your `electrified` app will live.
  3. Inside of it, there will be a `package.json` and `index.js` file.
  4. They are simple templates with the minimum amount of code for it to work.
  5. Customize them as you need, it's a plain Electron project.
  6. Just pay attention, keep the `elecrify` boot/shutdown process working.
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
    'node-integration': false                // <~ node-integration = off
  });
  
  electrify.boot(function() {                // <~ electrify:boot
    window.loadUrl(electrify.meteor_url);
  });

});


app.on('will-quit', function(event) {
  electrify.shutdown(app, event);            // <~ electrify:shutdown
});

app.on('window-all-closed', function() {
  app.quit();
});
````

# Voilà

I started this project after being unable to accomplhish the same things using:

 * [Electrometeor](https://github.com/sircharleswatson/Electrometeor) 
 * [Meteor-Electron](https://github.com/jrudio/meteor-electron)

I would like to thank [Hems](https://github.com/hems) for the need for such
a tool, otherwise I could ended up not not having the interest to build it.

I would also like also to thank the authors of
[Electrometeor](https://github.com/sircharleswatson/Electrometeor) and
[Meteor-Electron](https://github.com/jrudio/meteor-electron) for all the
inspiration.

# Differences

This package differs from `Electrometeor` and `meteor-electron` in the way it
requires absolute no learning curve and is heavily tested against Osx, Linux and
Windows.
# License

The MIT License (MIT)

Copyright (c) 2015 Anderson Arboleya

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the "Software"), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
the Software, and to permit persons to whom the Software is furnished to do so,
subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.