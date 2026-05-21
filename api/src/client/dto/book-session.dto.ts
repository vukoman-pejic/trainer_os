import { IsISO8601 } from 'class-validator';

export class BookSessionDto {
    @IsISO8601()
    startAt!: string;
}