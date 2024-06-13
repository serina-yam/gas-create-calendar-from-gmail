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

/**
 * メイン関数
 * 各メール設定に対して未読メールを処理
 */
function main() {
  MAIL_SETTINGS.forEach(setting => {
    eachMessage_(setting.criteria, message => {
      try {
        processMessage_(message, setting.titlePrefix, setting.colorId, setting.extractInfo);
        message.markRead(); // カレンダー登録成功後に既読にする
      } catch (e) {
        Logger.log(`Error processing message: ${e.message}`);
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
  const subject = message.getSubject(); // メールの件名を取得
  
  // メールから日時やカリキュラム情報を抽出
  const { startDateString, startTimeString, endTimeString, curriculum } = extractInfo(subject, body);
  
  const title = `${titlePrefix}${curriculum}`; // イベントのタイトルを作成
  const startTime = new Date(`${startDateString}T${startTimeString}:00`); // イベントの開始時刻
  const endTime = new Date(`${startDateString}T${endTimeString}:00`); // イベントの終了時刻

  const event = cal.createEvent(title, startTime, endTime); // Googleカレンダーにイベントを作成
  event.setColor(colorId); // イベントに色を設定

  Logger.log(`[${title}] ${startTime} - ${endTime}`);
}

/**
 * QQEnglishメールの本文から日時とカリキュラム情報を抽出する関数
 *
 * @param {string} subject - メールの件名
 * @param {string} body - メールの本文
 * @returns {Object} - 抽出された情報を含むオブジェクト
 * @returns {string} return.startDateString - 抽出された開始日付
 * @returns {string} return.startTimeString - 抽出された開始時刻
 * @returns {string} return.endTimeString - 抽出された終了時刻
 * @returns {string} return.curriculum - 抽出されたカリキュラム
 */
function extractQQInfo_(subject, body) {
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
 * @param {string} subject - メールの件名
 * @param {string} body - メールの本文
 * @returns {Object} - 抽出された情報を含むオブジェクト
 * @returns {string} return.startDateString - 抽出された開始日付
 * @returns {string} return.startTimeString - 抽出された開始時刻
 * @returns {string} return.endTimeString - 抽出された終了時刻
 * @returns {string} return.curriculum - 抽出されたカリキュラム
 */
function extractRareJobInfo_(subject, body) {
  const dateMatch = body.match(/予約日時：(\d{4}\/\d{2}\/\d{2})\(.\) (\d{2}:\d{2}) - (\d{2}:\d{2})/); // 予約日時を抽出
  
  return {
    startDateString: dateMatch ? dateMatch[1].replace(/\//g, '-') : "", // 日付形式を変更
    startTimeString: dateMatch ? dateMatch[2] : "",
    endTimeString: dateMatch ? dateMatch[3] : "",
    curriculum: "" // RareJobにはカリキュラム情報がないため空白
  };
}
