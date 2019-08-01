# &lt;talking-timer&gt;

A custom element for visual and audio countdown timing. (For when my kids need to stop doing a thing they don't want to stop. And for when I'm teaching and running a time sensitive exercise)

## How it works

At it's most basic you can configure a reusable timer like so: (this is a three minute timer)
``` html
<talking-timer start="03:00">My timer</talking-timer>
```

The text within the element wrapper is used a the title for the time.

## Attributes

### `time`

Duration of the timer.

The `time` attribute is required and can either be the total number of seconds or a time string (`HH:MM:SS` - hours & minutes are optional)

### `nospeak` / `speak`

> __NOTE:__ Speak aloud functionality is not yet fully implemented

`nospeak` and `speak` attributes control the speak aloud options and contain a space separated list of keywords.

> __NOTE:__ `nospeak` and `speak` attributes are mutually exclucive.
> 
> You should never use both in the same element.
> 
> If both are used __`nospeak` is *ignored*__.

__`nospeak`__ blacklists the specified options so they are not spoken.

__`speak`__ whitelists the specified options so only those specified are spoken.

#### `speak` / `nospeak` options

`speak`/`nospeak` options are case insensitive, and their parts can be hyphen or underscore separated for better readability.

##### speak option pattern:

1. __Time interval:__
   * `[all][XX][last|first][XX][s|m|h]` or
   * (hypen separated) `[all]-[last|first]-[XX]-[s|m|h]` or
   * (underscore separated) `[all]_[last|first]_[XX]_[s|m|h]`
2. __Fraction interval:__
   * `[all][XX][last|first][X]1/[2, 3, 4, 5, 6, 7, 8, 9, 10]` or
   * (hypen separated) `[all]-[last|first]-[X]-1/[2, 3, 4, 5, 6, 7, 8, 9, 10]` or
   * (underscore separated) `[all]_[last|first]_[X]_1/[2, 3, 4, 5, 6, 7, 8, 9, 10]`

`/(?:^|\s+(all)?[_-]?([0-9]+)?[_-]?(last|first)?[_-]?(?:([1-9][0-9]*)[_-]?([smh]?)|([1-9])?[_-]?1\/([2-9]|10))(?=\s+|$/ig`

* __`all`__ - is a modifier for `last` & `first`. `all` is assumed if `last`/`last` is not present. All of these intervals are spoken (e.g. **`all`**`Last5m`: speak 5, 4, 3, 2 & 1 minutes to go) or (e.g **`all`**`5m` = `5m`: if timer if 25 minutes speak 20, 15, 10 & 5 minutes to go)
* __`last`|`first`__ - this interval is spoken when its based on the time remaining (for last) or time ellapsed (for first).
  (e.g. **`last`**`5m`: speak the interval five minutes from the end of the timer.) or
  (e.g. **`first`**`1m`: speak "One minute passed." after the time has run for a minute.)
  __NOTE:__ When `all` & `first`/`last` are combined with a fraction, the fractions are spoken after or before the halfway mark respectively.
  e.g. `all`**`First`**`1/5`

##### First pattern: Seconds, Minutes & Hours

* __`XX`__: (`XX` represents digits) - the number of seconds/minutes/hours from the end (e.g. `all`**`5`**`m`: speak interval every 5 minutes)
* __`s`|`m`|`h`__ - **`s`** = seconds, **`m`** = minutes, **`h`** = hours (__NOTE:__ if this is omitted seconds are assumend)

##### Second pattern: Fractions

* __`X`__ 

##### Options spoken by default

* `1/2` - speak the halfway interval
* `30s` - speak every 30 seconds remaining (includes minutes)
* `last20` - speak last 20 seconds warning
* `last15` - speak last 15 seconds warning
* `allLast10` - speak last 10 second countdown


``` HTML
<!-- -->
<talking-timer start="03:00" speak="minutes allLast10">
  Only speak minute intervals and countdown last 10 seconds
</talking-timer>

<talking-timer start="03:00" nospeak="quarters halfway last20 minutes">
  Only speak thirds, 30 second intervals (when they're not thirds) and
  last second announcements
</talking-timer>

<talking-timer start="03:00">
  Speak all announcements
</talking-timer>

<talking-timer start="03:00" speak="">
  Nothing in speak (i.e. empty whitelist)
  Don't speak any announcments - Silent
</talking-timer>
```

> __NOTE:__ When announcements overlap (e.g. 3 minute time with minutes and thirds) Minute announcements are spoken and fractions are skipped

### `selfdestruct`

If `selfdestruct` is set, then the timer will remove itself thirty seconds after completion or as many seconds as the timer ran for (which ever is shorter).

``` HTML
<talking-timer start="03:00" selfdestruct>
  Self destruct after 30 seconds
</talking-timer>

<talking-timer start="03:00" selfdestruct="true">
  Self destruct after 30 seconds
</talking-timer>

<talking-timer start="03:00" selfdestruct="600">
  Self destruct after 10 minutes
</talking-timer>
```

> __NOTE:__ If `selfdestruct` has a numeric value, then that number will set the number of seconds, after which, the node will remove itself.

> __NOTE ALSO:__ If the value of `selfdestruct` is greater than 43200 (12 hours) 43200 will be used.

### `norestart`

Excludes the `Start again` button from the UI

### `noreset`

Excludes the `Reset` button from the UI

### `priority`

To reduce the amount of talking to only time announcements can only be made if they are seven seconds later or earlier than another anouncement. By default fraction anouncements have priority e.g. when the timer is set to 3 minutes, the "Half way" announcement is also the same as the "One minute, thirty seconds to go" anouncement so the "Half way" announcement is spoken but the "One minute, thirty seconds to go." is skipped.

``` HTML
<talking-timer start="03:00">
  When the timer is set to 3 minutes, the "Half way" announcement is also the same as the "One minute, thirty seconds to go" anouncement so the "Half way" announcement is spoken but the "One minute, thirty seconds to go." is skipped.
</talking-timer>

<talking-timer start="03:00" priority="seconds">
  When the timer is set to 3 minutes, the "Half way" announcement is also the same as the "One minute, thirty seconds to go" anouncement so the "One minute, thirty seconds to go." announcement is spoken but the "Half way" is skipped.
</talking-timer>

<talking-timer start="03:00" priority="fraction">
  The "Half way" announcement is also the same as the "One minute, thirty seconds to go" anouncement so the "Half way" announcement is spoken but the "One minute, thirty seconds to go." is skipped.
</talking-timer>
```
