module.exports = function($, prefix){
  return new Log($, prefix);
};

/*
  0.OFF
  1.INFO
  2.WARN
  3.ERROR
  4.TRACE
  5.DEBUG
  6.ALL
*/

function Log($, prefix) {
  this.$ = $;
  this.prefix = prefix;
}

Log.prototype.info = function(){
  if(/INFO|ALL/i.test(level()))
    log(this.prefix, 'INFO', slice(arguments));
};

Log.prototype.warn = function(){
  if(/WARN|ALL/i.test(level()))
    log(this.prefix, 'WARN', slice(arguments));
};

Log.prototype.error = function(){
  if(/ERROR|ALL/i.test(level()))
    log(this.prefix, 'ERROR', slice(arguments));
};

Log.prototype.debug = function(){
  if(/DEBUG|ALL/i.test(level()))
    log(this.prefix, 'DEBUG', slice(arguments));
};

Log.prototype.trace = function(){
  if(/TRACE|ALL/i.test(level()))
    log(this.prefix, 'TRACE', slice(arguments));
};

function level(){
  return process.env.LOGELECTRIFY || 'INFO,WARN,ERROR';
}

function slice(args) {
  return Array.prototype.slice.call(args, 0);
}

function log(prefix, type, args) {
  console.log.apply(null, [type + '  ' + prefix + ': '].concat(args));
  // var method = type.toLowerCase();
  // console[method].apply(null, [type + '  ' + prefix + ': '].concat(args));
}