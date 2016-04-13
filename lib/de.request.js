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
require( './de.error.js' );

//  ---------------------------------------------------------------------------------------------------------------  //

var DEFAULT_OPTIONS = {
    method: 'GET',
    protocol: 'http:',
    host: 'localhost',
    path: '/',

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

var _agents = new WeakMap();

//  ---------------------------------------------------------------------------------------------------------------  //

de.request = function( options, context ) {
    var start = Date.now();

    options = no.extend( {}, DEFAULT_OPTIONS, options );
    options.retries = 0;
    options.redirects = 0;

    var log_suffix = ' [' + ( ( options.id ) ? options.id : 'http' ) + '.' + ( context._request_id++ ) + ']';

    var req;
    var promise = no.promise();

    promise.on( 'abort', function( reason ) {
        var error;
        if ( de.is_error( reason ) ) {
            error = reason;

        } else {
            error = {
                id: 'HTTP_REQUEST_ABORTED',
                reason: reason
            };
        }

        var log_message = 'ABORTED' + in_ms( start );
        if ( reason ) {
            if ( typeof reason === 'object' ) {
                log_message += ': ' + JSON.stringify( reason );

            } else {
                log_message += ': ' + reason;
            }
        }
        log_message += log_suffix;
        context.error( log_message );

        do_done( de.error( error ) );
    } );

    do_request( options );

    return promise;

    function do_done( result ) {
        if ( req ) {
            req.abort();
            req = null;
        }

        promise.resolve( result );
    }

    function do_request( options ) {
        var start_req = Date.now();

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
            options.host = options.hostname = parsed_url.hostname;
            options.port = Number( parsed_url.port );
            options.pathname = parsed_url.pathname;
            options.path = url_.format( {
                pathname: parsed_url.pathname,
                query: no.extend( parsed_url.query, options.query )
            } );

        } else {
            options.protocol = options.protocol;
            options.host = options.hostname = options.hostname || options.host;
            options.port = options.port;
            options.pathname = options.path;
            options.path = url_.format( {
                pathname: options.path,
                query: options.query
            } );
        }

        if ( !options.port ) {
            options.port = ( options.protocol === 'https:' ) ? 443 : 80;
        }

        var data;
        if ( options.body && ( options.method === 'POST' || options.method === 'PUT' || options.method === 'PATCH' ) ) {
            if ( Buffer.isBuffer( options.body ) ) {
                data = options.body;
                set_content_type( 'application/octet-stream' );

            } else if ( typeof options.body !== 'object' ) {
                data = String( options.body );
                set_content_type( 'text/plain' );

            } else if ( options.headers[ 'content-type' ] === 'application/json' ) {
                data = JSON.stringify( options.body );

            } else {
                data = qs_.stringify( options.body );
                set_content_type( 'application/x-www-form-urlencoded' );
            }

            options.headers[ 'content-length' ] = Buffer.byteLength( data );
        }

        function set_content_type( content_type ) {
            if ( !options.headers[ 'content-type' ] ) {
                options.headers[ 'content-type' ] = content_type;
            }
        }

        var request_module = ( options.protocol === 'https:' ) ? https_ : http_;

        if ( options.agent && ( typeof options.agent === 'object' ) && !( options instanceof request_module.Agent ) ) {
            var agent = _agents.get( options.agent );
            if ( !agent ) {
                agent = new request_module.Agent( options.agent );
                _agents.set( options.agent, agent );
            }
            options.agent = agent;
        }

        var full_url = options.method + ' ' + url_.format( options );

        //  Логируем начало запроса.
        //  Если это не изначальный запрос, то добавляем Retry или Redirect в начале.
        var message = '';
        //  FIXME: Что если есть и retries и redirects?
        if ( options.redirects ) {
            message += 'Redirect ' + options.redirects + '/' + options.max_redirects + ' ';

        } else if ( options.retries ) {
            message += 'Retry ' + options.retries + '/' + options.max_retries + ' ';
        }
        message += full_url + log_suffix;
        context.debug( message );

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
                        var location = headers[ 'location' ];

                        context.debug( status_code + in_ms( start_req ) + ' ' + full_url + ' -> ' + location + log_suffix );

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

                    } else {
                        context.info( status_code + in_ms( start ) + ' ' + full_url + log_suffix );

                        do_done( result );
                    }

                    return;
                }

                if ( status_code >= 400 ) {
                    if ( options.retries < options.max_retries && options.is_retry_allowed( status_code, headers ) ) {
                        var log_message = status_code + in_ms( start_req );
                        if ( result.body ) {
                            log_message += ' ' + String( result.body );
                        }
                        log_message += ' ' + full_url + log_suffix;
                        context.warn( log_message );

                        options = no.extend( {}, options );
                        options.retries++;

                        do_request( options );

                    } else {
                        result.id = 'HTTP_' + status_code;
                        result.message = http_.STATUS_CODES[ status_code ];

                        var log_message = status_code + in_ms( start );
                        if ( result.body ) {
                            log_message += ': ' + String( result.body );
                        }
                        log_message += ' ' + full_url + log_suffix;
                        context.error( log_message );
                        do_done( de.error( result ) );
                    }

                    return;
                }

                context.info( status_code + in_ms( start ) + ' ' + full_url + log_suffix );

                do_done( result );
            } );

            res.on( 'close', function( error ) {
                var result = {
                    id: 'HTTP_CONNECTION_CLOSED',
                    message: error.message
                };

                context.error( 'CONNECTION_CLOSED' + in_ms( start ) + ': ' + error.message + log_suffix );
                do_done( de.error( result ) );
            } );
        } );

        req.on( 'error', function( error ) {
            var result = {
                id: 'HTTP_UNKNOWN_ERROR',
                message: error.message
            };

            context.error( 'UNKNOWN_ERROR' + in_ms( start ) + ': ' + error.message + log_suffix );
            do_done( de.error( result ) );
        } );

        if ( data ) {
            req.write( data );
        }

        req.end();
    }
};

function in_ms( start ) {
    return ' in ' + ( Date.now() - start ) + 'ms';
}

//  ---------------------------------------------------------------------------------------------------------------  //

module.exports = de;

