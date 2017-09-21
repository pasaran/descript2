/* eslint-env mocha */

var expect = require( 'expect.js' );

var de = require( '../lib/index.js' );

var helpers = require( './_helpers.js' );

//  ---------------------------------------------------------------------------------------------------------------  //

var ERROR_ID = 'ERROR_ERROR';
var ANOTHER_ERROR_ID = 'ANOTHER_ERROR_ERROR';
var YET_ANOTHER_ERROR_ID = 'YET_ANOTHER_ERROR_ERROR';

//  ---------------------------------------------------------------------------------------------------------------  //

function create_block( block, options ) {
    return de.func( {
        block: block,
        options: options
    } );
}

//  ---------------------------------------------------------------------------------------------------------------  //

describe( 'options.error', function() {

    it( 'do something on error', function( done ) {
        var error_was_called = false;
        var after_was_called = false;

        const block = create_block(
            helpers.wrap( function( params, context, state ) {
                return de.error( ERROR_ID );
            }, 50 ),
            {
                error: function( params, context, state, error ) {
                    error_was_called = true;
                },

                after: function( params, context, state, result ) {
                    after_was_called = true;
                }
            }
        );

        var context = helpers.context();
        context.run( block )
            .then( function( result ) {
                expect( result ).to.be.a( de.Error );
                expect( result.error.id ).to.be.eql( ERROR_ID );
                expect( error_was_called ).to.be.eql( true );
                expect( after_was_called ).to.be.eql( false );

                done();
            } );
    } );

    it( 'inherits options.error', function( done ) {
        var error_was_called = false;
        var after_was_called = false;

        const b1 = create_block(
            helpers.wrap( function( params, context, state ) {
                return de.error( ERROR_ID );
            }, 50 ),
            {
                error: function( params, context, state, error ) {
                    error_was_called = true;
                }
            }
        );

        const b2 = b1( {
            options: {

                after: function( params, context, state, result ) {
                    after_was_called = true;
                }

            }
        } );

        var context = helpers.context();
        context.run( b2 )
            .then( function( result ) {
                expect( result ).to.be.a( de.Error );
                expect( result.error.id ).to.be.eql( ERROR_ID );
                expect( error_was_called ).to.be.eql( true );
                expect( after_was_called ).to.be.eql( false );

                done();
            } );
    } );

    it( 'multiple options.error, base and child return undefined', function( done ) {
        var base_error_was_called = false;
        var child_error_was_called = false;

        const b1 = create_block(
            helpers.wrap( function( params, context, state ) {
                return de.error( ERROR_ID );
            }, 50 ),
            {
                error: function( params, context, state, error ) {
                    base_error_was_called = true;
                }
            }
        );

        const b2 = b1( {
            options: {

                error: function( params, context, state, result ) {
                    child_error_was_called = true;
                }

            }
        } );

        var context = helpers.context();
        context.run( b2 )
            .then( function( result ) {
                expect( result ).to.be.a( de.Error );
                expect( result.error.id ).to.be.eql( ERROR_ID );
                expect( base_error_was_called ).to.be.eql( true );
                expect( child_error_was_called ).to.be.eql( true );

                done();
            } );
    } );

    it( 'multiple options.error, base returns error', function( done ) {
        var base_error_was_called = false;
        var child_error_was_called = false;

        const b1 = create_block(
            helpers.wrap( function( params, context, state ) {
                return de.error( ERROR_ID );
            }, 50 ),
            {
                error: function( params, context, state, error ) {
                    base_error_was_called = true;

                    return de.error( ANOTHER_ERROR_ID );
                }
            }
        );

        const b2 = b1( {
            options: {

                error: function( params, context, state, result ) {
                    child_error_was_called = true;
                }

            }
        } );

        var context = helpers.context();
        context.run( b2 )
            .then( function( result ) {
                expect( result ).to.be.a( de.Error );
                expect( result.error.id ).to.be.eql( ANOTHER_ERROR_ID );
                expect( base_error_was_called ).to.be.eql( true );
                expect( child_error_was_called ).to.be.eql( true );

                done();
            } );
    } );

    it( 'multiple options.error, base and child return error', function( done ) {
        var base_error_was_called = false;
        var child_error_was_called = false;

        const b1 = create_block(
            helpers.wrap( function( params, context, state ) {
                return de.error( ERROR_ID );
            }, 50 ),
            {
                error: function( params, context, state, error ) {
                    base_error_was_called = true;

                    return de.error( ANOTHER_ERROR_ID );
                }
            }
        );

        const b2 = b1( {
            options: {

                error: function( params, context, state, result ) {
                    child_error_was_called = true;

                    return de.error( YET_ANOTHER_ERROR_ID );
                }

            }
        } );

        var context = helpers.context();
        context.run( b2 )
            .then( function( result ) {
                expect( result ).to.be.a( de.Error );
                expect( result.error.id ).to.be.eql( YET_ANOTHER_ERROR_ID );
                expect( base_error_was_called ).to.be.eql( true );
                expect( child_error_was_called ).to.be.eql( true );

                done();
            } );
    } );

    it( 'multiple options.error, base return value', function( done ) {
        var base_error_was_called = false;
        var child_error_was_called = false;

        const b1 = create_block(
            helpers.wrap( function( params, context, state ) {
                return de.error( ERROR_ID );
            }, 50 ),
            {
                error: function( params, context, state, error ) {
                    base_error_was_called = true;

                    return {
                        foo: 42
                    };
                }
            }
        );

        const b2 = b1( {
            options: {

                error: function( params, context, state, result ) {
                    child_error_was_called = true;
                }

            }
        } );

        var context = helpers.context();
        context.run( b2 )
            .then( function( result ) {
                expect( result ).to.not.be.a( de.Error );
                expect( result ).to.be.eql( { foo: 42 } );
                expect( base_error_was_called ).to.be.eql( true );
                expect( child_error_was_called ).to.be.eql( false );

                done();
            } );
    } );

} );

