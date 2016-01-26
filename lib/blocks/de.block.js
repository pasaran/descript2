var path_ = require( 'path' );

var no = require( 'nommon' );

var de = de || require( '../de.js' );
require( '../de.error.js' );
require( '../de.context.js' );

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
                dep.id = dep.block.get_id();
            }
        }

        if ( dep.select ) {
            dep.select = compile_option( dep.select, compile_object );
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

de.Block.prototype._do_phase_before = function *( params, context, state ) {
    var error;

    var deps = this.options.deps;
    if ( deps ) {
        state = Object.create( state );

        var promise = no.promise();

        var promises = [];
        for ( var i = 0, l = deps.length; i < l; i++ ) {
            var dep = deps[ i ];

            var dep_promise = context._get_promise( dep.id );
            dep_promise.then( function( result ) {
                if ( de.is_error( result ) ) {
                    promise.resolve( de.error( 'DEPS_ERROR' ) );

                } else {
                    if ( dep.select ) {
                        do_select( dep.select, params, context, state, result );
                    }
                }
            } );

            promises.push( dep_promise );
        }

        context._dependent_blocks[ this.get_id() ] = true;
        context._queue_deps_check();

        var that = this;
        no.promise.all( promises )
            .then( function() {
                promise.resolve();
            } );

        error = yield promise;
    }
    if ( de.is_error( error ) ) {
        return yield *this._do_phase_error( params, context, state, error );
    }

    this._start_in_context( context );

    if ( this.options.before ) {
        error = yield *run_callbacks_chain( this.options.before, params, context, state );
    }
    if ( de.is_error( error ) ) {
        return yield *this._do_phase_error( params, context, state, error );
    }

    var progress;

    var key;
    if ( this.options.key ) {
        key = this.options.key( params, context, state );
        if ( key ) {
            progress = yield this.cache.get( key );

            if ( progress !== undefined ) {
                return yield *this._do_phase_after( params, context, state, progress );
            }
        }
    }

    var that = this;

    //  FIXME.
    //  По каким параметрам нужно вычислять ключ?
    //  По новым или по старым?
    params = this._params( params, context, state ) || params;

    //  FIXME: Тут был код для кэширования запроса к action, если есть key.
    //  Т.е. если сразу несколько запросов запросили ресурс, которого нет в кэше,
    //  то нет смысла делать несколько запросов.

    var running = this._action( params, context, state );

    if ( this.options.timeout ) {
        var h_timeout = setTimeout(
            function() {
                running.resolve( de.error( 'ERROR_TIMEOUT' ) );
                running.trigger( 'abort' );
            },
            this.options.timeout
        );

        running.always( function() {
            clearTimeout( h_timeout );
            h_timeout = null;
        } );
    }

    var progress = yield running;

    this._done_in_context( context );

    if ( de.is_error( progress ) ) {
        return yield *this._do_phase_error( params, context, state, progress );
    }

    if ( progress !== undefined && key ) {
        //  FIXME: Вычислять maxage.
        yield this.cache.set( key, progress, this.options.maxage );
    }

    return yield *this._do_phase_after( params, context, state, progress );
};

de.Block.prototype._do_phase_after = function *( params, context, state, progress ) {
    //  console.log( 'phase.after', this.id, this._type, progress );
    var error;

    if ( this.options.after ) {
        error = yield *run_callbacks_chain( this.options.after, params, context, state, progress );
    }
    if ( de.is_error( error ) ) {
        return yield *this._do_phase_error( params, context, state, error );
    }

    var select = this.options.select;
    if ( select ) {
        do_select( select, params, context, state, progress );
    }

    if ( this.options.result ) {
        //  FIXME: Если это jpath, то нужно как-то запихнуть state, context, params в jvars.
        progress = yield this.options.result( progress );
    }

    if ( this.options.template ) {
        //  FIXME: Не терять params, context, state.
        progress = yield this.options.template( progress );
    }

    return progress;
};

de.Block.prototype._do_phase_error = function *( params, context, state, error ) {
    //  FIXME: А что тут еще делать?
    return error;
};

//  ---------------------------------------------------------------------------------------------------------------  //

function do_select( select, params, context, state, progress ) {
    for ( var name in select ) {
        //  FIXME: Тут нужно бы еще и state запихнуть в jvars.
        var value = select[ name ]( progress, context );
        var old_value = state[ name ];

        if ( Array.isArray( value ) && Array.isArray( old_value ) ) {
            state[ name ] = old_value.concat( value );

        } else {
            state[ name ] = value;
        }
    }
}

//  ---------------------------------------------------------------------------------------------------------------  //

function *run_callbacks_chain( callbacks, params, context, state, progress ) {
    if ( Array.isArray( callbacks ) ) {
        for ( var i = 0, l = callbacks.length; i < l; i++ ) {
            var error = yield callbacks[ i ]( params, context, state, progress );

            if ( de.is_error( error ) ) {
                return error;
            }
        }

    } else {
        var error = yield callbacks( params, context, state, progress );

        if ( de.is_error( error ) ) {
            return error;
        }
    }
}

function async_iterate( it ) {
    return new Promise( function( resolve ) {
        ( function run( value ) {
            var ret = it.next( value );

            value = ret.value;
            if ( !ret.done ) {
                if ( no.is_promise( value ) ) {
                    value.then( run );

                } else {
                    setImmediate( run, value );
                }

            } else {
                resolve( value );
            }
        } )();
    } );
}

//  ---------------------------------------------------------------------------------------------------------------  //

de.Block.prototype._run = function( params, context ) {
    context._n_blocks++;

    //  FIXME: Нужно пробрасывать abort из итогового промиса в running из phases.action.
    //
    var promise = context._get_promise( this.get_id() );

    async_iterate( this._do_phase_before( params, context, {} ) )
        .then( function( result ) {
            promise.resolve( result );
        } );

    return promise;
};

//  ---------------------------------------------------------------------------------------------------------------  //

de.Block.prototype._start_in_context = function( context ) {
    context._n_active_blocks++;
};

de.Block.prototype._done_in_context = function( context ) {
    context._n_blocks--;
    context._n_active_blocks--;

    context._queue_deps_check();
};

//  ---------------------------------------------------------------------------------------------------------------  //

de.Block.compile = function( block ) {
    //  FIXME: Убрать потом.
    if ( arguments.length === 2 ) {
        throw Error( 'Something wrong' );
    }

    if ( block instanceof de.Block ) {
        return block;

    } else if ( block instanceof de.Block.Lazy ) {
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

module.exports = de;

