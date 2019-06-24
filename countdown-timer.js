// references:
//   https://developers.google.com/web/fundamentals/web-components/customelements
//  https://developer.mozilla.org/en-US/docs/Web/Web_Components/Using_custom_elements

class CountdownTimer extends HTMLElement {
  constructor () {
    super()

    this.initialStart = [0, 0, 0]
    this.currentValue = []

    this.selfDestruct = false
    this.noReconfigure = false
    this.restartOnReset = true
    this.play = false
    this.playPauseBtn = null
    this.resetBtn = null
    this.restartBtn = null
    this.closeBtn = null
    this.numbers = null
    this.ticker = null

    let shadowRoot = this.attachShadow({ mode: 'open' })
    shadowRoot.appendChild(this.getDOM())
  }

  static get observedAttributes () {
    return ['start', 'playing']
  }

  get start () {
    return this.initialStart.reduce((accumulate, value) => {
      const zero = (value < 10) ? '0' : ''
      const colon = (accumulate === '') ? '' : ':'
      return zero + Math.round(value) + colon + accumulate
    }, '')
  }

  set start (hoursMinutesSeconds) {
    this.validateStart(hoursMinutesSeconds)
  }

  get playing () {
    return this.hasAttribute('playing')
  }

  set playing (val) {
    if (val) {
      this.setAttribute('playing', 'playing')
    } else {
      this.removeAttribute('playing')
    }
  }

  get autoDestruct () {

  }

  connectedCallback () {
    if (this.hasAttribute('start') && this.validateStart(this.getAttribute('start'))) {
      this.numbers.innerHTML = this.currentValueToString(this.initialStart)

      this.playPauseClick = this.getPlayPauseClick()
      this.playPauseBtn.addEventListener('click', this.playPauseClick)

      this.resetClick = this.getResetClick()
      this.resetBtn.addEventListener('click', this.resetClick)

      this.restartClick = this.getRestartClick()
      this.restartBtn.addEventListener('click', this.restartClick)

      this.closeClick = this.getCloseClick()
      this.closeBtn.addEventListener('click', this.closeClick)
    }
  }

  disconnectedCallback () {
    this.playPauseBtn.removeEventListener('click', this.playPauseClick)
    this.closeBtn.removeEventListener('click', this.closeClick)
  }

  playPause (event) {

  }

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

  onlyGreaterThanZero (currentValue) {
    let tmpValue = [currentValue[0]]

    const useMinutes = (typeof currentValue[1] === 'number' && currentValue[1] > 0)
    const useHours = (typeof currentValue[2] === 'number' && currentValue[2] > 0)

    if (useHours === true) {
      tmpValue.push(currentValue[1])
      tmpValue.push(currentValue[2])
    } else if (useMinutes === true) {
      tmpValue.push(currentValue[1])
    }

    return tmpValue
  }

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

        this.initialStart = this.onlyGreaterThanZero([seconds, minutes, hours])
        this.resetCurrentValue()
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
        this.initialStart = this.onlyGreaterThanZero(tmpStart)
        this.resetCurrentValue()
        this.initialSeconds = tmpValue
        this.currentSeconds = tmpValue
        this.fields = tmpStart.length
        return true
      }
    } else {
      console.error('countdown-timer must have a start value matching the following one of the following patterns: "SS", "MM:SS" or "HH:MM:SS". Empty string provided.')
      return false
    }
  }

  currentValueToString (currentValue) {
    return currentValue.reduce((accumulate, value) => {
      const zero = (value < 10) ? '0' : ''
      const colon = (accumulate === '') ? '' : ':'
      return zero + Math.round(value) + colon + accumulate
    }, '')
  }

  getTickTock () {
    const tickTock = () => {
      console.log('tickTock()')
      console.log('this.currentSeconds:', this.currentSeconds)
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
      if (Math.floor(this.currentSeconds) === 0) {
        this.resetCurrentValue()
        window.clearInterval(this.ticker)
        this.numbers.classList.add('finished')
        this.playPauseBtn.classList.add('finished')
      }
      this.numbers.innerHTML = this.currentValueToString(this.currentValue)
      this.progress.value = (1 - (this.currentSeconds / this.initialSeconds))
    }
    return tickTock
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

  startPlaying (noDelay) {
    noDelay = (typeof noDelay !== 'boolean' || noDelay === true)

    const tickTock = this.getTickTock()
    if (noDelay) {
      tickTock()
    }

    this.ticker = window.setInterval(tickTock, 1000)
    this.playPauseBtn.classList.add('playing')
    this.playPauseTxt.innerHTML = 'Pause '
    this.playPauseIcon.innerHTML = '&Verbar;'
    this.play = true
  }

  pausePlaying () {
    window.clearInterval(this.ticker)
    this.ticker = null

    this.playPauseBtn.classList.remove('playing')
    this.playPauseTxt.innerHTML = 'Play '
    this.playPauseIcon.innerHTML = '&bigtriangledown;'
    this.play = false
  }

  getResetClick () {
    const resetClick = () => {
      console.log('reset clicked')
      this.pausePlaying()
      this.currentSeconds = this.initialSeconds
      this.resetCurrentValue()
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
      if (this.ticker !== null) {
        window.clearInterval(this.ticker)
      }

      this.playPauseBtn.removeEventListener('click', this.playPauseClick)
      this.resetBtn.removeEventListener('click', this.resetClick)
      this.restartBtn.removeEventListener('click', this.restartClick)
      this.closeBtn.removeEventListener('click', this.closeClick)
      this.remove()
    }

    return closeClick
  }

  resetCurrentValue () {
    this.currentValue = this.initialStart.map(value => value)
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
}

customElements.define('countdown-timer', CountdownTimer)
