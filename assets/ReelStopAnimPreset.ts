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
        if (!current.canRunAgain()) {
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

// 搖晃動畫類
class Shake implements IReelStopAnim {
    declare duration: number;
    declare elapsed: number;
    declare amplitude: number;
    declare frequency: number;
    declare decay: number;
    declare position: number;

    canRunAgain(): boolean {
        return this.elapsed < this.duration;
    }

    calculate(dt: number): number {
        this.elapsed += dt;
        const progress = Math.min(this.elapsed / this.duration, 1);
        
        // 計算搖晃衰減 - 使用二次方衰減使效果更自然
        const decayFactor = Math.pow(1 - progress, 2);
        
        // 使用正弦函數創建搖晃效果，頻率隨時間減慢
        const time = this.elapsed * this.frequency * (1 - progress * 0.7); // 頻率隨時間減慢
        const amplitude = this.amplitude * decayFactor;
        
        // 計算新的位置
        let newPosition;
        if (progress >= 1) {
            // 動畫結束時，確保回到原點
            newPosition = 0;
        } else {
            newPosition = Math.sin(time * Math.PI * 2) * amplitude;
        }
        
        // 計算相對偏移量
        const offset = newPosition - this.position;
        this.position = newPosition;
        
        return offset;
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

    static createBounce(duration: number, distance: number, easing?: (t: number) => number): IReelStopAnim {
        const sequence = ReelStopAnimPreset.createSequence();
        sequence.addAnim(ReelStopAnimPreset.createSlide(duration, distance, easing));
        sequence.addAnim(ReelStopAnimPreset.createSlide(duration, -distance, easing));
        return sequence;
    }

    static createShake(config: {
        duration?: number;
        amplitude?: number;
        frequency?: number;
        decay?: number;
    } = {}): IReelStopAnim {
        const defaultConfig = {
            duration: 0.6, // 搖晃持續時間（秒）
            amplitude: 30, // 搖晃幅度
            frequency: 10, // 初始頻率（每秒搖晃次數）
            decay: 0.8, // 衰減係數（0-1之間，1表示不衰減）
        };
        
        const finalConfig = { ...defaultConfig, ...config };
        
        const shake = new Shake();
        shake.duration = finalConfig.duration;
        shake.amplitude = finalConfig.amplitude;
        shake.frequency = finalConfig.frequency;
        shake.decay = finalConfig.decay;
        shake.elapsed = 0;
        shake.position = 0;
        
        return shake;
    }
}