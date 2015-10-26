//  Чего мне не хватает (не нравится) в asker'е:
//
//    * Доступ к собственно реквесту. Как минимум, хочу уметь abort'ить запрос,
//      если что-то там извне случилось (глобальный таймаут, например).
//
//    * Редиректы.
//
//    * Совсем не нравится привычка бросать эксепшены на каждый чих.
//
//    * В будущем захочется таки стримов.
//

var url_ = require( 'url' );
var http_ = require( 'http' );
var https_ = require( 'https' );
var qs_ = require( 'querystring' );

//  ---------------------------------------------------------------------------------------------------------------  //

var no = require( 'nommon' );

var de = require( './de.js' );

//  ---------------------------------------------------------------------------------------------------------------  //

var DEFAULT_OPTIONS = {
    protocol: 'http:',
    host: 'localhost',
    path: '/',
    method: 'GET',
    port: 80,

    max_redirects: 3,
    max_retries: 0,
    is_error: function( status_code, headers, body ) {
        return ( status_code >= 400 && status_code <= 599 );
    },
    is_retry_allowed: no.false,
};

de.request = function( options, context ) {
    options = no.extend( {}, DEFAULT_OPTIONS, options );

    options.retries = 0;
    options.redirects = 0;

    var req;
    var promise = no.promise();

    promise.on( 'abort', function( reason ) {
        if ( req ) {
            req.abort();
            req = null;

            promise.reject( {
                id: 'HTTP_REQUEST_ABORTED',
                reason: reason
            } );
        }
    } );

    do_request( options );

    return promise;

    function do_request( options ) {
        options.hostname = options.hostname || options.host;
        options.method = options.method.toUpperCase();

        var headers = {};
        if ( options.headers ) {
            for ( var name in options.headers ) {
                headers[ name.toLowerCase() ] = options.headers[ name ];
            }
        }
        options.headers = headers;

        if ( options.url ) {
            var parsed_url = url_.parse( options.url, true );

            options.protocol = parsed_url.protocol;
            options.hostname = options.host = parsed_url.hostname;
            options.port = +parsed_url.port;
            options.path = parsed_url.path;
        }

        if ( !options.port ) {
            options.port = ( options.protocol === 'https:' ) ? 443 : 80;
        }

        if ( options.query ) {
            var parsed_path = url.parse( options.path, true );

            options.path = url_.format( {
                pathname: parsed_path.pathname,
                query: no.extend( parsed_path.query, options.query )
            } );
        }

        var data;
        if ( options.body && ( options.method === 'post' || options.method === 'put' || options.method === 'patch' ) ) {
            if ( Buffer.isBuffer( options.body ) ) {
                data = options.body;
                set_content_type( 'application/octet-stream' );

            } else if ( typeof options.body !== 'object' ) {
                data = String( options.body );
                set_content_type( 'text/plain' );

            } else {
                if ( headers[ 'content-type' ] === 'application/json' ) {
                    data = JSON.stringify( options.body );

                } else {
                    data = qs_.stringify( options.body );
                    set_content_type( 'application/x-www-form-urlencoded' );
                }
            }

            headers[ 'content-length' ] = Buffer.byteLength( data );
        }

        function set_content_type( content_type ) {
            if ( !headers[ 'content-type' ] ) {
                headers[ 'content-type' ] = content_type;
            }
        }

        var request_module = ( options.protocol === 'https:' ) ? https_ : http_;
        console.log( 'options', options );

        req = request_module.request( options, function( res ) {
            var status_code = res.statusCode;
            var headers = res.headers;

            if ( status_code === 301 || status_code === 302 || status_code === 303 || status_code === 307 ) {
                req.abort();
                req = null;

                if ( options.redirects < options.max_redirects ) {
                    var location = headers[ 'location' ];
                    do_redirect( options, location );

                } else {
                    promise.reject( {
                        id: 'TOO_MANY_REDIRECTS',

                        status_code: status_code,
                        headers: headers
                    } );
                }

                return;
            }

            if ( status_code >= 400 ) {
                req.abort();
                req = null;

                if ( options.retries < options.max_retries && options.is_retry_allowed( status_code, headers ) ) {
                    do_retry( options );

                } else {
                    promise.reject( {
                        id: 'HTTP_' + status_code,
                        message: http_.STATUS_CODES[ status_code ],

                        status_code: status_code,
                        headers: headers
                    } );
                }

                return;
            }

            var buffers = [];
            var received_length = 0;

            res.on( 'data', function( data ) {
                buffers.push( data );
                received_length += data.length;
            } );

            res.on( 'end', function() {
                req = null;

                var body = Buffer.concat( buffers, received_length );

                var is_json = ( options.data_type === 'json' || res.headers[ 'content-type' ] === 'application/json' );
                if ( is_json ) {
                    try {
                        body = JSON.parse( body.toString() );

                    } catch ( e ) {
                        promise.reject( {
                            id: 'INVALID_JSON',
                            message: e.message
                        } );
                    }
                }

                promise.resolve( {
                    status_code: status_code,
                    headers: headers,

                    body: body
                } );
            } );

            res.on( 'close', function( error ) {
                req = null;

                promise.reject( {
                    id: 'HTTP_CONNECTION_CLOSED',
                    message: error.message
                } );
            } );
        } );

        req.on( 'error', function( error ) {
            req = null;

            promise.reject( {
                id: 'HTTP_UNKNOWN_ERROR',
                message: error.message
            } );
        } );

        if ( data ) {
            req.write( data );
        }

        req.end();
    }

    function do_retry( options ) {
        options = no.extend( {}, options );
        options.retries++;

        promise.trigger( 'retry', options );

        do_request( options );
    }

    function do_redirect( options, location ) {
        options = {
            url: location,
            method: 'GET',
            data_type: options.data_type,

            redirects: options.redirects++,
            max_redirects: options.max_redirects,
            retries: 0,
            max_retries: options.max_retries,
            is_retry_allowed: options.is_retry_allowed
        };

        promise.trigger( 'redirect', options );

        do_request( options );
    }
};

//  ---------------------------------------------------------------------------------------------------------------  //

module.exports = de;

