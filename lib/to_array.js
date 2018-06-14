module.exports = function( value ) {
    if ( value === undefined ) {
        return [];
    }

    return ( Array.isArray( value ) ) ? value : [ value ];
};

