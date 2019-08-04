/* globals HTMLElement, SpeechSynthesisUtterance, speechSynthesis, AudioContext, customElements */

// references:
//   https://developers.google.com/web/fundamentals/web-components/customelements
//  https://developer.mozilla.org/en-US/docs/Web/Web_Components/Using_custom_elements

class TalkingTimer extends HTMLElement {
  constructor () {
    super()

    this.initialValue = {
      hours: 0,
      minutes: 0,
      seconds: 0
    }
    this.currentValue = {
      hours: 0,
      minutes: 0,
      seconds: 0,
      tenths: 0
    }

    this.endTime = 0

    this.initialMilliseconds = 0
    this.remainingMilliseconds = 0

    this.config = {
      autoDestruct: -1,
      noEndChime: false,
      noPause: false,
      noReconfigure: false,
      noReset: false,
      noRestart: false,
      noSayEnd: false,
      selfDestruct: false,
      sayStart: false,
      priority: 'fraction'
    }

    this.intervalTime = 20 // milliseconds

    this.play = false
    this.playPauseBtn = null
    this.resetBtn = null
    this.restartBtn = null
    this.closeBtn = null
    this.numbers = null
    this.progressTicker = null
    this.speakDefault = '1/2 30s last20 last15 allLast10'
    this.speakIntervals = []
    this.workingIntervals = []

    this.endText = 'Time\'s up'
    this.startText = 'Ready. Set. Go.'

    this.multipliers = { hours: 3600000, minutes: 60000, seconds: 1000, tenths: 100 }

    let shadowRoot = this.attachShadow({ mode: 'open' })
    shadowRoot.appendChild(this.getDOM())
  }

  static get observedAttributes () {
    return ['start', 'playing']
  }

  // ======================================================
  // START: standard custom element callbacks

  connectedCallback () {
    this.parseAttributes()

    if (this.initialMilliseconds > 10000) {
      this.playPauseClick = this.getPlayPauseClick()
      this.playPauseBtn.addEventListener('click', this.playPauseClick)

      if (this.config.noReset === false) {
        this.resetBtn.classList.add('hide')
      }

      if (this.config.noRestart === true) {
        this.restartBtn.classList.add('hide')
      }

      this.resetClick = this.getResetClick()
      this.resetBtn.addEventListener('click', this.resetClick)
      this.restartClick = this.getRestartClick()
      this.restartBtn.addEventListener('click', this.restartClick)

      this.closeClick = this.getCloseClick()
      this.closeBtn.addEventListener('click', this.closeClick)

      this.setTickTock()
      this.resetTimerValues()

      this.inProgress = false
      this.voice = window.speechSynthesis
    }
  }

  disconnectedCallback () {
    this.playPauseBtn.removeEventListener('click', this.playPauseClick)
    this.closeBtn.removeEventListener('click', this.closeClick)
  }

  //  END:  standard custom element callbacks
  // ======================================================
  // START: getters & setters

  get start () { return this.timeObjToString(this.initialValue) }

  set start (hoursMinutesSeconds) {
    this.validateTimeDuration(hoursMinutesSeconds)
  }

  get playing () { return this.playing }

  set playing (val) {
    if (val) {
      this.setAttribute('playing', 'playing')
      if (!this.playing) {
        this.startPlaying()
      }
      this.playing = true
    } else {
      this.removeAttribute('playing')
      if (this.playing) {
        this.pausePlaying()
      }
      this.playing = false
    }
  }

  //  END:  getters & setters
  // ======================================================
  // START: click handlers

  startPlaying (noDelay) {
    // noDelay = (typeof noDelay !== 'boolean' || noDelay === true)

    if (this.config.sayStart === true) {
      this.saySomething(this.startText)
      window.setTimeout(this.startPlayingInner, 3800, this)
    } else {
      this.startPlayingInner(this)
    }
  }

  startPlayingInner (obj) {
    this.endTime = Date.now() + obj.remainingMilliseconds

    if (obj.config.noPause === true) {
      obj.playPauseBtn.classList.add('hide')
    }

    if (obj.config.noReset === true) {
      obj.resetBtn.classList.add('hide')
    }

    if (obj.config.noRestart === true) {
      obj.restartBtn.classList.add('hide')
    }

    obj.setProgressTicker(obj.intervalTime)
    obj.playPauseBtn.classList.add('playing')
    obj.playPauseTxt.innerHTML = 'Pause '
    obj.playPauseIcon.innerHTML = '&Verbar;'
    obj.play = true
  }

  pausePlaying () {
    this.resetTickTock()
    this.playPauseBtn.classList.remove('playing')
    this.playPauseTxt.innerHTML = 'Play '
    this.playPauseIcon.innerHTML = '&bigtriangledown;'
    this.play = false
  }

