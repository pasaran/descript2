var path_ = require( 'path' );

var no = require( 'nommon' );

var de = require( './de.js' );
require( './de.error.js' );

const to_array = require( './to_array' );

//  ---------------------------------------------------------------------------------------------------------------  //

var _block_id = 0;

function generate_id() {
    return 'block-' + _block_id++;
}

const symbol_parent_state = Symbol();

//  ---------------------------------------------------------------------------------------------------------------  //

var _dir_options_cache = {};

function load_dir_options( dirname ) {
    //  FIXME: Загружать все dir_options, начиная с текущей папки
    //  и вверх до упора (или до config.root_dir).

    var options = _dir_options_cache[ dirname ];

    if ( options === undefined ) {
        try {
            options = require( path_.join( dirname, '.descript.js' ) );

        } catch ( e ) {
            options = null;
        }

        _dir_options_cache[ dirname ] = options;
    }

    return options;
}

//  ---------------------------------------------------------------------------------------------------------------  //

de.Block = function( block, options ) {
    this._init( block, options );
};

//  ---------------------------------------------------------------------------------------------------------------  //

de.Block.prototype._init = function( block, options ) {
    this._init_options( options );
    this._init_block( block );
};

//  ---------------------------------------------------------------------------------------------------------------  //

de.Block.prototype._init_options = function( options ) {
    this.options = {
        //  FIXME: А это тут зачем?
        params: []
    };

    if ( options ) {
        var dirname;
        for ( var i = options.length - 1; i >= 0; i-- ) {
            dirname = options[ i ].dirname;
            if ( dirname ) {
                break;
            }
        }

        if ( dirname ) {
            this.dirname = dirname;

            var dir_options = load_dir_options( dirname );

            if ( dir_options ) {
                options.unshift( dir_options );
            }
        }

        for ( var i = 0, l = options.length; i < l; i++ ) {
            this.options = extend_options( this.options, options[ i ] );
        }

        this._compile_deps();
        this.options.guard = compile_option( this.options.guard, compile_expr );
        this.options.result = compile_option( this.options.result, compile_result );
        this.options.key = compile_string( this.options.key );
        this.options.transform = compile_option( this.options.transform, compile_transform );
    }

    this.options.id = this.options.id || generate_id();
};

//  ---------------------------------------------------------------------------------------------------------------  //

function extend_options( what, by ) {
    var options = {};

    options.id = by.id || what.id;

    options.name = by.name || what.name;

    options.deps = extend_option( what.deps, by.deps );
    options.priority = by.priority || 0;

    if ( by.params || by.valid_params ) {
        options.params = [ {
            valid_params: by.valid_params || null,
            params: by.params || null
        } ]
            .concat( what.params );

    } else {
        options.params = [].concat( what.params );
    }

    options.guard = extend_option( what.guard, by.guard );

    options.isolate_state = what.isolate_state || by.isolate_state;

    options.before = extend_option( by.before, what.before );
    options.after = extend_option( what.after, by.after );
    options.error = extend_option( what.error, by.error );

    options.select = extend_select( what.select, by.select );
    options.result = extend_option( what.result, by.result );

    options.timeout = by.timeout || what.timeout;

    options.key = by.key || what.key;
    options.maxage = by.maxage || what.maxage;

    options.transform = extend_option( what.transform, by.transform );

    options.template = by.template;

    //  FIXME: Если было true, то его уже ничем не перебить.
    //  Может, это и хорошо.
    //
    options.required = by.required || what.required;

    return options;
}

function extend_option( what, by ) {
    if ( !what || !by ) {
        return what || by || null;
    }

    return [].concat( what, by );
}

function extend_select( what, by ) {
    if ( !what || !by ) {
        return what || by || null;
    }

    return no.extend( {}, what, by );
}

//  ---------------------------------------------------------------------------------------------------------------  //

de.Block.prototype._compile_deps = function() {
    var deps = this.options.deps;
    if ( deps == null ) {
        return;
    }

    deps = to_array( deps );

    this.options.deps = [];
    this.options.pre_conditions = null;

    for ( var i = 0, l = deps.length; i < l; i++ ) {
        var dep = deps[ i ];

        if ( dep instanceof de.Block || dep instanceof de.Lazy ) {
            this.options.deps.push( dep.get_id() );

        } else if ( typeof dep === 'string' ) {
            this.options.deps.push( dep );

        } else if ( typeof dep === 'function' ) {
            if ( !this.options.pre_conditions ) {
                this.options.pre_conditions = [];
            }

            this.options.pre_conditions.push( dep );
        }
    }
};

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

