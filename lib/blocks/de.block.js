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

    options.result = compile_option( options.result, compile_result );

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

    //  FIXME: Убрать map.
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

function compile_result( expr ) {
    if ( expr == null ) {
        return expr;
    }

    if ( typeof expr === 'function' ) {
        return expr;
    }

    if ( Array.isArray( expr ) ) {
        var l = expr.length;
        var compiled = [];
        for ( var i = 0; i < l; i++ ) {
            compiled.push( compile_result( expr[ i ] ) );
        }

        return function( params, context, state, result ) {
            var r = [];
            for ( var i = 0; i < l; i++ ) {
                r.push( compiled[ i ]( params, context, state, result ) );
            }
            return r;
        };
    }

    if ( typeof expr === 'object' ) {
        var compiled = {};
        for ( var name in expr ) {
            compiled[ name ] = compile_result( expr[ name ] );
        }

        return function( params, context, state, result ) {
            var r = {};
            for ( var name in compiled ) {
                r[ name ] = compiled[ name ]( params, context, state, result );
            }
            return r;
        };
    }

    return function( params, context, state, result ) {
        return expr;
    };
}

function compile_select( object ) {
    if ( object == null ) {
        return null;
    }

    var compiled = {};
    for ( var name in object ) {
        compiled[ name ] = de.jexpr( object[ name ] );
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

de.Block.prototype._params = function( params, context, state ) {
    var o_params = this.options.params;

    //  Если в `this.options.params` функция, то берем ее результат
    //  без каких-либо дополнительных проверок и фильтров.
    //
    if ( typeof o_params === 'function' ) {
        return o_params( params, context, state );
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

        //  FIXME: Не нужно, кажется, ничего удалять. Плохая идея.
        if ( p_value == null ) {
            delete new_params[ p_name ];

        } else {
            new_params[ p_name ] = ( typeof p_value === 'function' ) ? p_value( params, context, state ) : p_value;
        }
    }

    return new_params;
};

//  ---------------------------------------------------------------------------------------------------------------  //

de.Block.prototype._do_phase_before = function *( params, context, state ) {
    var error;

    var deps = this.options.deps;
    if ( deps ) {
        var promises = [];
        for ( var i = 0, l = deps.length; i < l; i++ ) {
            promises.push( context._get_promise( deps[ i ].id ) );
        }

        context._dependent_blocks[ this.get_id() ] = true;
        context._queue_deps_check();

        error = yield no.promise.maybe( promises )
            .then( function( result ) {
                if ( de.is_error( result ) ) {
                    return de.error( 'DEPS_ERROR' );

                } else {
                    for ( var i = 0, l = deps.length; i < l; i++ ) {
                        var dep = deps[ i ];
                        var dep_state = context._states[ dep.id ];
                        merge_states( state, dep_state );

                        if ( dep.select ) {
                            do_select( dep.select, params, context, state, result[ i ] );
                        }
                    }

                }
            } );
    }
    if ( de.is_error( error ) ) {
        return yield *this._do_phase_error( params, context, state, error );
    }

    var options_guard = this.options.guard;
    if ( options_guard ) {
        if ( Array.isArray( options_guard ) ) {
            for ( var i = 0, l = options_guard.length; i < l; i++ ) {
                if ( !options_guard[ i ]( params, context, state ) ) {
                    return yield *this._do_phase_error( params, context, state, de.error( 'BLOCK_GUARDED' ) );
                }
            }

        } else {
            if ( !options_guard( params, context, state ) ) {
                return yield *this._do_phase_error( params, context, state, de.error( 'BLOCK_GUARDED' ) );
            }
        }
    }

    //  FIXME: Кажется, что сейчас блок может вызвать start_in_context,
    //  но не успеть вызвать done_in_context, если произошла какая-то ошибка.
    //  Кажется, это не очень хорошо. Нужны тесты с несколькими блоками.
    //
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
            progress = yield context.cacher.get( key );

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

    if ( this.options.timeout > 0 ) {
        var h_timeout = setTimeout(
            function() {
                var error = de.error( 'BLOCK_TIMED_OUT' );
                running.resolve( error );
                running.trigger( 'abort', error );

                h_timeout = null;
            },
            this.options.timeout
        );

        running.then( function() {
            if ( h_timeout ) {
                clearTimeout( h_timeout );
                h_timeout = null;
            }
        } );
    }

    var progress = yield running;

    this._done_in_context( context );

    if ( de.is_error( progress ) ) {
        return yield *this._do_phase_error( params, context, state, progress );
    }

    if ( progress !== undefined && key ) {
        //  FIXME: Вычислять maxage.
        yield context.cacher.set( key, progress, this.options.maxage );
    }

    return yield *this._do_phase_after( params, context, state, progress );
};

de.Block.prototype._do_phase_after = function *( params, context, state, progress ) {
    //  console.log( 'phase.after', this.id, this._type, progress );
    var error;

    if ( this.options.select ) {
        do_select( this.options.select, params, context, state, progress );
    }

    if ( this.options.after ) {
        error = yield *run_callbacks_chain( this.options.after, params, context, state, progress );
    }
    if ( de.is_error( error ) ) {
        return yield *this._do_phase_error( params, context, state, error );
    }

    var options_result = this.options.result;
    if ( options_result ) {
        if ( Array.isArray( options_result ) ) {
            for ( var i = 0, l = options_result.length; i < l; i++ ) {
                progress = options_result[ i ]( params, context, state, progress );
                if ( progress === undefined ) {
                    break;
                }
            }

        } else {
            progress = this.options.result( params, context, state, progress );
        }
    }
    //  FIXME: Что если тут progress стал undefined?

    if ( this.options.template ) {
        //  FIXME: Не терять params, context, state.
        progress = yield this.options.template( progress );
    }

    return progress;
};

de.Block.prototype._do_phase_error = function *( params, context, state, error ) {
    //  FIXME: А что тут еще делать?
    //  А не вызвыать ли тут done_in_context?
    return error;
};

//  ---------------------------------------------------------------------------------------------------------------  //

function do_select( select, params, context, state, result ) {
    for ( var name in select ) {
        var value = select[ name ]( params, context, state, result );
        if ( value === undefined ) {
            continue;
        }

        var old_value = state[ name ];
        if ( Array.isArray( old_value ) ) {
            if ( old_value !== value ) {
                state[ name ] = old_value.concat( value );
            }

        } else {
            state[ name ] = value;
        }
    }
}

function merge_states( left, right ) {
    for ( var name in right ) {
        var r_value = right[ name ];
        if ( r_value === undefined ) {
            continue;
        }

        var l_value = left[ name ];
        if ( Array.isArray( l_value ) ) {
            if ( l_value !== r_value ) {
                left[ name ] = l_value.concat( r_value );
            }

        } else {
            left[ name ] = r_value;
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

function async_iterate( it, context ) {
    return new Promise( function( resolve ) {
        ( function run( value ) {
            if ( context._done ) {
                return resolve( context._done );
            }

            //  FIXME: Тут нужна настройка в конфиге.
            //  В dev-окружении не нужно делать try/catch.
            //  А в prod'е, конечно, лучше бы не падать на любой чих.
            //
            //  Но если убрать этот try/catch, то тестовая среда ловит эксепшены
            //  и прячет их.
            //
            try {
                var ret = it.next( value );
            } catch ( e ) {
                return resolve( de.error( e ) );
            }

            if ( context._done ) {
                return resolve( context._done );
            }

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

    var id = this.get_id();
    //  FIXME: Нужно пробрасывать abort из итогового промиса в running из phases.action.
    var promise = context._get_promise( id );
    var state = context._states[ id ] = {};

    async_iterate( this._do_phase_before( params, context, state ), context )
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

