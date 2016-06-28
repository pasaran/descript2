var no = require( 'nommon' );

var expect = require( 'expect.js' );

var de = require( '../lib/index.js' );

var helpers = require( './_helpers.js' );

//  ---------------------------------------------------------------------------------------------------------------  //

var ERROR_ID = 'BEFORE_ERROR';

//  ---------------------------------------------------------------------------------------------------------------  //

function create_block( block, options ) {
    return de.func( {
        block: block,
        options: options
    } );
}

//  ---------------------------------------------------------------------------------------------------------------  //

describe( 'options.before', function() {

    it( 'single before', function( done ) {
        var _state;

        var block = create_block(
            helpers.wrap( function( params, context, state ) {
                expect( state ).to.be( _state );

                return state;
            }, 50 ),
            {
                before: function( params, context, state ) {
                    expect( state ).to.be.eql( {} );

                    _state = state;
                }
            }
        );

        var context = helpers.context();
        context.run( block )
            .then( function( result ) {
                expect( result ).to.be( _state );

                done();
            } );
    } );

    it( 'single before returning a value', function( done ) {
        var block = create_block(
            helpers.wrap( 'foo', 50 ),
            {
                before: function( params, context, state ) {
                    return 'bar';
                }
            }
        );

        var context = helpers.context();
        context.run( block )
            .then( function( result ) {
                expect( result ).to.be( 'foo' );

                done();
            } );
    } );

    it( 'single before returning an error', function( done ) {
        var block = create_block(
            function( params, context, state ) {
                throw Error( 'error' );
            },
            {
                before: function( params, context, state ) {
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

    it( 'single before returning a promise', function( done ) {
        var _state;

        var block = create_block(
            helpers.wrap( function( params, context, state ) {
                expect( state ).to.be( _state );

                return 'foo';
            }, 50 ),
            {
                before: helpers.wrap( function( params, context, state ) {
                    _state = state;
                }, 50 )
            }
        );

        var context = helpers.context();
        context.run( block )
            .then( function( result ) {
                expect( result ).to.be( 'foo' );

                done();
            } );
    } );

    it( 'single before returning a promise resolving with a value', function( done ) {
        var block = create_block(
            helpers.wrap( 'foo', 50 ),
            {
                before: helpers.wrap( 'bar', 50 )
            }
        );

        var context = helpers.context();
        context.run( block )
            .then( function( result ) {
                expect( result ).to.be( 'foo' );

                done();
            } );
    } );

    it( 'single before returning a promise resolving with an error', function( done ) {
        var block = create_block(
            function( params, context, state ) {
                throw Error( 'error' );
            },
            {
                before: helpers.wrap( de.error( ERROR_ID ), 50 )
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

    it( 'multiple before', function( done ) {
        var _state;

        var block = create_block(
            helpers.wrap( function( params, context, state ) {
                expect( state ).to.be( _state );
                expect( state ).to.be.eql( { bar: true, quu: true } );

                return 'foo';
            }, 50 ),
            {
                before: [
                    function( params, context, state ) {
                        expect( _state ).to.be( undefined );
                        _state = state;

                        state.bar = true;

                        return 'bar';
                    },

                    function( params, context, state ) {
                        expect( state ).to.be( _state );
                        expect( state ).to.be.eql( { bar: true } );

                        state.quu = true;

                        return 'quu';
                    }
                ]
            }
        );

        var context = helpers.context();
        context.run( block )
            .then( function( result ) {
                expect( result ).to.be( 'foo' );

                done();
            } );
    } );

    it( 'multiple before, first one returning an error', function( done ) {
        var block = create_block(
            helpers.wrap( function( params, context, state ) {
                throw Error( 'error' );
            }, 50 ),
            {
                before: [
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

    it( 'multiple before, second one returning an error', function( done ) {
        var block = create_block(
            helpers.wrap( function( params, context, state ) {
                throw Error( 'error' );
            }, 50 ),
            {
                before: [
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

    it( 'single before and single inherited before', function( done ) {
        var _state;

        var b1 = create_block(
            helpers.wrap( function( params, context, state ) {
                expect( state ).to.be( _state );
                expect( state ).to.be.eql( { bar: true, quu: true } );

                return 'foo';
            }, 50 ),
            {
                before: function( params, context, state ) {
                    expect( state ).to.be( _state );
                    expect( state ).to.be.eql( { quu: true } );

                    state.bar = true;
                }
            }
        );

        var b2 = b1( {
            options: {
                before: function( params, context, state ) {
                    expect( _state ).to.be( undefined );
                    _state = state;

                    expect( state ).to.be.eql( {} );

                    state.quu = true;
                }
            }
        } );

        var context = helpers.context();
        context.run( b2 )
            .then( function( result ) {
                expect( result ).to.be.eql( 'foo' );

                done();
            } );
    } );

    it( 'single before returning an error and single inherited before', function( done ) {
        var b1 = create_block(
            helpers.wrap( function( params, context, state ) {
                throw Error( 'error' );
            }, 50 ),
            {
                before: function( params, context, state ) {
                    throw Error( 'error' );
                }
            }
        );

        var b2 = b1( {
            options: {
                before: function( params, context, state ) {
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

    it( 'single before and single inherited before returning an error', function( done ) {
        var b1 = create_block(
            helpers.wrap( function( params, context, state ) {
                throw Error( 'error' );
            }, 50 ),
            {
                before: function( params, context, state ) {
                    expect( state ).to.be.eql( { quu: true } );

                    state.bar = true;

                    return de.error( ERROR_ID );
                }
            }
        );

        var b2 = b1( {
            options: {
                before: function( params, context, state ) {
                    expect( state ).to.be.eql( {} );

                    state.quu = true;
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

    it( 'multiple before and multiple inherited before', function( done ) {
        var _state;

        var b1 = create_block(
            helpers.wrap( function( params, context, state ) {
                expect( state ).to.be( _state );
                expect( state ).to.be.eql( { c1: true, c2: true, c3: true, c4: true } );

                return 'foo';
            }, 50 ),
            {
                before: [
                    function( params, context, state ) {
                        expect( state ).to.be( _state );
                        expect( state ).to.be.eql( { c1: true, c2: true } );

                        state.c3 = true;
                    },

                    function( params, context, state ) {
                        expect( state ).to.be( _state );
                        expect( state ).to.be.eql( { c1: true, c2: true, c3: true } );

                        state.c4 = true;
                    }
                ]
            }
        );

        var b2 = b1( {
            options: {
                before: [
                    function( params, context, state ) {
                        expect( _state ).to.be( undefined );
                        _state = state;

                        expect( state ).to.be.eql( {} );

                        state.c1 = true;
                    },

                    function( params, context, state ) {
                        expect( state ).to.be( _state );
                        expect( state ).to.be.eql( { c1: true } );

                        state.c2 = true;
                    }
                ]
            }
        } );

        var context = helpers.context();
        context.run( b2 )
            .then( function( result ) {
                expect( _state ).to.be.eql( { c1: true, c2: true, c3: true, c4: true } );
                expect( result ).to.be.eql( 'foo' );

                done();
            } );
    } );

} );

