const no = require( 'nommon' );

const de = require( './de.js' );
require( './de.block.composite.js' );

//  ---------------------------------------------------------------------------------------------------------------  //

de.Block.Object = function( block, options ) {
    this._init( block, options );
};

no.inherit( de.Block.Object, de.Block.Composite );

de.Block.Object.prototype._type = 'object';

//  ---------------------------------------------------------------------------------------------------------------  //

de.Block.Object.prototype._init_block = function( raw_block ) {
    var dirname = this.dirname;

    var blocks = [];
    var keys = this.keys = [];
    var i = 0;
    for ( var key in raw_block ) {
        keys.push( key );

        //  Временный костыль. Если у нас есть de.object, в котором есть подблоки
        //  и мы в одном контексте вызываем этот de.object с разными параметрами,
        //  то получается ерунда. Так как подблоки имеют одинаковые id-шники
        //  и запускаются по одному разу.
        //  Пока что просто клонируем, но это все равно костыль, причем не правильный.
        //  Так как если у подблоков задан options.id, то клонирование не поможет.
        var raw_subblock = raw_block[ key ];
        if ( raw_subblock instanceof de.Lazy ) {
            raw_subblock = raw_subblock._clone();
        }
        var block = de.compile( raw_subblock );
        //  FIXME: У блока уже может быть dirname.
        block.dirname = dirname;

        blocks.push( {
            index: i++,
            key: key,
            block: block,
            priority: block.options.priority || 0
        } );
    }

    this._init_groups( blocks );
};

de.Block.Object.prototype._action = function( params, context, state ) {
    var keys = this.keys;

    var running = this._run_groups( params, context, state );
    var promise = no.promise();
    promise.on( 'abort', function( e, reason ) {
        running.abort( reason );
    } );

    running.then( function( results ) {
        if ( de.is_error( results ) ) {
            promise.resolve( results );

        } else {
            var result = {};
            for ( var i = 0, l = results.length; i < l; i++ ) {
                result[ keys[ i ] ] = results[ i ];
            }
            promise.resolve( result );
        }
    } );

    return promise;
};

//  ---------------------------------------------------------------------------------------------------------------  //

module.exports = de;

