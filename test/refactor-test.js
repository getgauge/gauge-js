var assert = require( "chai" ).assert;
var protobuf = require( "protobufjs" );
var stepRegistry = require("../src/step-registry");

var refactor = require( "../src/refactor" );
var factory = require( "../src/response-factory" );
var fs = require( "fs" );
var sinon = require( "sinon" );

var sandbox, request, response;
var contentInput, contentOutput, outputFile, info;

describe( "Refactor", function () {
  var message = null;
  this.timeout(10000);
  before( function (done) {
    sandbox = sinon.sandbox.create();

    sandbox.stub( fs, "readFileSync").callsFake(function () {
      return contentInput;
    });

    sandbox.stub( fs, "writeFileSync").callsFake(function ( file, data ) {
      outputFile = file;
      contentOutput = data;
    });

    sandbox.stub( stepRegistry, "get").callsFake(function () {
      return info;
    });
    protobuf.load("gauge-proto/messages.proto").then(function(root){
      message = root.lookupType("gauge.messages.Message");
      done();
    });
  });

  beforeEach( function () {
    response = factory.createRefactorResponse(message, 123);
  });

  after( function () {
    sandbox.restore();
  });

  it( "Should refactor step text without changing function ref", function () {
    var output = [];
    output.push( "var vowels=[\n    \'a\',\n    \'e\',\n    \'i\',\n    \'o\',\n    \'u\'\n];" );
    output.push( "hakunaMatata('What a wonderful phrase!');" );
    output.push( "gauge.step('The word <word> has <number> vowels.', function (word, number) {\n});" );
    output.push( "var myfn = function (number) {\n};" );
    output.push( "gauge.step('There are <number> vowels.', myfn);" );
    contentInput = output.join( "\n" );

    request = {
      refactorRequest: {
        oldStepValue: {
          stepValue: "The word {} has {} vowels.",
          parameterizedStepValue: "The word <word> has <number> vowels.",
          parameters: [ "word", "number" ]
        },
        newStepValue: {
          stepValue: "This English word {} has {} vowels.",
          parameterizedStepValue: "This English word <word> has <number> vowels.",
          parameters: [ "word", "number" ]
        },
        paramPositions: [ {
          oldPosition: 0,
          newPosition: 0
        }, {
          oldPosition: 1,
          newPosition: 1
        } ]
      }
    };

    info = {
      fn: function ( word, number ) { word = "such"; number = "wow"; },
      stepText: "The word <word> has <number> vowels.",
      generalisedText: "The word {} has {} vowels.",
      fileLocations: [{filePath: "test/data/refactor-output.js"}]
    };

    response = refactor( request, response, fs );
    assert.strictEqual( response.refactorResponse.error, "" );
    assert.strictEqual( response.refactorResponse.success, true );
    assert.strictEqual( response.refactorResponse.filesChanged.length, 1 );
  });

  it( "Should refactor global step text without changing function ref", function () {
    var output = [];
    output.push( "var vowels=[\n    \'a\',\n    \'e\',\n    \'i\',\n    \'o\',\n    \'u\'\n];" );
    output.push( "hakunaMatata('What a wonderful phrase!');" );
    output.push( "gauge.step('The word <word> has <number> vowels.', function (word, number) {\n});" );
    output.push( "var myfn = function (number) {\n};" );
    output.push( "step('There are <number> vowels.', myfn);" );
    contentInput = output.join( "\n" );

    request = {
      refactorRequest: {
        oldStepValue: {
          stepValue: "The word {} has {} vowels.",
          parameterizedStepValue: "The word <word> has <number> vowels.",
          parameters: [ "word", "number" ]
        },
        newStepValue: {
          stepValue: "This English word {} has {} vowels.",
          parameterizedStepValue: "This English word <word> has <number> vowels.",
          parameters: [ "word", "number" ]
        },
        paramPositions: [ {
          oldPosition: 0,
          newPosition: 0
        }, {
          oldPosition: 1,
          newPosition: 1
        } ]
      }
    };

    info = {
      fn: function ( word, number ) { word = "such"; number = "wow"; },
      stepText: "The word <word> has <number> vowels.",
      generalisedText: "The word {} has {} vowels.",
      fileLocations: [{filePath: "test/data/refactor-output.js"}]
    };

    response = refactor( request, response, fs );
    assert.strictEqual( response.refactorResponse.error, "" );
    assert.strictEqual( response.refactorResponse.success, true );
    assert.strictEqual( response.refactorResponse.filesChanged.length, 1 );
  });

  it( "Should perform refactoring when param names are changed", function () {
    contentInput = "gauge.step('The word <word> has <number> vowels.', function (word, number) {\n});";
    request = {
      refactorRequest: {
        oldStepValue: {
          stepValue: "The word {} has {} vowels.",
          parameterizedStepValue: "The word <word> has <number> vowels.",
          parameters: [ "word", "number" ]
        },
        newStepValue: {
          stepValue: "This English word {} has {} vowels.",
          parameterizedStepValue: "This English word <word_en> has <numbers> vowels.",
          parameters: [ "word_en", "numbers" ]
        },
        paramPositions: [ {
          oldPosition: -1,
          newPosition: 0
        }, {
          oldPosition: -1,
          newPosition: 1
        } ]
      }
    };

    info = {
      fn: function ( word, number ) { word = "such"; number = "wow"; },
      stepText: "The word <word> has <number> vowels.",
      generalisedText: "The word {} has {} vowels.",
      fileLocations: [{filePath: "test/data/refactor-output.js"}]
    };

    response = refactor( request, response );

    assert.strictEqual( contentOutput, "gauge.step('This English word <word_en> has <numbers> vowels.', function (word_en, numbers) {\n});");
  });

  it( "Should perform refactoring for global step when param names are changed", function () {
    contentInput = "step('The word <word> has <number> vowels.', function (word, number) {\n});";
    request = {
      refactorRequest: {
        oldStepValue: {
          stepValue: "The word {} has {} vowels.",
          parameterizedStepValue: "The word <word> has <number> vowels.",
          parameters: [ "word", "number" ]
        },
        newStepValue: {
          stepValue: "This English word {} has {} vowels.",
          parameterizedStepValue: "This English word <word_en> has <numbers> vowels.",
          parameters: [ "word_en", "numbers" ]
        },
        paramPositions: [ {
          oldPosition: -1,
          newPosition: 0
        }, {
          oldPosition: -1,
          newPosition: 1
        } ]
      }
    };

    info = {
      fn: function ( word, number ) { word = "such"; number = "wow"; },
      stepText: "The word <word> has <number> vowels.",
      generalisedText: "The word {} has {} vowels.",
      fileLocations: [{filePath: "test/data/refactor-output.js"}]
    };

    response = refactor( request, response );

    assert.strictEqual( contentOutput, "step('This English word <word_en> has <numbers> vowels.', function (word_en, numbers) {\n});");
  });

  it( "Should perform refactoring when params are removed", function () {
    contentInput = "gauge.step('The word <word> has <number> vowels.', function (word, number) {\n});";
    request = {
      refactorRequest: {
        oldStepValue: {
          stepValue: "The word {} has {} vowels.",
          parameterizedStepValue: "The word <word> has <number> vowels.",
          parameters: [ "word", "number" ]
        },
        newStepValue: {
          stepValue: "This English word {} has {} vowels.",
          parameterizedStepValue: "This English word has <numbers> vowels.",
          parameters: [ "numbers" ]
        },
        paramPositions: [ {
          oldPosition: -1,
          newPosition: 0
        }]
      }
    };

    info = {
      fn: function ( word, number ) { word = "such"; number = "wow"; },
      stepText: "The word <word> has <number> vowels.",
      generalisedText: "The word {} has {} vowels.",
      fileLocations: [{filePath: "test/data/refactor-output.js"}]
    };

    response = refactor( request, response );

    assert.strictEqual( contentOutput, "gauge.step('This English word has <numbers> vowels.', function (numbers) {\n});");
  });

  it( "Should perform refactoring for global when params are removed", function () {
    contentInput = "step('The word <word> has <number> vowels.', function (word, number) {\n});";
    request = {
      refactorRequest: {
        oldStepValue: {
          stepValue: "The word {} has {} vowels.",
          parameterizedStepValue: "The word <word> has <number> vowels.",
          parameters: [ "word", "number" ]
        },
        newStepValue: {
          stepValue: "This English word {} has {} vowels.",
          parameterizedStepValue: "This English word has <numbers> vowels.",
          parameters: [ "numbers" ]
        },
        paramPositions: [ {
          oldPosition: -1,
          newPosition: 0
        }]
      }
    };

    info = {
      fn: function ( word, number ) { word = "such"; number = "wow"; },
      stepText: "The word <word> has <number> vowels.",
      generalisedText: "The word {} has {} vowels.",
      fileLocations: [{filePath: "test/data/refactor-output.js"}]
    };

    response = refactor( request, response );

    assert.strictEqual( contentOutput, "step('This English word has <numbers> vowels.', function (numbers) {\n});");
  });

  it( "Should perform refactoring when params are reordered", function () {
    contentInput = "gauge.step('The word <word> has <number> vowels.', function (word, number) {\n});";
    request = {
      refactorRequest: {
        oldStepValue: {
          stepValue: "The word {} has {} vowels.",
          parameterizedStepValue: "The word <word> has <number> vowels.",
          parameters: [ "word", "number" ]
        },
        newStepValue: {
          stepValue: "There are {} vowels in the word {}",
          parameterizedStepValue: "There are <number> vowels in the word <word>.",
          parameters: [ "number", "word" ]
        },
        paramPositions: [ {
          oldPosition: 0,
          newPosition: 1
        }, {
          oldPosition: 1,
          newPosition: 0
        } ]
      }
    };

    info = {
      fn: function ( word, number ) { word = "such"; number = "wow"; },
      stepText: "The word <word> has <number> vowels.",
      generalisedText: "The word {} has {} vowels.",
      fileLocations: [{filePath: "test/data/refactor-output.js"}]
    };

    response = refactor( request, response );

    assert.strictEqual( contentOutput, "gauge.step('There are <number> vowels in the word <word>.', function (number, word) {\n});");
  });

  it( "Should perform refactoring for global step when params are reordered", function () {
    contentInput = "step('The word <word> has <number> vowels.', function (word, number) {\n});";
    request = {
      refactorRequest: {
        oldStepValue: {
          stepValue: "The word {} has {} vowels.",
          parameterizedStepValue: "The word <word> has <number> vowels.",
          parameters: [ "word", "number" ]
        },
        newStepValue: {
          stepValue: "There are {} vowels in the word {}",
          parameterizedStepValue: "There are <number> vowels in the word <word>.",
          parameters: [ "number", "word" ]
        },
        paramPositions: [ {
          oldPosition: 0,
          newPosition: 1
        }, {
          oldPosition: 1,
          newPosition: 0
        } ]
      }
    };

    info = {
      fn: function ( word, number ) { word = "such"; number = "wow"; },
      stepText: "The word <word> has <number> vowels.",
      generalisedText: "The word {} has {} vowels.",
      fileLocations: [{filePath: "test/data/refactor-output.js"}]
    };

    response = refactor( request, response );

    assert.strictEqual( contentOutput, "step('There are <number> vowels in the word <word>.', function (number, word) {\n});");
  });

  it( "Should perform refactoring when new params are added", function () {
    contentInput = "gauge.step('The word <word> has <number> vowels.', function (word, number) {\n});";
    request = {
      refactorRequest: {
        oldStepValue: {
          stepValue: "The word {} has {} vowels.",
          parameterizedStepValue: "The word <word> has <number> vowels.",
          parameters: [ "word", "number" ]
        },
        newStepValue: {
          stepValue: "The word {} has {} vowels and ends with {}.",
          parameterizedStepValue: "The word <word> has <number> vowels and ends with <end_letter>.",
          parameters: [ "word", "number", "end_letter" ]
        },
        paramPositions: [ {
          oldPosition: -1,
          newPosition: 0
        }, {
          oldPosition: -1,
          newPosition: 2
        }, {
          oldPosition: 0,
          newPosition: 1
        } ]
      }
    };

    info = {
      fn: function ( word, number ) { word = "such"; number = "wow"; },
      stepText: "The word <word> has <number> vowels.",
      generalisedText: "The word {} has {} vowels.",
      fileLocations: [{filePath: "test/data/refactor-output.js"}]
    };

    response = refactor( request, response );

    assert.strictEqual( contentOutput, "gauge.step('The word <word> has <number> vowels and ends with <end_letter>.', function (word, number, end_letter) {\n});");
  });

  it( "Should perform refactoring for global step when new params are added", function () {
    contentInput = "step('The word <word> has <number> vowels.', function (word, number) {\n});";
    request = {
      refactorRequest: {
        oldStepValue: {
          stepValue: "The word {} has {} vowels.",
          parameterizedStepValue: "The word <word> has <number> vowels.",
          parameters: [ "word", "number" ]
        },
        newStepValue: {
          stepValue: "The word {} has {} vowels and ends with {}.",
          parameterizedStepValue: "The word <word> has <number> vowels and ends with <end_letter>.",
          parameters: [ "word", "number", "end_letter" ]
        },
        paramPositions: [ {
          oldPosition: -1,
          newPosition: 0
        }, {
          oldPosition: -1,
          newPosition: 2
        }, {
          oldPosition: 0,
          newPosition: 1
        } ]
      }
    };

    info = {
      fn: function ( word, number ) { word = "such"; number = "wow"; },
      stepText: "The word <word> has <number> vowels.",
      generalisedText: "The word {} has {} vowels.",
      fileLocations: [{filePath: "test/data/refactor-output.js"}]
    };

    response = refactor( request, response );

    assert.strictEqual( contentOutput, "step('The word <word> has <number> vowels and ends with <end_letter>.', function (word, number, end_letter) {\n});");
  });

  it( "Should perform refactoring while retaining callbacks for async step implementation calls", function () {
    contentInput = "gauge.step('The word <word> has <number> vowels.', function (word, number, done) {\n});";
    request = {
      refactorRequest: {
        oldStepValue: {
          stepValue: "The word {} has {} vowels.",
          parameterizedStepValue: "The word <word> has <number> vowels.",
          parameters: [ "word", "number" ]
        },
        newStepValue: {
          stepValue: "This English word {} has {} vowels.",
          parameterizedStepValue: "This English word <word> has <numbers> vowels.",
          parameters: [ "word", "numbers" ]
        },
        paramPositions: [ {
          oldPosition: -1,
          newPosition: 1
        }, {
          oldPosition: 0,
          newPosition: 0
        } ]
      }
    };

    info = {
      fn: function ( word, number, done ) { word = "such"; number = "wow"; done = "phew."; },
      stepText: "The word <word> has <number> vowels.",
      generalisedText: "The word {} has {} vowels.",
      fileLocations: [{filePath: "test/data/refactor-output.js"}]
    };

    response = refactor( request, response );

    assert.strictEqual( contentOutput, "gauge.step('This English word <word> has <numbers> vowels.', function (word, numbers, done) {\n});");
  });

  it( "Should perform refactoring while retaining callbacks for async for global step implementation calls", function () {
    contentInput = "step('The word <word> has <number> vowels.', function (word, number, done) {\n});";
    request = {
      refactorRequest: {
        oldStepValue: {
          stepValue: "The word {} has {} vowels.",
          parameterizedStepValue: "The word <word> has <number> vowels.",
          parameters: [ "word", "number" ]
        },
        newStepValue: {
          stepValue: "This English word {} has {} vowels.",
          parameterizedStepValue: "This English word <word> has <numbers> vowels.",
          parameters: [ "word", "numbers" ]
        },
        paramPositions: [ {
          oldPosition: -1,
          newPosition: 1
        }, {
          oldPosition: 0,
          newPosition: 0
        } ]
      }
    };

    info = {
      fn: function ( word, number, done ) { word = "such"; number = "wow"; done = "phew."; },
      stepText: "The word <word> has <number> vowels.",
      generalisedText: "The word {} has {} vowels.",
      fileLocations: [{filePath: "test/data/refactor-output.js"}]
    };

    response = refactor( request, response );

    assert.strictEqual( contentOutput, "step('This English word <word> has <numbers> vowels.', function (word, numbers, done) {\n});");
  });
});
