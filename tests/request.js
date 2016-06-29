/* eslint-env mocha */

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

var log = new de.Log( {
    debug: true
} );

function create_context() {
    var context = new de.Context.Base( {
        log: log
    } );

    return context;
}
//  ---------------------------------------------------------------------------------------------------------------  //

fake.start( function() {

    describe( 'request', function() {

        var n = 1;

        describe( 'get request', function() {

            it( 'url as a option', function( done ) {
                var path = `/get/${ n++ }`;

                fake.add( path, {
                    status_code: 200,
                    content: hello_string,
                } );

                var context = create_context();
                de.request(
                    {
                        url: `${ base_url }${ path }`
                    },
                    context
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

                var context = create_context();
                de.request(
                    {
                        protocol: 'http:',
                        host: '127.0.0.1',
                        port: port,
                        path: path
                    },
                    context
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

                var context = create_context();
                de.request(
                    {
                        url: `${ base_url }${ path }`
                    },
                    context
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

                var context = create_context();
                de.request(
                    {
                        url: `${ base_url }${ path }`,
                        headers: {
                            'x-request-test-1': 'foo',
                            'X-REQUEST-TEST-2': 'bar'
                        }
                    },
                    context
                )
                    .then( function() {
                        done();
                    } );
            } );

            it( 'url takes priority over host, port, path', function( done ) {
                var path = `/get/${ n++ }`;

                fake.add( path, {
                    status_code: 200,
                    content: hello_string,
                } );

                var context = create_context();
                de.request(
                    {
                        url: `${ base_url }${ path }`,
                        host: '127.0.0.2',
                        port: 9090,
                        path: '/-/foo/bar/'
                    },
                    context
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

                var context = create_context();
                de.request(
                    {
                        url: `${ base_url }${ path }`,
                        query: query
                    },
                    context
                )
                    .then( function() {
                        done();
                    } );
            } );

            it( 'url with query', function( done ) {
                var path = `/get${ n++ }`;

                fake.add( path, function( req, res, data ) {
                    expect( url_.parse( req.url, true ).query ).to.be.eql( {
                        foo: 42,
                        bar: 24
                    } );

                    res.end();
                } );

                var context = create_context();
                de.request(
                    {
                        url: `${ base_url }${ path }?foo=42`,
                        query: {
                            bar: 24
                        }
                    },
                    context
                )
                    .then( function() {
                        done();
                    } );
            } );

        } );

        describe( 'post request', function() {

            it( 'post', function( done ) {
                var path = `/post/${ n++ }`;

                fake.add( path, {
                    status_code: 200,
                    content: hello_string,
                } );

                var context = create_context();
                de.request(
                    {
                        url: `${ base_url }${ path }`,
                        method: 'POST'
                    },
                    context
                )
                    .then( function( result ) {
                        expect( result.status_code ).to.be( 200 );
                        expect( result.body.toString() ).to.be( hello_string );

                        done();
                    } );
            } );

            it( 'body is a buffer', function( done ) {
                var path = `/post/${ n++ }`;

                var content = new Buffer( 'Привет!' );

                fake.add( path, function( req, res, data ) {
                    expect( Buffer.compare( content, data ) ).to.be( 0 );
                    expect( req.headers[ 'content-type' ] ).to.be( 'application/octet-stream' );
                    expect( req.headers[ 'content-length' ] ).to.be( String( Buffer.byteLength( content ) ) );

                    res.end();
                } );

                var context = create_context();
                de.request(
                    {
                        url: `${ base_url }${ path }`,
                        method: 'POST',
                        body: content
                    },
                    context
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

                var context = create_context();
                de.request(
                    {
                        url: `${ base_url }${ path }`,
                        method: 'POST',
                        body: content
                    },
                    context
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

                var context = create_context();
                de.request(
                    {
                        url: `${ base_url }${ path }`,
                        method: 'POST',
                        body: content
                    },
                    context
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

                var context = create_context();
                de.request(
                    {
                        url: `${ base_url }${ path }`,
                        method: 'POST',
                        headers: {
                            'content-type': 'text/css',
                        },
                        body: css
                    },
                    context
                )
                    .then( function() {
                        done();
                    } );
            } );

        } );

        describe( 'errors and retries', function() {

            it( 'error', function( done ) {
                var path = `/error/${ n++ }`;

                var error = {
                    error: {
                        reason: 'Something wrong'
                    }
                };

                fake.add( path, {
                    status_code: 503,
                    content: error
                } );

                var context = create_context();
                de.request(
                    {
                        url: `${ base_url }${ path }`
                    },
                    context
                )
                    .then( function( result ) {
                        expect( result ).to.be.a( no.Error );
                        expect( result.error.status_code ).to.be( 503 );
                        expect( String( result.error.body ) ).to.be( JSON.stringify( error ) );

                        done();
                    } );
            } );

            it( 'error with retries', function( done ) {
                var path = `/error/${ n++ }`;

                var error = {
                    error: {
                        reason: 'Something wrong'
                    }
                };

                fake.add( path, {
                    status_code: 503,
                    content: error
                } );

                var context = create_context();
                de.request(
                    {
                        url: `${ base_url }${ path }`,
                        max_retries: 1
                    },
                    context
                )
                    .then( function( result ) {
                        expect( result ).to.be.a( no.Error );
                        expect( result.error.status_code ).to.be( 503 );
                        expect( String( result.error.body ) ).to.be( JSON.stringify( error ) );

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

                var context = create_context();
                de.request(
                    {
                        url: `${ base_url }${ path }`,
                        max_retries: 1
                    },
                    context
                )
                    .then( function( result ) {
                        expect( result.status_code ).to.be( 200 );
                        expect( result.body.toString() ).to.be( hello_string );

                        done();
                    } );
            } );

            it( 'no retry on 404 by default', function( done ) {
                var path = `/error/${ n++ }`;

                fake.add( path, {
                    status_code: 404
                } );

                var context = create_context();
                de.request(
                    {
                        url: `${ base_url }${ path }`
                    },
                    context
                )
                    .then( function( result ) {
                        expect( result ).to.be.a( no.Error );
                        expect( result.error.status_code ).to.be( 404 );

                        done();
                    } );
            } );

            it( 'retry on 404 with custom is_retry_allowed', function( done ) {
                var path = `/error/${ n++ }`;

                fake.add( path, {
                    status_code: 404
                } );

                var context = create_context();
                de.request(
                    {
                        url: `${ base_url }${ path }`,
                        max_retries: 1,
                        is_retry_allowed: function() {
                            return true;
                        }
                    },
                    context
                )
                    .then( function( result ) {
                        expect( result ).to.be.a( no.Error );
                        expect( result.error.status_code ).to.be( 404 );

                        done();
                    } );
            } );

            it( 'connection closed', function( done ) {
                var path = `/error/${ n++ }`;

                fake.add( path, {
                    wait: 1000,
                    timeout: 100
                } );

                var context = create_context();
                de.request(
                    {
                        url: `${ base_url }${ path }`
                    },
                    context
                )
                    .then( function( result ) {
                        expect( result ).to.be.a( no.Error );
                        expect( result.error.id ).to.be( 'HTTP_UNKNOWN_ERROR' );

                        done();
                    } );
            } );

            it( 'abort', function( done ) {
                var path = `/error/${ n++ }`;

                fake.add( path, {
                    wait: 5000,
                    content: hello_string
                } );

                var context = create_context();
                var promise = de.request(
                    {
                        url: `${ base_url }${ path }`
                    },
                    context
                );
                promise.then( function( result ) {
                    expect( result ).to.be.a( no.Error );
                    expect( result.error.id ).to.be( 'HTTP_REQUEST_ABORTED' );

                    done();
                } );

                setTimeout( function() {
                    promise.trigger( 'abort' );
                }, 100 );
            } );

        } );

        describe( 'redirect', function() {

            it( 'redirect', function( done ) {
                var path = `/redirect/${ n++ }`;

                fake.add( `${ path }/foo`, {
                    status_code: 302,
                    wait: 50,
                    headers: {
                        'location': `${ base_url }${ path }/bar`
                    }
                } );
                fake.add( `${ path }/bar`, {
                    status_code: 200,
                    wait: 50,
                    content: hello_string
                } );

                var context = create_context();
                de.request(
                    {
                        url: `${ base_url }${ path }/foo`,
                        max_redirects: 1
                    },
                    context
                )
                    .then( function( result ) {
                        expect( result.status_code ).to.be( 200 );
                        expect( result.body.toString() ).to.be( hello_string );

                        done();
                    } );
            } );

            it( 'location without host', function( done ) {
                var path = `/redirect/${ n++ }`;

                fake.add( `${ path }/foo`, {
                    status_code: 302,
                    wait: 50,
                    headers: {
                        'location': `${ path }/bar`
                    }
                } );
                fake.add( `${ path }/bar`, {
                    status_code: 200,
                    wait: 50,
                    content: hello_string
                } );

                var context = create_context();
                de.request(
                    {
                        url: `${ base_url }${ path }/foo`,
                        max_redirects: 1
                    },
                    context
                )
                    .then( function( result ) {
                        expect( result.status_code ).to.be( 200 );
                        expect( result.body.toString() ).to.be( hello_string );

                        done();
                    } );
            } );

            it( 'redirect to the same url', function( done ) {
                var path = `/redirect/${ n++ }`;

                fake.add( `${ path }/foo`, {
                    status_code: 302,
                    wait: 50,
                    headers: {
                        'location': `${ path }/foo`
                    }
                } );

                var context = create_context();
                de.request(
                    {
                        url: `${ base_url }${ path }/foo`,
                        max_redirects: 1
                    },
                    context
                )
                    .then( function( result ) {
                        expect( result ).to.be.a( no.Error );
                        expect( result.error.id ).to.be( 'HTTP_CYCLIC_REDIRECT' );

                        done();
                    } );
            } );

            it( 'cyclic redirect', function( done ) {
                var path = `/cyclic-redirect/${ n++ }`;

                fake.add( `${ path }/foo`, {
                    status_code: 302,
                    wait: 50,
                    headers: {
                        'location': `${ path }/bar`
                    }
                } );
                fake.add( `${ path }/bar`, {
                    status_code: 302,
                    wait: 50,
                    headers: {
                        'location': `${ path }/foo`
                    }
                } );

                var context = create_context();
                de.request(
                    {
                        url: `${ base_url }${ path }/foo`,
                        max_redirects: 2
                    },
                    context
                )
                    .then( function( result ) {
                        expect( result ).to.be.a( no.Error );
                        expect( result.error.id ).to.be( 'HTTP_CYCLIC_REDIRECT' );

                        done();
                    } );
            } );

            it( 'no redirect by default', function( done ) {
                var path = `/redirect/${ n++ }`;

                fake.add( `${ path }/foo`, {
                    status_code: 302,
                    wait: 100,
                    headers: {
                        'location': `${ base_url }${ path }/bar`
                    }
                } );
                fake.add( `${ path }/bar`, {
                    status_code: 200,
                    content: hello_string
                } );

                var context = create_context();
                de.request(
                    {
                        url: `${ base_url }${ path }/foo`
                    },
                    context
                )
                    .then( function( result ) {
                        expect( result.status_code ).to.be( 302 );
                        expect( result.headers[ 'location' ] ).to.be( `${ base_url }${ path }/bar` );

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

