var no = require( 'nommon' );

var de = de || require( '../de.js' );

( function() {

//  ---------------------------------------------------------------------------------------------------------------  //

de.Block = function( block, options ) {
    this._init( block, options );
};

//  ---------------------------------------------------------------------------------------------------------------  //

de.Block.prototype._init = function( block, options ) {
    this.raw_block = block;
    this.raw_options = de.Block.extend_raw_options( {}, options );

    this._init_block();
    this._init_options();

    this._running_cache = {};
};

//  ---------------------------------------------------------------------------------------------------------------  //

de.Block.prototype._init_block = no.op;

//  ---------------------------------------------------------------------------------------------------------------  //

de.Block.prototype._init_options = function() {
    var raw_options = this.raw_options;
    var options = this.options = {};

    var valid_params = raw_options.valid_params;
    if ( valid_params ) {
        options.valid_params = array_to_object( valid_params );
    }
    options.params = raw_options.params || null;
    //  Все параметры, упомянутые в params тоже считаются валидными.
    //  Так что их нет нужды повторно определять в valid_params.
    for ( var p_name in options.params ) {
        if ( options.valid_params[ p_name ] === undefined ) {
            options.valid_params[ p_name ] = null;
        }
    }

    options.guard = compile_option( raw_options.guard, compile_expr );

    options.after = raw_options.after;
    options.before = raw_options.before;

    options.select = compile_option( raw_options.select, compile_object );
    options.result = compile_option( raw_options.result, compile_expr );

    options.timeout = raw_options.timeout;

    options.key = compile_string( raw_options.key );
    options.maxage = raw_options.maxage;

    options.transform = compile_option( raw_options.transform, compile_transform );
};

function compile_option( option, compiler ) {
    if ( option == null ) {
        return null;
    }

    return ( Array.isArray( option ) ) ? option.map( compiler ) : compiler( option );
}

function compile_transform( transform ) {
    if ( transform == null ) {
        return null;
    }

    //  FIXME.
    return function() {
        return '<h1>Hello</h1>'
    };
}

//  ---------------------------------------------------------------------------------------------------------------  //

de.Block.extend_options = function( what, by ) {
    var options = {};

    what = what || {};
    by = by || {};

    options.valid_params = extend_valid_params( what.valid_params, by.valid_params );
    options.params = extend_option( what.params, by.params );

    options.guard = extend_option( what.guard, by.guard );

    options.before = extend_option( what.before, by.before );
    options.after = extend_option( what.after, by.after );

    options.select = extend_option( what.select, by.select );
    options.result = extend_option( what.result, by.result );

    options.timeout = by.timeout || what.timeout || 0;

    options.key = by.key || what.key || null;
    options.maxage = by.maxage || what.maxage || null;

    options.transform = extend_option( what.transform, by.transform );

    //  dest.data_type = src.data_type;
    //  dest.output_type = src.output_type;

    return options;
};

function extend_valid_params( what, by ) {
    if ( !what || !by ) {
        return what || by || null;
    }

    var params = no.extend( {}, array_to_object( what ) );
    by = array_to_object( by );

    for ( var p_name in by ) {
        var p_value = by[ p_name ];

        if ( p_value != null ) {
            params[ p_name ] = p_value;

        } else if ( params[ p_name ] === undefined ) {
            params[ p_name ] = null;

        }
    }

    return params;
};

function array_to_object( array ) {
    if ( !Array.isArray( array ) ) {
        return array;
    }

    var object = {};
    for ( var i = 0, l = array.length; i < l; i++ ) {
        object[ array[ i ] ] = null;
    }
    return object;
}

function extend_option( what, by ) {
    if ( !what || !by ) {
        return what || by || null;
    }

    return [].concat( what, by );
}

//  ---------------------------------------------------------------------------------------------------------------  //

de.Block.extend_block = function( what, by ) {
    return no.extend( {}, what, by );
};

//  ---------------------------------------------------------------------------------------------------------------  //

function compile_expr( expr ) {
    if ( expr == null ) {
        return null;
    }

    return ( typeof expr === 'function' ) ? expr : no.jpath.expr( expr );
}

function compile_string( expr ) {
    if ( expr == null ) {
        return null;
    }

    return ( typeof expr === 'function' ) ? expr : no.jpath.string( expr );
}

function compile_object( object ) {
    if ( object == null ) {
        return null;
    }

    var compiled = {};
    for ( var name in object ) {
        compiled[ name ] = compile_expr( object[ name ] );
    }
    return compiled;
}

//  ---------------------------------------------------------------------------------------------------------------  //

de.Block.prototype._run = function( params, context ) {
    return this.future( params, context );
};

//  ---------------------------------------------------------------------------------------------------------------  //

//  FIXME: Можно компилировать заранее эту функцию на основании `options.params`.
//
de.Block.prototype._params = function( params, context ) {
    var valid_params = this.options.params;

    if ( !valid_params ) {
        return params;
    }

    if ( typeof valid_params === 'function' ) {
        return valid_params( params, context ) || {};
    }

    var new_params = {};
    for ( var p_name in valid_params ) {
        var p_value = valid_params[ p_name ];
        var is_func = ( typeof p_value === 'function' );
        var value = ( is_func ) ? p_value( params, context ) : params[ p_name ];

        if ( value != null ) {
            new_params[ p_name ] = value;

        } else if ( !is_func && p_value != null ) {
            new_params[ p_name ] = p_value;
        }
    }

    return new_params;
};

//  ---------------------------------------------------------------------------------------------------------------  //

var phases = {
    before: {
        id: 'before',

        action: function( params, context, run_state, progress ) {
            if ( this.options.before ) {
                return this.options.before( params, context );
            }
        },

        done: function( params, context, run_state, progress ) {
            return ( progress === undefined ) ? phases.uncache : phases.after;
        },

        fail: function( params, context, run_state, progress ) {
            return phases.error;
        }
    },

    uncache: {
        id: 'uncache',

        action: function( params, context, run_state, progress ) {
            if ( this.options.key ) {
                var key = this.options.key( params, context );
                if ( key ) {
                    run_state.key = key;

                    return this.cache.get( key );
                }
            }
        },

        done: function( params, context, run_state, progress ) {
            return ( progress === undefined ) ? phases.run : phases.after;
        }
    },

    run: {
        id: 'run',

        action: function( params, context, run_state, progress ) {
            var that = this;

            params = this._params( params, context ) || params;

            var running;
            var key = run_state.key;
            if ( key ) {
                running = this._running_cache[ key ];
                if ( running ) {
                    return running;
                }
            }

            running = this._run( params, context );

            if ( !no.is_promise( running ) ) {
                //  TODO.
            }

            if ( key ) {
                this._running_cache[ key ] = running;

                running.always( function() {
                    delete that._running_cache[ key ];
                } );
            }

            if ( this.options.timeout ) {
                var h_timeout = setTimeout( function() {
                    running.reject( no.result.error( de.Block.ERROR.TIMEOUT ) );
                    running.trigger( 'abort' );

                }, this.options.timeout );

                running.always( function() {
                    clearTimeout( h_timeout );
                    h_timeout = null;
                } );
            }

            return running;
        },

        done: function( params, context, run_state, progress ) {
            if ( run_state.key && progress !== undefined && !no.result.is_error( progress ) ) {
                return phases.cache;
            }

            return phases.after;
        },

        fail: function( params, context, run_state, progress ) {
            return phases.error;
        }
    },

    cache: {
        id: 'cache',

        action: function( params, context, run_state, progress ) {
            //  FIXME: Вычислять maxage.
            return this.cache.set( run_state.key, progress, this.options.maxage );
        },

        done: function( params, context, run_state, progress ) {
            return phases.after;
        }
    },

    after: {
        id: 'after',

        action: function( params, context, run_state, progress ) {
            if ( this.options.after ) {
                return this.options.after( params, context );
            }
        },

        done: function( params, context, run_state, progress ) {
            return phases.select;
        },

        fail: function( params, context, run_state, progress ) {
            return phases.error;
        }
    },

    select: {
        id: 'select',

        action: function( params, context, run_state, progress ) {
            var select = this.options.select;
            if ( select ) {
                var state = context.state;

                for ( var name in select ) {
                    var value = select[ name ]( result, context );
                    var old_value = state[ name ];

                    if ( Array.isArray( value ) && Array.isArray( old_value ) ) {
                        state[ name ] = old_value.concat( value );

                    } else {
                        state[ name ] = value;
                    }
                }
            }
        },

        done: function() {
            return phases.result;
        }
    },

    error: {
        id: 'error',

        done: function( params, context, run_state, progress ) {
            if ( !no.result.is_error( progress ) || !progress.is_fatal() ) {
                return phases.result;
            }
        }
    },

    result: {
        id: 'result',

        action: function( params, context, run_state, progress ) {
            if ( this.options.result ) {
                return this.options.result( progress, context, params );
            }
        },

        done: function( params, context, run_state, progress ) {
            return phases.tempalte;
        }
    },

    template: {
        id: 'template',

        action: function( params, context, run_state, progress ) {
            if ( this.options.template ) {
                return this.options.template( progress, context );
            }
        }
    }

};

de.Block.prototype._run_phases = function( start_phase, params, context ) {
    var promise = no.promise();

    var that = this;

    var run_state = {};

    var progress;
    run( start_phase );

    return promise;

    function run( phase ) {
        if ( !phase.action ) {
            return do_done( phase.done );
        }

        var running = phase.action.call( that, params, context, run_state, progress );

        var next_phase;
        var callback;

        if ( no.is_promise( running ) ) {
            return running.then(
                function( value ) {
                    do_done( phase.done, value );
                },

                function( value ) {
                    do_done( phase.fail || phase.done, value );
                }
            );

        } else if ( no.result.is_error( running ) ) {
            callback = phase.fail || phase.done;
        }

        do_done( callback || phase.done, running )
    }

    function do_done( callback, new_progress ) {
        if ( new_progress !== undefined ) {
            progress = new_progress;
        }

        var next_phase = callback.call( that, params, context, run_state, progress );
        if ( next_phase ) {
            run( next_phase );

        } else {
            promise.resolve( progress );
        }
    }
};

de.Block.prototype.run = function( params, context ) {
    return this._run_phases( phases.before, params, context );
};

//  ---------------------------------------------------------------------------------------------------------------  //

de.Block.compile = function( block, dirname ) {
    dirname = dirname || de.config.rootdir;

    if ( Array.isArray( block ) ) {
        return new de.Block.Array( block, { dirname: dirname } );

    } if ( block && typeof block === 'object' ) {
        return new de.Block.Object( block, { dirname: dirname } );

    } if ( block instanceof de.Block.Lazy ) {
        return block.compile( dirname );

    } if ( no.is_runable( block ) ) {
        return block;

    } else {
        return de.block.value( block );
    }
};

//  ---------------------------------------------------------------------------------------------------------------  //

} )();

module.exports = de;

