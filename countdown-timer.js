
// references:
//   https://developers.google.com/web/fundamentals/web-components/customelements
//  https://developer.mozilla.org/en-US/docs/Web/Web_Components/Using_custom_elements

class CountdownTimer extends HTMLElement {
  constructor () {
    super()

    this.initialValue = [0, 0, 0]
    this.currentValue = []
    this.initialSeconds = 0
    this.currentSeconds = 0
    this.initialMilliseconds = 0
    this.currentMilliseconds = 0

    this.adjustmentFactor = 1

    this.selfDestruct = false
    // this.noReconfigure = false
    // this.restartOnReset = true
    this.autoDestruct = 0
    this.noReset = false
    this.noRestart = false
    this.play = false
    this.playPauseBtn = null
    this.resetBtn = null
    this.restartBtn = null
    this.closeBtn = null
    this.numbers = null
    this.progressTicker = null

    let shadowRoot = this.attachShadow({ mode: 'open' })
    shadowRoot.appendChild(this.getDOM())
  }

  static get observedAttributes () {
    return ['start', 'playing']
  }

  // ======================================================
  // START: standard custom element callbacks

  connectedCallback () {
    if (this.hasAttribute('start') && this.validateStart(this.getAttribute('start'))) {
      this.numbers.innerHTML = this.currentValueToString(this.initialValue)

      this.playPauseClick = this.getPlayPauseClick()
      this.playPauseBtn.addEventListener('click', this.playPauseClick)

      this.resetClick = this.getResetClick()
      this.resetBtn.addEventListener('click', this.resetClick)

      this.restartClick = this.getRestartClick()
      this.restartBtn.addEventListener('click', this.restartClick)

      this.closeClick = this.getCloseClick()
      this.closeBtn.addEventListener('click', this.closeClick)

      this.setTickTock()
      this.resetTimerValues()

      // this.adjustmentFactor = 1 - (1 / this.initialSeconds)

      this.inProgress = false
      this.voice = window.speechSynthesis;
    }
  }

  disconnectedCallback () {
    this.playPauseBtn.removeEventListener('click', this.playPauseClick)
    this.closeBtn.removeEventListener('click', this.closeClick)
  }

  //  END:  standard custom element callbacks
  // ======================================================
  // START: getters & setters

  get start () {
    return this.initialValue.reduce((accumulate, value) => {
      const zero = (value < 10) ? '0' : ''
      const colon = (accumulate === '') ? '' : ':'
      return zero + Math.round(value) + colon + accumulate
    }, '')
  }

  set start (hoursMinutesSeconds) {
    this.validateStart(hoursMinutesSeconds)
  }

  get playing () {
    return this.playing
  }

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

  get autodestruct () {

  }

  set autodestruct (val) {

  }

  get nospeak () {

  }

  set nospeak (val) {

  }

  get speak () {

  }

  set speak (val) {

  }

  get norestart () {

  }

  set norestart (val) {

  }

  get noreset () {
    return this.noReset
  }

  set noreset (val) {

  }

  //  END:  getters & setters
  // ======================================================
  // START: click handlers

  startPlaying (noDelay) {
    // noDelay = (typeof noDelay !== 'boolean' || noDelay === true)

    this.setProgressTicker(20)
    this.playPauseBtn.classList.add('playing')
    this.playPauseTxt.innerHTML = 'Pause '
    this.playPauseIcon.innerHTML = '&Verbar;'
    this.play = true
  }

  pausePlaying () {
    this.resetTickTock()
    this.playPauseBtn.classList.remove('playing')
    this.playPauseTxt.innerHTML = 'Play '
    this.playPauseIcon.innerHTML = '&bigtriangledown;'
    this.play = false
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
      console.log('reset clicked')
      this.pausePlaying()
      this.resetTimerValues()
      this.numbers.innerHTML = this.currentValueToString(this.currentValue)
      this.progress.value = (0)
      this.playPauseTxt.innerHTML = 'Start '

      this.numbers.classList.remove('finished')
      this.playPauseBtn.classList.remove('finished')
    }

