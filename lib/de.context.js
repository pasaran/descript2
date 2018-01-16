var Cookies = require( 'cookies' );

var no = require( 'nommon' );

var de = require( './de.js' );
require( './de.log.js' );
require( './de.error.js' );

//  ---------------------------------------------------------------------------------------------------------------  //

var DEFAULT_OPTIONS = {
    log: new de.Log(),
    cache: null,
};

//  ---------------------------------------------------------------------------------------------------------------  //

var _context_id = 1;

var Context = function( options ) {
    this._id = _context_id++;
    this._request_id = 1;

    this._promise = null;

    this._promises = {};

    this._n_blocks = 0;
    this._n_active_blocks = 0;

    this._deps_check_timer = null;
    this._dependent_blocks = {};

    this._pre_conditions = {};

    options = no.extend( {}, DEFAULT_OPTIONS, options );
    this.log = options.log;
    this.cache = options.cache;
    this.config = options.config;
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

Context.prototype.run = function( block, params, state ) {
    //  FIXME: Какая-то такая проверка нужна, но этот вариант не рабочий.
    //  Т.к. de.func запускает полученный блок через context.run
    //  и получает 'Already running'.
    //  Надо переделать.
    /*
    if ( this._promise ) {
        //  FIXME: Тут просто warning в лог нужно писать и все.
        //  Или же бросать эксепшен, но прерывать уже запущенный процесс как-то странно.
        this.abort( 'Already running' );
    }
    */

    //  block = de.Block.compile( block );
    block = de.block( block );

    //  FIXME: А откуда берется state?!
    this._promise = block._run( params, this, state );

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
                that._get_promise( block_id ).resolve( de.error( de.Error.ID.DEPS_ERROR ) );
            }
        }
    //  FIXME: Какой тут таймаут поставить по-дефолту?
    //  И унести его в конфиг или в изменяемую переменную.
    }, 100 );
};

//  ---------------------------------------------------------------------------------------------------------------  //

Context.prototype.abort = function( reason ) {
    if ( this._promise ) {
        this._promise.abort( reason );

        //  FIXME: Правильно ли это? Не нужен ли этот promise зачем-то еще?
        this._promise = null;
    }
};

//  ---------------------------------------------------------------------------------------------------------------  //

Context.prototype.error = function( message ) {
    this.log.error( this._log_message( message ) );
};

Context.prototype.warn = function( message ) {
    this.log.warn( this._log_message( message ) );
};

Context.prototype.info = function( message ) {
    this.log.info( this._log_message( message ) );
};

Context.prototype.debug = function( message ) {
    this.log.debug( this._log_message( message ) );
};

Context.prototype._log_message = function( message ) {
    return message + ' [ctx.' + this._id + ']';
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

/*

    context.abort( {
        id: 'FATAL_ERROR',
        message: 'Something happened',
        status_code: 503,
        body: '<h1>Error</h1>',
        content_type: 'text/html'
    } )

*/
de.Context.prototype.abort = function( error ) {
    if ( this._done ) {
        return;
    }

    this._done = error = de.error( error );

    if ( this._promise ) {
        this._promise.abort( error );
        this._promise.resolve( error );
        this._promise = null;
    }

    error = error.error;

    this.res.statusCode = error.status_code || 500;

    var body = error.body || error;
    var content_type = error.content_type;

    if ( typeof body === 'object' ) {
        this.res.setHeader( 'content-type', content_type || 'application/json' );
        this.res.end( JSON.stringify( body ) );

    } else {
        body = String( body );

        if ( !content_type ) {
            content_type = ( body.charAt( 0 ) === '<' ) ? 'text/html' : 'text/plain';
        }
        this.res.setHeader( 'content-type', content_type );
        this.res.end( body );
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

    this._done = de.error( {
        id: de.Error.ID.REDIRECTED,
        location: redirect.location
    } );

    if ( this._promise ) {
        //  FIXME: Может делать только abort? Чтобы он сам уже делал resolve?
        this._promise.abort( this._done );
        this._promise.resolve( this._done );
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
        return this.abort( result );
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

