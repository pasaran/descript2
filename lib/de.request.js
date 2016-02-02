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
    //  FIXME: Что тут должно быть, path или pathname?
    pathname: '/',
    method: 'GET',
    port: 80,

    max_redirects: 3,
    max_retries: 0,
    is_retry_allowed: function( status_code, headers ) {
        return (
            status_code === 408 ||
            status_code === 500 ||
            ( status_code >= 502 && status_code <= 504 )
        );
    }
};

//  ---------------------------------------------------------------------------------------------------------------  //

var _request_id = 0;

de.request = function( options, context ) {
    var start = Date.now();

    if ( typeof options === 'string' ) {
        options = {
            url: options
        };
    }

    options = no.extend( {}, DEFAULT_OPTIONS, options );

    var request_id = `${ context.id }.${ options.id || _request_id++ }`;

    //  FIXME: Тут явно неправильно определяется full_url. Что-то с path(name) не то.
    var full_url = url_.format( options );
    context.logger.debug( `[${ request_id }] Request started [${ options.method }] ${ full_url }` );

    options.retries = 0;
    options.redirects = 0;

    var req;
    var promise = no.promise();

    promise.on( 'abort', function( reason ) {
        do_reject( {
            id: 'HTTP_REQUEST_ABORTED',
            reason: reason
        } );
    } );

    var log = [];

    do_request( options );

    return promise;

    function do_resolve( result ) {
        if ( log.length ) {
            result.log = log;
        }

        var end = Date.now();
        context.logger.log( `[${ request_id }] Request ended in ${ end - start }ms [${ options.method }] ${ full_url }` );

        do_done( result );
    }

    function do_reject( result ) {
        if ( log.length ) {
            result.log = log;
        }

        var end = Date.now();
        context.logger.error( `[${ request_id }] Request ended in ${ end - start }ms with an error ${ JSON.stringify( result ) }` );

        do_done( no.error( result ) );
    }

    function do_done( result ) {
        if ( req ) {
            req.abort();
            req = null;
        }

        promise.resolve( result );
    }

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
            var parsed_path = url_.parse( options.path, true );

            options.path = url_.format( {
                pathname: parsed_path.pathname,
                query: no.extend( parsed_path.query, options.query )
            } );
        }

        var data;
        if ( options.body && ( options.method === 'POST' || options.method === 'PUT' || options.method === 'PATCH' ) ) {
            if ( Buffer.isBuffer( options.body ) ) {
                data = options.body;
                set_content_type( 'application/octet-stream' );

            } else if ( typeof options.body !== 'object' ) {
                data = String( options.body );
                set_content_type( 'text/plain' );

            } else if ( headers[ 'content-type' ] === 'application/json' ) {
                data = JSON.stringify( options.body );

            } else {
                data = qs_.stringify( options.body );
                set_content_type( 'application/x-www-form-urlencoded' );
            }

            headers[ 'content-length' ] = Buffer.byteLength( data );
        }

        function set_content_type( content_type ) {
            if ( !headers[ 'content-type' ] ) {
                headers[ 'content-type' ] = content_type;
            }
        }

        var request_module = ( options.protocol === 'https:' ) ? https_ : http_;

        req = request_module.request( options, function( res ) {
            var status_code = res.statusCode;
            var headers = res.headers;

            var buffers = [];
            var received_length = 0;

            res.on( 'data', function( data ) {
                buffers.push( data );
                received_length += data.length;
            } );

            var result = {
                status_code: status_code,
                headers: headers
            };

            res.on( 'end', function() {
                req = null;

                result.body = ( received_length ) ? Buffer.concat( buffers, received_length ) : null;

                if ( ( status_code >= 301 && status_code <= 303 ) || status_code === 307 ) {
                    if ( options.redirects < options.max_redirects ) {
                        log.push( result );

                        var location = headers[ 'location' ];
                        do_redirect( options, location );

                    } else {
                        do_resolve( result );
                    }

                    return;
                }

                if ( status_code >= 400 ) {
                    if ( options.retries < options.max_retries && options.is_retry_allowed( status_code, headers ) ) {
                        log.push( result );

                        do_retry( options );

                    } else {
                        result.id = 'HTTP_' + status_code;
                        result.message = http_.STATUS_CODES[ status_code ];

                        do_reject( result );
                    }

                    return;
                }

                do_resolve( result );
            } );

            res.on( 'close', function( error ) {
                //  FIXME: Может быть не нужно в ошибке отправлять status_code и headers?
                result.id = 'HTTP_CONNECTION_CLOSED';
                result.message = error.message;

                do_reject( result );
            } );
        } );

        req.on( 'error', function( error ) {
            do_reject( {
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

        context.logger.debug( `[${ request_id }] Retry #${ options.retries }` );

        do_request( options );
    }

    function do_redirect( options, location ) {
        context.logger.debug( `[${ request_id }] Redirected to ${ location }` );

        options = {
            url: location,
            method: 'GET',

            redirects: options.redirects + 1,
            max_redirects: options.max_redirects,
            retries: 0,
            max_retries: options.max_retries,
            is_retry_allowed: options.is_retry_allowed
        };

        do_request( options );
    }
};

//  ---------------------------------------------------------------------------------------------------------------  //

module.exports = de;

