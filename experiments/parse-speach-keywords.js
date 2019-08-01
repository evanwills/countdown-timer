/**
 * parseRawIntervals() builds an array of objects which in turn can
 * be used to build promises that trigger speach events.
 *
 * @param {string} rawIntervals
 * @param {number} durationMilli
 * @param {boolean} omit
 *
 * @returns {array}
 */
function parseRawIntervals (rawIntervals, durationMilli, omit) {
  const regex = new RegExp('(?:^|\\s+)(all)?[_-]?([0-9]+)?[_-]?((?:la|fir)st)?[_-]?(?:([1-9][0-9]*)[_-]?([smh]?)|([1-9])?[_-]?1\\/([2-9]|10))(?=\\s+|$)', 'ig')
  let matches
  let timeIntervals = []
  let fractionIntervals = []

  if (typeof rawIntervals !== 'string' || rawIntervals === '') {
    return []
  }
  const exclude = (typeof omit === 'boolean') ? omit : false

  while ((matches = regex.exec(rawIntervals)) !== null) {
    let interval = {
      all: ((typeof matches[1] !== 'undefined' && matches[1].toLocaleLowerCase() === 'all') || typeof matches[3] === 'undefined'),
      multiplier: (typeof matches[2] !== 'undefined' && typeof (matches[2] * 1) === 'number') ? parseInt(matches[2]) : 1,
      relative: (typeof matches[3] !== 'undefined') ? matches[3].toLocaleLowerCase() : '', // first|last
      exclude: exclude,
      isFraction: false,
      raw: matches[0]
    }
    if (interval.all === true) {
      interval.multiplier = 0
    }

    if (typeof matches[7] !== 'undefined') {
      const numerator = parseInt(matches[7])

      interval.isFraction = true
      interval.numerator = numerator

      if (interval.multiplier > (numerator - 1)) {
        interval.multiplier = (numerator - 1)
      }
      fractionIntervals = fractionIntervals.concat(getFractionOffsetAndMessage(interval, durationMilli, interval.raw))
    } else {
      matches[4] = parseInt(matches[4])
      switch (matches[5]) {
        case 'h':
          matches[4] *= 3600
          break
        case 'm':
          matches[4] *= 60
          break
      }
      interval.unit = (typeof matches[4] === 'string') ? matches[4].toLocaleLowerCase() : 's'
      interval.time = matches[4] * 1000
      timeIntervals = timeIntervals.concat(getTimeOffsetAndMessage(interval, durationMilli, interval.raw))
    }
  }

  const output = (this.priority === 'time') ? timeIntervals.concat(fractionIntervals) : fractionIntervals.concat(timeIntervals)

  return sortOffsets(filterOffsets(output))
}

// function getIntervalPromises (remainingMilliseconds, intervals) {
//   const endTime = Date.now() + remainingMilliseconds
//   let output = []

//   return output
// }

/**
 * getFractionOffsetAndMessage() returns a list of time offset
 * objects based on fractions of total duration of time.
 *
 * Used for announcing progress in timer
 *
 * @param {object} timeObj
 * @param {number} milliseconds
 */
function getFractionOffsetAndMessage (timeObj, milliseconds) {
  let interval = 0
  const half = milliseconds / 2

  interval = milliseconds / timeObj.numerator
  if (timeObj.numerator === 2) {
    return [{ message: 'Half way', offset: half, raw: timeObj.raw }]
  }

  let offsets = []

  const count = (timeObj.multiplier === 0 || timeObj.multiplier >= timeObj.numerator) ? timeObj.numerator : timeObj.multiplier

  if (timeObj.relative !== '') {
    const suffix = (timeObj.relative === 'first') ? ' gone.' : ' to go.'
    const minus = (timeObj.relative === 'first') ? 0 : milliseconds

    for (let a = 1; a <= count; a += 1) {
      offsets.push({
        offset: posMinus(minus, (interval * a)),
        message: makeFractionMessage(a, timeObj.numerator) + suffix,
        raw: timeObj.raw
      })
    }
  } else {
    for (let a = 1; a < (count / 2); a += 1) {
      const message = makeFractionMessage(a, timeObj.numerator)
      offsets.push({
        offset: (interval * a),
        message: message + ' to go.',
        raw: timeObj.raw
      },
      {
        offset: (milliseconds - (interval * a)),
        message: message + ' gone.',
        raw: timeObj.raw
      })
    }
  }
  console.log('offsets:', offsets)

  const filtered = offsets.map(item => {
    if (tooClose(item.offset, half)) {
      return {
        offset: half,
        message: 'Half way',
        raw: item.raw
      }
    } else {
      return item
    }
  })
  console.log('filtered:', filtered)
  return filtered
}

function getTimeOffsetAndMessage (timeObj, milliseconds, raw) {
  console.group('getTimeOffsetAndMessage')
  console.log('timeObj:', timeObj)
  console.log('milliseconds:', milliseconds)

  if (timeObj.all === true || timeObj.multiplier > 1) {

  } else {
    return [{
      offset: timeObj.time,
      message: makeTimeMessage(timeObj.time),
      raw: raw
    }]
  }

  console.groupEnd('getTimeOffsetAndMessage')
  return []
}

/**
 * tooClose() checks whether the current value is within 5 seconds
 * of the previous value
 *
 * @param {number} current value to be tested
 * @param {number} previous value to be tested against
 *
 * @returns {boolean} TRUE if within 5 seconds of previous value
 */
function tooClose (current, previous) {
  return (current > (previous - 5000) && current < (previous + 5000))
}

