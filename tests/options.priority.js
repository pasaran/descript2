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

describe( 'options.priority', function() {

    it( 'priority in object', function( done ) {
        const b1 = create_block(
            helpers.wrap( { foo: 42 }, 100 ),
            {
                priority: 100,
                select: {
                    foo: de.jexpr( '.foo' )
                }
            }
        );
        const b2 = create_block(
            helpers.wrap( { bar: 24 }, 20 ),
            {
                priority: 50,
                select: {
                    bar: de.jexpr( '.bar' )
                }
            }
        );
        const b3 = create_block(
            helpers.wrap( de.jexpr( 'state.foo + state.bar' ), 30 )
        );

        const context = create_context();
        context.run( {
            foo: b1,
            bar: b2,
            quu: b3
        } )
            .then( function( result ) {
                expect( result.quu ).to.be.eql( 66 );

                done();
            } );

    } );

    it( 'priority in array', function( done ) {
        const b1 = create_block(
            helpers.wrap( { foo: 42 }, 100 ),
            {
                priority: 100,
                select: {
                    foo: de.jexpr( '.foo' )
                }
            }
        );
        const b2 = create_block(
            helpers.wrap( { bar: 24 }, 20 ),
            {
                priority: 50,
                select: {
                    bar: de.jexpr( '.bar' )
                }
            }
        );
        const b3 = create_block(
            helpers.wrap( de.jexpr( 'state.foo + state.bar' ), 30 )
        );

        const context = create_context();
        context.run( [ b1, b2, b3 ] )
            .then( function( result ) {
                expect( result[ 2 ] ).to.be.eql( 66 );

                done();
            } );

    } );

} );

