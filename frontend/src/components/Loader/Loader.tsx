import './Loader.css'

export function Loader() {
  return (
    <div className="loader-container">
      <div className="loader-ring">
        <div className="loader-dot"></div>
      </div>
      <p className="loader-text">Загрузка данных...</p>
    </div>
  );
}