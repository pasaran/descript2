var path_ = require( 'path' );

var no = require( 'nommon' );

var de = require( './de.js' );

require( './de.base.js' );
require( './de.error.js' );

require( './blocks/index.js' );
require( './de.context.js' );

//  ---------------------------------------------------------------------------------------------------------------  //

var _require_cache = {};

//  ---------------------------------------------------------------------------------------------------------------  //

de.require = function( filename ) {
    if ( !path_.isAbsolute( filename ) ) {
        //  FIXME.
        throw 'Error';
    }

    //  FIXME: Не нужно ли как-то по-другому нормализовать filename?
    filename = path_.resolve( filename );

    var cached = _require_cache[ filename ];
    if ( cached ) {
        return cached;
    }

    var dirname = path_.dirname( filename );

    var block = require( filename );

    if ( block instanceof de.Block.Lazy ) {
        block = block.clone();
        block.options.dirname = dirname;

    } else {
        var options = { dirname: dirname };

        if ( Array.isArray( block ) ) {
            block = de.array( block, options );

        } else if ( block && typeof block === 'object' ) {
            block = de.object( block, options );

        } else {
            block = de.value( block, options );
        }
    }

    _require_cache[ filename ] = block;

    return block;
};

//  ---------------------------------------------------------------------------------------------------------------  //

module.exports = de;

