var url_ = require( 'url' );
var qs_ = require( 'querystring' );

var no = require( 'nommon' );

var expect = require( 'expect.js' );

var de = require( '../lib/index.js' );

var helpers = require( './_helpers.js' );

var Fake = require( '../lib/de.fake.js' );

//  ---------------------------------------------------------------------------------------------------------------  //

var port = helpers.port;

var fake = new Fake( { port: port } );

var base_url = `http://127.0.0.1:${ port }`;

//  ---------------------------------------------------------------------------------------------------------------  //

function create_block( block, options ) {
    return de.http( block, options )._compile();
}

//  ---------------------------------------------------------------------------------------------------------------  //

fake.start( function() {

    describe( 'block.http', function() {

        var n = 1;

        it( 'options as a string', function( done ) {
            var path = `/block/http/${ n++ }`;

            var content = 'Hello, World';

            fake.add( path, {
                status_code: 200,
                content: content,
            } );

            var block = create_block( `${ base_url }${ path }` );

            var context = helpers.context();
            context.run( block )
                .then( function( result ) {
                    expect( result ).to.be( content );

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

            var block = create_block( function( params ) {
                return {
                    url: `${ base_url }${ path }/${ params.id }`
                };
            } );

            var context = helpers.context();
            context.run( block, { id: 42 } )
                .then( function( result ) {
                    expect( result ).to.be( content );

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

            var block = create_block( {
                url: `${ base_url }${ path }`
            } );

            var context = helpers.context();
            context.run( block )
                .then( function( result ) {
                    expect( result ).to.be( content );

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

            var block = create_block( {
                url: `${ base_url }${ path }`,
                only_meta: true
            } );

            var context = helpers.context();
            context.run( block )
                .then( function( result ) {
                    expect( result.status_code ).to.be( 200 );
                    expect( result.headers[ 'content-type' ] ).to.be( 'text/plain' );

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

            var block = create_block( {
                url: `${ base_url }${ path }`,
                is_json: true
            } );

            var context = helpers.context();
            context.run( block )
                .then( function( result ) {
                    expect( result ).to.be.eql( content );

                    done();
                } );
        } );

        it( 'options.is_json and invalid json', function( done ) {
            var path = `/block/http/${ n++ }`;

            fake.add( path, {
                status_code: 200,
                content: '{"foo":&'
            } );

            var block = create_block( {
                url: `${ base_url }${ path }`,
                is_json: true
            } );

            var context = helpers.context();
            context.run( block )
                .then( function( result ) {
                    expect( result ).to.be.a( de.Error );

                    expect( result.error.id ).to.be( 'INVALID_JSON' );
                    expect( result.error.message ).to.be( 'Unexpected token &' );

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

            var block = create_block( {
                url: `${ base_url }${ path }`
            } );

            var context = helpers.context();
            context.run( block )
                .then( function( result ) {
                    expect( result ).to.be.eql( content );

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

            var block = create_block( {
                url: `${ base_url }${ path }/{ .id }`
            } );

            var context = helpers.context();
            context.run( block, { id: 42 } )
                .then( function( result ) {
                    expect( result ).to.be.eql( content );

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

            var block = create_block( {
                url: `${ base_url }${ path }`,
                query: {
                    foo: no.jpath.expr( '.bar' ),
                    quu: 24
                }
            } );

            var context = helpers.context();
            context.run( block, {
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
                expect( body ).to.be.eql( params );

                done();
            } );

            var block = create_block( {
                url: `${ base_url }${ path }`,
                method: 'POST',
                query: {
                    foo: no.jpath.expr( '.bar' ),
                    hello: 'hello'
                }
            } );

            var context = helpers.context();
            context.run( block, params );
        } );

        it( 'no options.query, options.body and POST request', function( done ) {
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

                expect( query ).to.be.eql( {} );
                expect( body ).to.be.eql( {
                    bar: 24,
                    boo: 66,
                    qoo: 35
                } );

                done();
            } );

            var block = create_block( {
                url: `${ base_url }${ path }`,
                method: 'POST',
                body: {
                    bar: no.jpath.expr( '.foo' ),
                    boo: no.jpath.expr( '.quu' ),
                    qoo: 35
                }
            } );

            var context = helpers.context();
            context.run( block, params );
        } );

        it( 'options.query, options.body and POST request', function( done ) {
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
                expect( body ).to.be.eql( {
                    bar: 24,
                    boo: 66,
                    qoo: 35
                } );

                done();
            } );

            var block = create_block( {
                url: `${ base_url }${ path }`,
                method: 'POST',
                query: {
                    foo: no.jpath.expr( '.bar' ),
                    hello: 'hello'
                },
                body: {
                    bar: no.jpath.expr( '.foo' ),
                    boo: no.jpath.expr( '.quu' ),
                    qoo: 35
                }
            } );

            var context = helpers.context();
            context.run( block, params );
        } );

        it( 'options.max_redirects=0', function( done ) {
            var path = `/block/http/${ n++ }`;

            var content = 'Hello, World';

            fake.add( `${ path }/foo`, {
                status_code: 302,
                headers: {
                    location: `${ base_url }${ path }/bar`,
                }
            } );
            fake.add( `${ path }/bar`, {
                status_code: 200,
                content: content
            } );

            var block = create_block( {
                url: `${ base_url }${ path }/foo`,
                max_redirects: 0
            } );

            var context = helpers.context();
            context.run( block )
                .then( function( result ) {
                    expect( result ).to.be.eql( null );

                    done();
                } );
        } );

        it( 'options.max_redirects=0, only_meta=true', function( done ) {
            var path = `/block/http/${ n++ }`;

            var content = 'Hello, World';

            fake.add( `${ path }/foo`, {
                status_code: 302,
                headers: {
                    location: `${ base_url }${ path }/bar`,
                }
            } );
            fake.add( `${ path }/bar`, {
                status_code: 200,
                content: content
            } );

            var block = create_block( {
                url: `${ base_url }${ path }/foo`,
                max_redirects: 0,
                only_meta: true
            } );

            var context = helpers.context();
            context.run( block )
                .then( function( result ) {
                    expect( result.status_code ).to.be( 302 );
                    expect( result.headers[ 'location' ] ).to.be( `${ base_url }${ path }/bar` );

                    done();
                } );
        } );

        it( 'options.max_redirects=1', function( done ) {
            var path = `/block/http/${ n++ }`;

            var content = 'Hello, World';

            fake.add( `${ path }/foo`, {
                status_code: 302,
                headers: {
                    location: `${ base_url }${ path }/bar`,
                }
            } );
            fake.add( `${ path }/bar`, {
                status_code: 200,
                content: content
            } );

            var block = create_block( {
                url: `${ base_url }${ path }/foo`,
                max_redirects: 1
            } );

            var context = helpers.context();
            context.run( block )
                .then( function( result ) {
                    expect( result ).to.be( content );

                    done();
                } );
        } );

        it( 'options.max_retries=0, 404 error', function( done ) {
            var path = `/block/http/${ n++ }`;

            fake.add( path, {
                status_code: 404
            } );

            var block = create_block( {
                url: `${ base_url }${ path }`
            } );

            var context = helpers.context();
            context.run( block )
                .then( function( result ) {
                    expect( result ).to.be.a( no.Error );

                    expect( result.error.id ).to.be( 'HTTP_404' );
                    expect( result.error.status_code ).to.be( 404 );
                    expect( result.error.body ).to.be( null );

                    done();
                } );
        } );

        it( 'options.max_retries=1, default is_retry_allowed, 404 error', function( done ) {
            var path = `/block/http/${ n++ }`;

            fake.add( path, {
                status_code: 404
            } );

            var block = create_block( {
                url: `${ base_url }${ path }`,
                max_retries: 1
            } );

            var context = helpers.context();
            context.run( block )
                .then( function( result ) {
                    expect( result ).to.be.a( no.Error );

                    expect( result.error.id ).to.be( 'HTTP_404' );
                    expect( result.error.status_code ).to.be( 404 );
                    expect( result.error.body ).to.be( null );

                    done();
                } );
        } );

        it( 'options.max_retries=1, custom is_retry_allowed, 404 error', function( done ) {
            var path = `/block/http/${ n++ }`;

            var content = 'Hello, World';

            fake.add( path, [
                {
                    status_code: 404
                },
                {
                    status_code: 200,
                    content: content
                }
            ] );

            var block = create_block( {
                url: `${ base_url }${ path }`,
                max_retries: 1,
                is_retry_allowed: function() {
                    return true;
                }
            } );

            var context = helpers.context();
            context.run( block )
                .then( function( result ) {
                    expect( result ).to.be( content );

                    done();
                } );
        } );

    } );

    run();

} );

//  ---------------------------------------------------------------------------------------------------------------  //

after( function() {
    fake.stop();
} );

