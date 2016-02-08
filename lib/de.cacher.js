var no = require( 'nommon' );

var de = require( './de.js' );

//  ---------------------------------------------------------------------------------------------------------------  //

var BaseAsync = function() {
    this._cache = {};
};

BaseAsync.prototype.get = function( key ) {
    var promise = no.promise();

    var now = Date.now();
    var item = this._cache[ key ];

    no.next_tick( function() {
        if ( !item || item.expires < now ) {
            promise.resolve();

        } else {
            promise.resolve( item.data );
        }
    } );

    return promise;
};

BaseAsync.prototype.set = function( key, data, ttl ) {
    var cache = this._cache;

    no.next_tick( function() {
        cache[ key ] = {
            data: data,
            expires: Date.now() + ttl
        };
    } );
};

//  ---------------------------------------------------------------------------------------------------------------  //

var BaseSync = function() {
    this._cache = {};
};

BaseSync.prototype.get = function( key ) {
    var now = Date.now();
    var item = this._cache[ key ];

    if ( item && item.expires >= now ) {
        return item.data;
    }
};

BaseSync.prototype.set = function( key, data, ttl ) {
    this._cache[ key ] = {
        data: data,
        expires: Date.now() + ttl
    };
};

//  ---------------------------------------------------------------------------------------------------------------  //

de.Cacher = function() {
    //  TODO: Взять модуль memcached.
};

//  ---------------------------------------------------------------------------------------------------------------  //

de.Cacher.BaseAsync = BaseAsync;
de.Cacher.BaseSync = BaseSync;

//  ---------------------------------------------------------------------------------------------------------------  //

module.exports = de;

