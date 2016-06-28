const fs_ = require( 'fs' );
const path_ = require( 'path' );

const no = require( 'nommon' );

const de = require( './de.js' );
require( './de.block.js' );

//  ---------------------------------------------------------------------------------------------------------------  //

de.Block.File = function( block, options ) {
    this._init( block, options );
};

no.inherit( de.Block.File, de.Block );

de.Block.File.prototype._type = 'file';

//  ---------------------------------------------------------------------------------------------------------------  //

de.Block.File.prototype._init_block = function( raw_block ) {
    this.block = {};

    this.block.filename = no.jpath.string( raw_block.filename );
    this.block.is_json = raw_block.is_json || null;
};

//  ---------------------------------------------------------------------------------------------------------------  //

de.Block.File.prototype.resolve_filename = function( filename ) {
    return path_.resolve( this.dirname, filename );
};

//  ---------------------------------------------------------------------------------------------------------------  //

de.Block.File.prototype._action = function( params, context, state ) {
    //  FIXME: Поправить jvars.
    var filename = this.resolve_filename( this.block.filename( params, context ) );

    var is_json = this.block.is_json || ( path_.extname( filename ) === '.json' );

    var promise = no.promise();

    fs_.readFile( filename, function( error, result ) {
        if ( error ) {
            promise.resolve( de.error( error ) );

        } else {
            if ( is_json ) {
                try {
                    result = JSON.parse( result );

                    promise.resolve( result );

                } catch ( e ) {
                    promise.resolve( de.error( e, 'INVALID_JSON' ) );
                }

            } else {
                promise.resolve( result.toString() );
            }
        }
    } );

    return promise;
};

//  ---------------------------------------------------------------------------------------------------------------  //

module.exports = de;

