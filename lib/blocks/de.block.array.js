var no = require( 'nommon' );

var de = require( './de.block.js' );
require( '../results/index.js' );

//  ---------------------------------------------------------------------------------------------------------------  //

de.Block.Array = function( block, options ) {
    this._init( block, options );
};

no.inherit( de.Block.Array, de.Block );

de.Block.Array.prototype._type = 'array';

//  ---------------------------------------------------------------------------------------------------------------  //

de.Block.Array.prototype._init_block = function( raw_block ) {
    var dirname = this.options.dirname;

    this.block = [];
    for ( var i = 0, l = raw_block.length; i < l; i++ ) {
        var block = de.Block.compile( raw_block[ i ] );
        block.options.dirname = dirname;

        this.block.push( block );
    }
};

de.Block.Array.prototype._action = function( params, context ) {
    var promises = [];

    var block = this.block;
    for ( var i = 0, l = block.length; i < l; i++ ) {
        promises.push( this.block[ i ]._run( params, context ) );
    }

    var promise = no.promise.all( promises );

    promise.on( 'abort', function( reason ) {
        for ( var i = 0, l = promises.length; i < l; i++ ) {
            promises[ i ].trigger( 'abort', reason );
        }
    } );

    return promise.then( function( result ) {
        return new de.Result.Array( result );
    } );
};

//  ---------------------------------------------------------------------------------------------------------------  //

de.Block.Array.prototype._start_in_context = function( params, context ) {
    //  Do nothing.
};

de.Block.Array.prototype._done_in_context = function( params, context ) {
    context._n_blocks--;

    context._queue_deps_check();
};

//  ---------------------------------------------------------------------------------------------------------------  //

module.exports = de;

