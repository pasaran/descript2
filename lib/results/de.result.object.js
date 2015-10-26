var no = require( 'nommon' );

var de = require( './de.result.js' );

//  ---------------------------------------------------------------------------------------------------------------  //

de.Result.Object = function( result ) {
    this.result = result;
};

no.inherit( de.Result.Object, de.Result );

//  ---------------------------------------------------------------------------------------------------------------  //

de.Result.Object.prototype.as_string = function() {
    var s = this._string;

    if ( s === undefined ) {
        var result = this.result;

        s = '{';
        var i = 0;
        for ( var key in result ) {
            if ( i++ ) {
                s += ',';
            }
            s += JSON.stringify( key ) + ':' + result[ key ].as_string();
        }
        s += '}';

        this._string = s;
    }

    return s;
};

de.Result.Object.prototype.as_object = function() {
    var o = this._object;

    if ( !o ) {
        var result = this.result;

        o = {};
        for ( var key in result ) {
            o[ key ] = result[ key ].as_object();
        }

        this._object = o;
    }

    return o;
};

de.Result.Object.prototype.write_to = function( stream ) {
    var result = this.result;

    stream.write( '{' );
    var i = 0;
    for ( var key in result ) {
        if ( i++ ) {
            stream.write( ',' );
        }
        stream.write( JSON.stringify( key ) + ':' );
        result[ key ].write_to( stream, 'json' );
    }
    stream.write( '}' );
};

//  ---------------------------------------------------------------------------------------------------------------  //

module.exports = de;

