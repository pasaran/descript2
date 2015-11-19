var expect = require( 'expect.js' );

var de = require( '../lib/de.request.js' );

//  ---------------------------------------------------------------------------------------------------------------  //

var Fake = require( '../lib/de.fake.js' );
var fake = new Fake();

var host = 'http://127.0.0.1:8080';

//  ---------------------------------------------------------------------------------------------------------------  //

var _describe = describe;
describe = function( id, callback ) {
    _describe( id, function() {
        callback( id );
    } );
};

var _it = it;
it = function( id, callback ) {
    _it( id, function( done ) {
        callback( id, done );
    } );
};

//  ---------------------------------------------------------------------------------------------------------------  //

fake.listen( 8080, '0.0.0.0', function() {
    describe( 'basic requests', function() {

        it( '/test/1/', function( path, done ) {
            fake.add( path, {
                status_code: 200,
                content: 'Hello, World',
            } );

            de.request( `${ host }${ path }` )
                .then( function( result ) {
                    expect( result.status_code ).to.be.eql( 200 );
                    expect( result.body.toString() ).to.be.eql( 'Hello, World' );

                    done();
                } );
        } );

        it( '/test/2/', function( path, done ) {
            fake.add( path, {
                status_code: 200,
                content: 'Hello, World',

                callback: function( req ) {
                    expect( req.method ).to.be.eql( 'POST' );
                }
            } );

            de.request( {
                url: `${ host }${ path }`,
                method: 'POST'
            } )
                .then( function( result ) {
                    expect( result.status_code ).to.be.eql( 200 );
                    expect( result.body.toString() ).to.be.eql( 'Hello, World' );

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

