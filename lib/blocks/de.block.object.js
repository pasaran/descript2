var no = require( 'nommon' );

var de = require( './de.block.js' );
require( './de.block.array.js' );
require( '../results/index.js' );

//  ---------------------------------------------------------------------------------------------------------------  //

de.Block.Object = function( block, options ) {
    this._init( block, options );
};

no.inherit( de.Block.Object, de.Block );

de.Block.Object.prototype._type = 'object';

//  ---------------------------------------------------------------------------------------------------------------  //

de.Block.Object.prototype._init_block = function( raw_block ) {
    var dirname = this.options.dirname;

    this.block = [];
    this.keys = [];
    for ( var key in raw_block ) {
        this.keys.push( key );

        var block = de.Block.compile( raw_block[ key ] );
        block.options.dirname = dirname;

        this.block.push( block );
    }
};

de.Block.Object.prototype._action = function( params, context ) {
    //  console.log( '_action', this.id, this._type );

    var promises = {};

    for ( var i = 0, l = this.block.length; i < l; i++ ) {
        promises[ this.keys[ i ] ] = this.block[ i ]._run( params, context );

        /*
        var id = block.id;
        var ids = context._required_as_subblock_by[ id ] || (( context._required_as_subblock_by[ id ] = {} ));
        ids[ id ] = true;
        */
    }
    //context._waiting_for_n_subblocks[ this.id ] = l;

    //  FIXME: Прокидывать abort.

    return no.promise.all( promises )
        .then( function( result ) {
            return new de.Result.Object( result );
        } );
};

//  ---------------------------------------------------------------------------------------------------------------  //

de.Block.Object.prototype._start_in_context = de.Block.Array.prototype._start_in_context;
de.Block.Object.prototype._done_in_context = de.Block.Array.prototype._done_in_context;

//  ---------------------------------------------------------------------------------------------------------------  //

module.exports = de;

