var no = require( 'nommon' );

var de = require( './de.js' );
require( './de.logger.js' );

//  ---------------------------------------------------------------------------------------------------------------  //

var _context_id = 0;

de.Context = function( req, res ) {
    this.req = req || null;
    this.res = res || null;

    this.id = _context_id++;

    this._promise = null;

    this._promises = {};

    this._n_blocks = 0;
    this._n_active_blocks = 0;

    this._deps_check_timer = null;
    this._dependent_blocks = {};

    this._states = {};

    this.logger = new de.Logger();
};

//  ---------------------------------------------------------------------------------------------------------------  //

de.Context.prototype._get_promise = function( id ) {
    var promise = this._promises[ id ];
    if ( !promise ) {
        promise = this._promises[ id ] = no.promise();
    }
    return promise;
};

//  ---------------------------------------------------------------------------------------------------------------  //

de.Context.prototype.run = function( block, params ) {
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

de.Context.prototype._queue_deps_check = function() {
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

de.Context.prototype.abort = function( reason ) {
    if ( this._promise ) {
        this._promise.trigger( 'abort', reason );

        //  FIXME: Правильно ли это? Не нужен ли этот promise зачем-то еще?
        this._promise = null;
    }
};

//  ---------------------------------------------------------------------------------------------------------------  //

de.Context.prototype.print = function() {
    //  console.log( 'CONTEXT', this._n_blocks, this._n_active_blocks );
};

//  ---------------------------------------------------------------------------------------------------------------  //

//  FIXME: А что тут нужно делать?
de.Context.prototype.error = function( error ) {
    throw Error( error );
};

//  ---------------------------------------------------------------------------------------------------------------  //

module.exports = de;

