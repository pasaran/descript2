/* eslint-env mocha */

const expect = require( 'expect.js' );

const de = require( '../lib/index.js' );

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

describe( 'options.required', function() {

    it( 'block in object is required and failed', function( done ) {
        const b1 = create_block(
            helpers.wrap( function() {
                return de.error( {
                    id: 'ERROR'
                } );
            }, 50 ),
            {
                required: true
            }
        );

        const b2 = create_block(
            helpers.wrap( { bar: 24 }, 50 ),
            {
            }
        );

        const context = create_context();
        context.run( {
            foo: b1,
            bar: b2,
        } )
            .then( function( result ) {
                expect( result ).to.be.a( de.Error );
                expect( result.error.id ).to.be.eql( 'REQUIRED_BLOCK_FAILED' );

                done();
            } );

    } );

} );