  endPlaying () {
    if (this.noSayEnd === false) {
      const promise2 = new Promise((resolve, reject) => {
        this.saySomething(this.endText)
      })
    }
    if (this.config.noEndChime === false) {
      this.endSound()
    }

    this.numbers.classList.add('finished')
    this.playPauseBtn.classList.add('finished')

    if (this.config.autoDestruct !== -1) {
      window.setTimeout(() => { this.remove() }, this.config.autoDestruct)

      // This timer is going to self destruct.
      // Don't bother doing anything more
      return
    }

    this.resetTickTock()

    if (this.config.noPause === true) {
      this.resetBtn.classList.remove('hide')
    }

    if (this.config.noReset === true) {
      this.restartBtn.classList.remove('hide')
    }

    if (this.config.noRestart === true) {
      this.noRestart.classList.remove('hide')
    }
  }

  getPlayPauseClick () {
    const playPauseClick = (event) => {
      if (this.play) {
        // pausing
        this.pausePlaying()
      } else {
        // start playing
        this.startPlaying()
      }
    }

    return playPauseClick
  }

  getResetClick () {
    const resetClick = () => {
      this.pausePlaying()
      this.resetTimerValues()
      this.numbers.innerHTML = this.timeObjToString(this.currentValue)
      this.progress.value = (0)
      this.playPauseTxt.innerHTML = 'Start '

      this.numbers.classList.remove('finished')
      this.playPauseBtn.classList.remove('finished')
    }

    return resetClick
  }

  getRestartClick () {
    const restartClick = () => {
      this.resetClick()
      this.startPlaying(false)
    }

    return restartClick
  }

  getCloseClick () {
    const closeClick = (event) => {
      if (this.progressTicker !== null) {
        window.clearInterval(this.progressTicker)
      }

      this.playPauseBtn.removeEventListener('click', this.playPauseClick)
      this.resetBtn.removeEventListener('click', this.resetClick)
      this.restartBtn.removeEventListener('click', this.restartClick)
      this.closeBtn.removeEventListener('click', this.closeClick)
      this.remove()
    }

    return closeClick
  }

  //  END:  click handlers
  // ======================================================
  // START: DOM builders

  /**
   * getDOM builds the shadow DOM for the custom element
   *
   * Creates the following nodes:
   * 1. wrapping div used as the shell of the element
   * 2. a style element with all the CSS for the element
   * 3. the heading containing the user supplied content for the
   *    title of the timer
   * 4. the progress bar to show where the timer is at visually
   * 5. a span containing the numbers for the textual representation
   *    of the timer's progress
   * 6. a wrapping div containing the buttons for
   *    * pause/play
   *    * restart ("Start again")
   *    * reset
   * 7. a close button to dismis the timer
   */
  getDOM () {
    const wrap = document.createElement('div')
    wrap.setAttribute('class', 'TalkingTimer-wrapper')

    const css = this.initStyle()
    const style = document.createElement('style')
    style.appendChild(css)

    const h1 = document.createElement('h1')
    const slot = document.createElement('slot')
    h1.appendChild(slot)
    wrap.appendChild(h1)

    const progress = document.createElement('progress')
    progress.setAttribute('max', 1)
    progress.setAttribute('value', 0)
    wrap.appendChild(progress)
    this.progress = progress

    const numbers = document.createElement('span')
    numbers.setAttribute('class', 'timer-text')
    // numbers.appendChild(document.createTextNode(startTime))
    wrap.appendChild(numbers)

    this.numbers = numbers

    wrap.appendChild(this.initMainBtns())
    wrap.appendChild(this.initCloseBtn())
    wrap.appendChild(style)

    return wrap
  }

  initCloseBtn () {
    const close = document.createElement('button')
    const closeSR = document.createElement('span')
    const closeIcon = document.createElement('span')

    closeSR.setAttribute('class', 'sr-only')
    closeSR.appendChild(document.createTextNode('Close'))

    closeIcon.setAttribute('class', 'non-sr')
    closeIcon.innerHTML = '&CircleTimes;'

    close.setAttribute('class', 'closeBtn')
    close.setAttribute('class', 'closeBtn')
    close.appendChild(closeSR)
    close.appendChild(closeIcon)

    this.closeBtn = close

    return close
  }

  /**
   * initMainBtns() builds three buttons and wraps them in a <div>
   *
   * Buttons are:
   *   * pausePlay - used to control the countdown timing process
   *   * restart - used to trigger a reset, play action
   *   * reset - used to trigger a stop, reset action
   *
   * @returns {DOMnode}
   */
  initMainBtns () {
    const btnWrap = document.createElement('div')
    btnWrap.setAttribute('class', 'wrapper')

    const playPauseIcon = document.createElement('span')
    playPauseIcon.innerHTML = '&bigtriangledown;'
    playPauseIcon.setAttribute('class', 'non-sr icon')

    const playPauseTxt = document.createElement('span')
    playPauseTxt.setAttribute('class', 'playPauseTxt')
    playPauseTxt.appendChild(document.createTextNode('Start '))

    const playPause = document.createElement('button')
    playPause.setAttribute('class', 'playPauseBtn')
    playPause.appendChild(playPauseTxt)
    playPause.appendChild(playPauseIcon)

    const restartIcon = document.createElement('span')
    restartIcon.setAttribute('class', 'non-sr icon')
    restartIcon.innerHTML = '&circlearrowright;'

    const restart = document.createElement('button')
    restart.setAttribute('class', 'restartBtn')
    restart.appendChild(document.createTextNode('Start again '))
    restart.appendChild(restartIcon)

    const resetIcon = document.createElement('span')
    resetIcon.setAttribute('class', 'non-sr icon')
    resetIcon.innerHTML = '&hookleftarrow;'

    const reset = document.createElement('button')
    reset.setAttribute('class', 'resetBtn')
    reset.appendChild(document.createTextNode('Reset '))
    reset.appendChild(resetIcon)

    btnWrap.appendChild(playPause)
    btnWrap.appendChild(restart)
    btnWrap.appendChild(reset)

    this.playPauseBtn = playPause
    this.playPauseIcon = playPauseIcon
    this.playPauseTxt = playPauseTxt
    this.restartBtn = restart
    this.resetBtn = reset

    return btnWrap
  }

