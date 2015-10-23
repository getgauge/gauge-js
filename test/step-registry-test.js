var assert = require('chai').assert;
var StepRegistry = require('../step-registry');

describe('Store and retrieve steps', function(){

   it('Should store and retrive steps', function(done) {
       var sampleFunction = function() {};
       var stepRegistry = new StepRegistry();

       stepRegistry.add('Sample Step', sampleFunction);

       assert.equal(sampleFunction, stepRegistry.get('Sample Step'));
       done();
   })

});