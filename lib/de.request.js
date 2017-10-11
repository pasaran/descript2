'use strict';

const url_ = require( 'url' );
const http_ = require( 'http' );
const https_ = require( 'https' );
const qs_ = require( 'querystring' );

//  ---------------------------------------------------------------------------------------------------------------  //

const no = require( 'nommon' );

const de = require( './de.js' );
require( './de.error.js' );

//  ---------------------------------------------------------------------------------------------------------------  //

const DEFAULT_OPTIONS = {
    method: 'GET',
    protocol: 'http:',
    host: 'localhost',
    path: '/',

    max_redirects: 0,
    max_retries: 0,
    is_retry_allowed: function( status_code, headers ) {
        return (
            status_code === 408 ||
            status_code === 500 ||
            ( status_code >= 502 && status_code <= 504 )
        );
    }
};

const _agents = new WeakMap();

const rx_is_json = /^application\/json(?:;|\s|$)/;

//  ---------------------------------------------------------------------------------------------------------------  //

de.request = function( options, context ) {
    options = no.extend( {}, DEFAULT_OPTIONS, options );
    options.retries = 0;
    options.redirects = 0;

    const max_retries = options.max_retries;
    const max_redirects = options.max_redirects;
    const is_retry_allowed = options.is_retry_allowed;

    let retries = 0;
    let redirects = 0;
    const visited_urls = {};

    const start_req = Date.now();
    let req;

    const promise = no.promise();

    promise.on( 'abort', function( e, reason ) {
        if ( promise.is_resolved() ) {
            return;
        }

        let error;
        if ( de.is_error( reason ) ) {
            //  FIXME: Нужна ли тут эта ветка?
            error = reason;

        } else {
            error = {
                id: 'HTTP_REQUEST_ABORTED',
                reason: reason
            };
        }

        let log_message = 'ABORTED' + in_ms( start_req );
        if ( reason ) {
            //  FIXME: Тут как-то не так должно быть.
            //  Если тут de.Error придет, например.
            //
            if ( typeof reason === 'object' ) {
                log_message += ': ' + JSON.stringify( reason );

            } else {
                log_message += ': ' + reason;
            }
        }
        context.error( log_message );

        promise.resolve( de.error( error ) );

        if ( req ) {
            req.abort();
        }
    } );

    do_request( options );

    return promise;

    function do_request( options ) {
        const start = Date.now();

        const request_options = {
            retries: options.retries,
            redirects: options.redirects
        };

        const headers = {};
        if ( options.headers ) {
            for ( let name in options.headers ) {
                headers[ name.toLowerCase() ] = options.headers[ name ];
            }
        }
        request_options.headers = headers;

        if ( options.url ) {
            const parsed_url = url_.parse( options.url, true );
            const query = no.extend( parsed_url.query, options.query );

            request_options.protocol = parsed_url.protocol;
            request_options.hostname = parsed_url.hostname;
            request_options.port = Number( parsed_url.port );
            request_options.path = url_.format( {
                pathname: parsed_url.pathname,
                query: query
            } );

            //  pathname и query не используются при запросе,
            //  но используются для построения урла ниже.
            //
            request_options.pathname = parsed_url.pathname;
            request_options.query = query;

        } else {
            request_options.protocol = options.protocol;
            request_options.hostname = options.host;
            request_options.port = options.port;
            request_options.path = url_.format( {
                pathname: options.path,
                query: options.query
            } );

            request_options.pathname = options.path;
            request_options.query = options.query;
        }
        if ( !request_options.port ) {
            request_options.port = ( request_options.protocol === 'https:' ) ? 443 : 80;
        }

        const url = url_.format( request_options );
        visited_urls[ url ] = true;

        const method = request_options.method = options.method.toUpperCase();
        const log_url = method + ' ' + url;

        let data;
        if ( options.body && ( method === 'POST' || method === 'PUT' || method === 'PATCH' ) ) {
            if ( Buffer.isBuffer( options.body ) ) {
                data = options.body;
                set_content_type( 'application/octet-stream' );

            } else if ( typeof options.body !== 'object' ) {
                data = String( options.body );
                set_content_type( 'text/plain' );

            } else if ( rx_is_json.test( headers[ 'content-type' ] ) ) {
                data = JSON.stringify( options.body );

            } else {
                data = qs_.stringify( options.body );
                set_content_type( 'application/x-www-form-urlencoded' );
            }

            headers[ 'content-length' ] = Buffer.byteLength( data );

            //  FIXME: Это нужно на случай retry.
            request_options.body = options.body;
        }

        function set_content_type( content_type ) {
            if ( !headers[ 'content-type' ] ) {
                headers[ 'content-type' ] = content_type;
            }
        }

        const request_module = ( request_options.protocol === 'https:' ) ? https_ : http_;

        if ( options.agent != null ) {
            if ( typeof options.agent === 'object' && !( options.agent instanceof request_module.Agent ) ) {
                let agent = _agents.get( options.agent );
                if ( !agent ) {
                    agent = new request_module.Agent( options.agent );
                    _agents.set( options.agent, agent );
                }
                request_options.agent = agent;

            } else {
                //  Здесь может быть либо `false`, либо `instanceof Agent`.
                request_options.agent = options.agent;
            }
        }

        request_options.pfx = options.pfx;
        request_options.key = options.key;
        request_options.passphrase = options.passphrase;
        request_options.cert = options.cert;
        request_options.ca = options.ca;
        request_options.ciphers = options.ciphers;
        request_options.rejectUnauthorized = options.rejectUnauthorized;
        request_options.secureProtocol = options.secureProtocol;
        request_options.servername = options.servername;

        //  Логируем начало запроса.
        //  Если это не изначальный запрос, то добавляем Retry или Redirect в начале.
        //
        let log_message = '';
        if ( request_options.retries ) {
            log_message += 'Retry ' + request_options.retries + '/' + max_retries + ' ';

        } else if ( options.redirects ) {
            log_message += 'Redirect ' + request_options.redirects + '/' + max_redirects + ' ';
        }

        log_message += log_url;
        context.debug( log_message );

        req = request_module.request( request_options, function( res ) {
            const status_code = res.statusCode;
            const headers = res.headers;

            const buffers = [];
            let received_length = 0;
            //
            res.on( 'data', function( data ) {
                buffers.push( data );
                received_length += data.length;
            } );

            const result = {
                status_code: status_code,
                headers: headers
            };

            res.on( 'end', function() {
                result.body = ( received_length ) ? Buffer.concat( buffers, received_length ).toString() : null;

                if ( ( status_code >= 301 && status_code <= 303 ) || status_code === 307 ) {
                    if ( request_options.redirects < max_redirects ) {
                        let redirect_url = headers[ 'location' ];

                        //  FIXME: Проверять, что в redirect_url что-то есть.

                        if ( !/^https?:\/\//.test( redirect_url ) ) {
                            redirect_url = url_.format( {
                                protocol: request_options.protocol,
                                hostname: request_options.hostname,
                                port: request_options.port,
                                pathname: redirect_url
                            } );
                        }

                        if ( visited_urls[ redirect_url ] ) {
                            context.error( 'CYCLIC_REDIRECT' + total() + ' ' + log_url );
                            promise.resolve( de.error( {
                                id: 'HTTP_CYCLIC_REDIRECT',
                                message: 'Redirected to visited already url %url',
                                url: redirect_url
                            } ) );

                            return;
                        }

                        context.debug( status_code + in_ms( start ) + ' ' + log_url + ' ---> ' + redirect_url );

                        const redirect_options = {
                            url: redirect_url,
                            method: 'GET',

                            redirects: request_options.redirects + 1,
                            retries: 0
                        };
                        redirects++;

                        do_request( redirect_options );

                    } else {
                        context.info( status_code + total() + ' ' + log_url );
                        promise.resolve( result );
                    }

                    return;
                }

                if ( status_code >= 400 ) {
                    if ( request_options.retries < max_retries && is_retry_allowed( status_code, headers ) ) {
                        let log_message = status_code + in_ms( start );
                        if ( result.body ) {
                            log_message += ' ' + String( result.body );
                        }
                        log_message += ' ' + log_url;
                        context.warn( log_message );

                        const retry_options = no.extend( {}, request_options );
                        retry_options.retries++;
                        retries++;

                        do_request( retry_options );

                    } else {
                        result.id = 'HTTP_' + status_code;
                        result.message = http_.STATUS_CODES[ status_code ];

                        let log_message = status_code + total();
                        if ( result.body ) {
                            log_message += ': ' + String( result.body );
                        }
                        log_message += ' ' + log_url;

                        context.error( log_message );
                        promise.resolve( de.error( result ) );
                    }

                    if ( status_code >= 500 && req && req.socket ) {
                        //  Удаляем сокет, чтобы не залипать на отвечающем ошибкой бекэнде.
                        req.socket.destroy();
                    }

                    return;
                }

                context.info( status_code + total() + ' ' + log_url );
                promise.resolve( result );
            } );

            res.on( 'close', function( error ) {
                if ( promise.is_resolved() ) {
                    return;
                }

                const result = {
                    id: 'HTTP_CONNECTION_CLOSED',
                    message: error.message
                };

                context.error( 'CONNECTION_CLOSED' + total() + ': ' + error.message );
                promise.resolve( de.error( result ) );
            } );
        } );

        req.on( 'error', function( error ) {
            if ( promise.is_resolved() ) {
                return;
            }

            const result = {
                id: 'HTTP_UNKNOWN_ERROR',
                message: error.message
            };

            context.error( 'UNKNOWN_ERROR' + total() + ': ' + error.message );
            promise.resolve( de.error( result ) );

            if ( req && req.socket ) {
                req.socket.destroy();
            }
        } );

        if ( data ) {
            req.write( data );
        }

        req.end();
    }

    function total() {
        let total = in_ms( start_req );
        if ( retries || redirects ) {
            total += ' (';
            if ( retries ) {
                total += retries + ' ' + ( ( retries > 1 ) ? 'retries' : 'retry' );
            }
            if ( retries && redirects ) {
                total += ', ';
            }
            if ( redirects ) {
                total += redirects + ' ' + ( ( redirects > 1 ) ? 'redirects' : 'redirect' );
            }
            total += ')';
        }

        return total;
    }
};

function in_ms( start ) {
    return ' in ' + ( Date.now() - start ) + 'ms';
}

//  ---------------------------------------------------------------------------------------------------------------  //

module.exports = de;

