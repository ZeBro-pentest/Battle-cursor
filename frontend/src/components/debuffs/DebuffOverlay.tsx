import type React from "react";
import { TarEffect } from "./effects/TarEffect";
import { SmudgeEffect } from "./effects/SmudgeEffect";
import { StaticEffect } from "./effects/StaticEffect";
import { CarouselEffect } from "./effects/CarouselEffect";
import { FlashEffect } from "./effects/FlashEffect";
import { EraserEffect } from "./effects/EraserEffect";
import { AnonimEffect } from "./effects/AnonimEffect";
import { AdvertisingEffect } from "./effects/AdvertisingEffect";
import { CaptchaEffect } from "./effects/CaptchaEffect";
import { DarknessEffect } from "./effects/DarknessEffect";
import { CollapseEffect } from "./effects/CollapseEffect";
import { VandalEffect } from "./effects/VandalEffect";
import { ShakeEffect } from "./effects/ShakeEffect";
import { ZoomEffect } from "./effects/ZoomEffect";
import { PopupEffect } from "./effects/PopupEffect";
import { TimerEffect } from "./effects/TimerEffect";
import { PaletteSwapEffect } from "./effects/PaletteSwapEffect";
import { BlockingEffect } from "./effects/BlockingEffect";
import { FreezeEffect } from "./effects/FreezeEffect";
import { PuzzleEffect } from "./effects/PuzzleEffect";
import { RiddleEffect } from "./effects/RiddleEffect";
import { QuizEffect } from "./effects/QuizEffect";
import { CodeEffect } from "./effects/CodeEffect";
import { MazeEffect } from "./effects/MazeEffect";
import { AgreementEffect } from "./effects/AgreementEffect";
import { SurveyEffect } from "./effects/SurveyEffect";
import { PasswordEffect } from "./effects/PasswordEffect";
import { ScanEffect } from "./effects/ScanEffect";
import { VerifyEffect } from "./effects/VerifyEffect";
import { RickrollEffect } from "./effects/RickrollEffect";
import { QuestionsEffect } from "./effects/QuestionsEffect";
import { ExamEffect } from "./effects/ExamEffect";
import { WeaponsEffect } from "./effects/WeaponsEffect";
import { RouletteEffect } from "./effects/RouletteEffect";
import { DvdEffect } from "./effects/DvdEffect";
import { SirenEffect } from "./effects/SirenEffect";
import { HissEffect } from "./effects/HissEffect";
import { EchoEffect } from "./effects/EchoEffect";
import { PyhinduEffect } from "./effects/PyhinduEffect";
import { RingtoneEffect } from "./effects/RingtoneEffect";
import { WhisperEffect } from "./effects/WhisperEffect";
import { GlitchEffect } from "./effects/GlitchEffect";
import { StormEffect } from "./effects/StormEffect";
import { ZombieEffect } from "./effects/ZombieEffect";
import { BombsEffect } from "./effects/BombsEffect";
import "./DebuffOverlay.css";

interface DebuffOverlayProps {
  activeEffects: Set<string>;
  onEffectComplete: (id: string) => void;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
}

