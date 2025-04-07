import { IReelStopAnim } from "./ReelSpinner";

class Slide implements IReelStopAnim {
    declare duration: number;
    declare elapsed: number;
    declare distance: number;
    declare position: number;

    canRunAgain(): boolean {
        return this.elapsed < this.duration;
    }

    calculate(dt: number): number {
        this.elapsed += dt;
        const progress = this.elapsed / this.duration;
        const newPosition = this.distance * progress;
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

export class ReelStopAnimPreset {
    static createSequence(): IReelAnimSequence {
        const sequence = new Sequence();
        sequence.anims = [];
        sequence.currentIndex = 0;
        return sequence;
    }

    static createSlide(duration: number, distance: number): IReelStopAnim {
        const slide = new Slide();
        slide.duration = duration;
        slide.distance = distance;
        slide.elapsed = 0;
        slide.position = 0;
        return slide;
    }
}