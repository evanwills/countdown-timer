/* globals HTMLElement, customElements */

class DurationInput extends HTMLElement {
  constructor () {
    super()

    this._values = {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0
    }

    this._min = 0
    this._max = 86400 // 1 day
    this._step = 1
    this._show = {
      days: false,
      hours: true,
      minutes: true,
      seconds: true,
      labels: true
    }

    this.isInvalid = false

    /**
     * layout defines the layout of the duration input block
     * Options are:
     *   * 'horizontal' - labels for each input field are placed
     *                  directly above their input field (like a
     *                  column heading in a table)
     *   * 'vertical' - labels are placed beside each input with each
     *                  input/label pair being on their own line
     *   * 'inline'  -  labels are placed beside each field.
     *                  All fields an labels are together on the
     *                  same line
     */
    this._layout = 'inline'

    let shadowRoot = this.attachShadow({ mode: 'open' })
    shadowRoot.appendChild(this.getDOM())
  }

  static get observedAttributes () {
    return ['totalSeconds', 'durationString', 'value']
  }

  // ======================================================
  // START: standard custom element callbacks

  connectedCallback () {

  }

  disconnectedCallback () {
  }

  //  END:  standard custom element callbacks
  // ======================================================
  // START: getters & setters

  /**
   * value() returns a object containing the individuale values for
   * hours, minutes and seconds for total time of the duration input
   *
   * @returns {object} with `hours`, `minutes` & `seconds` properties
   */
  get values () {
    return this._values
  }

  set values (input) {
    const isValidUnit = (allUnits, unitName) => {
      return (typeof allUnits[unitName] !== 'undefined' && Number.isNaN(allUnits[unitName]) === false && allUnits[unitName] >= 0)
    }
    let output = false
    if (typeof input === 'object') {
      if (isValidUnit(input, 'days') === true) {
        this._values.days = input.days
        output = true
      }
      if (isValidUnit(input, 'hours') === true) {
        this._values.hours = input.hours
        output = true
      }
      if (isValidUnit(input, 'minutes') === true) {
        this._values.minutes = input.minutes
        output = true
      }
      if (isValidUnit(input, 'seconds') === true) {
        this._values.seconds = input.seconds
        output = true
      }
    }
    return output
  }

  /**
   * totalSeconds() returns the value of the duration input in Seconds
   *
   * @returns {number} an integer representing the total time value of the duration
   */
  get totalSeconds () {
    return this.valueToSeconds()
  }

  set totalSeconds (input) {
    if (Number.isNaN(input) !== false && input >= this.min && input <= this.max) {
      this._values = this.secondsToDurationObj(parseInt(input))
    }
  }

  /**
   * values() returns a string representation of the total time of
   * the duration input
   *
   * @returns {string} the total time value of the duration
   *                   represented in the format: DD:HH:MM:SS
   */
  get value () {
    return this.valuesToDuration()
  }

  set value (input) {
    if (typeof input === 'string') {
      this._values = this.stringToDuration(input)
      return true
    }
    return false
  }

  get max () {
    return this._max
  }

  set max (input) {
    let tmpMax
    try {
      tmpMax = this.parseMinMax(input)
    } catch (e) {
      console.error(e.errorMessage)
      return false
    }
    if (tmpMax > this.min) {
      this._max = tmpMax
      return true
    }
    return false
  }

  get min () {
    return this._min
  }

  set min (input) {
    let tmpMin
    try {
      tmpMin = this.parseMinMax(input)
    } catch (e) {
      console.error(e.errorMessage)
      return false
    }
    if (tmpMin >= 0 && tmpMin < this.max) {
      this._min = tmpMin
      return true
    }
    return false
  }

  get isValid () {
    return !this.isInvalid
  }

  set isValid (input) {
    console.error('Do not try and set durationInput.isValid! it is readOnly')
    return false
  }

  get layout () {
    return this._layout
  }

  set layout (input) {
    if (typeof input === 'string') {
      const tmp = input.toLocaleLowerCase()
      if (tmp === 'inline' || tmp === 'horizontal' || tmp === 'vertical') {
        this._layout = tmp
        return true
      }
    }
    return false
  }

