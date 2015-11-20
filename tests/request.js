var qs_ = require( 'querystring' );
var url_ = require( 'url' );

var expect = require( 'expect.js' );

var de = require( '../lib/de.request.js' );

//  ---------------------------------------------------------------------------------------------------------------  //

var Fake = require( '../lib/de.fake.js' );
var fake = new Fake();

var base_url = 'http://127.0.0.1:8080';

//  ---------------------------------------------------------------------------------------------------------------  //

fake.listen( 8080, '0.0.0.0', function() {

    describe( 'get request', function() {

        var n = 1;

        it( 'url as a string', function( done ) {
            var path = `/get/${ n++ }/`;

            fake.add( path, {
                status_code: 200,
                content: 'Hello, World',
            } );

            de.request( `${ base_url }${ path }` )
                .then( function( result ) {
                    expect( result.status_code ).to.be.eql( 200 );
                    expect( result.body.toString() ).to.be.eql( 'Hello, World' );

                    done();
                } );
        } );

        it( 'url as a option', function( done ) {
            var path = `/get/${ n++ }/`;

            fake.add( path, {
                status_code: 200,
                content: 'Hello, World',
            } );

            de.request( {
                url: `${ base_url }${ path }`
            } )
                .then( function( result ) {
                    expect( result.status_code ).to.be.eql( 200 );
                    expect( result.body.toString() ).to.be.eql( 'Hello, World' );

                    done();
                } );
        } );

        it( 'protocol, host, port, path', function( done ) {
            var path = `/get/${ n++ }/`;

            fake.add( path, {
                status_code: 200,
                content: 'Hello, World',
            } );

            de.request( {
                protocol: 'http:',
                host: '127.0.0.1',
                port: 8080,
                path: path
            } )
                .then( function( result ) {
                    expect( result.status_code ).to.be.eql( 200 );
                    expect( result.body.toString() ).to.be.eql( 'Hello, World' );

                    done();
                } );
        } );

        it( 'protocol, hostname, port, path', function( done ) {
            var path = `/get/${ n++ }/`;

            fake.add( path, {
                status_code: 200,
                content: 'Hello, World',
            } );

            de.request( {
                protocol: 'http:',
                hostname: '127.0.0.1',
                port: 8080,
                path: path
            } )
                .then( function( result ) {
                    expect( result.status_code ).to.be.eql( 200 );
                    expect( result.body.toString() ).to.be.eql( 'Hello, World' );

                    done();
                } );
        } );

        it( 'hostname takes priority over host', function( done ) {
            var path = `/get/${ n++ }/`;

            fake.add( path, {
                status_code: 200,
                content: 'Hello, World',
            } );

            de.request( {
                hostname: '127.0.0.1',
                host: '127.0.0.2',
                port: 8080,
                path: path
            } )
                .then( function( result ) {
                    expect( result.status_code ).to.be.eql( 200 );
                    expect( result.body.toString() ).to.be.eql( 'Hello, World' );

                    done();
                } );
        } );

        it( 'method is get', function( done ) {
            var path = `/get/${ n++ }/`;

            fake.add( path, function( req ) {
                expect( req.method ).to.be.eql( 'GET' );

                done();
            } );

            de.request( {
                url: `${ base_url }${ path }`
            } );
        } );

        it( 'headers are lower-cased', function( done ) {
            var path = `/get/${ n++ }/`;

            fake.add( path, function( req ) {
                expect( req.headers[ 'x-request-test-1' ] ).to.be.eql( 'foo' );
                expect( req.headers[ 'x-request-test-2' ] ).to.be.eql( 'bar' );

                done();
            } );

            de.request( {
                url: `${ base_url }${ path }`,
                headers: {
                    'x-request-test-1': 'foo',
                    'X-REQUEST-TEST-2': 'bar'
                }
            } );
        } );

        it( 'url takes priority over hostname, port, path', function( done ) {
            var path = `/get/${ n++ }/`;

            fake.add( path, {
                status_code: 200,
                content: 'Hello, World',
            } );

            de.request( {
                url: `${ base_url }${ path }`,
                hostname: '127.0.0.2',
                port: 9090,
                path: '/-/foo/bar/'
            } )
                .then( function( result ) {
                    expect( result.status_code ).to.be.eql( 200 );
                    expect( result.body.toString() ).to.be.eql( 'Hello, World' );

                    done();
                } );
        } );

        it( 'query', function( done ) {
            var path = `/get/${ n++ }/`;

            var query = {
                hello: 'Привет!',
                foo: 42
            };

            fake.add( path, function( req ) {
                expect( url_.parse( req.url, true ).query ).to.be.eql( query );

                done();
            } );

            de.request( {
                url: `${ base_url }${ path }`,
                query: query
            } );
        } );

    } );

    describe( 'post request', function() {
        var n = 1;

        it( 'post', function( done ) {
            var path = `/post/${ n++ }/`;

            fake.add( path, {
                status_code: 200,
                content: 'Hello, World',
            } );

            de.request( {
                url: `${ base_url }${ path }`,
                method: 'POST'
            } )
                .then( function( result ) {
                    expect( result.status_code ).to.be.eql( 200 );
                    expect( result.body.toString() ).to.be.eql( 'Hello, World' );

                    done();
                } );
        } );

        it( 'body is a buffer', function( done ) {
            var path = `/post/${ n++ }/`;

            var content = Buffer( 'Привет!' );

            fake.add( path, function( req, res, data ) {
                expect( Buffer.compare( content, data) ).to.be.eql( 0 );
                expect( req.headers[ 'content-type' ] ).to.be.eql( 'application/octet-stream' );
                expect( req.headers[ 'content-length' ] ).to.be.eql( Buffer.byteLength( content ) );

                done();
            } );

            de.request( {
                url: `${ base_url }${ path }`,
                method: 'POST',
                body: content
            } );
        } );

        it( 'body is an object', function( done ) {
            var path = `/post/${ n++ }/`;

            var content = {
                hello: 'Привет!',
                foo: 42
            };

            fake.add( path, function( req, res, data ) {
                expect( qs_.parse( data.toString() ) ).to.be.eql( content );
                expect( req.headers[ 'content-type' ] ).to.be.eql( 'application/x-www-form-urlencoded' );
                expect( req.headers[ 'content-length' ] ).to.be.eql( qs_.stringify( content ).length );

                done();
            } );

            de.request( {
                url: `${ base_url }${ path }`,
                method: 'POST',
                body: content
            } );
        } );

        it( 'body is a string', function( done ) {
            var path = `/post/${ n++ }/`;

            var content = 'Hello, World';

            fake.add( path, function( req, res, data ) {
                expect( data.toString() ).to.be.eql( content );
                expect( req.headers[ 'content-type' ] ).to.be.eql( 'text/plain' );
                expect( req.headers[ 'content-length' ] ).to.be.eql( content.length );

                done();
            } );

            de.request( {
                url: `${ base_url }${ path }`,
                method: 'POST',
                body: content
            } );
        } );

        it( 'body is a string, custom content-type', function( done ) {
            var path = `/post/${ n++ }/`;

            var css = 'body { margin: 0 };';

            fake.add( path, function( req, res, data ) {
                expect( data.toString() ).to.be.eql( css );
                expect( req.headers[ 'content-type' ] ).to.be.eql( 'text/css' );

                done();
            } );

            de.request( {
                url: `${ base_url }${ path }`,
                method: 'POST',
                headers: {
                    'content-type': 'text/css',
                },
                body: css
            } );
        } );

    } );

    run();
} );

//  ---------------------------------------------------------------------------------------------------------------  //

after( function() {
    fake.close();
} );

