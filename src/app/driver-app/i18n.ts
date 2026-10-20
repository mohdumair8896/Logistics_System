// ─── Driver trip link: Hindi and English text ─────────────────────────────────
// Short, plain sentences: most drivers read Hindi more easily than English, so Hindi is the default and
// the toggle switches the whole page. The location notice is always shown in both languages.

export type Lang = 'hi' | 'en';

export interface NoticeVars {
  transporter: string | null; // workspace name; null when the trip couldn't be loaded (e.g. offline)
  tripId: string;
}

const en = {
  langName: 'English',
  appTitle: 'Driver trip link',
  truck: 'Truck',
  trip: 'Trip',
  online: 'Network on',
  offline: 'No network',
  changeLanguage: 'Change language',
  start: 'Start sharing location',
  stop: 'Stop sharing',
  showNotice: 'Location notice',
  idle: 'Location is not being shared',
  requesting: 'Finding GPS…',
  sending: 'Sending location…',
  sent: (time: string) => `Location sent at ${time}`,
  queued: (n: number) => `No network. ${n} location point${n === 1 ? '' : 's'} saved on this phone, will send when online.`,
  queuedRetry: (n: number) => `${n} location point${n === 1 ? '' : 's'} saved on this phone. Could not reach the server; trying again shortly.`,
  queuedMemoryOnly: 'Keep this page open: saved points are lost if you close it.',
  stopped: 'Sharing stopped.',
  stoppedQueued: (n: number) => `Sharing stopped. ${n} saved point${n === 1 ? '' : 's'} will still be sent when online.`,
  tripClosed: 'Trip closed. Location sharing has stopped.',
  droppedOnClose: (n: number) => `${n} unsent point${n === 1 ? ' was' : 's were'} deleted from this phone.`,
  linkInvalid: 'This link no longer works. Ask your dispatcher for a new one.',
  linkIncomplete: 'This link is incomplete. Ask your dispatcher to send it again.',
  noGps: 'This phone or browser has no GPS. Open the link in Chrome.',
  permissionDenied: 'Location permission is off. Allow location for this site in your browser settings, then tap Start again.',
  positionUnavailable: 'No GPS signal. Move to an open place and try again.',
  timeout: 'GPS is taking too long. Check that location is on, then try again.',
  gpsError: 'GPS error. Try again.',
  speed: 'Speed',
  accuracy: 'GPS accuracy',
  tips: [
    'Keep this page open while driving.',
    'Keep the screen on. Plug in the charger on long trips.',
    'No network? Keep driving. Points are saved and sent later.',
  ],
};

type Strings = typeof en;

const hi: Strings = {
  langName: 'हिंदी',
  appTitle: 'ड्राइवर ट्रिप लिंक',
  truck: 'गाड़ी',
  trip: 'ट्रिप',
  online: 'नेटवर्क है',
  offline: 'नेटवर्क नहीं',
  changeLanguage: 'भाषा बदलें',
  start: 'लोकेशन शेयर करना शुरू करें',
  stop: 'शेयर करना रोकें',
  showNotice: 'लोकेशन सूचना',
  idle: 'लोकेशन शेयर नहीं हो रही',
  requesting: 'GPS ढूँढ रहे हैं…',
  sending: 'लोकेशन भेज रहे हैं…',
  sent: (time: string) => `लोकेशन ${time} पर भेजी गई`,
  queued: (n: number) => `नेटवर्क नहीं है। ${n} लोकेशन इस फ़ोन में सेव हैं, नेटवर्क आने पर भेज देंगे।`,
  queuedRetry: (n: number) => `${n} लोकेशन इस फ़ोन में सेव हैं। सर्वर से जुड़ नहीं पाए, थोड़ी देर में फिर भेजेंगे।`,
  queuedMemoryOnly: 'यह पेज खुला रखें: बंद करने पर सेव लोकेशन मिट जाएँगी।',
  stopped: 'शेयर करना बंद है।',
  stoppedQueued: (n: number) => `शेयर करना बंद है। सेव की हुई ${n} लोकेशन नेटवर्क आने पर फिर भी भेजी जाएँगी।`,
  tripClosed: 'ट्रिप बंद हो गई। लोकेशन शेयर करना बंद हो गया है।',
  droppedOnClose: (n: number) => `न भेजी गई ${n} लोकेशन इस फ़ोन से मिटा दी गईं।`,
  linkInvalid: 'यह लिंक अब काम नहीं करता। डिस्पैचर से नया लिंक माँगें।',
  linkIncomplete: 'यह लिंक अधूरा है। डिस्पैचर से दोबारा भेजने को कहें।',
  noGps: 'इस फ़ोन या ब्राउज़र में GPS नहीं है। लिंक Chrome में खोलें।',
  permissionDenied: 'लोकेशन की अनुमति बंद है। ब्राउज़र सेटिंग में इस साइट के लिए लोकेशन चालू करें, फिर दोबारा "शुरू करें" दबाएँ।',
  positionUnavailable: 'GPS सिग्नल नहीं मिल रहा। खुली जगह पर जाकर फिर कोशिश करें।',
  timeout: 'GPS में बहुत देर लग रही है। देखें कि लोकेशन चालू है, फिर कोशिश करें।',
  gpsError: 'GPS में गड़बड़ी। फिर कोशिश करें।',
  speed: 'स्पीड',
  accuracy: 'GPS सटीकता',
  tips: [
    'गाड़ी चलाते समय यह पेज खुला रखें।',
    'स्क्रीन चालू रखें। लंबी ट्रिप पर चार्जर लगाए रखें।',
    'नेटवर्क नहीं है? चलते रहें। लोकेशन सेव होकर बाद में भेजी जाएगी।',
  ],
};

