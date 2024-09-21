<script lang="ts">
  import { onMount } from "svelte";

  let result = '';

  onMount(() => {
    // FYI. https://developer.mozilla.org/ja/docs/Web/API/SpeechRecognition
    const SpeechRecognition = window.SpeechRecognition || webkitSpeechRecognition;
    // const SpeechGrammarList = window.SpeechGrammarList || webkitSpeechGrammarList;
    // const SpeechRecognitionEvent =
    // window.SpeechRecognitionEvent || webkitSpeechRecognitionEvent;


    const recognition = new SpeechRecognition();
    recognition.lang = 'ja-JP'
    recognition.continuous = true;

    
    recognition.onresult = (event) => {
      let joined = '';
      for (let index = 0; index < event.results.length; index++) {
        joined = joined + event.results[index][0].transcript;
      }

      result = joined;
    }
     recognition.start();

  });
</script>

<div>{ result }</div>

<style>
</style>
