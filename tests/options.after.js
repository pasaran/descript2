/* eslint-env mocha */

var expect = require( 'expect.js' );

var de = require( '../lib/index.js' );

var helpers = require( './_helpers.js' );

//  ---------------------------------------------------------------------------------------------------------------  //

var ERROR_ID = 'AFTER_ERROR';

//  ---------------------------------------------------------------------------------------------------------------  //

function create_block( block, options ) {
    return de.func( {
        block: block,
        options: options
    } );
}

//  ---------------------------------------------------------------------------------------------------------------  //

describe( 'options.after', function() {

    it( 'single after', function( done ) {
        var _state;

        var block = create_block(
            helpers.wrap( function( params, context, state ) {
                expect( _state ).to.be( undefined );
                _state = state;

                expect( state ).to.be.eql( {} );

                state.foo = true;

                return 'foo';
            }, 50 ),
            {
                after: function( params, context, state ) {
                    expect( state ).to.be( _state );
                    expect( state ).to.be.eql( { foo: true } );

                    state.bar = true;
                }
            }
        );

        var context = helpers.context();
        context.run( block )
            .then( function( result ) {
                expect( _state ).to.be.eql( { foo: true, bar: true } );
                expect( result ).to.be( 'foo' );

                done();
            } );
    } );

    it( 'single after, block returns an error', function( done ) {
        var block = create_block(
            helpers.wrap( function( params, context, state ) {
                return de.error( ERROR_ID );
            }, 50 ),
            {
                after: function( params, context ) {
                    throw Error( 'error' );
                }
            }
        );

        var context = helpers.context();
        context.run( block )
            .then( function( result ) {
                expect( result ).to.be.a( de.Error );
                expect( result.error.id ).to.be.eql( ERROR_ID );

                done();
            } );
    } );

    it( 'single after returning a value', function( done ) {
        var block = create_block(
            helpers.wrap( 'foo', 50 ),
            {
                after: function( params, context, state ) {
                    return 'bar';
                }
            }
        );

        var context = helpers.context();
        context.run( block )
            .then( function( result ) {
                expect( result ).to.be.eql( 'foo' );

                done();
            } );
    } );

    it( 'single after returning an error', function( done ) {
        var block = create_block(
            helpers.wrap( 'foo', 50 ),
            {
                after: function( params, context ) {
                    return de.error( ERROR_ID );
                }
            }
        );

        var context = helpers.context();
        context.run( block )
            .then( function( result ) {
                expect( result ).to.be.a( de.Error );
                expect( result.error.id ).to.be.eql( ERROR_ID );

                done();
            } );
    } );

    it( 'single after returning a promise', function( done ) {
        var _state;

        var block = create_block(
            helpers.wrap( function( params, context, state ) {
                expect( _state ).to.be( undefined );
                _state = state;

                expect( state ).to.be.eql( {} );
                state.foo = true;

                return 'foo';
            }, 50 ),
            {
                after: helpers.wrap( function( params, context, state ) {
                    expect( state ).to.be( _state );
                    expect( state ).to.be.eql( { foo: true } );

                    state.bar = true;
                }, 50 )
            }
        );

        var context = helpers.context();
        context.run( block )
            .then( function( result ) {
                expect( _state ).to.be.eql( { foo: true, bar: true } );
                expect( result ).to.be.eql( 'foo' );

                done();
            } );
    } );

    it( 'single after returning a promise resolving with a value', function( done ) {
        var block = create_block(
            helpers.wrap( 'foo', 50 ),
            {
                after: helpers.wrap( 'bar', 50 )
            }
        );

        var context = helpers.context();
        context.run( block )
            .then( function( result ) {
                expect( result ).to.be.eql( 'foo' );

                done();
            } );
    } );

    it( 'single after returning a promise resolving with an error', function( done ) {
        var block = create_block(
            helpers.wrap( 'foo', 50 ),
            {
                after: helpers.wrap( function( params, context, state ) {
                    return de.error( ERROR_ID );
                }, 50 )
            }
        );

        var context = helpers.context();
        context.run( block )
            .then( function( result ) {
                expect( result ).to.be.a( de.Error );
                expect( result.error.id ).to.be.eql( ERROR_ID );

                done();
            } );
    } );

    it( 'multiple after', function( done ) {
        var _state;

        var block = create_block(
            helpers.wrap( function( params, context, state ) {
                expect( _state ).to.be( undefined );
                _state = state;

                expect( state ).to.be.eql( {} );

                state.foo = true;

                return 'foo';
            }, 50 ),
            {
                after: [
                    function( params, context, state ) {
                        expect( state ).to.be( _state );
                        expect( state ).to.be.eql( { foo: true } );

                        state.bar = true;

                        return 'bar';
                    },

                    function( params, context, state ) {
                        expect( state ).to.be( _state );
                        expect( state ).to.be.eql( { foo: true, bar: true } );

                        state.quu = true;

                        return 'quu';
                    }
                ]
            }
        );

        var context = helpers.context();
        context.run( block )
            .then( function( result ) {
                expect( _state ).to.be.eql( { foo: true, bar: true, quu: true } );
                expect( result ).to.be.eql( 'foo' );

                done();
            } );
    } );

    it( 'multiple after, first one returning an error', function( done ) {
        var block = create_block(
            helpers.wrap( 'foo', 50 ),
            {
                after: [
                    function( params, context, state ) {
                        return de.error( ERROR_ID );
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
                expect( result.error.id ).to.be.eql( ERROR_ID );

                done();
            } );
    } );

    it( 'multiple after, second one returning an error', function( done ) {
        var block = create_block(
            helpers.wrap( 'foo', 50 ),
            {
                after: [
                    function( params, context, state ) {
                        return 'bar';
                    },

                    function( params, context, state ) {
                        return de.error( ERROR_ID );
                    }
                ]
            }
        );

        var context = helpers.context();
        context.run( block )
            .then( function( result ) {
                expect( result ).to.be.a( de.Error );
                expect( result.error.id ).to.be.eql( ERROR_ID );

                done();
            } );
    } );

    it( 'single after and single inherited after', function( done ) {
        var _state;

        var b1 = create_block(
            helpers.wrap( function( params, context, state ) {
                expect( _state ).to.be( undefined );
                _state = state;

                expect( state ).to.be.eql( {} );

                state.foo = true;

                return 'foo';
            }, 50 ),
            {
                after: function( params, context, state ) {
                    expect( state ).to.be( _state );
                    expect( state ).to.be.eql( { foo: true } );

                    state.bar = true;

                    return 'bar';
                }
            }
        );

        var b2 = b1( {
            options: {
                after: function( params, context, state ) {
                    expect( state ).to.be( _state );
                    expect( state ).to.be.eql( { foo: true, bar: true } );

                    state.quu = true;

                    return 'quu';
                }
            }
        } );

        var context = helpers.context();
        context.run( b2 )
            .then( function( result ) {
                expect( _state ).to.be.eql( { foo: true, bar: true, quu: true } );
                expect( result ).to.be.eql( 'foo' );

                done();
            } );
    } );

    it( 'single after returning an error and single inherited after', function( done ) {
        var b1 = create_block(
            helpers.wrap( 'foo', 50 ),
            {
                after: function( params, context ) {
                    return 'bar';
                }
            }
        );

        var b2 = b1( {
            options: {
                after: function( params, context ) {
                    return de.error( ERROR_ID );
                }
            }
        } );

        var context = helpers.context();
        context.run( b2 )
            .then( function( result ) {
                expect( result ).to.be.a( de.Error );
                expect( result.error.id ).to.be.eql( ERROR_ID );

                done();
            } );
    } );

    it( 'single after and single inherited after returning an error', function( done ) {
        var b1 = create_block(
            helpers.wrap( 'foo', 50 ),
            {
                after: function( params, context ) {
                    return de.error( ERROR_ID );
                }
            }
        );

        var b2 = b1( {
            options: {
                after: function( params, context ) {
                    throw Error( 'error' );
                }
            }
        } );

        var context = helpers.context();
        context.run( b2 )
            .then( function( result ) {
                expect( result ).to.be.a( de.Error );
                expect( result.error.id ).to.be.eql( ERROR_ID );

                done();
            } );
    } );

    it( 'multiple after and multiple inherited after', function( done ) {
        var _state;

        var b1 = create_block(
            helpers.wrap( function( params, context, state ) {
                expect( _state ).to.be( undefined );
                _state = state;

                expect( state ).to.be.eql( {} );

                state.c0 = true;

                return 'foo';
            }, 50 ),
            {
                after: [
                    function( params, context, state ) {
                        expect( state ).to.be( _state );
                        expect( state ).to.be.eql( { c0: true } );

                        state.c1 = true;
                    },

                    function( params, context, state ) {
                        expect( state ).to.be( _state );
                        expect( state ).to.be.eql( { c0: true, c1: true } );

                        state.c2 = true;
                    }
                ]
            }
        );

        var b2 = b1( {
            options: {
                after: [
                    function( params, context, state ) {
                        expect( state ).to.be( _state );
                        expect( state ).to.be.eql( { c0: true, c1: true, c2: true } );

                        state.c3 = true;
                    },

                    function( params, context, state ) {
                        expect( state ).to.be( _state );
                        expect( state ).to.be.eql( { c0: true, c1: true, c2: true, c3: true } );

                        state.c4 = true;
                    }
                ]
            }
        } );

        var context = helpers.context();
        context.run( b2 )
            .then( function( result ) {
                expect( _state ).to.be.eql( { c0: true, c1: true, c2: true, c3: true, c4: true } );
                expect( result ).to.be.eql( 'foo' );

                done();
            } );
    } );

} );

