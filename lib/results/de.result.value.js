var no = require( 'nommon' );

var de = require( './de.result.js' );

//  ---------------------------------------------------------------------------------------------------------------  //

de.Result.Value = function( result ) {
    this.result = result;
};

no.inherit( de.Result.Value, de.Result );

//  ---------------------------------------------------------------------------------------------------------------  //

de.Result.Value.prototype.as_string = function() {
    var s = this._string;

    if ( s === undefined ) {
        s = this._string = JSON.stringify( this.result );
    }

    return s;
};

de.Result.Value.prototype.as_object = function() {
    return this.result;
};

de.Result.Value.prototype.write_to = function( stream ) {
    stream.write( this.to_string() );
};

//  ---------------------------------------------------------------------------------------------------------------  //

module.exports = de;

