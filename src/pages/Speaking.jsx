import { useState, useEffect, useRef } from "react";
import Layout from "../components/Layout";
import {
  getAllSpeaking,
  saveSpeakingResult,
  getSpeakingHistory,
} from "../firebase/firestore";
import { useAuth } from "../context/AuthContext";
const LEVELS = ["JPD133", "N5", "N4", "N3", "N2", "N1"];

function shuffleArray(arr) {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function Speaking() {
  const { currentUser } = useAuth();
  const [allItems, setAllItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLevel, setSelectedLevel] = useState("N5");
  const [currentItem, setCurrentItem] = useState(null);
  const [userAnswer, setUserAnswer] = useState("");
  const [result, setResult] = useState(null);
  const [sessionScore, setSessionScore] = useState({ total: 0, sumPercent: 0 });
  const [isListening, setIsListening] = useState(false);
  const [micSupported, setMicSupported] = useState(true);
  const [recordingSupported, setRecordingSupported] = useState(true);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState(null);
  const [micError, setMicError] = useState("");
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [revealedKeywordCount, setRevealedKeywordCount] = useState(0);

  const [sessionEnded, setSessionEnded] = useState(false);
  const [endReason, setEndReason] = useState(null);
  const [answeredCount, setAnsweredCount] = useState(0);

  const [queue, setQueue] = useState([]);

  const recognitionRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const streamRef = useRef(null);

  const loadHistory = async () => {
    setLoadingHistory(true);
    try {
      const data = await getSpeakingHistory(currentUser.uid, 20);
      setHistory(data);
    } catch (err) {
      console.error("Lỗi tải lịch sử:", err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const toggleHistory = () => {
    if (!showHistory) loadHistory();
    setShowHistory((prev) => !prev);
  };

  const itemsInLevel = allItems.filter((i) => i.jlptLevel === selectedLevel);

  useEffect(() => {
    getAllSpeaking()
      .then((data) => {
        setAllItems(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setMicSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "ja-JP";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setUserAnswer((prev) => prev + transcript);
    };

    recognition.onerror = (event) => {
      console.error("Lỗi nhận diện giọng nói:", event.error);
    };

    recognition.onend = () => {
      setIsListening(false);
      stopRecording();
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.stop();
    };
  }, []);

  useEffect(() => {
    if (!("MediaRecorder" in window) || !navigator.mediaDevices?.getUserMedia) {
      setRecordingSupported(false);
    }
  }, []);

  const startRecording = async () => {
    if (!recordingSupported) return;
    try {
      setMicError("");
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      audioChunksRef.current = [];

      const recorder = new MediaRecorder(stream);
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        if (recordedAudioUrl) URL.revokeObjectURL(recordedAudioUrl);
        setRecordedAudioUrl(URL.createObjectURL(blob));
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
    } catch (err) {
      console.error("Lỗi truy cập micro:", err);
      setMicError("Không thể truy cập micro. Vui lòng cấp quyền và thử lại.");
    }
  };

  const stopRecording = () => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  const toggleListening = async () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      setUserAnswer("");
      if (recordedAudioUrl) {
        URL.revokeObjectURL(recordedAudioUrl);
        setRecordedAudioUrl(null);
      }
      await startRecording();
      recognitionRef.current?.start();
      setIsListening(true);
    }
  };

  const pickNextFromQueue = (currentQueue) => {
    if (itemsInLevel.length === 0) {
      setCurrentItem(null);
      setQueue([]);
      return;
    }

    let workingQueue = currentQueue;

    if (workingQueue.length === 0) {
      let ids = shuffleArray(itemsInLevel.map((i) => i.id));

      if (currentItem && ids[0] === currentItem.id && ids.length > 1) {
        [ids[0], ids[1]] = [ids[1], ids[0]];
      }
      workingQueue = ids;
    }

    const nextId = workingQueue[0];
    const remaining = workingQueue.slice(1);
    setQueue(remaining);

    const nextItem = itemsInLevel.find((i) => i.id === nextId);
    setCurrentItem(nextItem || null);
  };

  const startPractice = () => {
    setSessionScore({ total: 0, sumPercent: 0 });
    setAnsweredCount(0);
    setSessionEnded(false);
    setEndReason(null);
    pickNextFromQueue([]);
    setUserAnswer("");
    setResult(null);
    setRecordedAudioUrl(null);
    setShowHint(false);
    setRevealedKeywordCount(0);
  };

  const handleRetry = () => {
    startPractice();
  };

  const playQuestion = () => {
    if (!currentItem) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(currentItem.audioText);
    utterance.lang = "ja-JP";
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  };

  const revealNextKeyword = () => {
    setRevealedKeywordCount((prev) =>
      Math.min(prev + 1, currentItem.keywords.length),
    );
  };

  const toggleHint = () => {
    setShowHint((prev) => !prev);
  };

  const gradeAnswer = async () => {
    if (!userAnswer.trim()) return;
    const matched = [];
    const missing = [];
    currentItem.keywords.forEach((keyword) => {
      if (userAnswer.includes(keyword)) matched.push(keyword);
      else missing.push(keyword);
    });
    const percent = Math.round(
      (matched.length / currentItem.keywords.length) * 100,
    );
    setResult({ matched, missing, percent });
    setSessionScore((prev) => ({
      total: prev.total + 1,
      sumPercent: prev.sumPercent + percent,
    }));

    try {
      await saveSpeakingResult(
        currentUser.uid,
        currentItem.id,
        currentItem.jlptLevel,
        userAnswer,
        percent,
        matched,
      );
    } catch (err) {
      console.error("Lỗi lưu lịch sử Speaking:", err);
    }

    const newAnsweredCount = answeredCount + 1;
    setAnsweredCount(newAnsweredCount);

    if (percent < 100) {
      setSessionEnded(true);
      setEndReason("wrong");
      return;
    }

    if (newAnsweredCount >= itemsInLevel.length) {
      setSessionEnded(true);
      setEndReason("completed");
    }
  };

  const nextQuestion = () => {
    pickNextFromQueue(queue);
    setUserAnswer("");
    setResult(null);
    window.speechSynthesis.cancel();
    if (isListening) {
      recognitionRef.current?.stop();
    }
    if (recordedAudioUrl) {
      URL.revokeObjectURL(recordedAudioUrl);
      setRecordedAudioUrl(null);
    }
    setShowHint(false);
    setRevealedKeywordCount(0);
  };

  const clearAnswer = () => {
    setUserAnswer("");
    if (recordedAudioUrl) {
      URL.revokeObjectURL(recordedAudioUrl);
      setRecordedAudioUrl(null);
    }
  };

  const getFeedbackLabel = (percent) => {
    if (percent === 100) return { text: "Xuất sắc!", color: "text-green-700" };
    if (percent >= 50)
      return { text: "Khá tốt, còn thiếu vài ý", color: "text-amber-700" };
    return { text: "Cần cải thiện thêm", color: "text-red-700" };
  };

  if (loading) {
    return (
      <Layout>
        <p className="text-stone-600">Đang tải dữ liệu...</p>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="mb-4">
        <span className="inline-block bg-black text-white text-xs font-bold px-3 py-1 rounded-full">
          Phòng Speaking
        </span>
      </div>

      {/* Thanh chọn cấp độ - cho phép cuộn ngang trên mobile thay vì bóp méo/xuống dòng lộn xộn */}
      <div className="flex gap-2 mb-4 sm:mb-6 overflow-x-auto pb-1 -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap">
        {LEVELS.map((level) => (
          <button
            key={level}
            onClick={() => {
              setSelectedLevel(level);
              setCurrentItem(null);
              setResult(null);
              setQueue([]);
              setSessionEnded(false);
              setEndReason(null);
            }}
            className={`flex-shrink-0 px-3 sm:px-4 py-2 rounded-lg font-bold text-sm border-2 border-black transition-colors ${
              selectedLevel === level
                ? "bg-black text-white"
                : "bg-[#f5e6a8] text-stone-800 hover:bg-[#f0dd8a]"
            }`}
          >
            {level}
          </button>
        ))}
      </div>

      <div className="mb-4 sm:mb-6">
        <button
          onClick={toggleHistory}
          className="text-sm font-bold text-stone-600 underline hover:text-stone-800"
        >
          {showHistory ? "Ẩn lịch sử luyện tập" : "📜 Xem lịch sử luyện tập"}
        </button>

        {showHistory && (
          <div className="mt-3 bg-white border-2 border-black rounded-xl p-3 sm:p-4 max-h-64 overflow-y-auto">
            {loadingHistory ? (
              <p className="text-stone-500 text-sm">Đang tải...</p>
            ) : history.length === 0 ? (
              <p className="text-stone-500 text-sm">
                Chưa có lịch sử luyện tập nào.
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                {history.map((h) => (
                  <div
                    key={h.id}
                    className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 border-b border-stone-200 pb-2 last:border-0"
                  >
                    <div className="min-w-0">
                      <span className="inline-block bg-black text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full mr-2">
                        {h.jlptLevel}
                      </span>
                      <span className="text-sm text-stone-800 break-words">
                        {h.userAnswer}
                      </span>
                    </div>
                    <span
                      className={`text-sm font-bold flex-shrink-0 ${
                        h.percent === 100
                          ? "text-green-700"
                          : h.percent >= 50
                            ? "text-amber-700"
                            : "text-red-700"
                      }`}
                    >
                      {h.percent}%
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {itemsInLevel.length === 0 ? (
        <p className="text-stone-600">
          Chưa có câu hỏi Speaking nào cho cấp độ {selectedLevel}.
        </p>
      ) : !currentItem ? (
        <div className="max-w-lg mx-auto bg-[#f5e6a8] border-2 border-black rounded-xl p-5 sm:p-8 text-center">
          <p className="text-stone-700 mb-4 text-sm sm:text-base">
            Cấp độ {selectedLevel} có {itemsInLevel.length} câu hỏi Speaking.
          </p>
          <button
            onClick={startPractice}
            className="bg-black text-white px-6 py-3 rounded-lg font-bold hover:bg-stone-800 w-full sm:w-auto"
          >
            ▶ Bắt đầu luyện nói
          </button>
        </div>
      ) : (
        <div className="max-w-lg mx-auto">
          <div className="flex justify-between items-center mb-3 sm:mb-4">
            <span className="text-xs sm:text-sm font-bold text-stone-700">
              Đã trả lời: {answeredCount}/{itemsInLevel.length} · Trung bình:{" "}
              {sessionScore.total > 0
                ? Math.round(sessionScore.sumPercent / sessionScore.total)
                : 0}
              %
            </span>
          </div>

          <div className="bg-[#f5e6a8] border-2 border-black rounded-xl p-4 sm:p-8 mb-4 text-center">
            {currentItem.type === "image" ? (
              <>
                <img
                  src={currentItem.imageUrl}
                  alt="Câu hỏi"
                  className="w-full max-h-48 sm:max-h-64 object-contain border-2 border-black rounded-lg bg-white mb-3"
                />
                <p className="font-bold text-stone-800 mb-3 text-sm sm:text-base">
                  {currentItem.promptText}
                </p>

                {currentItem.audioText && (
                  <button
                    onClick={playQuestion}
                    className="w-12 h-12 sm:w-14 sm:h-14 bg-black text-white rounded-full flex items-center justify-center text-lg sm:text-xl mx-auto hover:bg-stone-800"
                  >
                    🔊
                  </button>
                )}
              </>
            ) : (
              <>
                <button
                  onClick={playQuestion}
                  className="w-14 h-14 sm:w-16 sm:h-16 bg-black text-white rounded-full flex items-center justify-center text-xl sm:text-2xl mx-auto mb-3 hover:bg-stone-800"
                >
                  🔊
                </button>
                <p className="text-stone-600 text-xs sm:text-sm">
                  Bấm để nghe câu hỏi, sau đó trả lời bên dưới
                </p>
              </>
            )}

            {!result && (
              <button
                onClick={nextQuestion}
                className="mt-4 text-sm text-stone-600 underline hover:text-stone-800"
              >
                🎲 Câu khác
              </button>
            )}
          </div>

          <div className="mb-4">
            <div className="flex items-center justify-between mb-2 gap-2">
              <span className="text-sm font-bold text-stone-700">
                Câu trả lời của bạn
              </span>
              {micSupported && (
                <button
                  onClick={toggleListening}
                  disabled={result !== null}
                  className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full border-2 border-black text-xs sm:text-sm font-bold transition-colors disabled:opacity-40 flex-shrink-0 ${
                    isListening
                      ? "bg-red-600 text-white animate-pulse"
                      : "bg-white text-stone-800 hover:bg-stone-100"
                  }`}
                >
                  🎙️{" "}
                  <span className="hidden sm:inline">
                    {isListening ? "Đang nghe... (bấm để dừng)" : "Nói"}
                  </span>
                  <span className="sm:hidden">
                    {isListening ? "Dừng" : "Nói"}
                  </span>
                </button>
              )}
            </div>

            {!result && (
              <div className="flex gap-2 mb-2 flex-wrap">
                {currentItem.hint && (
                  <button
                    type="button"
                    onClick={toggleHint}
                    className="text-xs px-3 py-1.5 rounded-full border-2 border-black bg-white hover:bg-stone-100 font-medium"
                  >
                    💡 {showHint ? "Ẩn gợi ý" : "Xem gợi ý"}
                  </button>
                )}
                <button
                  type="button"
                  onClick={revealNextKeyword}
                  disabled={revealedKeywordCount >= currentItem.keywords.length}
                  className="text-xs px-3 py-1.5 rounded-full border-2 border-black bg-white hover:bg-stone-100 font-medium disabled:opacity-40"
                >
                  🔑 Hé lộ từ khóa ({revealedKeywordCount}/
                  {currentItem.keywords.length})
                </button>
              </div>
            )}

            {showHint && currentItem.hint && (
              <div className="bg-amber-50 border border-amber-400 rounded-lg p-2 mb-2">
                <p className="text-sm text-amber-800">💡 {currentItem.hint}</p>
              </div>
            )}

            {revealedKeywordCount > 0 && (
              <div className="flex flex-wrap gap-1 mb-2">
                {currentItem.keywords
                  .slice(0, revealedKeywordCount)
                  .map((k) => (
                    <span
                      key={k}
                      className="bg-blue-100 text-blue-800 text-sm px-2 py-1 rounded-full border border-blue-500"
                    >
                      {k}
                    </span>
                  ))}
              </div>
            )}

            {!micSupported && (
              <p className="text-amber-700 text-xs mb-2">
                Trình duyệt này không hỗ trợ nhận diện giọng nói, vui lòng gõ
                câu trả lời hoặc dùng Chrome/Edge.
              </p>
            )}
            {micError && (
              <p className="text-red-600 text-xs mb-2">{micError}</p>
            )}

            <textarea
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              placeholder="Nhập câu trả lời hoặc bấm nút Nói..."
              disabled={result !== null}
              className="w-full p-3 rounded-lg border-2 border-black h-24 bg-white disabled:bg-stone-100 text-base"
            />

            {recordedAudioUrl && (
              <div className="mt-2 flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-2 bg-white border-2 border-black rounded-lg p-2">
                <span className="text-xs sm:text-sm text-stone-600 flex-shrink-0">
                  🎧 Bản ghi của bạn:
                </span>
                <audio
                  controls
                  src={recordedAudioUrl}
                  className="w-full sm:flex-1 h-8"
                />
              </div>
            )}

            {userAnswer && !result && (
              <button
                onClick={clearAnswer}
                className="text-xs text-stone-500 underline mt-1"
              >
                Xóa và nhập lại
              </button>
            )}
          </div>

          {!result ? (
            <button
              onClick={gradeAnswer}
              disabled={!userAnswer.trim()}
              className="w-full bg-black text-white p-3 rounded-lg font-bold hover:bg-stone-800 disabled:opacity-40"
            >
              Chấm điểm
            </button>
          ) : (
            <div className="bg-white border-2 border-black rounded-xl p-4 sm:p-5">
              <p
                className={`font-bold text-base sm:text-lg mb-3 ${getFeedbackLabel(result.percent).color}`}
              >
                {getFeedbackLabel(result.percent).text} ({result.percent}%)
              </p>

              {result.matched.length > 0 && (
                <div className="mb-2">
                  <p className="text-xs text-stone-500 mb-1">Từ khóa đã có:</p>
                  <div className="flex flex-wrap gap-1">
                    {result.matched.map((k) => (
                      <span
                        key={k}
                        className="bg-green-100 text-green-800 text-sm px-2 py-1 rounded-full border border-green-600"
                      >
                        ✓ {k}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {result.missing.length > 0 && (
                <div className="mb-3">
                  <p className="text-xs text-stone-500 mb-1">Còn thiếu:</p>
                  <div className="flex flex-wrap gap-1">
                    {result.missing.map((k) => (
                      <span
                        key={k}
                        className="bg-red-100 text-red-700 text-sm px-2 py-1 rounded-full border border-red-500"
                      >
                        ✕ {k}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {recordedAudioUrl && (
                <div className="mb-3 flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-2 bg-stone-100 rounded-lg p-2">
                  <span className="text-xs sm:text-sm text-stone-600 flex-shrink-0">
                    🎧 Bản ghi của bạn:
                  </span>
                  <audio
                    controls
                    src={recordedAudioUrl}
                    className="w-full sm:flex-1 h-8"
                  />
                </div>
              )}

              <div className="bg-stone-100 rounded-lg p-3 mb-4">
                <p className="text-xs text-stone-500 mb-1">Câu trả lời mẫu</p>
                <p className="font-medium text-stone-900 break-words">
                  {currentItem.sampleAnswer}
                </p>
              </div>

              {sessionEnded ? (
                <div className="bg-stone-100 border-2 border-black rounded-lg p-4 text-center">
                  <p className="font-bold text-base sm:text-lg mb-1">
                    {endReason === "completed"
                      ? "🎉 Hoàn thành xuất sắc!"
                      : "Phiên luyện tập kết thúc"}
                  </p>
                  <p className="text-xs sm:text-sm text-stone-600 mb-3">
                    Bạn đã trả lời {answeredCount}/{itemsInLevel.length} câu
                    {endReason === "wrong" &&
                      " — dừng lại vì có câu trả lời chưa khớp đủ từ khóa"}
                  </p>
                  <button
                    onClick={handleRetry}
                    className="w-full bg-black text-white p-3 rounded-lg font-bold hover:bg-stone-800"
                  >
                    🔄 Làm lại từ đầu
                  </button>
                </div>
              ) : (
                <button
                  onClick={nextQuestion}
                  className="w-full bg-black text-white p-3 rounded-lg font-bold hover:bg-stone-800"
                >
                  Câu tiếp theo →
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </Layout>
  );
}

export default Speaking;
