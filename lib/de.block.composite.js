const no = require( 'nommon' );

const de = require( './de.js' );
require( './de.block.js' );
require( './de.error.js' );

//  ---------------------------------------------------------------------------------------------------------------  //

de.Block.Composite = function( block, options ) {
    throw Error( 'Abstract class' );
};

no.inherit( de.Block.Composite, de.Block );

//  ---------------------------------------------------------------------------------------------------------------  //

function compare_blocks( a, b ) {
    return b.priority - a.priority;
}

//  ---------------------------------------------------------------------------------------------------------------  //

de.Block.Composite.prototype._init_groups = function( items ) {
    var groups = this._groups = [];

    var l = items.length;
    if ( !l ) {
        return;
    }

    items.sort( compare_blocks );

    var item = items[ 0 ];
    var group = [ item ];
    var group_priority = item.priority;
    for ( var i = 1; i < l; i++ ) {
        item = items[ i ];
        var item_priority = item.priority;

        if ( item_priority !== group_priority ) {
            groups.push( group );
            group = [];
            group_priority = item_priority;
        }

        group.push( item );
    }

    if ( group.length ) {
        groups.push( group );
    }
};

de.Block.Composite.prototype._run_groups = function( params, context, state ) {
    var groups = this._groups;
    var l = groups.length;

    var result = [];

    var group_promises;

    var running = no.promise();
    running.on( 'abort', function( e, reason ) {
        if ( group_promises ) {
            for ( var i = 0, l = group_promises.length; i < l; i++ ) {
                group_promises[ i ].abort( reason );
            }
        }
    } );

    run_group( 0 );

    return running;

    function run_group( i ) {
        if ( i === l ) {
            return running.resolve( result );
        }

        var group = groups[ i ];
        group_promises = [];

        for ( var j = 0, m = group.length; j < m; j++ ) {
            let item = group[ j ];

            const block = item.block;
            var promise = block._run( params, context, state );
            group_promises.push( promise );

            promise.then( function( block_result ) {
                result[ item.index ] = block_result;

                if ( de.is_error( block_result ) ) {
                    if ( block_result.error.id === de.Error.ID.REQUIRED_BLOCK_FAILED || block.options.required ) {
                        const error = de.error( {
                            id: de.Error.ID.REQUIRED_BLOCK_FAILED,
                            path: get_error_path( item.key, block_result ),
                            parent: block_result,
                        } );

                        running.resolve( error );
                        running.trigger( 'abort', error );
                    }
                }
            } );
        }

        no.promise.all( group_promises )
            .then( function() {
                run_group( i + 1 );
            } );
    }
};

//  ---------------------------------------------------------------------------------------------------------------  //

de.Block.Composite.prototype._start_in_context = function( context ) {
    //  Do nothing.
};

de.Block.Composite.prototype._done_in_context = function( context ) {
    context._n_blocks--;

    context._queue_deps_check();
};

//  ---------------------------------------------------------------------------------------------------------------  //

function get_error_path( key, error ) {
    let r = ( typeof key === 'number' ) ? `[ ${ key } ]` : `.${ key }`;

    if ( error && error.error.path ) {
        r += error.error.path;
    }

    return r;
}

//  ---------------------------------------------------------------------------------------------------------------  //

module.exports = de;