  /**
   * initStyle() returns block of CSS for styling the <talking-timer>
   * element's shadow DOM
   *
   * @returns {textNode} CSS string
   */
  initStyle () {
    return document.createTextNode(`
      :root {
        font-family: inherit;
      }
      .TalkingTimer-wrapper {
        border: 0.05rem solid #ccc;
        padding: 0;
        position: relative;
      }
      h1 {
        margin: 0;
        padding: 0.5rem;
        text-align: center;
        font-size: 1.5rem;
        /* border-bottom: 0.05rem solid #ccc; */
      }
      .wrapper {
        display: flex;
        /* flex-direction: row; */
        /* flex-wrap: nowrap; */
        justify-content: space-between;
        align-items: stretch;
      }
      button {
        flex-grow: 1;
        font-size: 1.25rem;
        border: 0.05rem solid #c0e;
        padding: 1rem 0;
        background-color: #fff;
        font-variant: small-caps;
      }
      button:last-child {
        border-right-width: 0.075rem;
      }
      button:hover {
        cursor: pointer;
        background-color: #eee;
      }
      button .icon {
        display: inline-block;
        margin-left: 0.3em;
        font-weight: bold;
        font-size: 1.25em;
        margin-top: -1em;
        margin-bottom: -1em;
        transform: translateY(0.15em);
      }
      .playPauseBtn {
        flex-grow: 3;
        background-color: #050;
        color: #fff;
        font-weight: bold;
        border-color: #040;
      }
      .playPauseBtn:hover {
        background-color: #030;
        border-color: #020;
      }
      .playPauseBtn .icon {
        transform: translateY(0.15em) rotate(30deg);
      }
      .playPauseBtn.playing .icon {
        transform: translateY(-0.05em);
      }
      .playPauseBtn.finished {
        opacity: 0;
      }
      .restartBtn .icon {
        font-size: 1.5em;
        transform: translateY(0.15em) rotate(45deg);
      }
      .resetBtn .icon {
        font-weight: normal;
      }
      .sr-only {
        display: inline-block;
        height: 1px;
        width: 1px;
        margin: -1px 0 0 -1px;
        opacity: 0;
      }
      .closeBtn {
        border: none;
        padding: 0.75rem;
        margin: 0;
        position: absolute;
        top: 0.1rem;
        right: 0.1rem;
        font-size: 2rem;
        background-transparent;
        line-height: 1rem;
      }
      .closeBtn:hover, .closeBtn:focus {
        font-weight: bold;
        color: #c00;
        background-color: transparent;
      }
      .closeBtn span {
        position: relative;
        top: -0.15rem;
        right: -0.3rem;
      }
      .timer-text {
        padding: 0.1em 1em 0.2em;
        font-size: 6rem;
        display: block;
        font-weight: bold;
        font-family: verdana, arial, helvetica, sans-serif;
        color: #222;
        text-align: center;
      }
      progress {
        display: block;
        width: 100%;
        height: 2rem;
        border: 0.05rem solid #ccc;
        background-color: #fff;
        color: #F00;
      }
      .finished {
        background-color: #c00;
        color: #fff;
      }
      .tenths {
        font-size: 3.5rem;
        font-weight: normal;
      }`
    )
  }

  //  END:  DOM builders
  // ======================================================
  // START: timer callbacks

  /**
   * setTickTock() returns a callback function to be passed to
   * `window.setInterval()` or `window.clearInterval()`
   *
   * The callback handles updating the textual representation of the
   * time remaining in the countdown
   *
   * @returns {void}
   */
  setTickTock () {
    this.numbers.innerHTML = this.timeObjToString(this.currentValue)
  }

