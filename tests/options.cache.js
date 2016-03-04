var no = require( 'nommon' );

var expect = require( 'expect.js' );

var de = require( '../lib/index.js' );
require( '../lib/de.cacher.js' );

var helpers = require( './_helpers.js' );

//  ---------------------------------------------------------------------------------------------------------------  //

var async_cache = new de.Cacher.BaseAsync();
var sync_cache = new de.Cacher.BaseSync();

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
                maxage: 200
            }
        );

        var context = new de.Context.Base( {
            cache: async_cache
        } );
        context.run( block )
            .then( function( result ) {
                expect( result ).to.be( _result );
                expect( _calls ).to.be( 1 );
            } );

        setTimeout( function() {
            var context = new de.Context.Base( {
                cache: async_cache
            } );
            context.run( block )
                .then( function( result ) {
                    expect( result ).to.be( _result );
                    expect( _calls ).to.be( 1 );
                } );
        }, 100 );

        setTimeout( function() {
            var context = new de.Context.Base( {
                cache: async_cache
            } );
            context.run( block )
                .then( function( result ) {
                    expect( result ).to.be( _result );
                    expect( _calls ).to.be( 2 );

                    done();
                } );
        }, 300 );

    } );

} );

