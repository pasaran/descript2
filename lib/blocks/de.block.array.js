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

de.Block.Array.prototype._run_action = function( params, context ) {
    return this._action( params, context );
};

//  ---------------------------------------------------------------------------------------------------------------  //

de.Block.Array.prototype._start_in_context = function( params, context ) {
    console.log( '_start_in_context', this.get_id(), this._type );

    var block_id = this.get_id();

    var l = this.block.length;
    for ( var i = 0; i < l; i++ ) {
        var block = this.block[ i ];
        var id = block.get_id();

        var ids = context._required_as_subblock_by[ id ];
        if ( !ids ) {
           ids = context._required_as_subblock_by[ id ] = {};
        }
        ids[ block_id ] = true;
    }
    context._waiting_for_n_subblocks[ block_id ] = l;

    this._run_phases( params, context );

    context.print();
};

//  ---------------------------------------------------------------------------------------------------------------  //

de.Block.Array.prototype._build_result_from_context = function( context ) {
    var result = [];

    for ( var i = 0, l = this.block.length; i < l; i++ ) {
        var id = this.block[ i ].get_id();
        var promise = context._get_promise( id );

        result.push( promise.get_value() );
    }

    return result;
};

//  ---------------------------------------------------------------------------------------------------------------  //

module.exports = de;