  /**
   * setProgressTicker()
   *
   * @param {integer} interval number of Milliseconds the interval
   *                 should be between when the progress bar is
   *                 updated.
   * @returns {void}
   */
  setProgressTicker (interval) {
    if (this.endTime === 0) {
      this.endTime = Date.now() + this.remainingMilliseconds
    }

    // Clone speakIntervals so you have something to use next time
    this.workingIntervals = this.speakIntervals.map(interval => { return { ...interval } })

    const progressTickTock = () => {
      this.remainingMilliseconds = this.endTime - Date.now()

      if (this.remainingMilliseconds < 0) {
        this.remainingMilliseconds = 0
      }

      const promise1 = new Promise((resolve, reject) => {
        this.progress.value = (1 - (this.remainingMilliseconds / this.initialMilliseconds))
        this.currentValue = this.millisecondsToTimeObj(this.remainingMilliseconds)

        if (Math.floor(this.remainingMilliseconds) <= 0) {
          this.endPlaying()
        } else if (this.workingIntervals.length > 0 && (this.workingIntervals[0].offset + 1250) > this.remainingMilliseconds) {
          const sayThis = this.workingIntervals.shift()
          this.saySomething(sayThis.message)
        }
      })
      const promise3 = new Promise((resolve, reject) => { this.setTickTock() })
    }
    this.progressTicker = setInterval(progressTickTock, interval)
  }

  //  END:  timer callbacks
  // ======================================================
  // START: utility methods

  /**
   * onlyGreaterThanZero() ensures that the most significant field in
   * the returned timeObj is non-zero
   *
   * @param {object} currentValue containing seconds, minutes & hours
   *                representing the timer's duration
   * @returns {object} object containing only the least significant
   *                fields greater than zero
   */
  onlyGreaterThanZero (currentValue) {
    const fields = ['hours', 'minutes', 'seconds', 'tenths']
    let tmpValue = {}
    let allTheRest = false

    for (let a = 0; a < 4; a += 1) {
      const field = fields[a]
      const isNum = typeof currentValue[field] === 'number'
      if (allTheRest === true || (isNum === true && currentValue[field] > 0)) {
        tmpValue[field] = (isNum === true) ? currentValue[field] : 0
        allTheRest = true
      }
    }

    return tmpValue
  }

  /**
   * validateTimeDuration() validates the value of the element's `start`
   * attribute
   *
   * __NOTE:__ the parsed value of `start` must be less than 24 hours
   *
   * __NOTE ALSO:__ this method also assignes parsed values to object
   *       properties
   *
   * @param {string} hoursMinutesSeconds the string value of the
   *                 element's `start` attribute
   * @returns {void}
   */
  validateTimeDuration (hoursMinutesSeconds) {
    const regex = new RegExp('^(?:(?:(?:([0-1]?[0-9]|2[0-4]):)?([0-5]?[0-9]):)?([0-5]?[0-9])|([6-9][0-9]|[1-9][0-9]{2,5}))$')

    if (typeof hoursMinutesSeconds === 'string') {
      let tmpStart = { hours: 0, minutes: 0, seconds: 0 }
      const matches = regex.exec(hoursMinutesSeconds)

      if (matches !== null) {
        const len = matches.length

        if (len === 5 && typeof matches[4] !== 'undefined') {
          let seconds = Number.parseInt(matches[4], 10)

          if (seconds > 86400) {
            // limit the maximum duration of the timer to 24 hours
            seconds = 86400
          }

          this.initialMilliseconds = seconds * 1000
          this.initialValue = this.millisecondsToTimeObj(this.milliseconds)
        } else if (len > 0) {
          tmpStart.seconds = Number.parseInt(matches[3], 10)
          tmpStart.minutes = (typeof matches[2] === 'string' && matches[2] !== '') ? Number.parseInt(matches[2], 10) : 0
          tmpStart.hours = (typeof matches[1] === 'string' && matches[1] !== '') ? Number.parseInt(matches[1], 10) : 0

          this.initialValue = tmpStart
          this.initialMilliseconds = this.timeObjToMilliseconds(tmpStart)
        }
      } else {
        console.error('talking-timer must have a start value matching the following one of the following patterns: "SS", "MM:SS" or "HH:MM:SS". "' + hoursMinutesSeconds + '" does not match any of these patterns.')
        return false
      }
      this.resetTimerValues()
      return true
    } else {
      console.error('talking-timer must have a start value matching the following one of the following patterns: "SS", "MM:SS" or "HH:MM:SS". Empty string provided.')
      return false
    }
  }

  /**
   * timeObjToString() converts the current time remaining for
   * the countdown into a human readable string
   * @param {object} timeObj seconds, minutes and hours value
   *                representing the timer remaining for the timer.
   * @param {boolean} nonZeroOnly [default: TRUE] whether or not to
   *                remove most significant fields if they're zero
   * @returns {string} has the following structure "SS", "MM:SS",
   *                "HH:MM:SS" or "HH:MM:SS:CC" ("CC" = hundredths of
   *                a second) depending on the value of the `timeObj`
   *                attribute
   */
  timeObjToString (timeObj, nonZeroOnly) {
    const tmpTimeObj = (typeof nonZeroOnly !== 'boolean' || nonZeroOnly === true) ? this.onlyGreaterThanZero(timeObj) : { ...timeObj }
    const fields = Object.keys(tmpTimeObj)
    const wholeTimeFields = fields.filter(field => field !== 'tenths')
    const tenthsField = fields.filter(field => field === 'tenths')

    let output = ''
    for (let a = 0; a < wholeTimeFields.length; a += 1) {
      const field = wholeTimeFields[a]
      const zero = (tmpTimeObj[field] < 10 && output !== '') ? '0' : ''
      const colon = (output === '') ? '' : ':'
      output += colon + zero + Math.round(tmpTimeObj[field])
    }

    if (tenthsField.length > 0) {
      const colon = (output === '') ? '0.' : '.'
      output += colon + '<span class="tenths">' + Math.round(tmpTimeObj.tenths) + '</span>'
    } else if (output === '') {
      output = '0'
    }

    return output
  }

