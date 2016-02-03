var no = require( 'nommon' );

var expect = require( 'expect.js' );

var de = require( '../lib/index.js' );

var helpers = require( './_helpers.js' );

//  ---------------------------------------------------------------------------------------------------------------  //

describe( 'block', function() {

    describe( 'options', function() {

        describe( 'select', function() {

            it( 'select with functions', function() {
                var _params = {
                    quu: 24
                };
                var _state;
                var _result = {
                    foo: {
                        bar: 42
                    }
                };
                var _context = helpers.context();

                var block = de.block(
                    helpers.wrap( _result ),
                    {
                        before: function( params, context, state ) {
                            _state = state;
                        },

                        select: {
                            bar: function( params, context, state, result ) {
                                expect( params ).not.to.be( _params );
                                expect( params ).to.be.eql( _params );
                                expect( context ).to.be( _context );
                                expect( state ).to.be( _state );
                                expect( state ).to.be.eql( {} );
                                expect( result ).to.be( _result );

                                return result.foo.bar;
                            },
                            tee: function( params, context, state, result ) {
                                expect( params ).not.to.be( _params );
                                expect( params ).to.be.eql( _params );
                                expect( context ).to.be( _context );
                                expect( state ).to.be( _state );
                                expect( state ).to.be.eql( { bar: 42 } );
                                expect( result ).to.be( _result );

                                return params.quu;
                            }
                        }
                    }
                );

                _context.run( block, _params )
                    .then( function() {
                        expect( _state ).to.be.eql( {
                            bar: 42,
                            tee: 24
                        } );
                    } );
            } );

            it( 'select with jexpr', function( done ) {
                var _state;

                var block = de.block(
                    helpers.wrap( {
                        foo: 42,
                        bar: null
                    } ),
                    {
                        before: function( params, context, state ) {
                            _state = state;
                        },

                        select: {
                            foo: de.jexpr( '.foo' ),
                            bar: de.jexpr( '.bar' ),
                            quu: de.jexpr( '.quu' ),
                            tee: de.jexpr( 'params.tee' )
                        }
                    }
                );

                var context = helpers.context();
                context.run( block, { tee: 73 } )
                    .then( function() {
                        expect( _state ).to.be.eql( {
                            foo: 42,
                            bar: null,
                            tee: 73
                        } );
                        expect( _state ).not.to.have.key( 'quu' );

                        done();
                    } );
            } );

            it( 'select! with jexpr', function( done ) {
                var _state;

                var block = de.block(
                    helpers.wrap( {
                        foo: 42,
                        bar: null
                    } ),
                    {
                        before: function( params, context, state ) {
                            _state = state;
                        },

                        select: {
                            'foo!': de.jexpr( '.foo' ),
                            'bar!': de.jexpr( '.bar' ),
                            'quu!': de.jexpr( '.quu' )
                        }
                    }
                );

                var context = helpers.context();
                context.run( block )
                    .then( function() {
                        expect( _state ).to.be.eql( {
                            foo: 42,
                            bar: null
                        } );
                        expect( _state ).not.to.have.key( 'quu' );

                        done();
                    } );
            } );

            it( 'select existing key #1', function( done ) {
                var _state;

                var block = de.block(
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
                        expect( _state ).to.be.eql( { ids: [ 2, 1 ] } );

                        done();
                    } );
            } );

            it( 'select existing key #2', function( done ) {
                var _state;

                var block = de.block(
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
                            'ids!': de.jexpr( '.items.id' ),
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

            it( 'select existing key #3', function( done ) {
                var _state;

                var block = de.block(
                    helpers.wrap( {
                        items: {
                            id: 1
                        }
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
                        expect( _state ).to.be.eql( { ids: [ 4, 5, 6, 1 ] } );

                        done();
                    } );
            } );

            it( 'select existing key #4', function( done ) {
                var _state;

                var block = de.block(
                    helpers.wrap( {
                        items: {
                            id: 1
                        }
                    } ),
                    {
                        before: function( params, context, state ) {
                            _state = state;

                            state.ids = [ 4, 5, 6 ];
                        },

                        select: {
                            'ids!': de.jexpr( '.items.id' ),
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

            it( 'select existing key #5', function( done ) {
                var _state;

                var block = de.block(
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
                        expect( _state ).to.be.eql( { ids: [ 4, 1, 2, 3 ] } );

                        done();
                    } );
            } );

            it( 'select existing key #6', function( done ) {
                var _state;

                var block = de.block(
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
                            'ids!': de.jexpr( '.items.id' ),
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

            it( 'select existing key #7', function( done ) {
                var _state;

                var block = de.block(
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

            it( 'select existing key #8', function( done ) {
                var _state;

                var block = de.block(
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
                            'ids!': de.jexpr( '.items.id' ),
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

            it( 'select from two parents #1', function( done ) {
                var b1 = de.block(
                    helpers.wrap( {
                        a: 1,
                        b: 2,
                        c: 3,
                        d: 4,
                        e: [ 5 ],
                        f: [ 6 ],
                        g: [ 7 ],
                        h: [ 8 ],
                        i: null,
                        j: null,
                        k: null,
                        l: null
                    }, 50 )
                );
                var b2 = de.block(
                    helpers.wrap( {
                        a: 101,
                        b: [ 102 ],
                        c: null,
                        e: 103,
                        f: [ 104 ],
                        g: null,
                        i: 105,
                        j: [ 106 ],
                        k: null
                    }, 100 )
                );

                var b3 = de.block(
                    helpers.wrap( function( params, context, state ) {
                        return state;
                    } ),
                    {
                        deps: [
                            {
                                block: b1,
                                select: {
                                    a: de.jexpr( '.a' ),
                                    b: de.jexpr( '.b' ),
                                    c: de.jexpr( '.c' ),
                                    d: de.jexpr( '.d' ),
                                    e: de.jexpr( '.e' ),
                                    f: de.jexpr( '.f' ),
                                    g: de.jexpr( '.g' ),
                                    h: de.jexpr( '.h' ),
                                    i: de.jexpr( '.i' ),
                                    j: de.jexpr( '.j' ),
                                    k: de.jexpr( '.k' ),
                                    l: de.jexpr( '.l' )
                                }
                            },
                            {
                                block: b2,
                                select: {
                                    a: de.jexpr( '.a' ),
                                    b: de.jexpr( '.b' ),
                                    c: de.jexpr( '.c' ),
                                    d: de.jexpr( '.d' ),
                                    e: de.jexpr( '.e' ),
                                    f: de.jexpr( '.f' ),
                                    g: de.jexpr( '.g' ),
                                    h: de.jexpr( '.h' ),
                                    i: de.jexpr( '.i' ),
                                    j: de.jexpr( '.j' ),
                                    k: de.jexpr( '.k' ),
                                    l: de.jexpr( '.l' )
                                }
                            }
                        ]
                    }
                );

                var context = helpers.context();
                context.run( [ b1, b2, b3 ] )
                    .then( function( result ) {
                        expect( result[ 2 ] ).to.be.eql( {
                            a: [ 1, 101 ],
                            b: [ 2, 102 ],
                            c: [ 3, null ],
                            d: 4,
                            e: [ 5, 103 ],
                            f: [ 6, 104 ],
                            g: [ 7, null ],
                            h: [ 8 ],
                            i: [ null, 105 ],
                            j: [ null, 106 ],
                            k: [ null, null ],
                            l: null
                        } );

                        done();
                    } );
            } );

            it( 'select from two parents #2', function( done ) {
                var b1 = de.block(
                    helpers.wrap( {
                        a: 1,
                        b: 2,
                        c: 3,
                        d: 4,
                        e: [ 5 ],
                        f: [ 6 ],
                        g: [ 7 ],
                        h: [ 8 ],
                        i: null,
                        j: null,
                        k: null,
                        l: null
                    }, 50 )
                );
                var b2 = de.block(
                    helpers.wrap( {
                        a: 101,
                        b: [ 102 ],
                        c: null,
                        e: 103,
                        f: [ 104 ],
                        g: null,
                        i: 105,
                        j: [ 106 ],
                        k: null
                    }, 100 )
                );

                var b3 = de.block(
                    helpers.wrap( function( params, context, state ) {
                        return state;
                    } ),
                    {
                        deps: [
                            {
                                block: b1,
                                select: {
                                    a: de.jexpr( '.a' ),
                                    b: de.jexpr( '.b' ),
                                    c: de.jexpr( '.c' ),
                                    d: de.jexpr( '.d' ),
                                    e: de.jexpr( '.e' ),
                                    f: de.jexpr( '.f' ),
                                    g: de.jexpr( '.g' ),
                                    h: de.jexpr( '.h' ),
                                    i: de.jexpr( '.i' ),
                                    j: de.jexpr( '.j' ),
                                    k: de.jexpr( '.k' ),
                                    l: de.jexpr( '.l' )
                                }
                            },
                            {
                                block: b2,
                                select: {
                                    'a!': de.jexpr( '.a' ),
                                    'b!': de.jexpr( '.b' ),
                                    'c!': de.jexpr( '.c' ),
                                    'd!': de.jexpr( '.d' ),
                                    'e!': de.jexpr( '.e' ),
                                    'f!': de.jexpr( '.f' ),
                                    'g!': de.jexpr( '.g' ),
                                    'h!': de.jexpr( '.h' ),
                                    'i!': de.jexpr( '.i' ),
                                    'j!': de.jexpr( '.j' ),
                                    'k!': de.jexpr( '.k' ),
                                    'l!': de.jexpr( '.l' )
                                }
                            }
                        ]
                    }
                );

                var context = helpers.context();
                context.run( [ b1, b2, b3 ] )
                    .then( function( result ) {
                        expect( result[ 2 ] ).to.be.eql( {
                            a: 101,
                            b: [ 102 ],
                            c: null,
                            d: 4,
                            e: 103,
                            f: [ 104 ],
                            g: null,
                            h: [ 8 ],
                            i: 105,
                            j: [ 106 ],
                            k: null,
                            l: null
                        } );

                        done();
                    } );
            } );

        } );

    } );

} );

