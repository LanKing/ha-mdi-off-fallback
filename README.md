[![Home Assistant](https://img.shields.io/badge/Home%20Assistant-Frontend-41BDF5?logo=homeassistant&logoColor=white)](https://www.home-assistant.io/)
[![HACS](https://img.shields.io/badge/HACS-Frontend-41BDF5)](https://hacs.xyz/)
[![Latest release](https://img.shields.io/github/v/release/LanKing/ha-mdi-off-fallback?label=release)](https://github.com/LanKing/ha-mdi-off-fallback/releases)
[![Downloads](https://img.shields.io/github/downloads/LanKing/ha-mdi-off-fallback/total?label=downloads)](https://github.com/LanKing/ha-mdi-off-fallback/releases)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

> Home Assistant позволяет использовать произвольные MDI-иконки, но не у каждой существует вариант `-off`. В итоге устройство уже выключено, а иконка визуально всё ещё выглядит активной. Этот плагин автоматически добавляет перечёркивание в стиле MDI для неактивных сущностей, когда штатной выключенной иконки нет.

# 🚫 MDI Off Fallback для Home Assistant

![Plugin function visualized](docs/demo.jpg)

Реализован так, чтобы добавленное перечёркивание выглядело как штатная часть Home Assistant:
* работает со стандартными Tile-карточками без их замены и сохраняет штатный внешний вид, поведение, цвета, размеры и взаимодействия;
* изменяет только уже отрисованные иконки и только при отсутствии штатного `-off` варианта;
* добавляет бледный круглый фон в стиле Home Assistant, если штатного фона нет, чтобы перечёркивание сохраняло корректный внешний вид;
* не меняет состояния сущностей и не вмешивается в работу устройств.

**Примечание:** внутренние компоненты интерфейса Home Assistant не являются стабильным публичным API. При значительных изменениях интерфейса может потребоваться обновление плагина.

<a id="default-states"></a>
## ⚙️ Неактивные состояния по умолчанию

По умолчанию включены такие правила:

| Домен | Неактивное состояние |
|---|---|
| `light` | `off` |
| `switch` | `off` |
| `fan` | `off` |
| `climate` | `off` |
| `media_player` | `off` |
| `cover` | `closed` |
| `humidifier` | `off` |
| `water_heater` | `off` |
| `siren` | `off` |

Другие домены и состояния можно добавить через необязательный глобальный файл конфигурации.

<a id="configuration"></a>
## 🔧 Конфигурация

Конфигурация необязательна.

Если файла конфигурации нет, используются встроенные правила выше.

Чтобы изменить правила сразу для всей установки Home Assistant, создайте файл:

```text
/config/www/ha-mdi-off-fallback.config.json
```

Пример:

```json
{
  "states": {
    "light": ["off"],
    "switch": ["off"],
    "fan": ["off"],
    "climate": ["off"],
    "media_player": ["off"],
    "cover": ["closed"],
    "humidifier": ["off"],
    "water_heater": ["off"],
    "siren": ["off"],
    "remote": ["off"]
  },
  "faint_background_when_missing": true,
  "faint_background_opacity": 0.2,
  "debug": false
}
```

В интерфейсе этот файл доступен по адресу:

```text
/local/ha-mdi-off-fallback.config.json
```

Поскольку конфигурация хранится на сервере Home Assistant, одни и те же правила используются во всех браузерах и на всех устройствах.

Файл конфигурации хранится отдельно от файлов плагина, которыми управляет HACS, поэтому обновление плагина его не перезаписывает.

Только домены, перечисленные в `states`, переопределяют встроенные значения. Чтобы отключить правило по умолчанию для конкретного домена, укажите пустой массив.

Например:

```json
{
  "states": {
    "fan": [],
    "media_player": ["off", "idle"]
  }
}
```

<a id="reload-config"></a>
### Перезагрузка конфигурации

После изменения JSON-файла конфигурацию можно перечитать без перезагрузки страницы:

```js
haMdiOffFallback.reloadConfig()
```

Посмотреть активную конфигурацию:

```js
haMdiOffFallback.getConfig()
```

<a id="background"></a>
### Фон неактивной иконки

Если Home Assistant уже рисует свой штатный фон неактивной иконки, плагин его не трогает.

Если такого фона нет, плагин может добавить бледный круг, совпадающий с оформлением стандартной неактивной Tile-иконки Home Assistant.

Отключить:

```json
{
  "faint_background_when_missing": false
}
```

Изменить прозрачность:

```json
{
  "faint_background_opacity": 0.2
}
```

<a id="installation"></a>
## 📦 Установка

### HACS

Пока плагин не добавлен в стандартный каталог HACS:

1. Откройте HACS.
2. Откройте **Custom repositories**.
3. Добавьте:

```text
https://github.com/LanKing/ha-mdi-off-fallback
```

4. Выберите тип репозитория **Dashboard**.
5. Установите **HA MDI Off Fallback**.
6. Перезагрузите интерфейс Home Assistant.

Дополнительная настройка карточек не требуется.

<a id="manual-installation"></a>
### Ручная установка

Скопируйте:

```text
dist/ha-mdi-off-fallback.js
```

в:

```text
/config/www/ha-mdi-off-fallback.js
```

Затем добавьте ресурс панели управления:

```text
/local/ha-mdi-off-fallback.js
```

Тип ресурса:

```text
JavaScript Module
```

После этого перезагрузите интерфейс Home Assistant.

<a id="debugging"></a>
## 🐛 Отладка

Включить отладочный вывод:

```js
haMdiOffFallback.configure({
  debug: true
})
```

Принудительно заново просканировать текущую панель:

```js
haMdiOffFallback.rescan()
```

Посмотреть версию плагина:

```js
haMdiOffFallback.version
```



## 📄 Лицензия

MIT — вклад в проект приветствуется.
