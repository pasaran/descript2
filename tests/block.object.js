/* eslint-env mocha */

var expect = require( 'expect.js' );

var de = require( '../lib/index.js' );

const helpers = require( './_helpers.js' );

//  ---------------------------------------------------------------------------------------------------------------  //

function create_context() {
    return new de.Context.Base();
}

function create_block( block, options ) {
    return de.func( {
        block: block,
        options: options
    } );
}

//  ---------------------------------------------------------------------------------------------------------------  //

describe( 'block.object', function() {

    it( 'same order of result keys', function( done ) {
        const b1 = create_block(
            helpers.wrap( 42, 100 )
        );
        const b2 = create_block(
            helpers.wrap( 24, 50 )
        );

        const context = create_context();
        context.run( {
            foo: b1,
            bar: b2
        } )
            .then( function( result ) {
                expect( Object.keys( result ) ).to.be.eql( [ 'foo', 'bar' ] );

                done();
            } );
    } );

} );

