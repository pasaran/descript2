var fs_ = require( 'fs' );
var path_ = require( 'path' );

var no = require( 'nommon' );
var fs_ = require( 'fs' );

var de = require( './de.block.js' );
require( '../results/index.js' );

//  ---------------------------------------------------------------------------------------------------------------  //

de.Block.File = function( block, options ) {
    this._init( block, options );
};

no.inherit( de.Block.File, de.Block );

de.Block.File.prototype._type = 'file';

//  ---------------------------------------------------------------------------------------------------------------  //

de.Block.File.prototype._init_block = function() {
    var raw_block = this.raw_block;

    this.block = {};

    this.block.filename = no.jpath.string( raw_block.filename );
    this.block.is_json = raw_block.is_json || null;
};

//  ---------------------------------------------------------------------------------------------------------------  //

de.Block.File.prototype._action = function( params, context ) {
    console.log( '_action', this.id, this._type );
    var filename = this.resolve_filename( this.block.filename( params, context ) );

    var is_json = this.block.is_json || ( path_.extname( filename ) === '.json' );

    var promise = no.promise();

    fs_.readFile( filename, function( error, result ) {
        if ( error ) {
            promise.resolve( new de.Result.Error( de.error( error ) ) );

        } else {
            if ( is_json ) {
                try {
                    result = JSON.parse( result );

                    promise.resolve( new de.Result.Value( result ) );

                } catch ( e ) {
                    promise.resolve( new de.Result.Error( {
                        id: 'INVALID_JSON',
                        message: e.message,
                        stack: e.stack
                    } ) );
                }

            } else {
                promise.resolve( new de.Result.Value( result.toString() ) );
            }
        }
    } );

    return promise;
};

//  ---------------------------------------------------------------------------------------------------------------  //

module.exports = de;

