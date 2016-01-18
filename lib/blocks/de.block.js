var path_ = require( 'path' );

var no = require( 'nommon' );

var de = de || require( '../de.js' );
require( '../de.context.js' );
require( '../results/index.js' );

//  ---------------------------------------------------------------------------------------------------------------  //

var s_key = Symbol();

//  ---------------------------------------------------------------------------------------------------------------  //

de.Block = function( block, options ) {
    this._init( block, options );
};

de.Block.prototype._type = 'block';

//  ---------------------------------------------------------------------------------------------------------------  //

var _block_id = 0;

de.Block.generate_id = function() {
    return '_block_id_' + _block_id++;
};

de.Block.prototype.get_id = function() {
    return this.options.id;
};

//  ---------------------------------------------------------------------------------------------------------------  //

de.Block.prototype._init = function( block, options ) {
    this._init_options( options );
    this._init_block( block );

    this._running_cache = {};
};

//  ---------------------------------------------------------------------------------------------------------------  //

de.Block.prototype._init_block = no.op;

//  ---------------------------------------------------------------------------------------------------------------  //

de.Block.DEFAULT_OPTIONS = {
    dirname: path_.dirname( require.main.filename ),
    deps: null,
    valid_params: null,
    params: null,
    guard: null,
    before: null,
    after: null,
    select: null,
    result: null,
    timeout: 0,
    key: null,
    maxage: 0,
    transform: null
};

de.Block.prototype._init_options = function( options ) {
    options = this.options = no.extend( {}, de.Block.DEFAULT_OPTIONS, options );

    options.id = options.id || de.Block.generate_id();

    options.deps = compile_deps( options.deps );

    options.valid_params = compile_valid_params( options.valid_params );

    options.guard = compile_option( options.guard, compile_expr );

    options.select = compile_option( options.select, compile_object );
    options.result = compile_option( options.result, compile_expr );

    options.key = compile_string( options.key );

    options.transform = compile_option( options.transform, compile_transform );
};

//  ---------------------------------------------------------------------------------------------------------------  //

function compile_deps( deps ) {
    if ( deps == null ) {
        return null;
    }

    deps = no.array( deps );

    return deps.map( function( dep ) {
        if ( dep instanceof de.Block || dep instanceof de.Block.Lazy ) {
            return {
                id: dep.get_id()
            };
        }

        if ( typeof dep === 'string' ) {
            return {
                id: dep
            };
        }

        if ( dep.block ) {
            if ( typeof dep.block === 'string' ) {
                dep.id = dep.block;

            } else {
                dep.id = dep.block.get_id()
            }
        }

        if ( dep.select ) {
            //  TODO: Компиляция select'а.
        }

        return dep;
    } );
}

//  ---------------------------------------------------------------------------------------------------------------  //

function compile_valid_params( valid_params ) {
    if ( valid_params == null ) {
        return null;
    }

    if ( !Array.isArray( valid_params ) ) {
        return valid_params;
    }

    var result = {};
    for ( var i = 0, l = valid_params.length; i < l; i++ ) {
        result[ valid_params[ i ] ] = null;
    }
    return result;
}

//  ---------------------------------------------------------------------------------------------------------------  //

function compile_option( option, compiler ) {
    if ( option == null ) {
        return null;
    }

    return ( Array.isArray( option ) ) ? option.map( compiler ) : compiler( option );
}

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

de.Block.prototype.resolve_filename = function( filename ) {
    return path_.resolve( this.options.dirname, filename );
};

//  ---------------------------------------------------------------------------------------------------------------  //

de.Block.prototype._params = function( params, context ) {
    var o_params = this.options.params;

    //  Если в `this.options.params` функция, то берем ее результат
    //  без каких-либо дополнительных проверок и фильтров.
    //
    if ( typeof o_params === 'function' ) {
        return o_params( params, context );
    }

    var o_valid_params = this.options.valid_params;

    var new_params;
    if ( o_valid_params ) {
        new_params = {};

        //  Выбираем из `params` только те ключи, которые присутствуют в `this.options.valid_params`.
        //
        for ( var p_name in o_valid_params ) {
            var p_value = params[ p_name ];
            if ( p_value == null ) {
                //  В `this.options.valid_params` может быть задано дефолтное значение параметра.
                p_value = o_valid_params[ p_name ];
            }

            if ( p_value != null ) {
                new_params[ p_name ] = p_value;
            }
        }

    } else {
        new_params = no.extend( {}, params );
    }

    //  `this.options.params` позволяют перекрыть переданные/дефолтные значения параметров.
    //
    for ( var p_name in o_params ) {
        var p_value = o_params[ p_name ];

        if ( p_value == null ) {
            delete new_params[ p_name ];

        } else {
            new_params[ p_name ] = ( typeof p_value === 'function' ) ? p_value( params, context ) : p_value;
        }
    }

    return new_params;
};

