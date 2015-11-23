var expect = require( 'expect.js' );

var de = require( '../lib/blocks/de.block.http.js' );
require( '../lib/results/index.js' );

//  ---------------------------------------------------------------------------------------------------------------  //

var Fake = require( '../lib/de.fake.js' );
var fake = new Fake();

var base_url = 'http://127.0.0.1:8080';

var hello_string = 'Hello, World';

var port = require( './_port.js' )();

//  ---------------------------------------------------------------------------------------------------------------  //

fake.listen( port, '0.0.0.0', function() {

    describe( 'block.http', function() {
        var n = 1;

        it( 'url as a string', function( done ) {
            var path = `/block/http/${ n++ }`;

            fake.add( path, {
                status_code: 200,
                content: hello_string,
            } );

            var block = new de.Block.Http( `${ base_url }${ path }` );

            block.run()
                .then( function( result ) {
                    expect( result ).to.be.a( de.Result.Value );
                    expect( result.as_object() ).to.be( hello_string );

                    done();
                } );
        } );
    } );

    run();
} );

//  ---------------------------------------------------------------------------------------------------------------  //

after( function() {
    fake.close();
} );

