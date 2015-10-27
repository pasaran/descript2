var no = require( 'nommon' );

var de = require( './de.result.js' );
require( './de.result.raw.js' );

//  ---------------------------------------------------------------------------------------------------------------  //

de.Result.File = function( buffer, content_type ) {
    this.buffer = buffer;
    this.content_type = content_type;
};

no.inherit( de.Result.File, de.Result.Raw );

//  ---------------------------------------------------------------------------------------------------------------  //

module.exports = de;

