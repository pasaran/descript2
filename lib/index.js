var path_ = require( 'path' );

var no = require( 'nommon' );

var de = require( './de.js' );

require( './de.base.js' );
require( './de.error.js' );

require( './de.block.js' );
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
    if ( de.is_lazy( block ) ) {
        block = block._clone();

        //  FIXME: А как-то более цивильно это можно сделать?
        block.options.push( { dirname: dirname } );

    } else {
        block = de( block, { dirname: dirname } );
    }

    _require_cache[ filename ] = block;

    return block;
};

//  ---------------------------------------------------------------------------------------------------------------  //

module.exports = de;