/*
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
*/

function compile_transform( transform ) {
    if ( transform == null ) {
        return null;
    }

    //  FIXME.
    return function() {
        return '<h1>Hello</h1>';
    };
}

//  ---------------------------------------------------------------------------------------------------------------  //

de.Block.prototype.get_id = function() {
    return this.options.id;
};

//  ---------------------------------------------------------------------------------------------------------------  //

de.Block.prototype._params = function( params, context, state ) {
    var new_params = {};
    for ( var p_name in params ) {
        var p_value = params[ p_name ];
        if ( p_value != null ) {
            new_params[ p_name ] = p_value;
        }
    }

    var o_items = this.options.params;
    for ( var i = 0, l = o_items.length; i < l; i++ ) {
        var o_item = o_items[ i ];

        var o_params = o_item.params;
        if ( o_params ) {
            if ( typeof o_params === 'function' ) {
                no.extend( new_params, o_params( new_params, context, state ) );

            } else {
                //  FIXME: Кажется, неплохо бы сделать копию new_params
                //  и в вызов функции передавать старые new_params.
                //  Чтобы все вызовы функций были с одним набором параметров.
                for ( var p_name in o_params ) {
                    var value = o_params[ p_name ];
                    if ( typeof value === 'function' ) {
                        var p_value = value( new_params, context, state );
                        if ( p_value != null ) {
                            new_params[ p_name ] = p_value;
                        }

                    } else {
                        if ( value != null ) {
                            new_params[ p_name ] = value;
                        }
                    }
                }
            }
        }

        var o_valid_params = o_item.valid_params;
        if ( o_valid_params ) {
            var filtered_params = {};

            //  Выбираем из `new_params` только те ключи, которые присутствуют в `o_valid_params`.
            //
            for ( var p_name in o_valid_params ) {
                var p_value = new_params[ p_name ];
                if ( p_value == null ) {
                    //  В `this.options.valid_params` может быть задано дефолтное значение параметра.
                    p_value = o_valid_params[ p_name ];
                }

                if ( p_value != null ) {
                    filtered_params[ p_name ] = p_value;
                }
            }

            new_params = filtered_params;
        }
    }

    return new_params;
};

//  ---------------------------------------------------------------------------------------------------------------  //

