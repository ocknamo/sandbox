/**
 * Voice input, through the browser's own speech recognition (the Web Speech
 * API). There is no library and no server of ours involved: the browser turns
 * speech into text, and the text goes into the field like anything typed.
 *
 * Where the recognition happens is the browser's business. Chrome and Edge,
 * for instance, send the audio to their vendor's servers to be recognised;
 * the page says so while it is listening.
 *
 * Not every browser has it (Firefox does not), so `supported` decides
 * whether the microphone button is shown at all.
 */

/** The small part of SpeechRecognition used here. The DOM typings do not
 * carry it everywhere, and Chrome still ships it only under a prefix. */
interface Recognition {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  maxAlternatives: number;
  onresult: ((event: RecognitionEvent) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

interface RecognitionEvent {
  resultIndex: number;
  results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }>;
}

type RecognitionConstructor = new () => Recognition;

function constructor(): RecognitionConstructor | undefined {
  const w = window as unknown as {
    SpeechRecognition?: RecognitionConstructor;
    webkitSpeechRecognition?: RecognitionConstructor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition;
}

/** Whether this browser can listen at all. */
export const supported = constructor() !== undefined;

export interface Handlers {
  /** The words so far, while the speaker is still talking. */
  interim(text: string): void;
  /** What was said, once the speaker stops. */
  final(text: string): void;
  /** Recognition failed, in words a reader can act on. */
  error(message: string): void;
  /** Listening is over, whichever way it ended. */
  end(): void;
}

/** What each error code means to the person holding the phone. */
const messages: Record<string, string> = {
  "not-allowed": "マイクの使用が許可されていません。ブラウザの設定で、このページのマイクを許可してください。",
  "service-not-allowed": "このブラウザでは音声入力を使えないようです。",
  "audio-capture": "マイクが見つかりませんでした。",
  "no-speech": "声が聞き取れませんでした。もう一度どうぞ。",
  network: "音声認識のサービスに接続できませんでした。",
  "language-not-supported": "このブラウザは日本語の音声入力に対応していないようです。",
};

/**
 * Start listening for one utterance, in Japanese. The recognizer stops by
 * itself when the speaker pauses; `stop` ends it early and still delivers
 * what was heard.
 */
export function listen(on: Handlers): { stop(): void } {
  const Ctor = constructor();
  if (Ctor === undefined) {
    on.error("このブラウザは音声入力に対応していません。");
    on.end();
    return { stop() {} };
  }

  const r = new Ctor();
  r.lang = "ja-JP";
  r.interimResults = true;
  r.continuous = false;
  r.maxAlternatives = 1;

  let heard = "";
  let delivered = false;

  r.onresult = (event) => {
    let text = "";
    let final = false;
    for (let i = 0; i < event.results.length; i++) {
      const result = event.results[i];
      if (result === undefined) continue;
      text += result[0].transcript;
      final = final || result.isFinal;
    }
    heard = text.trim();
    if (final) {
      delivered = true;
      on.final(heard);
    } else {
      on.interim(heard);
    }
  };
  r.onerror = (event) => {
    // "aborted" is our own stop, not a failure worth telling anyone about.
    if (event.error === "aborted") return;
    on.error(messages[event.error] ?? "音声入力でエラーが起きました。");
  };
  r.onend = () => {
    // Some browsers end without ever marking a result final. Whatever was
    // heard is still what the speaker meant.
    if (!delivered && heard !== "") on.final(heard);
    on.end();
  };

  try {
    r.start();
  } catch {
    on.error("音声入力を始められませんでした。");
    on.end();
  }
  return { stop: () => r.stop() };
}
