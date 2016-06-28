/* eslint-env mocha */

var expect = require( 'expect.js' );

var de = require( '../lib/index.js' );

var helpers = require( './_helpers.js' );

//  ---------------------------------------------------------------------------------------------------------------  //

function create_block( block, options ) {
    return de.value( {
        block: block,
        options: options
    } )._compile();
}

//  ---------------------------------------------------------------------------------------------------------------  //

describe( 'options.params', function() {

    it( 'no params or valid_params', function() {
        var block = create_block( null );

        var raw_params = {
            a: 42,
            b: 'hello',
            c: '',
            d: 0
        };

        var params = block._params( raw_params );

        expect( params ).to.be.eql( raw_params );
        expect( params ).not.to.be( raw_params );
    } );

    it( 'raw params with null and undefined value', function() {
        var block = create_block( null );

        var raw_params = {
            a: null,
            b: undefined,
            c: 42
        };

        var params = block._params( raw_params );

        expect( params ).to.be.eql( {
            c: 42
        } );
    } );

    it( 'params with null and undefined value', function() {
        var block = create_block( null, {
            params: {
                a: null,
                b: undefined
            }
        } );

        var raw_params = {
            a: 42,
            b: 24,
            c: 66
        };

        var params = block._params( raw_params );

        expect( params ).to.be.eql( {
            a: 42,
            b: 24,
            c: 66
        } );
    } );

    it( 'valid_params', function() {
        var block = create_block( null, {
            valid_params: {
                a: null,
                b: null,
                c: null,
                d: null,
                e: null,
                f: null,
                g: null
            }
        } );

        var raw_params = {
            a: 42,
            b: 'hello',
            c: true,
            d: '',
            e: 0,
            f: false,
            g: null,

            i: 24,
            j: 'bye',
            k: true,
            l: '',
            m: 0,
            n: false,
            o: null
        };

        var params = block._params( raw_params );

        expect( params ).to.be.eql( {
            a: 42,
            b: 'hello',
            c: true,
            d: '',
            e: 0,
            f: false
        } );
    } );

    it( 'valid_params with defaul values', function() {
        var block = create_block( null, {
            valid_params: {
                a: null,
                b: 24
            }
        } );

        var raw_params = {
            a: 42,
            c: 'hello'
        };

        var params = block._params( raw_params );

        expect( params ).to.be.eql( {
            a: 42,
            b: 24
        } );
    } );

    it( 'params is an object', function() {
        var block = create_block( null, {
            params: {
                a: de.jexpr( 'params.foo' ),
                b: function( params, context, state ) {
                    return params.bar;
                }
            }
        } );

        var raw_params = {
            foo: 42,
            bar: 24,
            quu: 66
        };

        var params = block._params( raw_params );

        expect( params ).to.be.eql( {
            a: 42,
            b: 24,
            foo: 42,
            bar: 24,
            quu: 66
        } );
    } );

    it( 'params is an object and valid_params', function() {
        var block = create_block( null, {
            valid_params: {
                a: null,
                b: null,
                quu: null
            },
            params: {
                a: de.jexpr( 'params.foo' ),
                c: de.jexpr( 'params.bar' )
            }
        } );

        var raw_params = {
            foo: 42,
            bar: 24,
            quu: 66
        };

        var params = block._params( raw_params );

        expect( params ).to.be.eql( {
            a: 42,
            quu: 66
        } );
    } );


    it( 'params is a object of values and functions', function() {
        var block = create_block( null, {
            params: {
                a: 42,
                b: function( params ) {
                    return params.c;
                },
                c: null
            }
        } );

        var raw_params = {
            a: 66,
            b: 24,
            c: 'hello',
            d: 0
        };

        var params = block._params( raw_params );

        expect( params ).to.be.eql( {
            a: 42,
            b: 'hello',
            c: 'hello',
            d: 0
        } );
    } );

    it( 'params and valid_params #1', function() {
        var block = create_block( null, {
            valid_params: {
                d: null
            },
            params: {
                a: 42,
                b: function( params ) {
                    return params.c;
                },
                c: de.jexpr( 'params.e' )
            }
        } );

        var raw_params = {
            a: 1,
            b: 2,
            c: 3,
            d: 4,
            e: 5
        };

        var params = block._params( raw_params );

        expect( params ).to.be.eql( {
            d: 4
        } );
    } );

    it( 'params and valid_params #2', function() {
        var block = create_block( null, {
            valid_params: {
                a: null,
                b: null,
                c: null
            },
            params: {
                a: 42,
                b: function( params ) {
                    return params.c;
                },
                c: de.jexpr( 'params.e' )
            }
        } );

        var raw_params = {
            a: 1,
            b: 2,
            c: 3,
            d: 4,
            e: 5
        };

        var params = block._params( raw_params );

        expect( params ).to.be.eql( {
            a: 42,
            b: 3,
            c: 5
        } );
    } );

    it( 'params is a function', function() {
        var block = create_block( null, {
            params: function( params ) {
                return {
                    a: 42,
                    b: params.c
                };
            }
        } );

        var raw_params = {
            c: 24,
            d: 66
        };

        var params = block._params( raw_params );

        expect( params ).to.be.eql( {
            a: 42,
            b: 24,
            c: 24,
            d: 66
        } );
    } );

    it( 'options.params is a function and options.valid_params', function() {
        var block = create_block( null, {
            valid_params: {
                a: null,
                d: null
            },
            params: function( params ) {
                return {
                    a: 42,
                    b: 24,
                    f: 66
                };
            }
        } );

        var raw_params = {
            a: 1,
            b: 2,
            c: 3,
            d: 4,
            e: 5
        };

        var params = block._params( raw_params );

        expect( params ).to.be.eql( {
            a: 42,
            d: 4
        } );
    } );

    it( 'params with jexpr', function() {
        var block = create_block( null, {
            params: {
                a: de.jexpr( 'params.foo' ),
                b: de.jexpr( 'context.bar' ),
                c: de.jexpr( 'state.quu' )
            }
        } );

        var params = block._params(
            { foo: 42, boo: 79 },
            { bar: 24 },
            { quu: 66 }
        );

        expect( params ).to.be.eql( {
            foo: 42,
            boo: 79,
            a: 42,
            b: 24,
            c: 66
        } );
    } );

    it( 'params from state and context', function( done ) {
        var block = de.func( {
            block: helpers.wrap( function( params, context, state ) {
                return params;
            }, 50 ),
            options: {
                valid_params: {
                    a: null,
                    b: null,
                    c: null
                },
                params: de.jexpr( {
                    a: de.jexpr( 'params.foo' ),
                    b: de.jexpr( 'state.bar' ),
                    c: function( params, context, state ) {
                        return context.quu;
                    }
                } ),
                before: function( params, context, state ) {
                    state.bar = 24;
                    context.quu = 66;
                }
            }
        } );

        var context = helpers.context();
        context.run( block, { foo: 42 } )
            .then( function( result ) {
                expect( result ).to.be.eql( {
                    a: 42,
                    b: 24,
                    c: 66
                } );

                done();
            } );
    } );

    it( 'chain of params, valid_params, params', function() {
        var b1 = de.value( {
            block: null,
            options: {
                params: {
                    a: de.jexpr( 'params.foo' ),
                    b: 42
                }
            }
        } );

        var b2 = b1( {
            options: {
                valid_params: {
                    c: null,
                    d: null
                }
            }
        } );

        var b3 = b2( {
            options: {
                params: {
                    c: de.jexpr( 'params.bar' ),
                    e: 24
                }
            }
        } );

        var params = b3._compile()._params( {
            b: 77,
            d: 82,
            foo: 33,
            bar: 66,
            quu: 99
        } );

        expect( params ).to.be.eql( {
            a: 33,
            b: 42,
            c: 66,
            d: 82
        } );
    } );

} );

