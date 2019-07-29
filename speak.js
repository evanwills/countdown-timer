
if ('speechSynthesis' in window) {
  // Create a new utterance for the specified text and add it to
  // the queue.
  function speak(text, voiceName, volume, rate, pitch) {
    // Create a new instance of SpeechSynthesisUtterance.
    var msg = new SpeechSynthesisUtterance();
  
    // Set the text.
    msg.text = text;

    voiceName = (typeof voiceName != 'string') ? voiceName : 'English (Australia)';
    volume = (typeof volume === 'number' && volume >= 0 && volume <= 1) ? volume : 1;
    rate = (typeof rate === 'number' && rate >= 0.1 && rate <= 10) ? rate : 1;
    pitch = (typeof pitch === 'number' && pitch >= 0 && pitch <= 2) ? pitch : 1;

    // Set the attributes.
    msg.volume = parseFloat(volume);
    msg.rate = parseFloat(rate);
    msg.pitch = parseFloat(pitchInput.value);
  
    // If a voice has been selected, find the voice and set the
    // utterance instance's voice attribute.
    if (voiceName) {
      msg.voice = speechSynthesis.getVoices().filter(function(voice) { return voice.name == voiceName; })[0];
    }
  
  // Queue this utterance.
    window.speechSynthesis.speak(msg);
  }

} else {
  function speak(text, voiceName, volume, rate, pitch) {}
}