de.Block.prototype._do_phase_before = function *( params, context, state ) {
    var error;

    const options = this.options;

    if ( options.isolate_state ) {
        //  Изолируем стейт для сложносоставных блоков.
        //  Клонируем родительский стейт и сохраняем ссылку на родительский стейт.
        var new_state = no.extend( {}, state );
        new_state[ symbol_parent_state ] = state;

        //  Дальше везде используем этот новый стейт.
        state = new_state;
    }

    var deps = options.deps;
    var pre_conditions = options.pre_conditions;
    //  FIXME: По хорошему, тут бы проверить и длину этих массивов.
    if ( deps || pre_conditions ) {
        var promises = [];
        for ( var i = 0, l = deps.length; i < l; i++ ) {
            promises.push( context._get_promise( deps[ i ] ) );
        }

        var id = this.get_id();

        if ( pre_conditions ) {
            var conditions_promise = no.promise();

            context._pre_conditions[ id ] = {
                conditions: pre_conditions,
                //  FIXME: А почему тут одинаковый промис для разных id?
                promise: conditions_promise
            };
            promises.push( conditions_promise );
        }

        //  FIXME: А кто удаляет ключи из этого объекта, когда блок завершен?
        context._dependent_blocks[ this.get_id() ] = true;
        context._queue_deps_check();

        error = yield no.promise.maybe( promises )
            .then( function( result ) {
                if ( de.is_error( result ) ) {
                    return de.error( {
                        id: de.Error.ID.DEPS_ERROR,
                        parent: result,
                    } );
                }
            } );
    }
    if ( de.is_error( error ) ) {
        return yield *this._do_phase_error( params, context, state, error );
    }

    const guard_result = this._do_guard( params, context, state );
    if ( de.is_error( guard_result ) ) {
        return yield *this._do_phase_error( params, context, state, guard_result );
    }

    if ( options.before ) {
        error = yield *run_callbacks_chain( options.before, params, context, state );
    }
    if ( de.is_error( error ) ) {
        return yield *this._do_phase_error( params, context, state, error );
    }

    var progress;

    params = this._params( params, context, state ) || params;

    var key;
    //  FIXME: Добавить options.cache, чтобы иметь возможность
    //  кэшировать разные блоки по-разному.
    //  Например, один в памяти, другой в memcached.
    if ( context.cache && options.key ) {
        key = options.key( params, context, state );
        if ( key ) {
            progress = yield context.cache.get( key );

            // FIXME: если кеш недоступен, нада идти в upstream
            if ( progress !== undefined && !de.is_error( progress ) ) {
                return yield *this._do_phase_after( params, context, state, progress );
            }
        }
    }

    //  FIXME: Кажется, что сейчас блок может вызвать start_in_context,
    //  но не успеть вызвать done_in_context, если произошла какая-то ошибка.
    //  Кажется, это не очень хорошо. Нужны тесты с несколькими блоками.
    //
    //  FIXME: Версия 2. Перенес этот вызов пониже, теперь все вызывается.
    //  Теперь другая проблема. Таймаут не учитывает ничего, кроме собственно экшена.
    //  А должен бы учитывать все вообще.
    //  Правильно его перенести вообще в самое начало _run.
    //  Но это уже другая история.
    //
    this._start_in_context( context );

    //  FIXME: Тут был код для кэширования запроса к action, если есть key.
    //  Т.е. если сразу несколько запросов запросили ресурс, которого нет в кэше,
    //  то нет смысла делать несколько запросов.

    var running = this._action( params, context, state );
    context
        ._get_promise( this.get_id() )
        .on( 'abort', function( e, reason ) {
            running.abort( reason );
        } );

    if ( options.timeout > 0 ) {
        var h_timeout = setTimeout(
            function() {
                var error = de.error( de.Error.ID.BLOCK_TIMED_OUT );
                running.resolve( error );
                running.abort( error );

                h_timeout = null;
            },
            options.timeout
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
        //  FIXME: Если ключ вычисляется по оригинальным параметрам,
        //  не нужно ли и maxage вычислять по ним же?

        //  FIXME: не надо ждать set, это может быть операция в фоне, без влияния на выдачу
        yield context.cache.set( key, progress, options.maxage );
    }

    return yield *this._do_phase_after( params, context, state, progress );
};

de.Block.prototype._do_phase_after = function *( params, context, state, progress ) {
    var error;

    //  FIXME: А не нужно ли сперва сделать after?
    //  Там ведь может быть ошибка, смысл делать select в этом случае?
    try {
        this._do_select( params, context, state, progress );

    } catch ( e ) {
        return yield *this._do_phase_error( params, context, state, de.error( e ) );
    }

    if ( this.options.after ) {
        error = yield *run_callbacks_chain( this.options.after, params, context, state, progress );
    }
    if ( de.is_error( error ) ) {
        return yield *this._do_phase_error( params, context, state, error );
    }

    try {
        progress = this._do_result( params, context, state, progress );

    } catch ( e ) {
        return yield *this._do_phase_error( params, context, state, de.error( e ) );
    }
    //  FIXME: Что если тут progress стал undefined?
    //  FIXME: Или ошибка возникла? Не нужно ли тут try/catch сделать?

    if ( this.options.template ) {
        //  FIXME: Не терять params, context, state.
        progress = yield this.options.template( progress );
    }

    return progress;
};

de.Block.prototype._do_phase_error = function *( params, context, state, error ) {
    if ( this.options.error ) {
        //  Если options.error возвращает что-то, отличное от undefined, то:
        //
        //   1. Если это error, то это будет новая ошибка блока.
        //   2. Если нет, то будем считать, что это не ошибка вовсе,
        //      а результат выполнения блока.
        //
        //  Если у нас есть цепочка из options.error, то первая же не ошибка
        //  прерывает ее. А если вернули ошибку, то в следующий вызов передаем уже
        //  новую ошибку.
        //

        var result;
        if ( Array.isArray( this.options.error ) ) {
            for ( var i = 0; i < this.options.error.length; i++ ) {
                result = this.options.error[ i ]( params, context, state, error );
                if ( result !== undefined ) {
                    if ( de.is_error( result ) ) {
                        error = result;

                    } else {
                        return result;
                    }
                }
            }

        } else {
            result = this.options.error( params, context, state, error );
            if ( result !== undefined ) {
                error = result;
            }
        }
    }

    return error;
};

//  ---------------------------------------------------------------------------------------------------------------  //

de.Block.prototype._do_guard = function( params, context, state ) {
    const options_guard = this.options.guard;

    if ( options_guard ) {
        if ( Array.isArray( options_guard ) ) {
            for ( var i = 0, l = options_guard.length; i < l; i++ ) {
                let guard_result;
                try {
                    guard_result = options_guard[ i ]( params, context, state );

                } catch ( e ) {
                    return de.error( e );
                }
                if ( !guard_result ) {
                    return de.error( de.Error.ID.BLOCK_GUARDED );
                }
            }

        } else {
            let guard_result;
            try {
                guard_result = options_guard( params, context, state );

            } catch ( e ) {
                return de.error( e );
            }
            if ( !guard_result ) {
                return de.error( de.Error.ID.BLOCK_GUARDED );
            }
        }
    }
};

//  ---------------------------------------------------------------------------------------------------------------  //

de.Block.prototype._do_select = function( params, context, state, result ) {
    const select = this.options.select;
    if ( !select ) {
        return;
    }

    //  Если в блоке был склонированный стейт, то вычисляем значения select'а относительно старого стейта,
    //  а результат сохраняем в родительском.
    const select_to_state = ( this.options.isolate_state ) ? state[ symbol_parent_state ] : state;
    for ( var name in select ) {
        var value = select[ name ]( params, context, state, result );
        if ( value === undefined ) {
            continue;
        }

        var old_value = state[ name ];
        if ( Array.isArray( old_value ) ) {
            select_to_state[ name ] = old_value.concat( value );

        } else {
            select_to_state[ name ] = value;
        }
    }
};

//  ---------------------------------------------------------------------------------------------------------------  //

de.Block.prototype._do_result = function( params, context, state, result ) {
    const options_result = this.options.result;
    if ( options_result ) {
        if ( Array.isArray( options_result ) ) {
            for ( var i = 0, l = options_result.length; i < l; i++ ) {
                result = options_result[ i ]( params, context, state, result );
                if ( result === undefined ) {
                    break;
                }
            }

        } else {
            result = this.options.result( params, context, state, result );
        }
    }

    return result;
};

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
    var promise = no.promise();

    ( function run( value ) {
        //  FIXME: А не нужно ли где-нибудь тут проверять, что вернулось de.Error?

        if ( context._done ) {
            return promise.resolve( context._done );
        }

        //  FIXME: Тут нужна настройка в конфиге.
        //  В dev-окружении не нужно делать try/catch.
        //  А в prod'е, конечно, лучше бы не падать на любой чих.
        //
        //  Но если убрать этот try/catch, то тестовая среда ловит эксепшены
        //  и прячет их.
        //
        var ret;
        try {
            ret = it.next( value );
        } catch ( e ) {
            //  console.log( 'CATCH', e, e.stack );
            return promise.resolve( de.error( e ) );
        }

        if ( context._done ) {
            return promise.resolve( context._done );
        }

        value = ret.value;
        if ( !ret.done ) {
            if ( no.is_promise( value ) ) {
                value.then( run );

            } else {
                setImmediate( run, value );
            }

        } else {
            promise.resolve( value );
        }
    } )();

    return promise;
}

