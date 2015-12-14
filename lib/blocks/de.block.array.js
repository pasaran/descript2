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

de.Block.Array.prototype._init_block = function() {
    var raw_block = this.raw_block;

    var options = { dirname: this.options.dirname };

    var block = this.block = [];
    for ( var i = 0, l = raw_block.length; i < l; i++ ) {
        var item = raw_block[ i ];
        block.push( de.Block.compile( item, options ) );
    }
};

de.Block.Array.prototype._action = function( params, context ) {
    var promises = [];

    var block = this.block;
    for ( var i = 0, l = block.length; i < l; i++ ) {
        promises.push( this.block[ i ].run( params, context ) );
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

de.Block.Array.prototype._start_in_context = function( context ) {
    console.log( '_start_in_context', this.id, this._type );
    var l = this.block.length;

    for ( var i = 0; i < l; i++ ) {
        var block = this.block[ i ];
        var id = block.id;

        var ids = context._required_as_subblock_by[ id ] || (( context._required_as_subblock_by[ id ] = {} ));
        ids[ this.id ] = true;
    }

    context._waiting_for_n_subblocks[ this.id ] = l;
    context.print();
};

//  ---------------------------------------------------------------------------------------------------------------  //

module.exports = de;

