/* eslint-env mocha */

var expect = require( 'expect.js' );

var de = require( '../lib/index.js' );

var helpers = require( './_helpers.js' );

//  ---------------------------------------------------------------------------------------------------------------  //

function create_context() {
    return new de.Context.Base();
}

function create_block( block, options ) {
    const factory = ( typeof block === 'function' ) ? de.func : de.value;

    return factory( {
        block: block,
        options: options
    } );
}

//  ---------------------------------------------------------------------------------------------------------------  //

describe( 'options.select', function() {

    it( 'select with functions', function( done ) {
        var _params = {
            id: 39
        };
        var _context = create_context();
        var _state = {};
        var _result = {};

        var block = de.value( {
            block: _result,
            options: {
                select: {
                    foo: function( params, context, state, result ) {
                        expect( params ).not.to.be( _params );
                        expect( params ).to.be.eql( _params );
                        expect( context ).to.be( _context );
                        expect( state ).to.be( _state );
                        expect( state ).to.be.eql( {} );
                        expect( result ).to.be( _result );

                        return 42;
                    },
                    bar: function( params, context, state, result ) {
                        expect( state ).to.be.eql( { foo: 42 } );

                        return 24;
                    }
                }
            }
        } );

        _context.run( block, _params, _state )
            .then( function() {
                expect( _state ).to.be.eql( {
                    foo: 42,
                    bar: 24
                } );

                done();
            } );
    } );

    it( 'select with jexpr #1', function( done ) {
        var block = de.value( {
            block: {
                a: '',
                b: 0,
                c: false,
                d: null,
                e: undefined,
                f: 'hello',
                g: [ 'world' ]
            },
            options: {
                select: {
                    a: de.jexpr( '.a' ),
                    b: de.jexpr( '.b' ),
                    c: de.jexpr( '.c' ),
                    d: de.jexpr( '.d' ),
                    e: de.jexpr( '.e' ),
                    f: de.jexpr( '.f' ),
                    g: de.jexpr( '.g' ),

                    A: de.jexpr( '.a' ),
                    B: de.jexpr( '.b' ),
                    C: de.jexpr( '.c' ),
                    D: de.jexpr( '.d' ),
                    E: de.jexpr( '.e' ),
                    F: de.jexpr( '.f' ),
                    G: de.jexpr( '.g' ),
                }
            }
        } );

        const context = create_context();
        const state = {
            A: [ 1 ],
            B: [ 2 ],
            C: [ 3 ],
            D: [ 4 ],
            E: [ 5 ],
            F: [ 6 ],
            G: [ 7 ]
        };
        context.run( block, null, state )
            .then( function() {
                expect( state ).to.be.eql( {
                    a: '',
                    b: 0,
                    c: false,
                    d: null,
                    f: 'hello',
                    g: [ 'world' ],

                    A: [ 1, '' ],
                    B: [ 2, 0 ],
                    C: [ 3, false ],
                    D: [ 4, null ],
                    E: [ 5 ],
                    F: [ 6, 'hello' ],
                    G: [ 7, 'world' ],
                } );
                expect( state ).not.to.have.key( 'e' );

                done();
            } );
    } );

    it( 'select with jexpr #2', function( done ) {
        var block = de.value( {
            block: {
                a: 1
            },
            options: {
                select: {
                    a: de.jexpr( '.a' ),
                    b: de.jexpr( 'params.b' ),
                    c: de.jexpr( 'state.c' )
                }
            }
        } );

        const context = create_context();
        const params = {
            b: 2
        };
        const state = {
            c: 3
        };
        context.run( block, params, state )
            .then( function() {
                expect( state ).to.be.eql( {
                    a: 1,
                    b: 2,
                    c: 3
                } );

                done();
            } );
    } );

    it( 'select with jexprs #1', function( done ) {
        var _state;

        var block = create_block(
            helpers.wrap( {
                a: 1,
                b: null
            } ),
            {
                before: function( params, context, state ) {
                    _state = state;

                    state.e = 2;
                    state.f = [ 3, 4 ];
                },

                select: {
                    a: de.jexprs( '.a' ),
                    b: de.jexprs( '.b' ),
                    c: de.jexprs( '.c' ),
                    d: de.jexprs( 'params.d' ),
                    e: de.jexprs( 'state.e' ),
                    f: de.jexprs( 'state.f' )
                }
            }
        );

        var context = create_context();
        context.run( block, { d: 5 } )
            .then( function() {
                expect( _state ).to.be.eql( {
                    a: [ 1 ],
                    b: [ null ],
                    c: [],
                    d: [ 5 ],
                    e: [ 2 ],
                    f: [ 3, 4, 3, 4 ]
                } );

                done();
            } );
    } );

    it( 'select with jexprs #2', function( done ) {
        var _state;

        var block = create_block(
            helpers.wrap( {
                id: 1,
                foo: {
                    ids: [ 2, 3, 4 ]
                },
                bar: [
                    { id: 5 },
                    { id: 6 },
                    { id: 7 }
                ]
            } ),
            {
                before: function( params, context, state ) {
                    _state = state;
                },
                select: {
                    ids: de.jexprs( '.id', '.foo.ids', '.bar.id' )
                }
            }
        );

        var context = create_context();
        context.run( block )
            .then( function() {
                expect( _state ).to.be.eql( {
                    ids: [ 1, 2, 3, 4, 5, 6, 7 ]
                } );

                done();
            } );
    } );

    it( 'select existing key #1', function( done ) {
        var _state;

        var block = create_block(
            helpers.wrap( {
                items: {
                    id: 1
                }
            } ),
            {
                before: function( params, context, state ) {
                    _state = state;

                    state.ids = 2;
                },

                select: {
                    ids: de.jexpr( '.items.id' ),
                }
            }
        );

        var context = create_context();
        context.run( block )
            .then( function() {
                expect( _state ).to.be.eql( { ids: 1 } );

                done();
            } );
    } );

    it( 'select existing key #2', function( done ) {
        var _state;

        var block = create_block(
            helpers.wrap( {
                items: {
                    id: 1
                }
            } ),
            {
                before: function( params, context, state ) {
                    _state = state;

                    state.ids = [ 2 ];
                },

                select: {
                    ids: de.jexpr( '.items.id' ),
                }
            }
        );

        var context = create_context();
        context.run( block )
            .then( function() {
                expect( _state ).to.be.eql( { ids: [ 2, 1 ] } );

                done();
            } );
    } );

    it( 'select existing key #3', function( done ) {
        var _state;

        var block = create_block(
            helpers.wrap( {
                items: {
                    id: 1
                }
            } ),
            {
                before: function( params, context, state ) {
                    _state = state;

                    state.ids = 2;
                },

                select: {
                    ids: de.jexprs( '.items.id' ),
                }
            }
        );

        var context = create_context();
        context.run( block )
            .then( function() {
                expect( _state ).to.be.eql( { ids: [ 1 ] } );

                done();
            } );
    } );

    it( 'select existing key #4', function( done ) {
        var _state;

        var block = create_block(
            helpers.wrap( {
                items: {
                    id: 1
                }
            } ),
            {
                before: function( params, context, state ) {
                    _state = state;

                    state.ids = [ 2 ];
                },

                select: {
                    ids: de.jexprs( '.items.id' ),
                }
            }
        );

        var context = create_context();
        context.run( block )
            .then( function() {
                expect( _state ).to.be.eql( { ids: [ 2, 1 ] } );

                done();
            } );
    } );

    it( 'select existing key #5', function( done ) {
        const foo = [ 1, 2, 3 ];

        const block = de.value( {
            block: {
                foo: foo,
            },
            options: {
                select: {
                    foo: de.jexpr( '.foo' ),
                    bar: de.jexpr( '.foo' ),
                    quu: de.jexpr( 'state.quu' )
                }
            }
        } );

        const context = create_context();
        const state = {
            bar: [ 4, 5, 6 ],
            quu: [ 7, 8, 9 ]
        };
        context.run( block, null, state )
            .then( function() {
                expect( state ).to.be.eql( {
                    foo: [ 1, 2, 3 ],
                    bar: [ 4, 5, 6, 1, 2, 3 ],
                    quu: [ 7, 8, 9, 7, 8, 9 ]
                } );
                expect( state.foo ).to.be( foo );

                done();
            } );
    } );

    it( 'select existing key #6', function( done ) {
        var _state;
        var ids = [ 1, 2, 3 ];

        var block = create_block(
            helpers.wrap( 'foo' ),
            {
                before: function( params, context, state ) {
                    _state = state;

                    state.ids = ids;
                },

                select: {
                    ids: de.jexprs( 'state.ids' ),
                }
            }
        );

        var context = create_context();
        context.run( block )
            .then( function() {
                expect( _state ).to.be.eql( { ids: [ 1, 2, 3, 1, 2, 3 ] } );

                done();
            } );
    } );

    it( 'select existing key #7', function( done ) {
        var _state;

        var block = create_block(
            helpers.wrap( {
                items: [
                    { id: 1 },
                    { id: 2 },
                    { id: 3 }
                ]
            } ),
            {
                before: function( params, context, state ) {
                    _state = state;

                    state.ids = 4;
                },

                select: {
                    ids: de.jexpr( '.items.id' ),
                }
            }
        );

        var context = create_context();
        context.run( block )
            .then( function() {
                expect( _state ).to.be.eql( { ids: [ 1, 2, 3 ] } );

                done();
            } );
    } );

    it( 'select existing key #8', function( done ) {
        var _state;

        var block = create_block(
            helpers.wrap( {
                items: [
                    { id: 1 },
                    { id: 2 },
                    { id: 3 }
                ]
            } ),
            {
                before: function( params, context, state ) {
                    _state = state;

                    state.ids = [ 4, 5, 6 ];
                },

                select: {
                    ids: de.jexpr( '.items.id' ),
                }
            }
        );

        var context = create_context();
        context.run( block )
            .then( function() {
                expect( _state ).to.be.eql( { ids: [ 4, 5, 6, 1, 2, 3 ] } );

                done();
            } );
    } );

} );