//  ---------------------------------------------------------------------------------------------------------------  //

de.Block.prototype._run = function( params, context, state ) {
    //  FIXME: Нужно где-то проверить, что блок с этим id уже запущен в этом контексте.
    //  И что тогда делать? Если зарезолвить финальный промис ошибкой, то несколько блоков зааффектятся.
    //  Можно ничего не делать? Вернуть promise и все.

    var id = this.get_id();

    //  FIXME: Нужно пробрасывать abort из итогового промиса в running из phases.action.
    var promise = context._get_promise( id );

    if ( context._started_blocks[ id ] ) {
        //  Блок с таким id уже запушен.
        return promise;
    }
    context._started_blocks[ id ] = true;

    context._n_blocks++;

    state = state || {};

    async_iterate( this._do_phase_before( params, context, state ), context )
        .then( function( result ) {
            promise.resolve( result );

            check_pre_conditions( params, context, state );
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

function check_pre_conditions( params, context, state ) {
    for ( var block_id in context._pre_conditions ) {
        var info = context._pre_conditions[ block_id ];
        var passed = true;
        for ( var i = 0, l = info.conditions.length; i < l; i++ ) {
            if ( !info.conditions[ i ]( params, context, state ) ) {
                passed = false;
                break;
            }
        }
        if ( passed ) {
            var promise = info.promise;
            delete context._pre_conditions[ block_id ];
            promise.resolve();
        }
    }
}

//  ---------------------------------------------------------------------------------------------------------------  //

module.exports = de;

