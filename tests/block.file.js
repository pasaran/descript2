var fs_ = require( 'fs' );
var path_ = require( 'path' );

var no = require( 'nommon' );

var expect = require( 'expect.js' );

var de = require( '../lib/index.js' );

var helpers = require( './_helpers.js' );

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

        var context = helpers.context();
        context.run( block )
            .then( function( result ) {
                expect( result ).to.be( files.hello );

                done();
            } );
    } );

    it( 'read text file, absolute path', function( done ) {
        var block = new de.Block.File(
            {
                filename: resolve( 'files/hello.txt' )
            }
        );

        var context = helpers.context();
        context.run( block )
            .then( function( result ) {
                expect( result ).to.be( files.hello );

                done();
            } );
    } );

    it( 'read unexisted file', function( done ) {
        var block = new de.Block.File(
            {
                filename: resolve( 'files/not-found.txt' )
            }
        );

        var context = helpers.context();
        context.run( block )
            .then( function( result ) {
                expect( result ).to.be.a( de.Error );

                expect( result.error.code ).to.be( 'ENOENT' );
                expect( result.error.syscall ).to.be( 'open' );

                done();
            } );
    } );

    it( 'read unreadable file', function( done ) {
        var filename = resolve( 'files/not-readable.txt' );

        fs_.writeFileSync( filename, 'Hello', 'utf-8' );
        fs_.chmodSync( filename, 0222 );

        var block = new de.Block.File(
            {
                filename: filename
            }
        );

        var context = helpers.context();
        context.run( block )
            .then( function( result ) {
                expect( result ).to.be.a( de.Error );

                expect( result.error.code ).to.be( 'EACCES' );
                expect( result.error.syscall ).to.be( 'open' );

                done();
            } );
    } );

    it( 'read json file', function( done ) {
        var block = new de.Block.File(
            {
                filename: resolve( 'files/hello.json' )
            }
        );

        var context = helpers.context();
        context.run( block )
            .then( function( result ) {
                expect( result ).to.be.eql( read_as_json( 'files/hello.json' ) );

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

        var context = helpers.context();
        context.run( block )
            .then( function( result ) {
                expect( result ).to.be.eql( read_as_json( 'files/hello.json.txt' ) );

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

        var context = helpers.context();
        context.run( block )
            .then( function( result ) {
                expect( result ).to.be.a( de.Error );
                expect( result.error.id ).to.be( 'INVALID_JSON' );

                done();
            } );
    } );

} );

