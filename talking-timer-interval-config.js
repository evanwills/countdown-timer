/* globals HTMLElement, customElements, talkingTimerExternalDefaults */

class TalkingTimerIntervalConfig extends HTMLElement {
  constructor () {
    super()

    this.allEvery = null
    this.multiplier = 0
    this.firstLast = null
    this.interval = false
    this.unit = 's'

    let shadowRoot = this.attachShadow({ mode: 'open' })
    shadowRoot.appendChild(this.getDOM())
  }

  static get observedAttributes () {
    return ['start', 'playing']
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

  //  END:  getters & setters
  // ======================================================
  // START: click handlers

  //  END:  click handlers
  // ======================================================
  // START: DOM builders

  //  END:  DOM builders
  // ======================================================
}

customElements.define('talking-timer-interval-config', TalkingTimerIntervalConfig)
