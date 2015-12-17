'use strict';

var AMQP = require('amqp-promises');

describe('AMQP', function() {
  var config = require('./config');
  var configRKArray = require('./configRKArray');

  describe('#connect', function() {
    it('should return a promise', function() {
      var amqp = AMQP(config);
      return amqp.connect();
    });
  });
});
