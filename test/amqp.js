var AMQP = require('../amqp'),
    SandboxedModule = require('sandboxed-module'),
    expect = require('chai').expect,
    sinon = require('sinon'),
    $ = require('lodash');

describe('AMQP', function() {
  describe('#connect', function() {
    it('should call the callback successfully', function(done) {
      AMQP.connect(process.env.AMQP_URL, process.env.AMQP_EXCHANGE, {
        consumeQueue: process.env.AMQP_CONSUME_QUEUE,
        publishQueue: process.env.AMQP_PUBLISH_QUEUE,
        publishQueueRoutingKey: process.env.AMQP_PUBLISH_QUEUE_ROUTING_KEY
      }, function(err, res) {
        if (err) return done(err);
        done();
      });
    });
  });
  describe('#publish', function() {
    it('should call the callback successfully', function(done) {
      AMQP.connect(process.env.AMQP_URL, process.env.AMQP_EXCHANGE, {
        publishQueue: process.env.AMQP_PUBLISH_QUEUE,
        publishQueueRoutingKey: process.env.AMQP_PUBLISH_QUEUE_ROUTING_KEY
      }, function(err, res) {
        if (err) return done(err);
        AMQP.publish(new Buffer('test'), function(err) {
          if (err) return done(err);
          done();
        });
      });
    });
  });
  describe('#consume', function() {
    function createMockedModuleObject(messageToDeliver, additionals) {
      var channelMock = {
        consume: function (a, handleMessage, b) {
          handleMessage({
            content: {
              toString: function() {return messageToDeliver;}
            }
          });
        }
      };

      return {
        locals: {
          channel: $.extend(channelMock, additionals)
        }
      };
    }

    it('if done(err) is called with err === null, calls ack().',
        function(done) {
      var ackSpy = sinon.spy(function(message) {
        done();
      });
      var mockedAMQP = SandboxedModule.require('../amqp',
        // message will be {}. Mock out 'ack' method.
        createMockedModuleObject('{}', {ack: ackSpy}));

      function myMessageHandler(parsedMsg, cb) {
        cb();
      }

      mockedAMQP.consume(myMessageHandler);
    });

    it('if json unparsable, calls nack() with requeue of false.',
        function(done) {
      var nackSpy = sinon.spy(function(message, upTo, requeue) {
        expect(requeue).to.equal(false);
        done();
      });

      var mockedAMQP = SandboxedModule.require('../amqp',
        // message will be invalid json. Mock out 'nack' method.
        createMockedModuleObject('nonvalidjson', {nack: nackSpy}));

      function myMessageHandler(parsedMsg, cb) {
        cb();
      }

      mockedAMQP.consume(myMessageHandler);
    });
    it('if json callback called with err, calls nack() with requeue as given.',
        function(done) {
      var nackSpy = sinon.spy(function(message, upTo, requeue) {
        expect(requeue).to.equal('requeue');
        done();
      });
      var mockedAMQP = SandboxedModule.require('../amqp',
        // message will be {}. Mock out 'nack' method.
        createMockedModuleObject('{}', {nack: nackSpy}));


      function myMessageHandler(parsedMsg, cb) {
        cb(new Error('got it bad'), 'requeue');
      }

      mockedAMQP.consume(myMessageHandler);
    });
  });
});

// vim: set et sw=2 ts=2 colorcolumn=80: