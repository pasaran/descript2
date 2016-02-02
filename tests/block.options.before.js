var no = require( 'nommon' );

var expect = require( 'expect.js' );

var de = require( '../lib/index.js' );

var helpers = require( './_helpers.js' );

//  ---------------------------------------------------------------------------------------------------------------  //

var ERROR_ID = 'BEFORE_ERROR';

//  ---------------------------------------------------------------------------------------------------------------  //

describe( 'block', function() {

    describe( 'options', function() {

        describe( 'before', function() {

            it( 'single before', function( done ) {
                var foo;

                var block = de.block(
                    helpers.wrap( function( params, context ) {
                        expect( context.state ).to.be.eql( { bar: true } );

                        foo = true;

                        return 'foo';
                    }, 50 ),
                    {
                        before: function( params, context ) {
                            expect( foo ).to.be( undefined );

                            context.state.bar = true;
                        }
                    }
                );

                var context = helpers.context();
                context.run( block )
                    .then( function( result ) {
                        expect( foo ).to.be( true );
                        expect( context.state ).to.be.eql( { bar: true } );
                        expect( result ).to.be.eql( 'foo' );

                        done();
                    } );
            } );

            it( 'single before returning a value', function( done ) {
                var block = de.block(
                    helpers.wrap( 'foo', 50 ),
                    {
                        before: function( params, context ) {
                            context.state.bar = true;

                            return 'bar';
                        }
                    }
                );

                var context = helpers.context();
                context.run( block )
                    .then( function( result ) {
                        expect( context.state ).to.be.eql( { bar: true } );
                        expect( result ).to.be.eql( 'foo' );

                        done();
                    } );
            } );

            it( 'single before returning an error', function( done ) {
                var block = de.block(
                    function( params, context ) {
                        throw Error( 'error' );
                    },
                    {
                        before: function( params, context ) {
                            context.state.bar = true;

                            return de.error( ERROR_ID );
                        }
                    }
                );

                var context = helpers.context();
                context.run( block )
                    .then( function( result ) {
                        expect( context.state ).to.be.eql( { bar: true } );
                        expect( result ).to.be.a( de.Error );
                        expect( result.error.id ).to.be.eql( ERROR_ID );

                        done();
                    } );
            } );

            it( 'single before returning a promise', function( done ) {
                var block = de.block(
                    helpers.wrap( 'foo', 50 ),
                    {
                        before: helpers.wrap( function( params, context ) {
                            context.state.bar = true;
                        }, 50 )
                    }
                );

                var context = helpers.context();
                context.run( block )
                    .then( function( result ) {
                        expect( context.state ).to.be.eql( { bar: true } );
                        expect( result ).to.be.eql( 'foo' );

                        done();
                    } );
            } );


            it( 'single before returning a promise resolving with a value', function( done ) {
                var block = de.block(
                    helpers.wrap( 'foo', 50 ),
                    {
                        before: helpers.wrap( function( params, context ) {
                            context.state.bar = true;

                            return 'bar';
                        }, 50 )
                    }
                );

                var context = helpers.context();
                context.run( block )
                    .then( function( result ) {
                        expect( context.state ).to.be.eql( { bar: true } );
                        expect( result ).to.be.eql( 'foo' );

                        done();
                    } );
            } );

            it( 'single before returning a promise resolving with an error', function( done ) {
                var block = de.block(
                    function( params, context ) {
                        throw Error( 'error' );
                    },
                    {
                        before: helpers.wrap( function( params, context ) {
                            context.state.bar = true;

                            return de.error( ERROR_ID );
                        }, 50 )
                    }
                );

                var context = helpers.context();
                context.run( block )
                    .then( function( result ) {
                        expect( context.state ).to.be.eql( { bar: true } );
                        expect( result ).to.be.a( de.Error );
                        expect( result.error.id ).to.be.eql( ERROR_ID );

                        done();
                    } );
            } );

            it( 'multiple before', function( done ) {
                var foo;

                var block = de.block(
                    helpers.wrap( function( params, context ) {
                        expect( context.state ).to.be.eql( { bar: true, quu: true } );

                        foo = true;

                        return 'foo';
                    }, 50 ),
                    {
                        before: [
                            function( params, context ) {
                                expect( foo ).to.be( undefined );
                                expect( context.state ).to.be.eql( {} );

                                context.state.bar = true;

                                return 'bar';
                            },

                            function( params, context ) {
                                expect( foo ).to.be( undefined );
                                expect( context.state ).to.be.eql( { bar: true } );

                                context.state.quu = true;

                                return 'quu';
                            }
                        ]
                    }
                );

                var context = helpers.context();
                context.run( block )
                    .then( function( result ) {
                        expect( foo ).to.be( true );
                        expect( context.state ).to.be.eql( { bar: true, quu: true } );
                        expect( result ).to.be.eql( 'foo' );

                        done();
                    } );
            } );

            it( 'multiple before, first one returning an error', function( done ) {
                var block = de.block(
                    helpers.wrap( function( params, context ) {
                        throw Error( 'error' );
                    }, 50 ),
                    {
                        before: [
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

                var context = helpers.context();
                context.run( block )
                    .then( function( result ) {
                        expect( context.state ).to.be.eql( { bar: true } );
                        expect( result ).to.be.a( de.Error );
                        expect( result.error.id ).to.be.eql( ERROR_ID );

                        done();
                    } );
            } );

            it( 'multiple before, second one returning an error', function( done ) {
                var block = de.block(
                    helpers.wrap( function( params, context ) {
                        throw Error( 'error' );
                    }, 50 ),
                    {
                        before: [
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

                var context = helpers.context();
                context.run( block )
                    .then( function( result ) {
                        expect( context.state ).to.be.eql( { bar: true, quu: true } );
                        expect( result ).to.be.a( de.Error );
                        expect( result.error.id ).to.be.eql( ERROR_ID );

                        done();
                    } );
            } );

            it( 'single before and single inherited before', function( done ) {
                var foo;

                var b1 = de.block(
                    helpers.wrap( function( params, context ) {
                        expect( context.state ).to.be.eql( { bar: true, quu: true } );

                        foo = true;

                        return 'foo';
                    }, 50 ),
                    {
                        before: function( params, context ) {
                            expect( foo ).to.be( undefined );
                            expect( context.state ).to.be.eql( { quu: true } );

                            context.state.bar = true;
                        }
                    }
                );

                var b2 = b1( {
                    before: function( params, context ) {
                        expect( foo ).to.be( undefined );
                        expect( context.state ).to.be.eql( {} );

                        context.state.quu = true;
                    }
                } );

                var context = helpers.context();
                context.run( b2 )
                    .then( function( result ) {
                        expect( foo ).to.be( true );
                        expect( context.state ).to.be.eql( { bar: true, quu: true } );
                        expect( result ).to.be.eql( 'foo' );

                        done();
                    } );
            } );

            it( 'single before returning an error and single inherited before', function( done ) {
                var b1 = de.block(
                    helpers.wrap( function( params, context ) {
                        throw Error( 'error' );
                    }, 50 ),
                    {
                        before: function( params, context ) {
                            throw Error( 'error' );
                        }
                    }
                );

                var b2 = b1( {
                    before: function( params, context ) {
                        context.state.quu = true;

                        return de.error( ERROR_ID );
                    }
                } );

                var context = helpers.context();
                context.run( b2 )
                    .then( function( result ) {
                        expect( context.state ).to.be.eql( { quu: true } );
                        expect( result ).to.be.a( de.Error );
                        expect( result.error.id ).to.be.eql( ERROR_ID );

                        done();
                    } );
            } );

            it( 'single before and single inherited before returning an error', function( done ) {
                var b1 = de.block(
                    helpers.wrap( function( params, context ) {
                        throw Error( 'error' );
                    }, 50 ),
                    {
                        before: function( params, context ) {
                            expect( context.state ).to.be.eql( { quu: true } );

                            context.state.bar = true;

                            return de.error( ERROR_ID );
                        }
                    }
                );

                var b2 = b1( {
                    before: function( params, context ) {
                        expect( context.state ).to.be.eql( {} );

                        context.state.quu = true;
                    }
                } );

                var context = helpers.context();
                context.run( b2 )
                    .then( function( result ) {
                        expect( context.state ).to.be.eql( { bar: true, quu: true } );
                        expect( result ).to.be.a( de.Error );
                        expect( result.error.id ).to.be.eql( ERROR_ID );

                        done();
                    } );
            } );

            it( 'multiple before and multiple inherited before', function( done ) {
                var b1 = de.block(
                    helpers.wrap( function( params, context ) {
                        expect( context.state ).to.be.eql( { c1: true, c2: true, c3: true, c4: true } );

                        return 'foo';
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

                var context = helpers.context();
                context.run( b2 )
                    .then( function( result ) {
                        expect( context.state ).to.be.eql( { c1: true, c2: true, c3: true, c4: true } );
                        expect( result ).to.be.eql( 'foo' );

                        done();
                    } );
            } );

        } );

    } );

} );

