/* eslint-env mocha */

var expect = require( 'expect.js' );

var de = require( '../lib/index.js' );

const helpers = require( './_helpers.js' );

//  ---------------------------------------------------------------------------------------------------------------  //

function create_context() {
    return new de.Context.Base();
}

/*
function create_block( block, options ) {
    return de.func( {
        block: helpers.wrap( block ),
        options: options
    } );
}
*/

//  ---------------------------------------------------------------------------------------------------------------  //

describe( 'options.priority', function() {

    it( 'priority in object', function( done ) {
        const b1 = de.func( {
            block: helpers.wrap(
                function() {
                    return {
                        foo: 42
                    };
                },
                100
            ),
            options: {
                id: 'foo',
                priority: 100,
                select: {
                    foo: de.jexpr( '.foo' )
                }
            }
        } );
        const b2 = de.func( {
            block: helpers.wrap(
                function() {
                    return {
                        bar: 24
                    };
                },
                20
            ),
            options: {
                id: 'bar',
                priority: 50,
                select: {
                    bar: de.jexpr( '.bar' )
                }
            }
        } );
        const b3 = de.func( {
            block: helpers.wrap(
                function( params, context, state ) {
                    return state.foo + state.bar;
                },
                30
            ),
            options: {
                id: 'quu'
            }
        } );

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

} );