  /**
   * timeObjToMilliseconds() converts the values of a time object to
   * milliseconds
   * @param {object} timeObj
   * @returns {number} number of milliseconds the time object represents
   */
  timeObjToMilliseconds (timeObj) {
    const fields = ['tenths', 'seconds', 'minutes', 'hours']

    const tmpTimeObj = (typeof timeObj.tenths === 'undefined') ? { ...timeObj, 'tenths': 0 } : { ...timeObj }

    let output = 0
    for (let a = 0; a < 4; a += 1) {
      const field = fields[a]
      output += tmpTimeObj[field] * this.multipliers[field]
    }

    return output
  }

  /**
   * millisecondsToTimeObj() converts the number of milliseconds
   * provided to a timeObj object
   * @param {number} milliseconds
   * @returns {object} time object with the form {hours, minutes, seconds, tenths}
   */
  millisecondsToTimeObj (milliseconds) {
    const fields = ['hours', 'minutes', 'seconds', 'tenths']

    let output = {
      hours: 0,
      minutes: 0,
      seconds: 0,
      tenths: 0
    }
    let remainder = milliseconds

    // console.log('milliseconds:', milliseconds)

    for (var a = 0; a < 4; a += 1) {
      const field = fields[a]
      const tmp = this.getWholePart(remainder, this.multipliers[field])
      remainder = tmp.part
      output[field] = tmp.whole
    }

    return output
  }

  /**
   * getWholePart() (PURE) converts the number of milliseconds provided into the whole number of units
   * @param {number} input the number of millseconds to be converted
   *                 into approprate time unit
   *                 (e.g. hours, minutes, seconds, tenths of a second)
   * @param {number} multiplier the value used to multiply (or divide
   *                 in this case) the number of milliseconds to get
   *                 the unit value
   * @returns {object} two part object containing the "whole" value for
   *                 the unit and the remaining number of milliseconds
   *                 to be passed to the next unit
   */
  getWholePart (input, multiplier) {
    const wholeVal = Math.floor(input / multiplier)
    const partVal = input - (wholeVal * multiplier)
    return {
      whole: wholeVal,
      part: partVal
    }
  }

  /**
   * resetTimerValues() resets all the timer values to their original
   * state then clears the interval timers
   *
   * @returns {void}
   */
  resetTimerValues () {
    this.currentValue = { ...this.initialValue }
    this.remainingMilliseconds = this.initialMilliseconds
    this.resetTickTock()
  }

  /**
   * resetTickTock() clears interval timers and resets the
   * timer IDs to null
   *
   * @returns {void}
   */
  resetTickTock () {
    window.clearInterval(this.progressTicker)

    this.progressTicker = null
  }

  parseAttributes () {
    if (this.hasAttribute('time') && this.validateTimeDuration(this.getAttribute('time'))) {
      this.numbers.innerHTML = this.timeObjToString(this.onlyGreaterThanZero(this.initialValue))
    } else {
      // No timer... nothing to do.
      console.error('talking-timer custom element requires a time attribute which representing the total number of seconds or time string (HH:MM:SS)')
      return false
    }

    const configKeys = Object.keys(this.config)
    for (let a = 0; a < configKeys.length; a += 1) {
      const key = configKeys[a]
      const attr = key.toLocaleLowerCase()
      this.config[key] = (this.getAttribute(attr) !== 'undefined')
    }

    const endText = this.getAttribute('end-message')
    if (typeof endText !== 'undefined') {
      this.config.noSayEnd = false
      this.endText = endText
    }

    const startText = this.getAttribute('start-message')
    if (typeof startText === 'string' && startText !== '') {
      this.config.nosayStart = false
      this.startText = startText
    }

    const priority = this.getAttribute('priority')
    this.config.priority = (typeof priority !== 'undefined' || priority !== 'time') ? 'fraction' : 'time'

    // const noSpeak = this.parseRawIntervals(this.getAttribute('nospeak'), true)

    let speak = this.getAttribute('speak')
    speak = (typeof speak !== 'string') ? this.speakDefault : speak
    this.speakIntervals = this.parseRawIntervals(speak, this.initialMilliseconds)

    if (this.config.autoDestruct === true) {
      const autoDestruct = this.getAttribute('selfdestruct')
      this.config.autoDestruct = (Number.isInteger(autoDestruct * 1)) ? Number.parseInt(autoDestruct, 10) * 1000 : 10000
    } else {
      this.config.autoDestruct = -1
    }
  }

