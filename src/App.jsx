import React, { useState, useEffect, useRef } from "react";
import "./style.css";
import CryptoJS from "crypto-js";
import {
  FiClipboard,
  FiCheckCircle,
  FiEye,
  FiEyeOff,
  FiCopy,
  FiDownload,
  FiCornerUpLeft,
} from "react-icons/fi";
import { Analytics } from "@vercel/analytics/react";

const COLORS = {
  background: "#121212",
  surface: "#1E1E1E",
  primary: "#BB86FC",
  secondary: "#03DAC6",
  text: "#FFFFFF",
  textSecondary: "#B3B3B3",
  error: "#CF6679",
};

export default function App() {
  const [message, setMessage] = useState("");
  const [password, setPassword] = useState("");
  const [result, setResult] = useState("");
  const [isEncrypting, setIsEncrypting] = useState(true);
  const [error, setError] = useState("");
  const [isCopied, setIsCopied] = useState(false);
  const [isPasted, setIsPasted] = useState(false);
  const [isPastedPass, setIsPastedPass] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [installable, setInstallable] = useState(false);

  const passwordInputRef = useRef(null);
  const messageInputRef = useRef(null);

  useEffect(() => {
    CryptoJS.lib.WordArray.random = function (nBytes) {
      const uint8Array = new Uint8Array(nBytes);
      window.crypto.getRandomValues(uint8Array);
      const words = [];
      for (let i = 0; i < nBytes; i += 4) {
        words.push(
          (uint8Array[i] << 24) |
            (uint8Array[i + 1] << 16) |
            (uint8Array[i + 2] << 8) |
            uint8Array[i + 3]
        );
      }
      return CryptoJS.lib.WordArray.create(words, nBytes);
    };
  }, []);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setInstallable(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const processCryptoOperation = (text, key, isEncrypt) => {
    if (!key || key.length === 0) {
      setError("Пароль не может быть пустым.");
      return "";
    }

    try {
      if (isEncrypt) {
        const encrypted = CryptoJS.AES.encrypt(text, key);
        return encrypted.toString();
      } else {
        const decryptedBytes = CryptoJS.AES.decrypt(text, key);

        if (!decryptedBytes || decryptedBytes.sigBytes === 0) {
          setError("Неверный пароль или поврежденный шифр.");
          return "";
        }

        const decryptedText = decryptedBytes.toString(CryptoJS.enc.Utf8);
        if (!decryptedText.trim()) {
          setError("Дешифрованный текст пуст или неверный пароль.");
          return "";
        }
        return decryptedText;
      }
    } catch (e) {
      setError("Ошибка: " + e.message);
      return "";
    }
  };

  const handleAction = () => {
    if (!message || !password) {
      setError("Введите сообщение и пароль.");
      setResult("");
      return;
    }
    setError("");
    const processed = processCryptoOperation(message, password, isEncrypting);
    setResult(processed);
    setIsCopied(false);
  };

  const handleReply = () => {
    setIsEncrypting(true);
    setMessage("");
    setResult("");
    setError("");
    setIsCopied(false);
    setTimeout(() => {
      messageInputRef.current?.focus();
    }, 50);
  };

  const handleClear = () => {
    setMessage("");
    setPassword("");
    setResult("");
    setError("");
    setIsCopied(false);
  };

  const toggleMode = () => {
    setIsEncrypting(!isEncrypting);
    setMessage("");
    setPassword("");
    setResult("");
    setError("");
  };

  const copyToClipboard = async () => {
    if (result) {
      await navigator.clipboard.writeText(result);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 1000);
    }
  };

  const pasteToMessage = async () => {
    const text = await navigator.clipboard.readText();
    setMessage(text);
    setIsPasted(true);
    setTimeout(() => {
      setIsPasted(false);
      passwordInputRef.current?.focus();
    }, 100);
  };

  const pasteToPassword = async () => {
    const text = await navigator.clipboard.readText();
    setPassword(text);
    setIsPastedPass(true);
    setTimeout(() => setIsPastedPass(false), 100);
  };

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setInstallable(false);
    }
    setDeferredPrompt(null);
  };

  return (
    <div className="container">
      <h1 className="title">Crypt 🔒</h1>

      <div className="toggle-container" onClick={toggleMode}>
        <div
          className="toggle-slider"
          style={{
            transform: isEncrypting ? "translateX(5px)" : "translateX(131px)",
          }}
        />
        <span className={`toggle-text ${isEncrypting ? "active" : ""}`}>
          Шифровать
        </span>
        <span className={`toggle-text ${!isEncrypting ? "active" : ""}`}>
          Дешифровать
        </span>
      </div>

      <div className="input-wrapper">
        <textarea
          ref={messageInputRef}
          className={`input ${isEncrypting ? "" : "single-line"}`}
          placeholder={
            isEncrypting ? "Сообщение для шифрования" : "Шифр для дешифрования"
          }
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
        <button className="icon-button-left" onClick={pasteToMessage}>
          {isPasted ? (
            <FiCheckCircle color={COLORS.secondary} size={18} />
          ) : (
            <FiClipboard color={COLORS.primary} size={18} />
          )}
        </button>
      </div>

      <div className="input-wrapper">
        <input
          type={showPassword ? "text" : "password"}
          className="input pass-input"
          placeholder="Пароль"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          ref={passwordInputRef}
          onCopy={(e) => e.preventDefault()}
          onCut={(e) => e.preventDefault()}
          onContextMenu={(e) => e.preventDefault()}
          onKeyDown={(e) => {
            const isCopy =
              (e.ctrlKey || e.metaKey) && (e.key === "c" || e.key === "C");
            const isCut =
              (e.ctrlKey || e.metaKey) && (e.key === "x" || e.key === "X");
            if (isCopy || isCut) e.preventDefault();
          }}
        />
        <div className="icon-buttons-right">
          <button
            className="icon-button"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? (
              <FiEyeOff className="mt-2" color={COLORS.primary} size={18} />
            ) : (
              <FiEye className="mt-2" color={COLORS.primary} size={18} />
            )}
          </button>
          <button className="icon-button " onClick={pasteToPassword}>
            {isPastedPass ? (
              <FiCheckCircle color={COLORS.secondary} size={18} />
            ) : (
              <FiClipboard color={COLORS.primary} size={18} />
            )}
          </button>
        </div>
      </div>

      {error && <p className="error">{error}</p>}

      <button className="action-button" onClick={handleAction}>
        {isEncrypting ? "Зашифровать" : "Расшифровать"}
      </button>
      <button className="clear-button" onClick={handleClear}>
        Очистить
      </button>

      {result && (
        <div className="result-container">
          <p className="result-label">
            {isEncrypting ? "Ваш шифр:" : "Результат:"}
          </p>
          <div className="result-content">
            <pre className={isEncrypting ? "result-shyf" : "result-text"}>
              {result}
            </pre>

            {!isEncrypting && (
              <button
                className="icon-button"
                title="Ответить"
                onClick={handleReply}
                style={{ marginRight: 8 }}
              >
                <FiCornerUpLeft color={COLORS.primary} size={18} />
              </button>
            )}

            <button className="icon-button" onClick={copyToClipboard}>
              {isCopied ? (
                <FiCheckCircle color={COLORS.secondary} size={18} />
              ) : (
                <FiCopy color={COLORS.primary} size={18} />
              )}
            </button>
          </div>
        </div>
      )}

      {installable && (
        <button className="install-button" onClick={handleInstall}>
          <FiDownload /> Установить приложение
        </button>
      )}
      <Analytics />
    </div>
  );
}
