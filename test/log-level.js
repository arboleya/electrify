describe('[electrify] log.js', function(){
  
  require('should');

  var logger = require('../lib/log');

  var log, buffer, reallog, default_level = process.env.LOGELECTRIFY;

  function proxy(){
    reallog = console.log;
    console.log = function(){
      buffer.push(Array.prototype.slice.call(arguments).join(' '));
    };
  }

  function unproxy(){
    console.log = reallog;
    process.env.LOGELECTRIFY = default_level;
  }

  function log_all(level) {
    process.env.LOGELECTRIFY = level;
    
    buffer = [];
    log = logger(null, 'testing');
    
    // do not alter this order or the tests will fail
    log.info('samples info');
    log.trace('samples trace');
    log.warn('samples warn');
    log.error('samples error');
    log.debug('samples debug');
  }

  it('should print only DEBUG,TRACE', function(){
    proxy();
    log_all('DEBUG,TRACE');
    buffer.length.should.equal(2);
    /TRACE/i.test(buffer[0]).should.be.ok();
    /DEBUG/i.test(buffer[1]).should.be.ok();
    unproxy();
  });

  it('should print only WARN,ERROR', function(){
    proxy();
    log_all('WARN,ERROR');
    buffer.length.should.equal(2);
    /WARN/i.test(buffer[0]).should.be.ok();
    /ERROR/i.test(buffer[1]).should.be.ok();
    unproxy();
  });

  it('should print only INFO', function(){
    proxy();
    log_all('INFO');
    buffer.length.should.equal(1);
    /INFO/i.test(buffer[0]).should.be.ok(); 
    unproxy();
  });

  it('should print ALL', function(){
    proxy();
    log_all('ALL');
    buffer.length.should.equal(5);
    /INFO/i.test(buffer[0]).should.be.ok();
    /TRACE/i.test(buffer[1]).should.be.ok();
    /WARN/i.test(buffer[2]).should.be.ok();
    /ERROR/i.test(buffer[3]).should.be.ok();
    /DEBUG/i.test(buffer[4]).should.be.ok();
    unproxy();
  });

  it('should print NOTHING', function(){
    proxy();
    log_all('NONE');
    buffer.length.should.equal(0);
    unproxy();
  });
});