  //  END:  utility methods
  // ======================================================
  // START: raw interval parser

  /**
   * this.parseRawIntervals() builds an array of objects which in turn can
   * be used to build promises that trigger speach events.
   *
   * @param {string} rawIntervals
   * @param {number} durationMilli
   * @param {boolean} omit
   *
   * @returns {array}
   */
  parseRawIntervals (rawIntervals, durationMilli, omit) {
    const regex = new RegExp('(?:^|\\s+)(all|every)?[_-]?([0-9]+)?[_-]?((?:la|fir)st)?[_-]?(?:([1-9][0-9]*)[_-]?([smh]?)|([1-9])?[_-]?1\\/([2-9]|10))(?=\\s+|$)', 'ig')
    let matches
    let timeIntervals = []
    let fractionIntervals = []
    let orderIntervals = []

    if (typeof rawIntervals !== 'string' || rawIntervals === '') {
      return []
    }
    const exclude = (typeof omit === 'boolean') ? omit : false

    while ((matches = regex.exec(rawIntervals)) !== null) {
      const allEvery = (typeof matches[1] !== 'undefined') ? matches[1].toLocaleLowerCase() : ''
      const firstLast = (typeof matches[3] !== 'undefined') ? matches[3].toLocaleLowerCase() : ''

      let interval = {
        all: (allEvery === 'all' || firstLast === ''),
        every: (allEvery === 'every' && firstLast !== ''),
        multiplier: (typeof matches[2] !== 'undefined' && typeof (matches[2] * 1) === 'number') ? Number.parseInt(matches[2], 10) : 1,
        relative: firstLast,
        exclude: exclude,
        isFraction: false,
        raw: matches[0]
      }

      if (interval.every === true) {
        interval.all = false
        interval.multiplier = 0
      } else if (interval.all === true) {
        interval.multiplier = 0
      }

      if (typeof matches[7] !== 'undefined') {
        const denominator = Number.parseInt(matches[7], 10)

        interval.isFraction = true
        interval.denominator = denominator

        if (interval.multiplier > (denominator - 1)) {
          interval.multiplier = (denominator - 1)
        }

        const tmpIntervals = this.getFractionOffsetAndMessage(interval, durationMilli, interval.raw)

        if (this.config.priority === 'order') {
          orderIntervals = orderIntervals.concat(tmpIntervals)
        } else {
          fractionIntervals = fractionIntervals.concat(tmpIntervals)
        }
      } else {
        matches[4] = Number.parseInt(matches[4], 10)
        interval.unit = (typeof matches[4] === 'string') ? matches[4].toLocaleLowerCase() : 's'
        interval.time = matches[4]

        const tmpIntervals = this.getTimeOffsetAndMessage(interval, durationMilli, interval.raw)
        if (this.config.priority === 'order') {
          orderIntervals = orderIntervals.concat(tmpIntervals)
        } else {
          timeIntervals = timeIntervals.concat(tmpIntervals)
        }
      }
    }

    const output = (this.config.priority === 'order') ? orderIntervals : (this.config.priority === 'time') ? timeIntervals.concat(fractionIntervals) : fractionIntervals.concat(timeIntervals)

    return this.sortOffsets(this.filterOffsets(output, durationMilli))
  }

  /**
   * this.getFractionOffsetAndMessage() returns a list of time offset
   * objects based on fractions of total duration of time.
   *
   * Used for announcing progress in timer
   *
   * @param {object} timeObj
   * @param {number} milliseconds
   */
  getFractionOffsetAndMessage (timeObj, milliseconds) {
    let interval = 0
    const half = milliseconds / 2

    interval = milliseconds / timeObj.denominator
    if (timeObj.denominator === 2) {
      return [{ message: 'Half way', offset: half, raw: timeObj.raw }]
    }

    let offsets = []

    const count = (timeObj.multiplier === 0 || timeObj.multiplier >= timeObj.denominator) ? timeObj.denominator : timeObj.multiplier

    if (timeObj.relative !== '') {
      const suffix = (timeObj.relative === 'first') ? ' gone.' : ' to go.'
      const minus = (timeObj.relative === 'first') ? milliseconds : 0

      for (let a = 1; a <= count; a += 1) {
        offsets.push({
          offset: this.posMinus(minus, (interval * a)),
          message: this.makeFractionMessage(a, timeObj.denominator) + suffix,
          raw: timeObj.raw
        })
      }
    } else {
      for (let a = 1; a <= (count / 2); a += 1) {
        const message = this.makeFractionMessage(a, timeObj.denominator)
        offsets.push({
          offset: (milliseconds - (interval * a)),
          message: message + ' to go.',
          raw: timeObj.raw
        },
        {
          offset: (interval * a),
          message: message + ' gone.',
          raw: timeObj.raw
        })
      }
    }

    const filtered = offsets.map(item => {
      if (this.tooClose(item.offset, half)) {
        return {
          offset: half,
          message: 'Half way',
          raw: item.raw
        }
      } else {
        return item
      }
    })

    return filtered
  }