export const STRINGS: Record<Lang, Strings> = { en, hi };

/** The DPDP notice shown before location sharing starts. The browser's permission prompt is not a notice. */
export function noticeText(lang: Lang, { transporter, tripId }: NoticeVars) {
  if (lang === 'hi') {
    return {
      title: 'लोकेशन शेयर करने से पहले पढ़ें',
      points: [
        transporter
          ? `यह लिंक आपके फ़ोन की लोकेशन ${transporter} को भेजता है, जो ट्रिप ${tripId} चला रहे हैं।`
          : `यह लिंक ट्रिप ${tripId} के लिए आपके फ़ोन की लोकेशन उस ट्रांसपोर्टर को भेजता है जिसने आपको यह लिंक भेजा।`,
        'क्यों: ताकि वे और उनके ग्राहक देख सकें कि माल कहाँ है और डिलीवरी की योजना बना सकें।',
        'क्या जाता है: आपकी लोकेशन, स्पीड और GPS सटीकता, लगभग हर 5 सेकंड में, सिर्फ़ तब जब यह पेज खुला हो और शेयरिंग चालू हो।',
        'नेटवर्क न हो तो लोकेशन इसी फ़ोन में सेव रहती है और नेटवर्क आने पर भेजी जाती है। भेजने के बाद, या ट्रिप बंद होने पर, यह फ़ोन से मिट जाती है।',
        'कब बंद होगी: जब आप "शेयर करना रोकें" दबाएँ या यह पेज बंद करें। ट्रिप बंद होते ही ट्रैकिंग अपने आप रुक जाती है।',
        `सवाल या शिकायत: ${transporter ?? 'उस ट्रांसपोर्टर'} से बात करें${transporter ? '' : ' जिसने लिंक भेजा'}।`,
        'इसके बाद फ़ोन लोकेशन की अनुमति माँगेगा।',
      ],
      agree: 'ठीक है, शुरू करें',
      ok: 'ठीक है',
    };
  }
  return {
    title: 'Before you share your location',
    points: [
      transporter
        ? `This link sends your phone's location to ${transporter}, the transporter running trip ${tripId}.`
        : `This link sends your phone's location for trip ${tripId} to the transporter who sent you the link.`,
      'Why: so they and their customer can see where the goods are and plan the delivery.',
      'What is sent: your location, speed and GPS accuracy, about every 5 seconds, only while this page is open and sharing is on.',
      'With no network, points are saved on this phone and sent when the network returns. They are deleted from the phone once sent, or when the trip closes.',
      'When it stops: when you tap "Stop sharing" or close this page. Tracking stops by itself as soon as the trip is closed.',
      `Questions or complaints: speak to ${transporter ?? 'the transporter who sent the link'}.`,
      'Next, your phone will ask to allow location.',
    ],
    agree: 'OK, start',
    ok: 'OK',
  };
}
