var fs   = Npm.require('fs');
var path = Npm.require('path');


// gets info from the running main module to determine if meteor server is
// running from inside electron (after packaging) or not (before packaging)
// this will help us compute meteor's root folder, which is mandatory
// for electrify

var root_dir;

var main_path       = process.mainModule.filename;
var main_path_clean = main_path.split(path.sep).join('-');

// path=.meteor/local/build/mains.js (before being packaged)
var before_bundle = /\.meteor-local-build-main\.js$/m;

// app/app/mains.js (after being packaged)
var after_bundle  = /app-app-main\.js$/m;

// sets root dir
if(before_bundle.test(main_path_clean))
  root_dir = path.join(main_path, '..', '..', '..', '..');
else if(after_bundle.test(main_path_clean))
  root_dir = path.join(main_path, '..', '..');

Electrify = Npm.require('electrify')(root_dir, Meteor.settings);

// only move forward if the app hasn't been packaged
if(!Electrify.env.app.is_packaged && !Electrify.env.is_running_tests){
  Meteor.startup(function() {

    Electrify.scaffold.prepare();
    // a new electron window should be opened ONLY in the first time meteor-tool
    // starts the server, all others server restarts should be ignored

    // as `process.env.METEOR_PARENT_PID` stays the same between server restarts,
    // we save it just proceed opening the electron window when it differs from
    // the last time it was sabed

    var ppid_path = path.join(Electrify.env.core.tmp, '.electrify-ppid');
    var curr_ppid = process.env.METEOR_PARENT_PID;
    var prev_ppid;

    if(fs.existsSync(ppid_path))
      prev_ppid = fs.readFileSync(ppid_path);
    else
      prev_ppid = null;

    // if the current ppid differs from the last, move on and open a new window
    if(prev_ppid != curr_ppid) {
      // save the current ppid for next comparison
      fs.writeFileSync(ppid_path, curr_ppid);

      // start everything for development
      Electrify.app.run();
    }
  });
}