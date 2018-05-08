/* eslint-env mocha */

var expect = require( 'expect.js' );

var de = require( '../lib/index.js' );

var helpers = require( './_helpers.js' );

const ERROR_ID = 'RESULT_ERROR';

//  ---------------------------------------------------------------------------------------------------------------  //

function create_block( block, options ) {
    return de.func( {
        block: block,
        options: options
    } );
}

//  ---------------------------------------------------------------------------------------------------------------  //

describe( 'options.result', function() {

    it( 'result is a function', function( done ) {
        var _params = { id: 24 };
        var _result_1 = { foo: true };
        var _result_2 = { bar: true };
        var _context = helpers.context();
        const _state = {};

        var block = create_block(
            helpers.wrap( _result_1 ),
            {
                id: 'first',
                result: function( params, context, state, result ) {
                    expect( params ).not.to.be( _params );
                    expect( params ).to.be.eql( _params );
                    expect( context ).to.be( _context );
                    expect( state ).to.be( _state );
                    expect( result ).to.be( _result_1 );

                    return _result_2;
                }
            }
        );

        _context.run( block, _params, _state )
            .then( function( result ) {
                expect( result ).to.be( _result_2 );

                done();
            } );
    } );

    it( 'result is an array of functions', function( done ) {
        var _result_1 = { foo: true };
        var _result_2 = { bar: true };
        var _result_3 = { quu: true };

        var block = create_block(
            helpers.wrap( _result_1 ),
            {
                result: [
                    function( params, context, state, result ) {
                        expect( result ).to.be( _result_1 );

                        return _result_2;
                    },

                    function( params, context, state, result ) {
                        expect( result ).to.be( _result_2 );

                        return _result_3;
                    }
                ]
            }
        );

        var context = helpers.context();
        context.run( block )
            .then( function( result ) {
                expect( result ).to.be( _result_3 );

                done();
            } );
    } );

    it( 'result is a jexpr', function( done ) {
        var block = create_block(
            helpers.wrap( {
                foo: {
                    bar: 42
                },
                quu: 24
            } ),
            {
                before: function( params, context, state ) {
                    state.boo = {
                        zee: 88
                    };
                },
                result: {
                    bar: {
                        foo: de.jexpr( '.foo.bar' ),
                        quu: de.jexpr( '.quu' )
                    },
                    id: de.jexpr( 'params.id' ),
                    zee: de.jexpr( 'state.boo.zee' ),
                    boo: [
                        de.jexpr( '.quu' ),
                        de.jexpr( '.foo.bar' )
                    ]
                }
            }
        );

        var context = helpers.context();
        context.run( block, { id: 37 } )
            .then( function( result ) {
                expect( result ).to.be.eql( {
                    bar: {
                        foo: 42,
                        quu: 24
                    },
                    id: 37,
                    zee: 88,
                    boo: [ 24, 42 ]
                } );

                done();
            } );
    } );

    it( 'result is an array of jexprs', function( done ) {
        var block = create_block(
            helpers.wrap( {
                foo: {
                    bar: {
                        quu: 42
                    }
                }
            } ),
            {
                result: [
                    de.jexpr( '.foo' ),
                    de.jexpr( '.bar' )
                ]
            }
        );

        var context = helpers.context();
        context.run( block )
            .then( function( result ) {
                expect( result ).to.be.eql( {
                    quu: 42
                } );

                done();
            } );
    } );

    it( 'result and inherited result', function( done ) {
        var b1 = create_block(
            helpers.wrap( {
                foo: {
                    bar: {
                        quu: 42
                    }
                }
            } ),
            {
                result: de.jexpr( '.foo' )
            }
        );

        var b2 = b1( {
            options: {
                result: de.jexpr( '.bar' )
            }
        } );

        var context = helpers.context();
        context.run( b2 )
            .then( function( result ) {
                expect( result ).to.be.eql( {
                    quu: 42
                } );

                done();
            } );
    } );

    it( 'result with error #1', function( done ) {
        const block = create_block(
            helpers.wrap( {
                foo: 42
            }, 10 ),
            {
                result: function() {
                    throw new Error( ERROR_ID );
                }
            }
        );

        const context = helpers.context();
        context.run( block )
            .then( function( result ) {
                expect( result ).to.be.a( de.Error );
                expect( result.error.id ).to.be( 'Error' );
                expect( result.error.message ).to.be( ERROR_ID );

                done();
            } );
    } );

    it( 'result with error #2', function( done ) {
        const block = create_block(
            helpers.wrap( {
                foo: 42
            }, 10 ),
            {
                result: function() {
                    //  eslint-disable-next-line
                    return a;
                }
            }
        );

        const context = helpers.context();
        context.run( block )
            .then( function( result ) {
                expect( result ).to.be.a( de.Error );
                expect( result.error.id ).to.be( 'ReferenceError' );

                done();
            } );
    } );

    it( 'result with error #3', function( done ) {
        const block = create_block(
            helpers.wrap( {
                foo: 42
            }, 10 ),
            {
                result: function() {
                    return null.foo;
                }
            }
        );

        const context = helpers.context();
        context.run( block )
            .then( function( result ) {
                expect( result ).to.be.a( de.Error );
                expect( result.error.id ).to.be( 'TypeError' );

                done();
            } );
    } );

} );

