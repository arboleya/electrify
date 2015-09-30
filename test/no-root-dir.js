describe('[electrify] no root dir', function(){
  var should = require('should');

  var electrify = require('../lib');

  it('should rise error when no root folder is informed', function(){
    should.throws(function(){
      electrify();
    });
  });

});