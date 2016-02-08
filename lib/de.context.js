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

//  ---------------------------------------------------------------------------------------------------------------  //

de.Context.prototype.redirect = function( location, status_code ) {
    if ( this._done ) {
        return;
    }

    this._done = true;

    if ( this._promise ) {
        this._promise.abort();
    }

    this.res.setHeader( 'location', location );
    this.res.statusCode = status_code || 302;
    this.res.end();
};

//  ---------------------------------------------------------------------------------------------------------------  //

/*
    var context = new de.Context( req, res );
    var block = require( './blocks/index.ds2' );
    context.run( block )
        .then( function( result ) {
            context.end( result );
        } );

    de.run( './blocks/index.ds2', req, res );
*/

de.Context.prototype.end = function( result ) {
    if ( this._done ) {
        return;
    }

    this._done = true;
};

//  ---------------------------------------------------------------------------------------------------------------  //

module.exports = de;

