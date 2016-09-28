var Memcached = require( 'memcached' );

var no = require( 'nommon' );

var de = require( './de.js' );
require( './de.error.js' );

//  ---------------------------------------------------------------------------------------------------------------  //

//  Выпилить memcached в отдельный репозиторий.
//  Сделать дефолтный кэш в памяти (а)синхронный.
//
de.Cache = function( locations, options ) {
    this._cache = new Memcached( locations, options );
};

de.Cache.prototype.get = function( key ) {
    var promise = no.promise();

    this._cache.get( key, function( error, data ) {
        if ( error ) {
            promise.resolve( de.error( error ) );

        } else {
            promise.resolve( data );
        }
    } );

    return promise;
};

de.Cache.prototype.set = function( key, data, max_age ) {
    this._cache.set( key, data, max_age );
};

//  ---------------------------------------------------------------------------------------------------------------  //

var TestAsync = function() {
    this._cache = {};
};

TestAsync.prototype.get = function( key ) {
    var promise = no.promise();

    var cache = this._cache;

    no.next_tick( function() {
        var item = cache[ key ];
        if ( item ) {
            if ( Date.now() < item.expires ) {
                promise.resolve( item.data );

                return;
            }

            delete cache[ key ];
        }

        promise.resolve();
    } );

    return promise;
};

TestAsync.prototype.set = function( key, data, max_age ) {
    var cache = this._cache;

    no.next_tick( function() {
        cache[ key ] = {
            data: data,
            expires: Date.now() + max_age * 1000
        };
    } );
};

//  ---------------------------------------------------------------------------------------------------------------  //

var TestSync = function() {
    this._cache = {};
};

TestSync.prototype.get = function( key ) {
    var cache = this._cache;

    var item = cache[ key ];
    if ( item ) {
        if ( Date.now() < item.expires ) {
            return item.data;
        }

        delete cache[ key ];
    }
};

TestSync.prototype.set = function( key, data, max_age ) {
    this._cache[ key ] = {
        data: data,
        expires: Date.now() + max_age * 1000
    };
};

//  ---------------------------------------------------------------------------------------------------------------  //

de.Cache.TestAsync = TestAsync;
de.Cache.TestSync = TestSync;

//  ---------------------------------------------------------------------------------------------------------------  //

module.exports = de;

