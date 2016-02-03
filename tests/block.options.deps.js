var no = require( 'nommon' );

var expect = require( 'expect.js' );

var de = require( '../lib/index.js' );

var helpers = require( './_helpers.js' );

//  ---------------------------------------------------------------------------------------------------------------  //

describe( 'block', function() {

    describe( 'options', function() {

        describe( 'deps', function() {

            it( 'block depends on another block', function( done ) {
                var foo;

                var b1 = de.block(
                    helpers.wrap( function() {
                        foo = 42;

                        return 24;
                    }, 50 )
                );

                var b2 = de.block(
                    helpers.wrap( function() {
                        return foo;
                    } ),
                    {
                        deps: b1
                    }
                );

                var context = helpers.context();
                context.run( [ b1, b2 ] )
                    .then( function( result ) {
                        expect( result ).to.be.eql( [ 24, 42 ] );

                        done();
                    } );
            } );

            it( 'block depends on another block (array)', function( done ) {
                var foo;

                var b1 = de.block(
                    helpers.wrap( function() {
                        foo = 42;

                        return 24;
                    }, 50 )
                );

                var b2 = de.block(
                    helpers.wrap( function() {
                        return foo;
                    } ),
                    {
                        deps: [ b1 ]
                    }
                );

                var context = helpers.context();
                context.run( [ b1, b2 ] )
                    .then( function( result ) {
                        expect( result ).to.be.eql( [ 24, 42 ] );

                        done();
                    } );
            } );

            it( 'block depends on another block by id', function( done ) {
                var foo;

                var b1 = de.block(
                    helpers.wrap( function() {
                        foo = 42;

                        return 24;
                    }, 50 ),
                    {
                        id: 'b1'
                    }
                );

                var b2 = de.block(
                    helpers.wrap( function() {
                        return foo;
                    } ),
                    {
                        deps: 'b1'
                    }
                );

                var context = helpers.context();
                context.run( [ b1, b2 ] )
                    .then( function( result ) {
                        expect( result ).to.be.eql( [ 24, 42 ] );

                        done();
                    } );
            } );

            it( 'block depends on another block by id (array)', function( done ) {
                var foo;

                var b1 = de.block(
                    helpers.wrap( function() {
                        foo = 42;

                        return 24;
                    }, 50 ),
                    {
                        id: 'b1'
                    }
                );

                var b2 = de.block(
                    helpers.wrap( function() {
                        return foo;
                    } ),
                    {
                        deps: [ 'b1' ]
                    }
                );

                var context = helpers.context();
                context.run( [ b1, b2 ] )
                    .then( function( result ) {
                        expect( result ).to.be.eql( [ 24, 42 ] );

                        done();
                    } );
            } );

            it( 'block depends on several blocks', function( done ) {
                var values = [ 'one', 'two', 'three' ];

                var result = [];
                var blocks = values.map( function( value, i ) {
                    return de.block(
                        helpers.wrap( function() {
                            result[ i ] = value;
                        }, 50 + 50 * i )
                    );
                } );

                var block = de.block(
                    helpers.wrap( function() {
                        return result;
                    } ),
                    {
                        deps: blocks
                    }
                );

                var context = helpers.context();
                context.run( {
                    foo: blocks,
                    bar: block
                } )
                    .then( function( result ) {
                        expect( result.bar ).to.be.eql( values );

                        done();
                    } );
            } );

            it( 'chain of deps', function( done ) {
                var bar_value;
                var quu_value;

                var foo = de.block(
                    helpers.wrap( function() {
                        bar_value = 'bar';

                        return 'foo';
                    }, 50 )
                );

                var bar = de.block(
                    helpers.wrap( function() {
                        quu_value = 'quu';

                        return bar_value;
                    }, 50 ),
                    {
                        deps: foo
                    }
                );

                var quu = de.block(
                    helpers.wrap( function() {
                        return quu_value;
                    }, 50 ),
                    {
                        deps: bar
                    }
                );

                var context = helpers.context();
                context.run( [ foo, bar, quu ] )
                    .then( function( result ) {
                        expect( result ).to.be.eql( [ 'foo', 'bar', 'quu' ] );

                        done();
                    } );
            } );

            it( 'block depends on array', function( done ) {
                var v1;
                var v2;

                var b1 = de.block(
                    helpers.wrap( function() {
                        v1 = 'foo';

                        return v1;
                    }, 50 )
                );

                var b2 = de.block(
                    helpers.wrap( function() {
                        v2 = 'bar';

                        return v2;
                    }, 100 )
                );

                var b3 = de.block(
                    helpers.wrap( function() {
                        return [ v1, v2 ];
                    }, 50 ),
                    {
                        deps: [ b1, b2 ]
                    }
                );

                var context = helpers.context();
                context.run( [ b1, b2, b3 ] )
                    .then( function( result ) {
                        expect( result ).to.be.eql( [ 'foo', 'bar', [ 'foo', 'bar' ] ] );

                        done();
                    } );
            } );

            it( 'block depends on non-existent block #1', function( done ) {
                var block = de.block(
                    helpers.wrap( 42 ),
                    {
                        deps: 'another_block'
                    }
                );

                var context = helpers.context();
                context.run( block )
                    .then( function( result ) {
                        expect( result ).to.be.a( de.Error );
                        expect( result.error.id ).to.be.eql( 'DEPS_ERROR' );

                        done();
                    } );
            } );

            it( 'block depends on result of a function block', function( done ) {
                var v1;

                var b1 = de.func( function() {
                    return de.block(
                        helpers.wrap( function() {
                            v1 = 24;

                            return 42;
                        }, 50 ),
                        {
                            id: 'b1'
                        }
                    );
                } );

                var b2 = de.block(
                    helpers.wrap( function() {
                        return v1;
                    } ),
                    {
                        deps: 'b1'
                    }
                );

                var context = helpers.context();
                context.run( [ b1, b2 ] )
                    .then( function( result ) {
                        expect( result ).to.be.eql( [ 42, 24 ] );

                        done();
                    } );
            } );

            it( 'block depends on non-existent block #2', function( done ) {
                var b1 = de.block( helpers.wrap( 42, 50 ) );
                var b2 = de.block( helpers.wrap( 24, 100 ) );
                var b3 = de.block(
                    helpers.wrap( 66 ),
                    {
                        deps: 'b4'
                    }
                );

                var context = helpers.context();
                context.run( [ b1, b2, b3 ] )
                    .then( function( result ) {
                        expect( result[ 0 ] ).to.be.eql( 42 );
                        expect( result[ 1 ] ).to.be.eql( 24 );
                        expect( result[ 2 ] ).to.be.a( de.Error );
                        expect( result[ 2 ].error.id ).to.be.eql( 'DEPS_ERROR' );

                        done();
                    } );
            } );

            it( 'block depends on a block resolved with an error', function( done ) {
                var b1 = de.block( helpers.wrap( de.error( 'UNKNOWN_ERROR' ), 50 ) );
                var b2 = de.block(
                    helpers.wrap( 24 ),
                    {
                        deps: b1
                    }
                );

                var context = helpers.context();
                context.run( [ b1, b2 ] )
                    .then( function( result ) {
                        expect( result[ 0 ] ).to.be.a( de.Error );
                        expect( result[ 0 ].error.id ).to.be.eql( 'UNKNOWN_ERROR' );
                        expect( result[ 1 ] ).to.be.a( de.Error );
                        expect( result[ 1 ].error.id ).to.be.eql( 'DEPS_ERROR' );

                        done();
                    } );
            } );

            it( 'block depends on 2 blocks one of them resolved with an error', function( done ) {
                var b1 = de.block( helpers.wrap( de.error( 'UNKNOWN_ERROR' ), 50 ) );
                var b2 = de.block( helpers.wrap( 42, 100 ) );
                var b3 = de.block(
                    helpers.wrap( 24 ),
                    {
                        deps: [ b1, b2 ]
                    }
                );

                var context = helpers.context();
                context.run( [ b1, b2, b3 ] )
                    .then( function( result ) {
                        expect( result[ 0 ] ).to.be.a( de.Error );
                        expect( result[ 0 ].error.id ).to.be.eql( 'UNKNOWN_ERROR' );
                        expect( result[ 1 ] ).to.be.eql( 42 );
                        expect( result[ 2 ] ).to.be.a( de.Error );
                        expect( result[ 2 ].error.id ).to.be.eql( 'DEPS_ERROR' );

                        done();
                    } );
            } );

            it( 'block inherits parent state', function( done ) {
                var b1 = de.block(
                    helpers.wrap( {
                        foo: 42
                    }, 50 ),
                    {
                        after: function( params, context, state ) {
                            state.bar = 24;
                        }
                    }
                );
                var b2 = de.block(
                    helpers.wrap( function( params, context, state ) {
                        return state;
                    }, 50 ),
                    {
                        deps: b1
                    }
                );

                var context = helpers.context();
                context.run( [ b1, b2 ] )
                    .then( function( result ) {
                        expect( result ).to.be.eql( [
                            { foo: 42 },
                            { bar: 24 }
                        ] );

                        done();
                    } );
            } );

            it( 'deps.select', function( done ) {
                var b1 = de.block(
                    helpers.wrap( {
                        foo: {
                            bar: 42
                        }
                    }, 50 )
                );
                var b2 = de.block(
                    helpers.wrap( function( params, context, state ) {
                        return state;
                    }, 50 ),
                    {
                        deps: {
                            block: b1,
                            select: {
                                quu: de.jexpr( '.foo.bar' )
                            }
                        }
                    }
                );

                var context = helpers.context();
                context.run( [ b1, b2 ] )
                    .then( function( result ) {
                        expect( result ).to.be.eql( [ { foo: { bar: 42 } }, { quu: 42 } ] );

                        done();
                    } );
            } );

            it( 'deps.select on different branches', function( done ) {
                var b1 = de.block(
                    helpers.wrap( {
                        foo: 42,
                        bar: 24
                    }, 50 )
                );
                var b2 = de.block(
                    helpers.wrap( function( params, context, state ) {
                        return state;
                    }, 50 ),
                    {
                        deps: {
                            block: b1,
                            select: {
                                foo: de.jexpr( '.foo' )
                            }
                        }
                    }
                );
                var b3 = de.block(
                    helpers.wrap( function( params, context, state ) {
                        return state;
                    }, 100 ),
                    {
                        deps: {
                            block: b1,
                            select: {
                                bar: de.jexpr( '.bar' )
                            }
                        }
                    }
                );

                var context = helpers.context();
                context.run( [ b1, b2, b3 ] )
                    .then( function( result ) {
                        expect( result ).to.be.eql( [
                            { foo: 42, bar: 24 },
                            { foo: 42 },
                            { bar: 24 }
                        ] );

                        done();
                    } );
            } );

            it( 'state modification on different branches', function( done ) {
                var b1 = de.block(
                    helpers.wrap( function( params, context, state ) {
                        return state;
                    }, 50 ),
                    {
                        before: function( params, context, state ) {
                            state.foo = true;
                        }
                    }
                );
                var b2 = de.block(
                    helpers.wrap( function( params, context, state ) {
                        return state;
                    }, 50 ),
                    {
                        deps: b1,
                        before: function( params, context, state ) {
                            state.bar = true;
                        }
                    }
                );
                var b3 = de.block(
                    helpers.wrap( function( params, context, state ) {
                        return state;
                    }, 100 ),
                    {
                        deps: b1
                    }
                );

                var context = helpers.context();
                context.run( [ b1, b2, b3 ] )
                    .then( function( result ) {
                        expect( result ).to.be.eql( [
                            { foo: true },
                            { foo: true, bar: true },
                            { foo: true }
                        ] );

                        done();
                    } );
            } );

            it( 'merge parent\'s states', function( done ) {
                var b1 = de.block(
                    helpers.wrap( 'foo', 50 ),
                    {
                        after: function( params, context, state ) {
                            state.a = 1;
                            state.b = 2;
                            state.c = 3;
                            state.d = 4;
                            state.e = [ 5, 6 ];
                            state.f = [ 7, 8 ];
                            state.g = [ 9, 10 ];
                            state.h = [ 11, 12 ];
                            state.i = null;
                            state.j = null;
                            state.k = null;
                            state.l = null;
                        }
                    }
                );
                var b2 = de.block(
                    helpers.wrap( 'bar', 100 ),
                    {
                        after: function( params, context, state ) {
                            state.a = 101;
                            state.b = [ 102 ];
                            state.c = null;
                            state.e = 103;
                            state.f = [ 104 ];
                            state.g = null;
                            state.i = 105;
                            state.j = [ 106 ];
                            state.k = null;
                        }
                    }
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
                                    foo: de.jexpr( '.foo' ),
                                    bar: de.jexpr( '.bar' ),
                                    quu: de.jexpr( '.quu' )
                                }
                            },
                            {
                                block: b2,
                                select: {
                                    foo: de.jexpr( '.foo' ),
                                    bar: de.jexpr( '.bar' ),
                                    quu: de.jexpr( '.quu' )
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
                            e: [ 5, 6, 103 ],
                            f: [ 7, 8, 104 ],
                            g: [ 9, 10, null ],
                            h: [ 11, 12 ],
                            i: [ null, 105 ],
                            j: [ null, 106 ],
                            k: [ null, null ],
                            l: null
                        } );

                        done();
                    } );
            } );

        } );

    } );

} );

