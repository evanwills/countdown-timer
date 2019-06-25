# countdown-timer

A custom element for visual and audio countdown timing. (For when my kids need to stop doing a thing they don't want to stop. And for when I'm teaching and running a time sensitive exercise)

## How it works

At it's most basic you can configure a reusable timer like so: (this is a three minute timer)
``` html
<countdown-timer start="03:00">My timer</countdown-timer>
```

## Attributes

### `start`

The `start` attribute is required and can either be the total number of seconds or a time string (`HH:MM:SS` - hours & minutes are optional)

### `nospeak` / `speak`

> __NOTE:__ Speak aloud functionality is not yet implemented

`nospeak` and `speak` attributes control the speak aloud options and contain a space separated list of keywords.

> __NOTE:__ `nospeak` and `speak` attributes are mutually exclucive.
> 
> You should never use both in the same element.
> 
> If both are used __`nospeak` is *ignored*__.

__`nospeak`__ blacklists the specified options so they are not spoken.

__`speak`__ whitelists the specified options so only those specified are spoken.

## `speak` / `nospeak` options

By default all options are spoken

* `quarters` - (for start times that are evenly divisible by four) speak 3/4 and 1/4 intervals
* `thirds`  - (for start times that are evenly divisible by 3) speak 2/3 and 1/3 intervals
* `halfway` - speak the halfway interval
* `minutes` - speak each minute remaining
* `30seconds` - speak every 30 seconds remaining (includes minutes)
* `last20` - speak last 20 seconds warning
* `last15` - speak last 15 seconds warning
* `allLast10` - speak last 10 second countdown

### `selfdestruct`

If `selfdestruct` is set, then the timer will remove itself thirty seconds after completion or as many seconds as the timer ran for (which ever is shorter).

### `norestart`

Excludes the `Start again` button from the UI

### `noreset`

Excludes the `Reset` button from the UI
