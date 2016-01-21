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
                    }, 50 ), {
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
                    }, 50 ), {
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
                    }, 50 ), {
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
                    }, 50 ), {
                        before: helpers.wrap( 'foo', 50 )
                    }
                );

                helpers.run( block )
                    .then( function( result ) {
                        expect( result ).to.be.eql( 'foo' );

                        done();
                    } );
            } );

        } );

    } );

} );

