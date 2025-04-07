import { IReelStopAnim } from "./ReelSpinner";

class Slide implements IReelStopAnim {
    declare duration: number;
    declare elapsed: number;
    declare distance: number;
    declare position: number;
    declare easing: (t: number) => number;

    canRunAgain(): boolean {
        return this.elapsed < this.duration;
    }

    calculate(dt: number): number {
        const easing = this.easing || EasingFunctions.linear;
        this.elapsed += dt;
        const progress = this.elapsed / this.duration;
        const easedProgress = easing(progress);
        const newPosition = this.distance * easedProgress;
        const offset = newPosition - this.position;
        this.position = newPosition;
        return offset;
    }
}

export interface IReelAnimSequence extends IReelStopAnim {
    addAnim(anim: IReelStopAnim): void;
}

class Sequence implements IReelStopAnim, IReelAnimSequence {
    declare anims: IReelStopAnim[];
    declare currentIndex: number;

    canRunAgain(): boolean {
        return this.currentIndex < this.anims.length;
    }

    calculate(dt: number): number {
        const current = this.anims[this.currentIndex];
        const result = current.calculate(dt);
        if(!current.canRunAgain()){
            this.currentIndex++;
        }
        return result;
    }

    addAnim(anim: IReelStopAnim): void {
        this.anims.push(anim);
    }
}

export class EasingFunctions {
    // 線性緩動（不變）
    static linear(t: number): number {
      return t;
    }
    
    // 二次方緩入（開始慢，然後加速）
    static quadIn(t: number): number {
      return t * t;
    }
    
    // 二次方緩出（開始快，然後減速）
    static quadOut(t: number): number {
      return t * (2 - t);
    }
    
    // 二次方緩入緩出（開始慢，中間快，結束慢）
    static quadInOut(t: number): number {
      return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    }
    
    // 三次方緩入
    static cubicIn(t: number): number {
      return t * t * t;
    }
    
    // 三次方緩出
    static cubicOut(t: number): number {
      return (--t) * t * t + 1;
    }
    
    // 三次方緩入緩出
    static cubicInOut(t: number): number {
      return t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
    }
    
    // 正弦緩入
    static sineIn(t: number): number {
      return 1 - Math.cos(t * Math.PI / 2);
    }
    
    // 正弦緩出
    static sineOut(t: number): number {
      return Math.sin(t * Math.PI / 2);
    }
    
    // 正弦緩入緩出
    static sineInOut(t: number): number {
      return -(Math.cos(Math.PI * t) - 1) / 2;
    }
    
    // 彈性緩出（有彈跳效果）
    static elasticOut(t: number): number {
      if (t === 0 || t === 1) return t;
      return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * ((2 * Math.PI) / 3)) + 1;
    }
  }

export class ReelStopAnimPreset {
    static createSequence(): IReelAnimSequence {
        const sequence = new Sequence();
        sequence.anims = [];
        sequence.currentIndex = 0;
        return sequence;
    }

    static createSlide(duration: number, distance: number, easing?: (t: number) => number): IReelStopAnim {
        const slide = new Slide();
        slide.duration = duration;
        slide.distance = distance;
        slide.elapsed = 0;
        slide.position = 0;
        slide.easing = easing;
        return slide;
    }
}