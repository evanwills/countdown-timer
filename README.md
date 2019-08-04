# &lt;talking-timer&gt;

A custom element for visual and audio countdown timing. (For when my kids need to stop doing a thing they don't want to stop. And for when I'm teaching and running a time sensitive exercise)

## How it works

1. You create a `<talking-timer time="HH:MM:SS"></talking-timer>` element.
2. When you're ready you press the "Start" button and the timer begins counting down
3. Then as it reaches defined times it announces the time reached (e.g. "Half way.")
4. When it reaches zero, it says "Time's up." (or whatever you've set `end-message` to and plays a chime

At it's most basic you can configure a reusable timer like so: (this is a three minute timer)
``` html
<talking-timer start="03:00">My timer</talking-timer>
```

The text within the element wrapper is used a the title for the time.

## Attributes

### `time` (required)

Duration of the timer.

The `time` attribute is required and can either be the total number of seconds or a time string (`HH:MM:SS` - hours & minutes are optional)

### `speak`

By default `speak` is set to `"1/2 30s last20 last15 allLast10"`:

* `1/2` - announce the *"Half way."* interval
* `30s` - announce every 30 second and 1 minute interval
  (e.g. for a three minute timer that would be "*30 seconds gone.*", "*1 minute gone.*", "*1 minute to go.*", "*30 seconds to go.*".
  __NOTE:__ "1 minute, 30 seconds" is the same as "Half way.". Because `1/2` was defined first, it has higher priority so "1 minute, 30 seconds" is omitted.)
* `last20` (same as `last20s`) = "20 seconds to go."
* `last15` (same as `last15s`) = "15 seconds" (as intervals get closer together, there's less time to say everything so we drop the "to go." part)
* `allLast10` count down from 10 ("Ten!", "Nine!", "Eights!", "Seven!", "Six!", "Five!", "Four!", "Three!", "Two!", "One!")

> __NOTE:__ Text to speech is not fully supported by all browsers

#### `speak` options

> __NOTE:__ `speak` options are __not__ case sensitive, and their parts can be hyphen or underscore separated for better readability.

##### speak option pattern:

1. __Time interval:__
   * `[all|every|X][last|first][YY][s|m|h]` or
   * (hypen separated) `[all|X]][last|first]-[YY]-[s|m|h]` or
   * (underscore separated) `[all]_[last|first]_[YY]_[s|m|h]`
2. __Fraction interval:__
   * `[all|every|X][last|first]1/[2, 3, 4, 5, 6, 7, 8, 9, 10]` or
   * (hypen separated) `[all|X]-[last|first]-1/[2, 3, 4, 5, 6, 7, 8, 9, 10]` or
   * (underscore separated) `[all|X]_[last|first]_1/[2, 3, 4, 5, 6, 7, 8, 9, 10]`



* __`all`__ - is a modifier for `last` & `first`. `all` is assumed if `last`/`last` is not present. All of these intervals are spoken (e.g. **`all`**`Last5m`: speak 5, 4, 3, 2 & 1 minutes to go) or (e.g **`all`**`5m` = `5m`: if timer if 25 minutes speak 20, 15, 10 & 5 minutes to go)

* __`X`__ (represents a number) is a modifier for `last` & `first`. When present, it multiplies the number of times a give interval is announced
  (e.g. `3last15` - same as `last15` & `last30` & `last45` - would result in "45 seconds to go.", "30 seconds to go." & "15 Seconds") or
  (e.g. 2last1/5 - would result in both "Two fifths to go." & "One fifth to go" being announced)

* __`every`__ - works in the same way as `X` but every interval is spoken for the duration of the timer relative to `last` / `first`.
  (e.g. everyLast30 - for a three minute timer: "2 minutes and 30 seconds to go.", "2 minutes and 30 seconds to go.", "2 minutes to go.", "1 minute and 30 seconds to go.", "1 minute to go.", "30 seconds to go.") or
  (e.g. everyLast1/4 - # a three minute timer: "3 quarters to go.", "Half way.", "1 quarter to go.")

* __`last`|`first`__ - this interval is spoken when its based on the time remaining (for last) or time ellapsed (for first).
  (e.g. **`last`**`5m`: speak the interval five minutes from the end of the timer.) or
  (e.g. **`first`**`1m`: speak "One minute passed." after the time has run for a minute.)
  __NOTE:__ When `all` & `first`/`last` are combined with a fraction, the fractions are spoken after or before the halfway mark respectively.
  (e.g. `all`**`First`**`1/5` "One Fifth gone." & "Two fifths gone." will be spoken)
  (e.g. `every`**`First`**`1/5` "One Fifth gone.", "two Fifth gone.", "three Fifth gone." & "four fifths gone." will be spoken)

##### Time interval: Seconds, Minutes & Hours

* __`YY`__: (`YY` represents digits) - the number of seconds/minutes/hours from the end (e.g. `all`**`5`**`m`: speak interval every 5 minutes)
* __`s`|`m`|`h`__ - **`s`** = seconds, **`m`** = minutes, **`h`** = hours (__NOTE:__ if this is omitted seconds are assumend)

##### Second pattern: Fractions

* `1/2` ,`1/3` ,`1/4` ,`1/5` ,`1/6` ,`1/7` ,`1/8` ,`1/9` ,`1/10` fraction of total time to be announced. 

``` HTML
<!-- -->
<talking-timer start="03:00" speak="1m allLast10">
  Only speak minute intervals and countdown last 10 seconds
</talking-timer>

<talking-timer start="03:00" nospeak="1/4 last20 1m">
  Only speak thirds, minute intervals and
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

### `nopause`

Hide the "Pause ||" button while the timer is active.

### `norestart`

Excludes the `Start again` button from the UI

### `noreset`

Excludes the `Reset` button from the UI

### `priority`

To reduce the amount of talking, announcements can only be made if they are seven seconds later or earlier than another anouncement. By default fraction anouncements have priority e.g. when the timer is set to 3 minutes, the "Half way" announcement is also the same as the "One minute, thirty seconds to go" anouncement so the "Half way" announcement is spoken but the "One minute, thirty seconds to go." is skipped.

#### `priority` options:

* `fraction` (default) Fraction intervals are spoken if there's a confilict between a time and a fraction announcement.
* `time` time intervals are spoken if there's a confilict between a time and a fraction announcement.
* `order` (order they're defined in `speak`)

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