  //  END:  getters & setters
  // ======================================================
  // START: click handlers

  //  END:  click handlers
  // ======================================================
  // START: DOM builders

  /**
   * initStyle() returns block of CSS for styling the <talking-timer>
   * element's shadow DOM
   *
   * @returns {textNode} CSS string
   */
  initCSS () {
    const css = `
      :host {
      }

      @media screen {
        .sr-only {
          display: inline-block;
          height: 1px;
          margin: -1px 0 0 -1px;
          opacity: 0;
          width: 1px;
        }
      }
      input {
        width: 2.85em;
        padding: 0.25em 0 0.25em 0.5em;
        border: 0.05em solid #eee;
        font-family: 'Courier New', Courier, monospace;
      }
      input::before {
        content: ':';
      }
      input:first-of-type::before {
        display: none;
      }
      .inline label {
        display: inline-block;
        height: 1px;
        margin: -1px 0 0 -1px;
        opacity: 0;
        width: 1px;
      }
    `

    const styleElement = document.createElement('style')
    styleElement.setAttribute('type', 'text/css')
    styleElement.appendChild(document.createTextNode(css))

    return styleElement
  }

  getDOM () {
    const maxObj = this.secondsToDurationObj(this.max)
    const wrapper = document.createElement('div')
    wrapper.setAttribute('class', this.layout)

    if (this._show.days === true) {
      const days = this.getInput('Days', maxObj.days, 'DD')
      wrapper.appendChild(days.label)
      wrapper.appendChild(days.field)
    }

    if (this._show.hours === true) {
      const hours = this.getInput('Hours', maxObj.hours, 'HH')
      wrapper.appendChild(hours.label)
      wrapper.appendChild(hours.field)
    }

    if (this._show.minutes === true) {
      const minutes = this.getInput('Minutes', maxObj.minutes, 'MM')
      wrapper.appendChild(minutes.label)
      wrapper.appendChild(minutes.field)
    }

    if (this._show.seconds === true) {
      const seconds = this.getInput('Seconds', maxObj.seconds, 'SS')
      wrapper.appendChild(seconds.label)
      wrapper.appendChild(seconds.field)
    }

    wrapper.appendChild(this.initCSS())

    return wrapper
  }

  getInput (labelTxt, max, placeholder) {
    const id = labelTxt.toLocaleLowerCase()
    const inputField = document.createElement('input')
    inputField.setAttribute('type', 'number')
    inputField.setAttribute('step', 1)
    inputField.setAttribute('min', '0')
    inputField.setAttribute('max', max)
    inputField.setAttribute('id', id)
    inputField.setAttribute('placeholder', placeholder)
    inputField.setAttribute('class', id + '-input')

    const labelElement = document.createElement('label')
    labelElement.setAttribute('for', id)
    labelElement.setAttribute('class', id + '-label')
    labelElement.appendChild(document.createTextNode(labelTxt))

    return { field: inputField, label: labelElement }
  }

  //  END:  DOM builders
  // ======================================================
  // START: utility methods

