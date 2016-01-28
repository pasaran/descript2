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

                var context = new de.Context();
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

                var context = new de.Context();
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

                var context = new de.Context();
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

                var context = new de.Context();
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

                var context = new de.Context();
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

                var context = new de.Context();
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

                var context = new de.Context();
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

                var context = new de.Context();
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

                var context = new de.Context();
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

                var context = new de.Context();
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

                var context = new de.Context();
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

                var context = new de.Context();
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

        } );

        describe( 'deps.select', function() {

            it( 'block with deps.select', function( done ) {
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
                                quu: '.foo.bar'
                            }
                        }
                    }
                );

                var context = new de.Context();
                context.run( [ b1, b2 ] )
                    .then( function( result ) {
                        expect( result ).to.be.eql( [ { foo: { bar: 42 } }, { quu: 42 } ] );

                        done();
                    } );
            } );

        } );

    } );

} );

