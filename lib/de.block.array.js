const no = require( 'nommon' );

const de = require( './de.js' );
require( './de.block.composite.js' );

//  ---------------------------------------------------------------------------------------------------------------  //

de.Block.Array = function( block, options ) {
    this._init( block, options );
};

no.inherit( de.Block.Array, de.Block.Composite );

de.Block.Array.prototype._type = 'array';

//  ---------------------------------------------------------------------------------------------------------------  //

de.Block.Array.prototype._init_block = function( raw_block ) {
    var dirname = this.dirname;

    var blocks = [];
    for ( var i = 0, l = raw_block.length; i < l; i++ ) {
        var block = de.compile( raw_block[ i ] );
        //  FIXME: У блока уже может быть dirname.
        block.dirname = dirname;

        blocks.push( {
            index: i,
            block: block,
            priority: block.options.priority || 0
        } );
    }

    this._init_groups( blocks );
};

de.Block.Array.prototype._action = function( params, context, state ) {
    return this._run_groups( params, context, state );
};

//  ---------------------------------------------------------------------------------------------------------------  //

module.exports = de;

