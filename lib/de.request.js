'use strict';

const url_ = require( 'url' );
const http_ = require( 'http' );
const https_ = require( 'https' );
const qs_ = require( 'querystring' );

//  ---------------------------------------------------------------------------------------------------------------  //

const no = require( 'nommon' );

const de = require( './de.js' );
require( './de.error.js' );
require( './de.logger.js' );

//  ---------------------------------------------------------------------------------------------------------------  //

const _agents = new WeakMap();

const rx_is_json = /^application\/json(?:;|\s|$)/;

//  ---------------------------------------------------------------------------------------------------------------  //

de.request = function( options, context ) {
    const visited_urls = {};

    let req = null;
    let h_timeout = null;
    let timestamps = null;

    const promise = no.promise();
    promise.on( 'abort', on_promise_abort );

    const request_options = new RequestOptions( options );
    do_request( request_options );

    return promise;

    function do_request( request_options ) {
        timestamps = {
            start: Date.now(),
        };

        const result = {
            status_code: 0,
            headers: {},
        };

        visited_urls[ request_options.url ] = true;

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
                //  FIXME: А нужна ли эта строчка? По идее это случится в do_done().
                timestamps.end = Date.now();

                if ( req.aborted ) {
                    //  Не обрабатываем ответ, если запрос оборван
                    return;
                }

                result.body = ( received_length ) ? Buffer.concat( buffers, received_length ).toString() : null;

                if ( ( status_code >= 301 && status_code <= 303 ) || status_code === 307 ) {
                    if ( request_options.redirects < request_options.max_redirects ) {
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
                            const error = {
                                id: de.Error.ID.HTTP_CYCLIC_REDIRECT,
                                url: redirect_url,
                            };
                            do_fail( error, request_options );

                            return;
                        }

                        context.log( {
                            type: de.Logger.EVENT.REQUEST_SUCCESS,
                            request_options: request_options,
                            result: result,
                            timestamps: timestamps,
                        } );

                        const redirect_options = new RequestOptions( {
                            url: redirect_url,
                            method: 'GET',

                            redirects: request_options.redirects + 1,
                            retries: 0,

                            //  FIXME: Какой-то метод clone() может быть соорудить?
                            //  А то есть шанс добавить новые поля и забыть их тут скопировать.
                            max_retries: request_options.max_retries,
                            max_redirects: request_options.max_redirects,
                            is_retry_allowed: request_options.is_retry_allowed,
                            retry_timeout: request_options.retry_timeout,
                            is_error: request_options.is_error,
                        } );

                        do_request( redirect_options );

                    } else {
                        do_done( result, request_options );
                    }

                    return;
                }

                const error = no.extend( {}, result, {
                    id: 'HTTP_' + status_code,
                    message: http_.STATUS_CODES[ status_code ],
                } );
                if ( request_options.is_error( error ) ) {
                    do_retry( error );

                    return;
                }

                do_done( result, request_options );
            } );

            res.on( 'close', function( error ) {
                if ( promise.is_resolved() || req.aborted ) {
                    //  Не обрабатываем ответ, если запрос оборван
                    return;
                }

                error = {
                    id: de.Error.ID.HTTP_CONNECTION_CLOSED,
                    message: error.message,
                };
                do_fail( error, request_options );
            } );
        };

        context.log( {
            type: de.Logger.EVENT.REQUEST_START,
            request_options: request_options,
        } );

        try {
            req = request_options.request_module.request( request_options.options, request_handler );

        } catch ( e ) {
            do_fail( e, request_options );

            return;
        }

        req.on( 'socket', function( socket ) {
            timestamps.socket = Date.now();

            if ( !socket.connecting ) {
                //  Это сокет из пула, на нем не будет события 'connect'.
                timestamps.tcp_connection = timestamps.socket;

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

            error = {
                id: de.Error.ID.HTTP_UNKNOWN_ERROR,
                message: error.message
            };
            do_fail( error, request_options );

            destroy_request_socket();
        } );

        if ( request_options.body ) {
            req.write( request_options.body );
        }

        req.end();

        function do_retry( error ) {
            if ( request_options.retries < request_options.max_retries && request_options.is_retry_allowed( error ) ) {
                context.log( {
                    type: de.Logger.EVENT.REQUEST_ERROR,
                    request_options: request_options,
                    error: de.error( error ),
                    timestamps: timestamps,
                } );

                request_options.retries++;

                if ( request_options.retry_timeout > 0 ) {
                    setTimeout(
                        function() {
                            do_request( request_options );
                        },
                        request_options.retry_timeout
                    );

                } else {
                    do_request( request_options );
                }

            } else {
                do_fail( error, request_options );
            }

            if ( error.status_code === 429 || error.status_code >= 500 ) {
                //  Удаляем сокет, чтобы не залипать на отвечающем ошибкой бекэнде.
                destroy_request_socket();
            }
        }
    }

    function do_done( result, request_options ) {
        clear_timeout();

        timestamps.end = timestamps.end || Date.now();

        context.log( {
            type: de.Logger.EVENT.REQUEST_SUCCESS,
            request_options: request_options,
            result: result,
            timestamps: timestamps,
        } );

        promise.resolve( result );
    }

    function do_fail( error, request_options ) {
        clear_timeout();

        timestamps.end = timestamps.end || Date.now();

        error = de.error( error );

        context.log( {
            type: de.Logger.EVENT.REQUEST_ERROR,
            request_options: request_options,
            error: error,
            timestamps: timestamps,
        } );

        promise.resolve( error );
    }

    function clear_timeout() {
        if ( h_timeout ) {
            clearTimeout( h_timeout );

            h_timeout = null;
        }
    }

    function on_promise_abort( e, reason ) {
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

        do_fail( error, request_options );

        if ( req ) {
            req.abort();
        }
    }

    function destroy_request_socket() {
        if ( req && req.socket ) {
            req.socket.destroy();
        }
    }
};

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
    options = no.extend( {}, de.request.DEFAULT_OPTIONS, options );

    this.retries = 0;
    this.redirects = 0;

    this.max_retries = options.max_retries;
    this.max_redirects = options.max_redirects;
    this.is_retry_allowed = options.is_retry_allowed;
    this.retry_timeout = options.retry_timeout;
    this.is_error = options.is_error;

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

