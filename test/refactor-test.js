/* globals  stepRegistry */

var assert = require( "chai" ).assert;

require( "../src/gauge-global" );

var refactor = require( "../src/refactor" );
var factory = require( "../src/response-factory" );
var fs = require( "fs" );
var sinon = require( "sinon" );

var sandbox, request, response;
var contentInput, contentOutput, outputFile, info;

describe( "Refactor", function () {

  before( function () {
    sandbox = sinon.sandbox.create();

    sandbox.stub( fs, "readFileSync", function () {
      return contentInput;
    });

    sandbox.stub( fs, "writeFileSync", function ( file, data ) {
      outputFile = file;
      contentOutput = data;
    });

    sandbox.stub( stepRegistry, "get", function () {
      return info;
    });
  });

  beforeEach( function () {
    response = factory.createRefactorResponse( 123 );
  });

  after( function () {
    sandbox.restore();
  });

  it( "Should refactor step text without changing function ref", function () {
    var output = [];
    output.push( "var vowels=[\n    \'a\',\n    \'e\',\n    \'i\',\n    \'o\',\n    \'u\'\n];" );
    output.push( "hakunaMatata('What a wonderful phrase!');" );
    output.push( "gauge('The word <word> has <number> vowels.', function (word, number) {\n});" );
    output.push( "var myfn = function (number) {\n};" );
    output.push( "gauge('There are <number> vowels.', myfn);" );
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
      filePath: "test/data/refactor-output.js"
    };

    response = refactor( request, response, fs );
    assert.strictEqual( response.refactorResponse.error, "" );
    assert.strictEqual( response.refactorResponse.success, true );
    assert.strictEqual( response.refactorResponse.filesChanged.length, 1 );
  });

  it( "Should perform refactoring when param names are changed", function () {
    contentInput = "gauge('The word <word> has <number> vowels.', function (word, number) {\n});";
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
      filePath: "test/data/refactor-output.js"
    };

    response = refactor( request, response );

    assert.strictEqual( contentOutput, "gauge('This English word <word_en> has <numbers> vowels.', function (word_en, numbers) {\n});");
  });

  it( "Should perform refactoring when params are removed", function () {
    contentInput = "gauge('The word <word> has <number> vowels.', function (word, number) {\n});";
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
      filePath: "test/data/refactor-output.js"
    };

    response = refactor( request, response );

    assert.strictEqual( contentOutput, "gauge('This English word has <numbers> vowels.', function (numbers) {\n});");
  });

  it( "Should perform refactoring when params are reordered", function () {
    contentInput = "gauge('The word <word> has <number> vowels.', function (word, number) {\n});";
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
      filePath: "test/data/refactor-output.js"
    };

    response = refactor( request, response );

    assert.strictEqual( contentOutput, "gauge('There are <number> vowels in the word <word>.', function (number, word) {\n});");
  });

  it( "Should perform refactoring when new params are added", function () {
    contentInput = "gauge('The word <word> has <number> vowels.', function (word, number) {\n});";
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
      filePath: "test/data/refactor-output.js"
    };

    response = refactor( request, response );

    assert.strictEqual( contentOutput, "gauge('The word <word> has <number> vowels and ends with <end_letter>.', function (word, number, end_letter) {\n});");
  });
});
