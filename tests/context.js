var no = require( 'nommon' );

var expect = require( 'expect.js' );

var de = require( '../lib/index.js' );

var helpers = require( './_helpers.js' );

var Fake = require( '../lib/de.fake.js' );

//  ---------------------------------------------------------------------------------------------------------------  //

var port = helpers.port;

var fake = new Fake( { port: port } );

var base_url = `http://127.0.0.1:${ port }`;

var logger = new de.Logger( de.Logger.LEVEL.OFF );

//  ---------------------------------------------------------------------------------------------------------------  //

fake.start( function() {

    describe( 'context', function() {

        var n = 1;

        describe( 'context.end()', function() {

            it( 'argument is a string', function( done ) {
                var path = `/context/${ n++ }`;

                var content = 'Hello, World!';

                fake.add( path, {
                    content: function( req, res ) {
                        var block = de.block(
                            helpers.wrap( content, 50 )
                        );

                        var context = new de.Context( req, res );
                        return context.run( block )
                            .then( function( result ) {
                                context.end( result );
                            } );
                    }
                } );

                de.request( `${ base_url }${ path }`, logger )
                    .then( function( result ) {
                        expect( result.status_code ).to.be( 200 );
                        expect( result.headers[ 'content-type' ] ).to.be( 'text/plain' );
                        expect( String( result.body ) ).to.be( content );

                        done();
                    } );
            } );

            it( 'argument is a html-string', function( done ) {
                var path = `/context/${ n++ }`;

                var content = '<h1>Hello</h1>';

                fake.add( path, {
                    content: function( req, res ) {
                        var block = de.block(
                            helpers.wrap( content, 50 )
                        );

                        var context = new de.Context( req, res );
                        return context.run( block )
                            .then( function( result ) {
                                context.end( result );
                            } );
                    }
                } );

                de.request( `${ base_url }${ path }`, logger )
                    .then( function( result ) {
                        expect( result.status_code ).to.be( 200 );
                        expect( result.headers[ 'content-type' ] ).to.be( 'text/html' );
                        expect( String( result.body ) ).to.be( content );

                        done();
                    } );
            } );

            it( 'argument is an object', function( done ) {
                var path = `/context/${ n++ }`;

                var content = {
                    hello: true
                };

                fake.add( path, {
                    content: function( req, res ) {
                        var block = de.block(
                            helpers.wrap( content, 50 )
                        );

                        var context = new de.Context( req, res );
                        return context.run( block )
                            .then( function( result ) {
                                context.end( result );
                            } );
                    }
                } );

                de.request( `${ base_url }${ path }`, logger )
                    .then( function( result ) {
                        expect( result.status_code ).to.be( 200 );
                        expect( result.headers[ 'content-type' ] ).to.be( 'application/json' );
                        expect( JSON.parse( String( result.body ) ) ).to.be.eql( content );

                        done();
                    } );
            } );

        } );

        describe( 'context.redirect()', function() {

            var ERROR_ID = 'REDIRECTED';

            it( 'argument is a string', function( done ) {
                done = helpers.wrap_done( done, 2 );

                var path = `/context/${ n++ }`;

                var redirect_url = 'http://www.yandex.ru';

                fake.add( path, {
                    content: function( req, res ) {
                        var block = de.block(
                            function( params, context, state ) {
                                throw Error( 'error' );
                            },
                            {
                                before: [
                                    function( params, context, state ) {
                                        context.redirect( redirect_url );
                                    },

                                    function( params, context, state ) {
                                        throw Error( 'error' );
                                    }
                                ]
                            }
                        );

                        var context = new de.Context( req, res );
                        return context.run( block )
                            .then( function( result ) {
                                expect( result ).to.be.a( de.Error );
                                expect( result.error.id ).to.be( ERROR_ID );

                                done();
                            } );
                    }
                } );

                de.request(
                    {
                        url: `${ base_url }${ path }`,
                        max_redirects: 0
                    },
                    logger
                )
                    .then( function( result ) {
                        expect( result.status_code ).to.be( 302 );
                        expect( result.headers[ 'location' ] ).to.be( redirect_url );
                        expect( result.body ).to.be( null );

                        done();
                    } );
            } );

            it( 'argument is an object', function( done ) {
                done = helpers.wrap_done( done, 2 );

                var path = `/context/${ n++ }`;

                var redirect_url = 'http://www.yandex.ru';

                fake.add( path, {
                    content: function( req, res ) {
                        var block = de.block(
                            function( params, context, state ) {
                                throw Error( 'error' );
                            },
                            {
                                before: [
                                    function( params, context, state ) {
                                        context.redirect( {
                                            location: redirect_url
                                        } );
                                    },

                                    function( params, context, state ) {
                                        throw Error( 'error' );
                                    }
                                ]
                            }
                        );

                        var context = new de.Context( req, res );
                        return context.run( block )
                            .then( function( result ) {
                                expect( result ).to.be.a( de.Error );
                                expect( result.error.id ).to.be( ERROR_ID );

                                done();
                            } );
                    }
                } );

                de.request(
                    {
                        url: `${ base_url }${ path }`,
                        max_redirects: 0
                    },
                    logger
                )
                    .then( function( result ) {
                        expect( result.status_code ).to.be( 302 );
                        expect( result.headers[ 'location' ] ).to.be( redirect_url );
                        expect( result.body ).to.be( null );

                        done();
                    } );
            } );

            it( 'redirect after POST', function( done ) {
                done = helpers.wrap_done( done, 2 );

                var path = `/context/${ n++ }`;

                var redirect_url = 'http://www.yandex.ru';

                fake.add( path, {
                    content: function( req, res ) {
                        var block = de.block(
                            function( params, context, state ) {
                                throw Error( 'error' );
                            },
                            {
                                before: [
                                    function( params, context, state ) {
                                        context.redirect( redirect_url );
                                    },

                                    function( params, context, state ) {
                                        throw Error( 'error' );
                                    }
                                ]
                            }
                        );

                        var context = new de.Context( req, res );
                        return context.run( block )
                            .then( function( result ) {
                                expect( result ).to.be.a( de.Error );
                                expect( result.error.id ).to.be( ERROR_ID );

                                done();
                            } );
                    }
                } );

                de.request(
                    {
                        method: 'POST',
                        url: `${ base_url }${ path }`,
                        max_redirects: 0
                    },
                    logger
                )
                    .then( function( result ) {
                        expect( result.status_code ).to.be( 303 );
                        expect( result.headers[ 'location' ] ).to.be( redirect_url );
                        expect( result.body ).to.be( null );

                        done();
                    } );
            } );

            it( 'custom status_code', function( done ) {
                done = helpers.wrap_done( done, 2 );

                var path = `/context/${ n++ }`;

                var redirect_url = 'http://www.yandex.ru';

                fake.add( path, {
                    content: function( req, res ) {
                        var block = de.block(
                            function( params, context, state ) {
                                throw Error( 'error' );
                            },
                            {
                                before: [
                                    function( params, context, state ) {
                                        context.redirect( {
                                            location: redirect_url,
                                            status_code: 307
                                        } );
                                    },

                                    function( params, context, state ) {
                                        throw Error( 'error' );
                                    }
                                ]
                            }
                        );

                        var context = new de.Context( req, res );
                        return context.run( block )
                            .then( function( result ) {
                                expect( result ).to.be.a( de.Error );
                                expect( result.error.id ).to.be( ERROR_ID );

                                done();
                            } );
                    }
                } );

                de.request(
                    {
                        url: `${ base_url }${ path }`,
                        max_redirects: 0
                    },
                    logger
                )
                    .then( function( result ) {
                        expect( result.status_code ).to.be( 307 );
                        expect( result.headers[ 'location' ] ).to.be( redirect_url );
                        expect( result.body ).to.be( null );

                        done();
                    } );
            } );

            it( 'custom status_code after POST', function( done ) {
                done = helpers.wrap_done( done, 2 );

                var path = `/context/${ n++ }`;

                var redirect_url = 'http://www.yandex.ru';

                fake.add( path, {
                    content: function( req, res ) {
                        var block = de.block(
                            function( params, context, state ) {
                                throw Error( 'error' );
                            },
                            {
                                before: [
                                    function( params, context, state ) {
                                        context.redirect( {
                                            location: redirect_url,
                                            status_code: 307
                                        } );
                                    },

                                    function( params, context, state ) {
                                        throw Error( 'error' );
                                    }
                                ]
                            }
                        );

                        var context = new de.Context( req, res );
                        return context.run( block )
                            .then( function( result ) {
                                expect( result ).to.be.a( de.Error );
                                expect( result.error.id ).to.be( ERROR_ID );

                                done();
                            } );
                    }
                } );

                de.request(
                    {
                        method: 'POST',
                        url: `${ base_url }${ path }`,
                        max_redirects: 0
                    },
                    logger
                )
                    .then( function( result ) {
                        expect( result.status_code ).to.be( 307 );
                        expect( result.headers[ 'location' ] ).to.be( redirect_url );
                        expect( result.body ).to.be( null );

                        done();
                    } );
            } );

        } );

        describe( 'context.error()', function() {

            it ( 'argument is a string', function( done ) {
                done = helpers.wrap_done( done, 2 );

                var path = `/context/${ n++ }`;

                var ERROR_ID = 'FATAL_ERROR';

                fake.add( path, {
                    content: function( req, res ) {
                        var block = de.block(
                            function( params, context, state ) {
                                throw Error( 'error' );
                            },
                            {
                                before: [
                                    function( params, context, state ) {
                                        context.error( ERROR_ID );
                                    },

                                    function( params, context, state ) {
                                        throw Error( 'error' );
                                    }
                                ]
                            }
                        );

                        var context = new de.Context( req, res );
                        return context.run( block )
                            .then( function( result ) {
                                expect( result ).to.be.a( de.Error );
                                expect( result.error.id ).to.be( ERROR_ID );

                                done();
                            } );
                    }
                } );

                de.request( `${ base_url }${ path }`, logger )
                    .then( function( result ) {
                        expect( result ).to.be.a( de.Error );
                        expect( result.error.status_code ).to.be( 500 );
                        expect( result.error.headers[ 'content-type' ] ).to.be( 'application/json' );

                        var body = JSON.parse( result.error.body );
                        expect( body ).to.be.eql( { id: ERROR_ID } );

                        done();
                    } );
            } );

            it ( 'argument is an object with id', function( done ) {
                done = helpers.wrap_done( done, 2 );

                var path = `/context/${ n++ }`;

                var ERROR_ID = 'FATAL_ERROR';

                fake.add( path, {
                    content: function( req, res ) {
                        var block = de.block(
                            function( params, context, state ) {
                                throw Error( 'error' );
                            },
                            {
                                before: [
                                    function( params, context, state ) {
                                        context.error( {
                                            id: ERROR_ID
                                        } );
                                    },

                                    function( params, context, state ) {
                                        throw Error( 'error' );
                                    }
                                ]
                            }
                        );

                        var context = new de.Context( req, res );
                        return context.run( block )
                            .then( function( result ) {
                                expect( result ).to.be.a( de.Error );
                                expect( result.error.id ).to.be( ERROR_ID );

                                done();
                            } );
                    }
                } );

                de.request( `${ base_url }${ path }`, logger )
                    .then( function( result ) {
                        expect( result ).to.be.a( de.Error );
                        expect( result.error.status_code ).to.be( 500 );
                        expect( result.error.headers[ 'content-type' ] ).to.be( 'application/json' );

                        var body = JSON.parse( result.error.body );
                        expect( body ).to.be.eql( { id: ERROR_ID } );

                        done();
                    } );
            } );

            it ( 'argument is an object without id', function( done ) {
                done = helpers.wrap_done( done, 2 );

                var path = `/context/${ n++ }`;

                var ERROR_ID = 'UNKNOWN_ERROR';

                fake.add( path, {
                    content: function( req, res ) {
                        var block = de.block(
                            function( params, context, state ) {
                                throw Error( 'error' );
                            },
                            {
                                before: [
                                    function( params, context, state ) {
                                        context.error( {
                                            fatal: true
                                        } );
                                    },

                                    function( params, context, state ) {
                                        throw Error( 'error' );
                                    }
                                ]
                            }
                        );

                        var context = new de.Context( req, res );
                        return context.run( block )
                            .then( function( result ) {
                                expect( result ).to.be.a( de.Error );
                                expect( result.error.id ).to.be( ERROR_ID );

                                done();
                            } );
                    }
                } );

                de.request( `${ base_url }${ path }`, logger )
                    .then( function( result ) {
                        expect( result ).to.be.a( de.Error );
                        expect( result.error.status_code ).to.be( 500 );
                        expect( result.error.headers[ 'content-type' ] ).to.be( 'application/json' );

                        var body = JSON.parse( result.error.body );
                        expect( body.id ).to.be( ERROR_ID );

                        done();
                    } );
            } );

            it ( 'custom status_code', function( done ) {
                done = helpers.wrap_done( done, 2 );

                var path = `/context/${ n++ }`;

                var ERROR_ID = 'FATAL_ERROR';

                fake.add( path, {
                    content: function( req, res ) {
                        var block = de.block(
                            function( params, context, state ) {
                                throw Error( 'error' );
                            },
                            {
                                before: [
                                    function( params, context, state ) {
                                        context.error( {
                                            id: ERROR_ID,
                                            status_code: 503
                                        } );
                                    },

                                    function( params, context, state ) {
                                        throw Error( 'error' );
                                    }
                                ]
                            }
                        );

                        var context = new de.Context( req, res );
                        return context.run( block )
                            .then( function( result ) {
                                expect( result ).to.be.a( de.Error );
                                expect( result.error.id ).to.be( ERROR_ID );

                                done();
                            } );
                    }
                } );

                de.request( `${ base_url }${ path }`, logger )
                    .then( function( result ) {
                        expect( result ).to.be.a( de.Error );
                        expect( result.error.status_code ).to.be( 503 );
                        expect( result.error.headers[ 'content-type' ] ).to.be( 'application/json' );

                        var body = JSON.parse( result.error.body );
                        expect( body.id ).to.be( ERROR_ID );

                        done();
                    } );
            } );

            it ( 'custom body is a string', function( done ) {
                done = helpers.wrap_done( done, 2 );

                var path = `/context/${ n++ }`;

                var ERROR_ID = 'FATAL_ERROR';
                var body = 'Fatal Error';

                fake.add( path, {
                    content: function( req, res ) {
                        var block = de.block(
                            function( params, context, state ) {
                                throw Error( 'error' );
                            },
                            {
                                before: [
                                    function( params, context, state ) {
                                        context.error( {
                                            id: ERROR_ID,
                                            body: body
                                        } );
                                    },

                                    function( params, context, state ) {
                                        throw Error( 'error' );
                                    }
                                ]
                            }
                        );

                        var context = new de.Context( req, res );
                        return context.run( block )
                            .then( function( result ) {
                                expect( result ).to.be.a( de.Error );
                                expect( result.error.id ).to.be( ERROR_ID );

                                done();
                            } );
                    }
                } );

                de.request( `${ base_url }${ path }`, logger )
                    .then( function( result ) {
                        expect( result ).to.be.a( de.Error );
                        expect( result.error.status_code ).to.be( 500 );
                        expect( result.error.headers[ 'content-type' ] ).to.be( 'text/plain' );
                        expect( String( result.error.body ) ).to.be( body );

                        done();
                    } );
            } );

            it ( 'custom body is a html-string', function( done ) {
                done = helpers.wrap_done( done, 2 );

                var path = `/context/${ n++ }`;

                var ERROR_ID = 'FATAL_ERROR';
                var body = '<h1>Error</h1>';

                fake.add( path, {
                    content: function( req, res ) {
                        var block = de.block(
                            function( params, context, state ) {
                                throw Error( 'error' );
                            },
                            {
                                before: [
                                    function( params, context, state ) {
                                        context.error( {
                                            id: ERROR_ID,
                                            body: body
                                        } );
                                    },

                                    function( params, context, state ) {
                                        throw Error( 'error' );
                                    }
                                ]
                            }
                        );

                        var context = new de.Context( req, res );
                        return context.run( block )
                            .then( function( result ) {
                                expect( result ).to.be.a( de.Error );
                                expect( result.error.id ).to.be( ERROR_ID );

                                done();
                            } );
                    }
                } );

                de.request( `${ base_url }${ path }`, logger )
                    .then( function( result ) {
                        expect( result ).to.be.a( de.Error );
                        expect( result.error.status_code ).to.be( 500 );
                        expect( result.error.headers[ 'content-type' ] ).to.be( 'text/html' );
                        expect( String( result.error.body ) ).to.be( body );

                        done();
                    } );
            } );

            it ( 'custom content-type', function( done ) {
                done = helpers.wrap_done( done, 2 );

                var path = `/context/${ n++ }`;

                var ERROR_ID = 'FATAL_ERROR';

                fake.add( path, {
                    content: function( req, res ) {
                        var block = de.block(
                            function( params, context, state ) {
                                throw Error( 'error' );
                            },
                            {
                                before: [
                                    function( params, context, state ) {
                                        context.error( {
                                            id: ERROR_ID,
                                            content_type: 'text/error'
                                        } );
                                    },

                                    function( params, context, state ) {
                                        throw Error( 'error' );
                                    }
                                ]
                            }
                        );

                        var context = new de.Context( req, res );
                        return context.run( block )
                            .then( function( result ) {
                                expect( result ).to.be.a( de.Error );
                                expect( result.error.id ).to.be( ERROR_ID );

                                done();
                            } );
                    }
                } );

                de.request( `${ base_url }${ path }`, logger )
                    .then( function( result ) {
                        expect( result ).to.be.a( de.Error );
                        expect( result.error.status_code ).to.be( 500 );
                        expect( result.error.headers[ 'content-type' ] ).to.be( 'text/error' );

                        var body = JSON.parse( result.error.body );
                        expect( body.id ).to.be( ERROR_ID );

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

