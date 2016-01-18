var no = require( 'nommon' );

var de = require( './de.js' );

//  ---------------------------------------------------------------------------------------------------------------  //

de.Context = function( req, res ) {
    this.req = req;
    this.res = res;

    this._promises = {};

    this._blocks = {};
    this._n_blocks = 0;
    this._n_active_blocks = 0;
    this._active_blocks = {};

    this._waiting_for_n_deps = {};
    this._waiting_for_n_subblocks = {};
    this._required_as_dep_by = {};
    this._required_as_subblock_by = {};

    this.state = {};
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

de.Context.prototype.abort = function( reason ) {
    if ( this._promise ) {
        this._promise.trigger( 'abort', reason );
    }
};

//  ---------------------------------------------------------------------------------------------------------------  //

de.Context.prototype.print = function() {
    return;
    console.log( 'CONTEXT' );
    console.log( this._n_blocks, this._n_active_blocks );
    console.log( 'w4d', this._waiting_for_n_deps );
    console.log( 'w4s', this._waiting_for_n_subblocks );
    console.log( 'rad', this._required_as_dep_by );
    console.log( 'ras', this._required_as_subblock_by );
};

de.Context.prototype.run = function( block, params ) {
    if ( this._promise ) {
        this.error( 'Already running' );
    }

    block = de.Block.compile( block );

    this._promise = block._run( params, this );

    //  FIXME: Тут, кажется, какой-то другой промис нужно отдавать.
    return this._promise;
};

//  ---------------------------------------------------------------------------------------------------------------  //

module.exports = de;

