var no = require( 'nommon' );

var de = require( './de.result.js' );

//  ---------------------------------------------------------------------------------------------------------------  //

de.Result.Array = function( result ) {
    this.result = result;
};

no.inherit( de.Result.Array, de.Result );

//  ---------------------------------------------------------------------------------------------------------------  //

de.Result.Array.prototype.as_string = function() {
    var s = this._string;

    if ( s === undefined ) {
        var result = this.result;

        s = '[';
        for ( var i = 0, l = result.length; i < l; i++ ) {
            if ( i ) {
                s += ',';
            }
            s += result[ i ].as_string();
        }
        s += ']';

        this._string = s;
    }

    return s;
};

de.Result.Array.prototype.as_object = function() {
    var o = this._object;

    if ( !o ) {
        var result = this.result;

        o = [];
        for ( var i = 0, l = result.length; i < l; i++ ) {
            o[ i ] = result[ i ].as_object();
        }

        this._object = o;
    }

    return o;
};

de.Result.Array.prototype.write_to = function( stream ) {
    var result = this.result;

    stream.write( '[' );
    for ( var i = 0, l = result.length; i < l; i++ ) {
        if ( i ) {
            stream.write( ',' );
        }
        result[ i ].write_to( stream, 'json' );
    }
    stream.write( '}' );
};

//  ---------------------------------------------------------------------------------------------------------------  //

module.exports = de;