  /**
   * stringToDuration() validates the value of the element's `start`
   * attribute
   *
   * __NOTE:__ the parsed value of `start` must be less than 24 hours
   *
   * __NOTE ALSO:__ this method also assignes parsed values to object
   *       properties
   *
   * @param {string} hoursMinutesSeconds the string value of the
   *                 element's `start` attribute
   *
   * @returns {boolean} TRUE if hoursMinutesSeconds can be parsed.
   *          FALSE otherwise
   */
  stringToDuration (hoursMinutesSeconds, max) {
    const regex = new RegExp('^(?:(?:(?:(?:(?:([1-9][0-9]*):)?([0-1]?[0-9]|2[0-4])):)?([0-5]?[0-9]):)?([0-5]?[0-9])|([6-9][0-9]|[1-9][0-9]{2,5}))$')
    const errorMessage = 'Duration must be a string matching the following one of the following patterns: "SS", "MM:SS", "HH:MM:SS" or "DD:HH:MM:SS". '

    let output = {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      totalSeconds: 0,
      duration: hoursMinutesSeconds
    }

    if (typeof max !== 'number') {
      max = -1
    }

    if (typeof hoursMinutesSeconds === 'string') {
      const matches = regex.exec(hoursMinutesSeconds)

      if (matches !== null) {
        const len = matches.length

        if (len === 6 && typeof matches[5] !== 'undefined') {
          let seconds = Number.parseInt(matches[6], 10)

          if (max > -1 && seconds > max) {
            // limit the maximum duration of the timer to what every
            // was specified
            seconds = max
          }

          const tmp = this.secondsToDurationObj(seconds)

          output = {
            ...tmp,
            totalSeconds: seconds,
            duration: this.durationToString(tmp)
          }
        } else if (len > 0) {
          if (typeof matches[1] === 'string' && matches[1] !== '') {
            output.days = Number.parseInt(matches[1], 10)
          }

          if (typeof matches[2] === 'string' && matches[2] !== '') {
            output.hours = Number.parseInt(matches[2], 10)
          }

          if (typeof matches[3] === 'string' && matches[3] !== '') {
            output.minutes = Number.parseInt(matches[3], 10)
          }

          output.seconds = Number.parseInt(matches[4], 10)
          output.totalSeconds = this.durationToSeconds(output)
        }
      } else {
        console.error(errorMessage + '"' + hoursMinutesSeconds + '" does not match any of these patterns.')
        output.druation = ''
      }
    } else {
      console.error(errorMessage + 'Empty string provided.')
      output.druation = ''
    }
    return output
  }

  durationToString (durationObj) {
    if (this.valuesToSeconds() === 0) {
      return '0'
    }
    let output = ''
    let highest = false

    const prefixZero = (input, next) => {
      let output = ''

      if (next === true) {
        output = ':'
        if (input < 10) {
          if (input <= 0) {
            return '00'
          }
          output += '0'
        }
      } else if (input <= 0) {
        return ''
      }
      return output + input.toString(10)
    }

    if (durationObj.days > 0) {
      highest = true
      output = durationObj.days.toString(10)
    }

    output += prefixZero(durationObj.hours, highest)
    if (durationObj.hours > 0) {
      highest = true
    }

    output += prefixZero(durationObj.minutes, highest)
    if (durationObj.minutes > 0) {
      highest = true
    }

    output += prefixZero(durationObj.seconds, highest)

    return output
  }

  durationToSeconds (durationObj) {
    return (durationObj.days * 86400) + (durationObj.hours * 3600) + (durationObj.minutes * 60) + durationObj.seconds
  }

  secondsToDurationObj (seconds) {
    const units = ['days', 'hours', 'minutes', 'seconds']
    const multipliers = {
      days: 8640,
      hours: 3600,
      minutes: 60,
      seconds: 1
    }
    let output = {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0
    }
    let remainder = seconds

    for (let a = 0; a < 4; a += 1) {
      const field = units[a]
      output[field] = Math.floor(remainder / multipliers[field])
      remainder = remainder - (output[field] * multipliers[field])
    }

    return output
  }

  parseMinMax (defaultValue, input) {
    const errorMessage = 'Duration min & max must be a number representing the number of seconds the value should be or a number plus the unit of time ("m": minute, "h": hour, "d": day) (e.g. "1.5h" = 1 hour, 30 minutes)'
    const regex = new RegExp('^([1-9][0-9]*(\\.[0-9]+))(d|h|m)?', 'i')

    if (typeof input !== 'string') {
      if (typeof input !== 'number') {
        throw new Error(errorMessage + ' "' + typeof input + '" given.')
      } else {
        return input
      }
    }

    const parts = regex.exec(input)

    if (parts !== null) {
      let throughput = (typeof parts[2] !== 'undefined') ? parseFloat(parts[1]) : parseInt(parts[1])
      if (typeof parts[3] !== 'undefined') {
        switch (parts[3]) {
          case 'd':
            return throughput * 86400
          case 'h':
            return throughput * 3600
          case 'm':
            return throughput * 60
        }
      }
      return throughput
    } else {
      throw new Error(errorMessage + ' "' + input + '" is not a valid min/max value')
    }
  }

  //  END:  utility methods
  // ======================================================
}

customElements.define('duration-input', DurationInput)
