/* eslint-env mocha */

var expect = require( 'expect.js' );

var de = require( '../lib/index.js' );

var helpers = require( './_helpers.js' );

//  ---------------------------------------------------------------------------------------------------------------  //

var test_async_cache = new de.Cache.TestAsync();
//  var test_sync_cache = new de.Cache.TestSync();

var cache = test_async_cache;

//  ---------------------------------------------------------------------------------------------------------------  //

function create_block( block, options ) {
    return de.func( {
        block: block,
        options: options
    } );
}

//  ---------------------------------------------------------------------------------------------------------------  //

describe( 'options.cache', function() {
    var n = 0;

    it( 'async get', function( done ) {
        var key = `key-${ n++ }`;

        var _calls = 0;
        var _result = {
            foo: true
        };

        var block = create_block(
            helpers.wrap( function() {
                _calls++;

                return _result;
            }, 50 ),
            {
                key: key,
                maxage: 1
            }
        );

        var context = new de.Context.Base( {
            cache: cache
        } );
        context.run( block )
            .then( function( result ) {
                expect( result ).to.be.eql( _result );
                expect( _calls ).to.be( 1 );
            } );

        setTimeout( function() {
            var context = new de.Context.Base( {
                cache: cache
            } );
            context.run( block )
                .then( function( result ) {
                    expect( result ).to.be.eql( _result );
                    expect( _calls ).to.be( 1 );
                } );
        }, 100 );

        setTimeout( function() {
            var context = new de.Context.Base( {
                cache: cache
            } );
            context.run( block )
                .then( function( result ) {
                    expect( result ).to.be.eql( _result );
                    expect( _calls ).to.be( 2 );

                    done();
                } );
        }, 1500 );

    } );

    it( 'options.cache', function( done ) {
        const key = `key-${ n++ }`;

        const cache_1 = new de.Cache();
        const cache_2 = new de.Cache();

        const RESULT = {
            foo: true
        };

        const block = create_block(
            helpers.wrap( RESULT, 50 ),
            {
                key: key,
                maxage: 60,
                cache: cache_1,
            }
        );

        const context = new de.Context.Base( {
            cache: cache_2,
        } );
        context.run( block )
            .then( function( result ) {
                expect( result ).to.be( RESULT );
                expect( cache_1._cache[ key ].data ).to.be( RESULT );
                expect( cache_2._cache[ key ] ).to.be( undefined );

                done();
            } );
    } );

} );

