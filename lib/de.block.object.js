const no = require( 'nommon' );

const de = require( './de.js' );
require( './de.block.js' );

//  ---------------------------------------------------------------------------------------------------------------  //

de.Block.Object = function( block, options ) {
    this._init( block, options );
};

no.inherit( de.Block.Object, de.Block );

de.Block.Object.prototype._type = 'object';

//  ---------------------------------------------------------------------------------------------------------------  //

de.Block.Object.prototype._init_block = function( raw_block ) {
    var dirname = this.dirname;

    this.block = [];
    this.keys = [];
    for ( var key in raw_block ) {
        this.keys.push( key );

        var block = de.compile( raw_block[ key ] );
        block.dirname = dirname;

        this.block.push( block );
    }
};

de.Block.Object.prototype._action = function( params, context, state ) {
    //  console.log( '_action', this.id, this._type );

    var promises = {};

    for ( var i = 0, l = this.block.length; i < l; i++ ) {
        promises[ this.keys[ i ] ] = this.block[ i ]._run( params, context, state );

        /*
        var id = block.id;
        var ids = context._required_as_subblock_by[ id ] || (( context._required_as_subblock_by[ id ] = {} ));
        ids[ id ] = true;
        */
    }
    //  context._waiting_for_n_subblocks[ this.id ] = l;

    //  FIXME: Прокидывать abort.

    return no.promise.all( promises );
};

//  ---------------------------------------------------------------------------------------------------------------  //

de.Block.Object.prototype._start_in_context = function( context ) {
    //  Do nothing.
};

de.Block.Object.prototype._done_in_context = function( context ) {
    context._n_blocks--;

    context._queue_deps_check();
};

//  ---------------------------------------------------------------------------------------------------------------  //

module.exports = de;