    return resetClick
  }

  getRestartClick () {
    const restartClick = () => {
      console.log('restart clicked')
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
    wrap.setAttribute('class', 'countdownTimer-wrapper')

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
   * initStyle() returns block of CSS for styling the <countdown-timer>
   * element's shadow DOM
   *
   * @returns {textNode} CSS string
   */
  initStyle () {
    return document.createTextNode(`
      :root {
        font-family: inherit;
      }
      .countdownTimer-wrapper {
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
   * @returns {function} callback function
   */
  tickTock () {
    this.currentSeconds -= 1

    if (this.currentSeconds >= 0) {
      if (this.currentValue[0] > 0) {
        this.currentValue[0] -= 1
      } else {
        if (this.currentSeconds >= 59) {
          this.currentValue[0] = 59
          if (this.currentValue[1] > 0) {
            this.currentValue[1] -= 1
          } else {
            if (this.currentSeconds >= 3599) {
              this.currentValue[1] = 59
              if (this.currentValue[2] > 0) {
                this.currentValue[2] -= 1
              }
            }
          }
        }
      }
    }

    this.numbers.innerHTML = this.currentValueToString(this.currentValue)
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
    const progressTickTock = () => {
      this.currentMilliseconds -= (interval + 1)
      let tmp = new Promise((resolve, reject) => {
        this.progress.value = (1 - (this.currentMilliseconds / this.initialMilliseconds))

        if (Math.floor(this.currentMilliseconds) < 0) {
          this.resetTickTock()
          let tmq = new Promise((resolve, reject) => {
            this.saySomething('The end')
          })
          // this.endSound()

          this.numbers.classList.add('finished')
          this.playPauseBtn.classList.add('finished')
        }
      })
      // if (this.currentMilliseconds > ((this.currentSeconds - 1) * 1000)) {
      if ((this.currentMilliseconds * this.adjustmentFactor) < (this.currentSeconds * 1000)) {
        let tpm = new Promise((resolve, reject) => { this.tickTock() })
      }
    }
    this.progressTicker = setInterval(progressTickTock, interval)
  }

  //  END:  timer callbacks
  // ======================================================
  // START: utility methods

  /**
   * onlyGreaterThanZero() ensures that the most significant number
   * is non-zero
   *
   * @param {array} currentValue containing seconds, minutes & hours
   *                representing the timer's duration
   * @returns {array}
   */
  onlyGreaterThanZero (currentValue) {
    let tmpValue = [currentValue[0]]

    if (typeof currentValue[2] === 'number' && currentValue[2] > 0) {
      tmpValue.push(currentValue[1])
      tmpValue.push(currentValue[2])
    } else if (typeof currentValue[1] === 'number' && currentValue[1] > 0) {
      tmpValue.push(currentValue[1])
    }

    return tmpValue
  }

  /**
   * validateStart() validates the value of the element's `start`
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
  validateStart (hoursMinutesSeconds) {
    const regex = new RegExp('^(?:(?:(?:([0-1][0-9]|2[0-4]):)?([0-5][0-9]):)?([0-5][0-9])|([6-9][0-9]|[1-9][0-9]{2,5}))$')

    if (typeof hoursMinutesSeconds === 'string') {
      let tmpStart = []
      let tmpValue = 0
      const matches = regex.exec(hoursMinutesSeconds)
      const len = matches.length
      if (len === 5 && typeof matches[4] !== 'undefined') {
        let seconds = matches[4] * 1

        if (seconds >= 86400) {
          // limit the maximum duration of the timer to 24 hours
          // (minus 1 second)
          seconds = 86399
        }

        tmpValue = seconds

        let hours = Math.floor(seconds / 3600)
        seconds -= hours * 3600
        let minutes = Math.floor(seconds / 60)
        seconds -= minutes * 60

        this.initialValue = this.onlyGreaterThanZero([seconds, minutes, hours])
        this.resetTimerValues()
        this.initialSeconds = seconds
        this.currentSeconds = seconds
      } else if (len > 0) {
        // seconds is always the last value
        tmpValue += matches[3] * 1
        tmpStart.push(matches[3] * 1)

        if (matches[2] !== '' && typeof matches[2] !== 'undefined') {
          // minutes is always the second value (if present)
          tmpValue += matches[2] * 60
          tmpStart.push(matches[2] * 1)
        } else {
          tmpStart.push(0)
        }

        if (matches[1] !== '' && typeof matches[1] !== 'undefined') {
          // hours is always the first value (if present)
          tmpValue += matches[1] * 3600
          tmpStart.push(matches[1] * 1)
        } else {
          tmpStart.push(0)
        }
      }

      if (tmpValue === 0) {
        console.error('countdown-timer must have a start value matching the following one of the following patterns: "SS", "MM:SS" or "HH:MM:SS". "' + hoursMinutesSeconds + '" does not match any of these patterns.')
        return false
      } else {
        this.initialValue = this.onlyGreaterThanZero(tmpStart)
        this.resetTimerValues()
        this.initialSeconds = tmpValue
        this.currentSeconds = tmpValue
        this.initialMilliseconds = tmpValue * 1000
        this.currentMilliseconds = tmpValue * 1000
        this.fields = tmpStart.length
        return true
      }
    } else {
      console.error('countdown-timer must have a start value matching the following one of the following patterns: "SS", "MM:SS" or "HH:MM:SS". Empty string provided.')
      return false
    }
  }

  /**
   * currentValueToString() converts the current time remaining for
   * the countdown into a human readable string
   * @param {array} currentValue seconds, minutes and hours value
   *                representing the timer remaining for the timer.
   * @returns {string} has the following structure "SS", "MM:SS" or
   *                "HH:MM:SS" depending on the value of the `start`
   *                attribute
   */
  currentValueToString (currentValue) {
    return currentValue.reduce((accumulate, value) => {
      const zero = (value < 10) ? '0' : ''
      const colon = (accumulate === '') ? '' : ':'
      return zero + Math.round(value) + colon + accumulate
    }, '')
  }

  /**
   * resetTimerValues() resets all the timer values to their original
   * state then clears the interval timers
   *
   * @returns {void}
   */
  resetTimerValues () {
    this.currentValue = this.initialValue.map(value => value)
    this.currentSeconds = this.initialSeconds
    this.currentMilliseconds = this.initialSeconds * 1000
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

  //  END:  utility methods
  // ======================================================
  // START: speak aloud methods

  saySomething (text) {
    const sayThis = new SpeechSynthesisUtterance(text)
    // sayThis.voice = 'en-au'
    this.voice.speak(sayThis)
  }

  /**
   * speakAfterSeconds() uses the Web Speech API's Speech Synthisis
   * interface to announce time intervals for the countdown-timer
   *
   * @param {string} text Information to be spoken
   * @param {number} seconds time before the text is to be spoken.
   *
   * @returns {Promise}
   */
  speakAfterSeconds (text, seconds) {
    const speakAfterSecondsCallback = async () => {
      const Milliseconds = seconds * 1000
      // SpeechSynthesis.speak(text)
      window.setTimeout(text, Milliseconds)
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
   *                 next speeking commences
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
  speakIntervalAfterSeconds (text, interval, seconds) {

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
    const tones = [440, 261.6, 830.6, 440, 261.6, 830.6, 392, 440, 261.6, 830.6, 440, 261.6, 830.6, 392]

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
      let tmp = new Promise(function (resolve, reject) {
        const toneFunc = playTone(tones[a], durationTime, offset)
        window.setTimeout(toneFunc, offset)
      })
      offset += (interval * 1000)
    }
  }

  //  END:  speak aloud methods
  // ======================================================
}

customElements.define('countdown-timer', CountdownTimer)
