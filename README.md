<a href="https://www.home-assistant.io/"><img src="https://img.shields.io/badge/Home%20Assistant-Frontend-41BDF5?logo=homeassistant&logoColor=white" alt="Home Assistant"></a>
<a href="https://hacs.xyz/"><img src="https://img.shields.io/badge/HACS-Frontend-41BDF5" alt="HACS"></a>
<a href="https://github.com/LanKing/ha-mdi-off-fallback/releases"><img src="https://img.shields.io/github/v/release/LanKing/ha-mdi-off-fallback?label=release&cacheSeconds=300" alt="Latest release"></a>
<a href="https://github.com/LanKing/ha-mdi-off-fallback/releases"><img src="https://img.shields.io/github/downloads/LanKing/ha-mdi-off-fallback/total?label=downloads&cacheSeconds=5" alt="Downloads"></a>
<a href="https://github.com/LanKing/ha-mdi-off-fallback/blob/main/LICENSE"><img src="https://img.shields.io/github/license/LanKing/ha-mdi-off-fallback?cacheSeconds=300" alt="License"></a>

> Home Assistant позволяет использовать произвольные MDI-иконки, но не у каждой существует вариант `-off`. В итоге устройство уже выключено, а иконка визуально всё ещё выглядит активной. Этот плагин автоматически добавляет перечёркивание в стиле MDI для неактивных сущностей, когда штатной выключенной иконки нет.

# 🚫 MDI Off Fallback для Home Assistant

![Plugin function visualized](docs/demo.jpg)

Плагин реализован так, чтобы добавленное перечёркивание выглядело как штатная часть Home Assistant:

* работает со стандартными Tile-карточками без их замены и сохраняет штатный внешний вид, поведение, цвета, размеры и взаимодействия;
* изменяет только уже отрисованные иконки и только при отсутствии штатного варианта `-off`;
* добавляет бледный круглый фон в стиле Home Assistant, если штатного фона нет;
* не меняет состояния сущностей и не вмешивается в работу устройств.

**Примечание:** внутренние компоненты интерфейса Home Assistant не являются стабильным публичным API. При значительных изменениях интерфейса может потребоваться обновление плагина.

<a id="configuration"></a>
## 🔧 Настройка

Пользовательская конфигурация необязательна. Без пользовательского файла плагин использует встроенные значения:

<a id="default-configuration"></a>
### Конфигурация по умолчанию

По умолчанию следующие состояния считаются выключенными:

| Домен устройств | Состояния выключения |
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

Также используются следующие параметры:

```json
{
  "faint_background_when_missing": true,
  "faint_background_opacity": 0.2,
  "debug": false
}
```

<a id="user-configuration"></a>
### Пользовательская конфигурация

Чтобы задать собственные правила сразу для всей установки Home Assistant, создайте файл:

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

Конфигурация хранится отдельно от файлов плагина, которыми управляет HACS, поэтому обновления плагина её не перезаписывают.

#### Особенности секции `states`

Если в пользовательской конфигурации присутствует объект `states`, он **полностью заменяет** встроенный список. Плагин будет учитывать только явно перечисленные домены и состояния.

```json
{
  "states": {
    "light": ["off"],
    "cover": ["closed"]
  }
}
```

В этом примере перечёркивание будет применяться только к `light` и `cover`. Встроенные правила для `switch`, `fan`, `climate` и остальных доменов использоваться не будут.

Чтобы вернуться к встроенному списку, удалите `states` из конфигурации или удалите сам файл конфигурации.

Остальные параметры независимы: если параметр не указан, для него сохраняется встроенное значение.

<a id="background"></a>
#### Фон неактивной иконки

Если Home Assistant уже рисует штатный фон неактивной иконки, плагин его не трогает.

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

<a id="runtime-configuration"></a>
#### Временная настройка через консоль

`haMdiOffFallback.configure()` использует ту же логику.

Переданный `states` полностью заменяет текущий список:

```js
haMdiOffFallback.configure({
  states: {
    light: ["off"],
    cover: ["closed"],
    remote: ["off"]
  },
  debug: true
})
```

Если `states` не передан, текущий список не изменяется:

```js
haMdiOffFallback.configure({
  debug: true
})
```

Настройки, заданные через `configure()`, действуют только в текущей вкладке до перезагрузки страницы. Для постоянной конфигурации используйте JSON-файл.

<a id="reload-config"></a>
#### Перезагрузка конфигурации

После изменения JSON-файла конфигурацию можно перечитать без перезагрузки страницы:

```js
haMdiOffFallback.reloadConfig()
```

Посмотреть активную конфигурацию:

```js
haMdiOffFallback.getConfig()
```

<a id="installation"></a>
## 📦 Установка

### HACS

Пока плагин не добавлен в стандартный каталог HACS:

1. Откройте HACS.
2. Откройте меню в правом верхнем углу и выберите **Custom repositories**.
3. Добавьте репозиторий:

```text
https://github.com/LanKing/ha-mdi-off-fallback
```

4. Выберите тип **Dashboard** и нажмите **Add**.
5. После добавления найдите и откройте **MDI Off Fallback** в HACS.
6. Нажмите **Download** и подтвердите установку.
7. После завершения загрузки обновите страницу Home Assistant с очисткой кэша браузера.

> Добавление репозитория в **Custom repositories** только делает плагин доступным в HACS. Сам плагин устанавливается отдельно кнопкой **Download**.

Дополнительная настройка карточек не требуется.

<a id="manual-installation"></a>
### Ручная установка

1. [Скачайте `ha-mdi-off-fallback.js`](https://github.com/LanKing/ha-mdi-off-fallback/releases/latest/download/ha-mdi-off-fallback.js).
2. Скопируйте файл в:

```text
/config/www/ha-mdi-off-fallback.js
```

3. В Home Assistant откройте **Настройки → Панели управления → Ресурсы** (**Settings → Dashboards → Resources**).
4. Нажмите **Добавить ресурс** (**Add resource**).
5. В поле URL укажите:

```text
/local/ha-mdi-off-fallback.js
```

6. Выберите тип **Модуль JavaScript** (**JavaScript Module**) и нажмите **Создать** (**Create**).
7. Обновите страницу Home Assistant с очисткой кэша браузера.

## 📄 Лицензия

MIT — вклад в проект приветствуется.
