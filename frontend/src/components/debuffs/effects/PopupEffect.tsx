export function PopupEffect({ onComplete }: { onComplete: () => void }) {
  return (
    <div className="effect-popup">
      <div className="effect-popup-window">
        <div className="effect-popup-titlebar">⚠️ Системное сообщение</div>
        <div className="effect-popup-body">
          <p>Произошла критическая ошибка.<br />Рекомендуется перезапустить.</p>
        </div>
        <div className="effect-popup-footer">
          <button className="effect-popup-btn" onClick={onComplete}>OK</button>
        </div>
      </div>
    </div>
  );
}