  /**
   * this.getTimeOffsetAndMessage() returns a list of time offset
   * objects for the given time interval.
   *
   * Used for announcing progress in timer
   *
   * @param {object} timeObj
   * @param {number} milliseconds
   */
  getTimeOffsetAndMessage (timeObj, milliseconds, raw) {
    const suffix = (timeObj.relative === 'first') ? ' gone.' : ' to go.'
    let offsets = []
    if ((timeObj.all === true || timeObj.every === true) || timeObj.multiplier > 1) {
      if ((timeObj.all === true || timeObj.every === true) && timeObj.multiplier <= 1) {
        if (timeObj.relative === '') {
          const half = milliseconds / 2
          const interval = timeObj.time * 1000
          for (let offset = interval; offset <= half; offset += interval) {
            offsets.push({
              offset: offset,
              message: this.makeTimeMessage(offset, ' to go.'),
              raw: timeObj.raw
            }, {
              offset: milliseconds - offset,
              message: this.makeTimeMessage(offset, ' gone.'),
              raw: timeObj.raw
            })
          }
        } else {
          let interval = 0
          if (timeObj.every === true) {
            interval = timeObj.time * 1000
          } else {
            switch (timeObj.unit) {
              case 's':
                interval = 1000
                break
              case 'm':
                interval = 60000
                break
              case 'h':
                interval = 3600000
                break
              default:
                interval = 1000
            }
          }
          const modifier = (timeObj.relative !== 'first') ? 0 : milliseconds

          for (let a = 1; a <= timeObj.time; a += 1) {
            const offset = a * interval
            offsets.push({
              offset: this.posMinus(modifier, offset),
              message: this.makeTimeMessage(offset, suffix),
              raw: timeObj.raw
            })
          }
        }
      } else if (timeObj.multiplier > 1) {
        const unit = (timeObj.unit === 's') ? 10000 : (timeObj.unit === 'm') ? 60000 : 3600000
        const interval = timeObj.time * unit
        const modifier = (timeObj.relative === 'last') ? 0 : milliseconds

        for (let offset = interval; offset <= timeObj.time; offset += interval) {
          offsets.push({
            offset: this.posMinus(modifier, offset),
            message: this.makeTimeMessage(offset, suffix),
            raw: timeObj.raw
          })
        }
      }
    } else {
      const interval = timeObj.time * 1000
      const offset = (timeObj.relative !== 'first') ? interval : milliseconds - interval
      offsets = [{
        offset: offset,
        message: this.makeTimeMessage(interval, suffix),
        raw: raw
      }]
    }

    return offsets
  }

  /**
   * this.tooClose() checks whether the current value is within 5 seconds
   * of the previous value
   *
   * @param {number} current value to be tested
   * @param {number} previous value to be tested against
   *
   * @returns {boolean} TRUE if within 5 seconds of previous value
   */
  tooClose (current, previous) {
    return (current > (previous - 5000) && current < (previous + 5000))
  }

  /**
   * this.tooCloseAny() checks a given offset value against previously seen
   * offsets
   *
   * @param {number} offset
   * @param {array} previous list of previously seen numbers
   *
   * @returns {boolean} TRUE if offset was too close to a previously
   *                seen offset value. FALSE otherwise
   */
  tooCloseAny (offset, previous) {
    for (let a = 0; a < previous.length; a += 1) {
      if (this.tooClose(offset, previous[a]) === true) {
        return true
      }
    }
    return false
  }

  /**
   * this.posMinus() ensures that the value of a subtraction is always
   * positive (or zero)
   *
   * @param {number} a
   * @param {number} b
   *
   * @return {number} positive value of a - b
   */
  posMinus (a, b) {
    if (a > b) {
      return a - b
    } else {
      return b - a
    }
  }

  /**
   * this.makeTimeMessage() returns a string that can be passed to the text
   * to web speech API
   *
   * @param {number} offset milliseconds
   *
   * @returns {string} textual representation of offset
   */
  makeTimeMessage (offset, suffix) {
    let output = ''
    let working = offset
    let comma = ''

    if (working < 20000) {
      // Do not append unit if 10 seconds or less
      const tmpSuffix = (working > 10000) ? ' seconds' : ''
      return Math.round(working / 1000) + tmpSuffix
    }

    if (working >= 3600000) {
      const hours = Math.floor(working / 3600000)
      working -= hours * 3600000
      output += comma + hours.toString() + ' hour'
      output += (hours > 1) ? 's' : ''
      comma = ', '
    }

    if (working >= 60000) {
      const minutes = Math.floor(working / 60000)
      working -= minutes * 60000
      output = comma + minutes.toString() + ' minute'
      output += (minutes > 1) ? 's' : ''
      comma = ', '
    }

    working = Math.round(working / 1000)
    if (working > 0) {
      output += comma + working.toString() + ' second'
      output += (working > 1) ? 's' : ''
      comma = ', '
    }

    return output + suffix
  }

