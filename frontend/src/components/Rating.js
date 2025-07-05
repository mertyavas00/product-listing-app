import React from "react";
import { BsStarFill, BsStarHalf, BsStar } from "react-icons/bs";
import "./Rating.css";

function Rating({ score }) {
  const stars = [];
  const roundedScore = Math.round(score * 2) / 2; // Skoru 0.5'in katlarına yuvarla

  //5 yıldız için döngü
  for (let i = 1; i <= 5; i++) {
    if (i <= roundedScore) {
      //Tam yıldız
      stars.push(<BsStarFill key={i} />);
    } else if (
      i === Math.ceil(roundedScore) &&
      !Number.isInteger(roundedScore)
    ) {
      //Yarım yıldız
      stars.push(<BsStarHalf key={i} />);
    } else {
      //Boş yıldız
      stars.push(<BsStar key={i} />);
    }
  }

  return (
    <div className="rating-container">
      <div className="stars">{stars}</div>
      <span className="score-text">{score.toFixed(1)}/5</span>
    </div>
  );
}

export default Rating;