export function DebuffOverlay({
  activeEffects,
  onEffectComplete,
  canvasRef,
}: DebuffOverlayProps) {
  return (
    <>
      {activeEffects.has("tar") && <TarEffect />}
      {activeEffects.has("smudge") && <SmudgeEffect />}
      {activeEffects.has("static") && <StaticEffect />}
      {activeEffects.has("carousel") && <CarouselEffect canvasRef={canvasRef} />}
      {activeEffects.has("flash") && (
        <FlashEffect onComplete={() => onEffectComplete("flash")} />
      )}
      {activeEffects.has("eraser") && <EraserEffect canvasRef={canvasRef} />}
      {activeEffects.has("anonim") && <AnonimEffect />}
      {activeEffects.has("advertising") && <AdvertisingEffect />}
      {activeEffects.has("captcha") && (
        <CaptchaEffect onComplete={() => onEffectComplete("captcha")} />
      )}
      {activeEffects.has("darkness") && <DarknessEffect canvasRef={canvasRef} />}
      {activeEffects.has("collapse") && <CollapseEffect />}
      {activeEffects.has("vandal") && <VandalEffect canvasRef={canvasRef} />}
      {activeEffects.has("shake") && <ShakeEffect />}
      {activeEffects.has("zoom") && <ZoomEffect canvasRef={canvasRef} />}
      {activeEffects.has("popup") && (
        <PopupEffect onComplete={() => onEffectComplete("popup")} />
      )}
      {activeEffects.has("timer") && <TimerEffect />}
      {activeEffects.has("palette_swap") && <PaletteSwapEffect />}
      {activeEffects.has("blocking") && (
        <BlockingEffect onComplete={() => onEffectComplete("blocking")} />
      )}
      {activeEffects.has("freeze") && <FreezeEffect canvasRef={canvasRef} />}
      {activeEffects.has("puzzle") && (
        <PuzzleEffect onComplete={() => onEffectComplete("puzzle")} />
      )}
      {activeEffects.has("riddle") && (
        <RiddleEffect onComplete={() => onEffectComplete("riddle")} />
      )}
      {activeEffects.has("quiz") && (
        <QuizEffect onComplete={() => onEffectComplete("quiz")} />
      )}
      {activeEffects.has("code") && (
        <CodeEffect onComplete={() => onEffectComplete("code")} />
      )}
      {activeEffects.has("maze") && (
        <MazeEffect onComplete={() => onEffectComplete("maze")} />
      )}
      {activeEffects.has("agreement") && (
        <AgreementEffect onComplete={() => onEffectComplete("agreement")} />
      )}
      {activeEffects.has("survey") && (
        <SurveyEffect onComplete={() => onEffectComplete("survey")} />
      )}
      {activeEffects.has("password") && (
        <PasswordEffect onComplete={() => onEffectComplete("password")} />
      )}
      {activeEffects.has("scan") && (
        <ScanEffect onComplete={() => onEffectComplete("scan")} />
      )}
      {activeEffects.has("verify") && (
        <VerifyEffect onComplete={() => onEffectComplete("verify")} />
      )}
      {activeEffects.has("rickroll") && (
        <RickrollEffect onComplete={() => onEffectComplete("rickroll")} />
      )}
      {activeEffects.has("questions") && (
        <QuestionsEffect onComplete={() => onEffectComplete("questions")} />
      )}
      {activeEffects.has("exam") && (
        <ExamEffect onComplete={() => onEffectComplete("exam")} canvasRef={canvasRef} />
      )}
      {activeEffects.has("weapons") && (
        <WeaponsEffect onComplete={() => onEffectComplete("weapons")} canvasRef={canvasRef} />
      )}
      {activeEffects.has("roulette") && (
        <RouletteEffect onComplete={() => onEffectComplete("roulette")} />
      )}
      {activeEffects.has("dvd") && <DvdEffect canvasRef={canvasRef} />}
      {activeEffects.has("siren") && <SirenEffect onComplete={() => onEffectComplete("siren")} />}
      {activeEffects.has("hiss") && <HissEffect onComplete={() => onEffectComplete("hiss")} />}
      {activeEffects.has("echo") && <EchoEffect onComplete={() => onEffectComplete("echo")} />}
      {activeEffects.has("pyhindu") && <PyhinduEffect onComplete={() => onEffectComplete("pyhindu")} />}
      {activeEffects.has("ringtone") && <RingtoneEffect onComplete={() => onEffectComplete("ringtone")} />}
      {activeEffects.has("whisper") && <WhisperEffect onComplete={() => onEffectComplete("whisper")} />}
      {activeEffects.has("glitch") && <GlitchEffect onComplete={() => onEffectComplete("glitch")} />}
      {activeEffects.has("storm") && <StormEffect onComplete={() => onEffectComplete("storm")} />}
      {activeEffects.has("zombie") && <ZombieEffect onComplete={() => onEffectComplete("zombie")} />}
      {activeEffects.has("bombs") && <BombsEffect onComplete={() => onEffectComplete("bombs")} />}
    </>
  );
}
