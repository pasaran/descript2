var no = require( 'nommon' );

var expect = require( 'expect.js' );

var de = require( '../lib/index.js' );

var helpers = require( './_helpers.js' );

//  ---------------------------------------------------------------------------------------------------------------  //

describe( 'options.timeout', function() {

    it( 'timeout', function( done ) {
        var block = de.block(
            helpers.wrap( 'foo', 200 ),
            {
                timeout: 100
            }
        );

        var context = helpers.context();
        context.run( block )
            .then( function( result ) {
                expect( result ).to.be.a( de.Error );
                expect( result.error.id ).to.be( 'BLOCK_TIMED_OUT' );

                done();
            } );
    } );

} );


