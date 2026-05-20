import {
  IsEnum,
  IsString,
} from 'class-validator';
import { WorkoutType } from '@prisma/client';

export class CreateWorkoutDto {
  @IsString()
  name!: string;

  @IsEnum(WorkoutType)
  type!: WorkoutType;

  @IsString()
  content!: string;
}