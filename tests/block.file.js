var fs_ = require( 'fs' );
var path_ = require( 'path' );

var no = require( 'nommon' );

var expect = require( 'expect.js' );

var de = require( '../lib/blocks/de.block.file.js' );
require( '../lib/results/index.js' );
require( '../lib/de.error.js' );

var files = {
    hello: fs_.readFileSync( path_.join( __dirname, 'files/hello.txt' ) )
};

//  ---------------------------------------------------------------------------------------------------------------  //

describe( 'block.file', function() {

    it( 'read text file', function( done ) {
        var block = new de.Block.File(
            {
                filename: 'files/hello.txt',
            },
            {
                dirname: __dirname
            }
        );

        block.run()
            .then( function( result ) {
                expect( result ).to.be.a( de.Result.Value );
                expect( result.as_object() ).to.be( files.hello.toString() );

                done();
            } );
    } );

} );

