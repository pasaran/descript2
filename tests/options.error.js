/* eslint-env mocha */

var expect = require( 'expect.js' );

var de = require( '../lib/index.js' );

var helpers = require( './_helpers.js' );

//  ---------------------------------------------------------------------------------------------------------------  //

var ERROR_ID = 'ERROR_ERROR';

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

} );