//  ---------------------------------------------------------------------------------------------------------------  //

var phases = {
    before: {
        id: 'before',

        action: function( params, context ) {
            //  console.log( 'phase.before', this.id, this._type );
            if ( this.options.before ) {
                return this.options.before( params, context );
            }
        },

        done: function( params, context, progress ) {
            //  console.log( 'phase.before.done', progress );
            return ( progress === undefined ) ? phases.uncache : phases.after;
        },

        fail: function( params, context, progress ) {
            return phases.error;
        }
    },

    uncache: {
        id: 'uncache',

        action: function( params, context, progress ) {
            //  console.log( 'phase.uncache', this.id, this._type );
            if ( this.options.key ) {
                var key = this.options.key( params, context );
                if ( key ) {
                    context.state[ s_key ] = key;

                    return this.cache.get( key );
                }
            }
        },

        done: function( params, context, progress ) {
            return ( progress === undefined ) ? phases.action : phases.after;
        }
    },

    action: {
        id: 'action',

        action: function( params, context, progress ) {
            //  console.log( 'phase.action', this.id, this._type );
            var that = this;

            params = this._params( params, context ) || params;

            var running;
            var key = context.state[ s_key ];
            if ( key ) {
                running = this._running_cache[ key ];
                if ( running ) {
                    return running;
                }
            }

            running = this._run_action( params, context );

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

        done: function( params, context, progress ) {
            if ( context.state[ s_key ] && progress !== undefined && !no.result.is_error( progress ) ) {
                return phases.cache;
            }

            return phases.after;
        },

        fail: function( params, context, progress ) {
            return phases.error;
        }
    },

    cache: {
        id: 'cache',

        action: function( params, context, progress ) {
            //  console.log( 'phase.cache', this.id, this._type );
            //  FIXME: Вычислять maxage.
            return this.cache.set( context.state[ s_key ], progress, this.options.maxage );
        },

        done: function( params, context, progress ) {
            return phases.after;
        }
    },

    after: {
        id: 'after',

        action: function( params, context, progress ) {
            //  console.log( 'phase.after', this.id, this._type, progress );
            if ( this.options.after ) {
                return this.options.after( params, context, progress );
            }
        },

        done: function( params, context, progress ) {
            return phases.select;
        },

        fail: function( params, context, progress ) {
            return phases.error;
        }
    },

    select: {
        id: 'select',

        action: function( params, context, progress ) {
            //  console.log( 'phase.select', this.id, this._type );
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

        done: function( params, context, progress ) {
            //  console.log( 'phase.error.done', this.id, this._type );
            if ( !no.result.is_error( progress ) || !progress.is_fatal() ) {
                return phases.result;
            }
        }
    },

    result: {
        id: 'result',

        action: function( params, context, progress ) {
            //  console.log( 'phase.result', this.id, this._type );
            if ( this.options.result ) {
                return this.options.result( progress, context, params );
            }
        },

        done: function( params, context, progress ) {
            return phases.tempalte;
        }
    },

    template: {
        id: 'template',

        action: function( params, context, progress ) {
            //  console.log( 'phase.template', this.id, this._type );
            if ( this.options.template ) {
                return this.options.template( progress, context );
            }
        }
    }

};

//  FIXME: Нужно пробрасывать abort из итогового промиса в running из phases.action.
//
de.Block.prototype._run_phases = function( params, context ) {
    var promise = context._get_promise( this.get_id() );

    var that = this;

    var progress;
    run( phases.before );

    return promise;

    function run( phase ) {
        if ( !phase.action ) {
            return do_done( phase.done );
        }

        var running = phase.action.call( that, params, context, progress );

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

        } else if ( de.result.is_error( running ) ) {
            callback = phase.fail;
        }

        do_done( callback || phase.done, running )
    }

    function do_done( callback, new_progress ) {
        if ( new_progress !== undefined ) {
            progress = new_progress;
        }

        var next_phase = callback.call( that, params, context, progress );
        if ( next_phase ) {
            run( next_phase );

        } else {
            promise.resolve( progress );
        }
    }
};

de.Block.prototype._run = function( params, context ) {
    context = context || new de.Context();
    //  console.log( 'run', this.get_id(), this._type );

    context._n_blocks++;

    var block_id = this.get_id();

    context._blocks[ block_id ] = this;

    var n = 0;
    var deps = this.options.deps;
    if ( deps ) {
        for ( var i = 0, l = deps.length; i < l; i++ ) {
            var dep_id = deps[ i ].id;
            if ( context._get_promise( dep_id ).is_pending() ) {
                var ids = context._required_as_dep_by[ dep_id ];
                if ( !ids ) {
                   ids = context._required_as_dep_by[ dep_id ] = {};
                }

                ids[ block_id ] = true;
                n++;
            }
        }
    }
    context._waiting_for_n_deps[ block_id ] = n;

    if ( n === 0 ) {
        this._start_in_context( params, context );

    } else if ( !context._n_active_blocks ) {
        //  FIXME.
        throw Error( 'Deps Error' );
        //  this.abort( 'Deps Error' );
    }

    return context._get_promise( block_id );
};

de.Block.prototype._run_action = function( params, context ) {
    var running = this._action( params, context );

    var that = this;
    running.then( function( result ) {
        that._done_in_context( result, params, context );
    } );

    return running;
};

//  ---------------------------------------------------------------------------------------------------------------  //

de.Block.compile = function( block ) {
    //  FIXME: Убрать потом.
    if ( arguments.length === 2 ) {
        throw Error( 'Something wrong' );
    }

    if ( block instanceof de.Block.Lazy ) {
        return block._compile();

    } else if ( Array.isArray( block ) ) {
        return new de.Block.Array( block );

    } else if ( block && typeof block === 'object' ) {
        return new de.Block.Object( block );

    } else if ( typeof block === 'function' ) {
        return new de.Block.Custom( block );

    /*
    } if ( no.is_runable( block ) ) {
        return block;
    */

    } else {
        return new de.Block.Value( block );
    }
};

//  ---------------------------------------------------------------------------------------------------------------  //

de.Block.prototype._do_action = function( params, context ) {
    //  console.log( '_do_action', this.id, this._type );
};

de.Block.prototype._start_in_context = function( params, context ) {
    console.log( '_start_in_context', this.get_id(), this._type );
    context._active_blocks[ this.get_id() ] = true;
    context._n_active_blocks++;

    this._run_phases( params, context );
    context.print();
};

de.Block.prototype._done_in_context = function( result, params, context ) {
    console.log( '_done_in_context', this.get_id(), this._type );
    var block_id = this.get_id();

    //  console.log( 'DONE', this.get_id() );
    if ( context._active_blocks[ block_id ] ) {
        context._n_active_blocks--;
    }
    context._n_blocks--;
    //  console.log( '_done_in_context', this.id, this._type );

    var ids = context._required_as_dep_by[ block_id ];
    for ( var id in ids ) {
        var count = --context._waiting_for_n_deps[ id ];
        if ( count === 0 ) {
            context._blocks[ id ]._start_in_context( params, context );
        }
    }

    var ids = context._required_as_subblock_by[ block_id ];
    for ( var id in ids ) {
        var count = --context._waiting_for_n_subblocks[ id ];
        if ( count === 0 ) {
            var block = context._blocks[ id ];
            var result = block._build_result_from_context( context );
            block._done_in_context( result, params, context );
        }
    }

    context.print();

    if ( context._n_blocks !== 0 && context._n_active_blocks === 0 ) {
        //  Остались незавершенные блоки, но активных нет и в очередь на запуск ничего нет.
        //  this.abort( 'Error in deps' );
        throw Error( 'Error in deps' );
    }
};

//  ---------------------------------------------------------------------------------------------------------------  //

de.Block.prototype._build_result_from_context = function( context ) {
    var promise = context._get_promise( this.get_id() );

    return promise.get_value();
};

//  ---------------------------------------------------------------------------------------------------------------  //

module.exports = de;

