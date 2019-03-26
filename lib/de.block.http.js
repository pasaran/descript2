const no = require( 'nommon' );

const de = require( './de.js' );
require( './de.block.js' );
require( './de.request.js' );
require( './de.error.js' );

//  ---------------------------------------------------------------------------------------------------------------  //

de.Block.Http = function( block, options ) {
    this._init( block, options );
};

no.inherit( de.Block.Http, de.Block );

de.Block.Http.prototype._type = 'http';

//  ---------------------------------------------------------------------------------------------------------------  //

de.Block.Http._extend_block = function( what, by ) {
    var headers;
    if ( !what.headers || !by.headers ) {
        headers = what.headers || by.headers || null;

    } else {
        headers = [].concat( what.headers, by.headers );
    }

    var block = no.extend( {}, what, by );
    if ( headers ) {
        block.headers = headers;
    }

    return block;
};

//  ---------------------------------------------------------------------------------------------------------------  //

de.Block.Http.prototype._init_block = function( raw_block ) {
    if ( typeof raw_block === 'function' ) {
        this.block = raw_block;

    } else {
        if ( typeof raw_block === 'string' ) {
            this.block = {
                url: raw_block
            };

        } else {
            this.block = no.extend( {}, raw_block );
        }

        this.block.url = compile_string( this.block.url );
        this.block.path = compile_string( this.block.path );
        this.block.hostname = compile_string( this.block.hostname );
        this.block.host = compile_string( this.block.host );

        this.block.headers = compile_headers( this.block.headers );

        this.block.query = compile_object( this.block.query );

        //  FIXME: Если в body у нас какой-нибудь Buffer нужен, то что?
        this.block.body = compile_object( this.block.body );
    }
};

function compile_string( str ) {
    if ( str == null ) {
        return null;
    }

    //  FIXME: Тут нужно de.jexpr использовать?
    //
    return ( typeof str === 'function' ) ? str : no.jpath.string( str );
}

function compile_object( obj ) {
    if ( obj == null ) {
        return null;
    }

    if ( typeof obj === 'function' ) {
        return obj;
    }

    var js = 'var r={};';
    for ( var name in obj ) {
        var value = obj[ name ];

        var prop_name = JSON.stringify( name );

        js += 'r[' + prop_name + ']=';
        switch ( typeof value ) {
            case 'function':
                js += 'o[' + prop_name + '](p,c,s);';
                break;

            case 'string':
            case 'number':
            case 'boolean':
                js += JSON.stringify( value ) + ';';
                break;

            default:
                js += 'o[' + prop_name + '];';
        }
    }
    js += 'return r';

    var compiled = Function( 'o', 'p', 'c', 's', js );

    return function( params, context, state ) {
        return compiled( obj, params, context, state );
    };
}

function compile_headers( headers ) {
    let compiled;
    if ( Array.isArray( headers ) ) {
        compiled = headers.map( compile_object );

    } else {
        compiled = compile_object( headers );
    }

    return compiled;
}

//  ---------------------------------------------------------------------------------------------------------------  //

var rx_is_json = /^application\/json(?:;|\s|$)/;

de.Block.Http.prototype._action = function( params, context, state ) {
    var options;

    var block = this.block;

    if ( typeof block === 'function' ) {
        options = block( params, context, state );

    } else {
        options = {
            max_redirects: block.max_redirects,
            is_error: block.is_error,
            is_retry_allowed: block.is_retry_allowed,
            retry_timeout: block.retry_timeout,

            //  Работает не так, как options.timeout!
            timeout: block.timeout,

            auth: block.auth,

            family: block.family,

            pfx: block.pfx,
            key: block.key,
            passphrase: block.passphrase,
            cert: block.cert,
            ca: block.ca,
            ciphers: block.ciphers,
            rejectUnauthorized: block.rejectUnauthorized,
            secureProtocol: block.secureProtocol,
            servername: block.servername
        };
        if ( block.method ) {
            options.method = block.method.toUpperCase();
        }

        //  FIXME: А может это не очень безопасно?
        //  Может не нужно давать возможность задавать host, path, ... через параметры?
        //  Хотя бы сделать:
        //
        //      options.url = block.url( null, context, state );
        //

        if ( typeof block.protocol === 'function' ) {
            options.protocol = block.protocol( params, context, state );

        } else {
            options.protocol = block.protocol;
        }

        if ( typeof block.port === 'function' ) {
            options.port = block.port( params, context, state );

        } else {
            options.port = block.port;
        }

        if ( typeof block.agent === 'function' ) {
            options.agent = block.agent( params, context, state );

        } else {
            options.agent = block.agent;
        }

        if ( typeof block.max_retries === 'function' ) {
            options.max_retries = block.max_retries( params, context, state );

        } else {
            options.max_retries = block.max_retries;
        }

        if ( block.url ) {
            options.url = block.url( params, context, state );
        }
        if ( block.hostname ) {
            options.hostname = block.hostname( params, context, state );
        }
        if ( block.host ) {
            options.host = block.host( params, context, state );
        }
        if ( block.path ) {
            options.path = block.path( params, context, state );
        }
        if ( block.headers ) {
            if ( Array.isArray( block.headers ) ) {
                options.headers = {};
                for ( let i = 0; i < block.headers.length; i++ ) {
                    const item = block.headers[ i ];
                    if ( item ) {
                        options.headers = no.extend( options.headers, item( params, context, state ) );
                    }
                }

            } else {
                options.headers = block.headers( params, context, state );
            }
        }

        if ( options.method === 'POST' || options.method === 'PUT' || options.method === 'PATCH' ) {
            if ( block.query ) {
                options.query = block.query( params, context, state );
            }
            options.body = ( block.body ) ? block.body( params, context, state ) : params;

        } else {
            options.query = ( block.query ) ? block.query( params, context, state ) : params;
        }
    }

    if ( this.options.name ) {
        options.extra = {
            name: this.options.name,
        };
    }

    var running = no.promise();

    var promise = de.request( options, context );
    running.on( 'abort', function( e, reason ) {
        promise.abort( reason );
    } );
    promise
        .then(
            function( result ) {
                let error;
                let headers;

                if ( de.is_error( result ) ) {
                    error = result.error;
                    headers = error.headers;

                } else {
                    headers = result.headers;
                }

                let is_json = block.is_json;
                if ( !is_json && headers ) {
                    const content_type = headers[ 'content-type' ];
                    if ( content_type ) {
                        is_json = rx_is_json.test( content_type );
                    }
                }

                if ( error && error.body && is_json ) {
                    try {
                        error.body = JSON.parse( error.body );

                    } catch ( e ) {
                        //  Do nothing.
                    }
                }

                if ( error ) {
                    return running.resolve( de.error( error ) );
                }

                if ( block.only_meta ) {
                    return running.resolve( {
                        status_code: result.status_code,
                        headers: result.headers,
                        request_options: result.request_options,
                    } );
                }

                var body;
                if ( !result.body ) {
                    body = null;

                } else {
                    if ( is_json ) {
                        try {
                            body = JSON.parse( result.body );

                        } catch ( e ) {
                            return running.resolve( de.error( e, de.Error.ID.INVALID_JSON ) );
                        }

                    } else {
                        body = result.body;
                    }
                }

                if ( block.with_meta ) {
                    return running.resolve( {
                        status_code: result.status_code,
                        headers: result.headers,
                        request_options: result.request_options,
                        result: body,
                    } );
                }

                running.resolve( body );
            },

            function( error ) {
                running.resolve( de.error( error ) );
            }
        );

    return running;
};

//  ---------------------------------------------------------------------------------------------------------------  //

module.exports = de;

