var Cookies = require( 'cookies' );

var no = require( 'nommon' );

var de = require( './de.js' );
require( './de.logger.js' );
require( './de.cacher.js' );

//  ---------------------------------------------------------------------------------------------------------------  //

var DEFAULT_CONFIG = {

    logger: new de.Logger(),

    cacher: new de.Cacher.BaseAsync()

};

//  ---------------------------------------------------------------------------------------------------------------  //

var _context_id = 0;

var Context = function( config ) {
    this.id = _context_id++;

    this._promise = null;

    this._promises = {};

    this._n_blocks = 0;
    this._n_active_blocks = 0;

    this._deps_check_timer = null;
    this._dependent_blocks = {};

    this._states = {};

    config = no.extend( {}, DEFAULT_CONFIG, config );
    this.logger = config.logger;
    this.cacher = config.cacher;
};

//  ---------------------------------------------------------------------------------------------------------------  //

Context.prototype._get_promise = function( id ) {
    var promise = this._promises[ id ];
    if ( !promise ) {
        promise = this._promises[ id ] = no.promise();
    }
    return promise;
};

//  ---------------------------------------------------------------------------------------------------------------  //

Context.prototype.run = function( block, params ) {
    if ( this._promise ) {
        this.error( 'Already running' );
    }

    block = de.Block.compile( block );

    this._promise = block._run( params, this );

    var that = this;
    this._promise.then( function() {
        clearTimeout( that._deps_check_timer );
    } );

    return this._promise;
};

//  ---------------------------------------------------------------------------------------------------------------  //

Context.prototype._queue_deps_check = function() {
    if ( this._deps_check_timer ) {
        clearTimeout( this._deps_check_timer );
    }

    var that = this;
    this._deps_check_timer = setTimeout( function() {
        if ( that._n_active_blocks === 0 && that._n_blocks !== 0 ) {
            //  Есть незавершенные блоки, но активных нет.

            for ( var block_id in that._dependent_blocks ) {
                that._get_promise( block_id ).resolve( de.error( 'DEPS_ERROR' ) );
            }
        }
    //  FIXME: Какой тут таймаут поставить по-дефолту?
    //  И унести его в конфиг или в изменяемую переменную.
    }, 100 );
};

//  ---------------------------------------------------------------------------------------------------------------  //

Context.prototype.abort = function( reason ) {
    if ( this._promise ) {
        this._promise.trigger( 'abort', reason );

        //  FIXME: Правильно ли это? Не нужен ли этот promise зачем-то еще?
        this._promise = null;
    }
};

Context.prototype.error = function( error ) {
    throw error;
};

//  ---------------------------------------------------------------------------------------------------------------  //

de.Context = function( req, res, config ) {
    Context.call( this, config );

    this.req = req;
    this.res = res;

    this._cookies = new Cookies( req, res );
};

no.inherit( de.Context, Context );

de.Context.Base = Context;

//  ---------------------------------------------------------------------------------------------------------------  //

de.Context.prototype.get_cookie = function( name ) {
    return this._cookies.get( name );
};

de.Context.prototype.set_cookie = function( name, value, options ) {
    if ( !this.res.headersSent ) {
        this._cookies.set( name, value, options );

    } else {
        //  FIXME: Warning? Error?
    }
};

de.Context.prototype.set_header = function( name, value ) {
    if ( !this.res.headersSent ) {
        this.res.setHeader( name, value );

    } else {
        //  FIXME: Warning? Error?
    }
};

//  ---------------------------------------------------------------------------------------------------------------  //

de.Context.prototype.error = function( error ) {
    if ( this._done ) {
        return;
    }
    this._done = true;

    if ( this._promise ) {
        this._promise.trigger( 'abort', 'ERROR' );
        this._promise = null;
    }

    if ( typeof error === 'string' ) {
        if ( error.charAt( 0 ) === '<' ) {
            this.res.setHeader( 'content-type', 'text/html' );

        } else {
            this.res.setHeader( 'content-type', 'text/plain' );
        }
        this.res.statusCode = 500;
        this.res.end( error );

    } else {
        if ( de.is_error( error ) ) {
            error = error.error;
        }

        this.res.statusCode = error.status_code || 500;
        this.res.setHeader( 'content-type', 'application/json' );
        this.res.end( JSON.stringify( error ) );
    }
};

//  ---------------------------------------------------------------------------------------------------------------  //

de.Context.prototype.redirect = function( redirect ) {
    if ( this._done ) {
        return;
    }

    if ( typeof redirect === 'string' ) {
        redirect = {
            location: redirect
        };
    }

    this._done = de.error( 'REDIRECTED', {
        location: redirect.location
    } );

    if ( this._promise ) {
        this._promise.trigger( 'abort', this._done );
        this._promise = null;
    }

    if ( !redirect.status_code ) {
        redirect.status_code = ( this.req.method === 'POST' ) ? 303 : 302;
    }

    this.res.setHeader( 'location', redirect.location );
    this.res.statusCode = redirect.status_code;
    this.res.end();
};

//  ---------------------------------------------------------------------------------------------------------------  //

de.Context.prototype.end = function( result ) {
    if ( de.is_error( result ) ) {
        return this.error( result );
    }

    if ( this._done ) {
        return;
    }
    this._done = true;

    if ( typeof result === 'string' ) {
        if ( result.charAt( 0 ) === '<' ) {
            this.res.setHeader( 'content-type', 'text/html' );

        } else {
            this.res.setHeader( 'content-type', 'text/plain' );
        }

        this.res.end( result );

    } else {
        this.res.setHeader( 'content-type', 'application/json' );
        this.res.end( JSON.stringify( result ) );
    }
};

//  ---------------------------------------------------------------------------------------------------------------  //

module.exports = de;

