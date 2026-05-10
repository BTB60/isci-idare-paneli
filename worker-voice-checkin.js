/**
 * Brauzer Web Speech API — işçi mikrofonla işdə olduğunu təsdiqləyir.
 * Chrome/Edge yaxşı dəstəkləyir; azərbaycan dili məhdud ola bilər — az/tr qarışığı qəbul olunur.
 */
(function () {
  function getRecognitionCtor() {
    return window.SpeechRecognition || window.webkitSpeechRecognition || null;
  }

  window.WorkerVoiceCheckin = {
    isSupported() {
      return !!getRecognitionCtor();
    },

    /**
     * @param {{ lang?: string, onInterim?: (t:string)=>void, onFinal?: (t:string)=>void, onError?: (msg:string)=>void }} opts
     * @returns {{ stop: ()=>void } | null}
     */
    startListening(opts) {
      const Ctor = getRecognitionCtor();
      if (!Ctor) {
        opts.onError && opts.onError('Bu brauzerdə səs tanıma dəstəklənmir.');
        return null;
      }

      const rec = new Ctor();
      rec.lang = opts.lang || 'az-AZ';
      rec.interimResults = true;
      rec.continuous = false;
      rec.maxAlternatives = 1;

      rec.onresult = (ev) => {
        let text = '';
        for (let i = ev.resultIndex; i < ev.results.length; i++) {
          text += ev.results[i][0].transcript;
        }
        const isFinal = ev.results[ev.results.length - 1].isFinal;
        if (isFinal) opts.onFinal && opts.onFinal(text.trim());
        else opts.onInterim && opts.onInterim(text.trim());
      };

      rec.onerror = (ev) => {
        const msg =
          ev.error === 'not-allowed'
            ? 'Mikrofon icazəsi verilməyib.'
            : ev.error === 'no-speech'
              ? 'Heç bir səs eşidilmədi.'
              : ev.error === 'network'
                ? 'Şəbəkə xətası (tanıma xidməti).'
                : 'Səs tanıma xətası: ' + ev.error;
        opts.onError && opts.onError(msg);
      };

      rec.onend = () => {};

      try {
        rec.start();
      } catch (e) {
        opts.onError && opts.onError(String(e.message || e));
        return null;
      }

      return {
        stop() {
          try {
            rec.stop();
          } catch (_) {}
        }
      };
    }
  };
})();
