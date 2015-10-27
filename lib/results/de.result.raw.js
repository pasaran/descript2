var no = require( 'nommon' );

var de = require( './de.result.js' );

//  ---------------------------------------------------------------------------------------------------------------  //

de.Result.Raw = function( buffer, content_type ) {
    this.buffer = buffer;
    this.content_type = content_type;
};

no.inherit( de.Result.Raw, de.Result );

//  ---------------------------------------------------------------------------------------------------------------  //

de.Result.Raw.prototype.get_content_type = function() {
    return this.content_type;
};

//  ---------------------------------------------------------------------------------------------------------------  //

de.Result.Raw.prototype.as_string = function() {
    var s = this._string;

    if ( s === undefined ) {
        s = this._string = this._as_string();
    }

    return s;
};

de.Result.Raw.prototype._as_string = function() {
    return this.buffer.toString();
};

de.Result.Raw.prototype.as_object = function() {
    var o = this._object;

    if ( o === undefined ) {
        o = this._object = this._as_object();
    }

    return o;
};

de.Result.Raw.prototype._parse_to_object = function() {
    try { 
        var object = JSON.parse( this.as_string() );
        this._buffer_parsed = true;

    } catch ( e ) {
        return {
            error: {
                id: 'INVALID_JSON'
            }
        };
    }
};

de.Result.Raw.prototype._as_object = function() {
    return this._parse_to_object();
};

de.Result.Raw.prototype.write = function( stream, as_json ) {
    if ( !this.is_json() && as_json ) {
        stream.write( JSON.stringify( this.as_string() ) );

    } else {
        if ( this._buffer_parsed ) {
            stream.write( JSON.stringify( this.as_object() ) );

        } else {
            stream.write( this.buffer );
        }
    }
};

