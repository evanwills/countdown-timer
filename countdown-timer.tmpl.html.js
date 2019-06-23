// references:
//   https://developers.google.com/web/fundamentals/web-components/customelements
//  https://developer.mozilla.org/en-US/docs/Web/Web_Components/Using_custom_elements

class CountdownTimer extends HTMLElement {
  constructor () {
    super()

    this.initialStart = [0, 0, 0]
    this.currentValue = 0

    this.selfDestruct = false
    this.noReconfigure = false
    this.restartOnReset = true
    this.play = false

    let shadowRoot = this.attachShadow({mode: 'open'})
    shadowRoot.appendChild(tmpl.content.cloneNode(true))

  }

  get start () {
    return this.initialStart.reduce((accumulate, value) => {
      const zero = (value < 10) ? '0' : ''
      const colon = (accumulate === '') ? '' : ':'
      return zero + Math.round(value) + colon + accumulate
    }, '')
  }

  set start (hoursMinutesSeconds) {
    const regex = new RegExp('^(?:(?:(?:([0-1][0-9]|2[0-4]):)?([0-5][0-9]):)?([0-5][0-9])|([6-9][0-9]|[1-9][0-9]{2,5}))$')

    if (typeof hoursMinutesSeconds === 'string') {
      let tmpStart = []
      let tmpValue = 0
      const matches = regex.exec(hoursMinutesSeconds)
      const len = matches.length
      if (len === 5) {
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

        this.initialStart = [seconds, minutes, hours]
      } else if (len === 4) {
        // seconds is always the last value
        tmpValue += matches[3] * 1
        tmpStart.push(matches[3] * 1)

        if (matches[2] !== '') {
          // minutes is always the second value (if present)
          tmpValue += matches[2] * 60
          tmpStart.push(matches[2] * 1)
        } else {
          tmpStart.push(0)
        }

        if (matches[1] !== '') {
          // hours is always the first value (if present)
          tmpValue += matches[1] * 3600
          tmpStart.push(matches[1] * 1)
        } else {
          tmpStart.push(0)
        }
      }

      if (tmpValue === 0) {
        console.error('countdown-timer must have a start value matching the following one of the following patterns: "SS", "MM:SS" or "HH:MM:SS". "' + hoursMinutesSeconds + '" does not match any of these patterns.')
      } else {
        this.initialStart = tmpStart
        this.currentValue = tmpValue
      }
    } else {
      console.error('countdown-timer must have a start value matching the following one of the following patterns: "SS", "MM:SS" or "HH:MM:SS". Empty string provided.')
    }
  }

  get autoDestruct () {

  }
}

customElements.define('countdown-timer', CountdownTimer)
