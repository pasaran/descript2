const no = require( 'nommon' );

const de = require( './de.js' );
require( './de.error.js' );

//  ---------------------------------------------------------------------------------------------------------------  //

de.Cache = function() {
    this._cache = {};
};

de.Cache.prototype.get = function( key ) {
    var cache = this._cache;

    var item = cache[ key ];
    if ( item ) {
        if ( Date.now() < item.expires ) {
            return item.data;
        }

        delete cache[ key ];
    }
};

de.Cache.prototype.set = function( key, data, max_age ) {
    this._cache[ key ] = {
        data: data,
        expires: Date.now() + max_age * 1000
    };
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

de.Cache.TestAsync = TestAsync;
de.Cache.TestSync = de.Cache;

//  ---------------------------------------------------------------------------------------------------------------  //

module.exports = de;

