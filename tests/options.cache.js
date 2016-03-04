var no = require( 'nommon' );

var expect = require( 'expect.js' );

var de = require( '../lib/index.js' );
require( '../lib/de.cache.js' );

var helpers = require( './_helpers.js' );

//  ---------------------------------------------------------------------------------------------------------------  //

var memcache = new de.Cache( '127.0.0.1:11211' );
var test_async_cache = new de.Cache.TestAsync();
var test_sync_cache = new de.Cache.TestSync();

var cache = test_async_cache;

//  ---------------------------------------------------------------------------------------------------------------  //

describe( 'options.cache', function() {
    var n = 0;

    it( 'async get', function( done ) {
        var key = `key-${ n++ }`;

        var _calls = 0;
        var _result = {
            foo: true
        };

        var block = de.block(
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

} );

