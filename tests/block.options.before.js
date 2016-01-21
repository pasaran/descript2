var no = require( 'nommon' );

var expect = require( 'expect.js' );

var de = require( '../lib/index.js' );

var helpers = require( './_helpers.js' );

//  ---------------------------------------------------------------------------------------------------------------  //

describe( 'block', function() {

    describe( 'options', function() {

        describe( 'before', function() {

            it( 'single before returning undefined', function( done ) {
                var block = de.block(
                    helpers.wrap( function( params, context ) {
                        return context.state;
                    }, 50 ),
                    {
                        before: function( params, context ) {
                            context.state.foo = 42;
                        }
                    }
                );

                helpers.run( block )
                    .then( function( result ) {
                        expect( result ).to.be.eql( { foo: 42 } );

                        done();
                    } );
            } );

            it( 'array of befores returning undefined', function( done ) {
                var block = de.block(
                    helpers.wrap( function( params, context ) {
                        return context.state;
                    }, 50 ),
                    {
                        before: [
                            function( params, context ) {
                                context.state.foo = 42;
                            },

                            function( params, context ) {
                                context.state.foo = 24;
                                context.state.bar = 66;
                            }
                        ]
                    }
                );

                helpers.run( block )
                    .then( function( result ) {
                        expect( result ).to.be.eql( { foo: 24, bar: 66 } );

                        done();
                    } );
            } );

            it( 'single before returning a value', function( done ) {
                var block = de.block(
                    helpers.wrap( function( params, context ) {
                        //  It shouldn't be called.
                        throw Error( 'error' );
                    }, 50 ),
                    {
                        before: function( params, context ) {
                            return 'foo';
                        }
                    }
                );

                helpers.run( block )
                    .then( function( result ) {
                        expect( result ).to.be.eql( 'foo' );

                        done();
                    } );
            } );

            it( 'single before returning a promise', function( done ) {
                var block = de.block(
                    helpers.wrap( function( params, context ) {
                        //  It shouldn't be called.
                        throw Error( 'error' );
                    }, 50 ),
                    {
                        before: helpers.wrap( 'foo', 50 )
                    }
                );

                helpers.run( block )
                    .then( function( result ) {
                        expect( result ).to.be.eql( 'foo' );

                        done();
                    } );
            } );

            it( 'inherited and own before', function( done ) {
                var b1 = de.block(
                    helpers.wrap( function( params, context ) {
                        return context.state;
                    }, 50 ),
                    {
                        before: function( params, context ) {
                            context.state.foo = 42;
                        }
                    }
                );

                var b2 = b1( {
                    before: function( params, context ) {
                        expect( context.state.foo ).to.be( undefined );

                        context.state.bar = 24;
                    }
                } );

                helpers.run( b2 )
                    .then( function( result ) {
                        expect( result ).to.be.eql( { foo: 42, bar: 24 } );

                        done();
                    } );
            } );

            it( 'inherited and own befores', function( done ) {
                var b1 = de.block(
                    helpers.wrap( function( params, context ) {
                        return context.state;
                    }, 50 ),
                    {
                        before: [
                            function( params, context ) {
                                expect( context.state ).to.be.eql( { c1: true, c2: true } );

                                context.state.c3 = true;
                            },

                            function( params, context ) {
                                expect( context.state ).to.be.eql( { c1: true, c2: true, c3: true } );

                                context.state.c4 = true;
                            }
                        ]
                    }
                );

                var b2 = b1( {
                    before: [
                        function( params, context ) {
                            expect( context.state ).to.be.eql( {} );

                            context.state.c1 = true;
                        },

                        function( params, context ) {
                            expect( context.state ).to.be.eql( { c1: true } );

                            context.state.c2 = true;
                        }
                    ]
                } );

                helpers.run( b2 )
                    .then( function( result ) {
                        expect( result ).to.be.eql( { c1: true, c2: true, c3: true, c4: true } );

                        done();
                    } );
            } );

            it( 'single before returning de.Error', function( done ) {
                var block = de.block(
                    helpers.wrap( function( params, context ) {
                        //  It shouldn't be called.
                        throw Error( 'error' );
                    }, 50 ),
                    {
                        before: function( params, context ) {
                            return de.error( 'UNKNOWN_ERROR' );
                        }
                    }
                );

                helpers.run( block )
                    .then( function( result ) {
                        expect( result ).to.be.a( de.Error );
                        expect( result.error.id ).to.be.eql( 'UNKNOWN_ERROR' );

                        done();
                    } );
            } );

        } );

    } );

} );

