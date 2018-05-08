# Changelog

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

