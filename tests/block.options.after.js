var no = require( 'nommon' );

var expect = require( 'expect.js' );

var de = require( '../lib/index.js' );

var helpers = require( './_helpers.js' );

//  ---------------------------------------------------------------------------------------------------------------  //

var ERROR_ID = 'AFTER_ERROR';

//  ---------------------------------------------------------------------------------------------------------------  //

describe( 'block', function() {

    describe( 'options', function() {

        describe( 'after', function() {

            it( 'single after', function( done ) {
                var block = de.block(
                    helpers.wrap( function( params, context ) {
                        expect( context.state ).to.be.eql( {} );

                        context.state.foo = true;

                        return 'foo';
                    }, 50 ),
                    {
                        after: function( params, context ) {
                            expect( context.state ).to.be.eql( { foo: true } );

                            context.state.bar = true;
                        }
                    }
                );

                var context = new de.Context();
                context.run( block )
                    .then( function( result ) {
                        expect( context.state ).to.be.eql( { foo: true, bar: true } );
                        expect( result ).to.be.eql( 'foo' );

                        done();
                    } );
            } );

            it( 'single after, block returns an error', function( done ) {
                var block = de.block(
                    helpers.wrap( function( params, context ) {
                        return de.error( ERROR_ID );
                    }, 50 ),
                    {
                        after: function( params, context ) {
                            throw Error( 'error' );
                        }
                    }
                );

                var context = new de.Context();
                context.run( block )
                    .then( function( result ) {
                        expect( result ).to.be.a( de.Error );
                        expect( result.error.id ).to.be.eql( ERROR_ID );

                        done();
                    } );
            } );

            it( 'single after returning a value', function( done ) {
                var block = de.block(
                    helpers.wrap( 'foo', 50 ),
                    {
                        after: function( params, context ) {
                            context.state.bar = true;

                            return 'bar';
                        }
                    }
                );

                var context = new de.Context();
                context.run( block )
                    .then( function( result ) {
                        expect( context.state ).to.be.eql( { bar: true } );
                        expect( result ).to.be.eql( 'foo' );

                        done();
                    } );
            } );

            it( 'single after returning an error', function( done ) {
                var block = de.block(
                    helpers.wrap( 'foo', 50 ),
                    {
                        after: function( params, context ) {
                            context.state.bar = true;

                            return de.error( ERROR_ID );
                        }
                    }
                );

                var context = new de.Context();
                context.run( block )
                    .then( function( result ) {
                        expect( context.state ).to.be.eql( { bar: true } );
                        expect( result ).to.be.a( de.Error );
                        expect( result.error.id ).to.be.eql( ERROR_ID );

                        done();
                    } );
            } );

            it( 'single after returning a promise', function( done ) {
                var block = de.block(
                    helpers.wrap( 'foo', 50 ),
                    {
                        after: helpers.wrap( function( params, context ) {
                            context.state.bar = true;
                        }, 50 )
                    }
                );

                var context = new de.Context();
                context.run( block )
                    .then( function( result ) {
                        expect( context.state ).to.be.eql( { bar: true } );
                        expect( result ).to.be.eql( 'foo' );

                        done();
                    } );
            } );

            it( 'single after returning a promise resolving with a value', function( done ) {
                var block = de.block(
                    helpers.wrap( 'foo', 50 ),
                    {
                        after: helpers.wrap( function( params, context ) {
                            context.state.bar = true;

                            return 'bar';
                        }, 50 )
                    }
                );

                var context = new de.Context();
                context.run( block )
                    .then( function( result ) {
                        expect( context.state ).to.be.eql( { bar: true } );
                        expect( result ).to.be.eql( 'foo' );

                        done();
                    } );
            } );

            it( 'single after returning a promise resolving with an error', function( done ) {
                var block = de.block(
                    helpers.wrap( 'foo', 50 ),
                    {
                        after: helpers.wrap( function( params, context ) {
                            context.state.bar = true;

                            return de.error( ERROR_ID );
                        }, 50 )
                    }
                );

                var context = new de.Context();
                context.run( block )
                    .then( function( result ) {
                        expect( context.state ).to.be.eql( { bar: true } );
                        expect( result ).to.be.a( de.Error );
                        expect( result.error.id ).to.be.eql( ERROR_ID );

                        done();
                    } );
            } );

            it( 'multiple after', function( done ) {
                var block = de.block(
                    helpers.wrap( function( params, context ) {
                        expect( context.state ).to.be.eql( {} );

                        context.state.foo = true;

                        return 'foo';
                    }, 50 ),
                    {
                        after: [
                            function( params, context ) {
                                expect( context.state ).to.be.eql( { foo: true } );

                                context.state.bar = true;

                                return 'bar';
                            },

                            function( params, context ) {
                                expect( context.state ).to.be.eql( { foo: true, bar: true } );

                                context.state.quu = true;

                                return 'quu';
                            }
                        ]
                    }
                );

                var context = new de.Context();
                context.run( block )
                    .then( function( result ) {
                        expect( context.state ).to.be.eql( { foo: true, bar: true, quu: true } );
                        expect( result ).to.be.eql( 'foo' );

                        done();
                    } );
            } );

            it( 'multiple after, first one returning an error', function( done ) {
                var block = de.block(
                    helpers.wrap( 'foo', 50 ),
                    {
                        after: [
                            function( params, context ) {
                                context.state.bar = true;

                                return de.error( ERROR_ID );
                            },

                            function( params, context ) {
                                throw Error( 'error' );
                            }
                        ]
                    }
                );

                var context = new de.Context();
                context.run( block )
                    .then( function( result ) {
                        expect( context.state ).to.be.eql( { bar: true } );
                        expect( result ).to.be.a( de.Error );
                        expect( result.error.id ).to.be.eql( ERROR_ID );

                        done();
                    } );
            } );

            it( 'multiple after, second one returning an error', function( done ) {
                var block = de.block(
                    helpers.wrap( 'foo', 50 ),
                    {
                        after: [
                            function( params, context ) {
                                context.state.bar = true;
                            },

                            function( params, context ) {
                                context.state.quu = true;

                                return de.error( ERROR_ID );
                            }
                        ]
                    }
                );

                var context = new de.Context();
                context.run( block )
                    .then( function( result ) {
                        expect( context.state ).to.be.eql( { bar: true, quu: true } );
                        expect( result ).to.be.a( de.Error );
                        expect( result.error.id ).to.be.eql( ERROR_ID );

                        done();
                    } );
            } );

            it( 'single after and single inherited after', function( done ) {
                var b1 = de.block(
                    helpers.wrap( function( params, context ) {
                        expect( context.state ).to.be.eql( {} );

                        context.state.foo = true;

                        return 'foo';
                    }, 50 ),
                    {
                        after: function( params, context ) {
                            expect( context.state ).to.be.eql( { foo: true } );

                            context.state.bar = true;
                        }
                    }
                );

                var b2 = b1( {
                    after: function( params, context ) {
                        expect( context.state ).to.be.eql( { foo: true, bar: true } );

                        context.state.quu = true;
                    }
                } );

                var context = new de.Context();
                context.run( b2 )
                    .then( function( result ) {
                        expect( context.state ).to.be.eql( { foo: true, bar: true, quu: true } );
                        expect( result ).to.be.eql( 'foo' );

                        done();
                    } );
            } );

            it( 'single after returning an error and single inherited after', function( done ) {
                var b1 = de.block(
                    helpers.wrap( 'foo', 50 ),
                    {
                        after: function( params, context ) {
                            context.state.bar = true;
                        }
                    }
                );

                var b2 = b1( {
                    after: function( params, context ) {
                        context.state.quu = true;

                        return de.error( ERROR_ID );
                    }
                } );

                var context = new de.Context();
                context.run( b2 )
                    .then( function( result ) {
                        expect( context.state ).to.be.eql( { bar: true, quu: true } );
                        expect( result ).to.be.a( de.Error );
                        expect( result.error.id ).to.be.eql( ERROR_ID );

                        done();
                    } );
            } );

            it( 'single after and single inherited after returning an error', function( done ) {
                var b1 = de.block(
                    helpers.wrap( 'foo', 50 ),
                    {
                        after: function( params, context ) {
                            context.state.bar = true;

                            return de.error( ERROR_ID );
                        }
                    }
                );

                var b2 = b1( {
                    after: function( params, context ) {
                        throw Error( 'error' );
                    }
                } );

                var context = new de.Context();
                context.run( b2 )
                    .then( function( result ) {
                        expect( result ).to.be.a( de.Error );
                        expect( result.error.id ).to.be.eql( ERROR_ID );
                        expect( context.state ).to.be.eql( { bar: true } );

                        done();
                    } );
            } );

            it( 'multiple after and multiple inherited after', function( done ) {
                var b1 = de.block(
                    helpers.wrap( function( params, context ) {
                        expect( context.state ).to.be.eql( {} );

                        context.state.c0 = true;

                        return 'foo';
                    }, 50 ),
                    {
                        after: [
                            function( params, context ) {
                                expect( context.state ).to.be.eql( { c0: true } );

                                context.state.c1 = true;
                            },

                            function( params, context ) {
                                expect( context.state ).to.be.eql( { c0: true, c1: true } );

                                context.state.c2 = true;
                            }
                        ]
                    }
                );

                var b2 = b1( {
                    after: [
                        function( params, context ) {
                            expect( context.state ).to.be.eql( { c0: true, c1: true, c2: true } );

                            context.state.c3 = true;
                        },

                        function( params, context ) {
                            expect( context.state ).to.be.eql( { c0: true, c1: true, c2: true, c3: true } );

                            context.state.c4 = true;
                        }
                    ]
                } );

                var context = new de.Context();
                context.run( b2 )
                    .then( function( result ) {
                        expect( context.state ).to.be.eql( { c0: true, c1: true, c2: true, c3: true, c4: true } );
                        expect( result ).to.be.eql( 'foo' );

                        done();
                    } );
            } );

        } );

    } );

} );