describe( 'deps and select', function() {

    it( 'select from two parents #1', function( done ) {
        var b1 = create_block(
            helpers.wrap( {
                items: {
                    id: 1
                }
            }, 10 ),
            {
                select: {
                    ids: de.jexpr( '.items.id' )
                }
            }
        );
        var b2 = create_block(
            helpers.wrap( {
                items: {
                    id: 2
                }
            }, 20 ),
            {
                select: {
                    ids: de.jexpr( '.items.id' )
                }
            }
        );

        var b3 = create_block(
            null,
            {
                deps: [ b1, b2 ]
            }
        );

        const context = create_context();
        const state = {};
        context.run( [ b1, b2, b3 ], null, state )
            .then( function() {
                expect( state ).to.be.eql( {
                    ids: 2
                } );

                done();
            } );
    } );

    it( 'select from two parents #2', function( done ) {
        var b1 = create_block(
            helpers.wrap( {
                items: {
                    id: 1
                }
            }, 10 ),
            {
                select: {
                    ids: de.jexprs( '.items.id' )
                }
            }
        );
        var b2 = create_block(
            helpers.wrap( {
                items: {
                    id: 2
                }
            }, 20 ),
            {
                select: {
                    ids: de.jexpr( '.items.id' )
                }
            }
        );

        var b3 = create_block(
            null,
            {
                deps: [ b1, b2 ]
            }
        );

        const context = create_context();
        const state = {};
        context.run( [ b1, b2, b3 ], null, state )
            .then( function() {
                expect( state ).to.be.eql( {
                    ids: [ 1, 2 ]
                } );

                done();
            } );
    } );

    it( 'select from two parents #3', function( done ) {
        var b1 = create_block(
            helpers.wrap( {
                items: {
                    id: 1
                }
            }, 10 ),
            {
                select: {
                    ids: de.jexpr( '.items.id' )
                }
            }
        );
        var b2 = create_block(
            helpers.wrap( {
                items: {
                    id: 2
                }
            }, 20 ),
            {
                select: {
                    ids: de.jexprs( '.items.id' )
                }
            }
        );

        var b3 = create_block(
            null,
            {
                deps: [ b1, b2 ]
            }
        );

        const context = create_context();
        const state = {};
        context.run( [ b1, b2, b3 ], null, state )
            .then( function() {
                expect( state ).to.be.eql( {
                    ids: [ 2 ]
                } );

                done();
            } );
    } );

    it( 'select from two parents #4', function( done ) {
        var b1 = create_block(
            helpers.wrap( {
                items: {
                    id: 1
                }
            }, 10 ),
            {
                select: {
                    ids: de.jexprs( '.items.id' )
                }
            }
        );
        var b2 = create_block(
            helpers.wrap( {
                items: {
                    id: 2
                }
            }, 20 ),
            {
                select: {
                    ids: de.jexprs( '.items.id' )
                }
            }
        );

        var b3 = create_block(
            null,
            {
                deps: [ b1, b2 ]
            }
        );

        const context = create_context();
        const state = {};
        context.run( [ b1, b2, b3 ], null, state )
            .then( function() {
                expect( state ).to.be.eql( {
                    ids: [ 1, 2 ]
                } );

                done();
            } );
    } );

    it( 'parent and child with options.select', function( done ) {
        var b1 = create_block(
            helpers.wrap( {
                foo: 'bar',
                bar: 'foo',
            }, 10 )
        );

        var b2 = b1( {
            options: {
                select: {
                    foo: de.jexpr( '.bar' )
                }
            }
        } );

        var b3 = b2( {
            options: {
                select: {
                    bar: de.jexpr( '.foo' )
                }
            }
        } );

        const context = create_context();
        const state = {};
        context.run( b3, null, state )
            .then( function() {
                expect( state ).to.be.eql( {
                    foo: 'foo',
                    bar: 'bar',
                } );

                done();
            } );
    } );

    it( 'select with error #1', function( done ) {
        const block = create_block(
            helpers.wrap( {
                foo: 42
            }, 10 ),
            {
                select: {
                    foo: function( params, context, state, result ) {
                        //  eslint-disable-next-line
                        return noo.jpath( '.foo', result );
                    },
                }
            }
        );

        const context = create_context();
        const state = {};
        context.run( block, null, state )
            .then( function( result ) {
                expect( result ).to.be.a( de.Error );
                expect( result.error.id ).to.be( 'ReferenceError' );

                done();
            } );
    } );

    it( 'select with error #2', function( done ) {
        const block = create_block(
            helpers.wrap( {
                foo: 42
            }, 10 ),
            {
                select: {
                    foo: function( params, context, state, result ) {
                        return result.bar.foo;
                    },
                }
            }
        );

        const context = create_context();
        const state = {};
        context.run( block, null, state )
            .then( function( result ) {
                expect( result ).to.be.a( de.Error );
                expect( result.error.id ).to.be( 'TypeError' );

                done();
            } );
    } );

} );

describe( 'options.isolate_state', function() {

    it( 'isolated state', function( done ) {
        var b1 = create_block(
            helpers.wrap( {
                foo: 42
            }, 10 ),
            {
                id: 'foo',
                select: {
                    int_foo: de.jexpr( '.foo' )
                }
            }
        );
        var b2 = create_block(
            helpers.wrap( {
                bar: 24
            }, 20 ),
            {
                id: 'bar',
                select: {
                    int_bar: de.jexpr( '.bar' )
                }
            }
        );

        var b3 = de.array( {
            block: [ b1, b2 ],
            options: {
                id: 'quu',
                isolate_state: true,
                select: {
                    ext_foo: de.jexpr( 'state.int_foo' ),
                    ext_bar: de.jexpr( 'state.int_bar' )
                }
            }
        } );

        const context = create_context();
        const state = {};
        context.run( b3, null, state )
            .then( function() {
                expect( state ).to.be.eql( {
                    ext_foo: 42,
                    ext_bar: 24
                } );

                done();
            } );
    } );

} );

