var path_ = require( 'path' );

var de = require( './de.js' );

require( './de.error.js' );

require( './blocks/index.js' );
require( './results/index.js' );
require( './de.context.js' );

//  ---------------------------------------------------------------------------------------------------------------  //

var _require_cache = {};

//  ---------------------------------------------------------------------------------------------------------------  //

require.extensions[ '.ds' ] = function( module, filename ) {
    var dirname = path_.dirname( filename );

    require.extensions[ '.js' ]( module, filename );

    var block = module.exports;

    if ( Array.isArray( block ) ) {
        block = de.array( block, { dirname: dirname } );

    } else if ( block && typeof block === 'object' ) {
        block = de.object( block, { dirname : dirname } );

    //  FIXME: А будет ли тут работать instanceof?
    } else if ( block instanceof de.Block.Lazy ) {
        block.options.dirname = block.options.dirname || dirname;

    } else {
        block = de.value( block, { dirname: dirname } );
    }

    module.exports = block;
};

de.require = function( filename ) {
    if ( !path_.isAbsolute( filename ) ) {
        throw Error( 'Absolute path required' );
    }

    var block = _require_cache[ filename ];
    if ( !block ) {
        block = require( filename );
        block = de.Block.compile( block );
        block.options.dirname = block.options.dirname || path_.dirname( filename );
        _require_cache[ filename ] = block;
    }

    return block;
};

//  ---------------------------------------------------------------------------------------------------------------  //

module.exports = de;

