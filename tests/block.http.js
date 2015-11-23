var url_ = require( 'url' );
var qs_ = require( 'querystring' );

var no = require( 'nommon' );

var expect = require( 'expect.js' );

var de = require( '../lib/blocks/de.block.http.js' );
require( '../lib/results/index.js' );

//  ---------------------------------------------------------------------------------------------------------------  //

var Fake = require( '../lib/de.fake.js' );
var fake = new Fake();

var base_url = 'http://127.0.0.1:8080';

var port = require( './_port.js' )();

//  ---------------------------------------------------------------------------------------------------------------  //

fake.listen( port, '0.0.0.0', function() {

    describe( 'block.http', function() {
        var n = 1;

        it( 'options as a string', function( done ) {
            var path = `/block/http/${ n++ }`;

            var content = 'Hello, World';

            fake.add( path, {
                status_code: 200,
                content: content,
            } );

            var block = new de.Block.Http( `${ base_url }${ path }` );

            block.run()
                .then( function( result ) {
                    expect( result ).to.be.a( de.Result.Value );
                    expect( result.as_object() ).to.be( content );

                    done();
                } );
        } );

        it( 'options as a function', function( done ) {
            var path = `/block/http/${ n++ }`;

            var content = 'Hello, World';

            fake.add( `${ path }/42`, {
                status_code: 200,
                content: content,
            } );

            var block = new de.Block.Http( function( params ) {
                return {
                    url: `${ base_url }${ path }/${ params.id }`
                };
            } );

            block.run( { id: 42 } )
                .then( function( result ) {
                    expect( result ).to.be.a( de.Result.Value );
                    expect( result.as_object() ).to.be( content );

                    done();
                } );
        } );

        it( 'options.url', function( done ) {
            var path = `/block/http/${ n++ }`;

            var content = 'Hello, World';

            fake.add( path, {
                status_code: 200,
                content: content,
            } );

            var block = new de.Block.Http( {
                url: `${ base_url }${ path }`
            } );

            block.run()
                .then( function( result ) {
                    expect( result ).to.be.a( de.Result.Value );
                    expect( result.as_object() ).to.be( content );

                    done();
                } );
        } );

        it( 'options.only_meta', function( done ) {
            var path = `/block/http/${ n++ }`;

            var content = 'Hello, World';

            fake.add( path, {
                status_code: 200,
                content: content,
            } );

            var block = new de.Block.Http( {
                url: `${ base_url }${ path }`,
                only_meta: true
            } );

            block.run()
                .then( function( result ) {
                    expect( result ).to.be.a( de.Result.Value );
                    expect( result.as_object().status_code ).to.be( 200 );
                    expect( result.as_object().headers[ 'content-type' ] ).to.be( 'text/plain' );

                    done();
                } );
        } );

        it( 'options.is_json', function( done ) {
            var path = `/block/http/${ n++ }`;

            var content = {
                foo: 42
            };

            fake.add( path, {
                status_code: 200,
                content: JSON.stringify( content ),
            } );

            var block = new de.Block.Http( {
                url: `${ base_url }${ path }`,
                is_json: true
            } );

            block.run()
                .then( function( result ) {
                    expect( result ).to.be.a( de.Result.Value );
                    expect( result.as_object() ).to.be.eql( content );

                    done();
                } );
        } );

        it( 'options.is_json and invalid json', function( done ) {
            var path = `/block/http/${ n++ }`;

            fake.add( path, {
                status_code: 200,
                content: '{"foo":'
            } );

            var block = new de.Block.Http( {
                url: `${ base_url }${ path }`,
                is_json: true
            } );

            block.run()
                .then( function( result ) {
                    expect( result ).to.be.a( de.Result.Error );
                    //  FIXME: Брать коды ошибок из одного места.
                    expect( result.as_object() ).to.be.eql( { id: 'JSON_PARSE_ERROR' } );

                    done();
                } );
        } );

        it( 'json content-type, without options.is_json', function( done ) {
            var path = `/block/http/${ n++ }`;

            var content = {
                foo: 42
            };

            fake.add( path, {
                status_code: 200,
                content: content
            } );

            var block = new de.Block.Http( {
                url: `${ base_url }${ path }`
            } );

            block.run()
                .then( function( result ) {
                    expect( result ).to.be.a( de.Result.Value );
                    expect( result.as_object() ).to.be.eql( content );

                    done();
                } );
        } );

        it( 'options.url with { expr }', function( done ) {
            var path = `/block/http/${ n++ }`;

            var content = 'Hello, World';

            fake.add( `${ path }/42`, {
                status_code: 200,
                content: content
            } );

            var block = new de.Block.Http( {
                url: `${ base_url }${ path }/{ .id }`
            } );

            block.run( { id: 42 } )
                .then( function( result ) {
                    expect( result ).to.be.a( de.Result.Value );
                    expect( result.as_object() ).to.be.eql( content );

                    done();
                } );
        } );

        it( 'options.query and GET request', function( done ) {
            var path = `/block/http/${ n++ }`;

            fake.add( path, function( req, res, data ) {
                var query = url_.parse( req.url, true ).query;

                expect( query ).to.be.eql( {
                    foo: 42,
                    quu: 24
                } );

                done();
            } );

            var block = new de.Block.Http( {
                url: `${ base_url }${ path }`,
                query: {
                    foo: no.jpath.expr( '.bar' ),
                    quu: 24
                }
            } );

            block.run( {
                foo: 24,
                bar: 42
            } );
        } );

        it( 'options.query, no options.body and POST request', function( done ) {
            var path = `/block/http/${ n++ }`;

            var params = {
                foo: 24,
                bar: 42,
                quu: 66,
                boo: 93
            };

            fake.add( path, function( req, res, data ) {
                var query = url_.parse( req.url, true ).query;
                var body = qs_.parse( data.toString() );

                expect( query ).to.be.eql( {
                    foo: 42,
                    hello: 'hello'
                } );
                expect( body ).to.be.eql( body );

                done();
            } );

            var block = new de.Block.Http( {
                url: `${ base_url }${ path }`,
                method: 'POST',
                query: {
                    foo: no.jpath.expr( '.bar' ),
                    hello: 'hello'
                }
            } );

            block.run( params );
        } );

    } );

    run();
} );

//  ---------------------------------------------------------------------------------------------------------------  //

after( function() {
    fake.close();
} );

