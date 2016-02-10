var qs_ = require( 'querystring' );
var url_ = require( 'url' );

var no = require( 'nommon' );

var expect = require( 'expect.js' );

var de = require( '../lib/de.request.js' );

var helpers = require( './_helpers.js' );

var Fake = require( '../lib/de.fake.js' );

//  ---------------------------------------------------------------------------------------------------------------  //

var port = helpers.port;

var fake = new Fake( { port: port } );

var base_url = `http://127.0.0.1:${ port }`;

var hello_string = 'Hello, World';

var logger = new de.Logger( de.Logger.LEVEL.OFF );

//  ---------------------------------------------------------------------------------------------------------------  //

fake.start( function() {

    describe( 'request', function() {

        describe( 'get request', function() {

            var n = 1;

            it( 'url as a string', function( done ) {
                var path = `/get/${ n++ }`;

                fake.add( path, {
                    status_code: 200,
                    content: hello_string,
                } );

                de.request( `${ base_url }${ path }`, logger )
                    .then( function( result ) {
                        expect( result.status_code ).to.be( 200 );
                        expect( result.body.toString() ).to.be( hello_string );

                        done();
                    } );
            } );

            it( 'url as a option', function( done ) {
                var path = `/get/${ n++ }`;

                fake.add( path, {
                    status_code: 200,
                    content: hello_string,
                } );

                de.request(
                    {
                        url: `${ base_url }${ path }`
                    },
                    logger
                )
                    .then( function( result ) {
                        expect( result.status_code ).to.be( 200 );
                        expect( result.body.toString() ).to.be( hello_string );

                        done();
                    } );
            } );

            it( 'protocol, host, port, path', function( done ) {
                var path = `/get/${ n++ }`;

                fake.add( path, {
                    status_code: 200,
                    content: hello_string,
                } );

                de.request(
                    {
                        protocol: 'http:',
                        host: '127.0.0.1',
                        port: port,
                        path: path
                    },
                    logger
                )
                    .then( function( result ) {
                        expect( result.status_code ).to.be( 200 );
                        expect( result.body.toString() ).to.be( hello_string );

                        done();
                    } );
            } );

            it( 'protocol, hostname, port, path', function( done ) {
                var path = `/get/${ n++ }`;

                fake.add( path, {
                    status_code: 200,
                    content: hello_string,
                } );

                de.request(
                    {
                        protocol: 'http:',
                        hostname: '127.0.0.1',
                        port: port,
                        path: path
                    },
                    logger
                )
                    .then( function( result ) {
                        expect( result.status_code ).to.be( 200 );
                        expect( result.body.toString() ).to.be( hello_string );

                        done();
                    } );
            } );

            it( 'hostname takes priority over host', function( done ) {
                var path = `/get/${ n++ }`;

                fake.add( path, {
                    status_code: 200,
                    content: hello_string,
                } );

                de.request(
                    {
                        hostname: '127.0.0.1',
                        host: '127.0.0.2',
                        port: port,
                        path: path
                    },
                    logger
                )
                    .then( function( result ) {
                        expect( result.status_code ).to.be( 200 );
                        expect( result.body.toString() ).to.be( hello_string );

                        done();
                    } );
            } );

            it( 'method is get', function( done ) {
                var path = `/get/${ n++ }`;

                fake.add( path, function( req, res, data ) {
                    expect( req.method ).to.be.eql( 'GET' );

                    res.end();
                } );

                de.request(
                    {
                        url: `${ base_url }${ path }`
                    },
                    logger
                )
                    .then( function() {
                        done();
                    } );
            } );

            it( 'headers are lower-cased', function( done ) {
                var path = `/get/${ n++ }`;

                fake.add( path, function( req, res, data ) {
                    expect( req.headers[ 'x-request-test-1' ] ).to.be( 'foo' );
                    expect( req.headers[ 'x-request-test-2' ] ).to.be( 'bar' );

                    res.end();
                } );

                de.request(
                    {
                        url: `${ base_url }${ path }`,
                        headers: {
                            'x-request-test-1': 'foo',
                            'X-REQUEST-TEST-2': 'bar'
                        }
                    },
                    logger
                )
                    .then( function() {
                        done();
                    } );
            } );

            it( 'url takes priority over hostname, port, path', function( done ) {
                var path = `/get/${ n++ }`;

                fake.add( path, {
                    status_code: 200,
                    content: hello_string,
                } );

                de.request(
                    {
                        url: `${ base_url }${ path }`,
                        hostname: '127.0.0.2',
                        port: 9090,
                        path: '/-/foo/bar/'
                    },
                    logger
                )
                    .then( function( result ) {
                        expect( result.status_code ).to.be( 200 );
                        expect( result.body.toString() ).to.be( hello_string );

                        done();
                    } );
            } );

            it( 'query', function( done ) {
                var path = `/get/${ n++ }`;

                var query = {
                    hello: 'Привет!',
                    foo: 42
                };

                fake.add( path, function( req, res, data ) {
                    expect( url_.parse( req.url, true ).query ).to.be.eql( query );

                    res.end();
                } );

                de.request(
                    {
                        url: `${ base_url }${ path }`,
                        query: query
                    },
                    logger
                )
                    .then( function() {
                        done();
                    } );
            } );

        } );

        describe( 'post request', function() {
            var n = 1;

            it( 'post', function( done ) {
                var path = `/post/${ n++ }`;

                fake.add( path, {
                    status_code: 200,
                    content: hello_string,
                } );

                de.request(
                    {
                        url: `${ base_url }${ path }`,
                        method: 'POST'
                    },
                    logger
                )
                    .then( function( result ) {
                        expect( result.status_code ).to.be( 200 );
                        expect( result.body.toString() ).to.be( hello_string );

                        done();
                    } );
            } );

            it( 'body is a buffer', function( done ) {
                var path = `/post/${ n++ }`;

                var content = Buffer( 'Привет!' );

                fake.add( path, function( req, res, data ) {
                    expect( Buffer.compare( content, data) ).to.be( 0 );
                    expect( req.headers[ 'content-type' ] ).to.be( 'application/octet-stream' );
                    expect( req.headers[ 'content-length' ] ).to.be( String( Buffer.byteLength( content ) ) );

                    res.end();
                } );

                de.request(
                    {
                        url: `${ base_url }${ path }`,
                        method: 'POST',
                        body: content
                    },
                    logger
                )
                    .then( function() {
                        done();
                    } );
            } );

            it( 'body is an object', function( done ) {
                var path = `/post/${ n++ }`;

                var content = {
                    hello: 'Привет!',
                    foo: 42
                };

                fake.add( path, function( req, res, data ) {
                    expect( qs_.parse( data.toString() ) ).to.be.eql( content );
                    expect( req.headers[ 'content-type' ] ).to.be( 'application/x-www-form-urlencoded' );
                    expect( req.headers[ 'content-length' ] ).to.be( String( qs_.stringify( content ).length ) );

                    res.end();
                } );

                de.request(
                    {
                        url: `${ base_url }${ path }`,
                        method: 'POST',
                        body: content
                    },
                    logger
                )
                    .then( function() {
                        done();
                    } );
            } );

            it( 'body is a string', function( done ) {
                var path = `/post/${ n++ }`;

                var content = hello_string;

                fake.add( path, function( req, res, data ) {
                    expect( data.toString() ).to.be( content );
                    expect( req.headers[ 'content-type' ] ).to.be( 'text/plain' );
                    expect( req.headers[ 'content-length' ] ).to.be( String( content.length ) );

                    res.end();
                } );

                de.request(
                    {
                        url: `${ base_url }${ path }`,
                        method: 'POST',
                        body: content
                    },
                    logger
                )
                    .then( function() {
                        done();
                    } );
            } );

            it( 'body is a string, custom content-type', function( done ) {
                var path = `/post/${ n++ }`;

                var css = 'body { margin: 0 };';

                fake.add( path, function( req, res, data ) {
                    expect( data.toString() ).to.be( css );
                    expect( req.headers[ 'content-type' ] ).to.be( 'text/css' );

                    res.end();
                } );

                de.request(
                    {
                        url: `${ base_url }${ path }`,
                        method: 'POST',
                        headers: {
                            'content-type': 'text/css',
                        },
                        body: css
                    },
                    logger
                )
                    .then( function() {
                        done();
                    } );
            } );

        } );

        describe( 'errors and retries', function() {
            var n = 1;

            it( 'error', function( done ) {
                var path = `/error/${ n++ }`;

                fake.add( path, {
                    status_code: 503
                } );

                de.request( `${ base_url }${ path }`, logger )
                    .then( function( result ) {
                        expect( result ).to.be.a( no.Error );
                        expect( result.error.status_code ).to.be( 503 );

                        done();
                    } );
            } );

            it( 'error with retries', function( done ) {
                var path = `/error/${ n++ }`;

                fake.add( path, {
                    status_code: 503
                } );

                de.request(
                    {
                        url: `${ base_url }${ path }`,
                        max_retries: 1
                    },
                    logger
                )
                    .then( function( result ) {
                        expect( result ).to.be.a( no.Error );
                        expect( result.error.status_code ).to.be( 503 );
                        expect( result.error.log ).to.have.length( 1 );
                        expect( result.error.log[ 0 ].status_code ).to.be( 503 );

                        done();
                    } );
            } );

            it( 'error, retry, success', function( done ) {
                var path = `/error/${ n++ }`;

                fake.add( path, [
                    {
                        status_code: 503
                    },
                    {
                        status_code: 200,
                        content: hello_string
                    }
                ] );

                de.request(
                    {
                        url: `${ base_url }${ path }`,
                        max_retries: 1
                    },
                    logger
                )
                    .then( function( result ) {
                        expect( result.status_code ).to.be( 200 );
                        expect( result.body.toString() ).to.be( hello_string );
                        expect( result.log[ 0 ].status_code ).to.be( 503 );

                        done();
                    } );
            } );

            it( 'no retry on 404 by default', function( done ) {
                var path = `/error/${ n++ }`;

                fake.add( path, {
                    status_code: 404
                } );

                de.request( `${ base_url }${ path }`, logger )
                    .then( function( result ) {
                        expect( result ).to.be.a( no.Error );
                        expect( result.error.status_code ).to.be( 404 );
                        expect( result.error.log ).to.be( undefined );

                        done();
                    } );
            } );

            it( 'retry on 404 with custom is_retry_allowed', function( done ) {
                var path = `/error/${ n++ }`;

                fake.add( path, {
                    status_code: 404
                } );

                de.request(
                    {
                        url: `${ base_url }${ path }`,
                        max_retries: 1,
                        is_retry_allowed: function() {
                            return true;
                        }
                    },
                    logger
                )
                    .then( function( result ) {
                        expect( result ).to.be.a( no.Error );
                        expect( result.error.status_code ).to.be( 404 );
                        expect( result.error.log ).to.have.length( 1 );

                        done();
                    } );
            } );

            it( 'connection closed', function( done ) {
                var path = `/error/${ n++ }`;

                fake.add( path, {
                    wait: 1000,
                    timeout: 100
                } );

                de.request(
                    {
                        url: `${ base_url }${ path }`
                    },
                    logger
                )
                    .then( function( result ) {
                        expect( result ).to.be.a( no.Error );
                        expect( result.error.id ).to.be( 'HTTP_UNKNOWN_ERROR' );

                        done();
                    } );
            } );
        } );

        describe( 'redirect', function() {
            var n = 1;

            it( 'redirect', function( done ) {
                var path = `/redirect/${ n++ }`;

                fake.add( `${ path }/foo`, {
                    status_code: 302,
                    headers: {
                        'location': `${ base_url }${ path }/bar`
                    }
                } );
                fake.add( `${ path }/bar`, {
                    status_code: 200,
                    content: hello_string
                } );

                de.request(
                    {
                        url: `${ base_url }${ path }/foo`
                    },
                    logger
                )
                    .then( function( result ) {
                        expect( result.status_code ).to.be( 200 );
                        expect( result.body.toString() ).to.be( hello_string );
                        expect( result.log ).to.have.length( 1 );
                        expect( result.log[ 0 ].status_code ).to.be( 302 );
                        expect( result.log[ 0 ].headers.location ).to.be( `${ base_url }${ path }/bar` );

                        done();
                    } );
            } );

            it( 'no redirect with max_redirects=0', function( done ) {
                var path = `/redirect/${ n++ }`;

                fake.add( `${ path }/foo`, {
                    status_code: 302,
                    headers: {
                        'location': `${ base_url }${ path }/bar`
                    }
                } );
                fake.add( `${ path }/bar`, {
                    status_code: 200,
                    content: hello_string
                } );

                de.request(
                    {
                        url: `${ base_url }${ path }/foo`,
                        max_redirects: 0
                    },
                    logger
                )
                    .then( function( result ) {
                        expect( result.status_code ).to.be( 302 );
                        expect( result.headers[ 'location' ] ).to.be( `${ base_url }${ path }/bar` );
                        expect( result.log ).to.be( undefined );

                        done();
                    } );
            } );

        } );

    } );

    run();
} );

//  ---------------------------------------------------------------------------------------------------------------  //

after( function() {
    fake.stop();
} );

