var no = require( 'nommon' );

var expect = require( 'expect.js' );

var de = require( '../lib/index.js' );

var helpers = require( './_helpers.js' );

var ERROR_ID = 'BLOCK_GUARDED';

//  ---------------------------------------------------------------------------------------------------------------  //

describe( 'options.guard', function() {

    it( 'guard is a function', function( done ) {
        var _params = { foo: true };
        var _context = helpers.context();

        var block = de.block(
            helpers.wrap( 'foo', 50 ),
            {
                id: 'first',
                guard: function( params, context, state ) {
                    //  NOTE: Кажется, больше никак стейт не достать,
                    //  чтобы проверить, что это таки он.
                    //  options.before вызывается уже после guard'а.
                    //
                    var _state = context._states[ 'first' ];

                    expect( params ).to.be( _params );
                    expect( context ).to.be( _context );
                    expect( state ).to.be( _state );

                    return true;
                }
            }
        );

        _context.run( block, _params )
            .then( function( result ) {
                expect( result ).to.be( 'foo' );

                done();
            } );
    } );

    it( 'guard is a function returning false', function( done ) {
        var _params = { foo: true };
        var _context = helpers.context();

        var block = de.block(
            helpers.wrap( 'foo', 50 ),
            {
                guard: function( params, context, state ) {
                    return false
                }
            }
        );

        _context.run( block, _params )
            .then( function( result ) {
                expect( result ).to.be.a( de.Error );
                expect( result.error.id ).to.be( ERROR_ID );

                done();
            } );
    } );

    it( 'successful guard', function( done ) {
        var block = de.block(
            helpers.wrap( 'foo', 50 ),
            {
                guard: de.jexpr( 'params.foo' )
            }
        );

        var context = helpers.context();
        context.run( block, { foo: true } )
            .then( function( result ) {
                expect( result ).to.be( 'foo' );

                done();
            } );
    } );

    it( 'failed guard', function( done ) {
        var block = de.block(
            helpers.wrap( 'foo', 50 ),
            {
                guard: de.jexpr( 'params.foo' )
            }
        );

        var context = helpers.context();
        context.run( block, { foo: false } )
            .then( function( result ) {
                expect( result ).to.be.a( de.Error );
                expect( result.error.id ).to.be( ERROR_ID );

                done();
            } );
    } );

    it( 'guard is an array #1', function( done ) {
        var _params = { id: 42 };
        var _context = helpers.context();
        var foo;

        var block = de.block(
            helpers.wrap( 'foo', 50 ),
            {
                id: 'first',
                guard: [
                    function( params, context, state ) {
                        var _state = context._states[ 'first' ];

                        expect( params ).to.be( _params );
                        expect( context ).to.be( _context );
                        expect( state ).to.be( _state );

                        expect( foo ).to.be( undefined );
                        foo = true;

                        return true;
                    },

                    function( params, context, state ) {
                        var _state = context._states[ 'first' ];

                        expect( params ).to.be( _params );
                        expect( context ).to.be( _context );
                        expect( state ).to.be( _state );

                        expect( foo ).to.be( true );

                        return true;
                    }
                ]
            }
        );

        _context.run( block, _params )
            .then( function( result ) {
                expect( result ).to.be( 'foo' );

                done();
            } );
    } );

    it( 'guard is an array #2', function( done ) {
        var block = de.block(
            helpers.wrap( 'foo', 50 ),
            {
                guard: [
                    function( params, context, state ) {
                        return false;
                    },

                    function( params, context, state ) {
                        throw Error( 'error' );
                    }
                ]
            }
        );

        var context = helpers.context();
        context.run( block )
            .then( function( result ) {
                expect( result ).to.be.a( de.Error );
                expect( result.error.id ).to.be( ERROR_ID );

                done();
            } );
    } );

    it( 'guard is an array #3', function( done ) {
        var block = de.block(
            helpers.wrap( 'foo', 50 ),
            {
                guard: [
                    function( params, context, state ) {
                        return true;
                    },

                    function( params, context, state ) {
                        return false;
                    }
                ]
            }
        );

        var context = helpers.context();
        context.run( block )
            .then( function( result ) {
                expect( result ).to.be.a( de.Error );
                expect( result.error.id ).to.be( ERROR_ID );

                done();
            } );
    } );

    it( 'guard is an array #4', function( done ) {
        var block = de.block(
            helpers.wrap( 'foo', 50 ),
            {
                guard: [
                    de.jexpr( 'params.foo == 42' ),
                    de.jexpr( 'params.bar == 24' )
                ]
            }
        );

        var context = helpers.context();
        context.run( block, { foo: 42, bar: 24 } )
            .then( function( result ) {
                expect( result ).to.be( 'foo' );

                done();
            } );
    } );

    it( 'guard checks inherited state', function( done ) {
        var b1 = de.block(
            helpers.wrap( {
                id: 42
            }, 50 ),
            {
                select: {
                    id: de.jexpr( '.id' )
                }
            }
        );

        var b2 = de.block(
            helpers.wrap( 'foo' ),
            {
                deps: b1,
                guard: de.jexpr( 'state.id == 42' )
            }
        );

        var context = helpers.context();
        context.run( [ b1, b2 ] )
            .then( function( result ) {
                expect( result[ 1 ] ).to.be( 'foo' );

                done();
            } );
    } );

    it( 'guard and inherited guard #1', function( done ) {
        var foo;
        var b1 = de.block(
            helpers.wrap( 'foo' ),
            {
                guard: function( params, context, state ) {
                    expect( foo ).to.be( undefined );

                    foo = true;

                    return true;
                }
            }
        );

        var b2 = b1( {
            guard: function( params, context, state ) {
                expect( foo ).to.be( true );

                return true;
            }
        } );

        var context = helpers.context();
        context.run( b2 )
            .then( function( result ) {
                expect( result ).to.be( 'foo' );

                done();
            } );
    } );

    it( 'guard and inherited guard #2', function( done ) {
        var b1 = de.block(
            helpers.wrap( 'foo' ),
            {
                guard: function( params, context, state ) {
                    return false;
                }
            }
        );

        var b2 = b1( {
            guard: function( params, context, state ) {
                throw Error( 'error' );
            }
        } );

        var context = helpers.context();
        context.run( b2 )
            .then( function( result ) {
                expect( result ).to.be.a( de.Error );
                expect( result.error.id ).to.be( ERROR_ID );

                done();
            } );
    } );

} );

