import {
  IsArray,
  IsOptional,
  IsString,
} from 'class-validator';

export class SaveWorkoutLogDto {
  @IsArray()
  exercises!: {
    name: string;
    weight?: number;
    reps?: number;
    notes?: string;
  }[];

  @IsOptional()
  @IsString()
  notes?: string;
}