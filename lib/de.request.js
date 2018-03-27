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

const _agents = new WeakMap();

const rx_is_json = /^application\/json(?:;|\s|$)/;

//  ---------------------------------------------------------------------------------------------------------------  //

de.request = function( options, context ) {
    options = no.extend( {}, de.request.DEFAULT_OPTIONS, options );
    const request_options = new RequestOptions( options );

    const max_retries = options.max_retries;
    const max_redirects = options.max_redirects;
    const is_retry_allowed = options.is_retry_allowed;
    const retry_timeout = options.retry_timeout;
    const is_error = options.is_error;

    let retries = 0;
    let redirects = 0;
    const visited_urls = {};

    const start_req = Date.now();
    let req;

    let h_timeout = null;

    const promise = no.promise();

    function do_done( result ) {
        clear_timeout();

        promise.resolve( result );
    }

    function do_fail( error ) {
        clear_timeout();

        promise.resolve( de.error( error ) );
    }

    function clear_timeout() {
        if ( h_timeout ) {
            clearTimeout( h_timeout );

            h_timeout = null;
        }
    }

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
                id: de.Error.ID.HTTP_REQUEST_ABORTED,
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

        do_fail( error );

        if ( req ) {
            req.abort();
        }
    } );

    do_request( request_options );

    return promise;

    function do_request( request_options ) {
        visited_urls[ request_options.url ] = true;

        const method = request_options.options.method;
        const log_url = method + ' ' + request_options.url;

        //  Логируем начало запроса.
        //  Если это не изначальный запрос, то добавляем Retry или Redirect в начале.
        //
        let log_message = '';
        if ( request_options.retries ) {
            log_message += 'Retry ' + request_options.retries + '/' + max_retries + ' ';

        } else if ( request_options.redirects ) {
            log_message += 'Redirect ' + request_options.redirects + '/' + max_redirects + ' ';
        }

        log_message += log_url;
        context.debug( log_message );

        const timestamps = {
            start: Date.now(),
        };

        if ( options.timeout > 0 ) {
            clear_timeout();

            h_timeout = setTimeout( function() {
                if ( req ) {
                    //  Если обрываем запрос по таймауту, то надо обрывать request.
                    //  Сокет уничтожится автоматически.
                    req.abort();
                }

                //  Дальше решаем, что делать с запросом.
                let error;
                if ( !timestamps.tcp_connection ) {
                    //  Не смогли к этому моменту установить tcp-соединение.
                    error = {
                        id: de.Error.ID.TCP_CONNECTION_TIMEOUT,
                    };

                } else {
                    //  Тут просто слишком долго выполняли запрос целиком.
                    error = {
                        id: de.Error.ID.REQUEST_TIMEOUT,
                    };
                    //  FIXME: Тут может быть ситуация, что получили HTTP 200, но не дождались полного ответа.
                    //  FIXME: Надо ее как-то обрабатывать?
                }

                do_retry( error );

            }, options.timeout );
        }

        const result = {
            status_code: 0,
            headers: {},
            request_options: request_options.options,
        };

        const request_handler = function( res ) {
            res.once( 'readable', function() {
                timestamps.first_byte = Date.now();
            } );

            const status_code = res.statusCode;
            const headers = res.headers;

            const buffers = [];
            let received_length = 0;
            //
            res.on( 'data', function( data ) {
                if ( req.aborted ) {
                    //  Не обрабатываем входящие данные, если запрос оборван
                    return;
                }

                buffers.push( data );
                received_length += data.length;
            } );

            result.status_code = status_code;
            result.headers = headers;

            res.on( 'end', function() {
                timestamps.end = Date.now();
                if ( req.aborted ) {
                    //  Не обрабатываем ответ, если запрос оборван
                    return;
                }

                result.body = ( received_length ) ? Buffer.concat( buffers, received_length ).toString() : null;

                if ( ( status_code >= 301 && status_code <= 303 ) || status_code === 307 ) {
                    if ( request_options.redirects < max_redirects ) {
                        let redirect_url = headers[ 'location' ];

                        //  FIXME: Проверять, что в redirect_url что-то есть.

                        if ( !/^https?:\/\//.test( redirect_url ) ) {
                            redirect_url = url_.format( {
                                protocol: request_options.options.protocol,
                                hostname: request_options.options.hostname,
                                port: request_options.options.port,
                                pathname: redirect_url
                            } );
                        }

                        if ( visited_urls[ redirect_url ] ) {
                            context.error( 'CYCLIC_REDIRECT' + total() + ' ' + log_url );

                            do_fail( {
                                id: de.Error.ID.HTTP_CYCLIC_REDIRECT,
                                url: redirect_url
                            } );

                            return;
                        }

                        context.debug( status_code + in_ms( timestamps.start ) + ' ' + log_url + ' ---> ' + redirect_url );

                        const redirect_options = new RequestOptions( {
                            url: redirect_url,
                            method: 'GET',

                            redirects: request_options.redirects + 1,
                            retries: 0
                        } );
                        redirects++;

                        do_request( redirect_options );

                    } else {
                        context.info( status_code + total() + ' ' + log_url );

                        do_done( result );
                    }

                    return;
                }

                const error = no.extend( {}, result, {
                    id: 'HTTP_' + status_code,
                    message: http_.STATUS_CODES[ status_code ],
                } );
                if ( is_error( error ) ) {
                    do_retry( error );

                    return;
                }

                context.info( status_code + total() + ' ' + log_url );
                do_done( result );
            } );

            res.on( 'close', function( error ) {
                if ( promise.is_resolved() || req.aborted ) {
                    //  Не обрабатываем ответ, если запрос оборван
                    return;
                }

                const result = {
                    id: de.Error.ID.HTTP_CONNECTION_CLOSED,
                    message: error.message
                };

                context.error( 'CONNECTION_CLOSED' + total() + ': ' + error.message );
                do_fail( result );
            } );
        };
        try {
            req = request_options.request_module.request( request_options.options, request_handler );

        } catch ( e ) {
            context.error( 'REQUEST_ERROR: ' + e.message );

            do_fail( e );

            return;
        }

        req.on( 'socket', function( socket ) {
            if ( !socket.connecting ) {
                //  Это сокет из пула, на нем не будет события 'connect'.
                timestamps.tcp_connection = Date.now();

            } else {
                const on_connect = function() {
                    timestamps.tcp_connection = Date.now();
                };

                socket.once( 'connect', on_connect );

                req.once( 'error', function() {
                    if ( socket ) {
                        socket.removeListener( 'connect', on_connect );
                    }
                } );
            }
        } );

        req.on( 'error', function( error ) {
            if ( req.aborted ) {
                //  FIXME: правда ли нет ситуация, когда это приведет к повисанию запроса?
                return;
            }
            if ( promise.is_resolved() ) {
                return;
            }

            const result = {
                id: de.Error.ID.HTTP_UNKNOWN_ERROR,
                message: error.message
            };

            context.error( 'UNKNOWN_ERROR' + total() + ': ' + error.message );
            do_fail( result );

            destroy_request_socket();
        } );

        if ( request_options.body ) {
            req.write( request_options.body );
        }

        req.end();

        function do_retry( error ) {
            if ( request_options.retries < max_retries && is_retry_allowed( error ) ) {
                let log_message = ( error.status_code || error.id ) + in_ms( timestamps.start );
                if ( result.body ) {
                    log_message += ' ' + String( result.body );
                }
                log_message += ' ' + log_url;
                context.warn( log_message );

                request_options.retries++;
                retries++;

                if ( retry_timeout > 0 ) {
                    setTimeout(
                        function() {
                            do_request( request_options );
                        },
                        retry_timeout
                    );

                } else {
                    do_request( request_options );
                }

            } else {
                let log_message = ( error.status_code || error.id ) + total();
                if ( result.body ) {
                    log_message += ': ' + String( result.body );
                }
                log_message += ' ' + log_url;

                context.error( log_message );
                do_fail( error );
            }

            if ( error.status_code === 429 || error.status_code >= 500 ) {
                //  Удаляем сокет, чтобы не залипать на отвечающем ошибкой бекэнде.
                destroy_request_socket();
            }
        }
    }

    function destroy_request_socket() {
        if ( req && req.socket ) {
            req.socket.destroy();
        }
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

de.request.DEFAULT_OPTIONS = {
    method: 'GET',
    protocol: 'http:',
    host: 'localhost',
    path: '/',

    max_redirects: 0,
    max_retries: 0,
    is_error: function( error ) {
        return (
            error.id === de.Error.ID.TCP_CONNECTION_TIMEOUT ||
            error.id === de.Error.ID.REQUEST_TIMEOUT ||
            error.status_code >= 400
        );
    },
    is_retry_allowed: function( error ) {
        return (
            error.id === de.Error.ID.TCP_CONNECTION_TIMEOUT ||
            error.id === de.Error.ID.REQUEST_TIMEOUT ||
            error.status_code === 408 ||
            error.status_code === 429 ||
            error.status_code === 500 ||
            ( error.status_code >= 502 && error.status_code <= 504 )
        );
    },
    retry_timeout: 100,
};

//  ---------------------------------------------------------------------------------------------------------------  //

module.exports = de;

//  ---------------------------------------------------------------------------------------------------------------  //

function RequestOptions( options ) {
    this.retries = 0;
    this.redirects = 0;

    this.options = {};

    this.options.headers = {};
    if ( options.headers ) {
        for ( let name in options.headers ) {
            this.options.headers[ name.toLowerCase() ] = options.headers[ name ];
        }
    }

    if ( options.url ) {
        const parsed_url = url_.parse( options.url, true );
        const query = no.extend( parsed_url.query, options.query );

        this.options.protocol = parsed_url.protocol;
        this.options.hostname = parsed_url.hostname;
        this.options.port = Number( parsed_url.port );
        this.options.path = url_.format( {
            pathname: parsed_url.pathname,
            query: query
        } );

        //  pathname и query не используются при запросе,
        //  но используются для построения урла ниже.
        //
        this.options.pathname = parsed_url.pathname;
        this.options.query = query;

    } else {
        this.options.protocol = options.protocol;
        this.options.hostname = options.host;
        this.options.port = options.port;
        this.options.path = url_.format( {
            pathname: options.path,
            query: options.query
        } );

        this.options.pathname = options.path;
        this.options.query = options.query;
    }
    if ( !this.options.port ) {
        this.options.port = ( this.options.protocol === 'https:' ) ? 443 : 80;
    }

    //  Нужно для логов.
    this.url = url_.format( this.options );

    const method = this.options.method = options.method.toUpperCase();

    this.body = null;
    if ( options.body && ( method === 'POST' || method === 'PUT' || method === 'PATCH' ) ) {
        if ( Buffer.isBuffer( options.body ) ) {
            this.body = options.body;
            this.set_content_type( 'application/octet-stream' );

        } else if ( typeof options.body !== 'object' ) {
            this.body = String( options.body );
            this.set_content_type( 'text/plain' );

        } else if ( rx_is_json.test( this.options.headers[ 'content-type' ] ) ) {
            this.body = JSON.stringify( options.body );

        } else {
            this.body = qs_.stringify( options.body );
            this.set_content_type( 'application/x-www-form-urlencoded' );
        }

        this.options.headers[ 'content-length' ] = Buffer.byteLength( this.body );
    }

    this.options.extra = options.extra;

    this.request_module = ( this.options.protocol === 'https:' ) ? https_ : http_;

    if ( options.agent != null ) {
        if ( typeof options.agent === 'object' && !( options.agent instanceof this.request_module.Agent ) ) {
            let agent = _agents.get( options.agent );
            if ( !agent ) {
                agent = new this.request_module.Agent( options.agent );
                _agents.set( options.agent, agent );
            }
            this.options.agent = agent;

        } else {
            //  Здесь может быть либо `false`, либо `instanceof Agent`.
            this.options.agent = options.agent;
        }
    }

    if ( this.options.protocol === 'https:' ) {
        this.options.pfx = options.pfx;
        this.options.key = options.key;
        this.options.passphrase = options.passphrase;
        this.options.cert = options.cert;
        this.options.ca = options.ca;
        this.options.ciphers = options.ciphers;
        this.options.rejectUnauthorized = options.rejectUnauthorized;
        this.options.secureProtocol = options.secureProtocol;
        this.options.servername = options.servername;
    }
}

RequestOptions.prototype.set_content_type = function( content_type ) {
    if ( !this.options.headers[ 'content-type' ] ) {
        this.options.headers[ 'content-type' ] = content_type;
    }
};

