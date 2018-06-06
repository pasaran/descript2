# Changelog

## 0.0.33

  * [logger] **breaking change**. Многое поменялось в логировании:

      * `de.Log` -> `de.Logger`.

      * Вместо

            const context = new de.Context( {
                log: new de.Log( { debug: true } ),
            } );

        нужно писать:

            const context = new de.Context( {
                logger: new de.Logger( { debug: true } ),
            } );

      * Или же можно передать произвольный объект с одним методом `log( event, context )`.

      * Вместо `context.error`, `context.info`, `context.warn`, `context.debug` появился один метод `context.log`,
      который просто вызывает `context.logger.log( event, this )`.

      * В метод log приходит некий `event`, описывающий, что случилось и `context`.

        У event примерно такая структура:

            {
                type: de.Logger.EVENT.REQUEST_START | de.Logger.EVENT.REQUEST_SUCCESS | de.Logger.EVENT.REQUEST_ERROR,

                request_options: {
                    //  Это то, что целиком уходит в нодовский https?.request
                    //  В частности, тут есть headers, host/hostname, path/pathname, port, method, ...
                    options: { ... },

                    //  Если это POST/PUT/PATCH.
                    body: Buffer | string,

                    //  Помимо этого есть еще разные поля, типа:

                    //  Удобно для логирования.
                    url: string,

                    retries: number,
                    max_retries: number,
                    redirects: number,
                    max_redirects: number,
                    ...
                },

                //  Если type === de.Logger.EVENT.REQUEST_ERROR
                error: de.Error,

                //  Если type === de.Logger.EVENT.REQUEST_SUCCESS
                result: Object,

                timestamps: {
                    //  Начало и окончание запроса, эти поля по идее есть всегда.
                    start: number,
                    end: number,

                    //  Получение socket'а
                    socket: number,

                    //  Установление tcp-соединения
                    tcp_connection: number,

                    //  Получение первых данных в ответе.
                    first_byte: number,
                },
            }

## 0.0.32

  * Если в одном контексте запускается несколько блоков с одинаковым id,
    то в реальности запускается только первый из них. Остальные берут результат выполнения первого блока.
    При этом для второго и последующих блоков с этим id не выполняются никакие колбеки (before, after, ...).

## 0.0.31

  * Вычисляем новые `params` перед вычислением ключа для кэширования.

## 0.0.30

  * К ошибкам `REQUIRED_BLOCK_FAILED` подшиваем родительскую ошибку и path до исходной ошибки.

  * Разделяем ошибку `DEPS_ERROR` на собственно `DEPS_ERROR` (ошибка в блоке, от которого зависит блок)
    и `DEPS_NOT_RESOLVED` (все активные блоки заввершены, а зависимости не срослись).

    Кроме того, в `DEPS_ERROR` в поле `parent` будет ошибка, из-за которой сфейлился блок из зависимостей.

## 0.0.29

  * `try/catch` для вызова `options.select`.

## 0.0.28

  * [block.func] Всегда возвращаем промис, если action вернул значение, оборачиваем его в `no.promise.resolved`.

## 0.0.27

  * `try/catch` для вызова `https?.request`. Ловим ошибки, например, для неправильного протокола.

## 0.0.26

  * Коды ошибок переехали в enum `de.Error.ID`. Например, `de.Error.ID.TCP_CONNECTION_TIMEOUT`.

  * [block.http] **breaking change**. Поменялась сигнатура `is_retry_allowed`. Было:

        is_retry_allowed( statuc_code, headers )

    стало (дефолтный вариант):

        is_retry_allowed: function( error ) {
            return (
                error.id === 'TCP_CONNECTION_TIMEOUT' ||
                error.id === 'REQUEST_TIMEOUT' ||
                error.status_code === 408 ||
                error.status_code === 429 ||
                error.status_code === 500 ||
                ( error.status_code >= 502 && error.status_code <= 504 )
            );
        }

  * [block.http] **breaking change**. Поменялась сигнатура `is_error` (аналогично с `is_retry_allowed`). Было:

        is_error( statuc_code, headers )

    стало (дефолтный вариант):

        is_error: function( error ) {
            return (
                error.id === de.Error.ID.TCP_CONNECTION_TIMEOUT ||
                error.id === de.Error.ID.REQUEST_TIMEOUT ||
                error.status_code >= 400
            );
        }

  * [block.http] Дефолтные параметры для `de.request` доступны через `de.request.DEFAULT_OPTIONS`.
    В частности, оттуда можно достать `de.request.DEFAULT_OPTIONS.is_retry_allowed` и `de.request.DEFAULT_OPTIONS.is_error`.

  * Поправлен баг в `options.select`. Если блок дважды (и больше) расширялся с select'ом, то select неправильно работал.

