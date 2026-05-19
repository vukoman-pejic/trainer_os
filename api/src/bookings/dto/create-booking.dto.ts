import { IsISO8601, IsString } from 'class-validator';

export class CreateBookingDto {
  @IsString()
  clientId!: string;

  @IsISO8601()
  startAt!: string;
}