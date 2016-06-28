const no = require( 'nommon' );

const de = require( './de.js' );
require( './de.block.js' );

//  ---------------------------------------------------------------------------------------------------------------  //

de.Block.Array = function( block, options ) {
    this._init( block, options );
};

no.inherit( de.Block.Array, de.Block );

de.Block.Array.prototype._type = 'array';

//  ---------------------------------------------------------------------------------------------------------------  //

de.Block.Array.prototype._init_block = function( raw_block ) {
    var dirname = this.dirname;

    this.block = [];
    for ( var i = 0, l = raw_block.length; i < l; i++ ) {
        var block = de.compile( raw_block[ i ] );
        block.dirname = dirname;

        this.block.push( block );
    }
};

de.Block.Array.prototype._action = function( params, context, state ) {
    var promises = [];

    var block = this.block;
    for ( var i = 0, l = block.length; i < l; i++ ) {
        promises.push( this.block[ i ]._run( params, context, state ) );
    }

    var promise = no.promise.all( promises );

    promise.on( 'abort', function( reason ) {
        for ( var i = 0, l = promises.length; i < l; i++ ) {
            promises[ i ].trigger( 'abort', reason );
        }
    } );

    return promise;
};

//  ---------------------------------------------------------------------------------------------------------------  //

de.Block.Array.prototype._start_in_context = function( context ) {
    //  Do nothing.
};

de.Block.Array.prototype._done_in_context = function( context ) {
    context._n_blocks--;

    context._queue_deps_check();
};

//  ---------------------------------------------------------------------------------------------------------------  //

module.exports = de;