  /**
   * this.makeFractionMessage() returns a string that can be passed to the
   * text to web speech API
   *
   * @param {number} numerator for fraction
   * @param {number} denominator for fraction
   *
   * @returns {string} textual representation of the fraction offset
   */
  makeFractionMessage (numerator, denominator) {
    let fraction = ''

    // reduce the denominator to its
    const newDenominator = (Number.isInteger(denominator / numerator)) ? (denominator / numerator) : denominator
    switch (newDenominator) {
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

    const newNumerator = (numerator / (denominator / newDenominator))
    const s = (newNumerator > 1) ? 's' : ''

    return newNumerator + ' ' + fraction + s
  }

  /**
   * this.sortOffsets() sorts a list of offset objects by their offset value
   *
   * @param {array} input list of offset objects to be sorted
   *
   * @returns {array} items are sorted by offset
   */
  sortOffsets (input) {
    return input.sort((a, b) => {
      if (a.offset < b.offset) {
        return 1
      } else if (a.offset > b.offset) {
        return -1
      } else {
        return 0
      }
    })
  }

  /**
   * this.filterOffsets() removes duplicates an items that are too close
   * to preceeding items
   *
   * @param {array} offsets list of offset objects
   *
   * @returns {array} list of offset objects excluding duplicates and
   *                closely occuring items
   */
  filterOffsets (offsets, max) {
    let found = []
    return offsets.filter(item => {
      if (found.indexOf(item.offset) === -1 && (item.offset <= 30000 || !this.tooCloseAny(item.offset, found)) && item.offset < max) {
        found.push(item.offset)
        return true
      } else {
        return false
      }
    })
  }

  //  END:  raw interval parser
  // ======================================================
  // START: speak aloud methods

  saySomething (text) {
    const sayThis = new SpeechSynthesisUtterance(text)
    const voiceName = 'English (Australia)'

    sayThis.volume = 2
    sayThis.rate = 1
    sayThis.pitch = 1
    sayThis.voice = speechSynthesis.getVoices().filter(function (voice) {
      return voice.name === voiceName
    })[0]

    this.voice.speak(sayThis)
  }

  /**
   * speakAfterSeconds() uses the Web Speech API's Speech Synthisis
   * interface to announce time intervals for the talking-timer
   *
   * @param {string} text Information to be spoken
   * @param {number} seconds time before the text is to be spoken.
   *
   * @returns {Promise}
   */
  speakAfterSeconds (text, seconds) {
    const speakAfterSecondsCallback = async () => {
      const milliseconds = seconds * 1000
      // SpeechSynthesis.speak(text)
      window.setTimeout(text, milliseconds)
    }
    return speakAfterSecondsCallback
  }

  /**
   * speakInterval() uses the Web Speech API's Speech Synthisis
   * interface to announce time intervals at a fixed interval
   *
   * @param {string} text Information to be spoken
   * @param {number} interval number of seconds for the interval
   *                 between when last text was spoken and when the
   *                 next speaking commences
   *
   * @returns {Promise}
   */
  speakInterval (text, interval) {

  }

  /**
   * speakIntervalAfterSeconds() uses the Web Speech API's Speech
   * Synthisis interface to announce time intervals at a fixed
   * interval starting after a specified number of seconds
   *
   * @param {string} text Information to be spoken
   * @param {number} seconds time before the text is to be spoken.
   *
   * @returns {Promise}
   */
  speakIntervalAfterSeconds (text, seconds) {

  }

  endSound () {
    /**
     * @var {number} duration the length of time (in seconds) a
     *               sound makes
     */
    const durationTime = 0.75
    /**
     * @var {number} interval the number of seconds between sounds
     *               starting
     */
    const interval = 0.5
    /**
     * @var {number} ramp no idea what this is for. See MDN docs
     * https://developer.mozilla.org/en-US/docs/Web/API/AudioParam/exponentialRampToValueAtTime
     */
    const ramp = 0.00001
    /**
     * @var {array} tones list of frequencies to be played
     */
    const tones = [440, 261.6, 830.6, 440, 261.6, 830.6, 392, 440, 261.6, 830.6, 440, 261.6, 830.6, 392, 440]

    /**
     * @var {number} offset number of milliseconds from calling the
     *               sound is to start playing
     */
    let offset = 0

    var context = new AudioContext()

    function playTone (frequency, duration, offset) {
      return function (resolve, reject) {
        var oscillator = context.createOscillator()
        var gain = context.createGain()

        oscillator.connect(gain)

        gain.connect(context.destination)
        gain.gain.exponentialRampToValueAtTime(
          ramp,
          context.currentTime + duration
        )

        oscillator.frequency.value = frequency
        oscillator.start(0)
      }
    }

    for (let a = 0; a < tones.length; a += 1) {
      let promise = new Promise(function (resolve, reject) {
        const toneFunc = playTone(tones[a], durationTime, offset)
        window.setTimeout(toneFunc, offset)
      })
      offset += (interval * 1000)
    }
  }

  //  END:  speak aloud methods
  // ======================================================
}

customElements.define('talking-timer', TalkingTimer)
