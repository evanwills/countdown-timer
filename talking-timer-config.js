/* globals HTMLElement, customElements, talkingTimerExternalDefaults */

class TalkingTimerConfig extends HTMLElement {
  constructor () {
    super()

    this.config = {
      autoDestruct: -1,
      autoReset: false,
      noCloseBtn: false,
      noEdit: false,
      noEndChime: false,
      noPause: false,
      noReconfigure: false,
      noReset: false,
      noRestart: false,
      noSayEnd: false,
      selfDestruct: false,
      sayStart: false,
      priority: ''
    }

    this.endText = ''
    this.startText = ''
    this.sayDefault = ''
    this.say = ''

    this.duration = ''

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

customElements.define('talking-timer-config', TalkingTimerConfig)
