/* eslint-env mocha */

var expect = require( 'expect.js' );

var de = require( '../lib/index.js' );

const helpers = require( './_helpers.js' );

var Fake = require( '../lib/de.fake.js' );

//  ---------------------------------------------------------------------------------------------------------------  //

var port = helpers.port;

var fake = new Fake( { port: port } );

var base_url = `http://127.0.0.1:${ port }`;

//  ---------------------------------------------------------------------------------------------------------------  //

var log = new de.Log( {
    debug: true
} );

function create_context() {
    var context = new de.Context.Base( {
        log: log
    } );

    return context;
}

function create_block( block, options, factory ) {
    if ( !factory ) {
        factory = ( typeof block === 'function' ) ? de.func : de.http;
    }

    return factory( {
        block: block,
        options: options
    } );
}

//  ---------------------------------------------------------------------------------------------------------------  //

fake.start( function() {

    describe( 'block.func', function() {

        var n = 1;

        it( 'abort sub requests', function( done ) {
            var path = `/block/http/${ n++ }`;

            var REASON = 'SOME REASON';

            fake.add( `${ path }/1`, {
                status_code: 200,
                content: 'Hello',
                wait: 100
            } );
            fake.add( `${ path }/2`, {
                status_code: 200,
                content: 'World',
                wait: 1000
            } );

            var b1 = create_block( `${ base_url }${ path }/1` );
            var b2 = create_block( `${ base_url }${ path }/2` );

            var context = create_context();
            var t1 = Date.now();
            var promise = context.run( function( params, context, state ) {
                return de.object( {
                    block: {
                        foo: b1,
                        bar: b2
                    }
                } );
            } );
            promise.then( function( result ) {
                var t2 = Date.now();
                //  Тут должно быть 200 с небольшим, но непонятно, насколько с "небольшим".
                expect( t2 - t1 < 300 ).to.be.ok();

                expect( result.bar ).to.be.a( de.Error );
                expect( result.bar.error.id ).to.be( de.Error.ID.HTTP_REQUEST_ABORTED );
                expect( result.bar.error.reason ).to.be( REASON );

                done();
            } );
            setTimeout( function() {
                promise.abort( REASON );
            }, 200 );
        } );

    } );

    run();

} );

//  ---------------------------------------------------------------------------------------------------------------  //

after( function() {
    fake.stop();
} );

