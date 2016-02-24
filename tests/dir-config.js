var no = require( 'nommon' );

var expect = require( 'expect.js' );

var de = require( '../lib/index.js' );

var helpers = require( './_helpers.js' );

//  ---------------------------------------------------------------------------------------------------------------  //

describe( 'dir config', function() {

    it( 'block without config', function( done ) {
        var block = de.require( `${ __dirname }/includes/dir-config/1.js` );
        var context = new de.Context.Base();
        context.run( block )
            .then( function( result ) {
                expect( result ).to.be.eql( { foo: { bar: 42 } } );

                done();
            } );
    } );

    it( 'block with config', function( done ) {
        var block = de.require( `${ __dirname }/includes/dir-config/1/1.js` );
        var context = new de.Context.Base();
        context.run( block )
            .then( function( result ) {
                expect( result ).to.be.eql( 42 );

                done();
            } );
    } );

} );

