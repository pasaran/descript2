var de = function( block, options ) {
    if ( de.is_block( block ) ) {
        return block;
    }

    if ( de.is_lazy( block ) ) {
        return ( options ) ? block( options ) : block;
    }

    if ( Array.isArray( block ) ) {
        return de.array( block, options );
    }

    if ( block && typeof block === 'object' ) {
        return de.object( block, options );
    }

    if ( typeof block === 'function' ) {
        return de.func( block, options );
    }

    return de.value( block, options );
};

module.exports = de;

