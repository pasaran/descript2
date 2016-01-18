var no = require( 'nommon' );

var de = require( './de.block.js' );
require( '../de.error.js' );
require( '../de.request.js' );

de.Block.Http = function( block, options ) {
    this._init( block, options );
};

no.inherit( de.Block.Http, de.Block );

de.Block.Http.prototype._type = 'http';

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

        this.block.headers = compile_object( this.block.headers );

        this.block.query = compile_object( this.block.query );
        this.block.body = compile_object( this.block.body );
    }
};

function compile_string( str ) {
    if ( str == null ) {
        return null;
    }

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
                js += 'o[' + prop_name + '](p,c);';
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

    var compiled = Function( 'o', 'p', 'c', js );

    return function( params, context ) {
        return compiled( obj, params, context );
    };
}

//  ---------------------------------------------------------------------------------------------------------------  //

de.Block.Http.prototype._action = function( params, context ) {
    var options;

    var block = this.block;

    if ( typeof block === 'function' ) {
        options = block( params, context );

    } else {
        options = {};

        if ( block.url ) {
            options.url = block.url( params, context );
        }
        if ( block.protocol ) {
            options.protocol = block.protocol;
        }
        if ( block.hostname ) {
            options.hostname = block.hostname( params, context );
        }
        if ( block.host ) {
            options.host = block.host( params, context );
        }
        if ( block.port ) {
            options.port = block.port;
        }
        if ( block.path ) {
            options.path = block.path( params, context );
        }
        options.method = block.method || 'GET';
        if ( block.headers ) {
            options.headers = block.headers( params, context );
        }

        if ( options.method === 'POST' || options.method === 'PUT' || options.method === 'PATCH' ) {
            if ( block.query ) {
                options.query = block.query( params, context );
            }
            options.body = ( block.body ) ? block.body( params, context ) : params;

        } else {
            options.query = ( block.query ) ? block.query( params, context ) : params;
        }

        options.max_redirects = block.max_redirects || 0;
        options.max_retries = block.max_retries || 0;
        if ( block.is_retry_allowed ) {
            options.is_retry_allowed = block.is_retry_allowed;
        }
    }

    var running = no.promise();

    de.request( options, context )
        .then(
            function( result ) {
                if ( block.only_meta ) {
                    return running.resolve( new de.Result.Value( {
                        status_code: result.status_code,
                        headers: result.headers
                    } ) );
                }

                var is_json = block.is_json || ( result.headers[ 'content-type' ] === 'application/json' );
                var body;
                if ( !result.body ) {
                    body = null;

                } else {
                    if ( is_json ) {
                        try {
                            body = JSON.parse ( result.body.toString() );

                        } catch ( e ) {
                            return running.resolve( new de.Result.Error( {
                                id: 'INVALID_JSON',
                                message: e.message,
                                stack: e.stack
                            } ) );
                        }

                    } else {
                        body = result.body.toString();
                    }
                }

                running.resolve( new de.Result.Value( body ) );
            },

            function( error ) {
                running.resolve( new de.Result.Error( error ) );
            }
        );

    return running;
};

//  ---------------------------------------------------------------------------------------------------------------  //

module.exports = de;

