var no = require( 'nommon' );

var de = require( './de.block.js' );
require( '../de.request.js' );

de.Block.Http = function( block, options ) {
    this._init( block, options );
};

no.inherit( de.Block.Http, de.Block );

de.Block.Http.prototype._type = 'http';

//  ---------------------------------------------------------------------------------------------------------------  //

de.Block.Http.prototype._init_block = function() {
    if ( typeof this.raw_block === 'function' ) {
        this.block = this.raw_block;

    } else {
        if ( typeof this.raw_block === 'string' ) {
            this.block = {
                url: this.raw_block
            };

        } else {
            this.block = no.extend( {}, this.raw_block );
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

    return ( typeof obj === 'function' ) ? obj : no.jpath.expr( obj );
}

//  ---------------------------------------------------------------------------------------------------------------  //

de.Block.Http.prototype._init_extra_options = function() {
    var raw_options = this.raw_options;

};

//  ---------------------------------------------------------------------------------------------------------------  //

de.Block.Http.prototype._run = function( params, context ) {
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
    }

    var running = no.promise();

    var that = this;

    de.request( options, context )
        .then(
            function( result ) {
                if ( that.block.only_meta ) {
                    return running.resolve( new de.Result.Value( {
                        status_code: result.status_code,
                        headers: result.headers
                    } ) );
                }

                var is_json = that.block.is_json || ( result.headers[ 'content-type' ] === 'application/json' );
                var body;
                if ( !result.body ) {
                    body = null;

                } else {
                    if ( is_json ) {
                        try {
                            body = JSON.parse ( result.body.toString() );

                        } catch ( e ) {
                            return running.resolve( new de.Result.Error( {
                                //  FIXME: Унести коды ошибок куда-нибудь.
                                id: 'JSON_PARSE_ERROR'
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

