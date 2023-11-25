import type { Coordinate } from '@/models/Coordinate';
export class OpenNode{
    point: Coordinate
    distance: number
    passedState: Coordinate[]
    constructor(point: Coordinate,distance: number,passedState: Coordinate[]){
        this.point = point
        this.distance = distance
        this.passedState = passedState
    }
}