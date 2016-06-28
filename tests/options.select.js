/* eslint-env mocha */

var expect = require( 'expect.js' );

var de = require( '../lib/index.js' );

var helpers = require( './_helpers.js' );

//  ---------------------------------------------------------------------------------------------------------------  //

function create_block( block, options ) {
    return de.func( {
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
        var _context = helpers.context();
        var _state;
        var _result = {};

        var block = create_block(
            helpers.wrap( _result ),
            {
                before: function( params, context, state ) {
                    _state = state;
                },

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
        );

        _context.run( block, _params )
            .then( function() {
                expect( _state ).to.be.eql( {
                    foo: 42,
                    bar: 24
                } );

                done();
            } );
    } );

    it.skip( 'select with jexpr', function( done ) {
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
                    a: de.jexpr( '.a' ),
                    b: de.jexpr( '.b' ),
                    c: de.jexpr( '.c' ),
                    d: de.jexpr( 'params.d' ),
                    e: de.jexpr( 'state.e' ),
                    f: de.jexpr( 'state.f' )
                }
            }
        );

        var context = helpers.context();
        context.run( block, { d: 5 } )
            .then( function() {
                expect( _state ).to.be.eql( {
                    a: 1,
                    b: null,
                    d: 5,
                    e: 2,
                    f: [ 3, 4 ]
                } );
                expect( _state ).not.to.have.key( 'c' );

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

        var context = helpers.context();
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

        var context = helpers.context();
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

        var context = helpers.context();
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

        var context = helpers.context();
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

        var context = helpers.context();
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

        var context = helpers.context();
        context.run( block )
            .then( function() {
                expect( _state ).to.be.eql( { ids: [ 2, 1 ] } );

                done();
            } );
    } );

    it.skip( 'select existing key #5', function( done ) {
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
                    ids: de.jexpr( 'state.ids' ),
                }
            }
        );

        var context = helpers.context();
        context.run( block )
            .then( function() {
                expect( _state ).to.be.eql( { ids: ids } );
                expect( _state.ids ).to.be( ids );

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

        var context = helpers.context();
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

        var context = helpers.context();
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

        var context = helpers.context();
        context.run( block )
            .then( function() {
                expect( _state ).to.be.eql( { ids: [ 4, 5, 6, 1, 2, 3 ] } );

                done();
            } );
    } );

} );

describe( 'options.deps.select', function() {

    it( 'select from two parents #1', function( done ) {
        var b1 = create_block(
            helpers.wrap( {
                items: {
                    id: 1
                }
            }, 50 )
        );
        var b2 = create_block(
            helpers.wrap( {
                items: {
                    id: 2
                }
            }, 100 )
        );

        var b3 = create_block(
            helpers.wrap( function( params, context, state ) {
                return state;
            } ),
            {
                deps: [
                    {
                        block: b1,
                        select: {
                            ids: de.jexpr( '.items.id' )
                        }
                    },
                    {
                        block: b2,
                        select: {
                            ids: de.jexpr( '.items.id' )
                        }
                    }
                ]
            }
        );

        var context = helpers.context();
        context.run( [ b1, b2, b3 ] )
            .then( function( result ) {
                expect( result[ 2 ] ).to.be.eql( {
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
            }, 50 )
        );
        var b2 = create_block(
            helpers.wrap( {
                items: {
                    id: 2
                }
            }, 100 )
        );

        var b3 = create_block(
            helpers.wrap( function( params, context, state ) {
                return state;
            } ),
            {
                deps: [
                    {
                        block: b1,
                        select: {
                            ids: de.jexprs( '.items.id' )
                        }
                    },
                    {
                        block: b2,
                        select: {
                            ids: de.jexpr( '.items.id' )
                        }
                    }
                ]
            }
        );

        var context = helpers.context();
        context.run( [ b1, b2, b3 ] )
            .then( function( result ) {
                expect( result[ 2 ] ).to.be.eql( {
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
            }, 50 )
        );
        var b2 = create_block(
            helpers.wrap( {
                items: {
                    id: 2
                }
            }, 100 )
        );

        var b3 = create_block(
            helpers.wrap( function( params, context, state ) {
                return state;
            } ),
            {
                deps: [
                    {
                        block: b1,
                        select: {
                            ids: de.jexpr( '.items.id' )
                        }
                    },
                    {
                        block: b2,
                        select: {
                            ids: de.jexprs( '.items.id' )
                        }
                    }
                ]
            }
        );

        var context = helpers.context();
        context.run( [ b1, b2, b3 ] )
            .then( function( result ) {
                expect( result[ 2 ] ).to.be.eql( {
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
            }, 50 )
        );
        var b2 = create_block(
            helpers.wrap( {
                items: {
                    id: 2
                }
            }, 100 )
        );

        var b3 = create_block(
            helpers.wrap( function( params, context, state ) {
                return state;
            } ),
            {
                deps: [
                    {
                        block: b1,
                        select: {
                            ids: de.jexprs( '.items.id' )
                        }
                    },
                    {
                        block: b2,
                        select: {
                            ids: de.jexprs( '.items.id' )
                        }
                    }
                ]
            }
        );

        var context = helpers.context();
        context.run( [ b1, b2, b3 ] )
            .then( function( result ) {
                expect( result[ 2 ] ).to.be.eql( {
                    ids: [ 1, 2 ]
                } );

                done();
            } );
    } );

} );

