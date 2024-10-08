// メールフォーマットごとの設定
const MAIL_SETTINGS = [
  {
    criteria: "from:noreply@notify.qqeng.com subject:【QQEnglish】レッスン予約完了のお知らせ is:unread",
    titlePrefix: "QQ/",
    colorId: "7", // ピーコック（peacock）
    extractInfo: extractQQInfo_ // QQEnglishの情報を抽出する関数
  },
  {
    criteria: "from:donotreply@rarejob.com subject:【レアジョブ英会話】レッスン予約完了 is:unread",
    titlePrefix: "rarejob",
    colorId: "10", // バジル（basil）
    extractInfo: extractRareJobInfo_ // RareJobの情報を抽出する関数
  },
];

const CANCEL_SETTINGS = [
  {
    criteria: "from:noreply@notify.qqeng.com subject:【QQEnglish】キャンセル受付 is:unread",
    extractCancelInfo: extractQQInfo_ // QQEnglishのキャンセル情報を抽出する関数
  },
  {
    criteria: "from:noreply@notify.qqeng.com subject:【レアジョブ英会話】予約キャンセルのお知らせ is:unread",
    extractCancelInfo: extractRareJobInfo_ // RareJobのキャンセル情報を抽出する関数
  },
];

/**
 * メイン関数
 * 各メール設定に対して未読メールを処理
 */
function main() {
  // 予約メールの処理
  MAIL_SETTINGS.forEach(setting => {
    eachMessage_(setting.criteria, message => {
      try {
        processMessage_(message, setting.titlePrefix, setting.colorId, setting.extractInfo);
        message.markRead(); // カレンダー登録成功後に既読にする
      } catch (e) {
        Logger.log(`Error create processing message: ${e.message}`);
        // エラーが発生した場合はメールを既読にしない
      }
    });
  });

  // キャンセルメールの処理
  CANCEL_SETTINGS.forEach(setting => {
    eachMessage_(setting.criteria, message => {
      try {
        processCancelMessage_(message, setting.extractCancelInfo);
        message.markRead(); // カレンダー削除成功後に既読にする
      } catch (e) {
        Logger.log(`Error delete processing message: ${e.message}`);
        // エラーが発生した場合はメールを既読にしない
      }
    });
  });
}

/**
 * 指定された検索条件に一致するすべてのメールスレッドを検索し、各メールを処理
 *
 * @param {string} criteria - 検索条件
 * @param {function} callback - 各メールに対して実行するコールバック関数
 */
function eachMessage_(criteria, callback) {
  GmailApp.search(criteria).forEach(thread => {
    thread.getMessages().forEach(message => {
      callback(message); // メールを処理するコールバック関数を呼び出す
    });
  });
}

/**
 * メールの本文と件名から必要な情報を抽出し、Googleカレンダーにイベントを作成
 *
 * @param {GmailMessage} message - 処理対象のGmailメッセージ
 * @param {string} titlePrefix - イベントタイトルのプレフィックス
 * @param {string} colorId - カレンダーイベントの色ID
 * @param {function} extractInfo - メールから情報を抽出する関数
 */
function processMessage_(message, titlePrefix, colorId, extractInfo) {
  const cal = CalendarApp.getDefaultCalendar();
  const body = message.getBody(); // メールの本文を取得
  
  // メールから日時やカリキュラム情報を抽出
  const { startDateString, startTimeString, endTimeString, curriculum } = extractInfo(body);
  
  const title = `${titlePrefix}${curriculum}`; // イベントのタイトルを作成
  const startTime = new Date(`${startDateString}T${startTimeString}:00`); // イベントの開始時刻
  const endTime = new Date(`${startDateString}T${endTimeString}:00`); // イベントの終了時刻

  const event = cal.createEvent(title, startTime, endTime); // Googleカレンダーにイベントを作成
  event.setColor(colorId); // イベントに色を設定

  Logger.log(`[${title}] ${startTime} - ${endTime}`);
}

/**
 * キャンセルメールを処理し、該当するカレンダーイベントを削除します。
 *
 * @param {GmailMessage} message - 処理対象のGmailメッセージ
 * @param {function} extractCancelInfo - キャンセルメールから情報を抽出する関数
 */
function processCancelMessage_(message, setting) {
  const cal = CalendarApp.getDefaultCalendar();
  const body = message.getBody(); // メールの本文を取得

  // メールからキャンセルされた日時情報を抽出
  const { startDateString, startTimeString, endTimeString } = setting.extractCancelInfo(body);

  const startTime = new Date(`${startDateString}T${startTimeString}:00`); // イベントの開始時刻
  const endTime = new Date(`${startDateString}T${endTimeString}:00`); // イベントの終了時刻

  // 指定された時間範囲内のイベントを検索し、該当するイベントを削除します
  const events = cal.getEvents(startTime, endTime);
  console.log();

  events.forEach(event => {
    
    const title = event.getTitle();
    const isExist = title.indexOf('QQ/') !== -1 || title.indexOf('レアジョブ') !== -1; // NOTE: 2種類しかないので、ひとまずべた書き
    if (isExist) {
      event.deleteEvent();
      Logger.log(`Deleted: [${title}] ${event.getStartTime().toLocaleString()} - ${event.getEndTime().toLocaleString()}`);
    }
  });
}

/**
 * QQEnglishメールの本文から日時とカリキュラム情報を抽出する関数
 *
 * @param {string} body - メールの本文
 * @returns {string} return.startDateString - 抽出された開始日付
 * @returns {string} return.startTimeString - 抽出された開始時刻
 * @returns {string} return.endTimeString - 抽出された終了時刻
 * @returns {string} return.curriculum - 抽出されたカリキュラム
 */
function extractQQInfo_(body) {
  const dateMatch = body.match(/日付： (\d{4}-\d{2}-\d{2})/); // 日付を抽出
  const timeMatch = body.match(/時間： (\d{2}:\d{2})-(\d{2}:\d{2})/); // 時間を抽出
  const curriculumMatch = body.match(/カリキュラム： (.*)/); // カリキュラムを抽出
  
  return {
    startDateString: dateMatch ? dateMatch[1] : "",
    startTimeString: timeMatch ? timeMatch[1] : "",
    endTimeString: timeMatch ? timeMatch[2] : "",
    curriculum: curriculumMatch ? curriculumMatch[1] : ""
  };
}

/**
 * RareJobメールの本文から日時情報を抽出する関数（カリキュラムは空白）
 *
 * @param {string} body - メールの本文
 * @returns {string} return.startDateString - 抽出された開始日付
 * @returns {string} return.startTimeString - 抽出された開始時刻
 * @returns {string} return.endTimeString - 抽出された終了時刻
 * @returns {string} return.curriculum - 抽出されたカリキュラム
 */
function extractRareJobInfo_(body) {
  const dateMatch = body.match(/予約日時：(\d{4}\/\d{2}\/\d{2})\(.\) (\d{2}:\d{2}) - (\d{2}:\d{2})/); // 予約日時を抽出
  
  return {
    startDateString: dateMatch ? dateMatch[1].replace(/\//g, '-') : "", // 日付形式を変更
    startTimeString: dateMatch ? dateMatch[2] : "",
    endTimeString: dateMatch ? dateMatch[3] : "",
    curriculum: "" // RareJobにはカリキュラム情報がないため空白
  };
}
