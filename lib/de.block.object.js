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

function compare_blocks( a, b ) {
    return b.priority - a.priority;
}

de.Block.Object.prototype._init_block = function( raw_block ) {
    var dirname = this.dirname;

    this.block = [];
    this.keys = [];
    var has_priority = false;
    for ( var key in raw_block ) {
        this.keys.push( key );

        var block = de.compile( raw_block[ key ] );
        block.dirname = dirname;

        this.block.push( block );

        if ( block.options.priority !== 0 ) {
            has_priority = true;
        }
    }

    if ( has_priority ) {
        this.sorted_blocks = [];
        for ( var i = 0, l = this.block.length; i < l; i++ ) {
            var block = this.block[ i ];
            var key = this.keys[ i ];
            this.sorted_blocks.push( {
                key: key,
                block: block,
                priority: block.options.priority
            } );
        }
        this.sorted_blocks = this.sorted_blocks.sort( compare_blocks );
    }
};

de.Block.Object.prototype._action = function( params, context, state ) {
    //  console.log( '_action', this.id, this._type );

    const sorted_blocks = this.sorted_blocks;
    if ( sorted_blocks ) {
        var l = sorted_blocks.length;
        if ( !l ) {
            //  FIXME: Вообще, это нужно где-то в другом месте проверять.
            //  При компиляции блока, возможно, создавать не object, а value.
            //
            return no.promise.resolved( {} );
        }

        var result = {};

        var running = no.promise();
        run( 0 );

        return running;

        function run( i ) {
            if ( i >= l ) {
                return running.resolve( result );
            }

            var current_priority = sorted_blocks[ i ].priority;
            var promises = [];
            while ( i < l ) {
                var block = sorted_blocks[ i ];
                if ( block.priority !== current_priority ) {
                    break;
                }

                var promise = block.block._run( params, context, state );
                ( function( block ) {
                    promise.then( function( _result ) {
                        result[ block.key ] = _result;
                    } );
                } )( block );
                promises.push( promise );
                i++;
            }

            no.promise.all( promises )
                .then( function() {
                    run( i );
                } );
        }


    } else {
        var promises = {};

        for ( var i = 0, l = this.block.length; i < l; i++ ) {
            promises[ this.keys[ i ] ] = this.block[ i ]._run( params, context, state );
        }

        //  FIXME: Прокидывать abort.

        return no.promise.all( promises );
    }
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

