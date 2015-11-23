var no = require( 'nommon' );

var de = require( './de.result.js' );
require( './de.result.value.js' );

de.Result.Error = function( result ) {
    this.result = result;
};

no.inherit( de.Result.Error, de.Result.Value );

