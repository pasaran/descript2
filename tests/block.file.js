var fs_ = require( 'fs' );
var path_ = require( 'path' );

var no = require( 'nommon' );

var expect = require( 'expect.js' );

var de = require( '../lib/blocks/de.block.file.js' );
require( '../lib/results/index.js' );
require( '../lib/de.error.js' );

//  ---------------------------------------------------------------------------------------------------------------  //

function read( filename ) {
    return fs_.readFileSync( resolve( filename ), 'utf-8' );
}

function read_as_json( filename ) {
    return JSON.parse( read( filename ) );
}

function resolve( filename ) {
    return path_.join( __dirname, filename );
}

var files = {
    hello: read( 'files/hello.txt' )
};

//  ---------------------------------------------------------------------------------------------------------------  //

describe( 'block.file', function() {

    it( 'read text file, relative filename with dirname', function( done ) {
        var block = new de.Block.File(
            {
                filename: 'files/hello.txt'
            },
            {
                dirname: __dirname
            }
        );

        block.run()
            .then( function( result ) {
                expect( result ).to.be.a( de.Result.Value );
                expect( result.as_object() ).to.be( files.hello );

                done();
            } );
    } );

    it( 'read text file, absolute path', function( done ) {
        var block = new de.Block.File(
            {
                filename: resolve( 'files/hello.txt' )
            }
        );

        block.run()
            .then( function( result ) {
                expect( result ).to.be.a( de.Result.Value );
                expect( result.as_object() ).to.be( files.hello );

                done();
            } );
    } );

    it( 'read unexisted file', function( done ) {
        var block = new de.Block.File(
            {
                filename: resolve( 'files/not-found.txt' )
            }
        );

        block.run()
            .then( function( result ) {
                expect( result ).to.be.a( de.Result.Error );

                var obj = result.as_object();
                expect( obj.code ).to.be( 'ENOENT' );
                expect( obj.syscall ).to.be( 'open' );

                done();
            } );
    } );

    it( 'read unreadable file', function( done ) {
        var block = new de.Block.File(
            {
                filename: resolve( 'files/not-readable.txt' )
            }
        );

        block.run()
            .then( function( result ) {
                expect( result ).to.be.a( de.Result.Error );

                var obj = result.as_object();
                expect( obj.code ).to.be( 'EACCES' );
                expect( obj.syscall ).to.be( 'open' );

                done();
            } );
    } );

    it( 'read json file', function( done ) {
        var block = new de.Block.File(
            {
                filename: resolve( 'files/hello.json' )
            }
        );

        block.run()
            .then( function( result ) {
                expect( result ).to.be.a( de.Result.Value );

                expect( result.as_object() ).to.be.eql( read_as_json( 'files/hello.json' ) );

                done();
            } );
    } );

    it( 'read text file with json', function( done ) {
        var block = new de.Block.File(
            {
                filename: resolve( 'files/hello.json.txt' ),
                is_json: true
            }
        );

        block.run()
            .then( function( result ) {
                expect( result ).to.be.a( de.Result.Value );

                expect( result.as_object() ).to.be.eql( read_as_json( 'files/hello.json.txt' ) );

                done();
            } );
    } );

    it( 'read text file with invalid json', function( done ) {
        var block = new de.Block.File(
            {
                filename: resolve( 'files/hello.txt' ),
                is_json: true
            }
        );

        block.run()
            .then( function( result ) {
                expect( result ).to.be.a( de.Result.Error );
                expect( result.as_object().id ).to.be( 'INVALID_JSON' );

                done();
            } );
    } );

} );