/**
 * tooCloseAny() checks a given offset value against previously seen
 * offsets
 *
 * @param {number} offset
 * @param {array} previous list of previously seen numbers
 *
 * @returns {boolean} TRUE if offset was too close to a previously
 *                seen offset value. FALSE otherwise
 */
function tooCloseAny (offset, previous) {
  for (let a = 0; a < previous.length; a += 1) {
    if (tooClose(offset, previous[a]) === true) {
      return true
    }
  }
  return false
}

/**
 * posMinus() ensures that the value of a subtraction is always
 * positive (or zero)
 *
 * @param {number} a
 * @param {number} b
 *
 * @return {number} positive value of a - b
 */
function posMinus (a, b) {
  if (a > b) {
    return a - b
  } else {
    return b - a
  }
}

/**
 * makeTimeMessage() returns a string that can be passed to the text
 * to web speech API
 *
 * @param {number} offset milliseconds
 *
 * @returns {string} textual representation of offset
 */
function makeTimeMessage (offset) {
  let output = ''
  let working = offset
  let comma = ''

  console.group('makeTimeMessage')
  console.log('0) working:', working)
  console.log('0) output:', output)
  if (working > 3600000) {
    const hours = Math.floor(working / 3600000)
    working -= hours * 3600000
    output += comma + hours.toString() + ' hour'
    output += (hours > 1) ? 's' : ''
    comma = ','
  }
  console.log('1) working:', working)
  console.log('1) output:', output)
  if (working > 60000) {
    const minutes = Math.floor(working / 60000)
    working -= minutes * 60000
    output = comma + minutes.toString() + ' minute'
    output += (minutes > 1) ? 's' : ''
    comma = ','
  }
  console.log('2) working:', working)
  console.log('2) output:', output)
  working = Math.round(working / 1000)
  if (working > 0) {
    output += comma + working.toString() + ' second'
    output += (working > 1) ? 's' : ''
    comma = ','
  }
  console.log('3) working:', working)
  console.log('3) output:', output)

  console.groupEnd('makeTimeMessage')
  return output
}

/**
 * makeFractionMessage() returns a string that can be passed to the
 * text to web speech API
 *
 * @param {number} offset milliseconds
 *
 * @returns {string} textual representation of the fraction offset
 */
function makeFractionMessage (denominator, numerator) {
  let fraction = ''
  const newNumerator = (Number.isInteger(numerator / denominator)) ? (numerator / denominator) : numerator

  switch (newNumerator) {
    case 2: return 'Half way'
    case 3: fraction = 'third'; break
    case 4: fraction = 'quarter'; break
    case 5: fraction = 'fifth'; break
    case 6: fraction = 'sixth'; break
    case 7: fraction = 'seventh'; break
    case 8: fraction = 'eighth'; break
    case 9: fraction = 'ninth'; break
    case 10: fraction = 'tenth'; break
  }

  const newDenominator = newNumerator / denominator
  const s = (newDenominator > 1) ? 's' : ''

  return newDenominator + ' ' + fraction + s
}

/**
 * sortOffsets() sorts a list of offset objects by their offset value
 *
 * @param {array} input list of offset objects to be sorted
 *
 * @returns {array} items are sorted by offset
 */
function sortOffsets (input) {
  return input.sort((a, b) => {
    if (a.offset < b.offset) {
      return -1
    } else if (a.offset > b.offset) {
      return 1
    } else {
      return 0
    }
  })
}

/**
 * filterOffsets() removes duplicates an items that are too close
 * to preceeding items
 *
 * @param {array} offsets list of offset objects
 *
 * @returns {array} list of offset objects excluding duplicates and
 *                closely occuring items
 */
function filterOffsets (offsets) {
  let found = []
  return offsets.filter(item => {
    if (found.indexOf(item.offset) === -1 && !tooCloseAny(item.offset, found)) {
      found.push(item.offset)
      return true
    } else {
      return false
    }
  })
}

// ==============================================
// START: Redundant functions

// /**
//  * isEven() checks whether a given number is even or not.
//  *
//  * @param {number} input
//  * @returns {boolean} true if the given number is even, false otherwise
//  */
// function isEven(input, isMillisecond) {
//   const tmp = (typeof isMillisecond === 'boolean' && isMillisecond === true) ?
//     Math.round(input / 1000) :
//     input
//   return Number.isInteger(tmp / 2)
// }

// /**
//  * isMinute() checks whether the given input represents a whole minute
//  *
//  * @param {number} input number of milliseconds
//  *
//  * @returns {boolean} TRUE if input is seconds is evenly divisible
//  *                 by 60. FALSE otherwise
//  */
// function isMinute(input) {
//   return Number.isInteger(input / 60000)
// }

// /**
//  * isHour() checks whether the given input represents a whole minute
//  *
//  * @param {number} input number of milliseconds
//  *
//  * @returns {boolean} TRUE if input is seconds is evenly divisible
//  *                 by 60. FALSE otherwise
//  */
// function isHour(input) {
//   return Number.isInteger(input / 3600000)
// }

// /**
//  * getSpecialMsg() returns the most appropriate message for the context.
//  *
//  * @param {string} message
//  * @param {array} special
//  * @param {number} index
//  *
//  * @returns {string} message part to be used as prefix for offset.message
//  */
// function getSpecialMsg (message, special, index) {
//   if (special.length === 0) {
//     const s = (index > 1) ? 's' : ''
//     return index + ' ' + message + s
//   } else {
//     return special[index]
//   }
// }

//  END:  Redundant functions
// ==============================================

const keywords = '4first1/6 30s last20 last15 allLast10'
const timeObj = parseRawIntervals(keywords, 180000)
console.log('keywords:', keywords)
console.log('timeObj:', timeObj)
